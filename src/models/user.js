

// src/models/user.js (Create a User Model for MongoDB)
const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  subscription_status: { type: String, enum: ['free', 'paid'], default: 'free' }
});

module.exports = mongoose.model('User', userSchema);


