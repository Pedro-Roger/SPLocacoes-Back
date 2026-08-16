const path = require('path');
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');

const routes = require('./routes');

const app = express();

app.use(cors({ origin: process.env.CORS_ORIGIN, credentials: true }));
app.use(express.json());
app.use(cookieParser());

// Imagens enviadas pelo painel (otimizadas para WebP no upload)
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads'), { maxAge: '30d' }));

app.get('/health', (_, res) => res.json({ ok: true }));

app.use('/api', routes);

app.use((err, req, res, next) => {
  // Erros de validação do Mongoose (campo obrigatório ausente, enum inválido...)
  if (err.name === 'ValidationError') {
    const message = Object.values(err.errors)
      .map((e) => e.message)
      .join('; ');
    return res.status(400).json({ error: message });
  }

  // ID mal formado (ex.: equipmentId que não é um ObjectId válido)
  if (err.name === 'CastError') {
    return res.status(400).json({ error: `Valor inválido para "${err.path}"` });
  }

  // Violação de índice único (ex.: slug duplicado)
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue || {})[0] || 'campo';
    return res.status(409).json({ error: `Já existe um registro com esse ${field}` });
  }

  console.error(err);
  res.status(err.status || 500).json({ error: err.message || 'Erro interno' });
});

module.exports = app;
