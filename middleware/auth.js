const jwt = require('jsonwebtoken');
const User = require('../models/User');

const auth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ message: 'Yetkilendirme hatası. Token bulunamadı.' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId).select('-password');
    
    if (!user) {
      return res.status(401).json({ message: 'Kullanıcı bulunamadı.' });
    }

    req.user = user;
    req.user.userId = user._id; // userId'yi de ekle (geriye dönük uyumluluk için)
    next();
  } catch (error) {
    res.status(401).json({ message: 'Geçersiz token.' });
  }
};

module.exports = auth;

