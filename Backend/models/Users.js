// models/Users.js
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
  },
  password: {
    type: String,
    required: true,
  },
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user',
  },
  googleId: {                // ✅ add this
    type: String,
    default: null,
  },
});

UserSchema.pre('save', async function (next) {
  // Don’t hash dummy password again for Google users
  if (this.isModified('password') && !this.googleId) {
    this.password = await bcrypt.hash(this.password, 10);
  }
  next();
});

UserSchema.methods.isValidPassword = async function (password) {
  // Allow Google users automatically
  if (this.googleId) return true;
  return await bcrypt.compare(password, this.password);
};

module.exports = mongoose.model('User', UserSchema);
