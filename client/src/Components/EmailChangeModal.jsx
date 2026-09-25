import React, { useState } from 'react';
import OtpTimer from '../Components/OtpTimer';
import { api } from '../utils/api';

// Simple modal styling – you can adjust in UserProfile.css or create a separate CSS file
const modalBackdropStyle = {
  position: 'fixed',
  top: 0,
  left: 0,
  width: '100vw',
  height: '100vh',
  backgroundColor: 'rgba(0,0,0,0.4)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 1000,
};

const modalContentStyle = {
  background: 'rgba(255,255,255,0.93)',
  backdropFilter: 'blur(8px)',
  borderRadius: '12px',
  padding: '24px',
  width: '320px',
  boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
};

export default function EmailChangeModal({
  isOpen,
  onClose,
  currentEmail,
  newEmail,
  setNewEmail,
  otp,
  setOtp,
  otpSent,
  setOtpSent,
  otpError,
  setOtpError,
  otpSuccess,
  setOtpSuccess,
  isOtpLoading,
  setIsOtpLoading,
  isVerifying,
  setIsVerifying,
  onEmailUpdated,
}) {
  const [otpSentTime, setOtpSentTime] = useState(null);
const [step, setStep] = useState(1); // 1: send OTP, 2: verify OTP, 3: enter new email
  if (!isOpen) return null;

  const handleSendOtp = async () => {
    // OTP will be sent to the current email; no new email validation needed

    setIsOtpLoading(true);
    setOtpError('');
    setOtpSuccess('');
    try {
      const res = await api.post('/auth/change-email/send-otp', {});
      if (res.success) {
        setOtpSent(true);
        setOtpSuccess('OTP sent to your current email.');
        setOtpSentTime(Date.now());
        setStep(2);
      } else {
        setOtpError(res.message || 'Failed to send OTP.');
      }
    } catch (err) {
      setOtpError(err.message || err.data?.message || 'Failed to send OTP.');
    } finally {
      setIsOtpLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    const trimmedOtp = otp ? otp.trim() : '';
    if (!trimmedOtp) {
      setOtpError('Please enter the verification code.');
      return;
    }
    setIsVerifying(true);
    setOtpError('');
    setOtpSuccess('');
    try {
      const res = await api.post('/auth/change-email/verify-otp', { otp: trimmedOtp });
      if (res.success) {
        setOtpSuccess('OTP verified. You may now enter a new email.');
        setStep(3);
      } else {
        setOtpError(res.message || 'OTP verification failed.');
      }
    } catch (err) {
      setOtpError(err.message || err.data?.message || 'OTP verification failed.');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleUpdateEmail = async () => {
    const trimmedNewEmail = newEmail ? newEmail.trim() : '';
    if (!trimmedNewEmail) {
      setOtpError('Please enter a new email address.');
      return;
    }
    const emailRegex = /^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/;
    if (!emailRegex.test(trimmedNewEmail)) {
      setOtpError('Enter a valid email address.');
      return;
    }
    if (currentEmail && trimmedNewEmail.toLowerCase() === currentEmail.toLowerCase()) {
      setOtpError('New email cannot be the same as current email.');
      return;
    }
    setIsVerifying(true);
    setOtpError('');
    setOtpSuccess('');
    try {
      const res = await api.post('/auth/change-email/update-email', { newEmail: trimmedNewEmail });
      if (res.success) {
        onEmailUpdated(res.email || trimmedNewEmail);
        setOtpSuccess('Email updated successfully!');
        setTimeout(() => {
          onClose();
        }, 1200);
      } else {
        setOtpError(res.message || 'Failed to update email.');
      }
    } catch (err) {
      setOtpError(err.message || err.data?.message || 'Failed to update email.');
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <div style={modalBackdropStyle} onClick={onClose}>
      <div style={modalContentStyle} onClick={e => e.stopPropagation()}>
        <h3 style={{ marginTop: 0, marginBottom: '12px', color: 'var(--secondary-color)' }}>Change Email</h3>
        <p style={{ fontSize: '13px', marginBottom: '12px' }}>Current email: <strong>{currentEmail}</strong></p>

        {/* STEP 1 – Send OTP to current email */}
        {step === 1 && (
          <button
            className="btn-primary"
            onClick={handleSendOtp}
            disabled={isOtpLoading}
            style={{ width: '100%' }}
          >
            {isOtpLoading ? 'Sending OTP...' : 'Send OTP to Current Email'}
          </button>
        )}

        {/* STEP 2 – Verify OTP */}
        {step === 2 && (
          <>
            <p style={{ fontSize: '13px', marginBottom: '12px', color: '#555' }}>
              Please enter the OTP sent to your current email.
            </p>
            <div className="form-group" style={{ marginBottom: '12px' }}>
              <label style={{ fontSize: '12px', fontWeight: 600, color: '#555', display: 'block', marginBottom: '4px' }}>Verification Code (OTP)</label>
              <input
                type="text"
                placeholder="Enter 6-digit OTP"
                className="input-field"
                value={otp}
                onChange={e => { setOtp(e.target.value); setOtpError(''); }}
                maxLength={6}
              />
            </div>
            {otpSentTime && (
              <OtpTimer
                startTime={otpSentTime}
                onExpire={() => {
                  setStep(1);
                  setOtp('');
                  setOtpSent(false);
                }}
              />
            )}
            <button
              className="btn-primary"
              onClick={handleVerifyOtp}
              disabled={isVerifying}
              style={{ marginTop: '8px', width: '100%' }}
            >
              {isVerifying ? 'Verifying...' : 'Verify OTP'}
            </button>
          </>
        )}

        {/* STEP 3 – Enter new email and update */}
        {step === 3 && (
          <>
            <div className="form-group" style={{ marginBottom: '12px' }}>
              <label style={{ fontSize: '12px', fontWeight: 600, color: '#555', display: 'block', marginBottom: '4px' }}>New Email Address</label>
              <input
                type="email"
                placeholder="new.email@example.com"
                className="input-field"
                value={newEmail}
                onChange={e => { setNewEmail(e.target.value); setOtpError(''); }}
              />
            </div>
            <button
              className="btn-primary"
              onClick={handleUpdateEmail}
              disabled={isVerifying}
              style={{ marginTop: '8px', width: '100%' }}
            >
              {isVerifying ? 'Updating...' : 'Update Email'}
            </button>
          </>
        )}

        {/* Feedback messages */}
        {otpError && (
          <div className="security-error" style={{ marginTop: '8px', color: '#DC2626', fontSize: '13px' }}>{otpError}</div>
        )}
        {otpSuccess && (
          <div className="security-success" style={{ marginTop: '8px', color: '#16A34A', fontSize: '13px' }}>{otpSuccess}</div>
        )}
        <button
          className="btn-secondary"
          onClick={onClose}
          style={{ marginTop: '16px', width: '100%' }}
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
