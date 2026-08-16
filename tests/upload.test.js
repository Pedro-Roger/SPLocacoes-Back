const fs = require('fs');
const path = require('path');
const request = require('supertest');

const app = require('../src/app');
const { loginAsAdmin } = require('./helpers/auth');

// PNG 1x1 transparente válido — suficiente para o sharp processar de verdade
const TINY_PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=',
  'base64'
);

const UPLOADS_DIR = path.join(__dirname, '..', 'uploads');
const createdFiles = [];

afterEach(() => {
  // Limpa os arquivos gravados em disco durante os testes
  while (createdFiles.length) {
    const file = createdFiles.pop();
    fs.rmSync(file, { force: true });
  }
});

describe('POST /api/painel/upload', () => {
  test('exige autenticação', async () => {
    const res = await request(app)
      .post('/api/painel/upload')
      .attach('file', TINY_PNG, 'foto.png');

    expect(res.status).toBe(401);
  });

  test('sem arquivo enviado retorna 400', async () => {
    const { agent } = await loginAsAdmin();
    const res = await agent.post('/api/painel/upload');
    expect(res.status).toBe(400);
  });

  test('otimiza a imagem para WebP e salva em disco (sem S3_BUCKET configurado)', async () => {
    const { agent } = await loginAsAdmin();

    const res = await agent
      .post('/api/painel/upload')
      .attach('file', TINY_PNG, 'foto-original.png');

    expect(res.status).toBe(201);
    expect(res.body.url).toMatch(/\.webp$/);
    expect(res.body.url).toContain('/uploads/');

    const filename = res.body.url.split('/uploads/')[1];
    const filePath = path.join(UPLOADS_DIR, filename);
    createdFiles.push(filePath);

    expect(fs.existsSync(filePath)).toBe(true);
  });
});
