const express = require('express');
const router = express.Router();
const { createOrder, verifyPayment, createCodOrder } = require('../controllers/paymentController');

// Route to create a new Razorpay order
router.post('/create-order', createOrder);

// Route to verify the payment and save the order
router.post('/verify-payment', verifyPayment);

// Route to create a Cash on Delivery order
router.post('/create-cod-order', createCodOrder);

module.exports = router;
