// Cria o primeiro usuário administrador.
// Uso: node scripts/seed-admin.js "Nome" email@locadora.com senha123
require('dotenv').config();

const bcrypt = require('bcryptjs');
const { connectDB } = require('../src/config/db');
const User = require('../src/models/User');

async function main() {
  const [name, email, password] = process.argv.slice(2);
  if (!name || !email || !password) {
    console.error('Uso: node scripts/seed-admin.js "Nome" email senha');
    process.exit(1);
  }

  await connectDB();

  const passwordHash = await bcrypt.hash(password, 10);
  await User.findOneAndUpdate(
    { email: email.toLowerCase() },
    { name, email: email.toLowerCase(), passwordHash },
    { upsert: true, new: true }
  );

  console.log(`Admin "${name}" <${email}> criado/atualizado.`);
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
