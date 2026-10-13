const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Submission = sequelize.define('Submission', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  assignment_id: { type: DataTypes.INTEGER, allowNull: false },
  student_id: { type: DataTypes.INTEGER, allowNull: false },
  file_path: { type: DataTypes.STRING(255), allowNull: true },
  file_name: { type: DataTypes.STRING(255), allowNull: true },
  notes: { type: DataTypes.TEXT, allowNull: true },
  score: { type: DataTypes.DECIMAL(5, 2), allowNull: true },
  feedback: { type: DataTypes.TEXT, allowNull: true },
  status: { type: DataTypes.ENUM('submitted', 'graded', 'late'), defaultValue: 'submitted' },
  submitted_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  graded_at: { type: DataTypes.DATE, allowNull: true },
  graded_by: { type: DataTypes.INTEGER, allowNull: true },
}, { tableName: 'submissions', timestamps: true });

module.exports = Submission;
