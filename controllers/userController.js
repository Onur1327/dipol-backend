const User = require('../models/User');

// Tüm kullanıcıları getir (Admin)
exports.getUsers = async (req, res) => {
  try {
    const users = await User.find().select('-password').sort({ createdAt: -1 });
    
    res.json({
      success: true,
      count: users.length,
      users
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      message: error.message 
    });
  }
};

// Kullanıcı sil
exports.deleteUser = async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);

    if (!user) {
      return res.status(404).json({ 
        success: false,
        message: 'Kullanıcı bulunamadı.' 
      });
    }

    res.json({
      success: true,
      message: 'Kullanıcı silindi.'
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      message: error.message 
    });
  }
};

// İstatistikler
exports.getUserStats = async (req, res) => {
  try {
    const total = await User.countDocuments();
    
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    const recent = await User.countDocuments({ createdAt: { $gte: oneWeekAgo } });

    res.json({
      success: true,
      stats: {
        total,
        recent
      }
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      message: error.message 
    });
  }
};

