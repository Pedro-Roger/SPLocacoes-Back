const request = require('supertest');
const bcrypt = require('bcryptjs');

const app = require('../src/app');
const User = require('../src/models/User');

// Arquivo isolado de propósito: o limitador guarda estado em memória por IP
// no módulo, e o Jest reinicia o registro de módulos a cada arquivo de
// teste — evitando que o contador de um teste vaze para outro.
describe('POST /api/auth/login — bloqueio por força bruta', () => {
  test('bloqueia com 429 após muitas tentativas seguidas, mesmo com a senha certa na última', async () => {
    const passwordHash = await bcrypt.hash('senha-correta', 4);
    await User.create({ name: 'Admin', email: 'admin@teste.com', passwordHash });

    const agent = request.agent(app);

    for (let i = 0; i < 5; i++) {
      const res = await agent
        .post('/api/auth/login')
        .send({ email: 'admin@teste.com', password: 'senha-errada' });
      expect(res.status).toBe(401);
    }

    const blocked = await agent
      .post('/api/auth/login')
      .send({ email: 'admin@teste.com', password: 'senha-correta' });

    expect(blocked.status).toBe(429);
    expect(blocked.body.error).toEqual(expect.any(String));
  });
});
