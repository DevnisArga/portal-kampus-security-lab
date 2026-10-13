const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const User = sequelize.define('User', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  username: { type: DataTypes.STRING(50), unique: true, allowNull: false },
  email: { type: DataTypes.STRING(100), unique: true, allowNull: false },
  password: { type: DataTypes.STRING(255), allowNull: false },
  // Plain text password only stored for Security Lab demo account (vulnerable scenario)
  password_plain: { type: DataTypes.STRING(100), allowNull: true },
  full_name: { type: DataTypes.STRING(100), allowNull: false },
  role: { type: DataTypes.ENUM('mahasiswa', 'dosen', 'admin'), allowNull: false },
  nim_nip: { type: DataTypes.STRING(20), unique: true, allowNull: true },
  phone: { type: DataTypes.STRING(20), allowNull: true },
  address: { type: DataTypes.TEXT, allowNull: true },
  profile_photo: { type: DataTypes.STRING(255), allowNull: true },
  is_active: { type: DataTypes.BOOLEAN, defaultValue: true },
  last_login: { type: DataTypes.DATE, allowNull: true },
}, { tableName: 'users', timestamps: true });

module.exports = User;
