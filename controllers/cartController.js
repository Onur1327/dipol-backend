const Cart = require('../models/Cart');
const Product = require('../models/Product');

// Kullanıcının sepetini getir
exports.getCart = async (req, res) => {
  try {
    const userId = req.user.userId || req.user._id;
    console.log('getCart - userId:', userId);
    
    if (!userId) {
      return res.status(401).json({ 
        success: false,
        message: 'Kullanıcı bilgisi bulunamadı.' 
      });
    }
    
    let cart = await Cart.findOne({ userId: userId }).populate('items.productId');
    
    if (!cart) {
      cart = await Cart.create({ userId: userId, items: [] });
    }

    res.json({
      success: true,
      cart: {
        items: cart.items,
        total: cart.getTotal(),
        itemCount: cart.getItemCount()
      }
    });
  } catch (error) {
    console.error('Sepet yüklenirken hata:', error);
    res.status(500).json({ 
      success: false,
      message: error.message 
    });
  }
};

// Sepete ürün ekle
exports.addToCart = async (req, res) => {
  try {
    console.log('addToCart çağrıldı:', req.body);
    console.log('Kullanıcı:', req.user);
    
    const { productId, size, color, quantity = 1 } = req.body;

    if (!productId || !size || !color) {
      console.error('Eksik parametreler:', { productId, size, color });
      return res.status(400).json({ 
        success: false,
        message: 'Ürün ID, beden ve renk zorunludur.' 
      });
    }

    // Ürünü kontrol et
    console.log('Ürün aranıyor:', productId);
    const product = await Product.findById(productId);
    if (!product) {
      console.error('Ürün bulunamadı:', productId);
      return res.status(404).json({ 
        success: false,
        message: 'Ürün bulunamadı.' 
      });
    }
    
    console.log('Ürün bulundu:', product.name);
    const requestedQuantity = parseInt(quantity) || 1;
    if (requestedQuantity < 1) {
      return res.status(400).json({
        success: false,
        message: 'Miktar 1 veya daha fazla olmalıdır.'
      });
    }

    // Sepeti bul veya oluştur
    const userId = req.user.userId || req.user._id;
    if (!userId) {
      return res.status(401).json({ 
        success: false,
        message: 'Kullanıcı bilgisi bulunamadı.' 
      });
    }
    
    let cart = await Cart.findOne({ userId: userId });
    if (!cart) {
      cart = await Cart.create({ userId: userId, items: [] });
    }

    // Aynı ürün, beden ve renk kombinasyonunu kontrol et
    const itemId = `${productId}-${size}-${color}`;
    const existingItemIndex = cart.items.findIndex(
      item => (item.id === itemId) ||
              (item.productId.toString() === productId && 
               item.size === size && 
               item.color === color)
    );

    const existingQuantity = existingItemIndex > -1 ? (cart.items[existingItemIndex].quantity || 0) : 0;
    const newTotalQuantity = existingQuantity + requestedQuantity;

    // Stok kontrolü: sepetteki toplam miktar ürün stokunu aşamaz
    if (typeof product.stock === 'number' && product.stock >= 0 && newTotalQuantity > product.stock) {
      console.warn('Stok aşıldı:', {
        productId,
        stock: product.stock,
        existingQuantity,
        requestedQuantity,
        attemptedTotal: newTotalQuantity
      });
      return res.status(400).json({
        success: false,
        message: `Bu üründen en fazla ${product.stock} adet sepete ekleyebilirsiniz. Sepetinizde zaten ${existingQuantity} adet var.`
      });
    }

    // Ürün bilgilerini hazırla
    const cartItem = {
      productId: product._id,
      product: {
        _id: product._id,
        name: product.name,
        image: product.image || (product.images && product.images[0]) || '',
        price: product.price,
        stock: product.stock
      },
      size,
      color,
      quantity: requestedQuantity,
      price: product.price,
      id: `${product._id}-${size}-${color}` // Frontend ile uyumluluk için
    };
    
    if (existingItemIndex > -1) {
      // Mevcut ürünün miktarını artır
      cart.items[existingItemIndex].quantity = newTotalQuantity;
      // id'yi güncelle (eğer yoksa)
      if (!cart.items[existingItemIndex].id) {
        cart.items[existingItemIndex].id = itemId;
      }
      // Ürün bilgilerini de güncelle (fiyat, stok vb. değişmiş olabilir)
      cart.items[existingItemIndex].product = cartItem.product;
      cart.items[existingItemIndex].price = cartItem.price;
      console.log('Mevcut ürün güncellendi:', cart.items[existingItemIndex]);
    } else {
      // Yeni ürün ekle
      cart.items.push(cartItem);
      console.log('Yeni ürün eklendi:', cartItem);
    }

    await cart.save();
    console.log('Sepet kaydedildi');

    res.json({
      success: true,
      cart: {
        items: cart.items,
        total: cart.getTotal(),
        itemCount: cart.getItemCount()
      }
    });
  } catch (error) {
    console.error('Sepete eklenirken hata:', error);
    res.status(500).json({ 
      success: false,
      message: error.message 
    });
  }
};

// Sepet ürününü güncelle
exports.updateCartItem = async (req, res) => {
  try {
    const { itemId } = req.params;
    const { quantity } = req.body;
    const requestedQuantity = parseInt(quantity);
    
    if (!requestedQuantity || requestedQuantity < 1) {
      return res.status(400).json({ 
        success: false,
        message: 'Miktar 1 veya daha fazla olmalıdır.' 
      });
    }

    const userId = req.user.userId || req.user._id;
    if (!userId) {
      return res.status(401).json({ 
        success: false,
        message: 'Kullanıcı bilgisi bulunamadı.' 
      });
    }

    const cart = await Cart.findOne({ userId: userId });
    if (!cart) {
      return res.status(404).json({ 
        success: false,
        message: 'Sepet bulunamadı.' 
      });
    }

    // itemId, productId-size-color formatında olabilir
    const itemIndex = cart.items.findIndex(
      item => item.id === itemId ||
              `${item.productId}-${item.size}-${item.color}` === itemId ||
              item._id?.toString() === itemId
    );
    
    if (itemIndex === -1) {
      return res.status(404).json({ 
        success: false,
        message: 'Sepet ürünü bulunamadı.' 
      });
    }

    // İlgili ürünü bul ve stok kontrolü yap
    const cartItem = cart.items[itemIndex];
    const product = await Product.findById(cartItem.productId);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Ürün bulunamadı.'
      });
    }

    if (typeof product.stock === 'number' && product.stock >= 0 && requestedQuantity > product.stock) {
      console.warn('Stok aşıldı (updateCartItem):', {
        productId: cartItem.productId,
        stock: product.stock,
        requestedQuantity
      });
      return res.status(400).json({
        success: false,
        message: `Bu üründen en fazla ${product.stock} adet sepete ekleyebilirsiniz.`
      });
    }

    cart.items[itemIndex].quantity = requestedQuantity;
    // Ürün içeriğini de güncelle (stok, fiyat güncel olsun)
    cart.items[itemIndex].product = {
      _id: product._id,
      name: product.name,
      image: product.image || (product.images && product.images[0]) || '',
      price: product.price,
      stock: product.stock
    };
    await cart.save();

    res.json({
      success: true,
      cart: {
        items: cart.items,
        total: cart.getTotal(),
        itemCount: cart.getItemCount()
      }
    });
  } catch (error) {
    console.error('Sepet güncellenirken hata:', error);
    res.status(500).json({ 
      success: false,
      message: error.message 
    });
  }
};

// Sepetten ürün sil
exports.removeFromCart = async (req, res) => {
  try {
    const { itemId } = req.params;

    const userId = req.user.userId || req.user._id;
    if (!userId) {
      return res.status(401).json({ 
        success: false,
        message: 'Kullanıcı bilgisi bulunamadı.' 
      });
    }

    const cart = await Cart.findOne({ userId: userId });
    if (!cart) {
      return res.status(404).json({ 
        success: false,
        message: 'Sepet bulunamadı.' 
      });
    }

    // itemId, productId-size-color formatında olabilir
    cart.items = cart.items.filter(
      item => item.id !== itemId &&
              `${item.productId}-${item.size}-${item.color}` !== itemId &&
              item._id?.toString() !== itemId
    );

    await cart.save();

    res.json({
      success: true,
      cart: {
        items: cart.items,
        total: cart.getTotal(),
        itemCount: cart.getItemCount()
      }
    });
  } catch (error) {
    console.error('Sepetten silinirken hata:', error);
    res.status(500).json({ 
      success: false,
      message: error.message 
    });
  }
};

// Sepeti temizle
exports.clearCart = async (req, res) => {
  try {
    const userId = req.user.userId || req.user._id;
    if (!userId) {
      return res.status(401).json({ 
        success: false,
        message: 'Kullanıcı bilgisi bulunamadı.' 
      });
    }

    const cart = await Cart.findOne({ userId: userId });
    if (!cart) {
      return res.status(404).json({ 
        success: false,
        message: 'Sepet bulunamadı.' 
      });
    }

    cart.items = [];
    await cart.save();

    res.json({
      success: true,
      message: 'Sepet temizlendi.',
      cart: {
        items: [],
        total: 0,
        itemCount: 0
      }
    });
  } catch (error) {
    console.error('Sepet temizlenirken hata:', error);
    res.status(500).json({ 
      success: false,
      message: error.message 
    });
  }
};

