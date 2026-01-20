const User = require('../models/User');
const jwt = require('jsonwebtoken');

// JWT token oluştur
const generateToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: '30d' });
};

// Kayıt ol
exports.register = async (req, res) => {
  try {
    console.log('Register endpoint hit:', req.body);
    const { name, email, password, phone, address } = req.body;

    // Validasyon
    if (!name || !email || !password || !phone || !address) {
      return res.status(400).json({ 
        success: false,
        message: 'Tüm alanlar zorunludur.' 
      });
    }

    // E-posta kontrolü
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({ 
        success: false,
        message: 'Bu e-posta ile zaten bir hesap var.' 
      });
    }

    // İlk kullanıcıyı admin yap (eğer hiç kullanıcı yoksa)
    const userCount = await User.countDocuments();
    const role = userCount === 0 ? 'admin' : 'user';

    // Kullanıcı oluştur
    const user = await User.create({
      name,
      email: email.toLowerCase(),
      password,
      phone,
      address,
      role
    });

    // Token oluştur
    const token = generateToken(user._id);

    res.status(201).json({
      success: true,
      token,
      user: {
        id: user._id,
        _id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        address: user.address,
        role: user.role || 'user'
      }
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      message: error.message 
    });
  }
};

// Giriş yap
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ 
        success: false,
        message: 'E-posta ve şifre zorunludur.' 
      });
    }

    // Kullanıcıyı bul
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(401).json({ 
        success: false,
        message: 'E-posta veya şifre hatalı.' 
      });
    }

    // Şifre kontrolü
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ 
        success: false,
        message: 'E-posta veya şifre hatalı.' 
      });
    }

    // Token oluştur
    const token = generateToken(user._id);

    res.json({
      success: true,
      token,
      user: {
        id: user._id,
        _id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        address: user.address,
        role: user.role || 'user'
      }
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      message: error.message 
    });
  }
};

// Kullanıcı bilgilerini getir
exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    res.json({
      success: true,
      user: {
        id: user._id,
        _id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        address: user.address,
        role: user.role || 'user'
      }
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      message: error.message 
    });
  }
};

