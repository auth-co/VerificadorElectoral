const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');

function loadConfig() {
  const candidates = [
    path.join(process.resourcesPath || '', 'drive-config.json'),
    path.join(__dirname, '..', 'drive-config.json'),
  ];
  for (const c of candidates) {
    if (fs.existsSync(c)) return JSON.parse(fs.readFileSync(c, 'utf8'));
  }
  throw new Error('drive-config.json no encontrado');
}

async function getAuth() {
  const config = loadConfig();

  // OAuth2 (usuario real con cuota) — preferido para My Drive
  if (config.oauth2?.refresh_token) {
    const oAuth2Client = new google.auth.OAuth2(
      config.oauth2.client_id,
      config.oauth2.client_secret,
      'http://localhost:3333/oauth2callback'
    );
    oAuth2Client.setCredentials({ refresh_token: config.oauth2.refresh_token });
    return oAuth2Client;
  }

  // Service account — solo funciona con Shared Drives (Google Workspace)
  const auth = new google.auth.GoogleAuth({
    credentials: config.serviceAccountKey,
    scopes: ['https://www.googleapis.com/auth/drive'],
  });
  return auth;
}

async function findFolder(drive, parentId, name) {
  const res = await drive.files.list({
    q: `'${parentId}' in parents and name = '${name}' and mimeType = 'application/vnd.google-apps.folder' and trashed = false`,
    fields: 'files(id)',
    pageSize: 1,
    supportsAllDrives: true,
    includeItemsFromAllDrives: true,
  });
  return res.data.files?.[0]?.id ?? null;
}

async function uploadToCorrectFolder(archivoFinal, { tipo, circunscripcion, depFolder, munFolder, zonaFolder }) {
  const config = loadConfig();
  const auth = await getAuth();
  const drive = google.drive({ version: 'v3', auth });

  // rootFolderId ES la carpeta "Escrutinio 2026", navegar directamente
  const tipoId = await findFolder(drive, config.rootFolderId, tipo);
  if (!tipoId) throw new Error(`Carpeta Drive no encontrada: ${tipo}`);

  // CITREP tiene un nivel extra: circunscripcion
  let depParentId = tipoId;
  if (tipo === 'CITREP' && circunscripcion) {
    const circId = await findFolder(drive, tipoId, circunscripcion);
    if (!circId) throw new Error(`Carpeta Drive no encontrada: ${tipo}/${circunscripcion}`);
    depParentId = circId;
  }

  const depId = await findFolder(drive, depParentId, depFolder);
  if (!depId) throw new Error(`Carpeta Drive no encontrada: ${tipo}/${circunscripcion ?? ''}/${depFolder}`);

  const munId = await findFolder(drive, depId, munFolder);
  if (!munId) throw new Error(`Carpeta Drive no encontrada: ${tipo}/.../${depFolder}/${munFolder}`);

  const zonaId = await findFolder(drive, munId, zonaFolder);
  if (!zonaId) throw new Error(`Carpeta Drive no encontrada: ${tipo}/.../${depFolder}/${munFolder}/${zonaFolder}`);

  // Subir (o reemplazar si ya existe)
  const fileName = path.basename(archivoFinal);
  const existing = await drive.files.list({
    q: `'${zonaId}' in parents and name = '${fileName}' and trashed = false`,
    fields: 'files(id)',
    pageSize: 1,
    supportsAllDrives: true,
    includeItemsFromAllDrives: true,
  });

  const media = { mimeType: 'text/csv', body: fs.createReadStream(archivoFinal) };

  let file;
  if (existing.data.files?.length) {
    file = await drive.files.update({
      fileId: existing.data.files[0].id,
      media,
      fields: 'id,webViewLink',
      supportsAllDrives: true,
    });
  } else {
    file = await drive.files.create({
      requestBody: { name: fileName, parents: [zonaId] },
      media,
      fields: 'id,webViewLink',
      supportsAllDrives: true,
    });
  }

  return { success: true, url: file.data.webViewLink };
}

module.exports = { uploadToCorrectFolder };
