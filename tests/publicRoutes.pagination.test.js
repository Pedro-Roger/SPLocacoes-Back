const request = require('supertest');

const app = require('../src/app');
const { createEquipment } = require('./helpers/factories');

describe('GET /api/equipamentos — paginação', () => {
  test('parâmetros de paginação não numéricos não derrubam a API (usa padrão)', async () => {
    await createEquipment({ title: 'A', slug: 'a', year: 2020 });
    await createEquipment({ title: 'B', slug: 'b', year: 2021 });

    const res = await request(app).get('/api/equipamentos?pagina=abc&limite=xyz');

    expect(res.status).toBe(200);
    expect(res.body.pagina).toBe(1);
    expect(res.body.limite).toBe(12);
    expect(res.body.items).toHaveLength(2);
  });

  test('página negativa ou zero não derruba a API (usa página 1)', async () => {
    await createEquipment({ title: 'A', slug: 'a', year: 2020 });

    const res = await request(app).get('/api/equipamentos?pagina=-3');

    expect(res.status).toBe(200);
    expect(res.body.pagina).toBe(1);
    expect(res.body.items).toHaveLength(1);
  });
});
