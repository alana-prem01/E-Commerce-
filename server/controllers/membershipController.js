const Razorpay = require('razorpay');
const crypto = require('crypto');
const User = require('../models/UserSchema');
const Product = require('../models/ProductSchema');
const Coupon = require('../models/CouponSchema');

// Initialize Razorpay instance reusing process.env configuration
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || 'dummy_id',
  key_secret: process.env.RAZORPAY_KEY_SECRET || 'dummy_secret',
});

// Membership price configuration: ₹599/year
const MEMBERSHIP_PRICE_INR = 599;

// Ensure ELORA15 coupon exists in DB
const ensurePremiumCouponExists = async () => {
  try {
    const existing = await Coupon.findOne({ code: 'ELORA15' });
    if (!existing) {
      // Create ELORA15 coupon with 15% discount, valid for 10 years
      const farFutureDate = new Date();
      farFutureDate.setFullYear(farFutureDate.getFullYear() + 10);

      await Coupon.create({
        code: 'ELORA15',
        discountType: 'percent',
        discountValue: 15,
        minOrderAmount: 0,
        expiresAt: farFutureDate,
        isActive: true
      });
      console.log('Created ELORA15 coupon successfully');
    }
  } catch (err) {
    console.error('Error ensuring ELORA15 coupon exists:', err.message);
  }
};

// @desc    Create Razorpay Order for Premium Membership
// @route   POST /api/membership/create-order
// @access  Private
exports.createMembershipOrder = async (req, res) => {
  try {
    const options = {
      amount: MEMBERSHIP_PRICE_INR * 100, // Amount in paise (59900 paise)
      currency: 'INR',
      receipt: `memb_${Date.now()}`,
      payment_capture: 1,
    };

    const order = await razorpay.orders.create(options);
    res.status(200).json({ success: true, order });
  } catch (error) {
    console.error('Error in createMembershipOrder:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create membership order',
      error: error.message
    });
  }
};

// @desc    Verify Premium Membership Payment & Activate
// @route   POST /api/membership/verify
// @access  Private
exports.verifyMembershipPayment = async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({
        success: false,
        message: 'Razorpay order ID, payment ID, and signature are required'
      });
    }

    // Verify Razorpay HMAC signature
    const sign = razorpay_order_id + '|' + razorpay_payment_id;
    const expectedSign = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET || 'dummy_secret')
      .update(sign.toString())
      .digest('hex');

    if (razorpay_signature !== expectedSign) {
      return res.status(400).json({
        success: false,
        message: 'Invalid payment signature!'
      });
    }

    // Make sure PREMIUM25 coupon exists
    await ensurePremiumCouponExists();

    // Activate membership for 1 year from current date
    const startDate = new Date();
    const expiryDate = new Date(startDate.getTime() + 365 * 24 * 60 * 60 * 1000);

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    user.membership = {
      isPremium: true,
      startDate,
      expiryDate,
      razorpay_order_id,
      razorpay_payment_id
    };

    // Log activity
    if (!user.activities) user.activities = [];
    user.activities.push({
      activityType: 'Premium Membership Activated',
      description: `Activated 1-year Premium Membership until ${expiryDate.toLocaleDateString('en-IN')}`
    });

    await user.save();

    const userResponse = user.toObject();
    delete userResponse.password;

    res.status(200).json({
      success: true,
      message: 'Payment verified and Premium Membership activated successfully!',
      user: userResponse
    });
  } catch (error) {
    console.error('Error in verifyMembershipPayment:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to verify membership payment',
      error: error.message
    });
  }
};

// @desc    Get Current User's Membership Status
// @route   GET /api/membership/status
// @access  Private
exports.getMembershipStatus = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const membership = user.membership || {};
    const isPremium = membership.isPremium && membership.expiryDate && new Date(membership.expiryDate) > new Date();

    res.status(200).json({
      success: true,
      membership: {
        isPremium: Boolean(isPremium),
        startDate: membership.startDate || null,
        expiryDate: membership.expiryDate || null,
        isExpired: membership.expiryDate ? new Date() > new Date(membership.expiryDate) : false
      }
    });
  } catch (error) {
    console.error('Error in getMembershipStatus:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// @desc    Get Newly Added Products for Premium Members
// @route   GET /api/membership/new-products
// @access  Private
exports.getPremiumNewProducts = async (req, res) => {
  try {
    const products = await Product.find()
      .sort({ createdAt: -1 })
      .limit(6);

    res.status(200).json({
      success: true,
      products
    });
  } catch (error) {
    console.error('Error in getPremiumNewProducts:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};
