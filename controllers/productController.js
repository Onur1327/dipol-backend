const Product = require('../models/Product');

// Tüm ürünleri getir
exports.getProducts = async (req, res) => {
  try {
    const { category, search, isNew, isDiscounted } = req.query;
    let query = {};

    if (category) {
      if (category === 'yeni-gelenler') {
        query.isNew = true;
      } else if (category === 'indirimli') {
        query.isDiscounted = true;
      } else {
        query.category = category;
      }
    }

    // Arama sorgusu
    const searchConditions = [];
    if (search) {
      searchConditions.push(
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { category: { $regex: search, $options: 'i' } }
      );
    }

    // 1 ay kuralı: Stok 0 olan ve 1 aydan uzun süredir stokta olmayan ürünleri gösterme
    const oneMonthAgo = new Date();
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
    
    // Stok kontrolü: Stokta olan veya 1 ay içinde stoktan düşen veya hiç stoktan düşmemiş ürünler
    const stockConditions = [
      { stock: { $gt: 0 } },
      { 
        stock: 0,
        outOfStockDate: { $gte: oneMonthAgo }
      },
      {
        stock: 0,
        outOfStockDate: { $exists: false }
      }
    ];

    // Eğer arama varsa, hem arama hem stok koşullarını birleştir
    if (searchConditions.length > 0) {
      query.$and = [
        { $or: searchConditions },
        { $or: stockConditions }
      ];
    } else {
      // Sadece stok koşulu
      query.$or = stockConditions;
    }

    console.log('Ürün sorgusu:', JSON.stringify(query, null, 2));

    let products = await Product.find(query).sort({ createdAt: -1 });

    // 14 gün kuralına göre isNew güncelle
    products = products.map(product => {
      product.updateNewStatus();
      return product;
    });

    // Stok durumunu güncelle
    products = products.map(product => {
      if (product.stock === 0 && !product.outOfStockDate) {
        product.outOfStockDate = new Date();
      } else if (product.stock > 0 && product.outOfStockDate) {
        product.outOfStockDate = null;
      }
      return product;
    });

    // Değişiklikleri kaydet
    await Promise.all(products.map(p => p.save()));

    res.json({
      success: true,
      count: products.length,
      products
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      message: error.message 
    });
  }
};

// Tek ürün getir
exports.getProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    
    if (!product) {
      return res.status(404).json({ 
        success: false,
        message: 'Ürün bulunamadı.' 
      });
    }

    product.updateNewStatus();
    await product.save();

    res.json({
      success: true,
      product
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      message: error.message 
    });
  }
};

// Ürün oluştur
exports.createProduct = async (req, res) => {
  try {
    console.log('Ürün oluşturuluyor:', req.body);
    
    // Slug oluşturma fonksiyonu
    const createSlug = (text) => {
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
    };
    
    // Eğer slug yoksa oluştur
    if (!req.body.slug && req.body.name) {
      let baseSlug = createSlug(req.body.name);
      let slug = baseSlug;
      let counter = 1;
      
      // Aynı slug varsa numara ekle
      while (await Product.exists({ slug })) {
        slug = `${baseSlug}-${counter}`;
        counter++;
      }
      
      req.body.slug = slug;
    }
    
    const product = await Product.create(req.body);
    console.log('Ürün oluşturuldu:', product._id, product.name);
    res.status(201).json({
      success: true,
      product
    });
  } catch (error) {
    console.error('Ürün oluşturma hatası:', error);
    res.status(500).json({ 
      success: false,
      message: error.message 
    });
  }
};

// Ürün güncelle
exports.updateProduct = async (req, res) => {
  try {
    const product = await Product.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!product) {
      return res.status(404).json({ 
        success: false,
        message: 'Ürün bulunamadı.' 
      });
    }

    product.updateNewStatus();
    await product.save();

    res.json({
      success: true,
      product
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      message: error.message 
    });
  }
};

// Ürün sil
exports.deleteProduct = async (req, res) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);

    if (!product) {
      return res.status(404).json({ 
        success: false,
        message: 'Ürün bulunamadı.' 
      });
    }

    res.json({
      success: true,
      message: 'Ürün silindi.'
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      message: error.message 
    });
  }
};

// İstatistikler
exports.getStats = async (req, res) => {
  try {
    const total = await Product.countDocuments();
    const inStock = await Product.countDocuments({ stock: { $gt: 0 } });
    const outOfStock = await Product.countDocuments({ stock: 0 });
    const lowStock = await Product.countDocuments({ stock: { $gt: 0, $lt: 10 } });
    
    const products = await Product.find();
    const newProducts = products.filter(p => {
      const fourteenDaysAgo = new Date();
      fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);
      return p.createdAt > fourteenDaysAgo;
    }).length;
    
    const discounted = await Product.countDocuments({ isDiscounted: true });
    
    const totalValue = products.reduce((sum, p) => sum + (p.price * p.stock), 0);

    res.json({
      success: true,
      stats: {
        total,
        inStock,
        outOfStock,
        lowStock,
        newProducts,
        discounted,
        totalValue
      }
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      message: error.message 
    });
  }
};

