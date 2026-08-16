const request = require('supertest');

const app = require('../src/app');
const News = require('../src/models/News');
const { loginAsAdmin } = require('./helpers/auth');

describe('mural de notícias — agendamento e CRUD', () => {
  test('notícia publicada aparece no mural público', async () => {
    await News.create({
      title: 'Publicada',
      slug: 'publicada',
      excerpt: 'resumo',
      content: 'conteúdo',
      status: 'publicado',
      publishedAt: new Date(),
    });

    const res = await request(app).get('/api/noticias');
    expect(res.body.items).toHaveLength(1);
  });

  test('notícia em rascunho não aparece no mural público', async () => {
    await News.create({
      title: 'Rascunho',
      slug: 'rascunho',
      excerpt: 'resumo',
      content: 'conteúdo',
      status: 'rascunho',
    });

    const res = await request(app).get('/api/noticias');
    expect(res.body.items).toHaveLength(0);
  });

  test('notícia agendada para o futuro não aparece ainda', async () => {
    await News.create({
      title: 'Futura',
      slug: 'futura',
      excerpt: 'resumo',
      content: 'conteúdo',
      status: 'agendado',
      scheduledFor: new Date(Date.now() + 60 * 60 * 1000),
    });

    const res = await request(app).get('/api/noticias');
    expect(res.body.items).toHaveLength(0);
  });

  test('notícia agendada cujo horário já passou aparece no mural (sem cron)', async () => {
    await News.create({
      title: 'Chegou a hora',
      slug: 'chegou-a-hora',
      excerpt: 'resumo',
      content: 'conteúdo',
      status: 'agendado',
      scheduledFor: new Date(Date.now() - 60 * 1000),
    });

    const res = await request(app).get('/api/noticias');
    expect(res.body.items).toHaveLength(1);
    expect(res.body.items[0].slug).toBe('chegou-a-hora');
  });

  test('listagem pública do mural não inclui o campo content (só o resumo)', async () => {
    await News.create({
      title: 'Publicada',
      slug: 'publicada',
      excerpt: 'resumo',
      content: 'conteúdo completo e extenso',
      status: 'publicado',
      publishedAt: new Date(),
    });

    const res = await request(app).get('/api/noticias');
    expect(res.body.items[0].content).toBeUndefined();
  });

  test('GET /api/noticias/:slug retorna a notícia completa, incluindo content', async () => {
    await News.create({
      title: 'Publicada',
      slug: 'publicada',
      excerpt: 'resumo',
      content: 'conteúdo completo',
      status: 'publicado',
      publishedAt: new Date(),
    });

    const res = await request(app).get('/api/noticias/publicada');
    expect(res.status).toBe(200);
    expect(res.body.content).toBe('conteúdo completo');
  });

  test('painel cria notícia publicada com publishedAt preenchido automaticamente', async () => {
    const { agent } = await loginAsAdmin();

    const res = await agent.post('/api/painel/noticias').send({
      title: 'Nova notícia',
      excerpt: 'resumo',
      content: 'conteúdo',
      status: 'publicado',
    });

    expect(res.status).toBe(201);
    expect(res.body.publishedAt).toEqual(expect.any(String));
    expect(res.body.slug).toBe('nova-noticia');
  });

  test('painel exclui uma notícia', async () => {
    const { agent } = await loginAsAdmin();
    const created = await agent.post('/api/painel/noticias').send({
      title: 'Para excluir',
      excerpt: 'resumo',
      content: 'conteúdo',
      status: 'rascunho',
    });

    const res = await agent.delete(`/api/painel/noticias/${created.body._id}`);
    expect(res.status).toBe(204);

    const stillThere = await News.findById(created.body._id);
    expect(stillThere).toBeNull();
  });
});
