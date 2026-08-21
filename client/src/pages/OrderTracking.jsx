import React, { useState, useEffect } from 'react';
import { useLocation, useParams, Link } from 'react-router-dom';
import { FaArrowLeft, FaCheck } from 'react-icons/fa';
import api from '../utils/api';
import "../css/OrderTracking.css";

function OrderTracking() {
  const location = useLocation();
  const params = useParams();

  // Try retrieving orderId from URL param, location state, or fallback
  const orderId = params.orderId || location.state?.orderId;
  const initialOrder = location.state?.order || null;

  const [order, setOrder] = useState(initialOrder);
  const [loading, setLoading] = useState(!initialOrder);
  const [error, setError] = useState('');

  useEffect(() => {
    let isMounted = true;

    const fetchOrderDetails = async () => {
      try {
        if (!initialOrder) {
          setLoading(true);
        }
        setError('');

        let res;
        if (orderId) {
          // Fetch specific order by ID
          res = await api.get(`/profile/orders/${orderId}`);
          if (res.success && res.order) {
            if (isMounted) setOrder(res.order);
          } else {
            if (isMounted) setError(res.message || 'Order not found');
          }
        } else {
          // Fallback: Fetch user's most recent order if no ID specified
          res = await api.get('/profile/orders');
          if (res.success && res.orders && res.orders.length > 0) {
            if (isMounted) setOrder(res.orders[0]);
          } else {
            if (isMounted) setError('No orders found in your account.');
          }
        }
      } catch (err) {
        console.error('Error fetching order tracking details:', err);
        if (isMounted && !order) {
          setError(err.message || 'Failed to load order details');
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchOrderDetails();

    return () => {
      isMounted = false;
    };
  }, [orderId]);

  // Helper function for status badge style class
  const getBadgeClass = (status = '') => {
    switch (status.toLowerCase()) {
      case 'delivered':
        return 'status-badge delivered';
      case 'in transit':
      case 'intransit':
      case 'shipped':
      case 'out for delivery':
        return 'status-badge in-transit';
      case 'processing':
      case 'pending':
      default:
        return 'status-badge processing';
    }
  };

  // Helper date formatter
  const formatDate = (dateVal) => {
    if (!dateVal) return '—';
    try {
      const d = new Date(dateVal);
      if (isNaN(d.getTime())) return '—';
      return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
    } catch {
      return '—';
    }
  };

  if (loading && !order) {
    return (
      <div className="order-tracking-container" style={{ textAlign: 'center', padding: '80px 20px' }}>
        <p style={{ fontSize: '16px', color: 'var(--primary-color)', fontWeight: 500 }}>
          Loading order tracking details...
        </p>
      </div>
    );
  }

  if (error && !order) {
    return (
      <div className="order-tracking-container" style={{ textAlign: 'center', padding: '60px 20px' }}>
        <Link to="/profile" className="back-link">
          <FaArrowLeft size={12} /> Back to Orders
        </Link>
        <h2 style={{ fontSize: '24px', color: 'var(--secondary-color)', margin: '24px 0 12px 0' }}>
          Order Not Found
        </h2>
        <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '24px' }}>
          {error}
        </p>
        <Link
          to="/profile"
          style={{
            display: 'inline-block',
            padding: '10px 24px',
            backgroundColor: 'var(--primary-color)',
            color: '#fff',
            borderRadius: '6px',
            textDecoration: 'none',
            fontWeight: 500,
            fontSize: '14px'
          }}
        >
          View All Orders
        </Link>
      </div>
    );
  }

  if (!order) return null;

  // Compute dynamic tracking steps
  const status = order.orderStatus || 'Processing';
  let currentStepIndex = 0;
  if (status === 'Pending') currentStepIndex = 0;
  else if (status === 'Processing') currentStepIndex = 1;
  else if (status === 'Shipped') currentStepIndex = 2;
  else if (status === 'Out for Delivery') currentStepIndex = 3;
  else if (status === 'Delivered') currentStepIndex = 4;
  else if (status === 'Cancelled') currentStepIndex = 0;

  const tracking = order.tracking || {};
  const steps = [
    { label: 'Ordered', date: formatDate(tracking.orderedAt || order.createdAt) },
    { label: 'Processed', date: formatDate(tracking.processedAt || (currentStepIndex >= 1 ? order.createdAt : null)) },
    { label: 'Shipped', date: formatDate(tracking.shippedAt) },
    { label: 'Out for Delivery', date: formatDate(tracking.outForDeliveryAt) },
    { label: 'Delivered', date: formatDate(tracking.deliveredAt) },
  ];

  const progressPercent = (currentStepIndex / (steps.length - 1)) * 100;
  const displayId = order._id ? order._id.toString().slice(-6).toUpperCase() : (order.id || 'N/A');
  const placedDateStr = formatDate(order.createdAt);

  const shippingAddr = order.shippingAddress || {};
  const shippingName = `${shippingAddr.firstName || ''} ${shippingAddr.lastName || ''}`.trim() || 'Valued Customer';
  const shippingCityStateZip = [
    shippingAddr.city,
    shippingAddr.state,
    shippingAddr.pinCode
  ].filter(Boolean).join(', ');

  const paymentDet = order.paymentDetails || {};
  const paymentMethodType = paymentDet.payment_method || 'Online Payment';
  const paymentCardDetails = paymentDet.razorpay_payment_id
    ? `Transaction ID: ${paymentDet.razorpay_payment_id}`
    : (order.paymentStatus === 'Paid' ? 'Paid Online' : 'Cash on Delivery');
  const billingName = `${order.billingAddress?.firstName || shippingAddr.firstName || ''} ${order.billingAddress?.lastName || shippingAddr.lastName || ''}`.trim() || order.contactEmail || 'Customer';

  const orderItems = (order.orderItems || []).map((item, index) => ({
    id: item._id || item.product || index,
    name: item.name || 'Jewellery Item',
    qty: item.quantity || 1,
    price: `₹${((item.price || 0) * (item.quantity || 1)).toLocaleString('en-IN')}`,
    image: item.image || 'https://images.unsplash.com/photo-1605100804763-247f67b3557e?auto=format&fit=crop&q=80&w=200'
  }));

  const pricing = order.pricing || {};
  const subtotalStr = `₹${(pricing.subtotal || 0).toLocaleString('en-IN')}`;
  const shippingStr = pricing.shipping === 0 ? 'Free' : `₹${(pricing.shipping || 0).toLocaleString('en-IN')}`;
  const taxStr = pricing.tax !== undefined && pricing.tax > 0 ? `₹${pricing.tax.toLocaleString('en-IN')}` : null;
  const discountStr = pricing.discount !== undefined && pricing.discount > 0 ? `-₹${pricing.discount.toLocaleString('en-IN')}` : null;
  const totalStr = `₹${(pricing.total || 0).toLocaleString('en-IN')}`;

  return (
    <div className="order-tracking-container">
      {/* 1. Back Link */}
      <Link to="/profile" className="back-link">
        <FaArrowLeft size={12} /> Back to Orders
      </Link>

      {/* 2. Order Header */}
      <div className="order-header">
        <div className="order-title-group">
          <h1 className="order-title">Order #{displayId}</h1>
          <p className="order-subtext">Placed on {placedDateStr}</p>
        </div>
        <span className={getBadgeClass(status)}>{status}</span>
      </div>

      {/* 3. Tracking Card */}
      <div className="tracking-card">
        <div className="timeline-container">
          <div className="timeline-track">
            <div
              className="timeline-progress-line"
              style={{
                width: `${progressPercent}%`,
                '--vertical-progress': `${progressPercent}%`,
              }}
            ></div>
          </div>

          <div className="timeline-steps">
            {steps.map((step, index) => {
              const isCompleted = index < currentStepIndex;
              const isCurrent = index === currentStepIndex;
              const isPending = index > currentStepIndex;

              return (
                <div key={index} className="timeline-step">
                  {/* Dot */}
                  {isCompleted && (
                    <div className="step-dot completed">
                      <FaCheck size={12} />
                    </div>
                  )}
                  {isCurrent && (
                    <div className="step-dot current">
                      <div className="inner-emerald-dot"></div>
                    </div>
                  )}
                  {isPending && (
                    <div className="step-dot pending">
                      <div className="inner-gray-dot"></div>
                    </div>
                  )}

                  {/* Text labels */}
                  <div>
                    <div className={`step-label ${isPending ? 'pending' : 'active'}`}>
                      {step.label}
                    </div>
                    <div className="step-date">{step.date}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* 4. Order Details Card */}
      <div className="tracking-card">
        <div className="details-grid">
          <div>
            <div className="info-label">Shipping Address</div>
            <div className="info-text">
              <span className="name-line">{shippingName}</span>
              <br />
              {shippingAddr.address || 'Address provided during checkout'}
              <br />
              {shippingCityStateZip && (
                <>
                  {shippingCityStateZip}
                  <br />
                </>
              )}
              {shippingAddr.phone && (
                <>
                  Phone: {shippingAddr.phone}
                </>
              )}
            </div>
          </div>

          <div>
            <div className="info-label">Payment Method</div>
            <div className="info-text">
              <span className="name-line">{paymentMethodType}</span>
              <br />
              {paymentCardDetails}
              <br />
              {billingName}
            </div>
          </div>
        </div>
      </div>

      {/* 5. Items Card */}
      <div className="tracking-card">
        <div className="items-list">
          {orderItems.length > 0 ? (
            orderItems.map((item, idx) => (
              <div key={item.id || idx} className="item-row">
                <img src={item.image} alt={item.name} className="item-image" />
                <div className="item-details">
                  <span className="item-name">{item.name}</span>
                  <span className="item-qty">Qty: {item.qty}</span>
                </div>
                <span className="item-price">{item.price}</span>
              </div>
            ))
          ) : (
            <div style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
              No product details recorded for this order.
            </div>
          )}
        </div>
      </div>

      {/* 6. Order Summary Card */}
      <div className="tracking-card">
        <div className="summary-rows">
          <div className="summary-row">
            <span>Subtotal</span>
            <span>{subtotalStr}</span>
          </div>
          <div className="summary-row">
            <span>Shipping</span>
            <span>{shippingStr}</span>
          </div>
          {taxStr && (
            <div className="summary-row">
              <span>Tax</span>
              <span>{taxStr}</span>
            </div>
          )}
          {discountStr && (
            <div className="summary-row" style={{ color: '#16a34a' }}>
              <span>Discount</span>
              <span>{discountStr}</span>
            </div>
          )}
          <div className="summary-row total-row">
            <span>Total</span>
            <span>{totalStr}</span>
          </div>
        </div>
      </div>

      {/* 7. Help Text */}
      <div className="help-text">
        Need assistance with your order?{' '}
        <Link to="/contact" className="help-link">
          Contact us
        </Link>
      </div>
    </div>
  );
}

export default OrderTracking;