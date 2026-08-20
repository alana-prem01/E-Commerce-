const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authLimiter } = require('../middleware/rateLimiter');
const { protect } = require('../middleware/authMiddleware');

router.post('/signup', authLimiter, authController.signup);
router.post('/signin', authLimiter, authController.signin);
router.post('/forgot-password', authLimiter, authController.forgotPassword);
router.post('/verify-otp', authLimiter, authController.verifyOTP);
router.post('/reset-password', authLimiter, authController.resetPassword);

// Change Password Routes (Protected)
router.post('/change-password/send-otp', protect, authLimiter, authController.sendChangePasswordOTP);
router.post('/change-password/verify-otp', protect, authLimiter, authController.verifyChangePasswordOTP);
router.post('/change-password/reset', protect, authLimiter, authController.resetChangePassword);

module.exports = router;
