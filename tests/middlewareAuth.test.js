const request = require('supertest');

const app = require('../src/app');

describe('middleware requireAuth', () => {
  test('cookie de sessão corrompido/malformado retorna 401, não 500', async () => {
    const res = await request(app)
      .get('/api/painel/metricas')
      .set('Cookie', ['token=isso-nao-e-um-jwt-valido']);

    expect(res.status).toBe(401);
  });
});
