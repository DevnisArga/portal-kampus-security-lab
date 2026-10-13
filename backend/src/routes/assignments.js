const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { Assignment, Submission, Course, User, Enrollment } = require('../models');
const { authenticateToken, requireRole } = require('../middleware/auth');

// Multer config
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(__dirname, '../../uploads/submissions');
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, unique + path.extname(file.originalname));
  },
});
const upload = multer({ storage, limits: { fileSize: 10 * 1024 * 1024 } }); // 10MB

// GET assignments
router.get('/', authenticateToken, async (req, res) => {
  try {
    let assignments;
    if (req.user.role === 'mahasiswa') {
      const enrollments = await Enrollment.findAll({ where: { student_id: req.user.id }, attributes: ['course_id'] });
      const courseIds = enrollments.map(e => e.course_id);
      assignments = await Assignment.findAll({
        where: { course_id: courseIds, is_active: true },
        include: [
          { model: Course, as: 'course', attributes: ['id', 'name', 'code'] },
          { model: Submission, as: 'submissions', where: { student_id: req.user.id }, required: false },
        ],
        order: [['due_date', 'ASC']],
      });
    } else if (req.user.role === 'dosen') {
      assignments = await Assignment.findAll({
        where: { lecturer_id: req.user.id },
        include: [
          { model: Course, as: 'course', attributes: ['id', 'name', 'code'] },
          { model: Submission, as: 'submissions', include: [{ model: User, as: 'student', attributes: ['id', 'full_name', 'nim_nip'] }] },
        ],
        order: [['due_date', 'ASC']],
      });
    } else {
      assignments = await Assignment.findAll({
        include: [
          { model: Course, as: 'course', attributes: ['id', 'name', 'code'] },
          { model: User, as: 'lecturer', attributes: ['full_name'] },
        ],
        order: [['createdAt', 'DESC']],
      });
    }
    res.json({ success: true, assignments });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET single assignment
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const assignment = await Assignment.findByPk(req.params.id, {
      include: [
        { model: Course, as: 'course' },
        { model: User, as: 'lecturer', attributes: ['full_name'] },
        { model: Submission, as: 'submissions', include: [{ model: User, as: 'student', attributes: ['full_name', 'nim_nip'] }] },
      ],
    });
    if (!assignment) return res.status(404).json({ success: false, message: 'Tugas tidak ditemukan' });
    res.json({ success: true, assignment });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST create assignment (dosen/admin)
router.post('/', authenticateToken, requireRole('dosen', 'admin'), async (req, res) => {
  try {
    const { course_id, title, description, due_date, max_score } = req.body;
    if (!course_id || !title || !due_date) {
      return res.status(400).json({ success: false, message: 'Field wajib tidak lengkap' });
    }
    const assignment = await Assignment.create({
      course_id, title, description, due_date,
      max_score: max_score || 100,
      lecturer_id: req.user.id,
    });
    res.status(201).json({ success: true, assignment });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// PUT update assignment
router.put('/:id', authenticateToken, requireRole('dosen', 'admin'), async (req, res) => {
  try {
    const assignment = await Assignment.findByPk(req.params.id);
    if (!assignment) return res.status(404).json({ success: false, message: 'Tugas tidak ditemukan' });
    const { title, description, due_date, max_score, is_active } = req.body;
    await assignment.update({ title, description, due_date, max_score, is_active });
    res.json({ success: true, assignment });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// DELETE assignment (admin)
router.delete('/:id', authenticateToken, requireRole('admin'), async (req, res) => {
  try {
    const assignment = await Assignment.findByPk(req.params.id);
    if (!assignment) return res.status(404).json({ success: false, message: 'Tugas tidak ditemukan' });
    await assignment.destroy();
    res.json({ success: true, message: 'Tugas berhasil dihapus' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST submit assignment (mahasiswa)
router.post('/:id/submit', authenticateToken, requireRole('mahasiswa'), upload.single('file'), async (req, res) => {
  try {
    const assignment = await Assignment.findByPk(req.params.id);
    if (!assignment) return res.status(404).json({ success: false, message: 'Tugas tidak ditemukan' });

    const now = new Date();
    const status = now > new Date(assignment.due_date) ? 'late' : 'submitted';

    const [submission, created] = await Submission.findOrCreate({
      where: { assignment_id: req.params.id, student_id: req.user.id },
      defaults: {
        file_path: req.file ? req.file.path : null,
        file_name: req.file ? req.file.originalname : null,
        notes: req.body.notes,
        status,
        submitted_at: now,
      },
    });

    if (!created) {
      await submission.update({
        file_path: req.file ? req.file.path : submission.file_path,
        file_name: req.file ? req.file.originalname : submission.file_name,
        notes: req.body.notes || submission.notes,
        status,
        submitted_at: now,
      });
    }

    res.json({ success: true, submission, created });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST grade a submission (dosen/admin)
router.post('/submission/:submissionId/grade', authenticateToken, requireRole('dosen', 'admin'), async (req, res) => {
  try {
    const submission = await Submission.findByPk(req.params.submissionId);
    if (!submission) return res.status(404).json({ success: false, message: 'Submission tidak ditemukan' });
    const { score, feedback } = req.body;
    await submission.update({ score, feedback, status: 'graded', graded_at: new Date(), graded_by: req.user.id });
    res.json({ success: true, submission });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
