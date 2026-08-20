import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { FiEye, FiEyeOff } from "react-icons/fi";
import api from "../utils/api";
import "../css/Login.css";

function AdminLogin() {
  const navigate = useNavigate();

  // State Management
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Validation Message State
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [termsError, setTermsError] = useState("");

  const handleLogin = async (e) => {
    e.preventDefault();

    let isValid = true;
    setEmailError("");
    setPasswordError("");
    setTermsError("");

    const trimmedEmail = email.trim();
    setEmail(trimmedEmail);

    // Email Validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!trimmedEmail) {
      setEmailError("Email is required.");
      isValid = false;
    } else if (!emailRegex.test(trimmedEmail)) {
      setEmailError("Please enter a valid email address.");
      isValid = false;
    }

    // Password Validation
    if (!password) {
      setPasswordError("Password is required.");
      isValid = false;
    }

    // Terms Validation
    if (!acceptTerms) {
      setTermsError("You must accept the Privacy Policy and Terms of Service.");
      isValid = false;
    }

    // Backend API Call
    if (isValid) {
      setIsSubmitting(true);
      try {
        const response = await api.post("/auth/signin", {
          email: trimmedEmail,
          password: password,
        });

        if (response.success) {
          if (response.user.role !== 'Admin') {
            toast.error("Access Denied. Admins only.");
            return;
          }

          toast.success(response.message || "Admin Login Successful!");

          // Store Access Token & User Details
          localStorage.setItem("accessToken", response.accessToken);
          localStorage.setItem("user", JSON.stringify(response.user));
          localStorage.setItem("isLoggedIn", "true");

          if (rememberMe) {
            localStorage.setItem("rememberedUser", trimmedEmail);
          }
          
          window.dispatchEvent(new Event('auth-change'));
          
          navigate("/admin-dashboard");
        }
      } catch (error) {
        toast.error(error.message || "Unable to connect to the backend server.");
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  return (
    <div className="page-background">
      <div className="card-container admin-card">
        {/* Logo Section */}
        <div className="logo-section">
          <img 
            src="/logo3.jpeg" 
            alt="ELORA Logo" 
            className="logo-image" 
          />
          <span className="logo-text">ELORA <span style={{fontSize: '12px', color: 'gray', marginLeft: '8px'}}>ADMIN</span></span>
        </div>

        {/* Headings */}
        <h1 className="page-heading">Admin Portal</h1>
        <p className="subtext">Secure sign-in for authorized personnel</p>

        {/* Form */}
        <form onSubmit={handleLogin} noValidate>
          <div className="form-fields-container">
            {/* Email Field */}
            <div>
              <label className="field-label" htmlFor="email">Email</label>
              <input
                id="email"
                type="email"
                placeholder="Admin Email Address"
                maxLength={100}
                className="email-input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              {emailError && <div className="error-message">{emailError}</div>}
            </div>

            {/* Password Field */}
            <div>
              <label className="field-label" htmlFor="password">Password</label>
              <div className="password-wrapper">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Admin Password"
                  className="password-input"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="toggle-password-btn"
                  aria-label="Toggle password visibility"
                >
                  {showPassword ? <FiEyeOff color="var(--text-secondary)" size={18} /> : <FiEye color="var(--text-secondary)" size={18} />}
                </button>
              </div>
              {passwordError && <div className="error-message">{passwordError}</div>}
            </div>
          </div>

          {/* Privacy Terms */}
          <div style={{ marginTop: '16px' }}>
            <label className="remember-me">
              <input
                type="checkbox"
                checked={acceptTerms}
                onChange={(e) => setAcceptTerms(e.target.checked)}
                className="checkbox"
              />
              <span>I accept the Privacy Policy and Terms of Service</span>
            </label>
            {termsError && <div className="error-message" style={{ marginTop: '4px' }}>{termsError}</div>}
          </div>

          {/* Options Row */}
          <div className="options-row">
            <label className="remember-me">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="checkbox"
              />
              <span>Remember Me</span>
            </label>
            <span
              className="forgot-password-link"
              onClick={() => navigate("/forgot-password")}
            >
              Forgot Password?
            </span>
          </div>

          {/* Sign In Button */}
          <button type="submit" className="sign-in-button" disabled={isSubmitting}>
            {isSubmitting ? "Authenticating..." : "Admin Sign In"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default AdminLogin;
