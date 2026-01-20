const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const auth = require('../middleware/auth');
const admin = require('../middleware/admin');

router.get('/', auth, admin, userController.getUsers);
router.get('/stats', auth, admin, userController.getUserStats);
router.delete('/:id', auth, admin, userController.deleteUser);

module.exports = router;

