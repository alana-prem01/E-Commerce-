const Order = require('../models/OrderSchema');
const sendEmail = require('../utils/sendEmail');


// @desc    Get all orders (with pagination, search, and filters)
// @route   GET /api/orders/allorders
// @access  Private/Admin
const getAllOrders = async (req, res) => {
  try {
    const { search, orderStatus, paymentStatus, page = 1, limit = 10 } = req.query;
    
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
    const pageNumber = parseInt(page, 10) || 1;
    const limitNumber = parseInt(limit, 10) || 10;
    const skip = (pageNumber - 1) * limitNumber;

    const orders = await Order.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNumber)
      .populate('user', 'name email');

    const totalOrders = await Order.countDocuments(query);
    const totalPages = Math.ceil(totalOrders / limitNumber);

    res.status(200).json({ 
      success: true, 
      count: orders.length,
      totalOrders,
      totalPages,
      currentPage: pageNumber,
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
// @access  Private
const getMyOrders = async (req, res) => {
  try {
    const orders = await Order.find({ user: req.user._id }).sort({ createdAt: -1 });
    res.status(200).json({ success: true, count: orders.length, orders });
  } catch (error) {
    console.error('Error in getMyOrders:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// @desc    Get logged in user single order by ID
// @route   GET /api/profile/orders/:id
// @access  Private
const getMyOrderById = async (req, res) => {
  try {
    const mongoose = require('mongoose');
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(404).json({ success: false, message: 'Invalid Order ID' });
    }

    const query = { _id: req.params.id };
    if (req.user.role !== 'Admin') {
      query.user = req.user._id;
    }

    const order = await Order.findOne(query);

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    res.status(200).json({ success: true, order });
  } catch (error) {
    console.error('Error in getMyOrderById:', error);
    if (error.kind === 'ObjectId') {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

module.exports = {
  getAllOrders,
  getOrderById,
  updateOrderStatus,
  getMyOrders,
  getMyOrderById
};
