const express = require('express');
const router = express.Router();
const sequelize = require('../config/database');
const { LoginAttempt, User } = require('../models');
const { authenticateToken, requireRole } = require('../middleware/auth');

// GET login attempts log (admin)
router.get('/attempts', authenticateToken, requireRole('admin'), async (req, res) => {
  try {
    const { mode, limit = 50 } = req.query;
    const where = {};
    if (mode) where.mode = mode;
    const attempts = await LoginAttempt.findAll({
      where, order: [['attempted_at', 'DESC']], limit: parseInt(limit),
    });
    const stats = {
      total: await LoginAttempt.count({ where }),
      failed: await LoginAttempt.count({ where: { ...where, success: false } }),
      success: await LoginAttempt.count({ where: { ...where, success: true } }),
      vulnerable: await LoginAttempt.count({ where: { mode: 'vulnerable' } }),
      secure: await LoginAttempt.count({ where: { mode: 'secure' } }),
    };
    res.json({ success: true, attempts, stats });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST SQL Injection search demo (secure mode with parameterized query)
router.post('/search-secure', authenticateToken, async (req, res) => {
  try {
    const { query: searchQuery } = req.body;
    // ✅ AMAN — Parameterized query
    const [results] = await sequelize.query(
      `SELECT id, full_name, nim_nip, role FROM users WHERE full_name LIKE ? OR nim_nip LIKE ? LIMIT 10`,
      { replacements: [`%${searchQuery}%`, `%${searchQuery}%`] }
    );
    res.json({ success: true, results, mode: 'secure', query: `SELECT ... WHERE full_name LIKE ? (parameterized)` });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST SQL Injection search demo (vulnerable mode)
router.post('/search-vulnerable', authenticateToken, async (req, res) => {
  try {
    const { query: searchQuery } = req.body;
    // ⚠️ RENTAN — String concatenation (SQL Injection possible)
    const rawQuery = `SELECT id, full_name, nim_nip, role FROM users WHERE full_name LIKE '%${searchQuery}%' OR nim_nip LIKE '%${searchQuery}%' LIMIT 10`;
    console.log('🔴 [VULNERABLE SEARCH] Raw SQL:', rawQuery);

    const [results] = await sequelize.query(rawQuery);
    res.json({ success: true, results, mode: 'vulnerable', executedQuery: rawQuery });
  } catch (err) {
    // Return the SQL error too — for educational purposes
    res.status(500).json({
      success: false,
      message: err.message,
      sqlError: err.original?.sqlMessage || err.message,
      executedQuery: `SELECT ... WHERE full_name LIKE '%${req.body.query}%' (RENTAN)`,
      mode: 'vulnerable',
    });
  }
});

// GET security lab info
router.get('/info', authenticateToken, async (req, res) => {
  const info = {
    sqlInjection: {
      title: 'Skenario SQL Injection',
      description: 'Mode Rentan menggunakan string concatenation. Mode Aman menggunakan parameterized query.',
      payloads: [
        { label: 'Bypass login', payload: "' OR '1'='1" },
        { label: 'Comment out sisa query', payload: "admin'--" },
        { label: 'Union-based', payload: "' UNION SELECT 1,username,password_plain,role FROM users--" },
        { label: 'Always true', payload: "' OR 1=1--" },
      ],
      accounts: [
        { username: 'demo_mahasiswa', password_plain: 'Demo@123', role: 'mahasiswa' },
        { username: 'demo_dosen', password_plain: 'Demo@456', role: 'dosen' },
      ],
    },
    bruteForce: {
      title: 'Skenario Brute Force',
      description: 'Mode Rentan: tidak ada rate limiting. Mode Aman: rate limit + jeda progresif.',
      targetAccount: { username: 'demo_mahasiswa', password: 'Demo@123' },
      modes: {
        vulnerable: { endpoint: '/api/auth/login-bruteforce', protection: 'Tidak ada' },
        secure: { endpoint: '/api/auth/login-secure', protection: 'Rate limit 10 req/15min + progressive delay' },
      },
    },
  };
  res.json({ success: true, info });
});

module.exports = router;
