const Razorpay = require('razorpay');
const crypto = require('crypto');
const Order = require('../models/OrderSchema');
const Cart = require('../models/CartSchema');
const Product = require('../models/ProductSchema');
const sendEmail = require('../utils/sendEmail');

// Initialize Razorpay
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || 'dummy_id',
  key_secret: process.env.RAZORPAY_KEY_SECRET || 'dummy_secret',
});

// @desc    Create Razorpay Order
// @route   POST /api/payment/create-order
// @access  Public
exports.createOrder = async (req, res) => {
  try {
    const { amount, currency = 'INR', subtotal, couponCode } = req.body;

    let finalAmount = amount || 0;

    // Secure calculation if subtotal is provided
    if (subtotal !== undefined) {
      let isPremiumUser = false;
      let token;
      
      // Extract Bearer token if present
      if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
        token = req.headers.authorization.split(' ')[1];
      }
      
      if (token) {
        try {
          const jwt = require('jsonwebtoken');
          const User = require('../models/UserSchema');
          const decoded = jwt.verify(token, process.env.JWT_SECRET);
          const user = await User.findById(decoded.id);
          
          if (user && user.membership) {
            isPremiumUser = user.membership.isPremium && 
                            user.membership.expiryDate && 
                            new Date(user.membership.expiryDate) > new Date();
          }
        } catch (err) {
          console.error("Token verification failed in createOrder", err);
        }
      }

      const shippingCost = isPremiumUser ? 0 : 65;
      const tax = subtotal > 0 ? 110 : 0;
      let discountAmount = 0;

      // Handle ELORA15 Coupon specifically
      if (couponCode === 'ELORA15' && isPremiumUser) {
        discountAmount = Math.round((subtotal * 15) / 100);
      } else if (couponCode) {
        // Handle other standard coupons
        const Coupon = require('../models/CouponSchema');
        const coupon = await Coupon.findOne({ code: couponCode.trim().toUpperCase(), isActive: true });
        if (coupon && new Date() <= new Date(coupon.expiresAt) && subtotal >= coupon.minOrderAmount) {
          if (coupon.discountType === 'percent') {
            discountAmount = (subtotal * coupon.discountValue) / 100;
            if (coupon.maxDiscount) discountAmount = Math.min(discountAmount, coupon.maxDiscount);
          } else {
            discountAmount = Math.min(coupon.discountValue, subtotal);
          }
          discountAmount = Math.round(discountAmount);
        }
      }

      finalAmount = Math.max(0, subtotal + shippingCost + tax - discountAmount);
    }

    if (!finalAmount) {
      return res.status(400).json({ success: false, message: 'Amount could not be calculated or is 0' });
    }

    const options = {
      amount: finalAmount * 100, // Razorpay amount is in paise
      currency,
      receipt: `receipt_order_${Date.now()}`,
      payment_capture: 1,
    };

    const order = await razorpay.orders.create(options);
    res.status(200).json({ success: true, order });
  } catch (error) {
    console.error('Error in createOrder:', error);
    res.status(500).json({ success: false, message: 'Failed to create order', error: error.message });
  }
};

// @desc    Verify Payment and Save Order
// @route   POST /api/payment/verify-payment
// @access  Public
exports.verifyPayment = async (req, res) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      contactEmail,
      shippingAddress,
      billingAddress,
      orderItems,
      pricing,
      user
    } = req.body;

    // Check for duplicate order verification
    const existingOrder = await Order.findOne({ 'paymentDetails.razorpay_order_id': razorpay_order_id });
    if (existingOrder) {
      return res.status(200).json({ success: true, message: 'Order already verified', order: existingOrder });
    }

    // 1. Verify the signature
    const sign = razorpay_order_id + '|' + razorpay_payment_id;
    const expectedSign = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET || 'dummy_secret')
      .update(sign.toString())
      .digest('hex');

    if (razorpay_signature !== expectedSign) {
      return res.status(400).json({ success: false, message: 'Invalid signature sent!' });
    }

    const mongoose = require('mongoose');

    const sanitizeAddr = (addr) => ({
      country: addr?.country || '',
      firstName: addr?.firstName || '',
      lastName: addr?.lastName || '',
      address: addr?.address || '',
      city: addr?.city || '',
      state: addr?.state || '',
      pinCode: addr?.pinCode || '',
      phone: addr?.phone || ''
    });

    const sanitizedOrderItems = (orderItems || []).map(item => ({
      product: mongoose.Types.ObjectId.isValid(item.product) ? item.product : undefined,
      name: item.name || 'Jewellery Item',
      quantity: item.quantity || 1,
      price: item.price || 0,
      image: item.image || ''
    }));

    // 2. Save order to DB
    const newOrder = new Order({
      user: user || null,
      contactEmail: contactEmail || 'customer@example.com',
      shippingAddress: sanitizeAddr(shippingAddress),
      billingAddress: sanitizeAddr(billingAddress),
      orderItems: sanitizedOrderItems,
      pricing: {
        subtotal: pricing?.subtotal || 0,
        shipping: pricing?.shipping || 0,
        tax: pricing?.tax || 0,
        discount: pricing?.discount || 0,
        total: pricing?.total || 0
      },
      paymentDetails: {
        razorpay_order_id,
        razorpay_payment_id,
        razorpay_signature,
        payment_method: 'Razorpay'
      },
      paymentStatus: 'Paid',
    });

    await newOrder.save();

    // 3. Decrement stock for each ordered product
    for (const item of sanitizedOrderItems) {
      if (item.product) {
        await Product.findByIdAndUpdate(
          item.product,
          { $inc: { stockQuantity: -item.quantity } }
        );
      }
    }

    // 4. Clear purchased items from cart
    if (user && orderItems && orderItems.length > 0) {
      const purchasedProductIds = orderItems.map(item => item.product).filter(Boolean);
      if (purchasedProductIds.length > 0) {
        await Cart.findOneAndUpdate(
          { user },
          { $pull: { items: { product: { $in: purchasedProductIds } } } }
        );
      }
    }

    // 5. Send order confirmation email (non-blocking)
    try {
      const orderItemsHTML = sanitizedOrderItems.map(item => `
        <tr>
          <td style="padding:10px;border-bottom:1px solid #f0f0f0;">${item.name}</td>
          <td style="padding:10px;border-bottom:1px solid #f0f0f0;text-align:center;">${item.quantity}</td>
          <td style="padding:10px;border-bottom:1px solid #f0f0f0;text-align:right;">&#8377;${(item.price * item.quantity).toLocaleString('en-IN')}</td>
        </tr>
      `).join('');

      const emailHTML = `
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,0.1);">
          <div style="background:linear-gradient(135deg,#0B3D36,#0B5D50);padding:40px 32px;text-align:center;">
            <h1 style="color:#D4AF37;font-family:Georgia,serif;font-size:28px;margin:0 0 8px 0;">Elora Jewellery</h1>
            <p style="color:#fff;font-size:15px;margin:0;opacity:0.9;">Order Confirmed &#10003;</p>
          </div>
          <div style="padding:32px;">
            <h2 style="color:#134e4a;font-size:22px;margin:0 0 8px 0;">Thank you for your order!</h2>
            <p style="color:#6b7280;font-size:15px;line-height:1.6;">Your order <strong style="color:#0B5D50;">#${newOrder._id.toString().slice(-8).toUpperCase()}</strong> has been placed successfully.</p>
            <div style="background:#f8f7f4;border-radius:8px;padding:20px;margin:24px 0;">
              <h3 style="color:#134e4a;font-size:16px;margin:0 0 16px 0;">Order Summary</h3>
              <table style="width:100%;border-collapse:collapse;">
                <thead><tr style="background:#e8f5f3;">
                  <th style="padding:10px;text-align:left;font-size:13px;color:#374151;">Item</th>
                  <th style="padding:10px;text-align:center;font-size:13px;color:#374151;">Qty</th>
                  <th style="padding:10px;text-align:right;font-size:13px;color:#374151;">Price</th>
                </tr></thead>
                <tbody>${orderItemsHTML}</tbody>
              </table>
              <div style="border-top:2px solid #0B5D50;margin-top:12px;padding-top:12px;">
                <div style="display:flex;justify-content:space-between;margin-bottom:8px;">
                  <span style="color:#6b7280;font-size:14px;">Shipping</span>
                  <span style="color:#374151;font-size:14px;">${pricing?.shipping === 0 ? 'Free' : '&#8377;' + (pricing?.shipping || 0).toLocaleString('en-IN')}</span>
                </div>
                <div style="display:flex;justify-content:space-between;font-weight:bold;">
                  <span style="color:#134e4a;font-size:16px;">Total</span>
                  <span style="color:#0B5D50;font-size:18px;">&#8377;${(pricing?.total || 0).toLocaleString('en-IN')}</span>
                </div>
              </div>
            </div>
            <div style="background:#f8f7f4;border-radius:8px;padding:20px;margin-bottom:24px;">
              <h3 style="color:#134e4a;font-size:16px;margin:0 0 12px 0;">Shipping To</h3>
              <p style="color:#374151;font-size:14px;line-height:1.8;margin:0;">
                ${shippingAddress?.firstName} ${shippingAddress?.lastName}<br/>
                ${shippingAddress?.address}, ${shippingAddress?.city}<br/>
                ${shippingAddress?.state} - ${shippingAddress?.pinCode}<br/>
                Phone: ${shippingAddress?.phone}
              </p>
            </div>
            <div style="text-align:center;">
              <a href="${process.env.CLIENT_URL || 'http://localhost:5173'}/profile" style="display:inline-block;background:linear-gradient(135deg,#0B5D50,#134e4a);color:#fff;text-decoration:none;padding:14px 32px;border-radius:8px;font-size:15px;font-weight:600;">View My Orders</a>
            </div>
          </div>
          <div style="background:#f8f7f4;padding:20px 32px;text-align:center;border-top:1px solid #e5e7eb;">
            <p style="color:#9ca3af;font-size:13px;margin:0;">&#169; 2024 Elora Jewellery. Crafting Timeless Elegance Since 1995.</p>
          </div>
        </div>
      `;

      await sendEmail({
        email: contactEmail,
        subject: `Order Confirmed #${newOrder._id.toString().slice(-8).toUpperCase()} — Elora Jewellery`,
        message: `Your order #${newOrder._id.toString().slice(-8).toUpperCase()} has been confirmed. Total: Rs. ${(pricing?.total || 0).toLocaleString('en-IN')}`,
        html: emailHTML
      });
    } catch (emailError) {
      console.error('Order confirmation email error:', emailError.message);
    }

    return res.status(200).json({
      success: true,
      message: 'Payment verified successfully and order saved',
      order: newOrder
    });
  } catch (error) {
    console.error('Error in verifyPayment:', error);
    res.status(500).json({ success: false, message: 'Internal Server Error', error: error.message });
  }
};
