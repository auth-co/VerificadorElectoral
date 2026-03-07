import { google } from 'googleapis';
import * as fs from 'fs';
import * as path from 'path';
import { divipoleData, citrepData, getCodigoDepartamento, getCodigoMunicipio } from '../src/divipoleData';

const config = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'drive-config.json'), 'utf8'));
const TIPOS_DIVIPOLE = ['Senado', 'Camara', 'Consulta'];
const CHECKPOINT_FILE = path.join(process.cwd(), 'tools', 'drive-checkpoint.json');

const auth = new google.auth.GoogleAuth({
  credentials: config.serviceAccountKey,
  scopes: ['https://www.googleapis.com/auth/drive'],
});

// Cache de IDs: "parentId/name" → folderId
const cache = new Map<string, string>();

// Checkpoint: guarda el último tipo+depto completado
interface Checkpoint {
  tipo: string;
  depto: string;
  total: number;
}

function loadCheckpoint(): Checkpoint | null {
  try {
    return JSON.parse(fs.readFileSync(CHECKPOINT_FILE, 'utf8'));
  } catch { return null; }
}

function saveCheckpoint(cp: Checkpoint) {
  fs.writeFileSync(CHECKPOINT_FILE, JSON.stringify(cp, null, 2));
}

function clearCheckpoint() {
  try { fs.unlinkSync(CHECKPOINT_FILE); } catch {}
}

async function retry<T>(fn: () => Promise<T>, retries = 5, delay = 3000): Promise<T> {
  for (let i = 0; i < retries; i++) {
    try { return await fn(); }
    catch (e: any) {
      if (i === retries - 1) throw e;
      process.stdout.write(`\n  [red, reintento ${i + 1}/${retries}: ${e.message?.slice(0, 60)}]`);
      await new Promise(r => setTimeout(r, delay * (i + 1)));
    }
  }
  throw new Error('unreachable');
}

async function getOrCreate(drive: any, parentId: string, name: string): Promise<string> {
  const key = `${parentId}/${name}`;
  if (cache.has(key)) return cache.get(key)!;

  const res = await retry(() => drive.files.list({
    q: `'${parentId}' in parents and name = '${name.replace(/'/g, "\\'")}' and mimeType = 'application/vnd.google-apps.folder' and trashed = false`,
    fields: 'files(id)',
    pageSize: 1,
  }));

  let id: string;
  if (res.data.files?.length) {
    id = res.data.files[0].id;
  } else {
    const created = await retry(() => drive.files.create({
      requestBody: { name, mimeType: 'application/vnd.google-apps.folder', parents: [parentId] },
      fields: 'id',
    }));
    id = created.data.id;
  }
  cache.set(key, id);
  return id;
}

async function main() {
  const client = await auth.getClient();
  const drive = google.drive({ version: 'v3', auth: client });
  const rootId = config.rootFolderId;

  const cp = loadCheckpoint();
  let total = cp?.total ?? 0;
  let skipUntilTipo = cp?.tipo ?? null;
  let skipUntilDepto = cp?.depto ?? null;
  const start = Date.now() - total * 220; // estimado para mantener rate
  const rate = () => (total / Math.max(1, (Date.now() - start) / 1000)).toFixed(1);

  if (cp) {
    console.log(`Reanudando desde checkpoint: ${cp.tipo} / ${cp.depto} (${cp.total} carpetas previas)\n`);
  } else {
    console.log(`Inicio fresco.\n`);
  }

  // === Senado, Camara, Consulta → divipoleData ===
  const deptos = Object.entries(divipoleData);

  for (const tipo of TIPOS_DIVIPOLE) {
    // Saltar tipos ya completados
    if (skipUntilTipo && tipo !== skipUntilTipo && TIPOS_DIVIPOLE.indexOf(tipo) < TIPOS_DIVIPOLE.indexOf(skipUntilTipo)) {
      console.log(`Saltando ${tipo} (ya completado)`);
      continue;
    }

    console.log(`\n=== ${tipo} ===`);
    const tipoId = await getOrCreate(drive, rootId, tipo);

    for (const [depNombre, depData] of deptos) {
      // Saltar deptos ya completados dentro del tipo de checkpoint
      if (skipUntilTipo === tipo && skipUntilDepto) {
        const deptos_nombres = deptos.map(([n]) => n);
        const idxActual = deptos_nombres.indexOf(depNombre);
        const idxCheckpoint = deptos_nombres.indexOf(skipUntilDepto);
        if (idxActual <= idxCheckpoint) {
          process.stdout.write(`\r  Saltando ${depNombre}...`);
          continue;
        } else {
          // Ya superamos el checkpoint, seguir normal
          skipUntilTipo = null;
          skipUntilDepto = null;
        }
      }

      const depFolder = `${depData.codigo} - ${depNombre}`;
      const depId = await getOrCreate(drive, tipoId, depFolder);

      for (const [munNombre, munData] of Object.entries(depData.municipios)) {
        const munFolder = `${munData.codigo} - ${munNombre}`;
        const munId = await getOrCreate(drive, depId, munFolder);
        for (const zona of munData.zonas) {
          await getOrCreate(drive, munId, zona.nombre);
          total++;
        }
      }

      saveCheckpoint({ tipo, depto: depNombre, total });
      process.stdout.write(`\r  ${tipo} / ${depFolder}: ${total} carpetas (${rate()}/s)   `);
    }
  }

  // === CITREP → citrepData (estructura: CITREP / CIRCUNSCRIPCION N / dep / mun / zona) ===
  const CITREP_TIPO = 'CITREP';
  if (skipUntilTipo && skipUntilTipo !== CITREP_TIPO) {
    skipUntilTipo = null;
    skipUntilDepto = null;
  }

  console.log(`\n\n=== CITREP ===`);
  const citrepId = await getOrCreate(drive, rootId, CITREP_TIPO);
  const circunscripciones = Object.entries(citrepData);

  for (const [circNombre, circData] of circunscripciones) {
    // skipUntilDepto en CITREP usa el nombre de la circunscripción como clave de progreso
    if (skipUntilTipo === CITREP_TIPO && skipUntilDepto) {
      const keys = circunscripciones.map(([n]) => n);
      if (keys.indexOf(circNombre) <= keys.indexOf(skipUntilDepto)) {
        process.stdout.write(`\r  Saltando CITREP/${circNombre}...`);
        continue;
      } else {
        skipUntilTipo = null;
        skipUntilDepto = null;
      }
    }

    const circId = await getOrCreate(drive, citrepId, circNombre);

    for (const [depNombre, munMap] of Object.entries(circData.departamentos)) {
      const depCod = getCodigoDepartamento(depNombre);
      const depFolder = `${depCod} - ${depNombre}`;
      const depId = await getOrCreate(drive, circId, depFolder);

      for (const [munNombre, munData] of Object.entries(munMap) as any) {
        let munCod: string;
        try { munCod = getCodigoMunicipio(depNombre, munNombre); } catch { munCod = '000'; }
        const munFolder = `${munCod} - ${munNombre}`;
        const munId = await getOrCreate(drive, depId, munFolder);
        for (const zona of munData.zonas) {
          await getOrCreate(drive, munId, zona.nombre);
          total++;
        }
      }
    }

    saveCheckpoint({ tipo: CITREP_TIPO, depto: circNombre, total });
    process.stdout.write(`\r  CITREP / ${circNombre}: ${total} carpetas (${rate()}/s)   `);
  }

  clearCheckpoint();
  console.log(`\n\n✓ Listo. ${total} carpetas en ${((Date.now() - start) / 60000).toFixed(1)} minutos.`);
}

main().catch(e => { console.error('\nError:', e.message); process.exit(1); });
