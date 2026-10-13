const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const { User, Course, Enrollment, Grade } = require('../models');
const { authenticateToken, requireRole } = require('../middleware/auth');

// GET all users (admin only)
router.get('/', authenticateToken, requireRole('admin'), async (req, res) => {
  try {
    const users = await User.findAll({
      attributes: { exclude: ['password', 'password_plain'] },
      order: [['createdAt', 'DESC']],
    });
    res.json({ success: true, users });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET user by ID
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    // Mahasiswa hanya bisa lihat profil sendiri
    if (req.user.role === 'mahasiswa' && req.user.id !== parseInt(req.params.id)) {
      return res.status(403).json({ success: false, message: 'Akses ditolak' });
    }
    const user = await User.findByPk(req.params.id, {
      attributes: { exclude: ['password', 'password_plain'] },
    });
    if (!user) return res.status(404).json({ success: false, message: 'User tidak ditemukan' });
    res.json({ success: true, user });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST create user (admin only)
router.post('/', authenticateToken, requireRole('admin'), async (req, res) => {
  try {
    const { username, email, password, full_name, role, nim_nip, phone, address } = req.body;
    if (!username || !email || !password || !full_name || !role) {
      return res.status(400).json({ success: false, message: 'Field wajib tidak lengkap' });
    }
    const hashedPassword = await bcrypt.hash(password, 12);
    const user = await User.create({
      username, email, password: hashedPassword,
      password_plain: role === 'mahasiswa' ? password : null, // Hanya untuk lab
      full_name, role, nim_nip, phone, address,
    });
    const { password: _, password_plain: __, ...userData } = user.toJSON();
    res.status(201).json({ success: true, user: userData });
  } catch (err) {
    if (err.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({ success: false, message: 'Username atau email sudah digunakan' });
    }
    res.status(500).json({ success: false, message: err.message });
  }
});

// PUT update user
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const isAdmin = req.user.role === 'admin';
    const isSelf = req.user.id === parseInt(req.params.id);
    if (!isAdmin && !isSelf) return res.status(403).json({ success: false, message: 'Akses ditolak' });

    const user = await User.findByPk(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User tidak ditemukan' });

    const { full_name, email, phone, address, password, is_active } = req.body;
    const updateData = {};
    if (full_name) updateData.full_name = full_name;
    if (email) updateData.email = email;
    if (phone !== undefined) updateData.phone = phone;
    if (address !== undefined) updateData.address = address;
    if (isAdmin && is_active !== undefined) updateData.is_active = is_active;
    if (password) {
      updateData.password = await bcrypt.hash(password, 12);
    }

    await user.update(updateData);
    const { password: _, password_plain: __, ...userData } = user.toJSON();
    res.json({ success: true, user: userData });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// DELETE user (admin only)
router.delete('/:id', authenticateToken, requireRole('admin'), async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User tidak ditemukan' });
    if (user.id === req.user.id) return res.status(400).json({ success: false, message: 'Tidak dapat menghapus akun sendiri' });
    await user.destroy();
    res.json({ success: true, message: 'User berhasil dihapus' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET stats (admin)
router.get('/stats/summary', authenticateToken, requireRole('admin'), async (req, res) => {
  try {
    const totalUsers = await User.count();
    const totalStudents = await User.count({ where: { role: 'mahasiswa' } });
    const totalLecturers = await User.count({ where: { role: 'dosen' } });
    const totalCourses = await Course.count();
    const totalEnrollments = await Enrollment.count();
    res.json({ success: true, stats: { totalUsers, totalStudents, totalLecturers, totalCourses, totalEnrollments } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
