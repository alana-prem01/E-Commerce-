const mongoose = require('mongoose');

const addressSchema = new mongoose.Schema({
  country: { type: String, default: '' },
  firstName: { type: String, default: '' },
  lastName: { type: String, default: '' },
  address: { type: String, default: '' },
  city: { type: String, default: '' },
  state: { type: String, default: '' },
  pinCode: { type: String, default: '' },
  phone: { type: String, default: '' },
});

const orderItemSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: false,
  },
  name: { type: String, required: true },
  quantity: { type: Number, required: true, default: 1 },
  price: { type: Number, required: true },
  image: { type: String },
  itemStatus: {
    type: String,
    enum: ['Active', 'Cancelled'],
    default: 'Active',
  },
  refundStatus: {
    type: String,
    enum: ['None', 'Eligible', 'Processing', 'Refunded', 'Failed'],
    default: 'None',
  },
  refundAmount: { type: Number, default: 0 },
  refundId: { type: String },
});

const OrderSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false, // Optional for guest checkout
  },
  contactEmail: {
    type: String,
    required: true,
  },
  shippingAddress: addressSchema,
  billingAddress: addressSchema,
  orderItems: [orderItemSchema],
  couponCode: {
    type: String,
    default: null,
  },
  pricing: {
    subtotal: { type: Number, required: true },
    shipping: { type: Number, required: true },
    tax: { type: Number, required: true },
    discount: { type: Number, default: 0 },
    total: { type: Number, required: true },
    walletContribution: { type: Number, default: 0 },
    razorpayContribution: { type: Number, default: 0 },
  },
  paymentDetails: {
    razorpay_order_id: { type: String },
    razorpay_payment_id: { type: String },
    razorpay_signature: { type: String },
    payment_method: { type: String, default: 'Razorpay' },
  },
  paymentStatus: {
    type: String,
    enum: ['Pending', 'Paid', 'Failed', 'Refunded'],
    default: 'Pending',
  },
  orderStatus: {
    type: String,
    enum: ['Pending', 'Processing', 'Shipped', 'Out for Delivery', 'Delivered', 'Cancelled'],
    default: 'Pending',
  },
  refundStatus: {
    type: String,
    enum: ['None', 'Eligible', 'Processing', 'Refunded', 'Failed'],
    default: 'None',
  },
  refundAmount: {
    type: Number,
    default: 0,
  },
  refundId: {
    type: String,
  },
  refundDate: {
    type: Date,
  },
  cancelReason: {
    type: String,
  },
  tracking: {
    orderedAt: { type: Date, default: Date.now },
    processedAt: { type: Date },
    shippedAt: { type: Date },
    outForDeliveryAt: { type: Date },
    deliveredAt: { type: Date },
    cancelledAt: { type: Date }
  },
  deliveryMethod: {
    type: String,
    enum: ['Standard', 'Express'],
    default: 'Standard',
  }
}, { timestamps: true });

module.exports = mongoose.model('Order', OrderSchema);
