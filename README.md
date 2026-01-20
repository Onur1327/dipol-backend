# DipOL Butik - Backend API

Node.js + Express + MongoDB backend API

## 🚀 Kurulum

```bash
# Bağımlılıkları yükle
npm install

# .env dosyasını düzenle
# database_url=mongodb://localhost:27017/dipol-butik

# MongoDB'yi başlat (eğer local kullanıyorsanız)
# mongod

# Development modunda çalıştır
npm run dev

# Production modunda çalıştır
npm start
```

## 📋 API Endpoints

### Auth
- `POST /api/auth/register` - Kayıt ol
- `POST /api/auth/login` - Giriş yap
- `GET /api/auth/me` - Kullanıcı bilgilerini getir (Auth gerekli)

### Products
- `GET /api/products` - Tüm ürünleri getir
- `GET /api/products/:id` - Tek ürün getir
- `GET /api/products/stats` - Ürün istatistikleri
- `POST /api/products` - Ürün oluştur (Auth gerekli)
- `PUT /api/products/:id` - Ürün güncelle (Auth gerekli)
- `DELETE /api/products/:id` - Ürün sil (Auth gerekli)

### Categories
- `GET /api/categories` - Tüm kategorileri getir
- `POST /api/categories` - Kategori oluştur (Auth gerekli)
- `PUT /api/categories/:id` - Kategori güncelle (Auth gerekli)
- `DELETE /api/categories/:id` - Kategori sil (Auth gerekli)

### Orders
- `POST /api/orders` - Sipariş oluştur (Auth gerekli)
- `GET /api/orders/my-orders` - Kullanıcının siparişleri (Auth gerekli)
- `GET /api/orders` - Tüm siparişler (Auth gerekli)
- `GET /api/orders/stats` - Sipariş istatistikleri (Auth gerekli)
- `PUT /api/orders/:id/status` - Sipariş durumu güncelle (Auth gerekli)
- `DELETE /api/orders/:id` - Sipariş sil (Auth gerekli)

### Users
- `GET /api/users` - Tüm kullanıcılar (Auth gerekli)
- `GET /api/users/stats` - Kullanıcı istatistikleri (Auth gerekli)
- `DELETE /api/users/:id` - Kullanıcı sil (Auth gerekli)

## 🔐 Authentication

API'ye istek yaparken header'a token ekleyin:
```
Authorization: Bearer <token>
```

## 📝 Örnek İstekler

### Kayıt Ol
```json
POST /api/auth/register
{
  "name": "Ahmet Yılmaz",
  "email": "ahmet@example.com",
  "password": "123456",
  "phone": "05551234567",
  "address": "İstanbul, Kadıköy, ..."
}
```

### Giriş Yap
```json
POST /api/auth/login
{
  "email": "ahmet@example.com",
  "password": "123456"
}
```

### Ürün Oluştur
```json
POST /api/products
Authorization: Bearer <token>
{
  "name": "Zarif Bluz",
  "category": "ust-giyim",
  "price": 299.90,
  "description": "Şık ve rahat kesim bluz",
  "image": "https://...",
  "images": ["https://..."],
  "stock": 15,
  "sizes": ["S", "M", "L"],
  "colors": ["Beyaz", "Siyah"]
}
```

## 🛠️ Teknolojiler

- Node.js
- Express.js
- MongoDB (Mongoose)
- JWT (Authentication)
- bcryptjs (Password hashing)

## 📄 Lisans

Bu proje eğitim amaçlı geliştirilmiştir.

