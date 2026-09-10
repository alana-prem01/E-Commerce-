import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { toast } from "react-toastify";
import { FiEye, FiEyeOff } from "react-icons/fi";
import api from "../utils/api";
import ReCaptcha from "../Components/ReCaptcha";
import "../css/Login.css";

function AdminLogin() {
  const navigate = useNavigate();

  // State Management
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Google reCAPTCHA State
  const [recaptchaToken, setRecaptchaToken] = useState("");
  const [recaptchaError, setRecaptchaError] = useState("");

  // Validation Message State
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [termsError, setTermsError] = useState("");
  const [apiError, setApiError] = useState("");

  // Validation Helpers
  const validateEmailField = (val) => {
    const trimmed = val.trim();
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!val || !val.trim()) {
      return "Email is required.";
    } else if (/\s/.test(val)) {
      return "Email cannot contain spaces.";
    } else if ((val.match(/@/g) || []).length !== 1) {
      return "Email must contain exactly one '@' symbol.";
    } else if (trimmed.length > 100) {
      return "Email cannot exceed 100 characters.";
    } else if (!emailRegex.test(trimmed)) {
      return "Please enter a valid email address.";
    }
    return "";
  };

  const validatePasswordField = (val) => {
    if (!val) {
      return "Password is required.";
    } else if (/\s/.test(val)) {
      return "Spaces are not allowed in password.";
    } else if (val.length < 8 || val.length > 20) {
      return "Password must be 8-20 characters long.";
    } else if (!/[A-Z]/.test(val)) {
      return "Password must contain at least one uppercase letter.";
    } else if (!/[a-z]/.test(val)) {
      return "Password must contain at least one lowercase letter.";
    } else if (!/[0-9]/.test(val)) {
      return "Password must contain at least one number.";
    } else if (!/[!@#$%^&*(),.?":{}|<>]/.test(val)) {
      return "Password must contain at least one special character (!@#$%^&*).";
    }
    return "";
  };

  const handleEmailChange = (e) => {
    const val = e.target.value;
    setEmail(val);
    setApiError("");
    setEmailError(validateEmailField(val));
  };

  const handlePasswordChange = (e) => {
    const val = e.target.value;
    setPassword(val);
    setApiError("");
    setPasswordError(validatePasswordField(val));
  };

  const handleLogin = async (e) => {
    e.preventDefault();

    let isValid = true;
    const errEmail = validateEmailField(email);
    const errPassword = validatePasswordField(password);

    setEmailError(errEmail);
    setPasswordError(errPassword);
    setTermsError("");
    setRecaptchaError("");
    setApiError("");

    if (errEmail || errPassword) {
      isValid = false;
    }

    const trimmedEmail = email.trim();
    setEmail(trimmedEmail);

    // Terms Validation
    if (!acceptTerms) {
      setTermsError("You must accept the Privacy Policy and Terms of Service.");
      isValid = false;
    }

    // Google reCAPTCHA Validation
    if (!recaptchaToken) {
      setRecaptchaError("Please complete the Google reCAPTCHA verification.");
      isValid = false;
    }

    // Backend API Call
    if (isValid) {
      setIsSubmitting(true);
      try {
        const response = await api.post("/auth/signin", {
          email: trimmedEmail,
          password: password,
          recaptchaToken: recaptchaToken,
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

          window.dispatchEvent(new Event('auth-change'));

          navigate("/admin-dashboard");
        }
      } catch (error) {
        const msg = error.message || "Unable to connect to the backend server.";
        setApiError(msg);
        toast.error(msg);
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
          <span className="logo-text">ELORA <span style={{ fontSize: '12px', color: 'gray', marginLeft: '8px' }}>ADMIN</span></span>
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
                onChange={handleEmailChange}
                onBlur={(e) => setEmailError(validateEmailField(e.target.value))}
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
                  minLength={8}
                  maxLength={20}
                  className="password-input"
                  value={password}
                  onChange={handlePasswordChange}
                  onBlur={(e) => setPasswordError(validatePasswordField(e.target.value))}
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

          {/* API / Credentials Error */}
          {apiError && (
            <div className="error-message" style={{ marginTop: '12px', padding: '10px 14px', background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: '8px', textAlign: 'center', fontSize: '13.5px' }}>
              {apiError}
            </div>
          )}

          {/* Privacy Terms */}
          <div style={{ marginTop: '16px' }}>
            <label className="remember-me">
              <input
                type="checkbox"
                checked={acceptTerms}
                onChange={(e) => setAcceptTerms(e.target.checked)}
                className="checkbox"
              />
              <span>
                I accept the <Link to="/privacy-policy" onClick={(e) => e.stopPropagation()}>Privacy Policy</Link> and <Link to="/terms" onClick={(e) => e.stopPropagation()}>Terms of Service</Link>
              </span>
            </label>
            {termsError && <div className="error-message" style={{ marginTop: '4px' }}>{termsError}</div>}
          </div>

          {/* Google reCAPTCHA */}
          <ReCaptcha 
            onChange={(token) => {
              setRecaptchaToken(token);
              setRecaptchaError("");
            }}
            onExpired={() => {
              setRecaptchaToken("");
              setRecaptchaError("reCAPTCHA verification expired. Please verify again.");
            }}
            onError={() => setRecaptchaError("reCAPTCHA verification failed. Please try again.")}
          />
          {recaptchaError && <div className="error-message" style={{ marginTop: '4px', textAlign: 'center' }}>{recaptchaError}</div>}

          {/* Options Row */}
          <div className="options-row" style={{ justifyContent: 'flex-end' }}>
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
