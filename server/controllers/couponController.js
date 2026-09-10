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

    if (!code || !discountType || discountValue === undefined || discountValue === null || discountValue === '' || !expiresAt) {
      return res.status(400).json({ success: false, message: 'Please provide all required fields' });
    }

    const numDiscountValue = Number(discountValue);

    // Percentage Discount Validation: 1% to 70%
    if (discountType === 'percent') {
      if (isNaN(numDiscountValue) || numDiscountValue < 1 || numDiscountValue > 70) {
        return res.status(400).json({
          success: false,
          message: 'Percentage discount must be between 1% and 70%.'
        });
      }
    } else if (isNaN(numDiscountValue) || numDiscountValue <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Discount value must be greater than 0.'
      });
    }

    // Usage Limit Validation: Must be > 0 if specified
    if (usageLimit !== undefined && usageLimit !== null && usageLimit !== '') {
      const numUsageLimit = Number(usageLimit);
      if (isNaN(numUsageLimit) || numUsageLimit <= 0) {
        return res.status(400).json({
          success: false,
          message: 'Usage limit must be greater than 0.'
        });
      }
    }

    const existing = await Coupon.findOne({ code: code.trim().toUpperCase() });
    if (existing) {
      return res.status(409).json({ success: false, message: 'Coupon code already exists' });
    }

    const parsedUsageLimit = (usageLimit !== undefined && usageLimit !== null && usageLimit !== '')
      ? Number(usageLimit)
      : null;

    const coupon = await Coupon.create({
      code: code.trim().toUpperCase(),
      discountType,
      discountValue: numDiscountValue,
      minOrderAmount: Number(minOrderAmount) || 0,
      maxDiscount: maxDiscount ? Number(maxDiscount) : null,
      expiresAt: new Date(expiresAt),
      usageLimit: parsedUsageLimit,
      isActive: true
    });

    res.status(201).json({ success: true, message: 'Coupon created successfully', coupon });
  } catch (error) {
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({ success: false, message: messages[0] || 'Validation Error' });
    }
    console.error('Create Coupon Error:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// @desc    Get all coupons (Admin)
// @route   GET /api/coupons
// @access  Private/Admin
const getAllCoupons = async (req, res) => {
  try {
    const Order = require('../models/OrderSchema');
    const coupons = await Coupon.find().sort({ createdAt: -1 });

    // Fetch all orders that had a coupon applied or discount > 0
    const orders = await Order.find({
      $or: [
        { couponCode: { $exists: true, $ne: null } },
        { 'pricing.discount': { $gt: 0 } }
      ]
    }).lean();

    // Calculate total unique users across ALL coupons
    const totalUserKeys = new Set();
    orders.forEach(o => {
      const key = o.user ? o.user.toString() : (o.contactEmail ? o.contactEmail.trim().toLowerCase() : null);
      if (key) totalUserKeys.add(key);
    });

    // Calculate uniqueUserCount per coupon
    const couponsWithUserCount = coupons.map((coupon) => {
      const obj = coupon.toObject();
      const code = coupon.code ? coupon.code.toUpperCase() : '';

      const matchingOrders = orders.filter(o => {
        // Direct match by coupon code
        if (o.couponCode && o.couponCode.toUpperCase() === code) return true;

        // Fallback for legacy orders without couponCode: match by discount amount/percentage
        if (o.pricing && Number(o.pricing.discount) > 0) {
          const subtotal = Number(o.pricing.subtotal) || 0;
          const discount = Number(o.pricing.discount) || 0;
          if (coupon.discountType === 'percent' && subtotal > 0) {
            const expectedDiscount = (subtotal * coupon.discountValue) / 100;
            if (Math.abs(discount - expectedDiscount) < 1) return true;
          } else if (coupon.discountType === 'fixed') {
            if (discount === coupon.discountValue) return true;
          }
        }
        return false;
      });

      const couponUserKeys = new Set();
      matchingOrders.forEach(o => {
        const key = o.user ? o.user.toString() : (o.contactEmail ? o.contactEmail.trim().toLowerCase() : null);
        if (key) couponUserKeys.add(key);
      });

      // Take whichever is greater: distinct order users or recorded usedCount
      obj.uniqueUserCount = Math.max(couponUserKeys.size, coupon.usedCount || 0);
      return obj;
    });

    // Total coupon users is the count of distinct users who bought items using coupons
    const totalCouponUsers = totalUserKeys.size;

    res.status(200).json({
      success: true,
      count: coupons.length,
      totalCouponUsers,
      coupons: couponsWithUserCount
    });
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
