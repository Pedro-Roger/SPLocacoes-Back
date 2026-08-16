const request = require('supertest');

const app = require('../src/app');
const Equipment = require('../src/models/Equipment');
const { createEquipment } = require('./helpers/factories');
const { loginAsAdmin } = require('./helpers/auth');

describe('painel administrativo — gestão de anúncios', () => {
  test('cria um anúncio e gera o slug a partir de título + ano', async () => {
    const { agent } = await loginAsAdmin();

    const res = await agent.post('/api/painel/equipamentos').send({
      title: 'Semirreboque Facchini 2024',
      category: 'frigorifico',
      year: 2024,
      axles: 3,
    });

    expect(res.status).toBe(201);
    expect(res.body.slug).toBe('semirreboque-facchini-2024-2024');
    expect(res.body.status).toBe('rascunho'); // valor padrão do schema
  });

  test('alternar status para publicado faz o anúncio aparecer no catálogo público imediatamente', async () => {
    const equipment = await createEquipment({ status: 'rascunho' });
    const { agent } = await loginAsAdmin();

    const patch = await agent
      .patch(`/api/painel/equipamentos/${equipment._id}/status`)
      .send({ status: 'publicado' });
    expect(patch.body.status).toBe('publicado');

    const publicRes = await request(app).get('/api/equipamentos');
    expect(publicRes.body.items.map((i) => i.slug)).toContain(equipment.slug);
  });

  test('alternar de volta para rascunho remove o anúncio do catálogo público', async () => {
    const equipment = await createEquipment({ status: 'publicado' });
    const { agent } = await loginAsAdmin();

    await agent
      .patch(`/api/painel/equipamentos/${equipment._id}/status`)
      .send({ status: 'rascunho' });

    const publicRes = await request(app).get('/api/equipamentos');
    expect(publicRes.body.items).toHaveLength(0);
  });

  test('edita um anúncio existente', async () => {
    const equipment = await createEquipment({ priceBRL: 100000 });
    const { agent } = await loginAsAdmin();

    const res = await agent
      .put(`/api/painel/equipamentos/${equipment._id}`)
      .send({ priceBRL: 150000 });

    expect(res.status).toBe(200);
    expect(res.body.priceBRL).toBe(150000);
  });

  test('exclui um anúncio', async () => {
    const equipment = await createEquipment({});
    const { agent } = await loginAsAdmin();

    const res = await agent.delete(`/api/painel/equipamentos/${equipment._id}`);
    expect(res.status).toBe(204);

    const stillThere = await Equipment.findById(equipment._id);
    expect(stillThere).toBeNull();
  });

  test('buscar anúncio inexistente por id retorna 404', async () => {
    const { Types } = require('mongoose');
    const { agent } = await loginAsAdmin();

    const res = await agent.get(`/api/painel/equipamentos/${new Types.ObjectId()}`);
    expect(res.status).toBe(404);
  });

  test('todas as rotas de anúncios do painel exigem autenticação', async () => {
    const equipment = await createEquipment({});

    const results = await Promise.all([
      request(app).get('/api/painel/equipamentos'),
      request(app).post('/api/painel/equipamentos').send({}),
      request(app).put(`/api/painel/equipamentos/${equipment._id}`).send({}),
      request(app).delete(`/api/painel/equipamentos/${equipment._id}`),
    ]);

    results.forEach((res) => expect(res.status).toBe(401));
  });
});
