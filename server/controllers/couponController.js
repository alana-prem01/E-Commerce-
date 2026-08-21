const Coupon = require('../models/CouponSchema');
const jwt = require('jsonwebtoken');
const User = require('../models/UserSchema');

// @desc    Apply coupon code
// @route   POST /api/coupons/apply
// @access  Public (Requires Auth for Premium Coupons)
const applyCoupon = async (req, res) => {
  try {
    const { code, orderAmount } = req.body;

    if (!code) {
      return res.status(400).json({ success: false, message: 'Coupon code is required' });
    }

    const formattedCode = code.trim().toUpperCase();

    // Special validation for ELORA15 coupon
    if (formattedCode === 'ELORA15') {
      let token;
      if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
        token = req.headers.authorization.split(' ')[1];
      }

      if (!token) {
        return res.status(401).json({
          success: false,
          message: 'Please log in to use the Premium Member coupon (ELORA15).'
        });
      }

      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.id);

        if (!user) {
          return res.status(401).json({ success: false, message: 'User not found' });
        }

        const membership = user.membership || {};
        const isPremiumActive = membership.isPremium && membership.expiryDate && new Date(membership.expiryDate) > new Date();

        if (!isPremiumActive) {
          return res.status(400).json({
            success: false,
            message: 'The ELORA15 coupon is available exclusively to active Premium Members.'
          });
        }
      } catch (err) {
        return res.status(401).json({ success: false, message: 'Authentication required for Premium coupon.' });
      }
    }

    let coupon = await Coupon.findOne({ code: formattedCode, isActive: true });

    // If code is ELORA15 and not yet in DB, dynamically create it with 15% discount
    if (!coupon && formattedCode === 'ELORA15') {
      const farFutureDate = new Date();
      farFutureDate.setFullYear(farFutureDate.getFullYear() + 10);
      coupon = await Coupon.create({
        code: 'ELORA15',
        discountType: 'percent',
        discountValue: 15,
        minOrderAmount: 0,
        expiresAt: farFutureDate,
        isActive: true
      });
    }

    if (!coupon) {
      return res.status(404).json({ success: false, message: 'Invalid or expired coupon code' });
    }

    // Check expiry
    if (new Date() > new Date(coupon.expiresAt)) {
      return res.status(400).json({ success: false, message: 'This coupon has expired' });
    }

    // Check usage limit
    if (coupon.usageLimit !== null && coupon.usedCount >= coupon.usageLimit) {
      return res.status(400).json({ success: false, message: 'This coupon has reached its usage limit' });
    }

    // Check minimum order amount
    if (orderAmount < coupon.minOrderAmount) {
      return res.status(400).json({
        success: false,
        message: `Minimum order amount of ₹${coupon.minOrderAmount.toLocaleString('en-IN')} required for this coupon`
      });
    }

    // Calculate discount
    let discountAmount = 0;
    if (coupon.discountType === 'percent') {
      discountAmount = (orderAmount * coupon.discountValue) / 100;
      if (coupon.maxDiscount) {
        discountAmount = Math.min(discountAmount, coupon.maxDiscount);
      }
    } else {
      discountAmount = Math.min(coupon.discountValue, orderAmount);
    }

    discountAmount = Math.round(discountAmount);

    res.status(200).json({
      success: true,
      message: 'Coupon applied successfully',
      coupon: {
        code: coupon.code,
        discountType: coupon.discountType,
        discountValue: coupon.discountValue,
        discountAmount
      }
    });
  } catch (error) {
    console.error('Apply Coupon Error:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// @desc    Create coupon (Admin)
// @route   POST /api/coupons
// @access  Private/Admin
const createCoupon = async (req, res) => {
  try {
    const { code, discountType, discountValue, minOrderAmount, maxDiscount, expiresAt, usageLimit } = req.body;

    if (!code || !discountType || !discountValue || !expiresAt) {
      return res.status(400).json({ success: false, message: 'Please provide all required fields' });
    }

    const existing = await Coupon.findOne({ code: code.trim().toUpperCase() });
    if (existing) {
      return res.status(409).json({ success: false, message: 'Coupon code already exists' });
    }

    const coupon = await Coupon.create({
      code: code.trim().toUpperCase(),
      discountType,
      discountValue: Number(discountValue),
      minOrderAmount: Number(minOrderAmount) || 0,
      maxDiscount: maxDiscount ? Number(maxDiscount) : null,
      expiresAt: new Date(expiresAt),
      usageLimit: usageLimit ? Number(usageLimit) : null,
      isActive: true
    });

    res.status(201).json({ success: true, message: 'Coupon created successfully', coupon });
  } catch (error) {
    console.error('Create Coupon Error:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// @desc    Get all coupons (Admin)
// @route   GET /api/coupons
// @access  Private/Admin
const getAllCoupons = async (req, res) => {
  try {
    const coupons = await Coupon.find().sort({ createdAt: -1 });
    res.status(200).json({ success: true, count: coupons.length, coupons });
  } catch (error) {
    console.error('Get Coupons Error:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// @desc    Toggle coupon active status (Admin)
// @route   PUT /api/coupons/:id/toggle
// @access  Private/Admin
const toggleCoupon = async (req, res) => {
  try {
    const coupon = await Coupon.findById(req.params.id);
    if (!coupon) {
      return res.status(404).json({ success: false, message: 'Coupon not found' });
    }
    coupon.isActive = !coupon.isActive;
    await coupon.save();
    res.status(200).json({ success: true, message: `Coupon ${coupon.isActive ? 'activated' : 'deactivated'}`, coupon });
  } catch (error) {
    console.error('Toggle Coupon Error:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// @desc    Delete coupon (Admin)
// @route   DELETE /api/coupons/:id
// @access  Private/Admin
const deleteCoupon = async (req, res) => {
  try {
    const coupon = await Coupon.findByIdAndDelete(req.params.id);
    if (!coupon) {
      return res.status(404).json({ success: false, message: 'Coupon not found' });
    }
    res.status(200).json({ success: true, message: 'Coupon deleted successfully' });
  } catch (error) {
    console.error('Delete Coupon Error:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

module.exports = { applyCoupon, createCoupon, getAllCoupons, toggleCoupon, deleteCoupon };
