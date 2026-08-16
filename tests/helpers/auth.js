const bcrypt = require('bcryptjs');
const request = require('supertest');

const User = require('../../src/models/User');
const app = require('../../src/app');

const DEFAULT_PASSWORD = 'senha123';

// Cria um usuário admin no banco e devolve um supertest agent já logado
// (cookie de sessão real, obtido via POST /api/auth/login como o app faz)
async function loginAsAdmin(overrides = {}) {
  const passwordHash = await bcrypt.hash(DEFAULT_PASSWORD, 4);
  const user = await User.create({
    name: 'Admin Teste',
    email: 'admin@teste.com',
    passwordHash,
    ...overrides,
  });

  const agent = request.agent(app);
  await agent.post('/api/auth/login').send({
    email: user.email,
    password: DEFAULT_PASSWORD,
  });

  return { agent, user };
}

module.exports = { loginAsAdmin, DEFAULT_PASSWORD };
