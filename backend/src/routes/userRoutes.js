const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const auth = require('../middleware/auth');

router.get('/:id/profile', auth, userController.getProfile);
router.put('/:id/profile', auth, userController.updateProfile);

module.exports = router;