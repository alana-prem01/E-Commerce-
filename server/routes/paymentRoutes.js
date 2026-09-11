const express = require('express');
const router = express.Router();
const { createOrder, verifyPayment, createCodOrder, createWalletOrder, handleRazorpayWebhook } = require('../controllers/paymentController');

// Route to create a new Razorpay order
router.post('/create-order', createOrder);

// Route to verify the payment and save the order
router.post('/verify-payment', verifyPayment);

// Route to create a Cash on Delivery order
router.post('/create-cod-order', createCodOrder);

// Route to create a Wallet Payment order
router.post('/create-wallet-order', createWalletOrder);

// Route for Razorpay Webhooks
router.post('/webhook', handleRazorpayWebhook);

module.exports = router;
