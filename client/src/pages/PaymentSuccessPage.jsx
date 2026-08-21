import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import '../css/PaymentSuccessPage.css';

const PaymentSuccessPage = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // Retrieve actual completed order details from router state or localStorage fallback
  const lastOrderStr = localStorage.getItem('lastCompletedOrder');
  const lastOrder = lastOrderStr ? JSON.parse(lastOrderStr) : null;
  const order = location.state?.order || lastOrder;

  // Format real values dynamically
  const rawId = order?._id || order?.id || '';
  const orderIdDisplay = rawId ? `#${rawId.toString().slice(-8).toUpperCase()}` : '#ORD-PENDING';
  
  const txnIdDisplay = order?.paymentDetails?.razorpay_payment_id || order?.paymentDetails?.transactionId || 'N/A';
  
  const paymentMethodDisplay = order?.paymentDetails?.payment_method || 'Razorpay';
  
  const totalAmount = order?.pricing?.total ?? order?.total ?? 0;
  const amountDisplay = `₹${Number(totalAmount).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  const orderDate = order?.createdAt ? new Date(order.createdAt) : new Date();
  const dateDisplay = orderDate.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });

  return (
    <div className="psp-overlay-container" id="success-popup">
      {/* Popup Container */}
      <div className="psp-popup-container">
        
        {/* Close Button */}
        <button className="psp-close-button" id="close-btn" onClick={() => navigate('/')}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M18 6L6 18M6 6L18 18" stroke="var(--text-secondary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>

        {/* Section 2 – Success Icon */}
        <div className="psp-icon-container">
          {/* Success Icon: Check Circle */}
          <svg className="psp-success-icon" width="52" height="52" viewBox="0 0 52 52" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M26 47.6667C37.9662 47.6667 47.6667 37.9662 47.6667 26C47.6667 14.0338 37.9662 4.33333 26 4.33333C14.0338 4.33333 4.33333 14.0338 4.33333 26C4.33333 37.9662 14.0338 47.6667 26 47.6667Z" stroke="var(--success)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M19.5 26L23.8333 30.3333L32.5 21.6667" stroke="var(--success)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>

        {/* Section 3 – Success Message */}
        <div className="psp-message-section">
          <h1 className="psp-heading">Payment Successful</h1>
          <p className="psp-description">Your payment has been successfully processed.</p>
        </div>

        {/* Section 4 – Payment Details */}
        <div className="psp-details-card">
          <div className="psp-detail-row">
            <span className="psp-detail-label">Order ID</span>
            <span className="psp-detail-value">{orderIdDisplay}</span>
          </div>
          <div className="psp-detail-row">
            <span className="psp-detail-label">Transaction ID</span>
            <span className="psp-detail-value">{txnIdDisplay}</span>
          </div>
          <div className="psp-detail-row">
            <span className="psp-detail-label">Payment Method</span>
            <span className="psp-detail-value">{paymentMethodDisplay}</span>
          </div>
          <div className="psp-detail-row">
            <span className="psp-detail-label">Amount Paid</span>
            <span className="psp-detail-value">{amountDisplay}</span>
          </div>
          <div className="psp-detail-row">
            <span className="psp-detail-label">Payment Date &amp; Time</span>
            <span className="psp-detail-value">{dateDisplay}</span>
          </div>
        </div>

        {/* Section 5 – Action Buttons */}
        <div className="psp-button-container">
          <button className="psp-primary-button" id="view-order-btn" onClick={() => navigate('/profile')}>View Order</button>
          <button className="psp-secondary-button" id="continue-shopping-btn" onClick={() => navigate('/')}>Continue Shopping</button>
        </div>

      </div>
    </div>
  );
};

export default PaymentSuccessPage;
