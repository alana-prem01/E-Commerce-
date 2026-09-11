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
  if (!isOpen) return null;

  const handleSendOtp = async () => {
    setIsOtpLoading(true);
    setOtpError('');
    try {
      const res = await api.post('/auth/change-email/send-otp');
      if (res.success) {
        setOtpSent(true);
        setOtpSuccess('OTP sent to your current email.');
        setOtpSentTime(Date.now());
      } else {
        setOtpError(res.message || 'Failed to send OTP.');
      }
    } catch (err) {
      setOtpError(err.message || 'Failed to send OTP.');
    } finally {
      setIsOtpLoading(false);
    }
  };

  const handleUpdateEmail = async () => {
    if (!otp) {
      setOtpError('Please enter the OTP.');
      return;
    }
    if (!newEmail) {
      setOtpError('Please enter a new email address.');
      return;
    }
    setIsVerifying(true);
    setOtpError('');
    try {
      const payload = { otp, newEmail };
      const res = await api.post('/auth/change-email/verify-otp', payload);
      if (res.success && res.email) {
        onEmailUpdated(res.email);
        setOtpSuccess('Email updated successfully!');
        // close after short delay
        setTimeout(() => {
          onClose();
        }, 1200);
      } else {
        setOtpError(res.message || 'Failed to update email.');
      }
    } catch (err) {
      setOtpError(err.message || 'Failed to update email.');
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <div style={modalBackdropStyle} onClick={onClose}>
      <div style={modalContentStyle} onClick={e => e.stopPropagation()}>
        <h3 style={{ marginTop: 0, marginBottom: '12px', color: 'var(--secondary-color)' }}>Change Email</h3>
        <p style={{ fontSize: '13px', marginBottom: '12px' }}>Current email: <strong>{currentEmail}</strong></p>

        {/* STEP 1 – Send OTP */}
        {!otpSent && (
          <button
            className="btn-primary"
            onClick={handleSendOtp}
            disabled={isOtpLoading}
          >
            {isOtpLoading ? 'Sending OTP...' : 'Send OTP'}
          </button>
        )}

        {/* STEP 2 – Enter OTP and New Email */}
        {otpSent && (
          <>
            <input
              type="text"
              placeholder="Enter OTP"
              className="input-field"
              value={otp}
              onChange={e => setOtp(e.target.value)}
              style={{ marginTop: '12px' }}
            />
            <input
              type="email"
              placeholder="New email address"
              className="input-field"
              value={newEmail}
              onChange={e => setNewEmail(e.target.value)}
              style={{ marginTop: '12px' }}
            />
            {otpSentTime && (
              <OtpTimer
                startTime={otpSentTime}
                onExpire={() => {
                  setOtpSent(false);
                  setOtp('');
                  setNewEmail('');
                }}
              />
            )}
            <button
              className="btn-primary"
              onClick={handleUpdateEmail}
              disabled={isVerifying}
              style={{ marginTop: '8px' }}
            >
              {isVerifying ? 'Updating...' : 'Update Email'}
            </button>
          </>
        )}

        {/* Feedback messages */}
        {otpError && (
          <div className="security-error" style={{ marginTop: '8px' }}>{otpError}</div>
        )}
        {otpSuccess && (
          <div className="security-success" style={{ marginTop: '8px' }}>{otpSuccess}</div>
        )}
        <button
          className="btn-secondary"
          onClick={onClose}
          style={{ marginTop: '16px' }}
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
