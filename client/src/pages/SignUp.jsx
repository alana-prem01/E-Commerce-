import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useGoogleLogin } from '@react-oauth/google';
import api from '../utils/api';
import ReCaptcha from '../Components/ReCaptcha';
import '../css/SignUp.css';

const SignUp = () => {
  const navigate = useNavigate();

  // Handle Google OAuth Success
  const handleGoogleSuccess = async (tokenResponse) => {
    try {
      setIsSubmitting(true);
      const response = await api.post('/auth/google', { access_token: tokenResponse.access_token });
      if (response.success) {
        toast.success(response.message || 'Signed up with Google successfully!');
        localStorage.setItem('accessToken', response.accessToken);
        localStorage.setItem('user', JSON.stringify(response.user));
        localStorage.setItem('isLoggedIn', 'true');
        window.dispatchEvent(new Event('auth-change'));
        navigate('/');
      }
    } catch (err) {
      toast.error(err.message || 'Google signup failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const loginWithGoogle = useGoogleLogin({
    onSuccess: handleGoogleSuccess,
    onError: (error) => {
      console.error('Google Auth Error:', error);
      toast.error('Google Sign Up failed. Please check your configuration.');
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

  // Form Field States
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    consent: false,
  });

  const [countryCode, setCountryCode] = useState('+91');

  // UI Visibility States
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Validation Error States
  const [errors, setErrors] = useState({});
  const [passwordStrength, setPasswordStrength] = useState('');

  // Google reCAPTCHA State
  const [recaptchaToken, setRecaptchaToken] = useState('');
  const [recaptchaError, setRecaptchaError] = useState('');

  // Handle Input Changes
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    const val = type === 'checkbox' ? checked : value;

    setFormData((prev) => ({
      ...prev,
      [name]: val,
    }));

    // Real-time validations
    if (name === 'password') {
      checkPasswordStrength(value);
      if (formData.confirmPassword) {
        validateConfirmPassword(value, formData.confirmPassword);
      }
    }

    if (name === 'confirmPassword') {
      validateConfirmPassword(formData.password, value);
    }

    // Clear phone error on change
    if (name === 'phone') {
      setErrors((prev) => ({ ...prev, phone: '' }));
    }
  };

  // Block non-numeric characters in phone field
  const handlePhoneKeyDown = (e) => {
    const allowedKeys = ['Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'Tab', 'Home', 'End'];
    if (!allowedKeys.includes(e.key) && !/^[0-9]$/.test(e.key)) {
      e.preventDefault();
    }
  };

  // Block non-numeric pasted content in phone field
  const handlePhonePaste = (e) => {
    e.preventDefault();
    const pasted = (e.clipboardData || window.clipboardData).getData('text');
    const digitsOnly = pasted.replace(/\D/g, '').slice(0, 15);
    setFormData((prev) => ({ ...prev, phone: prev.phone + digitsOnly }));
  };

  // Password Strength Calculation
  const checkPasswordStrength = (val) => {
    const lengthValid = val.length >= 8 && val.length <= 20;
    const hasUpper = /[A-Z]/.test(val);
    const hasLower = /[a-z]/.test(val);
    const hasNumber = /[0-9]/.test(val);
    const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(val);
    const noSpace = !/\s/.test(val);

    const isValid = lengthValid && hasUpper && hasLower && hasNumber && hasSpecial && noSpace;

    if (!val) {
      setPasswordStrength('');
    } else if (isValid) {
      setPasswordStrength('Strong');
    } else if (val.length >= 6 && (hasUpper || hasNumber)) {
      setPasswordStrength('Medium');
    } else {
      setPasswordStrength('Weak');
    }
  };

  // Confirm Password Check
  const validateConfirmPassword = (pass, confirmPass) => {
    if (pass !== confirmPass) {
      setErrors((prev) => ({ ...prev, confirmPassword: 'Passwords do not match.' }));
    } else {
      setErrors((prev) => ({ ...prev, confirmPassword: '' }));
    }
  };

  // Field Blur Validations
  const handleBlur = (e) => {
    const { name, value } = e.target;

    if (name === 'fullName') {
      const trimmed = value.trim();
      const regex = /^[A-Za-z\s'-]{3,50}$/;
      if (!regex.test(trimmed)) {
        setErrors((prev) => ({
          ...prev,
          fullName: 'Please enter a valid name (3-50 letters/spaces only).',
        }));
      } else {
        setErrors((prev) => ({ ...prev, fullName: '' }));
      }
    }

    if (name === 'email') {
      const lowercased = value.toLowerCase();
      const trimmed = lowercased.trim();
      setFormData((prev) => ({ ...prev, email: trimmed }));
      const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
      if (!trimmed) {
        setErrors((prev) => ({ ...prev, email: 'Email is required.' }));
      } else if (/\s/.test(value)) {
        setErrors((prev) => ({ ...prev, email: 'Email cannot contain spaces.' }));
      } else if ((trimmed.match(/@/g) || []).length !== 1) {
        setErrors((prev) => ({ ...prev, email: "Email must contain exactly one '@' symbol." }));
      } else if (!emailRegex.test(trimmed) || trimmed.length > 100) {
        setErrors((prev) => ({
          ...prev,
          email: 'Please enter a valid email address.',
        }));
      } else {
        setErrors((prev) => ({ ...prev, email: '' }));
      }
    }

    if (name === 'phone') {
      const digits = value.replace(/\D/g, '');
      if (!digits) {
        setErrors((prev) => ({ ...prev, phone: 'Phone number is required.' }));
      } else if (countryCode === '+91') {
        if (digits.length !== 10) {
          setErrors((prev) => ({ ...prev, phone: 'Please enter a valid 10-digit Indian mobile number.' }));
        } else if (!/^[6-9]\d{9}$/.test(digits)) {
          setErrors((prev) => ({ ...prev, phone: 'Indian mobile numbers must start with 6, 7, 8, or 9.' }));
        } else {
          setErrors((prev) => ({ ...prev, phone: '' }));
        }
      } else if (digits.length < 7 || digits.length > 15) {
        setErrors((prev) => ({ ...prev, phone: 'Please enter a valid phone number.' }));
      } else {
        setErrors((prev) => ({ ...prev, phone: '' }));
      }
    }

    if (name === 'password') {
      const val = value;
      const isValid =
        val.length >= 8 &&
        val.length <= 20 &&
        /[A-Z]/.test(val) &&
        /[a-z]/.test(val) &&
        /[0-9]/.test(val) &&
        /[!@#$%^&*(),.?":{}|<>]/.test(val) &&
        !/\s/.test(val);

      if (!isValid) {
        setErrors((prev) => ({
          ...prev,
          password: 'Must be 8-20 chars with upper, lower, number & special char.',
        }));
      } else {
        setErrors((prev) => ({ ...prev, password: '' }));
      }
    }
  };

  // Submit Handler
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Check consent
    if (!formData.consent) {
      setErrors((prev) => ({
        ...prev,
        consent: 'You must accept the terms and policies to continue.',
      }));
      return;
    } else {
      setErrors((prev) => ({ ...prev, consent: '' }));
    }

    if (!errors.fullName && !errors.email && !errors.phone && !errors.password && !errors.confirmPassword) {
      // Validate phone before submitting
      const phoneDigits = formData.phone.replace(/\D/g, '');
      if (!phoneDigits) {
        setErrors((prev) => ({ ...prev, phone: 'Phone number is required.' }));
        return;
      }
      if (countryCode === '+91') {
        if (phoneDigits.length !== 10) {
          setErrors((prev) => ({ ...prev, phone: 'Please enter a valid 10-digit Indian mobile number.' }));
          return;
        }
        if (!/^[6-9]\d{9}$/.test(phoneDigits)) {
          setErrors((prev) => ({ ...prev, phone: 'Indian mobile numbers must start with 6, 7, 8, or 9.' }));
          return;
        }
      } else if (phoneDigits.length < 7 || phoneDigits.length > 15) {
        setErrors((prev) => ({ ...prev, phone: 'Please enter a valid phone number.' }));
        return;
      }
      setIsSubmitting(true);
      try {
        const payload = {
          name: formData.fullName,
          email: formData.email,
          phone: `${countryCode}${phoneDigits}`,
          password: formData.password,
          confirmPassword: formData.confirmPassword,
          consent: formData.consent,
          recaptchaToken: recaptchaToken,
        };
        const response = await api.post("/auth/signup", payload);
        if (response.success) {
          toast.success(response.message || 'Account Created Successfully!');
          navigate('/login');
        }
      } catch (err) {
        toast.error(err.message || "Failed to create account. Please try again.");
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
          <div className="logo-mark">L</div>
          <div className="logo-text">ELORA</div>
        </div>

        {/* Page Heading & Subtext */}
        <h1 className="page-heading">Create Your Account</h1>
        <p className="subtext">Join us today to get started with your journey</p>

        {/* Form */}
        <form onSubmit={handleSubmit} noValidate>
          <div className="form-fields-container">
            {/* Full Name */}
            <div className="field-group">
              <label className="field-label" htmlFor="fullName">
                Full Name
              </label>
              <input
                type="text"
                id="fullName"
                name="fullName"
                placeholder="Enter your full name"
                maxLength={50}
                value={formData.fullName}
                onChange={handleChange}
                onBlur={handleBlur}
                className="input-field"
                required
              />
              {errors.fullName && <span className="error-message">{errors.fullName}</span>}
            </div>

            {/* Email Input */}
            <div className="field-group">
              <label className="field-label" htmlFor="email">
                Email Address
              </label>
              <input
                type="email"
                id="email"
                name="email"
                placeholder="Enter your email address"
                maxLength={100}
                value={formData.email}
                onChange={handleChange}
                onBlur={handleBlur}
                className="input-field"
                required
              />
              {errors.email && <span className="error-message">{errors.email}</span>}
            </div>

            {/* Phone Input */}
            <div className="field-group">
              <label className="field-label" htmlFor="phone">
                Phone Number
              </label>
              <div style={{ display: 'flex', gap: '8px' }}>
                <select
                  value={countryCode}
                  onChange={(e) => setCountryCode(e.target.value)}
                  style={{ padding: '12px', border: '1px solid #d1d5db', borderRadius: '4px', backgroundColor: '#fff' }}
                >
                  <option value="+91">+91 (IN)</option>
                  <option value="+1">+1 (US/CA)</option>
                  <option value="+44">+44 (UK)</option>
                  <option value="+61">+61 (AU)</option>
                  <option value="+971">+971 (AE)</option>
                </select>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  placeholder="Enter phone number"
                  maxLength={15}
                  value={formData.phone}
                  onChange={handleChange}
                  onKeyDown={handlePhoneKeyDown}
                  onPaste={handlePhonePaste}
                  onBlur={handleBlur}
                  className="input-field"
                  style={{ flex: 1 }}
                  required
                  inputMode="numeric"
                />
              </div>
              {errors.phone && <span className="error-message">{errors.phone}</span>}
            </div>

            {/* Password Input */}
            <div className="field-group">
              <label className="field-label" htmlFor="password">
                Password
              </label>
              <div className="input-wrapper">
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  name="password"
                  placeholder="Create a password"
                  maxLength={20}
                  value={formData.password}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  className="input-field input-field-padded"
                  required
                />
                <span
                  onClick={() => setShowPassword(!showPassword)}
                  className="toggle-password"
                >
                  {showPassword ? 'Hide' : 'Show'}
                </span>
              </div>
              {passwordStrength && (
                <span
                  className={`strength-indicator ${
                    passwordStrength === 'Strong'
                      ? 'strength-strong'
                      : passwordStrength === 'Medium'
                      ? 'strength-medium'
                      : 'strength-weak'
                  }`}
                >
                  Strength: {passwordStrength}
                </span>
              )}
              {errors.password && <span className="error-message">{errors.password}</span>}
            </div>

            {/* Confirm Password Input */}
            <div className="field-group">
              <label className="field-label" htmlFor="confirmPassword">
                Confirm Password
              </label>
              <div className="input-wrapper">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  id="confirmPassword"
                  name="confirmPassword"
                  placeholder="Confirm your password"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className="input-field input-field-padded"
                  required
                />
                <span
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="toggle-password"
                >
                  {showConfirmPassword ? 'Hide' : 'Show'}
                </span>
              </div>
              {errors.confirmPassword && (
                <span className="error-message">{errors.confirmPassword}</span>
              )}
            </div>
          </div>

          {/* Consent Row */}
          <div className="consent-row">
            <input
              type="checkbox"
              id="consent"
              name="consent"
              checked={formData.consent}
              onChange={handleChange}
              className="checkbox"
              required
            />
            <label htmlFor="consent" className="consent-text">
              I accept the{' '}
              <Link to="/terms-conditions" className="link" target="_blank" rel="noopener noreferrer">
                Terms &amp; Conditions
              </Link>{' '}
              and{' '}
              <Link to="/privacy-policy" className="link" target="_blank" rel="noopener noreferrer">
                Privacy Policy
              </Link>
            </label>
          </div>
          {errors.consent && (
            <span className="error-message error-message-consent">
              {errors.consent}
            </span>
          )}

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

          {/* Create Account Button */}
          <button type="submit" className="create-account-btn" disabled={isSubmitting}>
            {isSubmitting ? 'Creating Account...' : 'Create Account'}
          </button>

          {/* Divider Row */}
          <div className="divider-row">
            <div className="divider-line" />
            <span className="divider-text">OR</span>
            <div className="divider-line" />
          </div>

          {/* Google Sign Up Button */}
          <button
            type="button"
            className="google-btn"
            onClick={handleGoogleClick}
            disabled={isSubmitting}
          >
            <svg width="18" height="18" viewBox="0 0 18 18">
              <path fill="#4285F4" d="M17.64 9.2c0-.74-.06-1.28-.19-1.84H9v3.34h4.96c-.1.83-.64 2.08-1.84 2.92l2.84 2.2c1.7-1.57 2.68-3.88 2.68-6.62z"/>
              <path fill="#34A853" d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.84-2.2c-.76.53-1.78.9-3.12.9-2.38 0-4.41-1.57-5.13-3.72L.97 13.02C2.45 15.98 5.48 18 9 18z"/>
              <path fill="#FBBC05" d="M3.87 10.8c-.18-.53-.28-1.1-.28-1.8s.1-1.27.28-1.8L.97 4.98C.35 6.22 0 7.6 0 9s.35 2.78.97 4.02l2.9-2.22z"/>
              <path fill="#EA4335" d="M9 3.58c1.32 0 2.5.45 3.44 1.35l2.58-2.58C13.46.89 11.43 0 9 0 5.48 0 2.45 2.02.97 4.98l2.9 2.22C4.59 5.05 6.62 3.58 9 3.58z"/>
            </svg>
            <span>Sign up with Google</span>
          </button>

          {/* Footer Row */}
          <div className="footer-row">
            <span className="footer-text">Already have an account?</span>
            <span 
              className="sign-in-link" 
              onClick={() => navigate('/login')}
              style={{ cursor: 'pointer' }}
            >
              Sign In
            </span>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SignUp;