const { Router } = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const User = require('../models/User');
const { requireAuth } = require('../middlewares/auth');
const {
  loginRateLimit,
  recordLoginFailure,
  recordLoginSuccess,
} = require('../middlewares/loginRateLimit');

const router = Router();

// POST /api/auth/login — sessão persistente (cookie httpOnly de longa duração)
router.post('/login', loginRateLimit, async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
      recordLoginFailure(req);
      return res.status(401).json({ error: 'E-mail ou senha inválidos' });
    }
    recordLoginSuccess(req);

    user.lastLoginAt = new Date();
    await user.save();

    const token = jwt.sign(
      { sub: user._id, name: user.name, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '30d' }
    );

    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 30 * 24 * 60 * 60 * 1000,
    });

    res.json({ name: user.name, email: user.email });
  } catch (err) {
    next(err);
  }
});

// POST /api/auth/logout
router.post('/logout', (req, res) => {
  res.clearCookie('token');
  res.status(204).end();
});

// GET /api/auth/me — usuário logado (usado pelo frontend para proteger o painel)
router.get('/me', requireAuth, (req, res) => {
  res.json({ name: req.user.name, role: req.user.role });
});

module.exports = router;
