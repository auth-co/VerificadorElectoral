#!/usr/bin/env node
/**
 * tools/publicar-version.cjs
 * Script de publicación 100% confiable para Verificador Electoral.
 *
 * Uso:
 *   npm run release             → bump patch (1.0.24 → 1.0.25)
 *   npm run release -- --minor  → bump minor (1.0.24 → 1.1.0)
 *   npm run release -- --major  → bump major (1.0.24 → 2.0.0)
 *
 * El script valida cada paso y falla rápido antes de publicar nada.
 */

'use strict';

const { execSync } = require('child_process');
const fs   = require('fs');
const path = require('path');
const crypto = require('crypto');

const ROOT = path.join(__dirname, '..');

// ─── Helpers ─────────────────────────────────────────────────────────────────

function run(cmd, opts = {}) {
  console.log(`  $ ${cmd}`);
  execSync(cmd, { cwd: ROOT, stdio: 'inherit', ...opts });
}

function capture(cmd) {
  return execSync(cmd, { cwd: ROOT, encoding: 'utf8' }).trim();
}

function step(n, title) {
  console.log(`\n[${n}] ${title}`);
  console.log('─'.repeat(50));
}

function ok(msg)   { console.log(`  ✓ ${msg}`); }
function warn(msg) { console.log(`  ⚠ ${msg}`); }
function fail(msg) {
  console.error(`\n  ✗ ERROR: ${msg}\n`);
  process.exit(1);
}

function sha512b64(filePath) {
  const buf = fs.readFileSync(filePath);
  return crypto.createHash('sha512').update(buf).digest('base64');
}

function bumpVersion(v, tipo) {
  const [maj, min, pat] = v.split('.').map(Number);
  if (tipo === 'major') return `${maj + 1}.0.0`;
  if (tipo === 'minor') return `${maj}.${min + 1}.0`;
  return `${maj}.${min}.${pat + 1}`;
}

// ─── Main ────────────────────────────────────────────────────────────────────

console.log('\n╔══════════════════════════════════════════════╗');
console.log('║  PUBLICAR VERSIÓN — Verificador Electoral    ║');
console.log('╚══════════════════════════════════════════════╝');

const tipoArg = (process.argv[2] || '--patch').replace('--', '');
if (!['patch', 'minor', 'major'].includes(tipoArg)) {
  fail(`Argumento inválido: "${tipoArg}". Usa --patch, --minor o --major.`);
}

// ─── PASO 1: Prerequisitos ───────────────────────────────────────────────────
step(1, 'Verificando prerequisitos');

// gh CLI autenticado
try {
  capture('gh auth token');
  ok('gh CLI autenticado');
} catch {
  fail('gh CLI no está autenticado. Ejecuta: gh auth login');
}

// git limpio (solo advertir, no bloquear — el script hará su propio commit)
const gitDirty = capture('git status --porcelain');
if (gitDirty) {
  warn('Hay cambios sin commitear. Se incluirán en el commit de release.');
  console.log(gitDirty.split('\n').map(l => `    ${l}`).join('\n'));
}

// Verificar rama main
const branch = capture('git rev-parse --abbrev-ref HEAD');
if (branch !== 'main') {
  fail(`Estás en la rama "${branch}". Cambia a main antes de publicar.`);
}
ok(`Rama: ${branch}`);

// ─── PASO 2: Bump de versión ─────────────────────────────────────────────────
step(2, `Actualizando versión (${tipoArg})`);

const pkgPath = path.join(ROOT, 'package.json');
const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
const vOld = pkg.version;
const vNew = bumpVersion(vOld, tipoArg);
const tag  = `v${vNew}`;

// Verificar que la release no existe ya en GitHub
try {
  capture(`gh api repos/danielm0101/VerificadorElectoral/releases/tags/${tag} --jq '.tag_name'`);
  fail(`La release ${tag} ya existe en GitHub. Elige una versión diferente.`);
} catch (e) {
  if (e.message.includes('ya existe')) throw e; // re-lanzar el fail()
  // 404 = no existe → OK
}

pkg.version = vNew;
fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\n');
ok(`Versión: ${vOld} → ${vNew}`);

// ─── PASO 3: Encriptar scripts R ─────────────────────────────────────────────
step(3, 'Encriptando scripts R (por si hubo cambios)');
run('npm run security:encrypt');

// ─── PASO 4: Build ───────────────────────────────────────────────────────────
step(4, 'Construyendo instalador Windows');
run('npm run electron:build -- --win');

// ─── PASO 5: Verificar artefactos ────────────────────────────────────────────
step(5, 'Verificando artefactos generados');

const distDir    = path.join(ROOT, 'dist-electron');
const exeName    = `Verificador-Electoral-Setup-${vNew}.exe`;
const exePath    = path.join(distDir, exeName);
const bmapPath   = exePath + '.blockmap';

if (!fs.existsSync(exePath))  fail(`No se encontró el .exe: ${exePath}`);
if (!fs.existsSync(bmapPath)) fail(`No se encontró el .blockmap: ${bmapPath}`);

const exeSizeMB = (fs.statSync(exePath).size / 1024 / 1024).toFixed(1);
ok(`${exeName} (${exeSizeMB} MB)`);
ok(`${exeName}.blockmap`);

// ─── PASO 6: Generar latest.yml ──────────────────────────────────────────────
step(6, 'Generando latest.yml con SHA512 correcto');

const sha512    = sha512b64(exePath);
const exeSize   = fs.statSync(exePath).size;
const releaseTs = new Date().toISOString();

const latestYml = [
  `version: ${vNew}`,
  `files:`,
  `  - url: ${exeName}`,
  `    sha512: ${sha512}`,
  `    size: ${exeSize}`,
  `path: ${exeName}`,
  `sha512: ${sha512}`,
  `releaseDate: '${releaseTs}'`,
  ''
].join('\n');

const latestYmlPath = path.join(distDir, 'latest.yml');
fs.writeFileSync(latestYmlPath, latestYml);

ok(`SHA512: ${sha512.substring(0, 28)}...`);
ok(`Tamaño: ${exeSize} bytes`);
ok(`Fecha:  ${releaseTs}`);

// Doble verificación: re-calcular y comparar
const sha512Check = sha512b64(exePath);
if (sha512Check !== sha512) fail('SHA512 inconsistente — no se puede publicar con datos incorrectos.');
ok('SHA512 verificado (doble cálculo consistente)');

// ─── PASO 7: Git commit + push ────────────────────────────────────────────────
step(7, 'Commiteando y haciendo push a GitHub');

// Agregar todos los cambios tracked + package.json
run('git add -u');
run('git add package.json');
run(`git commit -m "v${vNew}: Release"`);
run('git push origin main');
ok(`Commit v${vNew} pusheado a origin/main`);

// ─── PASO 8: Crear release en GitHub ─────────────────────────────────────────
step(8, `Creando release ${tag} en GitHub`);

// Subir en orden: .exe primero, luego .blockmap, latest.yml al final
// (latest.yml al final porque los clientes lo descargan para saber qué .exe buscar)
const releaseNotes = `## Verificador Electoral ${tag}

Release ${new Date().toLocaleDateString('es-CO')}.
`;

run([
  `gh release create ${tag}`,
  `"${exePath}"`,
  `"${bmapPath}"`,
  `"${latestYmlPath}"`,
  `--title "${tag}"`,
  `--notes "${releaseNotes.replace(/"/g, '\\"').replace(/\n/g, '\\n')}"`
].join(' '));

ok(`Release ${tag} creada`);

// ─── PASO 9: Verificar assets en GitHub ──────────────────────────────────────
step(9, 'Verificando assets publicados en GitHub');

// Esperar un momento para que GitHub procese los uploads
execSync('sleep 3');

const assetsRaw = capture(
  `gh api repos/danielm0101/VerificadorElectoral/releases/tags/${tag} --jq '[.assets[] | {name: .name, size: .size}]'`
);
const assets = JSON.parse(assetsRaw);
const assetMap = Object.fromEntries(assets.map(a => [a.name, a.size]));

// Verificar .exe
if (!assetMap[exeName]) fail(`Asset no encontrado en GitHub: ${exeName}`);
if (assetMap[exeName] !== exeSize) {
  fail(`Tamaño incorrecto para ${exeName}: GitHub=${assetMap[exeName]} vs local=${exeSize}`);
}
ok(`${exeName} (${assetMap[exeName]} bytes) ✓`);

// Verificar .blockmap
if (!assetMap[exeName + '.blockmap']) fail(`Asset no encontrado: ${exeName}.blockmap`);
ok(`${exeName}.blockmap ✓`);

// Verificar latest.yml
if (!assetMap['latest.yml']) fail('latest.yml no encontrado en la release');
ok(`latest.yml (${assetMap['latest.yml']} bytes) ✓`);

// ─── PASO 10: Verificar latest.yml descargable ───────────────────────────────
step(10, 'Verificando latest.yml descargable desde GitHub');

try {
  const latestUrl = `https://github.com/danielm0101/VerificadorElectoral/releases/download/${tag}/latest.yml`;
  const contenido = capture(`curl -fsSL "${latestUrl}"`);

  if (!contenido.includes(`version: ${vNew}`)) {
    fail(`latest.yml en GitHub NO contiene "version: ${vNew}"`);
  }
  if (!contenido.includes(sha512.substring(0, 20))) {
    fail('latest.yml en GitHub tiene SHA512 diferente al calculado');
  }
  ok(`latest.yml accesible y contiene versión ${vNew} correcta`);
} catch (e) {
  if (e.message.includes('NO contiene') || e.message.includes('SHA512')) throw e;
  warn('No se pudo descargar latest.yml para verificación (puede tardar unos segundos en estar disponible)');
}

// ─── FIN ─────────────────────────────────────────────────────────────────────

console.log('\n╔══════════════════════════════════════════════╗');
console.log(`║  ✅ v${vNew} publicada correctamente          `);
console.log('╚══════════════════════════════════════════════╝');
console.log(`
  Release:  https://github.com/danielm0101/VerificadorElectoral/releases/tag/${tag}
  .exe:     ${exeName} (${exeSizeMB} MB)
  SHA512:   ${sha512.substring(0, 44)}...

  Las apps en v${vOld} recibirán la notificación en ~3 segundos al abrir.
`);