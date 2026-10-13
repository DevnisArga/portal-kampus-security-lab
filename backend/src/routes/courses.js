const express = require('express');
const router = express.Router();
const { Course, User, Enrollment, Assignment } = require('../models');
const { authenticateToken, requireRole } = require('../middleware/auth');

// GET all courses
router.get('/', authenticateToken, async (req, res) => {
  try {
    let courses;
    if (req.user.role === 'mahasiswa') {
      const enrollments = await Enrollment.findAll({
        where: { student_id: req.user.id, status: 'aktif' },
        include: [{ model: Course, as: 'course', include: [{ model: User, as: 'lecturer', attributes: ['full_name', 'nim_nip'] }] }],
      });
      courses = enrollments.map(e => e.course);
    } else if (req.user.role === 'dosen') {
      courses = await Course.findAll({
        where: { lecturer_id: req.user.id },
        include: [{ model: Enrollment, as: 'enrollments' }],
      });
    } else {
      courses = await Course.findAll({
        include: [
          { model: User, as: 'lecturer', attributes: ['full_name', 'nim_nip'] },
          { model: Enrollment, as: 'enrollments' },
        ],
        order: [['createdAt', 'DESC']],
      });
    }
    res.json({ success: true, courses });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET single course
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const course = await Course.findByPk(req.params.id, {
      include: [
        { model: User, as: 'lecturer', attributes: ['id', 'full_name', 'email', 'nim_nip'] },
        { model: Assignment, as: 'assignments' },
        { model: Enrollment, as: 'enrollments', include: [{ model: User, as: 'student', attributes: ['id', 'full_name', 'nim_nip'] }] },
      ],
    });
    if (!course) return res.status(404).json({ success: false, message: 'Mata kuliah tidak ditemukan' });
    res.json({ success: true, course });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST create course (admin / dosen)
router.post('/', authenticateToken, requireRole('admin', 'dosen'), async (req, res) => {
  try {
    const { code, name, description, credits, semester, academic_year, lecturer_id, max_students, schedule, room } = req.body;
    if (!code || !name || !semester || !academic_year) {
      return res.status(400).json({ success: false, message: 'Field wajib tidak lengkap' });
    }
    const course = await Course.create({
      code, name, description, credits: credits || 3,
      semester, academic_year,
      lecturer_id: req.user.role === 'dosen' ? req.user.id : lecturer_id,
      max_students: max_students || 40,
      schedule, room,
    });
    res.status(201).json({ success: true, course });
  } catch (err) {
    if (err.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({ success: false, message: 'Kode mata kuliah sudah digunakan' });
    }
    res.status(500).json({ success: false, message: err.message });
  }
});

// PUT update course (admin / lecturer)
router.put('/:id', authenticateToken, requireRole('admin', 'dosen'), async (req, res) => {
  try {
    const course = await Course.findByPk(req.params.id);
    if (!course) return res.status(404).json({ success: false, message: 'Mata kuliah tidak ditemukan' });
    if (req.user.role === 'dosen' && course.lecturer_id !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Akses ditolak' });
    }
    const { name, description, credits, schedule, room, is_active, max_students, lecturer_id } = req.body;
    await course.update({ name, description, credits, schedule, room, is_active, max_students,
      lecturer_id: req.user.role === 'admin' ? lecturer_id : course.lecturer_id });
    res.json({ success: true, course });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// DELETE course (admin)
router.delete('/:id', authenticateToken, requireRole('admin'), async (req, res) => {
  try {
    const course = await Course.findByPk(req.params.id);
    if (!course) return res.status(404).json({ success: false, message: 'Mata kuliah tidak ditemukan' });
    await course.destroy();
    res.json({ success: true, message: 'Mata kuliah berhasil dihapus' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST enroll student
router.post('/:id/enroll', authenticateToken, requireRole('admin'), async (req, res) => {
  try {
    const { student_id } = req.body;
    const existing = await Enrollment.findOne({ where: { student_id, course_id: req.params.id } });
    if (existing) return res.status(400).json({ success: false, message: 'Mahasiswa sudah terdaftar' });
    const enrollment = await Enrollment.create({ student_id, course_id: req.params.id });
    res.status(201).json({ success: true, enrollment });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
