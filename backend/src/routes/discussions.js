const express = require('express');
const router = express.Router();
const { Discussion, User, Course, Enrollment } = require('../models');
const { authenticateToken } = require('../middleware/auth');

// GET discussions for a course
router.get('/course/:courseId', authenticateToken, async (req, res) => {
  try {
    const discussions = await Discussion.findAll({
      where: { course_id: req.params.courseId, parent_id: null, is_active: true },
      include: [
        { model: User, as: 'author', attributes: ['id', 'full_name', 'role', 'nim_nip'] },
        {
          model: Discussion, as: 'replies',
          include: [{ model: User, as: 'author', attributes: ['id', 'full_name', 'role'] }],
        },
      ],
      order: [['is_pinned', 'DESC'], ['createdAt', 'DESC']],
    });
    res.json({ success: true, discussions });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST create discussion post
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { course_id, title, content, parent_id } = req.body;
    if (!course_id || !content) {
      return res.status(400).json({ success: false, message: 'course_id dan content wajib diisi' });
    }
    const discussion = await Discussion.create({
      course_id, title, content, parent_id: parent_id || null,
      author_id: req.user.id,
    });
    const withAuthor = await Discussion.findByPk(discussion.id, {
      include: [{ model: User, as: 'author', attributes: ['id', 'full_name', 'role'] }],
    });
    res.status(201).json({ success: true, discussion: withAuthor });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// PUT pin/unpin (dosen/admin)
router.put('/:id/pin', authenticateToken, async (req, res) => {
  try {
    if (!['dosen', 'admin'].includes(req.user.role)) {
      return res.status(403).json({ success: false, message: 'Akses ditolak' });
    }
    const disc = await Discussion.findByPk(req.params.id);
    if (!disc) return res.status(404).json({ success: false, message: 'Diskusi tidak ditemukan' });
    await disc.update({ is_pinned: !disc.is_pinned });
    res.json({ success: true, discussion: disc });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// DELETE discussion
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const disc = await Discussion.findByPk(req.params.id);
    if (!disc) return res.status(404).json({ success: false, message: 'Diskusi tidak ditemukan' });
    const isOwner = disc.author_id === req.user.id;
    const isAdmin = ['admin', 'dosen'].includes(req.user.role);
    if (!isOwner && !isAdmin) return res.status(403).json({ success: false, message: 'Akses ditolak' });
    await disc.update({ is_active: false });
    res.json({ success: true, message: 'Diskusi dihapus' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
