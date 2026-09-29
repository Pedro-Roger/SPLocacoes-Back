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

  test('gera URL https para host externo mesmo quando protocolo interno é http ( Mixed Content fix )', async () => {
    const origBucket = process.env.S3_BUCKET;
    const origPublicUrl = process.env.S3_PUBLIC_URL;
    delete process.env.S3_BUCKET;
    delete process.env.S3_PUBLIC_URL;

    const { agent } = await loginAsAdmin();

    const res = await agent
      .post('/api/painel/upload')
      .set('Host', 'sp-api.linkdecadastro.com.br')
      .attach('file', TINY_PNG, 'foto-mixed.png');

    // Deve sempre gerar https para host público, nunca http
    expect(res.status).toBe(201);
    expect(res.body.url).toMatch(/^https:\/\/sp-api\.linkdecadastro\.com\.br\/uploads\/.+\.webp$/);
    expect(res.body.url).not.toMatch(/^http:\/\//);

    const filename = res.body.url.split('/uploads/')[1];
    const filePath = path.join(UPLOADS_DIR, filename);
    createdFiles.push(filePath);

    if (origBucket !== undefined) process.env.S3_BUCKET = origBucket;
    if (origPublicUrl !== undefined) process.env.S3_PUBLIC_URL = origPublicUrl;
  });

  test('respeita x-forwarded-proto https mesmo com req.protocol http', async () => {
    const origBucket = process.env.S3_BUCKET;
    const origPublicUrl = process.env.S3_PUBLIC_URL;
    delete process.env.S3_BUCKET;
    delete process.env.S3_PUBLIC_URL;

    const { agent } = await loginAsAdmin();

    const res = await agent
      .post('/api/painel/upload')
      .set('Host', 'sp-api.linkdecadastro.com.br')
      .set('X-Forwarded-Proto', 'https')
      .attach('file', TINY_PNG, 'foto-forwarded.png');

    expect(res.status).toBe(201);
    expect(res.body.url).toMatch(/^https:\/\//);

    const filename = res.body.url.split('/uploads/')[1];
    const filePath = path.join(UPLOADS_DIR, filename);
    createdFiles.push(filePath);

    if (origBucket !== undefined) process.env.S3_BUCKET = origBucket;
    if (origPublicUrl !== undefined) process.env.S3_PUBLIC_URL = origPublicUrl;
  });
});
