const mongoose = require('mongoose');

const IntegritySchema = new mongoose.Schema({
  user: {
    type: String,
    required: true
  },
  ip: {
    type: String,
    required: true
  },
  country: {
    type: String,
    required: true
  },
  city: {
    type: String,
    required: true
  },
  region: {
    type: String,
    required: true
  },
  latitude: {
    type: String,
    required: true
  },
  longitude: {
    type: String,
    required: true
  },
  date: {
    type: Date,
    default: Date.now
  }
});

const User = mongoose.model('Integrity', IntegritySchema);

module.exports = User;