const { Router } = require('express');

const Equipment = require('../models/Equipment');
const Lead = require('../models/Lead');
const News = require('../models/News');
const { parsePagination } = require('../utils/pagination');

const router = Router();

// GET /api/equipamentos — catálogo público com filtros, busca e paginação
router.get('/equipamentos', async (req, res, next) => {
  try {
    const { categoria, eixos, disponibilidade, busca } = req.query;
    const { pagina, limite } = parsePagination(req.query, { defaultLimite: 12 });

    const filter = { status: 'publicado' };
    if (categoria) filter.category = categoria;
    if (eixos) filter.axles = Number(eixos);
    if (disponibilidade) filter.availability = disponibilidade;
    if (busca) filter.$text = { $search: busca };

    const [items, total] = await Promise.all([
      Equipment.find(filter)
        .sort({ featured: -1, createdAt: -1 })
        .skip((pagina - 1) * limite)
        .limit(limite),
      Equipment.countDocuments(filter),
    ]);

    res.json({ items, total, pagina, limite });
  } catch (err) {
    next(err);
  }
});

// GET /api/equipamentos/:slug — página de detalhe (incrementa views)
router.get('/equipamentos/:slug', async (req, res, next) => {
  try {
    const equipment = await Equipment.findOneAndUpdate(
      { slug: req.params.slug, status: 'publicado' },
      { $inc: { 'metrics.views': 1 } },
      { new: true }
    );
    if (!equipment) return res.status(404).json({ error: 'Anúncio não encontrado' });
    res.json(equipment);
  } catch (err) {
    next(err);
  }
});

// POST /api/equipamentos/:slug/clique-whatsapp — métrica de cliques
router.post('/equipamentos/:slug/clique-whatsapp', async (req, res, next) => {
  try {
    await Equipment.updateOne(
      { slug: req.params.slug },
      { $inc: { 'metrics.whatsappClicks': 1 } }
    );
    res.status(204).end();
  } catch (err) {
    next(err);
  }
});

// POST /api/leads — formulário "Tenho Interesse"
router.post('/leads', async (req, res, next) => {
  try {
    const { equipmentId, name, phone, email, message } = req.body;

    const equipment = await Equipment.findById(equipmentId);
    if (!equipment) return res.status(400).json({ error: 'Anúncio inválido' });

    const lead = await Lead.create({
      equipmentId,
      equipmentTitle: equipment.title,
      name,
      phone,
      email,
      message,
    });
    await Equipment.updateOne({ _id: equipmentId }, { $inc: { 'metrics.leadsCount': 1 } });

    res.status(201).json(lead);
  } catch (err) {
    next(err);
  }
});

// GET /api/noticias — mural público
router.get('/noticias', async (req, res, next) => {
  try {
    const { pagina, limite } = parsePagination(req.query, { defaultLimite: 10 });
    const filter = News.publicFilter();

    const [items, total] = await Promise.all([
      News.find(filter)
        .sort({ publishedAt: -1 })
        .skip((pagina - 1) * limite)
        .limit(limite)
        .select('-content'),
      News.countDocuments(filter),
    ]);

    res.json({ items, total, pagina, limite });
  } catch (err) {
    next(err);
  }
});

// GET /api/noticias/:slug — notícia individual
router.get('/noticias/:slug', async (req, res, next) => {
  try {
    const news = await News.findOne({ slug: req.params.slug, ...News.publicFilter() });
    if (!news) return res.status(404).json({ error: 'Notícia não encontrada' });
    res.json(news);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
