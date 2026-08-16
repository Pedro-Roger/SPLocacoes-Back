// Normaliza pagina/limite vindos de query string: nunca deixa passar NaN,
// zero ou negativo adiante para o driver do Mongo (que rejeita skip/limit
// inválidos com um erro 500 cru).
function parsePagination(query = {}, { defaultLimite = 12, maxLimite = 100 } = {}) {
  const paginaNum = Number(query.pagina);
  const limiteNum = Number(query.limite);

  const pagina = Number.isFinite(paginaNum) && paginaNum >= 1 ? Math.floor(paginaNum) : 1;
  const limite =
    Number.isFinite(limiteNum) && limiteNum >= 1
      ? Math.min(Math.floor(limiteNum), maxLimite)
      : defaultLimite;

  return { pagina, limite };
}

module.exports = { parsePagination };
