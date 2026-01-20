const admin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ 
      success: false,
      message: 'Yetkilendirme gerekli.' 
    });
  }

  if (req.user.role !== 'admin') {
    return res.status(403).json({ 
      success: false,
      message: 'Bu işlem için admin yetkisi gerekli.' 
    });
  }

  next();
};

module.exports = admin;

