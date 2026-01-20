const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const auth = require('../middleware/auth');

// Debug middleware
router.use((req, res, next) => {
  console.log(`Auth route hit: ${req.method} ${req.path}`);
  next();
});

router.post('/register', authController.register);
router.post('/login', authController.login);
router.get('/me', auth, authController.getMe);

module.exports = router;

