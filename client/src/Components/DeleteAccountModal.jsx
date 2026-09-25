import React, { useState, useEffect } from 'react';
import OtpTimer from './OtpTimer';
import { api } from '../utils/api';

const modalBackdropStyle = {
  position: 'fixed',
  top: 0,
  left: 0,
  width: '100vw',
  height: '100vh',
  backgroundColor: 'rgba(0, 0, 0, 0.5)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 2000,
};

const modalContentStyle = {
  background: '#FFFFFF',
  borderRadius: '12px',
  padding: '24px 28px',
  width: '360px',
  maxWidth: '90%',
  boxShadow: '0 10px 30px rgba(0,0,0,0.2)',
  fontFamily: 'inherit',
};

const redButtonStyle = {
  width: '100%',
  padding: '10px 16px',
  backgroundColor: '#DC2626',
  color: '#FFFFFF',
  border: 'none',
  borderRadius: '8px',
  fontWeight: '600',
  fontSize: '14px',
  cursor: 'pointer',
  transition: 'background-color 0.2s ease',
};

const cancelButtonStyle = {
  width: '100%',
  padding: '10px 16px',
  backgroundColor: '#F3F4F6',
  color: '#374151',
  border: '1px solid #D1D5DB',
  borderRadius: '8px',
  fontWeight: '500',
  fontSize: '14px',
  cursor: 'pointer',
  marginTop: '8px',
};

export default function DeleteAccountModal({ isOpen, onClose, onAccountDeleted }) {
  const [step, setStep] = useState(1); // 1: confirm dialog, 2: OTP verification screen
  const [otpSent, setOtpSent] = useState(false);
  const [otpSentTime, setOtpSentTime] = useState(null);
  const [otp, setOtp] = useState('');
  const [otpError, setOtpError] = useState('');
  const [otpSuccess, setOtpSuccess] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setStep(1);
      setOtp('');
      setOtpError('');
      setOtpSuccess('');
      setOtpSent(false);
      setIsSending(false);
      setIsDeleting(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSendOtp = async () => {
    setIsSending(true);
    setOtpError('');
    setOtpSuccess('');
    try {
      const res = await api.post('/auth/delete-account/send-otp', {});
      if (res.success) {
        setOtpSent(true);
        setOtpSentTime(Date.now());
        setOtpSuccess('OTP sent to your registered email address.');
        setStep(2);
      } else {
        setOtpError(res.message || 'Failed to send OTP.');
      }
    } catch (err) {
      setOtpError(err.message || err.data?.message || 'Failed to send OTP. Please try again.');
    } finally {
      setIsSending(false);
    }
  };

  const handleVerifyAndDelete = async () => {
    const trimmed = otp.trim();
    if (!trimmed) {
      setOtpError('Please enter the 6-digit OTP.');
      return;
    }
    if (trimmed.length !== 6) {
      setOtpError('OTP must be 6 digits.');
      return;
    }
    setIsDeleting(true);
    setOtpError('');
    setOtpSuccess('');
    try {
      const delRes = await api.delete('/profile/account', { otp: trimmed });
      if (delRes.success) {
        setOtpSuccess('Your account has been permanently deleted.');
        setTimeout(() => {
          onAccountDeleted();
        }, 1200);
      } else {
        setOtpError(delRes.message || 'Failed to delete account.');
        setIsDeleting(false);
      }
    } catch (err) {
      setOtpError(err.message || err.data?.message || 'Invalid or expired OTP. Account deletion failed.');
      setIsDeleting(false);
    }
  };

  return (
    <div style={modalBackdropStyle} onClick={onClose}>
      <div style={modalContentStyle} onClick={(e) => e.stopPropagation()}>
        <h3 style={{ marginTop: 0, marginBottom: '12px', fontSize: '18px', color: '#111827', fontWeight: '600' }}>
          {step === 1 ? 'Delete Account Confirmation' : 'Verify OTP to Delete Account'}
        </h3>

        {step === 1 && (
          <>
            <p style={{ fontSize: '14px', color: '#4B5563', lineHeight: '1.5', marginBottom: '20px' }}>
              Are you sure you want to delete your account? This action is <strong>permanent</strong> and cannot be undone. All your profile data, order history, and preferences will be erased.
            </p>
            <button
              style={redButtonStyle}
              onClick={handleSendOtp}
              disabled={isSending}
              onMouseOver={(e) => (e.currentTarget.style.backgroundColor = '#B91C1C')}
              onMouseOut={(e) => (e.currentTarget.style.backgroundColor = '#DC2626')}
            >
              {isSending ? 'Sending OTP...' : 'Yes, Delete My Account'}
            </button>
            <button style={cancelButtonStyle} onClick={onClose} disabled={isSending}>
              Cancel
            </button>
          </>
        )}

        {step === 2 && (
          <>
            <p style={{ fontSize: '13px', color: '#4B5563', marginBottom: '16px', lineHeight: '1.4' }}>
              An OTP has been sent to your registered email address. Please enter the 6-digit OTP below to permanently delete your account.
            </p>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ fontSize: '12px', fontWeight: '600', color: '#374151', display: 'block', marginBottom: '6px' }}>
                Verification OTP Code
              </label>
              <input
                type="text"
                placeholder="Enter 6-digit OTP"
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: '6px',
                  border: '1px solid #D1D5DB',
                  fontSize: '15px',
                  letterSpacing: '2px',
                  textAlign: 'center',
                  boxSizing: 'border-box',
                }}
                value={otp}
                onChange={(e) => {
                  setOtp(e.target.value.replace(/\D/g, '').slice(0, 6));
                  setOtpError('');
                }}
                maxLength={6}
              />
            </div>

            {otpSent && otpSentTime && (
              <div style={{ marginBottom: '12px', textAlign: 'center' }}>
                <OtpTimer
                  startTime={otpSentTime}
                  onExpire={() => {
                    setOtpSent(false);
                  }}
                />
              </div>
            )}

            <button
              style={{
                ...redButtonStyle,
                opacity: isDeleting ? 0.7 : 1,
              }}
              onClick={handleVerifyAndDelete}
              disabled={isDeleting}
              onMouseOver={(e) => (e.currentTarget.style.backgroundColor = '#B91C1C')}
              onMouseOut={(e) => (e.currentTarget.style.backgroundColor = '#DC2626')}
            >
              {isDeleting ? 'Deleting Account...' : 'Verify OTP & Delete Account'}
            </button>

            <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
              <button
                style={{
                  ...cancelButtonStyle,
                  marginTop: 0,
                  flex: 1,
                  backgroundColor: '#FFFFFF',
                }}
                onClick={handleSendOtp}
                disabled={isSending || isDeleting}
              >
                {isSending ? 'Resending...' : 'Resend OTP'}
              </button>
              <button
                style={{
                  ...cancelButtonStyle,
                  marginTop: 0,
                  flex: 1,
                }}
                onClick={onClose}
                disabled={isDeleting}
              >
                Cancel
              </button>
            </div>
          </>
        )}

        {otpError && (
          <div style={{ padding: '8px 12px', backgroundColor: '#FEE2E2', color: '#DC2626', borderRadius: '6px', fontSize: '13px', marginTop: '12px', fontWeight: '500' }}>
            {otpError}
          </div>
        )}
        {otpSuccess && (
          <div style={{ padding: '8px 12px', backgroundColor: '#D1FAE5', color: '#059669', borderRadius: '6px', fontSize: '13px', marginTop: '12px', fontWeight: '500' }}>
            {otpSuccess}
          </div>
        )}
      </div>
    </div>
  );
}
