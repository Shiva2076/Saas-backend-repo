const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { auth, admin } = require('../middlewares/auth');

// Make sure these controller methods exist in adminController
router.get('/users', auth, admin, adminController.listUsers);
router.post('/users/:id/promote', auth, admin, adminController.promoteUser);
router.get('/stats', auth, admin, adminController.getStats);

module.exports = router;