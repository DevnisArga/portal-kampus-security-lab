require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 5000;

// Ensure uploads dir exists
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

// ============================================================
// Middleware
// ============================================================
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:3000', 'http://127.0.0.1:5173'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ============================================================
// Routes
// ============================================================
app.use('/api/auth', require('./src/routes/auth'));
app.use('/api/users', require('./src/routes/users'));
app.use('/api/courses', require('./src/routes/courses'));
app.use('/api/grades', require('./src/routes/grades'));
app.use('/api/assignments', require('./src/routes/assignments'));
app.use('/api/discussions', require('./src/routes/discussions'));
app.use('/api/security', require('./src/routes/security'));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Portal Kampus Security Lab API berjalan', timestamp: new Date().toISOString() });
});

// 404
app.use((req, res) => {
  res.status(404).json({ success: false, message: `Route ${req.method} ${req.path} tidak ditemukan` });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({ success: false, message: 'Kesalahan internal server', error: process.env.NODE_ENV === 'development' ? err.message : undefined });
});

// ============================================================
// Start server
// ============================================================
const { sequelize } = require('./src/models');

sequelize.authenticate()
  .then(() => {
    console.log('✅ Database terhubung');
    app.listen(PORT, () => {
      console.log(`🚀 Server berjalan di http://localhost:${PORT}`);
      console.log(`📚 API Docs: http://localhost:${PORT}/api/health`);
    });
  })
  .catch((err) => {
    console.error('❌ Koneksi database gagal:', err.message);
    process.exit(1);
  });

module.exports = app;
