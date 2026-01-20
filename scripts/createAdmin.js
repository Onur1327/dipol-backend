const mongoose = require('mongoose');
const User = require('../models/User');
require('dotenv').config();

const createAdmin = async () => {
  try {
    // MongoDB bağlantısı
    await mongoose.connect(process.env.database_url);
    console.log('MongoDB bağlandı');

    // Admin kullanıcı bilgileri
    const adminEmail = 'admin@dipolbutik.com';
    const adminPassword = 'admin123';
    const adminName = 'Admin';
    const adminPhone = '05551234567';
    const adminAddress = 'Admin Adresi';

    // Mevcut admin kontrolü
    const existingAdmin = await User.findOne({ email: adminEmail });
    if (existingAdmin) {
      // Mevcut admin'i güncelle
      existingAdmin.role = 'admin';
      existingAdmin.name = adminName;
      existingAdmin.phone = adminPhone;
      existingAdmin.address = adminAddress;
      existingAdmin.password = adminPassword; // Şifre hash'lenecek (pre-save hook)
      await existingAdmin.save();
      console.log('✓ Mevcut kullanıcı admin yapıldı');
    } else {
      // Yeni admin oluştur
      const admin = await User.create({
        name: adminName,
        email: adminEmail,
        password: adminPassword,
        phone: adminPhone,
        address: adminAddress,
        role: 'admin'
      });
      console.log('✓ Yeni admin kullanıcı oluşturuldu');
    }

    console.log('\n=== ADMIN BİLGİLERİ ===');
    console.log('E-posta:', adminEmail);
    console.log('Şifre:', adminPassword);
    console.log('========================\n');

    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('Hata:', error);
    process.exit(1);
  }
};

createAdmin();

