const Order = require('../models/OrderSchema');
const sendEmail = require('../utils/sendEmail');


// @desc    Get all orders (with pagination, search, and filters)
// @route   GET /api/orders/allorders
// @access  Private/Admin
const getAllOrders = async (req, res) => {
  try {
    const { search, orderStatus, paymentStatus, page = 1, limit, all } = req.query;

    let query = {};

    // Search by Order ID or Customer Name
    if (search) {
      const searchRegex = new RegExp(search, 'i');
      const searchConditions = [
        { 'shippingAddress.firstName': searchRegex },
        { 'shippingAddress.lastName': searchRegex },
        { contactEmail: searchRegex }
      ];

      // If search string is a valid MongoDB ObjectId, add it to the search conditions
      const mongoose = require('mongoose');
      if (mongoose.Types.ObjectId.isValid(search)) {
        searchConditions.push({ _id: search });
      }

      query.$or = searchConditions;
    }

    // Filter by Order Status
    if (orderStatus && orderStatus !== 'All Status' && orderStatus !== 'All' && orderStatus !== '') {
      query.orderStatus = orderStatus;
    }

    // Filter by Payment Status
    if (paymentStatus && paymentStatus !== 'All' && paymentStatus !== '') {
      query.paymentStatus = paymentStatus;
    }

    // Pagination
    const totalOrders = await Order.countDocuments(query);

    let ordersQuery = Order.find(query).sort({ createdAt: -1 }).populate('user', 'name email');

    if (all !== 'true' && limit && limit !== '0' && limit !== '10000') {
      const pageNumber = parseInt(page, 10) || 1;
      const limitNumber = parseInt(limit, 10) || 10;
      const skip = (pageNumber - 1) * limitNumber;
      ordersQuery = ordersQuery.skip(skip).limit(limitNumber);
    }

    const orders = await ordersQuery;

    res.status(200).json({
      success: true,
      count: orders.length,
      totalOrders,
      totalPages: Math.ceil(totalOrders / 10) || 1,
      currentPage: parseInt(page, 10) || 1,
      orders
    });
  } catch (error) {
    console.error('Error in getAllOrders:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// @desc    Get single order by ID
// @route   GET /api/orders/getorder/:id
// @access  Private/Admin
const getOrderById = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    res.status(200).json({ success: true, order });
  } catch (error) {
    console.error('Error in getOrderById:', error);
    if (error.kind === 'ObjectId') {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// @desc    Update order status
// @route   PUT /api/orders/updatestatus/:id
// @access  Private/Admin
const updateOrderStatus = async (req, res) => {
  try {
    const status = req.body.status || req.body.orderStatus;

    // Validate status
    const validStatuses = ['Pending', 'Processing', 'Shipped', 'Out for Delivery', 'Delivered', 'Cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status provided' });
    }

    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    // UI requirement: Orders with Delivered or Cancelled status cannot be updated further.
    if (order.orderStatus === 'Delivered' || order.orderStatus === 'Cancelled') {
      return res.status(400).json({ success: false, message: `Cannot update a ${order.orderStatus} order` });
    }

    order.orderStatus = status;

    // If order status is set to Delivered, automatically mark payment as Paid (especially for Cash on Delivery orders)
    if (status === 'Delivered') {
      order.paymentStatus = 'Paid';
    }

    // Update tracking dates
    if (!order.tracking) {
      order.tracking = { orderedAt: order.createdAt || Date.now() };
    }

    if (status === 'Processing') order.tracking.processedAt = Date.now();
    else if (status === 'Shipped') order.tracking.shippedAt = Date.now();
    else if (status === 'Out for Delivery') order.tracking.outForDeliveryAt = Date.now();
    else if (status === 'Delivered') order.tracking.deliveredAt = Date.now();
    else if (status === 'Cancelled') order.tracking.cancelledAt = Date.now();

    await order.save();

    // Send status update email to customer (non-blocking)
    try {
      const statusMessages = {
        'Processing': 'Your order is being processed.',
        'Shipped': 'Great news! Your order has been shipped and is on its way.',
        'Out for Delivery': 'Your order is out for delivery today!',
        'Delivered': 'Your order has been delivered. Enjoy your jewellery!',
        'Cancelled': 'Your order has been cancelled.'
      };

      const statusColors = {
        'Processing': '#EA580C',
        'Shipped': '#2563EB',
        'Out for Delivery': '#7C3AED',
        'Delivered': '#16A34A',
        'Cancelled': '#DC2626'
      };

      const statusMsg = statusMessages[status];
      if (statusMsg && order.contactEmail) {
        const emailHTML = `
          <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,0.1);">
            <div style="background:linear-gradient(135deg,#0B3D36,#0B5D50);padding:40px 32px;text-align:center;">
              <h1 style="color:#D4AF37;font-family:Georgia,serif;font-size:28px;margin:0 0 8px 0;">Elora Jewellery</h1>
              <p style="color:#fff;font-size:15px;margin:0;opacity:0.9;">Order Update</p>
            </div>
            <div style="padding:32px;">
              <div style="text-align:center;margin-bottom:24px;">
                <span style="display:inline-block;background:${statusColors[status] || '#0B5D50'}22;color:${statusColors[status] || '#0B5D50'};padding:8px 20px;border-radius:20px;font-size:16px;font-weight:700;">${status}</span>
              </div>
              <h2 style="color:#134e4a;font-size:20px;margin:0 0 12px 0;">Order #${order._id.toString().slice(-8).toUpperCase()}</h2>
              <p style="color:#6b7280;font-size:15px;line-height:1.6;">${statusMsg}</p>
              <div style="text-align:center;margin-top:28px;">
                <a href="${process.env.CLIENT_URL || 'http://localhost:5173'}/ordertracking" style="display:inline-block;background:linear-gradient(135deg,#0B5D50,#134e4a);color:#fff;text-decoration:none;padding:14px 32px;border-radius:8px;font-size:15px;font-weight:600;">Track My Order</a>
              </div>
            </div>
            <div style="background:#f8f7f4;padding:20px 32px;text-align:center;border-top:1px solid #e5e7eb;">
              <p style="color:#9ca3af;font-size:13px;margin:0;">&#169; 2024 Elora Jewellery. Crafting Timeless Elegance.</p>
            </div>
          </div>
        `;

        await sendEmail({
          email: order.contactEmail,
          subject: `Order ${status} — #${order._id.toString().slice(-8).toUpperCase()} | Elora Jewellery`,
          message: `Your order #${order._id.toString().slice(-8).toUpperCase()} status has been updated to: ${status}. ${statusMsg}`,
          html: emailHTML
        });
      }
    } catch (emailError) {
      console.error('Order status email error:', emailError.message);
    }

    res.status(200).json({ success: true, message: `Order status updated to ${status}`, order });
  } catch (error) {
    console.error('Error in updateOrderStatus:', error);
    if (error.kind === 'ObjectId') {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// @desc    Get logged in user orders
// @route   GET /api/profile/orders
// @desc    Cancel logged in user order (or item)
// @route   POST /api/profile/orders/:id/cancel
// @access  Private
const cancelMyOrder = async (req, res) => {
  try {
    const mongoose = require('mongoose');
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(404).json({ success: false, message: 'Invalid Order ID' });
    }

    const { itemId, cancelReason } = req.body;
    const query = { _id: req.params.id };

    // Regular users can only cancel their own orders; Admins can cancel any order
    if (req.user.role !== 'Admin') {
      query.user = req.user._id;
    }

    const order = await Order.findOne(query);

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found or not authorized' });
    }

    // Check cancellation eligibility
    const nonCancellableStatuses = ['Shipped', 'Out for Delivery', 'Delivered', 'Cancelled'];
    if (nonCancellableStatuses.includes(order.orderStatus)) {
      return res.status(400).json({
        success: false,
        message: `Order cannot be cancelled because it is already ${order.orderStatus.toLowerCase()}`
      });
    }

    // Prevent duplicate cancellation
    if (order.orderStatus === 'Cancelled') {
      return res.status(400).json({ success: false, message: 'Order is already cancelled' });
    }

    // Handle Item-level cancellation if itemId provided
    if (itemId && order.orderItems && order.orderItems.length > 1) {
      const itemToCancel = order.orderItems.id(itemId) || order.orderItems.find(i => i._id.toString() === itemId || i.product?.toString() === itemId);
      
      if (!itemToCancel) {
        return res.status(404).json({ success: false, message: 'Item not found in order' });
      }

      if (itemToCancel.itemStatus === 'Cancelled') {
        return res.status(400).json({ success: false, message: 'This item is already cancelled' });
      }

      itemToCancel.itemStatus = 'Cancelled';
      
      // Calculate item's proportional refundable amount from total order paid
      const totalSubtotal = order.pricing?.subtotal || order.orderItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
      const itemSubtotal = itemToCancel.price * itemToCancel.quantity;
      const trustedItemRefundable = totalSubtotal > 0
        ? Math.round((itemSubtotal / totalSubtotal) * (order.pricing?.total || 0))
        : itemSubtotal;

      if (order.paymentStatus === 'Paid') {
        itemToCancel.refundStatus = 'Eligible';
        itemToCancel.refundAmount = trustedItemRefundable;
        order.refundStatus = 'Eligible';
        order.refundAmount = (order.refundAmount || 0) + trustedItemRefundable;
      }

      // Check if all items are now cancelled
      const activeItems = order.orderItems.filter(i => i.itemStatus !== 'Cancelled');
      if (activeItems.length === 0) {
        order.orderStatus = 'Cancelled';
        order.cancelReason = cancelReason || 'All items cancelled by user';
        if (!order.tracking) order.tracking = {};
        order.tracking.cancelledAt = Date.now();
      }
    } else {
      // Full Order Cancellation
      order.orderStatus = 'Cancelled';
      order.cancelReason = cancelReason || 'Cancelled by user';
      
      if (!order.tracking) order.tracking = {};
      order.tracking.cancelledAt = Date.now();

      // Mark items as cancelled
      if (order.orderItems) {
        order.orderItems.forEach(item => {
          item.itemStatus = 'Cancelled';
        });
      }

      // Determine refund eligibility based on payment status
      if (order.paymentStatus === 'Paid') {
        order.refundStatus = 'Eligible';
        order.refundAmount = order.pricing?.total || 0;
        if (order.orderItems) {
          order.orderItems.forEach(item => {
            item.refundStatus = 'Eligible';
          });
        }
      } else {
        order.refundStatus = 'None';
        order.refundAmount = 0;
      }
    }

    await order.save();

    res.status(200).json({
      success: true,
      message: 'Order cancelled successfully',
      order
    });
  } catch (error) {
    console.error('Error in cancelMyOrder:', error);
    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
};

// @desc    Get logged in user orders
// @route   GET /api/profile/orders
// @access  Private
const getMyOrders = async (req, res) => {
  try {
    const orders = await Order.find({ user: req.user._id })
      .sort({ createdAt: -1 })
      .populate('user', 'name email');
    return res.status(200).json({ success: true, orders });
  } catch (error) {
    console.error('Error in getMyOrders:', error);
    return res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// @desc    Get logged in user order by ID
// @route   GET /api/profile/orders/:id
// @access  Private
const getMyOrderById = async (req, res) => {
  try {
    const mongoose = require('mongoose');
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(404).json({ success: false, message: 'Invalid Order ID' });
    }
    const order = await Order.findOne({ _id: req.params.id, user: req.user._id })
      .populate('user', 'name email');
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }
    return res.status(200).json({ success: true, order });
  } catch (error) {
    console.error('Error in getMyOrderById:', error);
    return res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// @desc    Process refund for a cancelled order (Admin)
// @route   POST /api/orders/refund/:id
// @access  Private/Admin
const refundOrder = async (req, res) => {
  try {
    const mongoose = require('mongoose');
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(404).json({ success: false, message: 'Invalid Order ID' });
    }

    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    // Verify refund is needed and not already completed
    if (order.refundStatus === 'Refunded') {
      return res.status(400).json({ success: false, message: 'This order has already been refunded' });
    }

    if (order.orderStatus !== 'Cancelled' && order.refundStatus !== 'Eligible') {
      return res.status(400).json({ success: false, message: 'Order is not eligible for refund' });
    }

    // Calculate trusted refund amount server-side
    const trustedRefundAmount = order.refundAmount > 0 ? order.refundAmount : (order.pricing?.total || 0);

    if (trustedRefundAmount <= 0) {
      return res.status(400).json({ success: false, message: 'Refund amount must be greater than zero' });
    }

    let razorpayRefundId = null;
    const razorpayPaymentId = order.paymentDetails?.razorpay_payment_id;

    // Execute Razorpay refund if paid online via Razorpay
    if (razorpayPaymentId && razorpayPaymentId !== 'COD' && !razorpayPaymentId.startsWith('WALLET')) {
      const Razorpay = require('razorpay');
      const razorpay = new Razorpay({
        key_id: process.env.RAZORPAY_KEY_ID || 'dummy_id',
        key_secret: process.env.RAZORPAY_KEY_SECRET || 'dummy_secret',
      });

      try {
        const razorpayRefund = await razorpay.payments.refund(razorpayPaymentId, {
          amount: Math.round(trustedRefundAmount * 100), // paise
          notes: {
            orderId: order._id.toString(),
            reason: 'Admin Initiated Refund'
          }
        });

        if (razorpayRefund && razorpayRefund.id) {
          razorpayRefundId = razorpayRefund.id;
        }
      } catch (rzpError) {
        console.error('Razorpay Refund API Exception:', rzpError);
        
        // Handle common Razorpay API error cases gracefully (e.g. already refunded directly on dashboard)
        if (rzpError.error && rzpError.error.description && rzpError.error.description.includes('already refunded')) {
          razorpayRefundId = `RZP_PREV_REFUND_${Date.now()}`;
        } else if (process.env.NODE_ENV === 'test' || process.env.RAZORPAY_KEY_ID === 'dummy_id') {
          // Development/Test fallback when using dummy credentials
          razorpayRefundId = `RZP_MOCK_REFUND_${Date.now()}`;
        } else {
          return res.status(500).json({
            success: false,
            message: `Razorpay Refund Failed: ${rzpError.error?.description || rzpError.message || 'Payment gateway error'}`
          });
        }
      }
    } else {
      // Wallet or COD refund reference ID
      razorpayRefundId = `REFUND_WAL_${order._id.toString().slice(-8)}_${Date.now()}`;
    }

    // Update order status atomically
    order.paymentStatus = 'Refunded';
    order.refundStatus = 'Refunded';
    order.refundAmount = trustedRefundAmount;
    order.refundId = razorpayRefundId;
    order.refundDate = Date.now();

    if (order.orderItems) {
      order.orderItems.forEach(item => {
        if (item.itemStatus === 'Cancelled') {
          item.refundStatus = 'Refunded';
          item.refundId = razorpayRefundId;
        }
      });
    }

    await order.save();

    // Credit user's wallet if user is associated with order
    if (order.user) {
      const { creditWallet } = require('./walletController');
      try {
        await creditWallet({
          userId: order.user,
          amount: trustedRefundAmount,
          reason: `Order Refund #${order._id.toString().slice(-6).toUpperCase()}`,
          orderId: order._id,
          refundId: razorpayRefundId,
          referenceId: `REFUND_${order._id}_${razorpayRefundId}`
        });
      } catch (walletErr) {
        console.error('Wallet Credit Error on Refund:', walletErr.message);
      }
    }

    res.status(200).json({
      success: true,
      message: `Refund of ₹${trustedRefundAmount.toLocaleString('en-IN')} completed successfully and credited to user wallet.`,
      refundAmount: trustedRefundAmount,
      refundId: razorpayRefundId,
      order
    });
  } catch (error) {
    console.error('Error in refundOrder:', error);
    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
};

module.exports = {
  getAllOrders,
  getOrderById,
  updateOrderStatus,
  getMyOrders,
  getMyOrderById,
  cancelMyOrder,
  refundOrder
};

