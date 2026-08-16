const request = require('supertest');

const app = require('../src/app');
const Equipment = require('../src/models/Equipment');
const { createEquipment } = require('./helpers/factories');

describe('catálogo público (GET /api/equipamentos)', () => {
  test('anúncio em rascunho não aparece no catálogo público', async () => {
    await createEquipment({ title: 'Publicado', slug: 'publicado', status: 'publicado' });
    await createEquipment({ title: 'Rascunho', slug: 'rascunho', status: 'rascunho' });

    const res = await request(app).get('/api/equipamentos');

    expect(res.status).toBe(200);
    expect(res.body.items).toHaveLength(1);
    expect(res.body.items[0].slug).toBe('publicado');
  });

  test('filtra por categoria', async () => {
    await createEquipment({ title: 'Sider', slug: 'sider', category: 'sider' });
    await createEquipment({ title: 'Baú', slug: 'bau', category: 'bau' });

    const res = await request(app).get('/api/equipamentos?categoria=bau');

    expect(res.body.items).toHaveLength(1);
    expect(res.body.items[0].category).toBe('bau');
  });

  test('filtra por disponibilidade', async () => {
    await createEquipment({ title: 'Livre', slug: 'livre', availability: 'disponivel' });
    await createEquipment({ title: 'Locado', slug: 'locado', availability: 'locado' });

    const res = await request(app).get('/api/equipamentos?disponibilidade=locado');

    expect(res.body.items).toHaveLength(1);
    expect(res.body.items[0].availability).toBe('locado');
  });

  test('GET /api/equipamentos/:slug incrementa metrics.views e retorna o anúncio', async () => {
    await createEquipment({ title: 'Sider', slug: 'sider-2024' });

    const res = await request(app).get('/api/equipamentos/sider-2024');

    expect(res.status).toBe(200);
    expect(res.body.metrics.views).toBe(1);

    const again = await request(app).get('/api/equipamentos/sider-2024');
    expect(again.body.metrics.views).toBe(2);
  });

  test('GET /api/equipamentos/:slug de anúncio em rascunho retorna 404', async () => {
    await createEquipment({ title: 'Rascunho', slug: 'rascunho', status: 'rascunho' });

    const res = await request(app).get('/api/equipamentos/rascunho');
    expect(res.status).toBe(404);
  });

  test('GET /api/equipamentos/:slug inexistente retorna 404', async () => {
    const res = await request(app).get('/api/equipamentos/nao-existe');
    expect(res.status).toBe(404);
  });

  test('POST /api/equipamentos/:slug/clique-whatsapp incrementa metrics.whatsappClicks', async () => {
    await createEquipment({ title: 'Sider', slug: 'sider-2024' });

    const res = await request(app).post('/api/equipamentos/sider-2024/clique-whatsapp');
    expect(res.status).toBe(204);

    const updated = await Equipment.findOne({ slug: 'sider-2024' });
    expect(updated.metrics.whatsappClicks).toBe(1);
  });
});
