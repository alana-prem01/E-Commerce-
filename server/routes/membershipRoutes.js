const express = require('express');
const router = express.Router();
const {
  createMembershipOrder,
  verifyMembershipPayment,
  getMembershipStatus,
  getPremiumNewProducts
} = require('../controllers/membershipController');
const { protect, authorize } = require('../middleware/authMiddleware');

// All membership routes require authentication and User role
router.use(protect);
router.use(authorize('User'));

router.post('/create-order', createMembershipOrder);
router.post('/verify', verifyMembershipPayment);
router.get('/status', getMembershipStatus);
router.get('/new-products', getPremiumNewProducts);

module.exports = router;
