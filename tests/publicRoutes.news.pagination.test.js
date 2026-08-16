const request = require('supertest');

const app = require('../src/app');
const News = require('../src/models/News');

describe('GET /api/noticias — paginação', () => {
  test('parâmetros de paginação não numéricos não derrubam a API (usa padrão)', async () => {
    await News.create({
      title: 'Notícia A',
      slug: 'noticia-a',
      excerpt: 'resumo',
      content: 'conteúdo',
      status: 'publicado',
      publishedAt: new Date(),
    });

    const res = await request(app).get('/api/noticias?pagina=abc&limite=xyz');

    expect(res.status).toBe(200);
    expect(res.body.pagina).toBe(1);
    expect(res.body.limite).toBe(10);
    expect(res.body.items).toHaveLength(1);
  });
});
