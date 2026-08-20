import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import api from '../utils/api';
import '../css/OTPVerificationPage.css';

export default function OTPVerificationPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState('email'); // 'email' or 'otp'
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validateEmail = (emailVal) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(String(emailVal).toLowerCase());
  };

  const handleSendOTP = async (e) => {
    e.preventDefault();
    setError('');

    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      setError('Email field is required.');
      return;
    }

    if (!validateEmail(trimmedEmail)) {
      setError('Please enter a valid email address.');
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await api.post('/auth/forgot-password', { email: trimmedEmail });
      if (response.success) {
        toast.success(response.message || 'OTP sent to your email!');
        setStep('otp');
      } else {
        setError(response.message || 'Failed to send OTP.');
      }
    } catch (err) {
      console.error('Send OTP error:', err);
      setError(err.message || 'Email address is not registered.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    setError('');

    const trimmedOtp = otp.trim();
    if (!trimmedOtp) {
      setError('OTP is required.');
      return;
    }

    if (trimmedOtp.length !== 6 || !/^\d+$/.test(trimmedOtp)) {
      setError('Please enter a valid 6-digit OTP.');
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await api.post('/auth/verify-otp', {
        email: email.trim(),
        otp: trimmedOtp,
      });

      if (response.success) {
        toast.success('OTP verified successfully!');
        navigate('/reset-password', {
          state: { email: email.trim(), otp: trimmedOtp },
        });
      } else {
        setError(response.message || 'Invalid or expired OTP.');
      }
    } catch (err) {
      console.error('Verify OTP error:', err);
      setError(err.message || 'Invalid or expired OTP.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResendOTP = async () => {
    setError('');
    setIsSubmitting(true);
    try {
      const response = await api.post('/auth/forgot-password', { email: email.trim() });
      if (response.success) {
        toast.success('A new OTP has been sent to your email.');
      }
    } catch (err) {
      setError(err.message || 'Failed to resend OTP.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="otp-page-wrapper">
      <div className="otp-card-container">
        
        {/* Section 2 – Logo/Icon Section */}
        <div className="otp-icon-container">
          <svg className="otp-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
            <polyline points="22,6 12,13 2,6" />
          </svg>
        </div>

        {step === 'email' ? (
          <>
            {/* Section 3 – Heading Section */}
            <div className="otp-message-section">
              <h1 className="otp-heading">Forgot Password</h1>
              <p className="otp-description">Enter your registered email address to receive a verification code.</p>
            </div>

            <form className="otp-form" onSubmit={handleSendOTP}>
              {/* Section 4 – Email Input */}
              <div className="otp-input-group">
                <label className="otp-field-label">Email Address</label>
                <div className="otp-input-wrapper">
                  <svg className="otp-mail-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                    <polyline points="22,6 12,13 2,6" />
                  </svg>
                  <input 
                    type="text" 
                    className="otp-input-box" 
                    placeholder="Enter your email address" 
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (error) setError('');
                    }}
                  />
                </div>
                {error && <span className="otp-error-message">{error}</span>}
              </div>

              {/* Section 5 – Send OTP Button */}
              <button 
                type="submit" 
                className="otp-primary-button"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Sending Code...' : 'Send OTP'}
              </button>
            </form>
          </>
        ) : (
          <>
            {/* Section 3 – Verify OTP Heading */}
            <div className="otp-message-section">
              <h1 className="otp-heading">Verify OTP</h1>
              <p className="otp-description">Enter the 6-digit verification code sent to {email}.</p>
            </div>

            <form className="otp-form" onSubmit={handleVerifyOTP}>
              {/* OTP Input */}
              <div className="otp-input-group">
                <label className="otp-field-label">Verification Code (OTP)</label>
                <div className="otp-input-wrapper">
                  <svg className="otp-mail-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                    <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                  </svg>
                  <input 
                    type="text" 
                    className="otp-input-box" 
                    placeholder="Enter 6-digit OTP" 
                    maxLength={6}
                    value={otp}
                    onChange={(e) => {
                      setOtp(e.target.value);
                      if (error) setError('');
                    }}
                  />
                </div>
                {error && <span className="otp-error-message">{error}</span>}
              </div>

              {/* Verify OTP Button */}
              <button 
                type="submit" 
                className="otp-primary-button"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Verifying...' : 'Verify OTP'}
              </button>

              <div style={{ textAlign: 'center', marginTop: '8px' }}>
                <span 
                  onClick={handleResendOTP} 
                  style={{ fontSize: '13px', color: 'var(--primary-color-hover)', cursor: 'pointer', fontWeight: 500 }}
                >
                  Resend OTP
                </span>
              </div>
            </form>
          </>
        )}

        {/* Section 6 – Footer Row */}
        <div className="otp-footer-row">
          <span className="otp-footer-text">Remember your password?</span>
          <span className="otp-sign-in-link" onClick={() => navigate('/login')}>Sign In</span>
        </div>

      </div>
    </div>
  );
}
