// Proteção contra força bruta no login: no máximo MAX_FAILURES tentativas
// malsucedidas por IP a cada WINDOW_MS. Só falhas contam — logins corretos
// nunca aproximam o cliente do bloqueio, e não há decremento assíncrono
// (fonte de condição de corrida em rajadas rápidas de requisições).
const WINDOW_MS = 15 * 60 * 1000;
const MAX_FAILURES = 5;

const failuresByIp = new Map();

function currentEntry(ip) {
  const entry = failuresByIp.get(ip);
  if (entry && entry.resetAt <= Date.now()) {
    failuresByIp.delete(ip);
    return undefined;
  }
  return entry;
}

function loginRateLimit(req, res, next) {
  const entry = currentEntry(req.ip);
  if (entry && entry.count >= MAX_FAILURES) {
    return res
      .status(429)
      .json({ error: 'Muitas tentativas de login. Tente novamente em alguns minutos.' });
  }
  next();
}

function recordLoginFailure(req) {
  const entry = currentEntry(req.ip);
  if (entry) {
    entry.count += 1;
  } else {
    failuresByIp.set(req.ip, { count: 1, resetAt: Date.now() + WINDOW_MS });
  }
}

function recordLoginSuccess(req) {
  failuresByIp.delete(req.ip);
}

module.exports = { loginRateLimit, recordLoginFailure, recordLoginSuccess };
