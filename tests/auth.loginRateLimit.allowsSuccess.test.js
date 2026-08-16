const request = require('supertest');
const bcrypt = require('bcryptjs');

const app = require('../src/app');
const User = require('../src/models/User');

// Arquivo isolado — ver auth.loginRateLimit.blocks.test.js
describe('POST /api/auth/login — logins corretos', () => {
  test('nunca são bloqueados, mesmo em sequência', async () => {
    const passwordHash = await bcrypt.hash('senha-correta', 4);
    await User.create({ name: 'Admin', email: 'admin2@teste.com', passwordHash });

    const agent = request.agent(app);
    for (let i = 0; i < 8; i++) {
      const res = await agent
        .post('/api/auth/login')
        .send({ email: 'admin2@teste.com', password: 'senha-correta' });
      expect(res.status).toBe(200);
    }
  });
});
