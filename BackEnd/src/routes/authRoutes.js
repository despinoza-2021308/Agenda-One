const express = require('express');
const router = express.Router();
const { authLimiter, loginHandler, verifyHandler } = require('../middlewares/auth');

// POST /api/auth/login con limitador de fuerza bruta
router.post('/login', authLimiter, loginHandler);

// GET /api/auth/check para validar estado de sesión
router.get('/check', verifyHandler);

module.exports = router;
