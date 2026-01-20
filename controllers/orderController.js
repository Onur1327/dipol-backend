const Order = require('../models/Order');
const Product = require('../models/Product');
const auth = require('../middleware/auth');

// Sipariş oluştur
exports.createOrder = async (req, res) => {
  try {
    const { items, address, phone } = req.body;

    if (!items || items.length === 0) {
      return res.status(400).json({ 
        success: false,
        message: 'Sepet boş olamaz.' 
      });
    }

    if (!address || !address.trim()) {
      return res.status(400).json({ 
        success: false,
        message: 'Adres bilgisi zorunludur.' 
      });
    }

    if (!phone || !phone.trim()) {
      return res.status(400).json({ 
        success: false,
        message: 'Telefon numarası zorunludur.' 
      });
    }

    // Toplam hesapla ve ürün bilgilerini doldur
    let total = 0;
    const orderItems = [];

    for (const item of items) {
      const product = await Product.findById(item.productId);
      if (!product) {
        return res.status(404).json({ 
          success: false,
          message: `Ürün bulunamadı: ${item.productId}` 
        });
      }

      const itemTotal = product.price * item.quantity;
      total += itemTotal;

      orderItems.push({
        productId: product._id,
        product: {
          id: product._id,
          name: product.name,
          image: product.image || product.images?.[0],
          price: product.price
        },
        size: item.size,
        color: item.color,
        quantity: item.quantity,
        price: product.price
      });
    }

    // Sipariş numarası oluştur (benzersiz olması için timestamp + random kullan)
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 10000);
    let orderNumber = `ORD-${timestamp}-${random}`;
    
    // Aynı orderNumber varsa yeni bir tane oluştur
    while (await Order.exists({ orderNumber })) {
      const newRandom = Math.floor(Math.random() * 10000);
      orderNumber = `ORD-${timestamp}-${newRandom}`;
    }

    const order = await Order.create({
      orderNumber,
      user: req.user._id,
      userInfo: {
        name: req.user.name,
        email: req.user.email,
        phone: phone.trim(),
        address: address.trim()
      },
      items: orderItems,
      total
    });

    res.status(201).json({
      success: true,
      order
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      message: error.message 
    });
  }
};

// Kullanıcının siparişlerini getir
exports.getMyOrders = async (req, res) => {
  try {
    const orders = await Order.find({ user: req.user._id })
      .sort({ createdAt: -1 });
    
    res.json({
      success: true,
      count: orders.length,
      orders
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      message: error.message 
    });
  }
};

// Tüm siparişleri getir (Admin)
exports.getAllOrders = async (req, res) => {
  try {
    const { status } = req.query;
    let query = {};

    if (status && status !== 'all') {
      query.status = status;
    }

    const orders = await Order.find(query)
      .populate('user', 'name email')
      .sort({ createdAt: -1 });
    
    res.json({
      success: true,
      count: orders.length,
      orders
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      message: error.message 
    });
  }
};

// Sipariş durumu güncelle
exports.updateOrderStatus = async (req, res) => {
  try {
    const { status } = req.body;

    const validStatuses = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ 
        success: false,
        message: 'Geçersiz sipariş durumu.' 
      });
    }

    const order = await Order.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true, runValidators: true }
    );

    if (!order) {
      return res.status(404).json({ 
        success: false,
        message: 'Sipariş bulunamadı.' 
      });
    }

    res.json({
      success: true,
      order
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      message: error.message 
    });
  }
};

// Sipariş sil
exports.deleteOrder = async (req, res) => {
  try {
    const order = await Order.findByIdAndDelete(req.params.id);

    if (!order) {
      return res.status(404).json({ 
        success: false,
        message: 'Sipariş bulunamadı.' 
      });
    }

    res.json({
      success: true,
      message: 'Sipariş silindi.'
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      message: error.message 
    });
  }
};

// İstatistikler
exports.getOrderStats = async (req, res) => {
  try {
    const total = await Order.countDocuments();
    const pending = await Order.countDocuments({ status: 'pending' });
    const processing = await Order.countDocuments({ status: 'processing' });
    const shipped = await Order.countDocuments({ status: 'shipped' });
    const delivered = await Order.countDocuments({ status: 'delivered' });
    const cancelled = await Order.countDocuments({ status: 'cancelled' });

    const orders = await Order.find({ status: { $ne: 'cancelled' } });
    const totalRevenue = orders.reduce((sum, order) => sum + order.total, 0);

    res.json({
      success: true,
      stats: {
        total,
        pending,
        processing,
        shipped,
        delivered,
        cancelled,
        totalRevenue
      }
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      message: error.message 
    });
  }
};

