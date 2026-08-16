const jwt = require('jsonwebtoken');

// Protege todas as rotas do painel: exige JWT válido no cookie httpOnly
function requireAuth(req, res, next) {
  const token = req.cookies?.token;
  if (!token) {
    return res.status(401).json({ error: 'Não autenticado' });
  }
  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ error: 'Sessão inválida ou expirada' });
  }
}

module.exports = { requireAuth };
