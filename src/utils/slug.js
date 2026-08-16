const slugify = require('slugify');

// Gera um slug a partir de uma ou mais partes (ex.: título + ano), sempre com
// as mesmas opções de normalização usadas em todo o painel (upload de
// imagens, anúncios de equipamentos e notícias).
function makeSlug(...parts) {
  return slugify(parts.filter(Boolean).join('-'), { lower: true, strict: true });
}

module.exports = { makeSlug };
