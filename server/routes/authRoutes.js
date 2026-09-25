const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authLimiter } = require('../middleware/rateLimiter');
const { protect } = require('../middleware/authMiddleware');

router.post('/signup', authLimiter, authController.signup);
router.post('/signin', authLimiter, authController.signin);
router.post('/google', authLimiter, authController.googleAuth);
router.post('/send-mobile-otp', authLimiter, authController.sendMobileOTP);
router.post('/verify-mobile-otp', authLimiter, authController.verifyMobileOTP);
router.post('/forgot-password', authLimiter, authController.forgotPassword);
router.post('/verify-otp', authLimiter, authController.verifyOTP);
router.post('/reset-password', authLimiter, authController.resetPassword);

// Change Password Routes (Protected)
router.post('/change-password', protect, authLimiter, authController.changePasswordSettings);
router.post('/set-password', protect, authLimiter, authController.setPasswordForSocialAccount);
router.post('/change-password/send-otp', protect, authLimiter, authController.sendChangePasswordOTP);
router.post('/change-password/verify-otp', protect, authLimiter, authController.verifyChangePasswordOTP);
router.post('/change-password/reset', protect, authLimiter, authController.resetChangePassword);

// Change Email Routes (Protected)
router.post('/change-email/send-otp', protect, authLimiter, authController.sendChangeEmailOTP);
router.post('/change-email/verify-otp', protect, authLimiter, authController.verifyChangeEmailOTP);
router.post('/change-email/update-email', protect, authLimiter, authController.updateChangeEmail);

// Change Mobile Routes (Protected)
router.post('/change-mobile/send-otp', protect, authLimiter, authController.sendChangeMobileOTP);
router.post('/change-mobile/verify-otp', protect, authLimiter, authController.verifyChangeMobileOTP);

// Delete Account OTP (Protected)
router.post('/delete-account/send-otp', protect, authLimiter, authController.sendDeleteAccountOTP);

// Logout Route
router.post('/logout', authController.logout);

module.exports = router;
