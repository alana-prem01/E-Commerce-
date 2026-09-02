import React, { useState, useEffect } from "react";
import { FaFacebookF, FaInstagram, FaWhatsapp, FaTwitter, FaMapMarkerAlt, FaPhoneAlt, FaEnvelope, } from "react-icons/fa";
import "../css/Footer.css";
import { Link, useNavigate } from "react-router-dom";
import api from "../utils/api";

function Footer() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState("");
  const [emailSuccess, setEmailSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const userStr = localStorage.getItem("user");
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        if (user.email) setEmail(user.email);
      } catch (err) { }
    }
  }, []);

  const handleSubscribe = async (e) => {
    e.preventDefault();
    const isLoggedIn = localStorage.getItem("isLoggedIn") === "true" && localStorage.getItem("accessToken");

    if (!isLoggedIn) {
      navigate("/login");
      return;
    }

    setEmailError("");
    setEmailSuccess(false);
    setSubmitting(true);

    try {
      // 1. Create Razorpay order for ₹599 membership
      const orderRes = await api.post("/membership/create-order", {});

      if (!orderRes.success || !orderRes.order) {
        setEmailError(orderRes.message || "Failed to create membership order.");
        setSubmitting(false);
        return;
      }

      const userStr = localStorage.getItem("user");
      const loggedUser = userStr ? JSON.parse(userStr) : {};

      // 2. Open Razorpay payment checkout
      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID,
        amount: orderRes.order.amount,
        currency: orderRes.order.currency,
        name: 'ELORA Jewellery',
        description: 'Premium Membership (1 Year - ₹599)',
        order_id: orderRes.order.id,
        handler: async function (response) {
          try {
            // 3. Verify Payment on Backend
            const verifyRes = await api.post('/membership/verify', {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            });

            if (verifyRes.success) {
              if (verifyRes.user) {
                localStorage.setItem('user', JSON.stringify(verifyRes.user));
              }
              setEmailSuccess(true);
              navigate('/profile');
            } else {
              setEmailError(verifyRes.message || "Payment verification failed.");
            }
          } catch (verifyErr) {
            console.error("Membership verification error:", verifyErr);
            setEmailError(verifyErr.message || "Payment verification failed.");
          } finally {
            setSubmitting(false);
          }
        },
        prefill: {
          name: loggedUser.name || '',
          email: loggedUser.email || email,
          contact: loggedUser.phone || '',
        },
        theme: {
          color: '#D4AF37',
        },
      };

      if (window.Razorpay) {
        const rzp = new window.Razorpay(options);
        rzp.on('payment.failed', function (response) {
          setEmailError('Payment failed: ' + (response.error?.description || 'Payment was cancelled.'));
          setSubmitting(false);
        });
        rzp.open();
      } else {
        setEmailError('Razorpay SDK failed to load. Please check your connection.');
        setSubmitting(false);
      }
    } catch (err) {
      console.error("Subscription error:", err);
      setEmailError(err.message || "Failed to initiate subscription.");
      setSubmitting(false);
    }
  };

  return (
    <footer className="footer-container">

      {/* Newsletter / Premium Membership Section */}
      <div className="footer-newsletter-section">
        <div className="newsletter-icon-wrap">
          <FaEnvelope size={24} color="#5e3b25" />
        </div>
        <div className="newsletter-text-wrap">
          <h3 className="newsletter-heading">PREMIUM MEMBERSHIP <span className="sparkle">✨</span></h3>
          <p className="newsletter-sub">Premium Membership — ₹599/year. Enjoy Free Delivery & 15% OFF.</p>
        </div>
        <form className="footer-newsletter-form" onSubmit={handleSubscribe}>
          <input
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <button type="submit" disabled={submitting}>
            {submitting ? "SUBSCRIBING..." : "SUBSCRIBE"}
          </button>
        </form>
      </div>
      {emailError && <div className="newsletter-msg error">{emailError}</div>}
      {emailSuccess && <div className="newsletter-msg success">Premium Membership active! Redirecting to profile...</div>}

      <div className="footer-divider-top" />

      {/* Main Footer Content */}
      <div className="footer-top-wrapper">
        <div className="footer-top">
          {/* Brand Column */}
          <div className="footer-brand-col">
            <div className="text-logo">
              <span className="logo-title">ELORA</span>
              <span className="logo-subtitle">JEWELLERY</span>
            </div>
            <p className="footer-tagline">
              Timeless jewellery crafted with passion and precision. Designed to make every moment special.
            </p>
            <div className="footer-social-row">
              <a href="#" className="social-icon-link"><FaInstagram size={16} /></a>
              <a href="#" className="social-icon-link"><FaFacebookF size={16} /></a>
              <a href="#" className="social-icon-link"><FaTwitter size={16} /></a>
              <a href="#" className="social-icon-link"><FaWhatsapp size={16} /></a>
            </div>
          </div>

          {/* Quick Links Column */}
          <div>
            <h4 className="footer-heading">QUICK LINKS</h4>
            <div className="footer-links-list">
              <Link to="/" className="footer-link-item">Home</Link>
              <Link to="/best-sellers" className="footer-link-item">Shop</Link>
              <Link to="/category/necklaces" className="footer-link-item">Collections</Link>
              <Link to="/about" className="footer-link-item">About Us</Link>
              <Link to="/contact" className="footer-link-item">Contact</Link>
            </div>
          </div>

          {/* Customer Care Column */}
          <div>
            <h4 className="footer-heading">CUSTOMER CARE</h4>
            <div className="footer-links-list">
              <Link to="/shipping-policy" className="footer-link-item">Shipping Policy</Link>
              <Link to="/refund-policy" className="footer-link-item">Return Policy</Link>
              <Link to="/privacy-policy" className="footer-link-item">Terms & Conditions</Link>
              <Link to="/privacy-policy" className="footer-link-item">Privacy Policy</Link>
              <Link to="/about" className="footer-link-item">FAQ</Link>
            </div>
          </div>

          {/* Contact Us Column */}
          <div>
            <h4 className="footer-heading">CONTACT US</h4>
            <div className="contact-item-row">
              <FaPhoneAlt className="contact-icon" />
              <span className="contact-text">+91 98765 43210</span>
            </div>
            <div className="contact-item-row">
              <FaEnvelope className="contact-icon" />
              <span className="contact-text">support@elorajewellery.com</span>
            </div>
            <div className="contact-item-row">
              <FaMapMarkerAlt className="contact-icon" />
              <span className="contact-text">Kerala, India</span>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="footer-bottom">
        <p className="footer-copyright">
          © 2024 Elora Jewellery. All Rights Reserved.
        </p>
      </div>
    </footer>
  );
}

export default Footer;