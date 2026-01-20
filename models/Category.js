const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Kategori adı zorunludur'],
    trim: true
  },
  slug: {
    type: String,
    required: [true, 'Slug zorunludur'],
    unique: true,
    lowercase: true,
    trim: true
  },
  icon: {
    type: String,
    default: 'fas fa-tag'
  },
  color: {
    type: String,
    default: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Category', categorySchema);

