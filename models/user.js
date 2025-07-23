const mongoose = require('mongoose');

const userSchema = new mongoose.Schema();

// Method to match password with stored hash

// Middleware to hash password before saving

module.exports = mongoose.model('User', userSchema);
