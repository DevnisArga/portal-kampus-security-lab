const express = require('express');
const router = express.Router();
const { Grade, User, Course, Enrollment } = require('../models');
const { authenticateToken, requireRole } = require('../middleware/auth');

// Helper: letter grade
function getLetterGrade(score) {
  if (!score && score !== 0) return null;
  if (score >= 85) return 'A';
  if (score >= 75) return 'B';
  if (score >= 65) return 'C';
  if (score >= 55) return 'D';
  return 'E';
}

// GET grades for current user
router.get('/my', authenticateToken, async (req, res) => {
  try {
    const grades = await Grade.findAll({
      where: { student_id: req.user.id },
      include: [
        { model: Course, as: 'course', attributes: ['id', 'code', 'name', 'credits', 'semester'] },
        { model: User, as: 'lecturer', attributes: ['full_name'] },
      ],
      order: [[{ model: Course, as: 'course' }, 'semester', 'ASC']],
    });
    const gpa = grades.length
      ? (grades.reduce((sum, g) => {
          const pts = { A: 4, B: 3, C: 2, D: 1, E: 0 };
          return sum + (pts[g.letter_grade] || 0) * (g.course?.credits || 0);
        }, 0) / grades.reduce((sum, g) => sum + (g.course?.credits || 0), 0)).toFixed(2)
      : '0.00';
    res.json({ success: true, grades, gpa });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET grades for a course (dosen/admin)
router.get('/course/:courseId', authenticateToken, requireRole('dosen', 'admin'), async (req, res) => {
  try {
    const grades = await Grade.findAll({
      where: { course_id: req.params.courseId },
      include: [
        { model: User, as: 'student', attributes: ['id', 'full_name', 'nim_nip'] },
        { model: Course, as: 'course', attributes: ['id', 'name', 'code'] },
      ],
    });
    res.json({ success: true, grades });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST create/update grade (dosen/admin)
router.post('/', authenticateToken, requireRole('dosen', 'admin'), async (req, res) => {
  try {
    const { student_id, course_id, midterm, final: finalScore, assignment_avg, comment } = req.body;
    if (!student_id || !course_id) {
      return res.status(400).json({ success: false, message: 'student_id dan course_id wajib diisi' });
    }

    // Hitung skor akhir
    const mid = parseFloat(midterm) || 0;
    const fin = parseFloat(finalScore) || 0;
    const asgn = parseFloat(assignment_avg) || 0;
    const score = (mid * 0.3) + (fin * 0.4) + (asgn * 0.3);
    const letter_grade = getLetterGrade(score);

    const [grade, created] = await Grade.findOrCreate({
      where: { student_id, course_id },
      defaults: {
        lecturer_id: req.user.id, midterm: mid, final: fin,
        assignment_avg: asgn, score, letter_grade, comment,
        graded_at: new Date(),
      },
    });

    if (!created) {
      await grade.update({
        midterm: mid, final: fin, assignment_avg: asgn,
        score, letter_grade, comment,
        lecturer_id: req.user.id, graded_at: new Date(),
      });
    }

    res.json({ success: true, grade, created });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// DELETE grade (admin)
router.delete('/:id', authenticateToken, requireRole('admin'), async (req, res) => {
  try {
    const grade = await Grade.findByPk(req.params.id);
    if (!grade) return res.status(404).json({ success: false, message: 'Nilai tidak ditemukan' });
    await grade.destroy();
    res.json({ success: true, message: 'Nilai berhasil dihapus' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
