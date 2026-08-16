const request = require('supertest');

const app = require('../src/app');
const { loginAsAdmin } = require('./helpers/auth');
const { createEquipment } = require('./helpers/factories');

describe('tratamento de erros da API', () => {
  test('criar anúncio sem campos obrigatórios retorna 400 com mensagem clara', async () => {
    const { agent } = await loginAsAdmin();

    const res = await agent.post('/api/painel/equipamentos').send({
      // sem title, category, year, axles
    });

    expect(res.status).toBe(400);
    expect(res.body.error).toEqual(expect.any(String));
    expect(res.body.error.length).toBeGreaterThan(0);
  });

  test('criar lead com equipmentId em formato inválido retorna 400, não 500', async () => {
    const res = await request(app).post('/api/leads').send({
      equipmentId: 'isso-nao-e-um-object-id',
      name: 'João Frotista',
      phone: '11999999999',
    });

    expect(res.status).toBe(400);
    expect(res.body.error).toEqual(expect.any(String));
  });

  test('criar dois anúncios com o mesmo título e ano (slug duplicado) retorna 409', async () => {
    const { agent } = await loginAsAdmin();
    await createEquipment({ title: 'Sider Randon', slug: 'sider-randon-2024', year: 2024 });

    const res = await agent.post('/api/painel/equipamentos').send({
      title: 'Sider Randon',
      year: 2024,
      category: 'sider',
      axles: 3,
    });

    expect(res.status).toBe(409);
    expect(res.body.error).toEqual(expect.any(String));
  });
});
