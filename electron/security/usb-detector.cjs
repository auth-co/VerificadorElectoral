/**
 * usb-detector.cjs - Detect removable USB drives and read security keys
 * Supports both Windows (PowerShell/wmic) and Linux (lsblk).
 * On Linux, also captures filesystem UUIDs for cross-platform serial matching.
 */

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const KEY_FOLDER = 'VerificadorKey';
const KEY_FILE = 'llave.key';
const KEY_SIZE = 16; // 128 bits (USB fragment; combined with GitHub fragment via HKDF for 256-bit key)

/**
 * Get all removable drives on Windows.
 *
 * Strategy (ordered by AV-friendliness):
 * 1. vol scan (CMD built-in, no child processes with suspicious flags)
 * 2. wmic fallback (if vol finds nothing — legacy Windows 10)
 * 3. PowerShell last resort (only if both above fail)
 *
 * PowerShell is intentionally deprioritized: spawning powershell.exe triggers
 * behavior-monitoring heuristics in enterprise AV (Trend Micro Apex One, etc.).
 * The vol scan is sufficient for our use case since we only need drives that
 * already contain the security key file.
 *
 * @returns {{ deviceId: string, serial: string, extraSerials: string[] }[]}
 */
function getRemovableDrivesWindows() {
  // Primary: scan drive letters using CMD vol (no PowerShell, no WMI)
  try {
    const drives = getRemovableDrivesScan();
    if (drives.length > 0) return drives;
  } catch (err) {
    console.warn('Vol scan fallido, intentando wmic:', err.message);
  }

  // Fallback: wmic (works on Windows 10 without PowerShell)
  try {
    const drives = getRemovableDrivesWmic();
    if (drives.length > 0) return drives;
  } catch (err) {
    console.warn('wmic deteccion fallida, intentando PowerShell:', err.message);
  }

  // Last resort: PowerShell Get-CimInstance (Windows 10/11, may trigger AV heuristics)
  try {
    const drives = getRemovableDrivesPS();
    if (drives.length > 0) return drives;
  } catch (err) {
    console.warn('PowerShell deteccion fallida:', err.message);
  }

  return [];
}

/**
 * Detect removable drives via PowerShell Get-CimInstance (modern, Windows 10/11)
 * @returns {{ deviceId: string, serial: string, extraSerials: string[] }[]}
 */
function getRemovableDrivesPS() {
  const psCmd = `powershell -NoProfile -NonInteractive -Command "Get-CimInstance Win32_LogicalDisk -Filter 'DriveType=2' | Select-Object DeviceID,VolumeSerialNumber | ConvertTo-Json -Compress"`;
  const output = execSync(psCmd, { encoding: 'utf8', timeout: 15000 }).trim();

  if (!output || output === '') return [];

  let parsed = JSON.parse(output);
  // PowerShell returns a single object (not array) when there's only one drive
  if (!Array.isArray(parsed)) parsed = [parsed];

  const drives = [];
  for (const disk of parsed) {
    const deviceId = (disk.DeviceID || '').trim();
    const serial = (disk.VolumeSerialNumber || '').trim();
    if (deviceId && serial) {
      drives.push({ deviceId, serial, extraSerials: [] });
    }
  }
  return drives;
}

/**
 * Detect removable drives via wmic (legacy fallback, deprecated on Windows 11)
 * @returns {{ deviceId: string, serial: string, extraSerials: string[] }[]}
 */
function getRemovableDrivesWmic() {
  const output = execSync(
    'wmic logicaldisk where DriveType=2 get DeviceID,VolumeSerialNumber /format:csv',
    { encoding: 'utf8', timeout: 10000 }
  );

  // Strip BOM and normalize line endings (wmic can output \r\n and BOM on some locales)
  const clean = output.replace(/^\uFEFF/, '').replace(/\r\n/g, '\n');
  const lines = clean.trim().split('\n').filter(l => l.trim());
  const drives = [];
  for (let i = 1; i < lines.length; i++) {
    const parts = lines[i].trim().split(',');
    if (parts.length >= 3) {
      const deviceId = parts[1].trim();
      const serial = parts[2].trim();
      if (deviceId && serial) {
        drives.push({ deviceId, serial, extraSerials: [] });
      }
    }
  }
  return drives;
}

/**
 * Last-resort fallback: scan all drive letters (A-Z) and use the built-in
 * `vol` command to get the volume serial number.
 * Works on ALL Windows versions without PowerShell or WMI.
 * Only returns drives where the security key file is accessible.
 * @returns {{ deviceId: string, serial: string, extraSerials: string[] }[]}
 */
function getRemovableDrivesScan() {
  const drives = [];
  for (let code = 65; code <= 90; code++) {
    const letter = String.fromCharCode(code);
    const deviceId = letter + ':';
    const root = letter + ':\\';
    try {
      if (!fs.existsSync(root)) continue;

      // Only include drives that have the key file to avoid scanning all fixed disks
      const keyPath = path.join(deviceId, KEY_FOLDER, KEY_FILE);
      if (!fs.existsSync(keyPath)) continue;

      // vol X: is a built-in CMD command, always available on Windows
      let serial = '';
      try {
        const volOut = execSync(`vol ${deviceId}`, { encoding: 'utf8', timeout: 3000 });
        const m = volOut.match(/[Ss]erial [Nn]umber is ([0-9A-Fa-f-]+)/);
        if (m) serial = m[1].replace(/-/g, '').toUpperCase();
      } catch (_) {}

      drives.push({ deviceId, serial, extraSerials: [] });
    } catch (_) {}
  }
  return drives;
}

/**
 * Try to auto-mount an unmounted partition using udisksctl
 * @param {string} partName - e.g. "sdb1"
 * @returns {string|null} mount point if successful
 */
function tryMount(partName) {
  try {
    const result = execSync(`udisksctl mount -b /dev/${partName} 2>&1`, {
      encoding: 'utf8',
      timeout: 10000
    });
    // Output: "Mounted /dev/sdb1 at /run/media/user/LABEL"
    const match = result.match(/at (.+?)\.?\s*$/);
    return match ? match[1].trim() : null;
  } catch (err) {
    return null;
  }
}

/**
 * Get all removable USB drives on Linux via lsblk (JSON output).
 * Automatically mounts unmounted partitions.
 * Also captures filesystem UUIDs for cross-platform compatibility.
 * @returns {{ deviceId: string, serial: string, extraSerials: string[] }[]}
 */
function getRemovableDrivesLinux() {
  const output = execSync(
    'lsblk -Jno NAME,SERIAL,RM,MOUNTPOINT,TYPE,UUID 2>/dev/null || echo "{}"',
    { encoding: 'utf8', timeout: 10000 }
  );

  const data = JSON.parse(output);
  if (!data.blockdevices) return [];

  const drives = [];

  for (const dev of data.blockdevices) {
    // Only removable disks with a serial
    if (dev.type !== 'disk' || !dev.rm || !dev.serial) continue;

    // Check if the disk itself is mounted (no partitions)
    if (dev.mountpoint) {
      const extraSerials = dev.uuid ? [dev.uuid] : [];
      drives.push({ deviceId: dev.mountpoint, serial: dev.serial, extraSerials: [...extraSerials] });
    }

    // Check partitions (children) — each partition gets its OWN UUID only
    if (dev.children) {
      for (const child of dev.children) {
        let mountpoint = child.mountpoint;

        // Each partition gets a fresh array with only its own UUID
        const extraSerials = child.uuid ? [child.uuid] : [];

        // If partition is not mounted, try to mount it
        if (!mountpoint) {
          console.log(`USB particion ${child.name} no montada, intentando montar...`);
          mountpoint = tryMount(child.name);
          if (mountpoint) {
            console.log(`Montada en: ${mountpoint}`);
          }
        }

        if (mountpoint) {
          drives.push({ deviceId: mountpoint, serial: dev.serial, extraSerials: [...extraSerials] });
        }
      }
    }

    // Disk with no partitions and not mounted — try mounting directly
    if (!dev.children && !dev.mountpoint) {
      const extraSerials = dev.uuid ? [dev.uuid] : [];
      const mountpoint = tryMount(dev.name);
      if (mountpoint) {
        drives.push({ deviceId: mountpoint, serial: dev.serial, extraSerials: [...extraSerials] });
      }
    }
  }

  return drives;
}

/**
 * Get all removable drives (cross-platform)
 * @returns {{ deviceId: string, serial: string, extraSerials: string[] }[]}
 */
function getRemovableDrives() {
  try {
    if (process.platform === 'win32') {
      return getRemovableDrivesWindows();
    } else {
      return getRemovableDrivesLinux();
    }
  } catch (err) {
    console.error('Error detecting USB drives:', err.message);
    return [];
  }
}

/**
 * Hash a volume serial number with SHA-256
 * @param {string} serial - Volume serial number
 * @returns {string} Hex-encoded SHA-256 hash
 */
function hashSerial(serial) {
  return crypto.createHash('sha256').update(serial.toUpperCase()).digest('hex');
}

/**
 * Get all possible hashes for a drive (primary serial + extraSerials + normalized variants)
 * This helps cross-platform matching between Linux filesystem UUIDs and Windows VolumeSerialNumbers.
 * @param {{ serial: string, extraSerials?: string[] }} drive
 * @returns {string[]} Array of unique SHA-256 hashes
 */
function getAllDriveHashes(drive) {
  const serials = new Set();
  let deviceId = null;
  const fsUUIDs = [];

  // Separate device-id (32 hex chars = randomBytes(16)) from filesystem UUIDs in extraSerials
  if (drive.extraSerials) {
    for (const extra of drive.extraSerials) {
      if (!extra) continue;
      const upper = extra.toUpperCase();
      if (/^[0-9A-F]{32}$/.test(upper)) {
        deviceId = upper; // Generated device-id written during registration
      } else {
        // Filesystem UUID
        const noDash = upper.replace(/-/g, '');
        fsUUIDs.push(noDash);
        serials.add(upper);
        if (noDash !== upper) serials.add(noDash);
        // For NTFS UUIDs (16 hex chars), also try first/second 8 chars
        if (/^[0-9A-F]{16}$/.test(noDash)) {
          serials.add(noDash.substring(0, 8));
          serials.add(noDash.substring(8, 16));
        }
      }
    }
  }

  if (deviceId) {
    // Double-factor: SHA256(device-id:uuid). On Windows, drive.serial IS the VolumeSerialNumber.
    const uuidSources = fsUUIDs.length > 0 ? fsUUIDs
      : (drive.serial ? [drive.serial.toUpperCase().replace(/-/g, '')] : []);
    for (const uuid of uuidSources) {
      if (uuid) serials.add(deviceId + ':' + uuid);
    }
  } else if (drive.serial) {
    // No device-id: legacy single-factor (Windows VolumeSerialNumber or old registration)
    const hasUUIDs = fsUUIDs.length > 0;
    if (!hasUUIDs) serials.add(drive.serial.toUpperCase());
  }

  // Hash all unique serial variants
  const hashes = new Set();
  for (const s of serials) {
    hashes.add(hashSerial(s));
  }
  return Array.from(hashes);
}

/**
 * Scan all removable drives for one containing VerificadorKey/llave.key (16 bytes)
 * @returns {{ drive: { deviceId: string, serial: string, extraSerials: string[] }, keyPath: string } | null}
 */
function findSecurityUSB() {
  const drives = getRemovableDrives();
  console.log('USBs detectadas:', drives.length, drives.map(d => d.deviceId + ' [' + d.serial + ']').join(', '));

  for (const drive of drives) {
    const keyPath = path.join(drive.deviceId, KEY_FOLDER, KEY_FILE);
    try {
      if (fs.existsSync(keyPath)) {
        const stat = fs.statSync(keyPath);
        if (stat.size === KEY_SIZE) {
          // Read device-id.txt if present — guaranteed-unique ID written during registration
          const deviceIdPath = path.join(drive.deviceId, KEY_FOLDER, 'device-id.txt');
          if (fs.existsSync(deviceIdPath)) {
            const fileDeviceId = fs.readFileSync(deviceIdPath, 'utf8').trim();
            if (fileDeviceId) drive.extraSerials.unshift(fileDeviceId);
          }
          return { drive, keyPath };
        }
      }
    } catch (err) {
      // Permission error or drive not accessible, skip
    }
  }

  return null;
}

/**
 * Read the 16-byte USB key fragment from a key file
 * @param {string} keyPath - Absolute path to llave.key
 * @returns {Buffer} 16-byte key fragment
 */
function readKey(keyPath) {
  const key = fs.readFileSync(keyPath);
  if (key.length !== KEY_SIZE) {
    throw new Error(`Llave invalida: esperaba ${KEY_SIZE} bytes, tiene ${key.length}`);
  }
  return key;
}

module.exports = {
  getRemovableDrives,
  hashSerial,
  getAllDriveHashes,
  findSecurityUSB,
  readKey,
  KEY_FOLDER,
  KEY_FILE,
  KEY_SIZE
};
