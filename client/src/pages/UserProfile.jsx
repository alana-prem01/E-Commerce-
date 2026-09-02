import React, { useState, useEffect } from "react";
import "../css/UserProfile.css";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../utils/api";

function UserProfile() {
  const navigate = useNavigate();
  // --- Auth Check & User Data ---
  useEffect(() => {
    const isLoggedIn = localStorage.getItem("isLoggedIn") === "true";
    if (!isLoggedIn) {
      window.location.href = "/login";
      return;
    }

    const userStr = localStorage.getItem("user");
    if (userStr) {
      try {
        const parsedUser = JSON.parse(userStr);
        if (parsedUser.role === 'Admin') {
          window.location.href = "/admin-dashboard";
        }
      } catch (err) { }
    }
  }, []);

  const userStr = localStorage.getItem("user");
  const initialUser = userStr ? JSON.parse(userStr) : { name: "", email: "" };
  const [fullUser, setFullUser] = useState(initialUser);
  const user = fullUser || initialUser;

  // Fetch updated user profile from backend on mount
  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const res = await api.get('/profile');
        if (res.success && res.data) {
          setFullUser(res.data);
          localStorage.setItem("user", JSON.stringify(res.data));
          setContactData({
            name: res.data.name || "User",
            email: res.data.email || "user@example.com"
          });
        }
      } catch (err) {
        console.error("Failed to fetch fresh user profile:", err);
      }
    };
    if (localStorage.getItem("isLoggedIn") === "true") {
      fetchUserProfile();
    }
  }, []);

  const membership = fullUser?.membership || {};
  const isPremiumActive = Boolean(
    membership.isPremium && membership.expiryDate && new Date(membership.expiryDate) > new Date()
  );
  const isExpired = Boolean(
    membership.expiryDate && new Date() > new Date(membership.expiryDate)
  );

  // --- Dynamic New Products & Updates (From Database) ---
  const [newProducts, setNewProducts] = useState([]);
  const [loadingNewProducts, setLoadingNewProducts] = useState(true);
  const [copiedCoupon, setCopiedCoupon] = useState(false);
  const [submittingPremium, setSubmittingPremium] = useState(false);
  const [premiumError, setPremiumError] = useState("");

  useEffect(() => {
    const fetchNewProducts = async () => {
      try {
        setLoadingNewProducts(true);
        const res = await api.get('/products/allproducts?page=1&limit=4');
        if (res.success && (res.products || res.data)) {
          setNewProducts(res.products || res.data || []);
        }
      } catch (err) {
        console.error("Failed to fetch new products:", err);
      } finally {
        setLoadingNewProducts(false);
      }
    };
    fetchNewProducts();
  }, []);

  const handleCopyCoupon = () => {
    navigator.clipboard.writeText("ELORA15");
    setCopiedCoupon(true);
    setTimeout(() => setCopiedCoupon(false), 2000);
  };

  const handleSubscribePremium = async () => {
    setPremiumError("");
    setSubmittingPremium(true);
    try {
      const orderRes = await api.post("/membership/create-order", {});
      if (!orderRes.success || !orderRes.order) {
        setPremiumError(orderRes.message || "Failed to create membership order.");
        setSubmittingPremium(false);
        return;
      }

      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID,
        amount: orderRes.order.amount,
        currency: orderRes.order.currency,
        name: 'ELORA Jewellery',
        description: 'Premium Membership (1 Year - ₹599)',
        order_id: orderRes.order.id,
        handler: async function (response) {
          try {
            const verifyRes = await api.post('/membership/verify', {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            });

            if (verifyRes.success && verifyRes.user) {
              setFullUser(verifyRes.user);
              localStorage.setItem('user', JSON.stringify(verifyRes.user));
            } else {
              setPremiumError(verifyRes.message || "Payment verification failed.");
            }
          } catch (err) {
            console.error("Verification error:", err);
            setPremiumError(err.message || "Verification failed.");
          } finally {
            setSubmittingPremium(false);
          }
        },
        prefill: {
          name: fullUser.name || '',
          email: fullUser.email || '',
          contact: fullUser.phone || '',
        },
        theme: {
          color: '#D4AF37',
        },
      };

      if (window.Razorpay) {
        const rzp = new window.Razorpay(options);
        rzp.on('payment.failed', function (resp) {
          setPremiumError('Payment failed: ' + (resp.error?.description || 'Cancelled'));
          setSubmittingPremium(false);
        });
        rzp.open();
      } else {
        setPremiumError('Razorpay SDK failed to load.');
        setSubmittingPremium(false);
      }
    } catch (err) {
      setPremiumError(err.message || "Failed to initiate subscription.");
      setSubmittingPremium(false);
    }
  };

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

  // --- Contact Card States (DB Connected) ---
  const [isEditingContact, setIsEditingContact] = useState(false);
  const [isSavingContact, setIsSavingContact] = useState(false);
  const [contactError, setContactError] = useState("");
  const [contactSuccess, setContactSuccess] = useState("");
  const [contactData, setContactData] = useState({
    name: user.name || "User",
    email: user.email || "user@example.com",
  });
  const [tempContact, setTempContact] = useState({ ...contactData });

  // Sync contactData when fullUser changes
  useEffect(() => {
    if (fullUser) {
      setContactData({
        name: fullUser.name || "User",
        email: fullUser.email || "user@example.com"
      });
    }
  }, [fullUser]);

  const handleEditContactClick = () => {
    setTempContact({ name: contactData.name, email: contactData.email });
    setContactError("");
    setContactSuccess("");
    setIsEditingContact(true);
  };

  const handleSaveContact = async () => {
    setContactError("");
    setContactSuccess("");

    if (!tempContact.name || tempContact.name.trim().length < 2) {
      setContactError("Full Name must be at least 2 characters.");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!tempContact.email || !emailRegex.test(tempContact.email.trim())) {
      setContactError("Please enter a valid email address.");
      return;
    }

    setIsSavingContact(true);
    try {
      const res = await api.put('/profile', {
        name: tempContact.name.trim(),
        email: tempContact.email.trim()
      });

      if (res.success && res.data) {
        setContactData({
          name: res.data.name,
          email: res.data.email
        });
        setFullUser(res.data);
        localStorage.setItem("user", JSON.stringify(res.data));
        setIsEditingContact(false);
        setContactSuccess("Profile updated successfully!");
        setTimeout(() => setContactSuccess(""), 4000);
      } else {
        setContactError(res.message || "Failed to update profile.");
      }
    } catch (err) {
      setContactError(err.message || "Failed to update profile.");
    } finally {
      setIsSavingContact(false);
    }
  };

  const handleCancelContact = () => {
    setIsEditingContact(false);
    setContactError("");
  };

  // --- Address Management (DB Connected) ---
  const [userAddresses, setUserAddresses] = useState([]);
  const [loadingAddresses, setLoadingAddresses] = useState(true);
  const [addressMode, setAddressMode] = useState("List"); // 'List' or 'Form'
  const [editingAddressId, setEditingAddressId] = useState(null);
  const [isSavingAddress, setIsSavingAddress] = useState(false);
  const [addressError, setAddressError] = useState("");
  const [addressSuccess, setAddressSuccess] = useState("");
  const [addressForm, setAddressForm] = useState({
    fullName: "",
    phone: "",
    house: "",
    street: "",
    city: "",
    state: "",
    pinCode: "",
    country: "India",
    isDefault: false
  });

  const fetchUserAddresses = async () => {
    try {
      setLoadingAddresses(true);
      const res = await api.get('/profile/addresses');
      if (res.success && res.addresses) {
        setUserAddresses(res.addresses);
      }
    } catch (err) {
      console.error("Failed to fetch addresses:", err);
    } finally {
      setLoadingAddresses(false);
    }
  };

  useEffect(() => {
    if (localStorage.getItem("isLoggedIn") === "true") {
      fetchUserAddresses();
    }
  }, []);

  const handleOpenNewAddressForm = () => {
    setEditingAddressId(null);
    setAddressForm({
      fullName: contactData.name || "",
      phone: "",
      house: "",
      street: "",
      city: "",
      state: "",
      pinCode: "",
      country: "India",
      isDefault: userAddresses.length === 0
    });
    setAddressError("");
    setAddressMode("Form");
  };

  const handleEditAddress = (addr) => {
    setEditingAddressId(addr._id);
    setAddressForm({
      fullName: addr.fullName || "",
      phone: addr.phone || "",
      house: addr.house || "",
      street: addr.street || "",
      city: addr.city || "",
      state: addr.state || "",
      pinCode: addr.pinCode || "",
      country: addr.country || "India",
      isDefault: Boolean(addr.isDefault)
    });
    setAddressError("");
    setAddressMode("Form");
  };

  const handleSaveAddress = async (e) => {
    e.preventDefault();
    setAddressError("");
    setAddressSuccess("");
    setIsSavingAddress(true);

    try {
      let res;
      if (editingAddressId) {
        res = await api.put(`/profile/addresses/${editingAddressId}`, addressForm);
      } else {
        res = await api.post('/profile/addresses', addressForm);
      }

      if (res.success && res.addresses) {
        setUserAddresses(res.addresses);
        setAddressMode("List");
        setEditingAddressId(null);
        setAddressSuccess(editingAddressId ? "Address updated successfully!" : "Address saved successfully!");
        setTimeout(() => setAddressSuccess(""), 4000);
      } else {
        setAddressError(res.message || "Failed to save address.");
      }
    } catch (err) {
      setAddressError(err.message || "Failed to save address.");
    } finally {
      setIsSavingAddress(false);
    }
  };

  const handleDeleteAddress = async (addressId) => {
    if (!window.confirm("Are you sure you want to delete this address?")) return;
    setAddressError("");
    setAddressSuccess("");
    try {
      const res = await api.delete(`/profile/addresses/${addressId}`);
      if (res.success && res.addresses) {
        setUserAddresses(res.addresses);
        setAddressSuccess("Address deleted successfully!");
        setTimeout(() => setAddressSuccess(""), 4000);
      } else {
        setAddressError(res.message || "Failed to delete address.");
      }
    } catch (err) {
      setAddressError(err.message || "Failed to delete address.");
    }
  };

  const handleSetDefaultAddress = async (addressId) => {
    setAddressError("");
    setAddressSuccess("");
    try {
      const res = await api.put(`/profile/addresses/${addressId}/default`);
      if (res.success && res.addresses) {
        setUserAddresses(res.addresses);
        setAddressSuccess("Default address updated!");
        setTimeout(() => setAddressSuccess(""), 4000);
      } else {
        setAddressError(res.message || "Failed to set default address.");
      }
    } catch (err) {
      setAddressError(err.message || "Failed to set default address.");
    }
  };

  const handleCancelAddress = () => {
    setAddressMode("List");
    setEditingAddressId(null);
    setAddressError("");
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
    const selectedOrder = orders.find(o => (o._id === orderId || o.id === orderId));
    navigate(`/order-tracking/${orderId}`, { state: { orderId, order: selectedOrder } });
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
          <Link to="/order-tracking" className="orders-nav-item">Orders</Link>
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

          {contactSuccess && (
            <div style={{ padding: "8px 12px", backgroundColor: "#E6F4EA", color: "#137333", borderRadius: "6px", fontSize: "13px", marginBottom: "12px", fontWeight: 500 }}>
              {contactSuccess}
            </div>
          )}

          {contactError && (
            <div style={{ padding: "8px 12px", backgroundColor: "#FCE8E6", color: "#C5221F", borderRadius: "6px", fontSize: "13px", marginBottom: "12px", fontWeight: 500 }}>
              {contactError}
            </div>
          )}

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
                <button className="btn-primary" onClick={handleSaveContact} disabled={isSavingContact}>
                  {isSavingContact ? "Saving..." : "Save"}
                </button>
                <button className="btn-secondary" onClick={handleCancelContact} disabled={isSavingContact}>
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>

        {/* PREMIUM MEMBERSHIP CARD */}
        <div className="profile-card">
          <div className="card-header">
            <h3 className="card-title">Membership</h3>
          </div>

          <div className="card-body-stack">
            {isPremiumActive ? (
              <>
                <div>
                  <span className="label-text">MEMBERSHIP STATUS</span>
                  <div className="value-text" style={{ color: "#0B5D50", fontWeight: "600" }}>
                    Premium Member
                  </div>
                </div>

                <div>
                  <span className="label-text">MEMBERSHIP ACTIVE UNTIL</span>
                  <div className="value-text">
                    {new Date(membership.expiryDate).toLocaleDateString("en-IN", {
                      year: "numeric",
                      month: "long",
                      day: "numeric"
                    })}
                  </div>
                </div>

                {/* PREMIUM COUPON SECTION */}
                <div style={{ marginTop: "12px", padding: "14px", backgroundColor: "#f8f7f4", borderRadius: "8px", border: "1px solid #e2ded7" }}>
                  <span className="label-text" style={{ color: "#5e3b25", fontWeight: "700" }}>PREMIUM COUPON</span>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "6px" }}>
                    <div>
                      <div className="value-text" style={{ fontWeight: "700", fontSize: "15px" }}>
                        Coupon Code: ELORA15
                      </div>
                      <div className="value-text-muted" style={{ fontSize: "13px" }}>
                        Discount: 15% | Validity: Until {new Date(membership.expiryDate).toLocaleDateString("en-IN", { year: "numeric", month: "short", day: "numeric" })}
                      </div>
                    </div>
                    <button
                      className="btn-action-outline"
                      onClick={handleCopyCoupon}
                      style={{ padding: "6px 12px", cursor: "pointer", fontSize: "13px" }}
                    >
                      {copiedCoupon ? "Copied!" : "Copy Code"}
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <>
                <div>
                  <span className="label-text">MEMBERSHIP STATUS</span>
                  <div className="value-text" style={{ color: isExpired ? "#E53E3E" : "#666" }}>
                    {isExpired ? `Expired on ${new Date(membership.expiryDate).toLocaleDateString("en-IN")}` : "Inactive"}
                  </div>
                </div>
                <div className="value-text-muted" style={{ fontSize: "13px" }}>
                  Join Elora Premium for ₹599/year to receive Free Delivery on orders, a 15% Discount Coupon (ELORA15), and early product updates.
                </div>
                <div style={{ marginTop: "10px" }}>
                  <button
                    className="btn-primary"
                    onClick={handleSubscribePremium}
                    disabled={submittingPremium}
                  >
                    {submittingPremium ? "Processing..." : "Subscribe to Premium (₹599/year)"}
                  </button>
                </div>
                {premiumError && <div className="security-error" style={{ marginTop: "8px" }}>{premiumError}</div>}
              </>
            )}

            {/* EXCLUSIVE NEW PRODUCTS SECTION */}
            <div style={{ marginTop: "20px", paddingTop: "16px", borderTop: "1px solid #eee" }}>
              <span className="label-text" style={{ color: "#5e3b25", fontWeight: "700" }}>EXCLUSIVE NEW PRODUCTS & UPDATES</span>
              {loadingNewProducts ? (
                <div style={{ fontSize: "13px", color: "#666", padding: "12px 0" }}>Loading latest arrivals...</div>
              ) : newProducts.length > 0 ? (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(130px, 1fr))", gap: "12px", marginTop: "10px" }}>
                  {newProducts.map((prod) => (
                    <Link
                      key={prod._id || prod.id}
                      to={`/product/${prod._id || prod.id}`}
                      style={{ textDecoration: "none", color: "inherit", border: "1px solid #e5e7eb", borderRadius: "8px", padding: "8px", backgroundColor: "#fff", display: "flex", flexDirection: "column", alignItems: "center" }}
                    >
                      <img
                        src={prod.productImage || prod.image || (prod.images && prod.images[0]) || ""}
                        alt={prod.productName || prod.title || prod.name}
                        style={{ width: "100%", height: "90px", objectFit: "cover", borderRadius: "6px" }}
                      />
                      <div style={{ fontSize: "12px", fontWeight: "600", marginTop: "6px", textAlign: "center", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", width: "100%" }}>
                        {prod.productName || prod.title || prod.name}
                      </div>
                      <div style={{ fontSize: "12px", color: "#0B5D50", fontWeight: "700", marginTop: "2px" }}>
                        ₹{Number(prod.price).toLocaleString("en-IN")}
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <div style={{ fontSize: "13px", color: "#888", padding: "10px 0" }}>No new products available at the moment.</div>
              )}
            </div>
          </div>
        </div>

        {/* ADDRESSES CARD */}
        <div className="profile-card">
          <div className="card-header">
            <h3 className="card-title">Address Management</h3>

            {addressMode === "List" && (
              <button className="btn-action-outline" onClick={handleOpenNewAddressForm}>
                + Add Address
              </button>
            )}
          </div>

          {addressSuccess && (
            <div style={{ padding: "8px 12px", backgroundColor: "#E6F4EA", color: "#137333", borderRadius: "6px", fontSize: "13px", marginBottom: "12px", fontWeight: 500 }}>
              {addressSuccess}
            </div>
          )}

          {addressError && (
            <div style={{ padding: "8px 12px", backgroundColor: "#FCE8E6", color: "#C5221F", borderRadius: "6px", fontSize: "13px", marginBottom: "12px", fontWeight: 500 }}>
              {addressError}
            </div>
          )}

          {/* ADDRESS FORM MODE */}
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
                  <label className="label-text">PHONE NUMBER</label>
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

              <div className="form-row">
                <div className="form-col-flex">
                  <label className="label-text">HOUSE / FLAT / BUILDING</label>
                  <input
                    type="text"
                    placeholder="Flat / Building name, No."
                    className="input-field"
                    value={addressForm.house}
                    onChange={(e) => setAddressForm({ ...addressForm, house: e.target.value })}
                  />
                </div>
                <div className="form-col-flex">
                  <label className="label-text">STREET / AREA</label>
                  <input
                    type="text"
                    placeholder="Street, locality, area"
                    className="input-field"
                    value={addressForm.street}
                    onChange={(e) => setAddressForm({ ...addressForm, street: e.target.value })}
                  />
                </div>
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
              </div>

              <div className="form-row">
                <div className="form-col-flex">
                  <label className="label-text">POSTAL / PIN CODE</label>
                  <input
                    type="text"
                    placeholder="PIN code"
                    className="input-field"
                    required
                    value={addressForm.pinCode}
                    onChange={(e) => setAddressForm({ ...addressForm, pinCode: e.target.value })}
                  />
                </div>
                <div className="form-col-flex">
                  <label className="label-text">COUNTRY</label>
                  <input
                    type="text"
                    placeholder="Country"
                    className="input-field"
                    required
                    value={addressForm.country}
                    onChange={(e) => setAddressForm({ ...addressForm, country: e.target.value })}
                  />
                </div>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "4px" }}>
                <input
                  type="checkbox"
                  id="isDefaultAddress"
                  checked={addressForm.isDefault}
                  onChange={(e) => setAddressForm({ ...addressForm, isDefault: e.target.checked })}
                  style={{ width: "16px", height: "16px", cursor: "pointer" }}
                />
                <label htmlFor="isDefaultAddress" style={{ fontSize: "13px", cursor: "pointer", color: "#555" }}>
                  Set as default shipping address
                </label>
              </div>

              <div className="button-group-form" style={{ marginTop: "12px" }}>
                <button type="submit" className="btn-primary" disabled={isSavingAddress}>
                  {isSavingAddress ? "Saving..." : editingAddressId ? "Update Address" : "Save Address"}
                </button>
                <button type="button" className="btn-secondary" onClick={handleCancelAddress} disabled={isSavingAddress}>
                  Cancel
                </button>
              </div>
            </form>
          )}

          {/* ADDRESS LIST MODE */}
          {addressMode === "List" && (
            loadingAddresses ? (
              <div style={{ fontSize: "14px", color: "#666", padding: "12px 0" }}>Loading saved addresses...</div>
            ) : userAddresses.length === 0 ? (
              <p className="empty-address-text">No addresses saved yet. Click "+ Add Address" to add one.</p>
            ) : (
              <div className="card-body-stack">
                {userAddresses.map((addr) => (
                  <div
                    key={addr._id}
                    style={{
                      border: addr.isDefault ? "1.5px solid #0B5D50" : "1px solid #e2ded7",
                      backgroundColor: addr.isDefault ? "#F3F7F5" : "#fff",
                      borderRadius: "8px",
                      padding: "14px 16px",
                      marginBottom: "10px",
                      position: "relative"
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                      <div>
                        <div className="value-text value-text-highlight" style={{ fontWeight: 600, display: "flex", alignItems: "center", gap: "8px" }}>
                          {addr.fullName}
                          {addr.isDefault && (
                            <span style={{ fontSize: "11px", backgroundColor: "#0B5D50", color: "#fff", padding: "2px 8px", borderRadius: "12px", fontWeight: 500 }}>
                              Default Address
                            </span>
                          )}
                        </div>
                        <div className="value-text value-text-muted" style={{ marginTop: "4px", fontSize: "13px" }}>
                          {[addr.house, addr.street].filter(Boolean).join(", ")}
                        </div>
                        <div className="value-text value-text-muted" style={{ fontSize: "13px" }}>
                          {addr.city}, {addr.state} - {addr.pinCode}, {addr.country || "India"}
                        </div>
                        <div className="value-text value-text-muted" style={{ fontSize: "13px", marginTop: "2px" }}>
                          Phone: {addr.phone}
                        </div>
                      </div>
                    </div>

                    <div style={{ display: "flex", gap: "10px", marginTop: "12px", borderTop: "1px solid #f0f0f0", paddingTop: "8px" }}>
                      <button
                        onClick={() => handleEditAddress(addr)}
                        style={{ border: "none", background: "none", color: "#0B5D50", cursor: "pointer", fontSize: "13px", fontWeight: 600, padding: 0 }}
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteAddress(addr._id)}
                        style={{ border: "none", background: "none", color: "#E53E3E", cursor: "pointer", fontSize: "13px", fontWeight: 600, padding: 0 }}
                      >
                        Delete
                      </button>
                      {!addr.isDefault && (
                        <button
                          onClick={() => handleSetDefaultAddress(addr._id)}
                          style={{ border: "none", background: "none", color: "#5e3b25", cursor: "pointer", fontSize: "13px", fontWeight: 500, padding: 0, marginLeft: "auto" }}
                        >
                          Set as Default
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )
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