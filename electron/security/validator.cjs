/**
 * validator.cjs - USB security validation flow (v2: double key + remote registry)
 *
 * Validates USB presence, fetches remote registry + key fragment from GitHub Pages,
 * combines USB key + GitHub key via HKDF, verifies HMAC signature, checks expiration
 * and tier, then decrypts protected files.
 */

const fs = require('fs');
const path = require('path');
const os = require('os');
const crypto = require('crypto');

const { findSecurityUSB, readKey, getAllDriveHashes } = require('./usb-detector.cjs');
const { decryptFile, deriveKey } = require('./encryption.cjs');

const REGISTRY_URL = 'https://auth-co.github.io/verificador-registro/registry.json';
const WORKER_URL = 'https://verificador-key.auth-service-co.workers.dev/';
const APP_TOKEN = 'b28f0ef20144037c5b582908ea65af4b';

/**
 * Run the full security validation flow (async, requires internet):
 * 1. Find a USB with VerificadorKey/llave.key (16-byte fragment)
 * 2. Fetch github key fragment (16 bytes) from GitHub Pages
 * 3. Derive full key via HKDF(usb_key + github_key)
 * 4. Fetch remote registry.json from GitHub Pages
 * 5. Verify HMAC signature of the registry
 * 6. Verify USB serial hash is in the registry
 * 7. Check expiration date
 * 8. Decrypt all .enc files
 * 9. Return status with tier info
 *
 * @param {string} encryptedScriptsDir - Directory containing .enc files
 * @returns {Promise<{ status: string, scriptsDir?: string, message?: string, tier?: string }>}
 */
async function validate(encryptedScriptsDir, tempBaseDir) {
  // Step 1: Find USB with security key file
  const usbResult = findSecurityUSB();
  if (!usbResult) {
    return {
      status: 'no_usb',
      message: 'No se detectó una llave USB con el archivo de seguridad.'
    };
  }

  console.log('USB con llave encontrada:', usbResult.drive.deviceId);

  // Step 2: Read USB key fragment (16 bytes)
  let usbKey;
  try {
    usbKey = readKey(usbResult.keyPath);
  } catch (err) {
    return {
      status: 'llave_invalida',
      message: 'La llave en la USB es inválida o está corrupta.'
    };
  }

  // Step 3: Fetch GitHub key fragment via authenticated Worker
  let githubKey;
  try {
    const driveHashes = getAllDriveHashes(usbResult.drive);
    console.log('Enviando', driveHashes.length, 'hashes al Worker...');
    let response;
    try {
      response = await fetchWithTimeout(WORKER_URL, 15000, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: APP_TOKEN, usbHashes: driveHashes })
      });
    } catch (networkErr) {
      // Network-level failure (no internet, DNS, firewall, AV blocking)
      console.error('Error de red al contactar Worker:', networkErr.message);
      return {
        status: 'sin_conexion',
        message: 'No se pudo conectar al servidor de verificación. Verifique su conexión a internet o que el antivirus no esté bloqueando la aplicación.'
      };
    }

    if (response.status === 401 || response.status === 403) {
      // Worker rechazó la USB — no es error de conexión
      console.warn('Worker rechazó la USB (HTTP', response.status, '). Hashes enviados:', driveHashes);
      return {
        status: 'usb_no_autorizada',
        message: 'La USB insertada no está registrada como autorizada para esta aplicación.'
      };
    }

    if (!response.ok) {
      console.error('Worker respondió HTTP', response.status);
      return {
        status: 'sin_conexion',
        message: `Error del servidor de verificación (HTTP ${response.status}). Intente de nuevo.`
      };
    }

    const arrayBuffer = await response.arrayBuffer();
    githubKey = Buffer.from(arrayBuffer);
    if (githubKey.length !== 16) {
      throw new Error(`Tamaño inesperado: ${githubKey.length} bytes`);
    }
  } catch (err) {
    console.error('Error obteniendo fragmento de llave:', err.message);
    return {
      status: 'sin_conexion',
      message: 'No se pudo conectar al servidor de verificación. Se requiere conexión a internet.'
    };
  }

  // Step 4: Derive full encryption key
  const fullKey = Buffer.from(deriveKey(usbKey, githubKey));
  console.log('Clave derivada de doble llave (HKDF)');

  // Step 5: Fetch remote registry
  let registry;
  try {
    const response = await fetchWithTimeout(REGISTRY_URL, 15000);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    registry = await response.json();
  } catch (err) {
    console.error('Error obteniendo registry.json:', err.message);
    return {
      status: 'sin_conexion',
      message: 'No se pudo obtener el registro de USBs autorizadas. Se requiere conexión a internet.'
    };
  }

  // Step 6: Verify HMAC signature
  if (!verifyRegistrySignature(registry, fullKey)) {
    return {
      status: 'registro_corrupto',
      message: 'El registro de USBs tiene una firma inválida. Contacte al administrador.'
    };
  }
  console.log('Firma HMAC del registro verificada');

  // Step 7: Check USB serial against registry
  // getAllDriveHashes returns hashes for: hardware serial, filesystem UUIDs, and normalized variants
  // This ensures cross-platform compatibility (Linux hardware serial vs Windows VolumeSerialNumber)
  const driveHashes = getAllDriveHashes(usbResult.drive);
  console.log('Hashes del drive:', driveHashes.length, 'variantes');

  const authorized = registry.autorizados || [];
  const matchedEntry = authorized.find(entry => {
    const entryHash = typeof entry === 'string' ? entry : entry.hash;
    return driveHashes.includes(entryHash);
  });

  if (!matchedEntry) {
    console.log('Serial no autorizado. Hashes generados:', driveHashes);
    return {
      status: 'usb_no_autorizada',
      message: 'La USB insertada no está registrada como autorizada para esta aplicación.'
    };
  }

  const entryData = typeof matchedEntry === 'string'
    ? { hash: matchedEntry, tier: 'extractor', expira: null, nombre: 'Legacy' }
    : matchedEntry;

  console.log(`USB autorizada: ${entryData.nombre || 'sin nombre'} (tier: ${entryData.tier || 'extractor'})`);

  // Step 8: Check expiration
  if (entryData.expira) {
    const expirationDate = new Date(entryData.expira);
    const now = new Date();
    if (now > expirationDate) {
      return {
        status: 'usb_expirada',
        message: `La autorización de esta USB expiró el ${entryData.expira}. Contacte al administrador para renovarla.`,
        tier: entryData.tier || 'extractor'
      };
    }
  }

  // Step 9: Decrypt all .enc files to a controlled directory
  // Usamos tempBaseDir (userData) en lugar de os.tmpdir() para que quede
  // dentro de la exclusion de Windows Defender configurada en el instalador.
  const tempSuffix = crypto.randomBytes(8).toString('hex');
  const base = tempBaseDir || os.tmpdir();
  const tempDir = path.join(base, `verificador_${tempSuffix}`);

  try {
    decryptAllFiles(encryptedScriptsDir, tempDir, fullKey);
  } catch (err) {
    cleanupTempDir(tempDir);
    console.error('Error en decryptAllFiles:', err.message);

    // Distinguir error de clave incorrecta (AES-GCM auth fail) vs error de filesystem
    const isAuthError = err.message && (
      err.message.includes('Unsupported state') ||
      err.message.includes('unable to authenticate') ||
      err.message.includes('corrupto')
    );
    const isFilesystemError = err.code && ['ENOENT', 'EACCES', 'EPERM', 'EBUSY'].includes(err.code);

    if (isFilesystemError) {
      return {
        status: 'llave_invalida',
        message: `Error de acceso al sistema de archivos (${err.code}): ${err.message}. Verifique permisos o Windows Defender.`
      };
    }
    return {
      status: 'llave_invalida',
      message: isAuthError
        ? 'Error desencriptando: la llave USB no corresponde a esta versión de la aplicación.'
        : `Error desencriptando: ${err.message}`
    };
  }

  return {
    status: 'ok',
    scriptsDir: tempDir,
    tier: entryData.tier || 'extractor'
  };
}

/**
 * Verify HMAC-SHA256 signature of the registry.
 * The signature is computed over the JSON without the "signature" field.
 * @param {object} registry - Parsed registry.json
 * @param {Buffer} key - 32-byte derived key
 * @returns {boolean}
 */
function verifyRegistrySignature(registry, key) {
  if (!registry || !registry.signature) return false;

  const receivedSig = registry.signature;
  const registryWithoutSig = { ...registry };
  delete registryWithoutSig.signature;

  const payload = JSON.stringify(registryWithoutSig);
  const expectedSig = crypto.createHmac('sha256', key).update(payload).digest('hex');

  return crypto.timingSafeEqual(
    Buffer.from(receivedSig, 'hex'),
    Buffer.from(expectedSig, 'hex')
  );
}

/**
 * Fetch with timeout using AbortController
 * @param {string} url
 * @param {number} timeoutMs
 * @returns {Promise<Response>}
 */
async function fetchWithTimeout(url, timeoutMs, options = {}) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timeout);
  }
}

/**
 * Recursively decrypt all .enc files from srcDir to destDir,
 * preserving directory structure.
 * @param {string} srcDir - Source directory with .enc files
 * @param {string} destDir - Destination for decrypted files
 * @param {Buffer} key - 32-byte decryption key
 */
function decryptAllFiles(srcDir, destDir, key) {
  if (!fs.existsSync(srcDir)) {
    throw new Error(`Directorio de scripts encriptados no existe: ${srcDir}`);
  }

  if (!fs.existsSync(destDir)) {
    fs.mkdirSync(destDir, { recursive: true });
  }

  const entries = fs.readdirSync(srcDir, { withFileTypes: true });

  for (const entry of entries) {
    const srcPath = path.join(srcDir, entry.name);
    const destPath = path.join(destDir, entry.name);

    if (entry.isDirectory()) {
      decryptAllFiles(srcPath, destPath, key);
    } else if (entry.name.endsWith('.enc')) {
      const originalName = entry.name.slice(0, -4);
      const outputPath = path.join(destDir, originalName);
      decryptFile(srcPath, outputPath, key);
    }
  }
}

/**
 * Safely delete a temporary directory created by the validator.
 * Only deletes directories inside os.tmpdir() that start with 'verificador_'
 * @param {string} dirPath - Path to temporary directory
 */
function cleanupTempDir(dirPath) {
  if (!dirPath) return;

  const tmpBase = os.tmpdir();
  const dirName = path.basename(dirPath);

  // Permitir tanto %TEMP% como subdirectorios de userData (ej: %APPDATA%\Verificador Electoral)
  const isInTmp = dirPath.startsWith(tmpBase);
  const isInUserData = dirName.startsWith('verificador_') && !dirPath.startsWith(tmpBase);

  if (!isInTmp && !isInUserData) {
    console.error('cleanupTempDir: refusing to delete outside allowed dirs:', dirPath);
    return;
  }
  if (!dirName.startsWith('verificador_')) {
    console.error('cleanupTempDir: refusing to delete non-verificador dir:', dirPath);
    return;
  }

  try {
    fs.rmSync(dirPath, { recursive: true, force: true });
    console.log('Carpeta temporal de seguridad eliminada:', dirPath);
  } catch (err) {
    console.error('Error eliminando carpeta temporal:', err.message);
  }
}

module.exports = { validate, cleanupTempDir, decryptAllFiles, verifyRegistrySignature };
