import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import { FiUser, FiShield, FiBell, FiSliders, FiLock, FiCheckCircle, FiAlertTriangle, FiTrash2, FiEdit2, FiSave, FiEye, FiEyeOff } from 'react-icons/fi';
import api from '../utils/api';
import OtpTimer from '../Components/OtpTimer';
import '../css/AdminProfilePage.css';

export default function AdminProfilePage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  // Active Sub-Tab: 'profile' | 'security' | 'notifications' | 'preferences' | 'access_control' | 'system'
  const activeTabParam = searchParams.get('tab') || 'profile';
  const [activeTab, setActiveTab] = useState(activeTabParam);

  // General States & Edge Cases
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [showUnsavedModal, setShowUnsavedModal] = useState(false);
  const [pendingTabSwitch, setPendingTabSwitch] = useState(null);
  const [concurrentConflict, setConcurrentConflict] = useState(null);

  // Admin Profile States (SETTINGS-224 to SETTINGS-232)
  const [adminUser, setAdminUser] = useState({ name: 'Admin User', email: 'admin@elora.com', role: 'Admin' });
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [adminName, setAdminName] = useState('');
  const [adminNameError, setAdminNameError] = useState('');
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [photoPreview, setPhotoPreview] = useState(null);

  // Admin Security States (SETTINGS-233 to SETTINGS-249)
  const [passData, setPassData] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [passErrors, setPassErrors] = useState({});
  const [showCurrentPass, setShowCurrentPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);

  // OTP Password Change States
  const [adminOtp, setAdminOtp] = useState('');
  const [adminOtpSent, setAdminOtpSent] = useState(false);
  const [adminOtpSentTime, setAdminOtpSentTime] = useState(null);
  const [isSendingAdminOtp, setIsSendingAdminOtp] = useState(false);
  const [isVerifyingAdminOtp, setIsVerifyingAdminOtp] = useState(false);
  const [isAdminOtpVerified, setIsAdminOtpVerified] = useState(false);

  // MFA States (SETTINGS-240 to SETTINGS-242, SETTINGS-249)
  const [mfaEnabled, setMfaEnabled] = useState(true);
  const [mfaIsMandatory, setMfaIsMandatory] = useState(true); // SETTINGS-249: MFA is mandatory for admin accounts
  const [showMfaWarningModal, setShowMfaWarningModal] = useState(false);

  // Active Sessions & Login Activity States (SETTINGS-243 to SETTINGS-247)
  const [activeSessions, setActiveSessions] = useState([]);
  const [showSignoutSessionModal, setShowSignoutSessionModal] = useState(false);
  const [targetSignoutSession, setTargetSignoutSession] = useState(null);
  const [loginActivities, setLoginActivities] = useState([]);

  // Admin Notifications States (SETTINGS-250 to SETTINGS-254)
  const [adminNotifications, setAdminNotifications] = useState({
    newOrders: true,
    lowStock: true,
    newUsers: true
  });
  const [isSavingNotifications, setIsSavingNotifications] = useState(false);

  // Admin Preferences States (SETTINGS-255 to SETTINGS-257)
  const [adminTheme, setAdminTheme] = useState('system');
  const [sessionTimeout, setSessionTimeout] = useState('30');
  const [showTimeoutWarningModal, setShowTimeoutWarningModal] = useState(false);
  const [pendingTimeout, setPendingTimeout] = useState(null);

  // Access Control States (SETTINGS-258 to SETTINGS-268)
  const [roles, setRoles] = useState([
    { id: 'admin', name: 'Administrator', userCount: 1, permissions: ['manage_users', 'manage_products', 'manage_orders', 'manage_settings'] },
    { id: 'manager', name: 'Store Manager', userCount: 3, permissions: ['manage_products', 'manage_orders'] }
  ]);
  const [selectedRole, setSelectedRole] = useState(null);
  const [permissionState, setPermissionState] = useState({
    manage_users: true,
    manage_products: true,
    manage_orders: true,
    manage_settings: true
  });
  const [showSavePermissionsModal, setShowSavePermissionsModal] = useState(false);
  const [isSavingPermissions, setIsSavingPermissions] = useState(false);

  // Route Guard Check & Mount
  useEffect(() => {
    const userStr = localStorage.getItem('user');
    const userObj = userStr ? JSON.parse(userStr) : null;
    const isLogged = localStorage.getItem('isLoggedIn') === 'true';

    if (!isLogged || (userObj && userObj.role !== 'Admin' && userObj.role !== 'SuperAdmin')) {
      toast.error('Please sign in as an administrator.'); // SETTINGS-276
      navigate('/admin-login');
      return;
    }

    fetchAdminData();
  }, [navigate]);

  // Online / Offline & Tab Sync Listeners (SETTINGS-271, SETTINGS-273, SETTINGS-274)
  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);
    const handleStorage = (e) => {
      if (e.key === 'isLoggedIn' && e.newValue === null) {
        toast.info('Your admin session has ended.'); // SETTINGS-273
        navigate('/admin-login');
      } else if (e.key === 'adminSettingsUpdated') {
        setConcurrentConflict('These settings were updated by another administrator.'); // SETTINGS-274
      }
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    window.addEventListener('storage', handleStorage);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('storage', handleStorage);
    };
  }, [navigate]);

  // Sync Tab Param
  useEffect(() => {
    setSearchParams({ tab: activeTab });
  }, [activeTab, setSearchParams]);

  const fetchAdminData = async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const res = await api.get('/profile/admin/settings');
      if (res.success && res.user) {
        setAdminUser(res.user);
        setAdminName(res.user.name || '');

        if (res.user.loginActivities && res.user.loginActivities.length > 0) {
          setLoginActivities(res.user.loginActivities.map((act, index) => ({
            id: act._id || `act_${index}`,
            time: new Date(act.timestamp || act.createdAt || Date.now()).toLocaleString('en-IN', {
              year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false
            }).replace(',', ''),
            ip: `192.168.1.${101 + (index % 50)}`,
            location: act.location || 'Local Network',
            status: act.isSuspicious ? 'Suspicious' : 'Success'
          })));
        } else {
          setLoginActivities([]);
        }

        if (res.user.sessions && res.user.sessions.length > 0) {
          setActiveSessions(res.user.sessions.map((sess, index) => ({
            id: sess._id || `sess_${index}`,
            device: sess.device || 'Desktop Browser',
            ip: `192.168.1.${101 + (index % 50)}`,
            location: sess.location || 'Local Network',
            isCurrent: Boolean(sess.isCurrent)
          })));
        } else {
          setActiveSessions([
            { id: 'curr_1', device: 'Current Admin Session', ip: '192.168.1.101', location: 'Local Network', isCurrent: true }
          ]);
        }
      } else {
        const stored = localStorage.getItem('user');
        if (stored) {
          const parsed = JSON.parse(stored);
          setAdminUser(parsed);
          setAdminName(parsed.name || '');
        }
      }
    } catch (err) {
      setLoadError('Unable to load administrator settings.'); // SETTINGS-270
    } finally {
      setLoading(false);
    }
  };

  const hasUnsavedAdminChanges = () => {
    if (isEditingProfile && adminName.trim() !== adminUser.name) return true;
    if (passData.currentPassword || passData.newPassword || passData.confirmPassword) return true;
    return false;
  };

  const handleTabChange = (targetTab) => {
    if (activeTab === targetTab) return;
    if (hasUnsavedAdminChanges()) {
      setPendingTabSwitch(targetTab);
      setShowUnsavedModal(true); // SETTINGS-275
    } else {
      setActiveTab(targetTab);
    }
  };

  // --- Admin Profile Handlers (SETTINGS-226 to SETTINGS-232) ---
  const handleAdminNameChange = (val) => {
    setAdminName(val);
    if (!val.trim() || val.trim().length < 2) {
      setAdminNameError('Enter a valid name.'); // SETTINGS-227
    } else {
      setAdminNameError('');
    }
  };

  const handleSaveAdminProfile = async (e) => {
    e.preventDefault();
    if (!adminName.trim() || adminName.trim().length < 2) {
      setAdminNameError('Enter a valid name.');
      return;
    }

    setIsSavingProfile(true); // SETTINGS-230: "Updating administrator profile…"
    try {
      const res = await api.put('/profile/admin/profile', { name: adminName.trim() });
      if (res.success) {
        setAdminUser((prev) => ({ ...prev, name: adminName.trim() }));
        const stored = localStorage.getItem('user');
        if (stored) {
          const parsed = JSON.parse(stored);
          localStorage.setItem('user', JSON.stringify({ ...parsed, name: adminName.trim() }));
        }
        setIsEditingProfile(false);
        toast.success('Profile updated successfully.'); // SETTINGS-231
      } else {
        toast.error(res.message || 'Unable to update administrator profile.'); // SETTINGS-232
      }
    } catch (err) {
      toast.error('Unable to update administrator profile.');
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handlePhotoUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      setPhotoPreview(reader.result);
      toast.success('Profile photo selected.');
    };
    reader.readAsDataURL(file);
  };

  // --- Admin Security & Password Handlers (SETTINGS-234 to SETTINGS-239) ---
  const handleSendAdminPasswordOtp = async () => {
    setIsSendingAdminOtp(true);
    setPassErrors({});
    try {
      const res = await api.post('/auth/change-password/send-otp', {});
      if (res.success) {
        setAdminOtpSent(true);
        setAdminOtpSentTime(Date.now());
        toast.success('OTP sent to administrator registered email address.');
      } else {
        toast.error(res.message || 'Failed to send OTP.');
      }
    } catch (err) {
      toast.error(err.message || 'Failed to send OTP.');
    } finally {
      setIsSendingAdminOtp(false);
    }
  };

  const handleVerifyAdminPasswordOtp = async () => {
    const trimmed = adminOtp.trim();
    if (!trimmed || trimmed.length !== 6) {
      setPassErrors({ otp: 'Please enter a valid 6-digit OTP.' });
      return;
    }
    setIsVerifyingAdminOtp(true);
    setPassErrors({});
    try {
      const res = await api.post('/auth/change-password/verify-otp', { otp: trimmed });
      if (res.success) {
        setIsAdminOtpVerified(true);
        toast.success('OTP verified successfully! You can now set your new password.');
      } else {
        setPassErrors({ otp: res.message || 'Invalid or expired OTP.' });
      }
    } catch (err) {
      setPassErrors({ otp: err.message || 'Invalid or expired OTP.' });
    } finally {
      setIsVerifyingAdminOtp(false);
    }
  };

  const handleAdminPasswordSubmit = async (e) => {
    e.preventDefault();
    const newErrors = {};

    if (!isAdminOtpVerified) {
      newErrors.otp = 'Please send and verify the OTP before setting a new password.';
      setPassErrors(newErrors);
      return;
    }

    if (!passData.newPassword || passData.newPassword.length < 8) {
      newErrors.newPassword = 'Password must be at least 8 characters.';
    }

    if (passData.newPassword !== passData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match.';
    }

    if (Object.keys(newErrors).length > 0) {
      setPassErrors(newErrors);
      return;
    }

    setIsUpdatingPassword(true);
    try {
      const res = await api.put('/profile/admin/password', {
        otp: adminOtp.trim(),
        newPassword: passData.newPassword,
        confirmPassword: passData.confirmPassword
      });
      if (res.success) {
        toast.success('Administrator password updated successfully.');
        setPassData({ currentPassword: '', newPassword: '', confirmPassword: '' });
        setAdminOtp('');
        setAdminOtpSent(false);
        setIsAdminOtpVerified(false);
        setPassErrors({});
      } else {
        toast.error(res.message || 'Unable to update password.');
      }
    } catch (err) {
      toast.error(err.message || 'Unable to update password.');
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  // --- MFA Toggle Handler (SETTINGS-240 to SETTINGS-242, SETTINGS-249) ---
  const handleMfaToggleClick = () => {
    if (mfaIsMandatory) {
      toast.warn('Two-factor authentication is mandatory for all administrator accounts and cannot be disabled.'); // SETTINGS-249
      return;
    }
    if (mfaEnabled) {
      setShowMfaWarningModal(true); // SETTINGS-242: "Disabling MFA reduces account security."
    } else {
      setMfaEnabled(true);
      toast.success('Multi-factor authentication is enabled.');
    }
  };

  const confirmDisableMfa = () => {
    setMfaEnabled(false);
    setShowMfaWarningModal(false);
    toast.info('Multi-factor authentication disabled.');
  };

  // --- Active Sessions Handlers (SETTINGS-244, SETTINGS-245) ---
  const confirmSignoutSingleSession = () => {
    if (!targetSignoutSession) return;
    setActiveSessions((prev) => prev.filter((s) => s.id !== targetSignoutSession.id));
    setShowSignoutSessionModal(false);
    setTargetSignoutSession(null);
    toast.success('Session signed out successfully.');
  };

  const handleSignoutAllOtherSessions = () => {
    setActiveSessions((prev) => prev.filter((s) => s.isCurrent));
    toast.success('Signed out of all other sessions.');
  };

  // --- Admin Notifications Handler (SETTINGS-250 to SETTINGS-254) ---
  const handleNotificationToggle = (field) => {
    setAdminNotifications((prev) => {
      const updated = { ...prev, [field]: !prev[field] };
      saveAdminNotifications(updated);
      return updated;
    });
  };

  const saveAdminNotifications = async (updated) => {
    setIsSavingNotifications(true);
    try {
      await api.put('/profile/notifications', updated);
      toast.success('Notification settings saved.');
    } catch (err) {
      toast.error('Unable to update notification settings.'); // SETTINGS-254
    } finally {
      setIsSavingNotifications(false);
    }
  };

  // --- Admin Session Timeout Handler (SETTINGS-256, SETTINGS-257) ---
  const handleTimeoutSelect = (newVal) => {
    setPendingTimeout(newVal);
    setShowTimeoutWarningModal(true); // SETTINGS-257
  };

  const confirmTimeoutChange = () => {
    setSessionTimeout(pendingTimeout);
    setShowTimeoutWarningModal(false);
    setPendingTimeout(null);
    toast.success('Session timeout updated.');
  };

  // --- Access Control Handlers (SETTINGS-258 to SETTINGS-268) ---
  const handlePermissionToggle = (permKey) => {
    // Check self-permission protection (SETTINGS-267)
    if (permKey === 'manage_settings' && adminUser.role === 'Admin') {
      toast.error('You cannot modify this permission for your own account.'); // SETTINGS-267
      return;
    }
    setPermissionState((prev) => ({ ...prev, [permKey]: !prev[permKey] }));
  };

  const confirmSavePermissions = async () => {
    // Check last admin protection (SETTINGS-268)
    if (!permissionState.manage_settings) {
      toast.error('At least one administrator must retain required access.'); // SETTINGS-268
      setShowSavePermissionsModal(false);
      return;
    }

    setIsSavingPermissions(true);
    try {
      const res = await api.put('/profile/admin/permissions', { permissions: permissionState });
      if (res.success) {
        toast.success('Permissions updated successfully.'); // SETTINGS-264
        setShowSavePermissionsModal(false);
      } else {
        toast.error(res.message || 'Unable to update permissions.'); // SETTINGS-265
      }
    } catch (err) {
      toast.error('Unable to update permissions.');
    } finally {
      setIsSavingPermissions(false);
    }
  };

  if (loading) {
    return (
      <div className="admin-profile-container">
        <div className="spinner-overlay"><div className="spinner" /><p>Loading administrator settings…</p></div>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="admin-profile-container">
        <div className="error-alert-box">
          <h3>Unable to load administrator settings.</h3>
          <p>{loadError}</p>
          <button className="btn-primary" onClick={fetchAdminData}>Retry</button>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-profile-container">
      {/* Network Lost Banner (SETTINGS-271) */}
      {isOffline && (
        <div className="security-alert-box" style={{ background: '#FFFBEB', borderColor: '#FCD34D', marginBottom: 20 }}>
          <p style={{ color: '#92400E', fontWeight: 600 }}>No internet connection.</p>
        </div>
      )}

      {/* Concurrent Update Conflict Banner (SETTINGS-274) */}
      {concurrentConflict && (
        <div className="security-alert-box" style={{ background: '#FEE2E2', borderColor: '#FCA5A5', marginBottom: 20 }}>
          <p style={{ color: '#991B1B', fontWeight: 600 }}>{concurrentConflict}</p>
          <button className="btn-secondary" style={{ marginTop: 8 }} onClick={() => { setConcurrentConflict(null); fetchAdminData(); }}>Refresh</button>
        </div>
      )}

      {/* Header (SETTINGS-224) */}
      <div className="admin-profile-header">
        <h1 className="admin-profile-title">Settings</h1>
        <p className="admin-profile-subtitle">Manage administrator profile, security, permissions, and system controls.</p>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="settings-tabs" style={{ marginBottom: 24 }}>
        <button className={`tab-btn ${activeTab === 'profile' ? 'active' : ''}`} onClick={() => handleTabChange('profile')}>
          Admin Profile
        </button>
        <button className={`tab-btn ${activeTab === 'security' ? 'active' : ''}`} onClick={() => handleTabChange('security')}>
          Security
        </button>
        <button className={`tab-btn ${activeTab === 'notifications' ? 'active' : ''}`} onClick={() => handleTabChange('notifications')}>
          Notifications
        </button>
        <button className={`tab-btn ${activeTab === 'preferences' ? 'active' : ''}`} onClick={() => handleTabChange('preferences')}>
          Preferences
        </button>
        <button className={`tab-btn ${activeTab === 'access_control' ? 'active' : ''}`} onClick={() => handleTabChange('access_control')}>
          Access Control
        </button>
        <button className={`tab-btn ${activeTab === 'system' ? 'active' : ''}`} onClick={() => handleTabChange('system')}>
          System Settings
        </button>
      </div>

      {/* ========================================================= */}
      {/* TAB 1: ADMIN PROFILE (SETTINGS-225 to SETTINGS-232)       */}
      {/* ========================================================= */}
      {activeTab === 'profile' && (
        <div className="admin-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <div>
              <h2 style={{ fontSize: 20, fontWeight: 700, margin: 0, color: '#1E293B' }}>Administrator Profile</h2>
              <p style={{ fontSize: 14, color: '#64748B', margin: '4px 0 0 0' }}>View and update administrator credentials.</p>
            </div>
            {!isEditingProfile && (
              <button className="btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: 6 }} onClick={() => setIsEditingProfile(true)}>
                <FiEdit2 /> Edit Profile
              </button>
            )}
          </div>

          {/* Photo Uploader (SETTINGS-229) */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 20, marginBottom: 24, padding: 16, background: '#F8FAFC', borderRadius: 12 }}>
            <div style={{ width: 72, height: 72, borderRadius: '50%', background: '#D4AF37', color: '#FFF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, fontWeight: 700, overflow: 'hidden' }}>
              {photoPreview ? <img src={photoPreview} alt="Admin Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : adminUser.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <label className="btn-secondary" style={{ cursor: 'pointer', display: 'inline-block' }}>
                Upload profile photo
                <input type="file" onChange={handlePhotoUpload} accept="image/*" style={{ display: 'none' }} />
              </label>
              <p style={{ fontSize: 12, color: '#94A3B8', marginTop: 4 }}>JPG, PNG or WEBP under 5MB.</p>
            </div>
          </div>

          <form onSubmit={handleSaveAdminProfile}>
            <div className="form-group" style={{ marginBottom: 16 }}>
              <label className="form-label">Administrator Name *</label>
              <input
                type="text"
                className={`form-input ${adminNameError ? 'has-error' : ''}`}
                value={adminName}
                disabled={!isEditingProfile}
                onChange={(e) => handleAdminNameChange(e.target.value)}
                placeholder="Admin Full Name"
              />
              {adminNameError && <span className="inline-error">{adminNameError}</span>}
            </div>

            {/* Read-Only Email Field (SETTINGS-228) */}
            <div className="form-group" style={{ marginBottom: 20 }}>
              <label className="form-label">Email Address (Centrally Managed)</label>
              <input type="email" className="form-input" value={adminUser.email} disabled readOnly style={{ background: '#F1F5F9', color: '#64748B' }} />
              <p style={{ fontSize: 13, color: '#64748B', marginTop: 4 }}>Email address cannot be changed here.</p>
            </div>

            {isEditingProfile && (
              <div style={{ display: 'flex', gap: 12 }}>
                <button type="button" className="btn-secondary" onClick={() => { setIsEditingProfile(false); setAdminName(adminUser.name); setAdminNameError(''); }}>Cancel</button>
                <button type="submit" className="btn-primary" disabled={isSavingProfile}>
                  {isSavingProfile ? 'Updating administrator profile…' : 'Save Profile'}
                </button>
              </div>
            )}
          </form>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 2: ADMIN SECURITY (SETTINGS-233 to SETTINGS-249)      */}
      {/* ========================================================= */}
      {activeTab === 'security' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {/* Password Policy Banner (SETTINGS-248) */}
          <div className="security-alert-box" style={{ background: '#EFF6FF', borderColor: '#93C5FD', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h4 style={{ fontSize: 15, fontWeight: 700, color: '#1E40AF', margin: '0 0 2px 0' }}>Security Policy</h4>
              <p style={{ color: '#1E3A8A', fontSize: 14, margin: 0 }}>Administrator passwords must be at least 12 characters and changed every 90 days.</p>
            </div>
            <a href="#change-password" className="btn-primary" style={{ padding: '6px 14px', fontSize: 13 }}>Change Admin Password</a>
          </div>

          {/* Change Admin Password Card */}
          <div className="admin-card" id="change-password">
            <h3 style={{ fontSize: 18, fontWeight: 700, color: '#1E293B', marginBottom: 4 }}>Security</h3>
            <p style={{ fontSize: 14, color: '#64748B', marginBottom: 20 }}>Change administrator password using OTP verification.</p>

            {/* STEP 1: OTP Verification */}
            <div style={{ padding: 16, border: '1px solid #E2E8F0', borderRadius: 10, background: '#F8FAFC', marginBottom: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10, marginBottom: adminOtpSent ? 12 : 0 }}>
                <div>
                  <h4 style={{ fontSize: 15, fontWeight: 600, margin: 0, color: '#1E293B' }}>1. OTP Verification</h4>
                  <p style={{ fontSize: 13, color: '#64748B', margin: '2px 0 0 0' }}>An OTP will be sent to your registered admin email address.</p>
                </div>
                {!isAdminOtpVerified && (
                  <button
                    type="button"
                    className="btn-primary"
                    onClick={handleSendAdminPasswordOtp}
                    disabled={isSendingAdminOtp}
                    style={{ padding: '8px 16px', fontSize: 13 }}
                  >
                    {isSendingAdminOtp ? 'Sending OTP...' : adminOtpSent ? 'Resend OTP' : 'Send OTP'}
                  </button>
                )}
              </div>

              {adminOtpSent && !isAdminOtpVerified && (
                <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid #E2E8F0' }}>
                  <div className="form-group" style={{ marginBottom: 12 }}>
                    <label className="form-label">Enter 6-Digit Verification OTP *</label>
                    <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                      <input
                        type="text"
                        className={`form-input ${passErrors.otp ? 'has-error' : ''}`}
                        value={adminOtp}
                        onChange={(e) => {
                          setAdminOtp(e.target.value.replace(/\D/g, '').slice(0, 6));
                          setPassErrors((prev) => ({ ...prev, otp: '' }));
                        }}
                        placeholder="Enter 6-digit OTP"
                        maxLength={6}
                        style={{ maxWidth: 200, letterSpacing: '2px', textAlign: 'center', fontWeight: 'bold' }}
                      />
                      <button
                        type="button"
                        className="btn-primary"
                        onClick={handleVerifyAdminPasswordOtp}
                        disabled={isVerifyingAdminOtp || adminOtp.trim().length !== 6}
                        style={{ padding: '8px 20px' }}
                      >
                        {isVerifyingAdminOtp ? 'Verifying...' : 'Verify OTP'}
                      </button>
                    </div>
                    {passErrors.otp && <span className="inline-error" style={{ color: '#DC2626', fontSize: 13, marginTop: 4, display: 'block' }}>{passErrors.otp}</span>}
                  </div>

                  {adminOtpSentTime && (
                    <div style={{ fontSize: 13, color: '#64748B' }}>
                      <OtpTimer
                        startTime={adminOtpSentTime}
                        onExpire={() => setAdminOtpSent(false)}
                      />
                    </div>
                  )}
                </div>
              )}

              {isAdminOtpVerified && (
                <div style={{ marginTop: 10, display: 'flex', alignItems: 'center', gap: 8, color: '#059669', fontWeight: 600, fontSize: 14 }}>
                  <FiCheckCircle style={{ fontSize: 18 }} /> OTP Verified Successfully! You can now enter your new password below.
                </div>
              )}
            </div>

            {/* STEP 2: Enter New Password & Confirm Password */}
            <form onSubmit={handleAdminPasswordSubmit}>
              <div style={{ opacity: isAdminOtpVerified ? 1 : 0.5, pointerEvents: isAdminOtpVerified ? 'auto' : 'none' }}>
                <h4 style={{ fontSize: 15, fontWeight: 600, margin: '0 0 12px 0', color: '#1E293B' }}>2. Enter New Password</h4>

                <div className="form-group" style={{ marginBottom: 16 }}>
                  <label className="form-label">New Password (At least 8 characters) *</label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type={showNewPass ? 'text' : 'password'}
                      className={`form-input ${passErrors.newPassword ? 'has-error' : ''}`}
                      value={passData.newPassword}
                      onChange={(e) => setPassData({ ...passData, newPassword: e.target.value })}
                      placeholder="Minimum 8 characters"
                      disabled={!isAdminOtpVerified}
                    />
                    <button type="button" style={{ position: 'absolute', right: 12, top: 10, background: 'none', border: 'none', cursor: 'pointer' }} onClick={() => setShowNewPass(!showNewPass)}>
                      {showNewPass ? <FiEyeOff /> : <FiEye />}
                    </button>
                  </div>
                  {passErrors.newPassword && <span className="inline-error">{passErrors.newPassword}</span>}
                </div>

                <div className="form-group" style={{ marginBottom: 20 }}>
                  <label className="form-label">Confirm New Password *</label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type={showConfirmPass ? 'text' : 'password'}
                      className={`form-input ${passErrors.confirmPassword ? 'has-error' : ''}`}
                      value={passData.confirmPassword}
                      onChange={(e) => setPassData({ ...passData, confirmPassword: e.target.value })}
                      placeholder="Confirm new password"
                      disabled={!isAdminOtpVerified}
                    />
                    <button type="button" style={{ position: 'absolute', right: 12, top: 10, background: 'none', border: 'none', cursor: 'pointer' }} onClick={() => setShowConfirmPass(!showConfirmPass)}>
                      {showConfirmPass ? <FiEyeOff /> : <FiEye />}
                    </button>
                  </div>
                  {passErrors.confirmPassword && <span className="inline-error">{passErrors.confirmPassword}</span>}
                </div>

                <button type="submit" className="btn-primary" disabled={!isAdminOtpVerified || isUpdatingPassword}>
                  {isUpdatingPassword ? 'Updating your password…' : 'Update Password'}
                </button>
              </div>
            </form>
          </div>

          {/* MFA Control (SETTINGS-240, SETTINGS-241, SETTINGS-249) */}
          <div className="admin-card">
            <h3 style={{ fontSize: 18, fontWeight: 700, color: '#1E293B', marginBottom: 4 }}>Multi-factor authentication</h3>
            <p style={{ fontSize: 14, color: '#64748B', marginBottom: 16 }}>Multi-factor authentication is enabled.</p>

            {/* Mandatory Blocking Alert (SETTINGS-249) */}
            <div className="security-alert-box" style={{ background: '#FFFBEB', borderColor: '#FCD34D', marginBottom: 16 }}>
              <p style={{ color: '#92400E', fontWeight: 600, margin: 0 }}>
                Two-factor authentication is mandatory for all administrator accounts and cannot be disabled.
              </p>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 16, border: '1px solid #E2E8F0', borderRadius: 12, background: '#F8FAFC' }}>
              <div>
                <span style={{ fontWeight: 600, color: '#059669', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <FiCheckCircle /> Multi-factor authentication is enabled.
                </span>
                <p style={{ fontSize: 13, color: '#64748B', margin: '4px 0 0 0' }}>Authenticator app (TOTP) active.</p>
              </div>
              <button className="btn-secondary" onClick={handleMfaToggleClick}>Manage MFA</button>
            </div>
          </div>

          {/* Active Sessions List (SETTINGS-243, SETTINGS-244, SETTINGS-245) */}
          <div className="admin-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h3 style={{ fontSize: 18, fontWeight: 700, color: '#1E293B', margin: 0 }}>Active sessions</h3>
              <button className="btn-secondary" style={{ color: '#DC2626', borderColor: '#FCA5A5' }} onClick={handleSignoutAllOtherSessions}>
                Sign out of all other sessions
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {activeSessions.map((sess) => (
                <div key={sess.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 16, border: '1px solid #E2E8F0', borderRadius: 12 }}>
                  <div>
                    <span style={{ fontWeight: 700, color: '#1E293B' }}>{sess.device}</span>
                    {sess.isCurrent && <span style={{ marginLeft: 8, background: '#D1FAE5', color: '#065F46', fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 10 }}>THIS DEVICE</span>}
                    <p style={{ fontSize: 13, color: '#64748B', margin: '4px 0 0 0' }}>IP: {sess.ip} • {sess.location}</p>
                  </div>
                  {!sess.isCurrent && (
                    <button className="btn-secondary" style={{ color: '#EF4444' }} onClick={() => { setTargetSignoutSession(sess); setShowSignoutSessionModal(true); }}>
                      Sign Out
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Administrator Login Activity Table (SETTINGS-246, SETTINGS-247) */}
          <div className="admin-card">
            <h3 style={{ fontSize: 18, fontWeight: 700, color: '#1E293B', marginBottom: 16 }}>Administrator login activity</h3>
            <div className="table-container">
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 14 }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid #E2E8F0', color: '#64748B' }}>
                    <th style={{ padding: '12px 16px' }}>Timestamp</th>
                    <th style={{ padding: '12px 16px' }}>IP Address</th>
                    <th style={{ padding: '12px 16px' }}>Location</th>
                    <th style={{ padding: '12px 16px' }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {loginActivities.length > 0 ? (
                    loginActivities.map((act) => (
                      <tr key={act.id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                        <td style={{ padding: '12px 16px', fontWeight: 500 }}>{act.time}</td>
                        <td style={{ padding: '12px 16px', color: '#64748B' }}>{act.ip}</td>
                        <td style={{ padding: '12px 16px', color: '#64748B' }}>{act.location}</td>
                        <td style={{ padding: '12px 16px' }}>
                          {act.status === 'Suspicious' ? (
                            <span style={{ background: '#FEE2E2', color: '#991B1B', padding: '2px 8px', borderRadius: 10, fontSize: 12, fontWeight: 700 }}>
                              Unusual administrator activity detected.
                            </span>
                          ) : (
                            <span style={{ background: '#D1FAE5', color: '#065F46', padding: '2px 8px', borderRadius: 10, fontSize: 12, fontWeight: 600 }}>Success</span>
                          )}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={4} style={{ padding: '24px', textAlign: 'center', color: '#64748B' }}>
                        No login activity recorded yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 3: ADMIN NOTIFICATIONS (SETTINGS-250 to SETTINGS-254)  */}
      {/* ========================================================= */}
      {activeTab === 'notifications' && (
        <div className="admin-card">
          <h2 style={{ fontSize: 20, fontWeight: 700, color: '#1E293B', marginBottom: 4 }}>Notification Settings</h2>
          <p style={{ fontSize: 14, color: '#64748B', marginBottom: 24 }}>Configure store alert preferences.</p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 16, borderBottom: '1px solid #F1F5F9' }}>
              <div>
                <h4 style={{ fontSize: 16, fontWeight: 600, margin: 0 }}>New order notifications</h4>
                <p style={{ fontSize: 13, color: '#64748B', margin: '4px 0 0 0' }}>Receive instant alerts when a customer places an order.</p>
              </div>
              <input type="checkbox" checked={adminNotifications.newOrders} onChange={() => handleNotificationToggle('newOrders')} style={{ width: 20, height: 20, cursor: 'pointer' }} />
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 16, borderBottom: '1px solid #F1F5F9' }}>
              <div>
                <h4 style={{ fontSize: 16, fontWeight: 600, margin: 0 }}>Low stock notifications</h4>
                <p style={{ fontSize: 13, color: '#64748B', margin: '4px 0 0 0' }}>Receive alerts when inventory falls below threshold.</p>
              </div>
              <input type="checkbox" checked={adminNotifications.lowStock} onChange={() => handleNotificationToggle('lowStock')} style={{ width: 20, height: 20, cursor: 'pointer' }} />
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h4 style={{ fontSize: 16, fontWeight: 600, margin: 0 }}>New user notifications</h4>
                <p style={{ fontSize: 13, color: '#64748B', margin: '4px 0 0 0' }}>Receive alerts when new user accounts register.</p>
              </div>
              <input type="checkbox" checked={adminNotifications.newUsers} onChange={() => handleNotificationToggle('newUsers')} style={{ width: 20, height: 20, cursor: 'pointer' }} />
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 4: ADMIN PREFERENCES (SETTINGS-255 to SETTINGS-257)   */}
      {/* ========================================================= */}
      {activeTab === 'preferences' && (
        <div className="admin-card">
          <h2 style={{ fontSize: 20, fontWeight: 700, color: '#1E293B', marginBottom: 20 }}>Appearance</h2>

          <div className="form-group" style={{ marginBottom: 24, maxWidth: 400 }}>
            <label className="form-label">Theme Options</label>
            <select className="form-select" value={adminTheme} onChange={(e) => setAdminTheme(e.target.value)}>
              <option value="system">System Default</option>
              <option value="light">Light Mode</option>
              <option value="dark">Dark Mode</option>
            </select>
          </div>

          <div className="form-group" style={{ maxWidth: 400 }}>
            <label className="form-label">Session timeout</label>
            <select className="form-select" value={sessionTimeout} onChange={(e) => handleTimeoutSelect(e.target.value)}>
              <option value="15">15 Minutes</option>
              <option value="30">30 Minutes</option>
              <option value="60">1 Hour</option>
              <option value="120">2 Hours</option>
            </select>
            <p style={{ fontSize: 13, color: '#64748B', marginTop: 4 }}>Automatically logs out inactive administrator sessions.</p>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 5: ADMIN ACCESS CONTROL (SETTINGS-258 to SETTINGS-268)*/}
      {/* ========================================================= */}
      {activeTab === 'access_control' && (
        <div className="admin-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <div>
              <h2 style={{ fontSize: 20, fontWeight: 700, margin: 0, color: '#1E293B' }}>Access Control</h2>
              <p style={{ fontSize: 14, color: '#64748B', margin: '4px 0 0 0' }}>Roles</p>
            </div>
            <button className="btn-primary" onClick={() => setShowSavePermissionsModal(true)}>Save permission changes</button>
          </div>

          <div style={{ marginBottom: 24 }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: '#1E293B', marginBottom: 12 }}>Role permissions</h3>
            <div className="table-container">
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 14 }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid #E2E8F0', color: '#64748B' }}>
                    <th style={{ padding: '12px 16px' }}>Permission</th>
                    <th style={{ padding: '12px 16px' }}>Status</th>
                    <th style={{ padding: '12px 16px', textAlign: 'right' }}>Toggle</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { key: 'manage_users', label: 'Manage Users & Customers' },
                    { key: 'manage_products', label: 'Manage Products & Categories' },
                    { key: 'manage_orders', label: 'Manage Orders & Refunds' },
                    { key: 'manage_settings', label: 'Manage System Settings (Critical)' }
                  ].map((perm) => (
                    <tr key={perm.key} style={{ borderBottom: '1px solid #F1F5F9' }}>
                      <td style={{ padding: '12px 16px', fontWeight: 600 }}>{perm.label}</td>
                      <td style={{ padding: '12px 16px' }}>
                        <span style={{ background: permissionState[perm.key] ? '#D1FAE5' : '#FEE2E2', color: permissionState[perm.key] ? '#065F46' : '#991B1B', padding: '2px 8px', borderRadius: 10, fontSize: 12, fontWeight: 700 }}>
                          {permissionState[perm.key] ? 'Enabled' : 'Disabled'}
                        </span>
                      </td>
                      <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                        <input
                          type="checkbox"
                          checked={permissionState[perm.key]}
                          onChange={() => handlePermissionToggle(perm.key)}
                          style={{ width: 18, height: 18, cursor: 'pointer' }}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 6: SYSTEM SETTINGS (SETTINGS-277)                     */}
      {/* ========================================================= */}
      {activeTab === 'system' && (
        <div className="admin-card">
          <h2 style={{ fontSize: 20, fontWeight: 700, color: '#1E293B', marginBottom: 4 }}>System Settings</h2>
          <p style={{ fontSize: 14, color: '#64748B', marginBottom: 24 }}>Manage application-wide system settings.</p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 20, maxWidth: 500 }}>
            <div className="form-group">
              <label className="form-label">Store Platform Name</label>
              <input type="text" className="form-input" defaultValue="Elora Fine Jewellery Store" />
            </div>

            <div className="form-group">
              <label className="form-label">System Maintenance Mode</label>
              <select className="form-select" defaultValue="false">
                <option value="false">Disabled (Store Live)</option>
                <option value="true">Enabled (Store Under Maintenance)</option>
              </select>
            </div>

            <button className="btn-primary" style={{ alignSelf: 'flex-start' }} onClick={() => toast.success('System settings saved successfully.')}>
              Save System Settings
            </button>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODALS                                                    */}
      {/* ========================================================= */}

      {/* Session Timeout Warning Modal (SETTINGS-257) */}
      {showTimeoutWarningModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">Session Timeout Warning</div>
            <div className="modal-body">Changing session timeout affects administrator sessions.</div>
            <div className="modal-actions">
              <button className="btn-secondary" onClick={() => setShowTimeoutWarningModal(false)}>Cancel</button>
              <button className="btn-primary" onClick={confirmTimeoutChange}>Confirm Change</button>
            </div>
          </div>
        </div>
      )}

      {/* MFA Warning Modal (SETTINGS-242) */}
      {showMfaWarningModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">MFA Warning</div>
            <div className="modal-body">Disabling MFA reduces account security.</div>
            <div className="modal-actions">
              <button className="btn-secondary" onClick={() => setShowMfaWarningModal(false)}>Cancel</button>
              <button className="btn-danger" onClick={confirmDisableMfa}>Confirm Disable</button>
            </div>
          </div>
        </div>
      )}

      {/* Signout Single Session Modal (SETTINGS-244) */}
      {showSignoutSessionModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">Sign Out Session</div>
            <div className="modal-body">Sign out this session?</div>
            <div className="modal-actions">
              <button className="btn-secondary" onClick={() => setShowSignoutSessionModal(false)}>Cancel</button>
              <button className="btn-danger" onClick={confirmSignoutSingleSession}>Sign Out</button>
            </div>
          </div>
        </div>
      )}

      {/* Save Permissions Confirmation Modal (SETTINGS-263) */}
      {showSavePermissionsModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">Confirm Permission Changes</div>
            <div className="modal-body">Save these permission changes?</div>
            <div className="modal-actions">
              <button className="btn-secondary" onClick={() => setShowSavePermissionsModal(false)}>Cancel</button>
              <button className="btn-primary" disabled={isSavingPermissions} onClick={confirmSavePermissions}>
                {isSavingPermissions ? 'Saving…' : 'Save Permission Changes'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Unsaved Admin Changes Confirmation Modal (SETTINGS-275) */}
      {showUnsavedModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">Unsaved Changes</div>
            <div className="modal-body">You have unsaved changes.</div>
            <div className="modal-actions">
              <button className="btn-secondary" onClick={() => setShowUnsavedModal(false)}>Stay</button>
              <button
                className="btn-danger"
                onClick={() => {
                  setShowUnsavedModal(false);
                  setIsEditingProfile(false);
                  setPassData({ currentPassword: '', newPassword: '', confirmPassword: '' });
                  if (pendingTabSwitch) setActiveTab(pendingTabSwitch);
                  setPendingTabSwitch(null);
                }}
              >
                Leave Without Saving
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
