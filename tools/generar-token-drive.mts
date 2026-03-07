import { google } from 'googleapis';
import * as http from 'http';
import * as fs from 'fs';
import * as path from 'path';

const CLIENT_ID = process.env.CLIENT_ID || '';
const CLIENT_SECRET = process.env.CLIENT_SECRET || '';
const REDIRECT_URI = 'http://localhost:3333/oauth2callback';

if (!CLIENT_ID || !CLIENT_SECRET) {
  console.error('Uso: CLIENT_ID=... CLIENT_SECRET=... npx tsx tools/generar-token-drive.mts');
  process.exit(1);
}

const oAuth2Client = new google.auth.OAuth2(CLIENT_ID, CLIENT_SECRET, REDIRECT_URI);

const authUrl = oAuth2Client.generateAuthUrl({
  access_type: 'offline',
  scope: ['https://www.googleapis.com/auth/drive'],
  prompt: 'consent',
});

console.log('\nAbre esta URL en el navegador con verificadorelectoral3@gmail.com:\n');
console.log(authUrl);
console.log('\nEsperando autorización en http://localhost:3333 ...\n');

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url!, 'http://localhost:3333');
  const code = url.searchParams.get('code');
  if (!code) { res.end('Sin código'); return; }

  res.end('<h2>✓ Autorización exitosa. Puedes cerrar esta pestaña.</h2>');
  server.close();

  const { tokens } = await oAuth2Client.getToken(code);
  console.log('✓ refresh_token obtenido:', tokens.refresh_token);

  const configPath = path.join(process.cwd(), 'drive-config.json');
  const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
  config.oauth2 = {
    client_id: CLIENT_ID,
    client_secret: CLIENT_SECRET,
    refresh_token: tokens.refresh_token,
  };
  fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
  console.log('✓ drive-config.json actualizado. Reinicia la app para probar.');
  process.exit(0);
});

server.listen(3333);
