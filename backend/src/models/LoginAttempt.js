const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const LoginAttempt = sequelize.define('LoginAttempt', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  username: { type: DataTypes.STRING(100), allowNull: false },
  ip_address: { type: DataTypes.STRING(50), allowNull: true },
  user_agent: { type: DataTypes.STRING(300), allowNull: true },
  success: { type: DataTypes.BOOLEAN, allowNull: false },
  mode: { type: DataTypes.ENUM('vulnerable', 'secure'), defaultValue: 'secure' },
  attempted_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
}, { tableName: 'login_attempts', timestamps: false });

module.exports = LoginAttempt;
