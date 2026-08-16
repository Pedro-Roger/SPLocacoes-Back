const { Router } = require('express');

const publicRoutes = require('./public.routes');
const authRoutes = require('./auth.routes');
const adminRoutes = require('./admin.routes');
const { requireAuth } = require('../middlewares/auth');

const router = Router();

router.use('/', publicRoutes);
router.use('/auth', authRoutes);
router.use('/painel', requireAuth, adminRoutes);

module.exports = router;
