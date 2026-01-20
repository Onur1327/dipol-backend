const express = require('express');
const cors = require('cors');
const connectDB = require('./config/database');
require('dotenv').config();

// MongoDB bağlantısı
connectDB();

const app = express();

// Middleware
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:3000', 'http://127.0.0.1:5173', 'http://127.0.0.1:3000'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging middleware (body parse edildikten sonra)
app.use((req, res, next) => {
  console.log(`${req.method} ${req.originalUrl}`);
  if (req.method === 'POST' || req.method === 'PUT') {
    console.log('Request body:', JSON.stringify(req.body).substring(0, 200));
  }
  next();
});

// Routes
try {
  app.use('/api/auth', require('./routes/auth'));
  console.log('✓ Auth routes yüklendi');
} catch (error) {
  console.error('✗ Auth routes yüklenirken hata:', error);
}

try {
  app.use('/api/products', require('./routes/products'));
  console.log('✓ Products routes yüklendi');
} catch (error) {
  console.error('✗ Products routes yüklenirken hata:', error);
}

try {
  app.use('/api/categories', require('./routes/categories'));
  console.log('✓ Categories routes yüklendi');
} catch (error) {
  console.error('✗ Categories routes yüklenirken hata:', error);
}

try {
  app.use('/api/orders', require('./routes/orders'));
  console.log('✓ Orders routes yüklendi');
} catch (error) {
  console.error('✗ Orders routes yüklenirken hata:', error);
}

try {
  app.use('/api/users', require('./routes/users'));
  console.log('✓ Users routes yüklendi');
} catch (error) {
  console.error('✗ Users routes yüklenirken hata:', error);
}

try {
  app.use('/api/cart', require('./routes/cart'));
  console.log('✓ Cart routes yüklendi');
} catch (error) {
  console.error('✗ Cart routes yüklenirken hata:', error);
}

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    success: true, 
    message: 'Server çalışıyor',
    timestamp: new Date().toISOString()
  });
});

// 404 handler - Tüm route'lardan sonra
app.use((req, res) => {
  console.log(`404 - Route bulunamadı: ${req.method} ${req.originalUrl}`);
  res.status(404).json({ 
    success: false,
    message: `Route bulunamadı: ${req.method} ${req.originalUrl}` 
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    success: false,
    message: err.message || 'Sunucu hatası' 
  });
});

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log(`Server ${PORT} portunda çalışıyor`);
});

