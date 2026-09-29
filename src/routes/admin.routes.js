const path = require('path');
const { Router } = require('express');
const multer = require('multer');

const Equipment = require('../models/Equipment');
const Lead = require('../models/Lead');
const News = require('../models/News');
const { saveImage, processImage } = require('../services/storage');
const { makeSlug } = require('../utils/slug');

const router = Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 15 * 1024 * 1024 },
});

// ---------- Upload de imagens ----------

// Hosts que viven apenas na máquina de desenvolvimento (localhost / loopback /
// rangos privados) → podem usar http. Qualquer host público exige https para
// evitar Mixed Content no navegador (el admin se sirve por https).
function isLocalHost(host) {
  const h = String(host || '').toLowerCase().trim();
  return (
    h.startsWith('localhost') ||   // localhost, localhost:3000
    h.startsWith('127.') ||        // 127.x.x.x[:puerto]
    h.startsWith('0.0.0.0') ||
    h.startsWith('::1') ||         // IPv6 loopback [::1]:puerto
    h.startsWith('10.') ||         // RFC1918 10/8
    h.startsWith('192.168.') ||    // RFC1918 192.168/16
    /^172\.(1[6-9]|2\d|3[01])\./.test(h) // RFC1918 172.16/12
  );
}

// Deriva el protocolo correcto para construir la URL local de la imagen.
// Detrás de un proxy (Railway/nginx) req.protocol es siempre http aunque la
// petición original llegue por https, así que no puede fiarse de él: se usa
// el header X-Forwarded-Proto cuando es https y, para cualquier host público,
// se fuerza https (nunca http). Solo los hosts locales devuelven http.
function resolveLocalProtocol(req, host) {
  if (req.headers['x-forwarded-proto'] === 'https') return 'https';
  return isLocalHost(host) ? 'http' : 'https';
}

// POST /api/painel/upload — otimização automática (máx. 1600px, WebP) e
// envio para S3 quando configurado; disco local em desenvolvimento
router.post('/upload', upload.single('file'), async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'Nenhum arquivo enviado' });

    const name = `${Date.now()}-${makeSlug(path.parse(req.file.originalname).name)}.webp`;

    const buffer = await processImage(req.file.buffer);

    const host = req.get('host');
    const url = await saveImage(buffer, name, {
      localBaseUrl: `${resolveLocalProtocol(req, host)}://${host}`,
    });
    res.status(201).json({ url });
  } catch (err) {
    next(err);
  }
});

// ---------- Visão geral ----------

// GET /api/painel/metricas — indicadores da visão geral
router.get('/metricas', async (req, res, next) => {
  try {
    const [anunciosAtivos, novosLeads, cliques] = await Promise.all([
      Equipment.countDocuments({ status: 'publicado' }),
      Lead.countDocuments({ status: 'novo' }),
      Equipment.aggregate([
        {
          $group: {
            _id: null,
            whatsappClicks: { $sum: '$metrics.whatsappClicks' },
            views: { $sum: '$metrics.views' },
          },
        },
      ]),
    ]);

    res.json({
      anunciosAtivos,
      novosLeads,
      cliquesWhatsapp: cliques[0]?.whatsappClicks || 0,
      visualizacoes: cliques[0]?.views || 0,
    });
  } catch (err) {
    next(err);
  }
});

// ---------- Anúncios ----------

router.get('/equipamentos', async (req, res, next) => {
  try {
    const items = await Equipment.find().sort({ createdAt: -1 });
    res.json({ items });
  } catch (err) {
    next(err);
  }
});

router.get('/equipamentos/:id', async (req, res, next) => {
  try {
    const equipment = await Equipment.findById(req.params.id);
    if (!equipment) return res.status(404).json({ error: 'Anúncio não encontrado' });
    res.json(equipment);
  } catch (err) {
    next(err);
  }
});

router.post('/equipamentos', async (req, res, next) => {
  try {
    const data = req.body;
    data.slug = makeSlug(data.title, data.year);
    const equipment = await Equipment.create(data);
    res.status(201).json(equipment);
  } catch (err) {
    next(err);
  }
});

router.put('/equipamentos/:id', async (req, res, next) => {
  try {
    const equipment = await Equipment.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!equipment) return res.status(404).json({ error: 'Anúncio não encontrado' });
    res.json(equipment);
  } catch (err) {
    next(err);
  }
});

// PATCH — alternar publicado/rascunho (reflete imediatamente no site público)
router.patch('/equipamentos/:id/status', async (req, res, next) => {
  try {
    const { status } = req.body;
    const equipment = await Equipment.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true, runValidators: true }
    );
    if (!equipment) return res.status(404).json({ error: 'Anúncio não encontrado' });
    res.json(equipment);
  } catch (err) {
    next(err);
  }
});

router.delete('/equipamentos/:id', async (req, res, next) => {
  try {
    await Equipment.findByIdAndDelete(req.params.id);
    res.status(204).end();
  } catch (err) {
    next(err);
  }
});

// ---------- Leads ----------

router.get('/leads', async (req, res, next) => {
  try {
    const { status } = req.query;
    const filter = status ? { status } : {};
    const items = await Lead.find(filter).sort({ createdAt: -1 });
    res.json({ items });
  } catch (err) {
    next(err);
  }
});

// PATCH — mover lead no funil (novo → contatado → convertido | perdido)
router.patch('/leads/:id/status', async (req, res, next) => {
  try {
    const { status, notes } = req.body;
    const lead = await Lead.findByIdAndUpdate(
      req.params.id,
      { status, ...(notes !== undefined && { notes }) },
      { new: true, runValidators: true }
    );
    if (!lead) return res.status(404).json({ error: 'Lead não encontrado' });
    res.json(lead);
  } catch (err) {
    next(err);
  }
});

// ---------- Notícias ----------

router.get('/noticias', async (req, res, next) => {
  try {
    const items = await News.find().sort({ createdAt: -1 });
    res.json({ items });
  } catch (err) {
    next(err);
  }
});

router.get('/noticias/:id', async (req, res, next) => {
  try {
    const news = await News.findById(req.params.id);
    if (!news) return res.status(404).json({ error: 'Notícia não encontrada' });
    res.json(news);
  } catch (err) {
    next(err);
  }
});

router.post('/noticias', async (req, res, next) => {
  try {
    const data = req.body;
    data.slug = makeSlug(data.title);
    data.authorId = req.user.sub;
    const news = await News.create(data);
    res.status(201).json(news);
  } catch (err) {
    next(err);
  }
});

router.put('/noticias/:id', async (req, res, next) => {
  try {
    const data = req.body;
    const news = await News.findByIdAndUpdate(req.params.id, data, {
      new: true,
      runValidators: true,
    });
    if (!news) return res.status(404).json({ error: 'Notícia não encontrada' });
    res.json(news);
  } catch (err) {
    next(err);
  }
});

router.delete('/noticias/:id', async (req, res, next) => {
  try {
    await News.findByIdAndDelete(req.params.id);
    res.status(204).end();
  } catch (err) {
    next(err);
  }
});

module.exports = router;
