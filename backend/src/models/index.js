const sequelize = require('../config/database');
const User = require('./User');
const Course = require('./Course');
const Enrollment = require('./Enrollment');
const Grade = require('./Grade');
const Assignment = require('./Assignment');
const Submission = require('./Submission');
const Discussion = require('./Discussion');
const LoginAttempt = require('./LoginAttempt');

// User - Course (Lecturer)
User.hasMany(Course, { foreignKey: 'lecturer_id', as: 'taughtCourses' });
Course.belongsTo(User, { foreignKey: 'lecturer_id', as: 'lecturer' });

// Student - Course (Enrollment)
User.hasMany(Enrollment, { foreignKey: 'student_id', as: 'enrollments' });
Course.hasMany(Enrollment, { foreignKey: 'course_id', as: 'enrollments' });
Enrollment.belongsTo(User, { foreignKey: 'student_id', as: 'student' });
Enrollment.belongsTo(Course, { foreignKey: 'course_id', as: 'course' });

// Grade
User.hasMany(Grade, { foreignKey: 'student_id', as: 'grades' });
Course.hasMany(Grade, { foreignKey: 'course_id', as: 'grades' });
Grade.belongsTo(User, { foreignKey: 'student_id', as: 'student' });
Grade.belongsTo(Course, { foreignKey: 'course_id', as: 'course' });
Grade.belongsTo(User, { foreignKey: 'lecturer_id', as: 'lecturer' });

// Assignment
Course.hasMany(Assignment, { foreignKey: 'course_id', as: 'assignments' });
Assignment.belongsTo(Course, { foreignKey: 'course_id', as: 'course' });
User.hasMany(Assignment, { foreignKey: 'lecturer_id', as: 'createdAssignments' });
Assignment.belongsTo(User, { foreignKey: 'lecturer_id', as: 'lecturer' });

// Submission
Assignment.hasMany(Submission, { foreignKey: 'assignment_id', as: 'submissions' });
Submission.belongsTo(Assignment, { foreignKey: 'assignment_id', as: 'assignment' });
User.hasMany(Submission, { foreignKey: 'student_id', as: 'submissions' });
Submission.belongsTo(User, { foreignKey: 'student_id', as: 'student' });

// Discussion
Course.hasMany(Discussion, { foreignKey: 'course_id', as: 'discussions' });
Discussion.belongsTo(Course, { foreignKey: 'course_id', as: 'course' });
User.hasMany(Discussion, { foreignKey: 'author_id', as: 'discussions' });
Discussion.belongsTo(User, { foreignKey: 'author_id', as: 'author' });
Discussion.hasMany(Discussion, { foreignKey: 'parent_id', as: 'replies' });
Discussion.belongsTo(Discussion, { foreignKey: 'parent_id', as: 'parent' });

module.exports = { sequelize, User, Course, Enrollment, Grade, Assignment, Submission, Discussion, LoginAttempt };
