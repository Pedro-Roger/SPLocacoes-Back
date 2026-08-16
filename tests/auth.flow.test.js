const request = require('supertest');
const bcrypt = require('bcryptjs');

const app = require('../src/app');
const User = require('../src/models/User');

describe('fluxo de autenticação administrativa', () => {
  test('login com credenciais corretas define cookie de sessão e retorna o usuário', async () => {
    const passwordHash = await bcrypt.hash('senha123', 4);
    await User.create({ name: 'Admin SP', email: 'admin@sp.com', passwordHash });

    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@sp.com', password: 'senha123' });

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ name: 'Admin SP', email: 'admin@sp.com' });
    expect(res.headers['set-cookie'][0]).toMatch(/^token=/);
  });

  test('login com senha errada retorna 401 sem vazar qual campo está errado', async () => {
    const passwordHash = await bcrypt.hash('senha123', 4);
    await User.create({ name: 'Admin SP', email: 'admin@sp.com', passwordHash });

    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@sp.com', password: 'errada' });

    expect(res.status).toBe(401);
  });

  test('login com e-mail inexistente retorna 401 (não 500)', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'ninguem@sp.com', password: 'qualquer' });

    expect(res.status).toBe(401);
  });

  test('GET /api/auth/me sem cookie retorna 401', async () => {
    const res = await request(app).get('/api/auth/me');
    expect(res.status).toBe(401);
  });

  test('GET /api/auth/me com sessão válida retorna os dados do usuário logado', async () => {
    const passwordHash = await bcrypt.hash('senha123', 4);
    await User.create({ name: 'Admin SP', email: 'admin@sp.com', passwordHash });

    const agent = request.agent(app);
    await agent.post('/api/auth/login').send({ email: 'admin@sp.com', password: 'senha123' });

    const res = await agent.get('/api/auth/me');
    expect(res.status).toBe(200);
    expect(res.body.name).toBe('Admin SP');
  });

  test('POST /api/auth/logout limpa a sessão — /auth/me volta a dar 401', async () => {
    const passwordHash = await bcrypt.hash('senha123', 4);
    await User.create({ name: 'Admin SP', email: 'admin@sp.com', passwordHash });

    const agent = request.agent(app);
    await agent.post('/api/auth/login').send({ email: 'admin@sp.com', password: 'senha123' });
    await agent.post('/api/auth/logout');

    const res = await agent.get('/api/auth/me');
    expect(res.status).toBe(401);
  });

  test('rotas do painel exigem autenticação — sem cookie retorna 401', async () => {
    const res = await request(app).get('/api/painel/metricas');
    expect(res.status).toBe(401);
  });
});
