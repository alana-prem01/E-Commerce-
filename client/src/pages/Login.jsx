import React, { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "react-toastify";
import { FiEye, FiEyeOff } from "react-icons/fi";
import { useGoogleLogin } from "@react-oauth/google";
import api from "../utils/api";
import ReCaptcha from "../Components/ReCaptcha";
import "../css/Login.css";

function Login() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  // Where to go after login — honour ?redirect= or fall back to home
  const redirectTarget = searchParams.get('redirect') || '/';

  // Handle Google OAuth Success
  const handleGoogleSuccess = async (tokenResponse) => {
    try {
      setIsSubmitting(true);
      const response = await api.post('/auth/google', { access_token: tokenResponse.access_token });
      if (response.success) {
        toast.success(response.message || 'Signed in with Google successfully!');
        localStorage.setItem('accessToken', response.accessToken);
        localStorage.setItem('user', JSON.stringify(response.user));
        localStorage.setItem('isLoggedIn', 'true');
        window.dispatchEvent(new Event('auth-change'));

        if (response.user.role === 'Admin') {
          toast.error("Admins must use the Admin Portal to sign in.");
          localStorage.clear();
          return;
        }

        const url = new URL('http://dummy' + redirectTarget);
        const productId = url.searchParams.get('productId');
        const qtyParam = url.searchParams.get('qty');
        const qty = qtyParam ? parseInt(qtyParam, 10) : 1;

        if (productId) {
          api.post('/cart/addcart', { productId, quantity: qty })
            .then(() => navigate('/checkout'))
            .catch(() => navigate(redirectTarget));
        } else {
          navigate(redirectTarget);
        }
      }
    } catch (err) {
      toast.error(err.message || 'Google sign-in failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const loginWithGoogle = useGoogleLogin({
    onSuccess: handleGoogleSuccess,
    onError: (error) => {
      console.error('Google Auth Error:', error);
      toast.error('Google Sign In failed. Please check your configuration.');
    },
  });

  const handleGoogleClick = () => {
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
    if (!clientId || clientId.includes('dummy')) {
      toast.info('Google Client ID is not configured. Please add VITE_GOOGLE_CLIENT_ID to your client/.env file.');
      return;
    }
    loginWithGoogle();
  };

  // State Management
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
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

  const handleLogin = async (e) => {
    e.preventDefault();

    let isValid = true;
    setEmailError("");
    setPasswordError("");
    setTermsError("");
    setRecaptchaError("");

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

        {/* Google Sign In Button */}
        <button
          type="button"
          className="google-btn"
          onClick={handleGoogleClick}
          disabled={isSubmitting}
        >
          <svg width="18" height="18" viewBox="0 0 18 18">
            <path fill="#4285F4" d="M17.64 9.2c0-.74-.06-1.28-.19-1.84H9v3.34h4.96c-.1.83-.64 2.08-1.84 2.92l2.84 2.2c1.7-1.57 2.68-3.88 2.68-6.62z" />
            <path fill="#34A853" d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.84-2.2c-.76.53-1.78.9-3.12.9-2.38 0-4.41-1.57-5.13-3.72L.97 13.02C2.45 15.98 5.48 18 9 18z" />
            <path fill="#FBBC05" d="M3.87 10.8c-.18-.53-.28-1.1-.28-1.8s.1-1.27.28-1.8L.97 4.98C.35 6.22 0 7.6 0 9s.35 2.78.97 4.02l2.9-2.22z" />
            <path fill="#EA4335" d="M9 3.58c1.32 0 2.5.45 3.44 1.35l2.58-2.58C13.46.89 11.43 0 9 0 5.48 0 2.45 2.02.97 4.98l2.9 2.22C4.59 5.05 6.62 3.58 9 3.58z" />
          </svg>
          <span>Sign in with Google</span>
        </button>

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