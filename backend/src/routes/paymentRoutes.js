const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');
const auth = require('../middleware/auth');

router.post('/initiate', auth, paymentController.initiatePayment);
router.post('/release', auth, paymentController.releasePayment);

module.exports = router;