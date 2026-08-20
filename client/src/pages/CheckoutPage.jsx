import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useCart } from '../utils/CartContext';
import api from '../utils/api';
import '../css/CheckoutPage.css';

const AddressForm = ({ data, setData }) => (
  <div className="checkout-form-grid">
    <div className="checkout-input-group w-full">
      <select className="checkout-select" value={data.country} onChange={e => setData({...data, country: e.target.value})}>
        <option value="" disabled>Country/Region</option>
        <option value="IN">India</option>
        <option value="US">United States</option>
      </select>
    </div>
    <div className="checkout-input-group w-half">
      <input className="checkout-input" placeholder="First Name" value={data.firstName} onChange={e => setData({...data, firstName: e.target.value})} />
    </div>
    <div className="checkout-input-group w-half">
      <input className="checkout-input" placeholder="Last Name" value={data.lastName} onChange={e => setData({...data, lastName: e.target.value})} />
    </div>
    <div className="checkout-input-group w-full">
      <div className="checkout-input-wrapper">
        <svg className="checkout-input-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
          <circle cx="12" cy="10" r="3"></circle>
        </svg>
        <input className="checkout-input with-icon" placeholder="Address" value={data.address} onChange={e => setData({...data, address: e.target.value})} />
      </div>
    </div>
    <div className="checkout-input-group w-half">
      <input className="checkout-input" placeholder="City" value={data.city} onChange={e => setData({...data, city: e.target.value})} />
    </div>
    <div className="checkout-input-group w-quarter">
      <select className="checkout-select" value={data.state} onChange={e => setData({...data, state: e.target.value})}>
        <option value="" disabled>State</option>
        <option value="MH">MH</option>
        <option value="DL">DL</option>
      </select>
    </div>
    <div className="checkout-input-group w-quarter">
      <input className="checkout-input" placeholder="PIN Code" value={data.pinCode} onChange={e => setData({...data, pinCode: e.target.value})} />
    </div>
    <div className="checkout-input-group w-full">
      <div className="checkout-input-wrapper">
        <svg className="checkout-input-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
        </svg>
        <input className="checkout-input with-icon" placeholder="Phone Number" value={data.phone} onChange={e => setData({...data, phone: e.target.value})} />
      </div>
    </div>
  </div>
);

export default function CheckoutPage() {
  const { cartItems, subtotal, clearCart } = useCart();
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState('');
  const [shippingMethod, setShippingMethod] = useState('standard');
  const [paymentMethod, setPaymentMethod] = useState('card');
  const [billingAddressType, setBillingAddressType] = useState('same');
  const [saveAddress, setSaveAddress] = useState(false);
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [couponError, setCouponError] = useState('');
  const [applyingCoupon, setApplyingCoupon] = useState(false);

  const navigate = useNavigate();

  const [shipping, setShipping] = useState({
    country: '', firstName: '', lastName: '', address: '', city: '', state: '', pinCode: '', phone: ''
  });

  const [billing, setBilling] = useState({
    country: '', firstName: '', lastName: '', address: '', city: '', state: '', pinCode: '', phone: ''
  });

  const currentSubtotal = subtotal || 0;
  const shippingCost = shippingMethod === 'standard' ? 5 : 15;
  const tax = currentSubtotal > 0 ? 110 : 0;
  const discount = appliedCoupon ? appliedCoupon.discountAmount : 0;
  const finalAmount = Math.max(0, currentSubtotal + shippingCost + tax - discount);

  const validateEmail = (val) => {
    if (!val) return "Email is required.";
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!re.test(val)) return "Please enter a valid email.";
    return "";
  };

  const handleEmailChange = (e) => {
    setEmail(e.target.value);
    if (emailError) setEmailError(validateEmail(e.target.value));
  };

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) {
      setCouponError('Please enter a coupon code');
      return;
    }
    setApplyingCoupon(true);
    setCouponError('');
    try {
      const res = await axios.post('/api/coupons/apply', {
        code: couponCode,
        orderAmount: currentSubtotal
      });
      if (res.data.success) {
        setAppliedCoupon(res.data.coupon);
        setCouponCode('');
        toast.success(res.data.message);
      }
    } catch (err) {
      setCouponError(err.response?.data?.message || 'Failed to apply coupon');
      setAppliedCoupon(null);
    } finally {
      setApplyingCoupon(false);
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    toast.info('Coupon removed');
  };

  const handlePay = async () => {
    const err = validateEmail(email);
    if (err) {
      setEmailError(err);
      return;
    }

    if (!acceptTerms) {
      toast.error('You must accept the Privacy Policy and Terms of Service.');
      return;
    }

    if (paymentMethod === 'cod') {
      toast.success('Order placed successfully via Cash on Delivery!');
      navigate('/');
      return;
    }

    setIsSubmitting(true);
    try {
      const isValidHex = (val) => typeof val === 'string' && /^[0-9a-fA-F]{24}$/.test(val);
      const formattedOrderItems = (cartItems || []).map(item => {
        const rawId = item._id || item.product || item.id;
        return {
          product: isValidHex(rawId) ? rawId : undefined,
          name: item.title || item.name || 'Jewellery Item',
          quantity: item.quantity,
          price: item.price,
          image: item.image
        };
      });

      // 1. Create Razorpay order via backend
      const orderData = await api.post('/payment/create-order', {
        amount: finalAmount,
        currency: 'INR'
      });

      if (!orderData.success) {
        toast.error('Failed to initiate payment');
        setIsSubmitting(false);
        return;
      }

      // 2. Configure Razorpay checkout
      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID,
        amount: orderData.order.amount,
        currency: orderData.order.currency,
        name: 'ELORA Jewellery',
        description: 'Order Payment',
        order_id: orderData.order.id,
        handler: async function (response) {
          try {
            const userStr = localStorage.getItem("user");
            const loggedInUser = userStr ? JSON.parse(userStr) : null;
            const userId = loggedInUser?._id || loggedInUser?.id || null;

            // 3. Verify Payment
            const verifyData = await api.post('/payment/verify-payment', {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              contactEmail: email,
              shippingAddress: shipping,
              billingAddress: billingAddressType === 'same' ? shipping : billing,
              orderItems: formattedOrderItems,
              pricing: { 
                subtotal: currentSubtotal,
                shipping: shippingCost,
                tax: tax,
                discount: discount,
                total: finalAmount 
              },
              user: userId
            });

            if (verifyData.success) {
              toast.success('Payment successful!');
              clearCart();
              navigate('/payment-success');
            } else {
              toast.error('Payment verification failed');
            }
          } catch (error) {
            console.error('Verify error:', error);
            toast.error('Payment verification failed');
          }
        },
        prefill: {
          name: shipping.firstName + ' ' + shipping.lastName,
          email: email,
          contact: shipping.phone,
        },
        theme: {
          color: '#D4AF37', // Gold color
        },
      };

      const rzp = new window.Razorpay(options);
      
      rzp.on('payment.failed', function (response){
        toast.error('Payment failed: ' + response.error.description);
      });

      rzp.open();
    } catch (error) {
      console.error('Checkout error:', error);
      toast.error('Something went wrong during checkout');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="checkout-page-wrapper">
      <div className="checkout-container">
        {/* LEFT SECTION */}
        <div className="checkout-left-section">
          
          {/* Section 2 – Page Header */}
          <div>
            <h1 className="checkout-page-title">Checkout</h1>
            <p className="checkout-subtitle">Complete your order securely.</p>
            <p className="checkout-breadcrumb">Home &gt; Cart &gt; Checkout</p>
          </div>

          {/* Section 3 – Contact Information */}
          <div className="checkout-card">
            <h2 className="checkout-section-title">Contact Information</h2>
            <div className="checkout-input-group">
              <div className="checkout-input-wrapper">
                <svg className="checkout-input-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                  <polyline points="22,6 12,13 2,6"></polyline>
                </svg>
                <input 
                  className="checkout-input with-icon" 
                  type="email" 
                  placeholder="Email Address"
                  value={email}
                  onChange={handleEmailChange}
                />
              </div>
              {emailError && <div className="checkout-validation-msg">{emailError}</div>}
            </div>
          </div>

          {/* Section 4 – Shipping Address */}
          <div className="checkout-card">
            <h2 className="checkout-section-title">Shipping Address</h2>
            <AddressForm data={shipping} setData={setShipping} />
            <div className="checkout-checkbox-wrapper">
              <input 
                type="checkbox" 
                className="checkout-checkbox" 
                id="saveAddress" 
                checked={saveAddress} 
                onChange={(e) => setSaveAddress(e.target.checked)} 
              />
              <label htmlFor="saveAddress" className="checkout-checkbox-label">Save this information for next time</label>
            </div>
          </div>

          {/* Section 5 – Shipping Method */}
          <div className="checkout-card">
            <h2 className="checkout-section-title">Shipping Method</h2>
            
            <div 
              className={`checkout-shipping-card ${shippingMethod === 'standard' ? 'selected' : ''}`}
              onClick={() => setShippingMethod('standard')}
            >
              <svg className="checkout-shipping-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="1" y="3" width="15" height="13"></rect>
                <polygon points="16 8 20 8 23 11 23 16 16 16 16 8"></polygon>
                <circle cx="5.5" cy="18.5" r="2.5"></circle>
                <circle cx="18.5" cy="18.5" r="2.5"></circle>
              </svg>
              <div className="checkout-shipping-info">
                <p className="checkout-shipping-name">Standard Shipping</p>
                <p className="checkout-shipping-est">3-5 Business Days</p>
              </div>
              <div className="checkout-shipping-price">$5.00</div>
            </div>

            <div 
              className={`checkout-shipping-card ${shippingMethod === 'express' ? 'selected' : ''}`}
              onClick={() => setShippingMethod('express')}
            >
              <svg className="checkout-shipping-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="1" y="3" width="15" height="13"></rect>
                <polygon points="16 8 20 8 23 11 23 16 16 16 16 8"></polygon>
                <circle cx="5.5" cy="18.5" r="2.5"></circle>
                <circle cx="18.5" cy="18.5" r="2.5"></circle>
              </svg>
              <div className="checkout-shipping-info">
                <p className="checkout-shipping-name">Express Shipping</p>
                <p className="checkout-shipping-est">1-2 Business Days</p>
              </div>
              <div className="checkout-shipping-price">$15.00</div>
            </div>
          </div>

          {/* Section 6 – Payment */}
          <div className="checkout-card">
            <h2 className="checkout-section-title">Payment</h2>
            <div className="checkout-security-msg">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
              </svg>
              All transactions are secure and encrypted.
            </div>

            <div 
              className={`checkout-payment-card ${paymentMethod === 'card' ? 'selected' : ''}`}
              onClick={() => setPaymentMethod('card')}
            >
              <input type="radio" className="checkout-payment-radio" checked={paymentMethod === 'card'} readOnly />
              <svg className="checkout-payment-icon" style={{ marginLeft: '16px' }} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="1" y="4" width="22" height="16" rx="2" ry="2"></rect>
                <line x1="1" y1="10" x2="23" y2="10"></line>
              </svg>
              <div className="checkout-payment-name">Credit Card (Razorpay)</div>
            </div>
            
            {paymentMethod === 'card' && (
              <div className="checkout-payment-info-card" style={{ marginBottom: '16px' }}>
                You will be redirected to Razorpay securely to complete your purchase.
              </div>
            )}

            <div 
              className={`checkout-payment-card ${paymentMethod === 'cod' ? 'selected' : ''}`}
              onClick={() => setPaymentMethod('cod')}
            >
              <input type="radio" className="checkout-payment-radio" checked={paymentMethod === 'cod'} readOnly />
              <svg className="checkout-payment-icon" style={{ marginLeft: '16px' }} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="5" width="20" height="14" rx="2"></rect>
                <line x1="2" y1="10" x2="22" y2="10"></line>
              </svg>
              <div className="checkout-payment-name">Cash on Delivery</div>
            </div>
          </div>

          {/* Section 7 – Billing Address */}
          <div className="checkout-card">
            <h2 className="checkout-section-title">Billing Address</h2>
            <div className="checkout-billing-radio-group">
              <label className="checkout-billing-radio-wrapper">
                <input 
                  type="radio" 
                  className="checkout-payment-radio" 
                  checked={billingAddressType === 'same'} 
                  onChange={() => setBillingAddressType('same')}
                />
                <span className="checkout-checkbox-label">Same as shipping address</span>
              </label>
              <label className="checkout-billing-radio-wrapper">
                <input 
                  type="radio" 
                  className="checkout-payment-radio" 
                  checked={billingAddressType === 'different'} 
                  onChange={() => setBillingAddressType('different')}
                />
                <span className="checkout-checkbox-label">Use a different billing address</span>
              </label>
            </div>
            
            {billingAddressType === 'different' && (
              <AddressForm data={billing} setData={setBilling} />
            )}
          </div>

        </div>

        {/* RIGHT SECTION (Order Summary) */}
        <div className="checkout-right-section">
          <div className="checkout-card checkout-summary-wrapper">
            <h2 className="checkout-section-title">Order Summary</h2>
            
            {/* Section 8 – Order Summary */}
            {cartItems && cartItems.length > 0 ? (
              cartItems.map((item, index) => (
                <div key={item.id || item._id || index} className="checkout-product-card">
                  <div className="checkout-product-img">
                    {item.image && (
                      <img 
                        src={item.image} 
                        alt={item.title || item.name} 
                        style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '8px' }} 
                      />
                    )}
                  </div>
                  <div className="checkout-product-info">
                    <h3 className="checkout-product-name">{item.title || item.name}</h3>
                    <p className="checkout-product-qty">Qty: {item.quantity}</p>
                  </div>
                  <div className="checkout-product-price">${(item.price * item.quantity).toFixed(2)}</div>
                </div>
              ))
            ) : (
              <div style={{ padding: '16px 0', color: 'var(--text-secondary)', textAlign: 'center' }}>
                Your cart is empty.
              </div>
            )}

            {/* Section 9 – Price Summary */}
            <div className="checkout-price-row">
              <span>Subtotal</span>
              <span>${currentSubtotal.toFixed(2)}</span>
            </div>
            <div className="checkout-price-row">
              <span>Shipping</span>
              <span>${shippingMethod === 'standard' ? '5.00' : '15.00'}</span>
            </div>
            <div className="checkout-price-row">
              <span>Tax</span>
              <span>${tax.toFixed(2)}</span>
            </div>
            
            {/* Coupon Section */}
            <div className="checkout-coupon-section" style={{ margin: '16px 0', padding: '16px', backgroundColor: 'var(--bg-lighter)', borderRadius: '8px' }}>
              <h3 style={{ fontSize: '14px', fontWeight: 600, marginBottom: '8px' }}>Discount Code</h3>
              {appliedCoupon ? (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#e8f5f3', padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--primary-color-hover)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontWeight: 600, color: 'var(--primary-color-hover)' }}>{appliedCoupon.code}</span>
                  </div>
                  <button onClick={handleRemoveCoupon} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '18px' }}>&times;</button>
                </div>
              ) : (
                <div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <input 
                      type="text" 
                      value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                      placeholder="Enter code" 
                      style={{ flex: 1, padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '14px', outline: 'none' }}
                    />
                    <button 
                      onClick={handleApplyCoupon}
                      disabled={applyingCoupon || !couponCode.trim()}
                      style={{ padding: '8px 16px', backgroundColor: couponCode.trim() ? 'var(--primary-color-hover)' : 'var(--border-color)', color: couponCode.trim() ? 'white' : '#9ca3af', border: 'none', borderRadius: '6px', cursor: couponCode.trim() ? 'pointer' : 'not-allowed', fontWeight: 500 }}
                    >
                      {applyingCoupon ? 'Applying...' : 'Apply'}
                    </button>
                  </div>
                  {couponError && <p style={{ color: 'var(--danger)', fontSize: '12px', marginTop: '6px' }}>{couponError}</p>}
                </div>
              )}
            </div>

            {discount > 0 && (
              <div className="checkout-price-row checkout-price-discount" style={{ color: 'var(--success)', fontWeight: 500 }}>
                <span>Discount ({appliedCoupon?.code})</span>
                <span>-${discount.toFixed(2)}</span>
              </div>
            )}

            <div className="checkout-price-divider"></div>

            <div className="checkout-total-row">
              <span>Total</span>
              <span>${finalAmount.toFixed(2)}</span>
            </div>

            {/* Privacy Terms */}
            <div style={{ marginTop: '16px', marginBottom: '16px' }}>
              <label className="checkout-checkbox-wrapper" style={{ cursor: 'pointer', alignItems: 'flex-start' }}>
                <input
                  type="checkbox"
                  checked={acceptTerms}
                  onChange={(e) => setAcceptTerms(e.target.checked)}
                  className="checkout-checkbox"
                  style={{ marginTop: '4px' }}
                />
                <span className="checkout-checkbox-label" style={{ lineHeight: '1.5' }}>
                  I accept the Privacy Policy and Terms of Service.
                </span>
              </label>
            </div>

            {/* Section 10 – Action Buttons */}
            <div className="checkout-bottom-actions">
              <button 
                className="checkout-pay-btn" 
                onClick={handlePay}
                disabled={isSubmitting || !cartItems || cartItems.length === 0}
              >
                Pay Now
              </button>
              <button 
                className="checkout-back-btn"
                onClick={() => navigate('/cart')}
              >
                Back to Cart
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
