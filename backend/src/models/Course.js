const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Course = sequelize.define('Course', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  code: { type: DataTypes.STRING(20), unique: true, allowNull: false },
  name: { type: DataTypes.STRING(100), allowNull: false },
  description: { type: DataTypes.TEXT, allowNull: true },
  credits: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 3 },
  semester: { type: DataTypes.INTEGER, allowNull: false },
  academic_year: { type: DataTypes.STRING(10), allowNull: false },
  lecturer_id: { type: DataTypes.INTEGER, allowNull: true },
  max_students: { type: DataTypes.INTEGER, defaultValue: 40 },
  schedule: { type: DataTypes.STRING(100), allowNull: true },
  room: { type: DataTypes.STRING(50), allowNull: true },
  is_active: { type: DataTypes.BOOLEAN, defaultValue: true },
}, { tableName: 'courses', timestamps: true });

module.exports = Course;
