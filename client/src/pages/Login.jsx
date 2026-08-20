import React, { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "react-toastify";
import { FiEye, FiEyeOff } from "react-icons/fi";
import api from "../utils/api";
import "../css/Login.css";

function Login() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  // Where to go after login — honour ?redirect= or fall back to home
  const redirectTarget = searchParams.get('redirect') || '/';

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
    } else if (trimmedEmail.length > 100) {
      setEmailError("Email cannot exceed 100 characters.");
      isValid = false;
    } else if (!emailRegex.test(trimmedEmail)) {
      setEmailError("Please enter a valid email address.");
      isValid = false;
    }

    // Password Validation
    if (!password) {
      setPasswordError("Password is required.");
      isValid = false;
    } else if (password.length < 8 || password.length > 20) {
      setPasswordError("Password must be 8-20 characters long.");
      isValid = false;
    } else if (/\s/.test(password)) {
      setPasswordError("Spaces are not allowed in password.");
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
          toast.success(response.message || "Login Successful!");

          // Store Access Token & User Details
          localStorage.setItem("accessToken", response.accessToken);
          localStorage.setItem("user", JSON.stringify(response.user));
          localStorage.setItem("isLoggedIn", "true");

          if (rememberMe) {
            localStorage.setItem("rememberedUser", trimmedEmail);
          }
          
          window.dispatchEvent(new Event('auth-change'));
          
          if (response.user.role === 'Admin') {
            toast.error("Admins must use the Admin Portal to sign in.");
            localStorage.clear();
            return;
          }

          // Check for productId and qty in redirect path (Buy Now flow)
          const url = new URL('http://dummy' + redirectTarget);
          const productId = url.searchParams.get('productId');
          const qtyParam = url.searchParams.get('qty');
          const qty = qtyParam ? parseInt(qtyParam, 10) : 1;
          
          if (productId) {
            // Add the product to the cart via backend before navigating to checkout
            api.post('/cart/addcart', { productId, quantity: qty })
              .then(() => {
                navigate('/checkout');
              })
              .catch(() => {
                toast.error('Failed to add product to cart before checkout');
                navigate(redirectTarget);
              });
          } else {
            navigate(redirectTarget);
          }
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
      <div className="card-container">
        {/* Logo Section */}
        <div className="logo-section">
          <img 
            src="/logo3.jpeg" 
            alt="ELORA Logo" 
            className="logo-image" 
          />
          <span className="logo-text">ELORA</span>
        </div>

        {/* Headings */}
        <h1 className="page-heading">Welcome Back</h1>
        <p className="subtext">Signin to continue</p>

        {/* Form */}
        <form onSubmit={handleLogin} noValidate>
          <div className="form-fields-container">
            {/* Email Field */}
            <div>
              <label className="field-label" htmlFor="email">
                Email
              </label>
              <input
                id="email"
                type="email"
                placeholder="Enter your email address"
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
              <label className="field-label" htmlFor="password">
                Password
              </label>
              <div className="password-wrapper">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  minLength={8}
                  maxLength={20}
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
                  {showPassword ? (
                    <FiEyeOff color="var(--text-secondary)" size={18} />
                  ) : (
                    <FiEye color="var(--text-secondary)" size={18} />
                  )}
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
            {isSubmitting ? "Signing In..." : "Sign In"}
          </button>
        </form>

        {/* Divider Row */}
        <div className="divider-row">
          <div className="divider-line" />
          <span className="divider-text">OR</span>
          <div className="divider-line" />
        </div>

        {/* Footer Row */}
        <div className="footer-row">
          <span className="footer-text">Don't have an account?</span>
          <span
            className="sign-up-link"
            onClick={() => navigate("/signup")}
          >
            Sign Up
          </span>
        </div>
      </div>
    </div>
  );
}

export default Login;