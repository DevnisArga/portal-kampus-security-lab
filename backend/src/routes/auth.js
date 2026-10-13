const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const sequelize = require('../config/database');
const { User, LoginAttempt } = require('../models');
const rateLimit = require('express-rate-limit');

// In-memory store for brute force tracking (mode aman)
const failedAttempts = {};

// Rate limiter untuk mode AMAN
const secureLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 menit
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true,
  handler: (req, res) => {
    res.status(429).json({
      success: false,
      message: 'Terlalu banyak percobaan login. Silakan coba lagi setelah 15 menit.',
      rateLimited: true,
    });
  },
});

// Helper: hitung delay progresif
function getDelay(attempts) {
  if (attempts <= 3) return 0;
  if (attempts <= 5) return 2000;
  if (attempts <= 8) return 5000;
  return 10000;
}

// Helper: letter grade
function getLetterGrade(score) {
  if (score >= 85) return 'A';
  if (score >= 75) return 'B';
  if (score >= 65) return 'C';
  if (score >= 55) return 'D';
  return 'E';
}

// ============================================================
// LOGIN NORMAL (Aman — JWT)
// ============================================================
router.post('/login', async (req, res) => {
  const { username, password } = req.body;
  const ip = req.ip;
  const key = `${ip}:${username}`;

  if (!failedAttempts[key]) failedAttempts[key] = { count: 0, lastAttempt: null };

  const fa = failedAttempts[key];
  const delay = getDelay(fa.count);

  if (delay > 0) {
    const timeSince = Date.now() - (fa.lastAttempt || 0);
    if (timeSince < delay) {
      return res.status(429).json({
        success: false,
        message: `Terlalu banyak percobaan gagal. Tunggu ${Math.ceil((delay - timeSince) / 1000)} detik.`,
        rateLimited: true,
      });
    }
  }

  try {
    const user = await User.findOne({ where: { username } });

    if (!user || !(await bcrypt.compare(password, user.password))) {
      fa.count++;
      fa.lastAttempt = Date.now();

      await LoginAttempt.create({
        username: username || '',
        ip_address: ip,
        user_agent: req.headers['user-agent'] || '',
        success: false,
        mode: 'secure',
      });

      // Pesan error generik — tidak bocorkan info
      return res.status(401).json({
        success: false,
        message: 'Username atau password salah.',
        attemptsLeft: Math.max(0, 10 - fa.count),
      });
    }

    // Reset pada login berhasil
    delete failedAttempts[key];

    await LoginAttempt.create({
      username: user.username,
      ip_address: ip,
      user_agent: req.headers['user-agent'] || '',
      success: true,
      mode: 'secure',
    });

    await user.update({ last_login: new Date() });

    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role, full_name: user.full_name },
      process.env.JWT_SECRET,
      { expiresIn: '8h' }
    );

    return res.json({
      success: true,
      token,
      user: {
        id: user.id,
        username: user.username,
        full_name: user.full_name,
        email: user.email,
        role: user.role,
        nim_nip: user.nim_nip,
        phone: user.phone,
        profile_photo: user.profile_photo,
      },
    });
  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({ success: false, message: 'Kesalahan server' });
  }
});

// ============================================================
// LOGIN RENTAN — SQL Injection Demo
// Query langsung string, TIDAK menggunakan parameterized query
// HANYA untuk keperluan praktikum Security Lab
// ============================================================
router.post('/login-vulnerable', async (req, res) => {
  const { username, password } = req.body;
  const ip = req.ip;

  try {
    // ⚠️ INTENTIONALLY VULNERABLE — SQL string concatenation (NO parameterized query)
    const rawQuery = `SELECT * FROM users WHERE username = '${username}' AND password_plain = '${password}' LIMIT 1`;

    // Log the actual query for education purposes
    console.log('🔴 [VULNERABLE] Raw SQL:', rawQuery);

    const [results] = await sequelize.query(rawQuery);

    await LoginAttempt.create({
      username: username || '',
      ip_address: ip,
      user_agent: req.headers['user-agent'] || '',
      success: results.length > 0,
      mode: 'vulnerable',
    });

    if (results.length > 0) {
      const user = results[0];
      const token = jwt.sign(
        { id: user.id, username: user.username, role: user.role, full_name: user.full_name },
        process.env.JWT_SECRET,
        { expiresIn: '8h' }
      );
      return res.json({
        success: true,
        token,
        injectionDemo: true,
        executedQuery: rawQuery,
        user: { id: user.id, username: user.username, full_name: user.full_name, role: user.role },
      });
    }

    return res.status(401).json({
      success: false,
      message: 'Login gagal',
      executedQuery: rawQuery,
      injectionDemo: true,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: 'Error: ' + err.message,
      executedQuery: `SELECT * FROM users WHERE username = '${username}' AND password_plain = '${password}'`,
      injectionDemo: true,
    });
  }
});

// ============================================================
// LOGIN BRUTE FORCE RENTAN — Tanpa rate limiting sama sekali
// ============================================================
router.post('/login-bruteforce', async (req, res) => {
  const { username, password } = req.body;
  const ip = req.ip;

  try {
    // ⚠️ INTENTIONALLY VULNERABLE — No rate limiting, no delay, reveals detailed errors
    const user = await User.findOne({ where: { username } });

    let success = false;
    let message = '';

    if (!user) {
      message = `Pengguna '${username}' tidak ditemukan.`; // Bocor: username tidak ada
    } else if (!(await bcrypt.compare(password, user.password))) {
      message = `Password untuk '${username}' salah.`; // Bocor: username ada tapi password salah
      success = false;
    } else {
      success = true;
      message = 'Login berhasil';
    }

    await LoginAttempt.create({
      username: username || '',
      ip_address: ip,
      user_agent: req.headers['user-agent'] || '',
      success,
      mode: 'vulnerable',
    });

    if (success) {
      const token = jwt.sign(
        { id: user.id, username: user.username, role: user.role, full_name: user.full_name },
        process.env.JWT_SECRET,
        { expiresIn: '8h' }
      );
      return res.json({ success: true, token, bruteforceDemo: true, user: { id: user.id, username: user.username, role: user.role } });
    }

    return res.status(401).json({ success: false, message, bruteforceDemo: true });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// ============================================================
// LOGIN AMAN — Mode pembanding brute force
// ============================================================
router.post('/login-secure', secureLimiter, async (req, res) => {
  const { username, password } = req.body;
  const ip = req.ip;
  const key = `${ip}:${username}:secure`;

  if (!failedAttempts[key]) failedAttempts[key] = { count: 0, lastAttempt: null };
  const fa = failedAttempts[key];
  const delay = getDelay(fa.count);

  if (delay > 0) {
    const timeSince = Date.now() - (fa.lastAttempt || 0);
    if (timeSince < delay) {
      return res.status(429).json({
        success: false,
        message: `Akun sementara dikunci. Tunggu ${Math.ceil((delay - timeSince) / 1000)} detik.`,
        rateLimited: true,
        secureDemo: true,
      });
    }
  }

  try {
    // ✅ AMAN — parameterized query via Sequelize
    const user = await User.findOne({ where: { username } });

    if (!user || !(await bcrypt.compare(password, user.password))) {
      fa.count++;
      fa.lastAttempt = Date.now();
      await LoginAttempt.create({ username: username || '', ip_address: ip, user_agent: req.headers['user-agent'] || '', success: false, mode: 'secure' });
      return res.status(401).json({
        success: false,
        message: 'Username atau password salah.', // Pesan generik
        attemptsCount: fa.count,
        secureDemo: true,
      });
    }

    delete failedAttempts[key];
    await LoginAttempt.create({ username: user.username, ip_address: ip, user_agent: req.headers['user-agent'] || '', success: true, mode: 'secure' });
    await user.update({ last_login: new Date() });

    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role, full_name: user.full_name },
      process.env.JWT_SECRET,
      { expiresIn: '8h' }
    );
    return res.json({ success: true, token, secureDemo: true, user: { id: user.id, username: user.username, role: user.role } });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Kesalahan server' });
  }
});

// ============================================================
// GET /me — Profil user yang login
// ============================================================
router.get('/me', require('../middleware/auth').authenticateToken, async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id, {
      attributes: { exclude: ['password', 'password_plain'] },
    });
    if (!user) return res.status(404).json({ success: false, message: 'User tidak ditemukan' });
    return res.json({ success: true, user });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// GET /attempts — Riwayat percobaan login (untuk Security Lab)
router.get('/attempts', require('../middleware/auth').authenticateToken, async (req, res) => {
  try {
    const attempts = await LoginAttempt.findAll({
      order: [['attempted_at', 'DESC']],
      limit: 100,
    });
    return res.json({ success: true, attempts });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
