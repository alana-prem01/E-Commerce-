import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { FiEye, FiEyeOff, FiLock, FiMail, FiUser, FiSave, FiCheckCircle, FiShield, FiKey, FiArrowLeft, FiEdit2 } from 'react-icons/fi';
import OtpTimer from '../Components/OtpTimer';
import api from '../utils/api';
import '../css/AdminProfilePage.css';

export default function AdminProfilePage() {
  // Saved user state
  const [savedUser, setSavedUser] = useState({ name: 'Admin User', email: 'admin@example.com' });

  // Form input state
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [isSubmittingProfile, setIsSubmittingProfile] = useState(false);

  // OTP Reset Password state: 1 = Initial, 2 = Verify OTP, 3 = Reset Password
  const [otpStep, setOtpStep] = useState(1);
  const [otpCode, setOtpCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Password visibility state
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isOtpLoading, setIsOtpLoading] = useState(false);
  const [otpSentTime, setOtpSentTime] = useState(null);
  const [emailOtpSentTime, setEmailOtpSentTime] = useState(null);

  // Change Email OTP state: 1 = Enter new email, 2 = Verify OTP, 3 = Success
  const [emailStep, setEmailStep] = useState(1);
  const [newEmail, setNewEmail] = useState('');
  const [emailOtp, setEmailOtp] = useState('');
  const [isEmailOtpLoading, setIsEmailOtpLoading] = useState(false);

  // Load user data on mount
  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const stored = localStorage.getItem('user');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.name) setName(parsed.name);
        if (parsed.email) setEmail(parsed.email);
        setSavedUser(parsed);
      }

      // Fetch fresh profile from backend
      const res = await api.get('/profile');
      if (res.success && res.data) {
        setName(res.data.name || '');
        setEmail(res.data.email || '');
        setSavedUser(res.data);
        localStorage.setItem('user', JSON.stringify(res.data));
      }
    } catch (err) {
      console.log('Using local user profile data');
    }
  };

  // Update Profile Details (Name only — email is changed via OTP)
  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    const trimmedName = name.trim();
    if (!trimmedName || trimmedName.length < 2) {
      toast.error('Please enter a valid name (at least 2 characters).');
      return;
    }
    setIsSubmittingProfile(true);
    try {
      const res = await api.put('/profile', { name: trimmedName });
      if (res.success) {
        toast.success(res.message || 'Profile updated successfully!');
        const updatedData = { ...savedUser, name: trimmedName };
        setSavedUser(updatedData);
        localStorage.setItem('user', JSON.stringify(updatedData));
        window.dispatchEvent(new Event('auth-change'));
      } else {
        toast.error(res.message || 'Failed to update profile.');
      }
    } catch (err) {
      toast.error(err.message || 'Error updating profile.');
    } finally {
      setIsSubmittingProfile(false);
    }
  };

  const handleCancelProfile = () => {
    setName(savedUser.name || '');
    toast.info('Profile changes reset.');
  };

  // --- Change Email OTP Handlers ---

  const handleSendEmailOTP = async () => {
    setIsEmailOtpLoading(true);
    try {
      const res = await api.post('/auth/change-email/send-otp');
      if (res && res.success) {
        toast.success(res.message || `OTP sent to your current email (${email || savedUser.email})`);
        setEmailOtpSentTime(Date.now());
        setEmailStep(2);
      } else {
        toast.error(res?.message || 'Failed to send OTP.');
      }
    } catch (err) {
      toast.error(err.message || 'Failed to send OTP.');
    } finally {
      setIsEmailOtpLoading(false);
    }
  };

  const handleVerifyEmailOTP = async (e) => {
    e.preventDefault();
    const trimmedOtp = emailOtp.trim();
    const trimmedNewEmail = newEmail.trim().toLowerCase();

    if (!trimmedOtp || trimmedOtp.length !== 6 || !/^\d+$/.test(trimmedOtp)) {
      toast.error('Please enter a valid 6-digit OTP.');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!trimmedNewEmail || !emailRegex.test(trimmedNewEmail)) {
      toast.error('Please enter a valid new email address.');
      return;
    }

    if (trimmedNewEmail === (email || savedUser.email).toLowerCase()) {
      toast.error('New email must be different from your current email.');
      return;
    }

    setIsEmailOtpLoading(true);
    try {
      const res = await api.post('/auth/change-email/verify-otp', {
        otp: trimmedOtp,
        newEmail: trimmedNewEmail
      });
      if (res && res.success) {
        toast.success(res.message || 'Email updated successfully!');
        const updatedEmail = res.email || trimmedNewEmail;
        setEmail(updatedEmail);
        const updatedData = { ...savedUser, email: updatedEmail };
        setSavedUser(updatedData);
        localStorage.setItem('user', JSON.stringify(updatedData));
        window.dispatchEvent(new Event('auth-change'));
        setEmailStep(3);
      } else {
        toast.error(res?.message || 'Invalid or expired OTP.');
      }
    } catch (err) {
      toast.error(err.message || 'Invalid or expired OTP.');
    } finally {
      setIsEmailOtpLoading(false);
    }
  };

  const handleCancelEmailFlow = () => {
    setEmailStep(1);
    setNewEmail('');
    setEmailOtp('');
  };

  // --- OTP Reset Password Handlers ---

  // Step 1: Send OTP to admin's email
  const handleSendOTP = async () => {
    setIsOtpLoading(true);
    const targetEmail = email.trim() || savedUser.email;
    try {
      let res;
      try {
        res = await api.post('/auth/change-password/send-otp');
      } catch (e) {
        res = await api.post('/auth/forgot-password', { email: targetEmail });
      }

      if (res && res.success) {
        toast.success(res.message || 'OTP verification code sent to your email!');
        setOtpSentTime(Date.now());
        setOtpStep(2);
      } else {
        toast.error(res?.message || 'Failed to send OTP.');
      }
    } catch (err) {
      toast.error(err.message || 'Failed to send OTP.');
    } finally {
      setIsOtpLoading(false);
    }
  };

  // Step 2: Verify OTP
  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    const trimmedOtp = otpCode.trim();

    if (!trimmedOtp || trimmedOtp.length !== 6 || !/^\d+$/.test(trimmedOtp)) {
      toast.error('Please enter a valid 6-digit OTP.');
      return;
    }

    setIsOtpLoading(true);
    const targetEmail = email.trim() || savedUser.email;

    try {
      let res;
      try {
        res = await api.post('/auth/change-password/verify-otp', { otp: trimmedOtp });
      } catch (e) {
        res = await api.post('/auth/verify-otp', { email: targetEmail, otp: trimmedOtp });
      }

      if (res && res.success) {
        toast.success('OTP verified successfully!');
        setOtpStep(3);
      } else {
        toast.error(res?.message || 'Invalid or expired OTP.');
      }
    } catch (err) {
      toast.error(err.message || 'Invalid or expired OTP.');
    } finally {
      setIsOtpLoading(false);
    }
  };

  // Step 3: Reset Password using OTP
  const handleResetPassword = async (e) => {
    e.preventDefault();

    if (!newPassword) {
      toast.error('New Password is required.');
      return;
    }
    if (newPassword.length < 8 || newPassword.length > 20) {
      toast.error('Password must be between 8 and 20 characters.');
      return;
    }
    if (!/[A-Z]/.test(newPassword)) {
      toast.error('Password must contain at least one uppercase letter.');
      return;
    }
    if (!/[a-z]/.test(newPassword)) {
      toast.error('Password must contain at least one lowercase letter.');
      return;
    }
    if (!/[0-9]/.test(newPassword)) {
      toast.error('Password must contain at least one number.');
      return;
    }
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(newPassword)) {
      toast.error('Password must contain at least one special character.');
      return;
    }
    if (/\s/.test(newPassword)) {
      toast.error('Password cannot contain spaces.');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match.');
      return;
    }

    setIsOtpLoading(true);
    const targetEmail = email.trim() || savedUser.email;

    try {
      let res;
      try {
        res = await api.post('/auth/change-password/reset', {
          otp: otpCode.trim(),
          newPassword,
          confirmPassword,
        });
      } catch (e) {
        res = await api.post('/auth/reset-password', {
          email: targetEmail,
          otp: otpCode.trim(),
          newPassword,
          confirmPassword,
        });
      }

      if (res && res.success) {
        toast.success(res.message || 'Password reset successfully!');
        setOtpStep(1);
        setOtpCode('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        toast.error(res?.message || 'Failed to reset password.');
      }
    } catch (err) {
      toast.error(err.message || 'Failed to reset password.');
    } finally {
      setIsOtpLoading(false);
    }
  };

  const handleCancelOtpFlow = () => {
    setOtpStep(1);
    setOtpCode('');
    setNewPassword('');
    setConfirmPassword('');
  };

  return (
    <div className="admin-profile-wrapper">
      {/* Page Header */}
      <div className="admin-profile-header mb-4">
        <h1 className="admin-profile-title">Admin Profile</h1>
        <p className="admin-profile-subtitle">Manage your personal information and reset password via OTP</p>
      </div>

      <div className="admin-profile-content">
        {/* Left Column: Admin Avatar Card */}
        <div className="admin-profile-side">
          <div className="admin-card text-center p-4">
            <div className="admin-avatar-box">
              <img
                src={`https://ui-avatars.com/api/?name=${encodeURIComponent(name || 'Admin')}&background=0D9488&color=fff&size=150`}
                alt="Admin Avatar"
                className="admin-avatar-img"
              />
            </div>
            <h2 className="admin-profile-name">{name || 'Admin User'}</h2>
            <p className="admin-profile-email">{email || 'admin@example.com'}</p>
            <div className="d-flex justify-content-center gap-2 mt-3">
              <span className="admin-badge admin-badge-primary">
                <FiCheckCircle style={{ marginRight: '4px' }} /> Administrator
              </span>
              <span className="admin-badge admin-badge-success">Active</span>
            </div>
          </div>
        </div>

        {/* Right Column: Personal Information & Password Reset via OTP */}
        <div className="admin-profile-main">
          
          {/* Card 1: Personal Information */}
          <form onSubmit={handleUpdateProfile} noValidate>
            <div className="admin-card p-4 mb-4">
              <div className="admin-card-header mb-4 pb-3" style={{ borderBottom: '1px solid var(--admin-border, #E2E8F0)' }}>
                <h3 className="admin-card-title m-0 d-flex align-items-center gap-2">
                  <FiUser className="text-teal" /> Personal Information
                </h3>
              </div>

              <div className="row g-3 mb-4">
                <div className="col-md-6">
                  <label className="form-label font-weight-bold">
                    <FiUser className="me-1 text-secondary" /> Full Name
                  </label>
                  <input
                    type="text"
                    className="admin-input"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Enter full name"
                    required
                  />
                </div>

                <div className="col-md-6">
                  <label className="form-label font-weight-bold">
                    <FiMail className="me-1 text-secondary" /> Current Email Address
                  </label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type="email"
                      className="admin-input"
                      value={email}
                      readOnly
                      disabled
                      style={{
                        backgroundColor: 'var(--admin-bg-soft, #F8FAFC)',
                        cursor: 'not-allowed',
                        color: 'var(--admin-text-muted, #64748B)',
                        paddingRight: '160px'
                      }}
                    />
                    <span style={{
                      position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)',
                      fontSize: '0.72rem', color: '#94a3b8', whiteSpace: 'nowrap'
                    }}>
                      🔒 Change via OTP below
                    </span>
                  </div>
                </div>
              </div>

              <div className="d-flex justify-content-end gap-3 pt-3" style={{ borderTop: '1px solid var(--admin-border, #E2E8F0)' }}>
                <button
                  type="button"
                  className="admin-btn admin-btn-outline"
                  onClick={handleCancelProfile}
                  disabled={isSubmittingProfile}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="admin-btn admin-btn-primary d-flex align-items-center gap-2"
                  disabled={isSubmittingProfile}
                >
                  <FiSave size={16} />
                  {isSubmittingProfile ? 'Saving...' : 'Save Name'}
                </button>
              </div>
            </div>
          </form>

          {/* Card 2: Change Email via OTP */}
          <div className="admin-card p-4 mb-4">
            <div className="admin-card-header mb-4 pb-3" style={{ borderBottom: '1px solid var(--admin-border, #E2E8F0)' }}>
              <div className="d-flex justify-content-between align-items-center">
                <h3 className="admin-card-title m-0 d-flex align-items-center gap-2">
                  <FiMail className="text-teal" /> Change Email (OTP Verification)
                </h3>
                {emailStep > 1 && emailStep < 3 && (
                  <button
                    type="button"
                    className="btn btn-sm btn-outline-secondary d-flex align-items-center gap-1"
                    onClick={handleCancelEmailFlow}
                  >
                    <FiArrowLeft size={14} /> Back
                  </button>
                )}
              </div>
            </div>

            {/* EMAIL STEP 1: Send OTP to current email */}
            {emailStep === 1 && (
              <div className="text-center py-3">
                <div className="mb-3" style={{ color: 'var(--admin-text-muted, #64748B)' }}>
                  <FiMail size={40} style={{ color: '#0D9488', marginBottom: '12px' }} />
                  <p className="m-0" style={{ fontSize: '0.95rem' }}>
                    To update your admin email, we must first verify your identity.
                    Click below to send a 6-digit OTP verification code to your current email: <strong>{email || savedUser.email}</strong>.
                  </p>
                </div>
                <button
                  type="button"
                  className="admin-btn admin-btn-primary px-4 py-2 mt-2 d-inline-flex align-items-center gap-2"
                  onClick={handleSendEmailOTP}
                  disabled={isEmailOtpLoading}
                >
                  <FiMail size={16} />
                  {isEmailOtpLoading ? 'Sending OTP...' : 'Send Verification OTP'}
                </button>
              </div>
            )}

            {/* EMAIL STEP 2: Verify OTP & Enter New Email */}
            {emailStep === 2 && (
              <>
                <form onSubmit={handleVerifyEmailOTP}>
                  <p style={{ fontSize: '0.9rem', color: 'var(--admin-text-muted, #64748B)', marginBottom: '16px' }}>
                    A 6-digit OTP was sent to your current email <strong>{email || savedUser.email}</strong>. Enter the OTP code and your new email address below.
                  </p>

                  <div className="row g-3 mb-3">
                    <div className="col-md-5">
                      <label className="form-label font-weight-bold">Verification Code (OTP)</label>
                      <input
                        type="text"
                        className="admin-input text-center font-weight-bold"
                        style={{ letterSpacing: '4px', fontSize: '1.1rem' }}
                        maxLength={6}
                        placeholder="123456"
                        value={emailOtp}
                        onChange={(e) => setEmailOtp(e.target.value.replace(/\D/g, ''))}
                        autoFocus
                        required
                      />
                    </div>
                    <div className="col-md-7">
                      <label className="form-label font-weight-bold">
                        <FiMail className="me-1 text-secondary" /> New Email Address
                      </label>
                      <input
                        type="email"
                        className="admin-input"
                        value={newEmail}
                        onChange={(e) => setNewEmail(e.target.value)}
                        placeholder="Enter new email address"
                        required
                      />
                    </div>
                  </div>

                  {/* OTP Timer */}
                  {emailOtpSentTime && (
                    <OtpTimer
                      startTime={emailOtpSentTime}
                      onExpire={() => {
                        setEmailStep(1);
                        setEmailOtp('');
                        setNewEmail('');
                        toast.info('OTP expired. Please resend.');
                      }}
                    />
                  )}

                  <div className="d-flex align-items-center gap-3 mt-4">
                    <button
                      type="submit"
                      className="admin-btn admin-btn-primary d-inline-flex align-items-center gap-2"
                      disabled={isEmailOtpLoading || !emailOtp || !newEmail}
                    >
                      <FiSave size={16} />
                      {isEmailOtpLoading ? 'Verifying & Updating...' : 'Verify OTP & Update Email'}
                    </button>
                    <button
                      type="button"
                      className="btn btn-link text-decoration-none p-0"
                      style={{ fontSize: '0.9rem', color: '#0D9488' }}
                      onClick={handleSendEmailOTP}
                      disabled={isEmailOtpLoading}
                    >
                      Resend OTP
                    </button>
                  </div>
                </form>
              </>
            )}

            {/* EMAIL STEP 3: Success */}
            {emailStep === 3 && (
              <div className="text-center py-3">
                <FiCheckCircle size={48} style={{ color: '#10B981', marginBottom: '12px' }} />
                <h5 style={{ color: '#10B981', fontWeight: 600 }}>Email Updated Successfully!</h5>
                <p style={{ fontSize: '0.9rem', color: 'var(--admin-text-muted, #64748B)' }}>
                  Your email has been changed to <strong>{email}</strong>.
                </p>
                <button
                  type="button"
                  className="admin-btn admin-btn-outline mt-2 d-inline-flex align-items-center gap-2"
                  onClick={handleCancelEmailFlow}
                >
                  <FiEdit2 size={15} /> Change Email Again
                </button>
              </div>
            )}
          </div>

          {/* Card 3: Password Reset via OTP Verification */}
          <div className="admin-card p-4">
            <div className="admin-card-header mb-4 pb-3" style={{ borderBottom: '1px solid var(--admin-border, #E2E8F0)' }}>
              <div className="d-flex justify-content-between align-items-center">
                <h3 className="admin-card-title m-0 d-flex align-items-center gap-2">
                  <FiShield className="text-teal" /> Reset Password (OTP Verification)
                </h3>
                {otpStep > 1 && (
                  <button
                    type="button"
                    className="btn btn-sm btn-outline-secondary d-flex align-items-center gap-1"
                    onClick={handleCancelOtpFlow}
                  >
                    <FiArrowLeft size={14} /> Back
                  </button>
                )}
              </div>
            </div>

            {/* STEP 1: Request OTP */}
            {otpStep === 1 && (
              <div className="text-center py-3">
                <div className="mb-3" style={{ color: 'var(--admin-text-muted, #64748B)' }}>
                  <FiKey size={40} style={{ color: '#0D9488', marginBottom: '12px' }} />
                  <p className="m-0" style={{ fontSize: '0.95rem' }}>
                    Need to change your password? Click below to receive a 6-digit OTP verification code at <strong>{email || savedUser.email}</strong>.
                  </p>
                </div>
                <button
                  type="button"
                  className="admin-btn admin-btn-primary px-4 py-2 mt-2"
                  onClick={handleSendOTP}
                  disabled={isOtpLoading}
                >
                  {isOtpLoading ? 'Sending OTP Code...' : 'Request Reset Password OTP'}
                </button>
              </div>
            )}

            {/* STEP 2: Verify OTP */}
            {otpStep === 2 && (
              <form onSubmit={handleVerifyOTP}>
                <div className="mb-3">
                  <p className="text-muted" style={{ fontSize: '0.9rem' }}>
                    A 6-digit OTP verification code was sent to <strong>{email || savedUser.email}</strong>. Please enter it below.
                  </p>
                  <label className="form-label font-weight-bold">Verification Code (OTP)</label>
                  <input
                    type="text"
                    className="admin-input text-center font-weight-bold"
                    style={{ letterSpacing: '4px', fontSize: '1.2rem', maxWidth: '300px' }}
                    maxLength={6}
                    placeholder="123456"
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                    required
                  />
                </div>

                {/* OTP Timer */}
                {otpSentTime && (
                  <OtpTimer
                    startTime={otpSentTime}
                    onExpire={() => {
                      setOtpStep(1);
                      setOtpCode('');
                      toast.info('OTP expired. Please request a new one.');
                    }}
                  />
                )}

                <div className="d-flex align-items-center gap-3 mt-4">
                  <button
                    type="submit"
                    className="admin-btn admin-btn-primary"
                    disabled={isOtpLoading}
                  >
                    {isOtpLoading ? 'Verifying...' : 'Verify OTP'}
                  </button>
                  <button
                    type="button"
                    className="btn btn-link text-decoration-none text-teal p-0"
                    style={{ fontSize: '0.9rem', color: '#0D9488' }}
                    onClick={handleSendOTP}
                    disabled={isOtpLoading}
                  >
                    Resend OTP Code
                  </button>
                </div>
              </form>
            )}

            {/* STEP 3: Set New Password */}
            {otpStep === 3 && (
              <form onSubmit={handleResetPassword}>
                <div className="alert alert-success d-flex align-items-center gap-2 py-2 px-3 mb-4" style={{ fontSize: '0.875rem' }}>
                  <FiCheckCircle size={18} /> OTP Verified! Set your new password below.
                </div>

                <div className="row g-3 mb-4">
                  <div className="col-md-6">
                    <label className="form-label font-weight-bold">
                      <FiLock className="me-1 text-secondary" /> New Password
                    </label>
                    <div className="position-relative">
                      <input
                        type={showNewPassword ? 'text' : 'password'}
                        className="admin-input pe-5"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="Min 8 chars, 1 uppercase, 1 special"
                        required
                      />
                      <button
                        type="button"
                        className="password-toggle-icon"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                      >
                        {showNewPassword ? <FiEyeOff /> : <FiEye />}
                      </button>
                    </div>
                  </div>

                  <div className="col-md-6">
                    <label className="form-label font-weight-bold">
                      <FiLock className="me-1 text-secondary" /> Confirm New Password
                    </label>
                    <div className="position-relative">
                      <input
                        type={showConfirmPassword ? 'text' : 'password'}
                        className="admin-input pe-5"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Re-enter new password"
                        required
                      />
                      <button
                        type="button"
                        className="password-toggle-icon"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      >
                        {showConfirmPassword ? <FiEyeOff /> : <FiEye />}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="d-flex justify-content-end gap-3 pt-3" style={{ borderTop: '1px solid var(--admin-border, #E2E8F0)' }}>
                  <button
                    type="button"
                    className="admin-btn admin-btn-outline"
                    onClick={handleCancelOtpFlow}
                    disabled={isOtpLoading}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="admin-btn admin-btn-primary d-flex align-items-center gap-2"
                    disabled={isOtpLoading}
                  >
                    <FiSave size={16} />
                    {isOtpLoading ? 'Resetting Password...' : 'Reset Password'}
                  </button>
                </div>
              </form>
            )}

          </div>

        </div>
      </div>
    </div>
  );
}
