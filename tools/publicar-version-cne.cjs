#!/usr/bin/env node
/**
 * tools/publicar-version-cne.cjs
 * Publica la versión CNE en auth-co/VerificadorElectoralCNE.
 * Siempre usa la misma versión que el privado (package.json).
 *
 * Uso: node tools/publicar-version-cne.cjs
 */

'use strict';

const { execSync } = require('child_process');
const fs   = require('fs');
const path = require('path');
const crypto = require('crypto');

const ROOT = path.join(__dirname, '..');

function run(cmd) {
  console.log(`  $ ${cmd}`);
  execSync(cmd, { cwd: ROOT, stdio: 'inherit' });
}

function capture(cmd) {
  return execSync(cmd, { cwd: ROOT, encoding: 'utf8' }).trim();
}

function step(n, title) {
  console.log(`\n[${n}] ${title}`);
  console.log('─'.repeat(50));
}

function ok(msg)   { console.log(`  ✓ ${msg}`); }
function fail(msg) { console.error(`\n  ✗ ERROR: ${msg}\n`); process.exit(1); }

function sha512b64(filePath) {
  return crypto.createHash('sha512').update(fs.readFileSync(filePath)).digest('base64');
}

console.log('\n╔══════════════════════════════════════════════╗');
console.log('║  PUBLICAR VERSIÓN CNE — Verificador Electoral ║');
console.log('╚══════════════════════════════════════════════╝');

// ─── PASO 1: Prerequisitos ───────────────────────────────────────────────────
step(1, 'Verificando prerequisitos');

try { capture('gh auth token'); ok('gh CLI autenticado'); }
catch { fail('gh CLI no autenticado. Ejecuta: gh auth login'); }

const pkg     = JSON.parse(fs.readFileSync(path.join(ROOT, 'package.json'), 'utf8'));
const version = pkg.version;
const tag     = `v${version}`;
ok(`Versión: ${version}`);

// Verificar que existe la release privada para esta versión
try {
  capture(`gh api repos/auth-co/VerificadorElectoral/releases/tags/${tag} --jq '.tag_name'`);
  ok(`Release privada ${tag} existe`);
} catch {
  fail(`No existe la release privada ${tag}. Ejecuta primero: npm run release`);
}

// Verificar que NO existe ya la release CNE
try {
  capture(`gh api repos/auth-co/VerificadorElectoralCNE/releases/tags/${tag} --jq '.tag_name'`);
  fail(`La release CNE ${tag} ya existe. Elimínala primero si quieres reemplazarla.`);
} catch (e) {
  if (e.message.includes('ya existe')) throw e;
  ok(`Release CNE ${tag} no existe aún — OK`);
}

// Verificar archivos CNE locales
const requiredFiles = [
  'build/installer-cne.nsh',
  '.env.cne',
];
for (const f of requiredFiles) {
  if (!fs.existsSync(path.join(ROOT, f))) fail(`Archivo requerido no encontrado: ${f}`);
  ok(`${f} presente`);
}

// ─── PASO 2: Build CNE ───────────────────────────────────────────────────────
step(2, 'Construyendo instalador CNE');

run([
  'npx vite build --mode cne &&',
  'npx electron-builder --win',
  '--config.productName="Verificador Electoral CNE"',
  '--config.appId="com.verificador.electoral.cne"',
  `--config.extraMetadata.name="verificador-electoral-cne"`,
  '--config.nsis.artifactName="Verificador-CNE-Setup-${version}.exe"',
  '--config.nsis.include="build/installer-cne.nsh"',
  '--config.nsis.shortcutName="Verificador Electoral CNE"',
  '--config.publish.repo="VerificadorElectoralCNE"',
].join(' '));

// ─── PASO 3: Verificar artefactos ────────────────────────────────────────────
step(3, 'Verificando artefactos generados');

const distDir  = path.join(ROOT, 'dist-electron');
const exeName  = `Verificador-CNE-Setup-${version}.exe`;
const exePath  = path.join(distDir, exeName);
const bmapPath = exePath + '.blockmap';

if (!fs.existsSync(exePath))  fail(`No se encontró: ${exePath}`);
if (!fs.existsSync(bmapPath)) fail(`No se encontró: ${bmapPath}`);

const sizeMB = (fs.statSync(exePath).size / 1024 / 1024).toFixed(1);
ok(`${exeName} (${sizeMB} MB)`);
ok(`${exeName}.blockmap`);

// Verificar app-update.yml apunta al repo correcto
const appUpdatePath = path.join(distDir, 'win-unpacked', 'resources', 'app-update.yml');
if (fs.existsSync(appUpdatePath)) {
  const appUpdate = fs.readFileSync(appUpdatePath, 'utf8');
  if (!appUpdate.includes('VerificadorElectoralCNE')) {
    fail('app-update.yml no apunta a VerificadorElectoralCNE');
  }
  ok('app-update.yml → VerificadorElectoralCNE ✓');
}

// ─── PASO 4: Generar latest.yml ──────────────────────────────────────────────
step(4, 'Generando latest.yml');

const sha512    = sha512b64(exePath);
const exeSize   = fs.statSync(exePath).size;
const releaseTs = new Date().toISOString();

const latestYml = [
  `version: ${version}`,
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

// ─── PASO 5: Crear release en GitHub CNE ─────────────────────────────────────
step(5, `Creando release ${tag} en VerificadorElectoralCNE`);

const notes = `## Verificador Electoral CNE ${tag}\n\nRelease ${new Date().toLocaleDateString('es-CO')}.\n`;

run([
  `gh release create ${tag}`,
  `"${exePath}"`,
  `"${bmapPath}"`,
  `"${latestYmlPath}"`,
  `--repo auth-co/VerificadorElectoralCNE`,
  `--title "${tag}"`,
  `--notes "${notes.replace(/"/g, '\\"').replace(/\n/g, '\\n')}"`
].join(' '));

ok(`Release CNE ${tag} creada`);

// ─── FIN ─────────────────────────────────────────────────────────────────────
console.log('\n╔══════════════════════════════════════════════╗');
console.log(`║  ✅ CNE ${tag} publicada correctamente       `);
console.log('╚══════════════════════════════════════════════╝');
console.log(`
  Release: https://github.com/auth-co/VerificadorElectoralCNE/releases/tag/${tag}
  .exe:    ${exeName} (${sizeMB} MB)
  SHA512:  ${sha512.substring(0, 44)}...
`);
