import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FaTimes, FaPlus, FaMinus, FaTrashAlt, FaChevronDown, FaChevronUp } from 'react-icons/fa';
import { useCart } from '../utils/CartContext';
import '../css/Cart.css';

/**
 * Cart component has two render modes:
 *
 * 1. DRAWER mode  – when `onClose` prop is provided (e.g. from a sidebar toggle).
 *    Renders the existing overlay + slide-in drawer UI.
 *
 * 2. PAGE mode    – when used as the /cart route (no `onClose`).
 *    Renders a clean full-page layout without the overlay/drawer wrapper.
 */
function Cart({ isOpen = true, onClose }) {
  const navigate = useNavigate();
  const isPageMode = false; // force drawer mode only

  const {
    cartItems,
    removeFromCart,
    updateQuantity,
    totalItemCount,
    subtotal,
    cartNotes,
    setCartNotes,
  } = useCart();

  const [notesOpen, setNotesOpen] = useState(false);

  const handleQuantityChange = (id, newQty) => {
    updateQuantity(id, newQty);
  };

  const handleRemoveItem = (id) => {
    removeFromCart(id);
  };

  const handleCheckout = () => {
    if (onClose) onClose();
    navigate('/checkout');
  };

  // ──────────────────────────────────────────────
  // PAGE MODE – full-page standalone layout
  // ──────────────────────────────────────────────
  if (isPageMode) {
    return (
      <div className="cart-page-wrapper" style={{ minHeight: '70vh', padding: '2rem 1rem', maxWidth: '900px', margin: '0 auto' }}>
        <h1 style={{ fontFamily: 'var(--heading-font)', fontSize: '2rem', marginBottom: '1.5rem' }}>
          Your Cart {totalItemCount > 0 && <span style={{ fontSize: '1rem', color: 'var(--text-secondary)' }}>({totalItemCount} item{totalItemCount !== 1 ? 's' : ''})</span>}
        </h1>

        {cartItems.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '4rem 0' }}>
            <h3 style={{ marginBottom: '1rem', color: 'var(--text-medium)' }}>Your cart is empty</h3>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
              Have an account?{' '}
              <Link to="/login" style={{ color: 'var(--primary-color-hover)', textDecoration: 'underline' }}>Log in</Link>
              {' '}to check out faster.
            </p>
            <button
              className="continue-shopping-btn"
              onClick={() => navigate('/best-sellers')}
              style={{ padding: '0.75rem 2rem', background: 'var(--primary-color-hover)', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '1rem' }}
            >
              Continue Shopping
            </button>
          </div>
        ) : (
          <>
            {/* Cart Items */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '2rem' }}>
              {cartItems.map((item) => (
                <div key={item.id} className="cart-product-card" style={{ display: 'flex', gap: '1rem', alignItems: 'center', padding: '1rem', border: '1px solid var(--border-color)', borderRadius: '10px' }}>
                  <Link to={`/product/${item.id}`} style={{ flexShrink: 0 }}>
                    <img src={item.image} alt={item.title} style={{ width: '80px', height: '80px', objectFit: 'cover', borderRadius: '8px' }} />
                  </Link>

                  <div style={{ flex: 1 }}>
                    <Link to={`/product/${item.id}`} style={{ fontWeight: '600', color: 'var(--text-dark)', textDecoration: 'none', fontFamily: 'var(--heading-font)', fontSize: '1.1rem' }}>
                      {item.title}
                    </Link>
                    {item.variant && <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: '2px' }}>{item.variant}</div>}
                    <div style={{ color: 'var(--primary-color-hover)', fontWeight: '600', marginTop: '4px' }}>Rs. {Number(item.price).toFixed(2)}</div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.75rem' }}>
                      <div className="quantity-selector" style={{ display: 'flex', alignItems: 'center', border: '1px solid #D1D5DB', borderRadius: '6px', overflow: 'hidden' }}>
                        <button
                          className="quantity-btn"
                          onClick={() => handleQuantityChange(item.id, item.quantity - 1)}
                          aria-label="Decrease quantity"
                        >
                          <FaMinus size={10} />
                        </button>
                        <input
                          type="number"
                          className="quantity-input"
                          value={item.quantity}
                          min="1"
                          onChange={(e) => handleQuantityChange(item.id, e.target.value)}
                          aria-label="Product quantity"
                          style={{ width: '40px', textAlign: 'center', border: 'none', outline: 'none', padding: '4px' }}
                        />
                        <button
                          className="quantity-btn"
                          onClick={() => handleQuantityChange(item.id, item.quantity + 1)}
                          aria-label="Increase quantity"
                        >
                          <FaPlus size={10} />
                        </button>
                      </div>

                      <button
                        className="item-remove-btn"
                        onClick={() => handleRemoveItem(item.id)}
                        aria-label="Remove item"
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#EF4444', padding: '4px 8px' }}
                      >
                        <FaTrashAlt size={14} />
                      </button>

                      <span style={{ marginLeft: 'auto', fontWeight: '600', color: 'var(--text-dark)' }}>
                        Rs. {(item.price * item.quantity).toFixed(2)}
                      </span>
                    </div>
                    {item.error && <div style={{ color: 'red', fontSize: '0.8rem', marginTop: '4px' }}>{item.error}</div>}
                  </div>
                </div>
              ))}
            </div>

            {/* Special Instructions */}
            <div style={{ marginBottom: '1.5rem', border: '1px solid var(--border-color)', borderRadius: '8px', overflow: 'hidden' }}>
              <button
                style={{ width: '100%', padding: '0.75rem 1rem', background: 'var(--bg-lighter)', border: 'none', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontWeight: '500' }}
                onClick={() => setNotesOpen(!notesOpen)}
                aria-expanded={notesOpen}
              >
                <span>Special Instructions</span>
                {notesOpen ? <FaChevronUp size={12} /> : <FaChevronDown size={12} />}
              </button>
              {notesOpen && (
                <textarea
                  className="special-instructions-textarea"
                  placeholder="Add delivery notes or order instructions..."
                  value={cartNotes}
                  onChange={(e) => setCartNotes(e.target.value)}
                  style={{ width: '100%', padding: '0.75rem', border: 'none', borderTop: '1px solid var(--border-color)', outline: 'none', minHeight: '80px', resize: 'vertical' }}
                />
              )}
            </div>

            {/* Order Summary */}
            <div style={{ background: 'var(--bg-lighter)', borderRadius: '10px', padding: '1.5rem', marginBottom: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Estimated Total</span>
                <span style={{ fontWeight: '700', fontSize: '1.25rem' }}>Rs. {subtotal.toFixed(2)}</span>
              </div>
              <p style={{ fontSize: '0.8rem', color: '#9CA3AF', marginTop: '0.5rem' }}>
                Taxes, discounts and shipping calculated at checkout.{' '}
                <Link to="/shipping-policy" style={{ color: 'var(--primary-color-hover)' }}>Shipping Policy</Link>
              </p>
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
              <button
                className="checkout-btn"
                onClick={handleCheckout}
                style={{ flex: 1, minWidth: '200px', padding: '0.875rem 2rem', background: 'var(--primary-color-hover)', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '1rem', fontWeight: '600' }}
              >
                Proceed to Checkout
              </button>
              <button
                onClick={() => navigate('/best-sellers')}
                style={{ flex: 1, minWidth: '200px', padding: '0.875rem 2rem', background: 'transparent', color: 'var(--primary-color-hover)', border: '2px solid var(--primary-color-hover)', borderRadius: '8px', cursor: 'pointer', fontSize: '1rem', fontWeight: '600' }}
              >
                Continue Shopping
              </button>
            </div>
          </>
        )}
      </div>
    );
  }

  // ──────────────────────────────────────────────
  // DRAWER MODE – original slide-in panel
  // ──────────────────────────────────────────────
  return (
    <>
      {/* Semi-transparent Overlay */}
      <div className={`cart-overlay ${isOpen ? 'open' : ''}`} onClick={onClose} />

      {/* Drawer Container */}
      <div
        className={`cart-drawer ${isOpen ? 'open' : ''}`}
        aria-modal="true"
        role="dialog"
        aria-label="Shopping Cart"
      >
        {/* 1. Header Section */}
        <div className="cart-header">
          <div className="cart-header-title">
            <h2 className="cart-heading">Cart</h2>
            <div className="cart-count-badge" aria-label={`${totalItemCount} items in cart`}>
              {totalItemCount}
            </div>
          </div>
          <button className="cart-close-btn" onClick={onClose} aria-label="Close cart">
            <FaTimes size={18} />
          </button>
        </div>

        {/* Dynamic Display: Empty Cart vs Cart Products */}
        {cartItems.length === 0 ? (
          /* 2. Empty Cart Section */
          <div className="empty-cart-container">
            <h3 className="empty-cart-title">Your cart is empty</h3>
            <p className="empty-cart-account">
              Have an account?{' '}
              <Link to="/login" className="empty-cart-login-link">
                Log in
              </Link>{' '}
              to check out faster.
            </p>
            <button className="continue-shopping-btn" onClick={() => { if (onClose) onClose(); navigate('/best-sellers'); }}>
              Continue Shopping
            </button>
          </div>
        ) : (
          <>
            {/* 3 & 4. Cart Products List & Controls */}
            <div className="cart-products-scroll">
              {cartItems.map((item) => (
                <div key={item.id} className="cart-product-card">
                  <Link to={`/product/${item.id}`}>
                    <img src={item.image} alt={item.title} className="cart-product-image" />
                  </Link>

                  <div className="cart-product-info">
                    <div className="cart-product-title-row">
                      <Link to={`/product/${item.id}`} className="cart-product-title">
                        {item.title}
                      </Link>
                    </div>

                    {item.variant && <div className="cart-product-variant">{item.variant}</div>}
                    <div className="cart-product-price">Rs. {Number(item.price).toFixed(2)}</div>

                    <div className="cart-product-actions">
                      <div className="quantity-selector">
                        <button
                          className="quantity-btn"
                          onClick={() => handleQuantityChange(item.id, item.quantity - 1)}
                          aria-label="Decrease quantity"
                        >
                          <FaMinus size={10} />
                        </button>
                        <input
                          type="number"
                          className="quantity-input"
                          value={item.quantity}
                          min="1"
                          onChange={(e) => handleQuantityChange(item.id, e.target.value)}
                          aria-label="Product quantity"
                        />
                        <button
                          className="quantity-btn"
                          onClick={() => handleQuantityChange(item.id, item.quantity + 1)}
                          aria-label="Increase quantity"
                        >
                          <FaPlus size={10} />
                        </button>
                      </div>

                      <button
                        className="item-remove-btn"
                        onClick={() => handleRemoveItem(item.id)}
                        aria-label="Remove item"
                      >
                        <FaTrashAlt size={14} />
                      </button>

                      <div className="cart-product-total">Rs. {(item.price * item.quantity).toFixed(2)}</div>
                    </div>

                    {item.error && <div className="quantity-error">{item.error}</div>}
                  </div>
                </div>
              ))}
            </div>

            {/* 5 & 6. Cart Summary & Checkout Footer */}
            <div className="cart-footer">
              {/* Special Instructions Collapsible */}
              <div className="special-instructions">
                <button
                  className="accordion-header"
                  onClick={() => setNotesOpen(!notesOpen)}
                  aria-expanded={notesOpen}
                >
                  <span>Special Instructions</span>
                  {notesOpen ? <FaChevronUp size={12} /> : <FaChevronDown size={12} />}
                </button>
                {notesOpen && (
                  <textarea
                    className="special-instructions-textarea"
                    placeholder="Add delivery notes or order instructions..."
                    value={cartNotes}
                    onChange={(e) => setCartNotes(e.target.value)}
                  />
                )}
              </div>

              {/* Order Summary */}
              <div className="summary-row">
                <span className="estimated-total-label">Estimated Total</span>
                <span className="estimated-total-amount">Rs. {subtotal.toFixed(2)}</span>
              </div>

              <p className="tax-shipping-note">
                Taxes, discounts and shipping calculated at checkout.{' '}
                <Link to="/shipping-policy" className="shipping-policy-link">
                  Shipping Policy
                </Link>
              </p>

              {/* Checkout Button */}
              <button className="checkout-btn" onClick={handleCheckout}>
                Check Out
              </button>
            </div>
          </>
        )}
      </div>
    </>
  );
}

export default Cart;