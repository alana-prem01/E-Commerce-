import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { toast } from "react-toastify";
import { FiEye, FiEyeOff } from "react-icons/fi";
import { useGoogleLogin } from "@react-oauth/google";
import api from "../utils/api";
import ReCaptcha from "../Components/ReCaptcha";
import AccountLockedModal from "../Components/AccountLockedModal";
import SuspiciousLoginModal from "../Components/SuspiciousLoginModal";
import GoogleLinkModal from "../Components/GoogleLinkModal";
import "../css/Login.css";

function Login() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  // Where to go after login — honour ?redirect= or fall back to home
  const redirectTarget = searchParams.get('redirect') || '/';

  // Redirect already authenticated users away from login page
  useEffect(() => {
    const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
    const token = localStorage.getItem('accessToken');
    if (isLoggedIn && token) {
      try {
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        if (user.role === 'Admin') {
          navigate('/admin-dashboard', { replace: true });
        } else {
          navigate(redirectTarget, { replace: true });
        }
      } catch {
        navigate('/', { replace: true });
      }
    }
  }, [navigate, redirectTarget]);

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

        navigate(redirectTarget);
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
      if (error?.error === 'popup_closed_by_user') {
        toast.info('Google login cancelled.');
      } else if (error?.error === 'access_denied') {
        toast.error('Google permission denied.');
      } else if (error?.error === 'popup_blocked_by_browser') {
        toast.error('Google popup was blocked by browser. Please allow popups.');
      } else {
        toast.error(error?.error_description || 'Google Sign In failed. Please try again.');
      }
    },
  });

  const handleGoogleClick = () => {
    if (isSubmitting) return;
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
    if (!clientId || clientId.includes('dummy')) {
      toast.info('Google Client ID is not configured. Please add VITE_GOOGLE_CLIENT_ID to your client/.env file.');
      return;
    }
    loginWithGoogle();
  };

  // State Management
  const [loginMethod, setLoginMethod] = useState("email"); // 'email' | 'mobile'
  const [mobileAuthMode, setMobileAuthMode] = useState("password"); // 'password' | 'otp'
  const [mobileStep, setMobileStep] = useState("phone"); // 'phone' | 'otp'
  const [countryCode, setCountryCode] = useState("+91");
  const [mobileNumber, setMobileNumber] = useState("");
  const [countrySearch, setCountrySearch] = useState("");
  const [mobileOtp, setMobileOtp] = useState("");
  const [resendCooldown, setResendCooldown] = useState(0);
  const [phoneError, setPhoneError] = useState("");
  const [otpError, setOtpError] = useState("");
  const [isSendingOtp, setIsSendingOtp] = useState(false);

  const COUNTRIES = [
    { code: "+91", iso: "IN", name: "India" },
    { code: "+1", iso: "US", name: "United States / Canada" },
    { code: "+44", iso: "GB", name: "United Kingdom" },
    { code: "+61", iso: "AU", name: "Australia" },
    { code: "+971", iso: "AE", name: "United Arab Emirates" },
    { code: "+49", iso: "DE", name: "Germany" },
    { code: "+33", iso: "FR", name: "France" },
    { code: "+81", iso: "JP", name: "Japan" },
    { code: "+65", iso: "SG", name: "Singapore" },
    { code: "+966", iso: "SA", name: "Saudi Arabia" },
  ];

  const filteredCountries = COUNTRIES.filter(
    (c) =>
      c.name.toLowerCase().includes(countrySearch.toLowerCase()) ||
      c.code.includes(countrySearch)
  );

  // Resend Timer Effect
  useEffect(() => {
    let timer;
    if (resendCooldown > 0) {
      timer = setInterval(() => {
        setResendCooldown((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [resendCooldown]);

  const [email, setEmail] = useState(() => localStorage.getItem('rememberedUser') || "");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(() => Boolean(localStorage.getItem('rememberedUser')));
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

  // Modal States
  const [accountLockedOpen, setAccountLockedOpen] = useState(false);
  const [suspiciousLoginOpen, setSuspiciousLoginOpen] = useState(false);
  const [googleLinkOpen, setGoogleLinkOpen] = useState(false);
  const [googleLinkEmail, setGoogleLinkEmail] = useState("");

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
    } else if (/\.\./.test(trimmed)) {
      return "Email cannot contain consecutive dots.";
    } else if (trimmed.length > 100) {
      return "Email cannot exceed 100 characters.";
    } else if (!emailRegex.test(trimmed)) {
      const parts = trimmed.split('@');
      if (parts.length === 2) {
        if (!parts[0]) return "Email is missing name before '@'.";
        if (!parts[1]) return "Email is missing domain after '@'.";
        if (!parts[1].includes('.')) return "Email domain must include a top-level domain (e.g. .com).";
      }
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

  const validatePhoneField = (val, code) => {
    const digits = val.replace(/\D/g, "");
    if (!digits) {
      return "Mobile number is required.";
    }
    if (code === "+91") {
      if (digits.length !== 10) {
        return "Please enter a valid 10-digit Indian mobile number.";
      }
      if (!/^[6-9]\d{9}$/.test(digits)) {
        return "Indian mobile numbers must start with 6, 7, 8, or 9.";
      }
    } else if (digits.length < 7 || digits.length > 15) {
      return "Please enter a valid mobile number (7-15 digits).";
    }
    return "";
  };

  const handlePhoneKeyDown = (e) => {
    const allowed = ["Backspace", "Delete", "ArrowLeft", "ArrowRight", "Tab", "Home", "End"];
    if (!allowed.includes(e.key) && !/^[0-9]$/.test(e.key)) {
      e.preventDefault();
    }
  };

  const handlePhonePaste = (e) => {
    e.preventDefault();
    const pasted = (e.clipboardData || window.clipboardData).getData("text");
    const digitsOnly = pasted.replace(/\D/g, "").slice(0, 15);
    setMobileNumber((prev) => (prev + digitsOnly).slice(0, 15));
    setPhoneError(validatePhoneField(mobileNumber + digitsOnly, countryCode));
  };

  const handleOtpPaste = (e) => {
    e.preventDefault();
    const pasted = (e.clipboardData || window.clipboardData).getData("text");
    const digitsOnly = pasted.replace(/\D/g, "").slice(0, 6);
    if (digitsOnly) {
      setMobileOtp(digitsOnly);
      setOtpError(digitsOnly.length === 6 ? "" : "Please enter complete 6-digit OTP.");
    }
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

  const handleMobilePasswordLogin = async (e) => {
    e.preventDefault();
    setApiError("");

    let isValid = true;
    const errPhone = validatePhoneField(mobileNumber, countryCode);
    const errPassword = validatePasswordField(password);

    setPhoneError(errPhone);
    setPasswordError(errPassword);
    setTermsError("");
    setRecaptchaError("");

    if (errPhone || errPassword) {
      isValid = false;
    }

    if (!acceptTerms) {
      setTermsError("You must accept the Privacy Policy and Terms of Service.");
      isValid = false;
    }

    if (!recaptchaToken) {
      setRecaptchaError("Please complete the Google reCAPTCHA verification.");
      isValid = false;
    }

    if (isValid) {
      setIsSubmitting(true);
      try {
        const response = await api.post("/auth/signin", {
          phone: mobileNumber.replace(/\D/g, ""),
          countryCode: countryCode,
          password: password,
          recaptchaToken: recaptchaToken,
        });

        if (response.success) {
          toast.success(response.message || "Mobile Login Successful!");

          localStorage.setItem("accessToken", response.accessToken);
          localStorage.setItem("user", JSON.stringify(response.user));
          localStorage.setItem("isLoggedIn", "true");

          if (rememberMe) {
            localStorage.setItem("rememberedUser", mobileNumber);
          } else {
            localStorage.removeItem("rememberedUser");
          }

          window.dispatchEvent(new Event("auth-change"));

          if (response.user.role === "Admin") {
            toast.error("Admins must use the Admin Portal to sign in.");
            localStorage.clear();
            return;
          }

          navigate(redirectTarget);
        }
      } catch (error) {
        let msg = error.message || "Invalid mobile number or password.";
        if (msg.toLowerCase().includes("failed to fetch") || msg.toLowerCase().includes("networkerror")) {
          msg = "Network error: Unable to connect to backend server. Please check your connection.";
        }
        setApiError(msg);
        toast.error(msg);
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  const handleSendMobileOTP = async (e) => {
    if (e) e.preventDefault();
    setApiError("");
    const errPhone = validatePhoneField(mobileNumber, countryCode);
    setPhoneError(errPhone);
    setTermsError("");

    if (errPhone) return;

    if (!acceptTerms) {
      setTermsError("You must accept the Privacy Policy and Terms of Service.");
      return;
    }

    setIsSendingOtp(true);
    try {
      const response = await api.post("/auth/send-mobile-otp", {
        phone: mobileNumber.replace(/\D/g, ""),
        countryCode: countryCode,
      });

      if (response.success) {
        toast.success(response.message || "OTP sent successfully!");
        setMobileStep("otp");
        setResendCooldown(60);
        setOtpError("");
      }
    } catch (error) {
      let msg = error.message || "Failed to send OTP.";
      if (msg.toLowerCase().includes("failed to fetch") || msg.toLowerCase().includes("networkerror")) {
        msg = "Network error: Unable to connect to backend server. Please check your connection.";
      }
      setApiError(msg);
      toast.error(msg);
    } finally {
      setIsSendingOtp(false);
    }
  };

  const handleVerifyMobileOTP = async (e) => {
    e.preventDefault();
    setApiError("");

    const trimmedOtp = mobileOtp.trim();
    if (!trimmedOtp) {
      setOtpError("OTP is required.");
      return;
    }
    if (trimmedOtp.length !== 6 || !/^\d+$/.test(trimmedOtp)) {
      setOtpError("Please enter a valid 6-digit numeric OTP.");
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await api.post("/auth/verify-mobile-otp", {
        phone: mobileNumber.replace(/\D/g, ""),
        countryCode: countryCode,
        otp: trimmedOtp,
      });

      if (response.success) {
        toast.success(response.message || "Mobile Login Successful!");
        localStorage.setItem("accessToken", response.accessToken);
        localStorage.setItem("user", JSON.stringify(response.user));
        localStorage.setItem("isLoggedIn", "true");
        window.dispatchEvent(new Event("auth-change"));
        navigate(redirectTarget);
      }
    } catch (error) {
      let msg = error.message || "OTP verification failed.";
      if (msg.toLowerCase().includes("failed to fetch") || msg.toLowerCase().includes("networkerror")) {
        msg = "Network error: Unable to connect to backend server. Please check your connection.";
      }
      setApiError(msg);
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
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
          toast.success(response.message || "Login Successful!");

          // Store Access Token & User Details
          localStorage.setItem("accessToken", response.accessToken);
          localStorage.setItem("user", JSON.stringify(response.user));
          localStorage.setItem("isLoggedIn", "true");

          if (rememberMe) {
            localStorage.setItem("rememberedUser", trimmedEmail);
          } else {
            localStorage.removeItem("rememberedUser");
          }

          window.dispatchEvent(new Event('auth-change'));

          if (response.user.role === 'Admin') {
            toast.error("Admins must use the Admin Portal to sign in.");
            localStorage.clear();
            return;
          }

          // Navigate to redirectTarget (Checkout will handle Buy Now flow if buyNow params are present)
          navigate(redirectTarget);
        }
      } catch (error) {
        let msg = error.message || "Unable to connect to the backend server.";
        if (msg.toLowerCase().includes("failed to fetch") || msg.toLowerCase().includes("networkerror")) {
          msg = "Network error: Unable to connect to backend server. Please check your connection.";
        }
        if (msg.toLowerCase().includes("locked") || msg.toLowerCase().includes("try again in")) {
          setAccountLockedOpen(true);
        } else if (msg.toLowerCase().includes("suspicious") || msg.toLowerCase().includes("device")) {
          setSuspiciousLoginOpen(true);
        }
        setApiError(msg);
        toast.error(msg);
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

        {/* Login Method Toggle Tabs */}
        <div style={{ display: 'flex', borderBottom: '1px solid #E5E7EB', marginBottom: '22px' }}>
          <button
            type="button"
            onClick={() => { setLoginMethod('email'); setApiError(''); }}
            style={{
              flex: 1,
              padding: '10px 0',
              background: 'none',
              border: 'none',
              borderBottom: loginMethod === 'email' ? '2px solid var(--primary-color-dark)' : '2px solid transparent',
              fontWeight: loginMethod === 'email' ? 600 : 400,
              color: loginMethod === 'email' ? 'var(--primary-color-dark)' : 'var(--text-secondary)',
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            Email Login
          </button>
          <button
            type="button"
            onClick={() => { setLoginMethod('mobile'); setApiError(''); }}
            style={{
              flex: 1,
              padding: '10px 0',
              background: 'none',
              border: 'none',
              borderBottom: loginMethod === 'mobile' ? '2px solid var(--primary-color-dark)' : '2px solid transparent',
              fontWeight: loginMethod === 'mobile' ? 600 : 400,
              color: loginMethod === 'mobile' ? 'var(--primary-color-dark)' : 'var(--text-secondary)',
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            Mobile Login
          </button>
        </div>

        {/* Email Login Form */}
        {loginMethod === 'email' ? (
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
                  onChange={handleEmailChange}
                  onBlur={(e) => setEmailError(validateEmailField(e.target.value))}
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
                  I accept the{' '}
                  <Link to="/privacy-policy" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--primary-color)', textDecoration: 'underline' }}>Privacy Policy</Link>
                  {' '}and{' '}
                  <Link to="/terms-conditions" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--primary-color)', textDecoration: 'underline' }}>Terms of Service</Link>
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
            <div className="options-row" style={{ justifyContent: 'space-between' }}>
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
        ) : (
          /* Mobile Login Form (Country Code + Mobile Number + Password) */
          <form onSubmit={handleMobilePasswordLogin} noValidate>
            <div className="form-fields-container">
              {/* Country Code & Phone Input */}
              <div>
                <label className="field-label" htmlFor="countrySelectPass">
                  Country & Mobile Number
                </label>
                <div style={{ display: "flex", gap: "8px" }}>
                  <select
                    id="countrySelectPass"
                    value={countryCode}
                    onChange={(e) => {
                      setCountryCode(e.target.value);
                      if (mobileNumber) setPhoneError(validatePhoneField(mobileNumber, e.target.value));
                    }}
                    style={{
                      height: "44px",
                      padding: "0 8px",
                      border: "1px solid #D1D5DB",
                      borderRadius: "10px",
                      backgroundColor: "#fff",
                      fontFamily: "var(--body-font)",
                      fontSize: "13.5px",
                    }}
                  >
                    {COUNTRIES.map((c) => (
                      <option key={c.code} value={c.code}>
                        {c.code} ({c.iso})
                      </option>
                    ))}
                  </select>

                  <input
                    id="mobileNumberPass"
                    type="tel"
                    placeholder="Enter mobile number"
                    maxLength={15}
                    className="email-input"
                    style={{ flex: 1 }}
                    value={mobileNumber}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, "");
                      setMobileNumber(val);
                      setPhoneError(validatePhoneField(val, countryCode));
                      setApiError("");
                    }}
                    onKeyDown={handlePhoneKeyDown}
                    onPaste={handlePhonePaste}
                    onBlur={() => setPhoneError(validatePhoneField(mobileNumber, countryCode))}
                    required
                    inputMode="numeric"
                  />
                </div>
                {phoneError && <div className="error-message" style={{ marginTop: "4px" }}>{phoneError}</div>}
              </div>

              {/* Country Search Filter */}
              <div style={{ marginTop: "4px" }}>
                <input
                  type="text"
                  placeholder="Search country name or code..."
                  value={countrySearch}
                  onChange={(e) => setCountrySearch(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "6px 12px",
                    border: "1px solid #E5E7EB",
                    borderRadius: "6px",
                    fontSize: "12px",
                    boxSizing: "border-box",
                  }}
                />
                {countrySearch && (
                  <div
                    style={{
                      maxHeight: "120px",
                      overflowY: "auto",
                      border: "1px solid #E5E7EB",
                      borderRadius: "6px",
                      marginTop: "4px",
                      backgroundColor: "#FFF",
                    }}
                  >
                    {filteredCountries.length > 0 ? (
                      filteredCountries.map((c) => (
                        <div
                          key={c.code}
                          onClick={() => {
                            setCountryCode(c.code);
                            setCountrySearch("");
                            if (mobileNumber) setPhoneError(validatePhoneField(mobileNumber, c.code));
                          }}
                          style={{
                            padding: "6px 10px",
                            fontSize: "12.5px",
                            cursor: "pointer",
                            borderBottom: "1px solid #F3F4F6",
                          }}
                        >
                          <strong>{c.name}</strong> ({c.code})
                        </div>
                      ))
                    ) : (
                      <div style={{ padding: "6px 10px", fontSize: "12px", color: "gray" }}>No country found</div>
                    )}
                  </div>
                )}
              </div>

              {/* Password Input */}
              <div>
                <label className="field-label" htmlFor="mobilePassword">
                  Password
                </label>
                <div className="password-wrapper">
                  <input
                    id="mobilePassword"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
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

            {/* API / Credentials Error */}
            {apiError && (
              <div
                className="error-message"
                style={{
                  marginTop: "12px",
                  padding: "10px 14px",
                  background: "#FEF2F2",
                  border: "1px solid #FECACA",
                  borderRadius: "8px",
                  textAlign: "center",
                  fontSize: "13.5px",
                }}
              >
                {apiError}
              </div>
            )}

            {/* Privacy Terms */}
            <div style={{ marginTop: "16px" }}>
              <label className="remember-me">
                <input
                  type="checkbox"
                  checked={acceptTerms}
                  onChange={(e) => setAcceptTerms(e.target.checked)}
                  className="checkbox"
                />
                <span>
                  I accept the{" "}
                  <Link to="/privacy-policy" target="_blank" rel="noopener noreferrer" style={{ color: "var(--primary-color)", textDecoration: "underline" }}>
                    Privacy Policy
                  </Link>{" "}
                  and{" "}
                  <Link to="/terms-conditions" target="_blank" rel="noopener noreferrer" style={{ color: "var(--primary-color)", textDecoration: "underline" }}>
                    Terms of Service
                  </Link>
                </span>
              </label>
              {termsError && <div className="error-message" style={{ marginTop: "4px" }}>{termsError}</div>}
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
            {recaptchaError && <div className="error-message" style={{ marginTop: "4px", textAlign: "center" }}>{recaptchaError}</div>}

            {/* Options Row */}
            <div className="options-row" style={{ justifyContent: "space-between" }}>
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
              {isSubmitting ? "Authenticating..." : "Sign In"}
            </button>
          </form>
        )}

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

      <AccountLockedModal
        isOpen={accountLockedOpen}
        onClose={() => setAccountLockedOpen(false)}
      />
      <SuspiciousLoginModal
        isOpen={suspiciousLoginOpen}
        onClose={() => setSuspiciousLoginOpen(false)}
        onVerify={() => navigate("/otp")}
      />
      <GoogleLinkModal
        isOpen={googleLinkOpen}
        onClose={() => setGoogleLinkOpen(false)}
        email={googleLinkEmail}
        onConfirmLink={() => {
          toast.success("Accounts linked successfully!");
          setGoogleLinkOpen(false);
        }}
      />
    </div>
  );
}

export default Login;