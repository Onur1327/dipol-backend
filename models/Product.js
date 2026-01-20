const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Ürün adı zorunludur'],
    trim: true
  },
  slug: {
    type: String,
    unique: true,
    sparse: true,
    trim: true
  },
  category: {
    type: String,
    required: [true, 'Kategori zorunludur']
  },
  price: {
    type: Number,
    required: [true, 'Fiyat zorunludur'],
    min: 0
  },
  oldPrice: {
    type: Number,
    min: 0
  },
  description: {
    type: String,
    trim: true
  },
  image: {
    type: String,
    required: [true, 'Ana görsel zorunludur']
  },
  images: [{
    type: String
  }],
  stock: {
    type: Number,
    required: [true, 'Stok zorunludur'],
    default: 0,
    min: 0
  },
  sizes: [{
    type: String
  }],
  colors: [{
    type: String
  }],
  isNew: {
    type: Boolean,
    default: false
  },
  isDiscounted: {
    type: Boolean,
    default: false
  },
  outOfStockDate: {
    type: Date
  }
}, {
  timestamps: true,
  suppressReservedKeysWarning: true
});

// Slug oluşturma fonksiyonu
function createSlug(text) {
  return text
    .toLowerCase()
    .replace(/ğ/g, 'g')
    .replace(/ü/g, 'u')
    .replace(/ş/g, 's')
    .replace(/ı/g, 'i')
    .replace(/ö/g, 'o')
    .replace(/ç/g, 'c')
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

// Slug'ı otomatik oluştur
productSchema.pre('save', async function(next) {
  if (!this.slug && this.name) {
    let baseSlug = createSlug(this.name);
    let slug = baseSlug;
    let counter = 1;
    
    // Aynı slug varsa numara ekle
    while (await mongoose.model('Product').exists({ slug, _id: { $ne: this._id } })) {
      slug = `${baseSlug}-${counter}`;
      counter++;
    }
    
    this.slug = slug;
  }
  next();
});

// 14 gün kuralına göre isNew kontrolü
productSchema.methods.updateNewStatus = function() {
  const fourteenDaysAgo = new Date();
  fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);
  
  if (this.createdAt && this.createdAt > fourteenDaysAgo) {
    this.isNew = true;
  } else {
    this.isNew = false;
  }
  return this;
};

module.exports = mongoose.model('Product', productSchema);

