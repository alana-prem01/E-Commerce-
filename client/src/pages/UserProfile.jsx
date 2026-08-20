import React, { useState, useEffect } from "react";
import "../css/UserProfile.css";
import { Link } from "react-router-dom";
import { api } from "../utils/api";

function UserProfile() {
  // --- Auth Check & User Data ---
  useEffect(() => {
    if (localStorage.getItem("isLoggedIn") !== "true") {
      window.location.href = "/login";
    }
  }, []);

  const userStr = localStorage.getItem("user");
  const user = userStr ? JSON.parse(userStr) : { name: "", email: "" };

  // --- Real Orders State ---
  const [orders, setOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(true);

  useEffect(() => {
    const fetchUserOrders = async () => {
      try {
        setLoadingOrders(true);
        const res = await api.get('/profile/orders');
        if (res.success && (res.orders || res.data)) {
          setOrders(res.orders || res.data || []);
        }
      } catch (err) {
        console.error("Failed to fetch user orders:", err);
      } finally {
        setLoadingOrders(false);
      }
    };

    if (localStorage.getItem("isLoggedIn") === "true") {
      fetchUserOrders();
    }
  }, []);

  // --- Contact Card States ---
  const [isEditingContact, setIsEditingContact] = useState(false);
  const [contactData, setContactData] = useState({
    name: user.name || "User",
    email: user.email || "user@example.com",
  });
  const [tempContact, setTempContact] = useState({ ...contactData });

  const handleEditContactClick = () => {
    setTempContact({ ...contactData });
    setIsEditingContact(true);
  };

  const handleSaveContact = () => {
    setContactData({ ...tempContact });
    setIsEditingContact(false);
  };

  const handleCancelContact = () => {
    setIsEditingContact(false);
  };

  // --- Address Card States (Empty | Form | Filled) ---
  const [addressMode, setAddressMode] = useState("Empty"); // 'Empty', 'Form', or 'Filled'
  const [savedAddress, setSavedAddress] = useState(null);
  const [addressForm, setAddressForm] = useState({
    fullName: "",
    phone: "",
    line1: "",
    line2: "",
    city: "",
    state: "",
    pinCode: "",
  });

  const handleOpenAddressForm = () => {
    if (savedAddress) {
      setAddressForm({ ...savedAddress });
    } else {
      setAddressForm({
        fullName: "",
        phone: "",
        line1: "",
        line2: "",
        city: "",
        state: "",
        pinCode: "",
      });
    }
    setAddressMode("Form");
  };

  const handleSaveAddress = (e) => {
    e.preventDefault();
    setSavedAddress({ ...addressForm });
    setAddressMode("Filled");
  };

  const handleCancelAddress = () => {
    if (savedAddress) {
      setAddressMode("Filled");
    } else {
      setAddressMode("Empty");
    }
  };

  const handleDeleteAddress = () => {
    setSavedAddress(null);
    setAddressMode("Empty");
  };

  // --- Helper Status Badge Color Generator ---
  const getBadgeStyles = (status) => {
    switch (status) {
      case "Delivered":
        return { bg: "#F3F7F5", text: "var(--primary-color)" };
      case "In Transit":
      case "Shipped":
      case "Out for Delivery":
        return { bg: "#FDF3DC", text: "#B8860B" };
      case "Processing":
      case "Pending":
        return { bg: "#EEF1FA", text: "#4A5B9A" };
      case "Cancelled":
      case "Failed":
        return { bg: "#FDF2F2", text: "#E53E3E" };
      default:
        return { bg: "#F3F7F5", text: "var(--primary-color)" };
    }
  };

  const handleOrderClick = (orderId) => {
    alert(`Navigating to order details for: ${orderId}`);
  };

  // --- Security / Change Password States ---
  const [securityStep, setSecurityStep] = useState('idle'); // idle | otp | reset | success
  const [securityOtp, setSecurityOtp] = useState('');
  const [securityNewPassword, setSecurityNewPassword] = useState('');
  const [securityConfirmPassword, setSecurityConfirmPassword] = useState('');
  const [securityError, setSecurityError] = useState('');
  const [isSecurityLoading, setIsSecurityLoading] = useState(false);

  const handleSendSecurityOTP = async () => {
    setSecurityError('');
    setIsSecurityLoading(true);
    try {
      const res = await api.post('/auth/change-password/send-otp', {});
      if (res.success) {
        setSecurityStep('otp');
      } else {
        setSecurityError(res.message || 'Failed to send OTP.');
      }
    } catch (err) {
      setSecurityError(err.message || 'Failed to send OTP.');
    } finally {
      setIsSecurityLoading(false);
    }
  };

  const handleVerifySecurityOTP = async () => {
    if (!securityOtp || securityOtp.length !== 6) {
      setSecurityError('Please enter a valid 6-digit OTP.');
      return;
    }
    setSecurityError('');
    setIsSecurityLoading(true);
    try {
      const res = await api.post('/auth/change-password/verify-otp', { otp: securityOtp });
      if (res.success) {
        setSecurityStep('reset');
      } else {
        setSecurityError(res.message || 'Invalid or expired OTP.');
      }
    } catch (err) {
      setSecurityError(err.message || 'Invalid or expired OTP.');
    } finally {
      setIsSecurityLoading(false);
    }
  };

  const handleResetSecurityPassword = async () => {
    if (securityNewPassword !== securityConfirmPassword) {
      setSecurityError('Passwords do not match.');
      return;
    }
    if (securityNewPassword.length < 8) {
      setSecurityError('Password must be at least 8 characters.');
      return;
    }
    setSecurityError('');
    setIsSecurityLoading(true);
    try {
      const res = await api.post('/auth/change-password/reset', {
        otp: securityOtp,
        newPassword: securityNewPassword,
        confirmPassword: securityConfirmPassword,
      });
      if (res.success) {
        setSecurityStep('success');
      } else {
        setSecurityError(res.message || 'Failed to change password.');
      }
    } catch (err) {
      setSecurityError(err.message || 'Failed to change password.');
    } finally {
      setIsSecurityLoading(false);
    }
  };

  const handleCancelSecurity = () => {
    setSecurityStep('idle');
    setSecurityOtp('');
    setSecurityNewPassword('');
    setSecurityConfirmPassword('');
    setSecurityError('');
  };

  return (
    <div className="account-shell">
      {/* 1. Orders Sidebar */}
      <aside className="orders-sidebar">
        <div>
          <h2 className="sidebar-brand">Elora Jewellery</h2>
          <div className="sidebar-subtitle">My Account</div>
          <Link to="/ordertracking" className="orders-nav-item">Orders</Link>
        </div>

        {/* Order List */}
        <div className="orders-list">
          {loadingOrders ? (
            <div style={{ padding: '16px', textAlign: 'center', fontSize: '14px', color: '#666' }}>Loading orders...</div>
          ) : orders.length > 0 ? (
            orders.map((order) => {
              const displayId = order._id ? `#${order._id.substring(order._id.length - 6).toUpperCase()}` : (order.id || 'N/A');
              const status = order.orderStatus || order.status || 'Pending';
              const dateStr = order.createdAt ? new Date(order.createdAt).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }) : (order.date || '');
              const priceStr = order.pricing?.total !== undefined ? `₹${order.pricing.total.toLocaleString('en-IN')}` : (order.price || '₹0');
              const badgeStyle = getBadgeStyles(status);

              return (
                <div
                  key={order._id || order.id}
                  className="order-card"
                  onClick={() => handleOrderClick(order._id || order.id)}
                >
                  <div className="order-card-row">
                    <span className="order-id">{displayId}</span>
                    <span
                      className="status-badge"
                      style={{
                        backgroundColor: badgeStyle.bg,
                        color: badgeStyle.text,
                      }}
                    >
                      {status}
                    </span>
                  </div>

                  <span className="order-date">{dateStr}</span>
                  <span className="order-price">{priceStr}</span>
                </div>
              );
            })
          ) : (
            <div className="empty-card-wrapper">
              <div className="empty-icon">!</div>
              <span className="empty-text">No orders yet.</span>
            </div>
          )}
        </div>
      </aside>

      {/* 2. Profile Main Column */}
      <main className="profile-main-col">
        <h1 className="column-heading">Profile</h1>

        {/* CONTACT CARD */}
        <div className="profile-card">
          <div className="card-header">
            <h3 className="card-title">Contact</h3>

            {!isEditingContact && (
              <button className="btn-action-outline" onClick={handleEditContactClick}>
                Edit
              </button>
            )}
          </div>

          {!isEditingContact ? (
            /* VIEW MODE */
            <div className="card-body-stack">
              <div>
                <span className="label-text">FULL NAME</span>
                <div className="value-text">{contactData.name}</div>
              </div>
              <div>
                <span className="label-text">EMAIL ADDRESS</span>
                <div className="value-text">{contactData.email}</div>
              </div>
            </div>
          ) : (
            /* EDIT MODE */
            <div className="card-body-stack">
              <div>
                <label className="label-text">FULL NAME</label>
                <input
                  type="text"
                  className="input-field"
                  value={tempContact.name}
                  onChange={(e) => setTempContact({ ...tempContact, name: e.target.value })}
                />
              </div>
              <div>
                <label className="label-text">EMAIL ADDRESS</label>
                <input
                  type="email"
                  className="input-field"
                  value={tempContact.email}
                  onChange={(e) => setTempContact({ ...tempContact, email: e.target.value })}
                />
              </div>
              <div className="button-group">
                <button className="btn-primary" onClick={handleSaveContact}>
                  Save
                </button>
                <button className="btn-secondary" onClick={handleCancelContact}>
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>

        {/* ADDRESSES CARD */}
        <div className="profile-card">
          <div className="card-header">
            <h3 className="card-title">Address</h3>

            {addressMode !== "Form" && (
              <button className="btn-action-outline" onClick={handleOpenAddressForm}>
                {addressMode === "Empty" ? "Add" : "Update"}
              </button>
            )}
          </div>

          {/* State 1: EMPTY STATE */}
          {addressMode === "Empty" && (
            <p className="empty-address-text">No addresses added</p>
          )}

          {/* State 2: ADDRESS FORM */}
          {addressMode === "Form" && (
            <form onSubmit={handleSaveAddress} className="form-grid">
              <div className="form-row">
                <div className="form-col-flex">
                  <label className="label-text">FULL NAME</label>
                  <input
                    type="text"
                    placeholder="Full name"
                    className="input-field"
                    required
                    value={addressForm.fullName}
                    onChange={(e) => setAddressForm({ ...addressForm, fullName: e.target.value })}
                  />
                </div>
                <div className="form-col-flex">
                  <label className="label-text">PHONE</label>
                  <input
                    type="tel"
                    placeholder="Phone number"
                    className="input-field"
                    required
                    value={addressForm.phone}
                    onChange={(e) => setAddressForm({ ...addressForm, phone: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <label className="label-text">ADDRESS LINE 1</label>
                <input
                  type="text"
                  placeholder="Street address"
                  className="input-field"
                  required
                  value={addressForm.line1}
                  onChange={(e) => setAddressForm({ ...addressForm, line1: e.target.value })}
                />
              </div>

              <div>
                <label className="label-text">ADDRESS LINE 2 (OPTIONAL)</label>
                <input
                  type="text"
                  placeholder="Apartment, suite, etc."
                  className="input-field"
                  value={addressForm.line2}
                  onChange={(e) => setAddressForm({ ...addressForm, line2: e.target.value })}
                />
              </div>

              <div className="form-row">
                <div className="form-col-flex">
                  <label className="label-text">CITY</label>
                  <input
                    type="text"
                    placeholder="City"
                    className="input-field"
                    required
                    value={addressForm.city}
                    onChange={(e) => setAddressForm({ ...addressForm, city: e.target.value })}
                  />
                </div>
                <div className="form-col-flex">
                  <label className="label-text">STATE</label>
                  <input
                    type="text"
                    placeholder="State"
                    className="input-field"
                    required
                    value={addressForm.state}
                    onChange={(e) => setAddressForm({ ...addressForm, state: e.target.value })}
                  />
                </div>
                <div className="form-col-flex">
                  <label className="label-text">PIN CODE</label>
                  <input
                    type="text"
                    placeholder="PIN code"
                    className="input-field"
                    required
                    value={addressForm.pinCode}
                    onChange={(e) => setAddressForm({ ...addressForm, pinCode: e.target.value })}
                  />
                </div>
              </div>

              <div className="button-group-form">
                <button type="submit" className="btn-primary">
                  Save Address
                </button>
                <button type="button" className="btn-secondary" onClick={handleCancelAddress}>
                  Cancel
                </button>
              </div>
            </form>
          )}

          {/* State 3: FILLED STATE */}
          {addressMode === "Filled" && savedAddress && (
            <div className="card-body-stack">
              <div className="value-text value-text-highlight">
                {savedAddress.fullName}
              </div>
              <div className="value-text value-text-muted">
                {savedAddress.line1}
                {savedAddress.line2 ? `, ${savedAddress.line2}` : ""}
              </div>
              <div className="value-text value-text-muted">
                {savedAddress.city}, {savedAddress.state} - {savedAddress.pinCode}
              </div>
              <div className="value-text value-text-muted">
                Phone: {savedAddress.phone}
              </div>

              <div>
                <button onClick={handleDeleteAddress} className="btn-delete">
                  Delete Address
                </button>
              </div>
            </div>
          )}
        </div>

        {/* SECURITY / CHANGE PASSWORD CARD */}
        <div className="profile-card">
          <div className="card-header">
            <h3 className="card-title">Security</h3>
          </div>

          <div className="card-body-stack">
            {securityStep === 'idle' && (
              <>
                <div>
                  <span className="label-text">PASSWORD</span>
                  <div className="value-text value-text-muted">••••••••</div>
                </div>
                <div>
                  <button className="btn-action-outline" onClick={handleSendSecurityOTP} disabled={isSecurityLoading}>
                    {isSecurityLoading ? 'Sending...' : 'Change Password'}
                  </button>
                </div>
                {securityError && <div className="security-error">{securityError}</div>}
              </>
            )}

            {securityStep === 'otp' && (
              <>
                <div>
                  <label className="label-text">ENTER OTP</label>
                  <p className="value-text-muted" style={{ fontSize: '13px', marginBottom: '10px' }}>
                    We've sent a 6-digit OTP to {user.email}
                  </p>
                  <input
                    type="text"
                    className="input-field"
                    placeholder="6-digit OTP"
                    maxLength={6}
                    value={securityOtp}
                    onChange={(e) => setSecurityOtp(e.target.value)}
                  />
                </div>
                <div className="button-group">
                  <button className="btn-primary" onClick={handleVerifySecurityOTP} disabled={isSecurityLoading}>
                    {isSecurityLoading ? 'Verifying...' : 'Verify OTP'}
                  </button>
                  <button className="btn-secondary" onClick={handleCancelSecurity}>
                    Cancel
                  </button>
                </div>
                {securityError && <div className="security-error">{securityError}</div>}
              </>
            )}

            {securityStep === 'reset' && (
              <>
                <div>
                  <label className="label-text">NEW PASSWORD</label>
                  <input
                    type="password"
                    className="input-field"
                    placeholder="At least 8 characters"
                    value={securityNewPassword}
                    onChange={(e) => setSecurityNewPassword(e.target.value)}
                  />
                </div>
                <div>
                  <label className="label-text">CONFIRM NEW PASSWORD</label>
                  <input
                    type="password"
                    className="input-field"
                    placeholder="Must match new password"
                    value={securityConfirmPassword}
                    onChange={(e) => setSecurityConfirmPassword(e.target.value)}
                  />
                </div>
                <div className="button-group">
                  <button className="btn-primary" onClick={handleResetSecurityPassword} disabled={isSecurityLoading}>
                    {isSecurityLoading ? 'Updating...' : 'Update Password'}
                  </button>
                  <button className="btn-secondary" onClick={handleCancelSecurity}>
                    Cancel
                  </button>
                </div>
                {securityError && <div className="security-error">{securityError}</div>}
              </>
            )}

            {securityStep === 'success' && (
              <div className="security-success">
                Password changed successfully!
                <div style={{ marginTop: '10px' }}>
                  <button className="btn-secondary" onClick={handleCancelSecurity}>
                    Done
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* SIGN OUT BUTTON */}
        <button
          className="btn-signout"
          onClick={() => {
            localStorage.removeItem("accessToken");
            localStorage.removeItem("user");
            localStorage.removeItem("isLoggedIn");
            localStorage.removeItem("cartItems");
            window.dispatchEvent(new Event('auth-change'));
            window.location.href = "/login";
          }}
        >
          Sign out
        </button>
      </main>
    </div>
  );
}

export default UserProfile;