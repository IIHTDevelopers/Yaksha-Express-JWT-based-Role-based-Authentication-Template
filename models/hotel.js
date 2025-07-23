const mongoose = require('mongoose');

const hotelSchema = new mongoose.Schema();

module.exports = mongoose.model('Hotel', hotelSchema);
