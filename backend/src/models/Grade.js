const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Grade = sequelize.define('Grade', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  student_id: { type: DataTypes.INTEGER, allowNull: false },
  course_id: { type: DataTypes.INTEGER, allowNull: false },
  lecturer_id: { type: DataTypes.INTEGER, allowNull: true },
  score: { type: DataTypes.DECIMAL(5, 2), allowNull: true },
  letter_grade: { type: DataTypes.STRING(5), allowNull: true },
  midterm: { type: DataTypes.DECIMAL(5, 2), allowNull: true },
  final: { type: DataTypes.DECIMAL(5, 2), allowNull: true },
  assignment_avg: { type: DataTypes.DECIMAL(5, 2), allowNull: true },
  comment: { type: DataTypes.TEXT, allowNull: true },
  graded_at: { type: DataTypes.DATE, allowNull: true },
}, { tableName: 'grades', timestamps: true });

module.exports = Grade;
