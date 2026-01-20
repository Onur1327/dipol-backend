const mongoose = require('mongoose');

const cartItemSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true
  },
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  product: {
    _id: mongoose.Schema.Types.ObjectId,
    name: String,
    image: String,
    price: Number,
    stock: {
      type: Number,
      default: 0
    }
  },
  size: {
    type: String,
    required: true
  },
  color: {
    type: String,
    required: true
  },
  quantity: {
    type: Number,
    required: true,
    min: 1
  },
  price: {
    type: Number,
    required: true
  }
}, { _id: false });

const cartSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  items: [cartItemSchema]
}, {
  timestamps: true
});

// Sepet toplamını hesapla
cartSchema.methods.getTotal = function() {
  return this.items.reduce((total, item) => total + (item.price * item.quantity), 0);
};

// Sepet ürün sayısını hesapla
cartSchema.methods.getItemCount = function() {
  return this.items.reduce((count, item) => count + item.quantity, 0);
};

module.exports = mongoose.model('Cart', cartSchema);

