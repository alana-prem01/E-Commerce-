import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import { FiEye, FiEyeOff, FiPlus, FiTrash2, FiEdit2 } from 'react-icons/fi';
import { api } from '../utils/api';
import '../css/Settings.css';

const INDIAN_STATES = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
  'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand',
  'Karnataka', 'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur',
  'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha', 'Punjab',
  'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura',
  'Uttar Pradesh', 'Uttarakhand', 'West Bengal', 'Delhi'
];

const LANGUAGES = [
  { code: 'en', name: 'English' },
  { code: 'hi', name: 'Hindi (हिन्दी)' },
  { code: 'es', name: 'Spanish (Español)' },
  { code: 'fr', name: 'French (Français)' },
  { code: 'de', name: 'German (Deutsch)' },
  { code: 'ar', name: 'Arabic (العربية)' },
  { code: 'ja', name: 'Japanese (日本語)' },
  { code: 'zh', name: 'Chinese (中文)' }
];

export default function Settings() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  // Active Tab: 'profile' | 'account' | 'security' | 'notifications' | 'privacy' | 'preferences' | 'addresses'
  const activeTabParam = searchParams.get('tab') || 'profile';
  const [activeTab, setActiveTab] = useState(activeTabParam);

  // General Loading & Error States
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState(null);
  const [securityApiError, setSecurityApiError] = useState(null);

  // User Profile State
  const [userProfile, setUserProfile] = useState(null);

  // Edit Mode Toggle (SETTINGS-013, SETTINGS-014)
  const [isEditing, setIsEditing] = useState(false);

  // Profile Form Fields & Errors (SETTINGS-015 to SETTINGS-046)
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    displayName: '',
    username: '',
    dob: '',
    gender: '',
    bio: ''
  });
  const [errors, setErrors] = useState({});

  // General Modals state
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [showUnsavedModal, setShowUnsavedModal] = useState(false);
  const [pendingTabSwitch, setPendingTabSwitch] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  // Photo Upload & Preview Modal (SETTINGS-031 to SETTINGS-035)
  const [selectedPhotoFile, setSelectedPhotoFile] = useState(null);
  const [photoPreviewUrl, setPhotoPreviewUrl] = useState(null);
  const [showPhotoPreviewModal, setShowPhotoPreviewModal] = useState(false);
  const [showRemovePhotoModal, setShowRemovePhotoModal] = useState(false);

  // Change Email Flow States (SETTINGS-051 to SETTINGS-058, SETTINGS-070 to SETTINGS-073)
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [emailStep, setEmailStep] = useState(1);
  const [newEmailInput, setNewEmailInput] = useState('');
  const [emailConfirmPassword, setEmailConfirmPassword] = useState('');
  const [emailOtpInput, setEmailOtpInput] = useState('');
  const [emailFlowError, setEmailFlowError] = useState('');
  const [emailFlowLoading, setEmailFlowLoading] = useState(false);

  // Change Mobile Flow States (SETTINGS-059 to SETTINGS-062, SETTINGS-074 to SETTINGS-080)
  const [showMobileModal, setShowMobileModal] = useState(false);
  const [mobileStep, setMobileStep] = useState(1);
  const [newMobileInput, setNewMobileInput] = useState('');
  const [mobileOtpInput, setMobileOtpInput] = useState('');
  const [mobileFlowError, setMobileFlowError] = useState('');
  const [mobileFlowLoading, setMobileFlowLoading] = useState(false);

  // Delete Account States (SETTINGS-063 to SETTINGS-069, SETTINGS-081, SETTINGS-082)
  const [showDeleteAccountModal, setShowDeleteAccountModal] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [deletePassword, setDeletePassword] = useState('');
  const [deleteError, setDeleteError] = useState('');
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);

  // Deactivate Account States (SETTINGS-085 to SETTINGS-087)
  const [showDeactivateModal, setShowDeactivateModal] = useState(false);
  const [deactivatePassword, setDeactivatePassword] = useState('');
  const [deactivateError, setDeactivateError] = useState('');
  const [isDeactivating, setIsDeactivating] = useState(false);

  // Grace Period Cancellation (SETTINGS-083, SETTINGS-084)
  const [isCancellingDeletion, setIsCancellingDeletion] = useState(false);

  // Security Module States (SETTINGS-088 to SETTINGS-118)
  const [passwordData, setPasswordData] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [passwordErrors, setPasswordErrors] = useState({});
  const [showCurrentPass, setShowCurrentPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);

  // Sessions & Login Activity States (SETTINGS-103 to SETTINGS-110, SETTINGS-114 to SETTINGS-116)
  const [sessions, setSessions] = useState([]);
  const [loginActivities, setLoginActivities] = useState([]);
  const [loadingSessions, setLoadingSessions] = useState(false);
  const [showLogoutSessionModal, setShowLogoutSessionModal] = useState(false);
  const [targetLogoutSessionId, setTargetLogoutSessionId] = useState(null);
  const [showLogoutAllModal, setShowLogoutAllModal] = useState(false);

  // Recovery Codes States (SETTINGS-111 to SETTINGS-113)
  const [recoveryCodes, setRecoveryCodes] = useState([]);
  const [showRegenerateCodesModal, setShowRegenerateCodesModal] = useState(false);

  // Notifications Module States (SETTINGS-119 to SETTINGS-121)
  const [notificationState, setNotificationState] = useState({ orderUpdates: true, deliveryUpdates: true });
  const [notificationsBlocked, setNotificationsBlocked] = useState(false);

  // Privacy Module States (SETTINGS-122 to SETTINGS-125)
  const [privacyState, setPrivacyState] = useState({ profileVisibility: true, activityVisibility: true, personalizedRecommendations: true });

  // Preferences Module States (SETTINGS-126 to SETTINGS-140)
  const [prefLanguage, setPrefLanguage] = useState('English');
  const [languageSearch, setLanguageSearch] = useState('');
  const [prefRegion, setPrefRegion] = useState('India');
  const [prefTheme, setPrefTheme] = useState(localStorage.getItem('theme') || 'system');
  const [prefTextSize, setPrefTextSize] = useState(100);
  const [prefDateTimeFormat, setPrefDateTimeFormat] = useState('DD/MM/YYYY');

  // Payment Settings States (SETTINGS-159 to SETTINGS-165, SETTINGS-211 to SETTINGS-215)
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [loadingPayments, setLoadingPayments] = useState(false);
  const [showAddCardModal, setShowAddCardModal] = useState(false);
  const [showRemoveCardModal, setShowRemoveCardModal] = useState(false);
  const [targetRemoveCard, setTargetRemoveCard] = useState(null);
  const [cardFormData, setCardFormData] = useState({ cardName: '', cardNumber: '', expMonth: '', expYear: '', cvv: '', isDefault: false });
  const [cardFormErrors, setCardFormErrors] = useState({});
  const [isProcessingCard, setIsProcessingCard] = useState(false);

  // Help & Support States (SETTINGS-166 to SETTINGS-175)
  const [faqSearchQuery, setFaqSearchQuery] = useState('');
  const [selectedFaq, setSelectedFaq] = useState(null);
  const [supportFormData, setSupportFormData] = useState({ subject: '', message: '', attachment: null });
  const [supportFormErrors, setSupportFormErrors] = useState({});
  const [isSubmittingSupport, setIsSubmittingSupport] = useState(false);
  const [supportTabMode, setSupportTabMode] = useState('main'); // 'main' | 'contact' | 'faq_detail'

  // Legal & About States (SETTINGS-176 to SETTINGS-182)
  const [legalDoc, setLegalDoc] = useState('terms'); // 'terms' | 'privacy' | 'refund' | 'shipping'
  const [showUpdateAppModal, setShowUpdateAppModal] = useState(false);

  // User Session & Logout States (SETTINGS-183 to SETTINGS-192)
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  // User Edge Cases & Network States (SETTINGS-193 to SETTINGS-208)
  const [isOfflineState, setIsOfflineState] = useState(!navigator.onLine);
  const [showConnectionRestored, setShowConnectionRestored] = useState(false);
  const [tabSyncNotice, setTabSyncNotice] = useState('');

  // Subscription & Billing States (SETTINGS-209 to SETTINGS-223)
  const [billingDetails, setBillingDetails] = useState(null);
  const [loadingBilling, setLoadingBilling] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [targetUpgradePlan, setTargetUpgradePlan] = useState(null);
  const [showCancelSubModal, setShowCancelSubModal] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [isProcessingSub, setIsProcessingSub] = useState(false);

  // Route Guard & Initial Load
  useEffect(() => {
    const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
    if (!isLoggedIn) {
      toast.error('Please log in to access settings.');
      navigate('/login');
      return;
    }
    fetchSettings();
    checkNotificationPermission();
  }, [navigate]);

  // Network offline & Storage sync events (SETTINGS-191, SETTINGS-195, SETTINGS-196, SETTINGS-204, SETTINGS-207)
  useEffect(() => {
    const handleOnline = () => {
      setIsOfflineState(false);
      setShowConnectionRestored(true);
      setTimeout(() => setShowConnectionRestored(false), 4000);
    };
    const handleOffline = () => {
      setIsOfflineState(true);
    };
    const handleStorageChange = (e) => {
      if (e.key === 'userProfileUpdated') {
        setTabSyncNotice('Settings updated in another tab.');
        fetchSettings();
      } else if (e.key === 'isLoggedIn' && e.newValue === null) {
        toast.info('Your session has ended.');
        navigate('/login');
      }
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [navigate]);

  // Sync activeTab with URL
  useEffect(() => {
    setSearchParams({ tab: activeTab });
  }, [activeTab, setSearchParams]);

  // Load section-specific data when tab changes
  useEffect(() => {
    if (activeTab === 'security') {
      fetchSecurityData();
    } else if (activeTab === 'addresses') {
      fetchAddressesData();
    } else if (activeTab === 'payments') {
      fetchPaymentMethods();
    } else if (activeTab === 'billing') {
      fetchBillingDetails();
    }
  }, [activeTab]);

  // Check notification permission (SETTINGS-121)
  const checkNotificationPermission = () => {
    if ('Notification' in window && Notification.permission === 'denied') {
      setNotificationsBlocked(true);
    } else {
      setNotificationsBlocked(false);
    }
  };

  // Fetch Main Settings Data (SETTINGS-001 to SETTINGS-010)
  const fetchSettings = async () => {
    setLoading(true);
    setApiError(null);

    if (!navigator.onLine) {
      setApiError('No internet connection.');
      setLoading(false);
      return;
    }

    try {
      const res = await api.get('/profile');
      if (res.success && res.data) {
        setUserProfile(res.data);
        populateFormData(res.data);
        if (res.data.notificationSettings) setNotificationState(res.data.notificationSettings);
        if (res.data.privacySettings) setPrivacyState(res.data.privacySettings);
        if (res.data.preferences) {
          if (res.data.preferences.language) setPrefLanguage(res.data.preferences.language);
          if (res.data.preferences.region) setPrefRegion(res.data.preferences.region);
          if (res.data.preferences.theme) setPrefTheme(res.data.preferences.theme);
          if (res.data.preferences.textSize) setPrefTextSize(res.data.preferences.textSize);
          if (res.data.preferences.dateTimeFormat) setPrefDateTimeFormat(res.data.preferences.dateTimeFormat);
        }
      } else {
        setApiError(res.message || 'Unable to load settings. Please try again.');
      }
    } catch (err) {
      if (!navigator.onLine || err.message?.includes('Network Error')) {
        setApiError('No internet connection.');
      } else if (err.status >= 500) {
        setApiError('Something went wrong. Please try again later.');
      } else {
        setApiError('Unable to load settings. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  // Fetch Security Data
  const fetchSecurityData = async () => {
    setLoadingSessions(true);
    setSecurityApiError(null);

    try {
      const [sessRes, recRes] = await Promise.all([
        api.get('/profile/sessions'),
        api.get('/profile/recovery-codes')
      ]);

      if (sessRes.success) {
        setSessions(sessRes.sessions || []);
        setLoginActivities(sessRes.loginActivities || []);
      }
      if (recRes.success) {
        setRecoveryCodes(recRes.recoveryCodes || []);
      }
    } catch (err) {
      setSecurityApiError('Unable to load security settings.');
    } finally {
      setLoadingSessions(false);
    }
  };

  // Fetch Addresses Data (SETTINGS-141)
  const fetchAddressesData = async () => {
    setLoadingAddresses(true);
    try {
      const res = await api.get('/profile/addresses');
      if (res.success && res.addresses) {
        setAddresses(res.addresses);
      }
    } catch (err) {
      toast.error('Unable to update address.');
    } finally {
      setLoadingAddresses(false);
    }
  };

  const populateFormData = (data) => {
    const nameParts = (data.name || '').trim().split(' ');
    const defaultFirst = data.firstName || nameParts[0] || '';
    const defaultLast = data.lastName || nameParts.slice(1).join(' ') || '';
    const formattedDob = data.dob ? new Date(data.dob).toISOString().split('T')[0] : '';

    setFormData({
      firstName: defaultFirst,
      lastName: defaultLast,
      displayName: data.displayName || data.name || '',
      username: data.username || '',
      dob: formattedDob,
      gender: data.gender || '',
      bio: data.bio || ''
    });
  };

  // Check unsaved changes (SETTINGS-040)
  const hasUnsavedChanges = () => {
    if (!isEditing || !userProfile) return false;
    const nameParts = (userProfile.name || '').trim().split(' ');
    const initialFirst = userProfile.firstName || nameParts[0] || '';
    const initialLast = userProfile.lastName || nameParts.slice(1).join(' ') || '';
    const initialDob = userProfile.dob ? new Date(userProfile.dob).toISOString().split('T')[0] : '';

    return (
      formData.firstName !== initialFirst ||
      formData.lastName !== initialLast ||
      formData.displayName !== (userProfile.displayName || userProfile.name || '') ||
      formData.username !== (userProfile.username || '') ||
      formData.dob !== initialDob ||
      formData.gender !== (userProfile.gender || '') ||
      formData.bio !== (userProfile.bio || '')
    );
  };

  const handleTabChange = (targetTab) => {
    if (activeTab === targetTab) return;
    if (hasUnsavedChanges()) {
      setPendingTabSwitch(targetTab);
      setShowUnsavedModal(true);
    } else {
      setActiveTab(targetTab);
    }
  };

  const handleBack = () => {
    if (hasUnsavedChanges()) {
      setPendingTabSwitch('BACK');
      setShowUnsavedModal(true);
    } else {
      navigate(-1);
    }
  };

  // Profile Field Change & Validation (SETTINGS-015 to SETTINGS-046)
  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    validateProfileField(field, value);
  };

  const validateProfileField = (field, value) => {
    const newErrors = { ...errors };

    if (field === 'firstName') {
      const trimmed = value.trim();
      if (!trimmed) {
        newErrors.firstName = 'First name is required.';
      } else if (trimmed.length < 2) {
        newErrors.firstName = 'Name must be at least 2 characters.';
      } else if (trimmed.length > 50) {
        newErrors.firstName = 'First name exceeds the maximum length.';
      } else if (!/^[A-Za-z\s'-]+$/.test(trimmed)) {
        newErrors.firstName = 'Enter a valid first name.';
      } else {
        delete newErrors.firstName;
      }
    }

    if (field === 'lastName') {
      const trimmed = value.trim();
      if (!trimmed) {
        newErrors.lastName = 'Last name is required.';
      } else if (trimmed.length < 2) {
        newErrors.lastName = 'Name must be at least 2 characters.';
      } else if (trimmed.length > 50) {
        newErrors.lastName = 'Last name exceeds the maximum length.';
      } else if (!/^[A-Za-z\s'-]+$/.test(trimmed)) {
        newErrors.lastName = 'Enter a valid last name.';
      } else {
        delete newErrors.lastName;
      }
    }

    if (field === 'username') {
      const trimmed = value.trim();
      if (trimmed && !/^[A-Za-z0-9_]+$/.test(trimmed)) {
        newErrors.username = 'Username can only contain letters, numbers and underscores.';
      } else {
        delete newErrors.username;
      }
    }

    if (field === 'dob') {
      if (value) {
        const dateObj = new Date(value);
        if (isNaN(dateObj.getTime())) {
          newErrors.dob = 'Enter a valid date.';
        } else if (dateObj > new Date()) {
          newErrors.dob = 'Date of birth cannot be in the future.';
        } else {
          delete newErrors.dob;
        }
      } else {
        delete newErrors.dob;
      }
    }

    if (field === 'bio') {
      if (value.length > 150) {
        newErrors.bio = 'Bio cannot exceed 150 characters.';
      } else {
        delete newErrors.bio;
      }
    }

    setErrors(newErrors);
  };

  const validateAllForm = () => {
    const newErrors = {};

    const trimmedFirst = formData.firstName.trim();
    if (!trimmedFirst) {
      newErrors.firstName = 'First name is required.';
    } else if (trimmedFirst.length < 2) {
      newErrors.firstName = 'Name must be at least 2 characters.';
    } else if (trimmedFirst.length > 50) {
      newErrors.firstName = 'First name exceeds the maximum length.';
    } else if (!/^[A-Za-z\s'-]+$/.test(trimmedFirst)) {
      newErrors.firstName = 'Enter a valid first name.';
    }

    const trimmedLast = formData.lastName.trim();
    if (!trimmedLast) {
      newErrors.lastName = 'Last name is required.';
    } else if (trimmedLast.length < 2) {
      newErrors.lastName = 'Name must be at least 2 characters.';
    } else if (trimmedLast.length > 50) {
      newErrors.lastName = 'Last name exceeds the maximum length.';
    } else if (!/^[A-Za-z\s'-]+$/.test(trimmedLast)) {
      newErrors.lastName = 'Enter a valid last name.';
    }

    const trimmedUser = formData.username.trim();
    if (trimmedUser && !/^[A-Za-z0-9_]+$/.test(trimmedUser)) {
      newErrors.username = 'Username can only contain letters, numbers and underscores.';
    }

    if (formData.dob) {
      const dateObj = new Date(formData.dob);
      if (isNaN(dateObj.getTime())) {
        newErrors.dob = 'Enter a valid date.';
      } else if (dateObj > new Date()) {
        newErrors.dob = 'Date of birth cannot be in the future.';
      }
    }

    if (formData.bio.length > 150) {
      newErrors.bio = 'Bio cannot exceed 150 characters.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSaveClick = (e) => {
    e.preventDefault();
    if (!validateAllForm()) return;
    setShowSaveModal(true);
  };

  const confirmSaveProfile = async () => {
    setShowSaveModal(false);
    setIsSaving(true);

    try {
      const payload = {
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        displayName: formData.displayName.trim(),
        username: formData.username.trim(),
        dob: formData.dob || null,
        gender: formData.gender,
        bio: formData.bio.trim()
      };

      const res = await api.put('/profile', payload);

      if (res.success && res.data) {
        setUserProfile(res.data);
        populateFormData(res.data);
        setIsEditing(false);
        toast.success('Profile updated successfully.');
      } else {
        if (res.message?.includes('username is already taken')) {
          setErrors((prev) => ({ ...prev, username: 'This username is already taken.' }));
        }
        toast.error(res.message || 'Unable to update your profile.');
      }
    } catch (err) {
      if (err.data?.message?.includes('username is already taken')) {
        setErrors((prev) => ({ ...prev, username: 'This username is already taken.' }));
      }
      toast.error(err.data?.message || 'Unable to update your profile.');
    } finally {
      setIsSaving(false);
    }
  };

  // Photo Upload Handler (SETTINGS-031 to SETTINGS-035)
  const handlePhotoSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const allowedMime = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml'];
    if (!allowedMime.includes(file.type)) {
      toast.error('Please select a supported image format.');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size exceeds the maximum allowed limit.');
      return;
    }

    setSelectedPhotoFile(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setPhotoPreviewUrl(reader.result);
      setShowPhotoPreviewModal(true);
    };
    reader.readAsDataURL(file);
  };

  const confirmUploadPhoto = async () => {
    if (!photoPreviewUrl) return;
    setShowPhotoPreviewModal(false);
    setIsSaving(true);

    try {
      const res = await api.post('/profile/photo', { image: photoPreviewUrl });
      if (res.success && res.profileImage) {
        setUserProfile((prev) => ({ ...prev, profileImage: res.profileImage }));
        toast.success('Profile updated successfully.');
      } else {
        toast.error(res.message || 'Unable to update your profile.');
      }
    } catch (err) {
      toast.error(err.data?.message || 'Unable to update your profile.');
    } finally {
      setIsSaving(false);
      setSelectedPhotoFile(null);
      setPhotoPreviewUrl(null);
    }
  };

  const confirmRemovePhoto = async () => {
    setShowRemovePhotoModal(false);
    setIsSaving(true);

    try {
      const res = await api.delete('/profile/photo');
      if (res.success) {
        setUserProfile((prev) => ({ ...prev, profileImage: '' }));
        toast.success('Profile updated successfully.');
      } else {
        toast.error(res.message || 'Unable to update your profile.');
      }
    } catch (err) {
      toast.error(err.data?.message || 'Unable to update your profile.');
    } finally {
      setIsSaving(false);
    }
  };

  // Change Email Handler
  const openChangeEmailModal = () => {
    setEmailStep(1);
    setNewEmailInput('');
    setEmailConfirmPassword('');
    setEmailOtpInput('');
    setEmailFlowError('');
    setShowEmailModal(true);
  };

  const handleSendEmailOtp = async () => {
    setEmailFlowError('');
    const trimmedEmail = newEmailInput.trim();

    if (!trimmedEmail) {
      setEmailFlowError('Email is required.');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmedEmail)) {
      setEmailFlowError('Enter a valid email address.');
      return;
    }

    if (userProfile && trimmedEmail.toLowerCase() === userProfile.email.toLowerCase()) {
      setEmailFlowError('Please enter a different email address.');
      return;
    }

    setEmailFlowLoading(true);
    try {
      const res = await api.post('/auth/change-email/send-otp', {
        newEmail: trimmedEmail,
        password: emailConfirmPassword
      });
      if (res.success) {
        setEmailStep(2);
        toast.success('Verification code sent successfully.');
      } else {
        if (res.message?.includes('password')) {
          setEmailFlowError('The password you entered is incorrect.');
        } else {
          setEmailFlowError(res.message || 'This email address is already in use.');
        }
      }
    } catch (err) {
      setEmailFlowError(err.data?.message || 'This email address is already in use.');
    } finally {
      setEmailFlowLoading(false);
    }
  };

  const handleVerifyEmailOtp = async () => {
    setEmailFlowError('');
    if (!emailOtpInput.trim()) {
      setEmailFlowError('Incorrect verification code.');
      return;
    }

    setEmailFlowLoading(true);
    try {
      const res = await api.post('/auth/change-email/verify-otp', { otp: emailOtpInput.trim() });
      if (res.success && res.email) {
        setUserProfile((prev) => ({ ...prev, email: res.email }));
        setShowEmailModal(false);
        toast.success('Email address updated successfully.');
      } else {
        if (res.message?.includes('expired')) {
          setEmailFlowError('This verification code has expired.');
        } else {
          setEmailFlowError('Incorrect verification code.');
        }
      }
    } catch (err) {
      setEmailFlowError(err.data?.message || 'Incorrect verification code.');
    } finally {
      setEmailFlowLoading(false);
    }
  };

  // Change Mobile Handler
  const openChangeMobileModal = () => {
    setMobileStep(1);
    setNewMobileInput('');
    setMobileOtpInput('');
    setMobileFlowError('');
    setShowMobileModal(true);
  };

  const handleSendMobileOtp = async () => {
    setMobileFlowError('');
    const trimmedMobile = newMobileInput.trim();

    if (!trimmedMobile) {
      setMobileFlowError('Mobile number is required.');
      return;
    }

    const digitsOnly = trimmedMobile.replace(/\D/g, '');
    if (digitsOnly.length < 7) {
      setMobileFlowError('Enter a valid mobile number.');
      return;
    }
    if (digitsOnly.length > 15) {
      setMobileFlowError('Enter a valid mobile number.');
      return;
    }

    if (userProfile && userProfile.phone && trimmedMobile === userProfile.phone) {
      setMobileFlowError('This is already your current mobile number.');
      return;
    }

    setMobileFlowLoading(true);
    try {
      const res = await api.post('/auth/change-mobile/send-otp', { newMobile: trimmedMobile });
      if (res.success) {
        setMobileStep(2);
        toast.success('Verification code sent successfully.');
      } else {
        setMobileFlowError(res.message || 'This mobile number is already in use.');
      }
    } catch (err) {
      setMobileFlowError(err.data?.message || 'This mobile number is already in use.');
    } finally {
      setMobileFlowLoading(false);
    }
  };

  const handleVerifyMobileOtp = async () => {
    setMobileFlowError('');
    if (!mobileOtpInput.trim()) {
      setMobileFlowError('Incorrect verification code.');
      return;
    }

    setMobileFlowLoading(true);
    try {
      const res = await api.post('/auth/change-mobile/verify-otp', { otp: mobileOtpInput.trim() });
      if (res.success && res.phone) {
        setUserProfile((prev) => ({ ...prev, phone: res.phone }));
        setShowMobileModal(false);
        toast.success('Mobile number updated successfully.');
      } else {
        if (res.message?.includes('expired')) {
          setMobileFlowError('This verification code has expired.');
        } else {
          setMobileFlowError('Incorrect verification code.');
        }
      }
    } catch (err) {
      setMobileFlowError(err.data?.message || 'Incorrect verification code.');
    } finally {
      setMobileFlowLoading(false);
    }
  };

  // Delete Account Handler
  const openDeleteAccountModal = () => {
    setDeleteConfirmText('');
    setDeletePassword('');
    setDeleteError('');
    setShowDeleteAccountModal(true);
  };

  const confirmDeleteAccount = async () => {
    setDeleteError('');

    if (deleteConfirmText.trim() !== 'DELETE') {
      setDeleteError('Please type DELETE exactly as shown.');
      return;
    }

    setIsDeletingAccount(true);
    try {
      const res = await api.post('/profile/schedule-deletion', {
        confirmText: deleteConfirmText.trim(),
        password: deletePassword
      });

      if (res.success) {
        toast.success('Your account has been deleted successfully.');
        localStorage.clear();
        setShowDeleteAccountModal(false);
        window.location.href = '/login';
      } else {
        if (res.message?.includes('password')) {
          setDeleteError('The password you entered is incorrect.');
        } else {
          setDeleteError(res.message || 'Unable to delete your account. Please try again.');
        }
      }
    } catch (err) {
      setDeleteError(err.data?.message || 'Unable to delete your account. Please try again.');
    } finally {
      setIsDeletingAccount(false);
    }
  };

  const handleCancelDeletion = async () => {
    setIsCancellingDeletion(true);
    try {
      const res = await api.post('/profile/cancel-deletion');
      if (res.success) {
        setUserProfile((prev) => ({ ...prev, status: 'Active', deletionGracePeriodExpires: null }));
        toast.success('Account deletion has been cancelled.');
      }
    } catch (err) {
      toast.error('Unable to cancel account deletion.');
    } finally {
      setIsCancellingDeletion(false);
    }
  };

  // Deactivate Account Handler
  const confirmDeactivateAccount = async () => {
    setDeactivateError('');
    if (userProfile?.password && !deactivatePassword.trim()) {
      setDeactivateError('The password you entered is incorrect.');
      return;
    }

    setIsDeactivating(true);
    try {
      const res = await api.post('/profile/deactivate', { password: deactivatePassword });
      if (res.success) {
        toast.info('Your account has been deactivated.');
        localStorage.clear();
        setShowDeactivateModal(false);
        window.location.href = '/login';
      } else {
        setDeactivateError(res.message || 'The password you entered is incorrect.');
      }
    } catch (err) {
      setDeactivateError(err.data?.message || 'The password you entered is incorrect.');
    } finally {
      setIsDeactivating(false);
    }
  };

  // Password Change & Validation
  const getPasswordStrength = (pass) => {
    if (!pass) return { score: 0, label: '', color: '#E2E8F0' };
    let score = 0;
    if (pass.length >= 8) score += 1;
    if (/[A-Z]/.test(pass)) score += 1;
    if (/[a-z]/.test(pass)) score += 1;
    if (/\d/.test(pass)) score += 1;
    if (/[@$!%*?&^#_.+-]/.test(pass)) score += 1;

    if (score <= 2) return { score: 20, label: 'Weak', color: '#EF4444' };
    if (score <= 4) return { score: 60, label: 'Medium', color: '#F59E0B' };
    return { score: 100, label: 'Strong', color: '#10B981' };
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    const newPassErrors = {};

    const isSocialAccount = Boolean(!userProfile?.password);

    if (!isSocialAccount && !passwordData.currentPassword.trim()) {
      newPassErrors.currentPassword = 'Current password is required.';
    }

    if (!passwordData.newPassword.trim()) {
      newPassErrors.newPassword = 'New password is required.';
    } else if (passwordData.newPassword.length < 8) {
      newPassErrors.newPassword = 'Password must meet the minimum length requirement.';
    } else if (passwordData.newPassword.length > 20) {
      newPassErrors.newPassword = 'Password exceeds the maximum allowed length.';
    } else {
      const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&^#_.+-])[A-Za-z\d@$!%*?&^#_.+-]{8,20}$/;
      if (!passwordRegex.test(passwordData.newPassword)) {
        newPassErrors.newPassword = 'Password does not meet the requirements.';
      }
    }

    if (!passwordData.confirmPassword.trim()) {
      newPassErrors.confirmPassword = 'Please confirm your new password.';
    } else if (passwordData.newPassword !== passwordData.confirmPassword) {
      newPassErrors.confirmPassword = 'Passwords do not match.';
    }

    if (!isSocialAccount && passwordData.currentPassword && passwordData.newPassword && passwordData.currentPassword === passwordData.newPassword) {
      newPassErrors.newPassword = 'New password must be different from your current password.';
    }

    setPasswordErrors(newPassErrors);
    if (Object.keys(newPassErrors).length > 0) return;

    setIsUpdatingPassword(true);

    try {
      const endpoint = isSocialAccount ? '/auth/set-password' : '/auth/change-password';
      const res = await api.post(endpoint, passwordData);

      if (res.success) {
        setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
        if (isSocialAccount) {
          toast.success('Password created successfully.');
          setUserProfile((prev) => ({ ...prev, password: 'has_password' }));
        } else {
          toast.success('Password changed successfully.');
        }
      } else {
        if (res.message?.includes('Current password')) {
          setPasswordErrors({ currentPassword: 'Current password is incorrect.' });
        } else {
          toast.error(res.message || 'Unable to change your password.');
        }
      }
    } catch (err) {
      if (err.data?.message?.includes('Current password')) {
        setPasswordErrors({ currentPassword: 'Current password is incorrect.' });
      } else {
        toast.error(err.data?.message || 'Unable to change your password.');
      }
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  // Sessions Management
  const handleLogoutSingleSession = async () => {
    setShowLogoutSessionModal(false);
    try {
      const res = await api.post('/profile/sessions/logout', { sessionId: targetLogoutSessionId });
      if (res.success) {
        setSessions((prev) => prev.filter((s) => s.sessionId !== targetLogoutSessionId));
        toast.success('Device signed out successfully.');
      }
    } catch (err) {
      toast.error('Unable to load security settings.');
    } finally {
      setTargetLogoutSessionId(null);
    }
  };

  const handleLogoutAllOtherSessions = async () => {
    setShowLogoutAllModal(false);
    try {
      const res = await api.post('/profile/sessions/logout-all-others');
      if (res.success) {
        setSessions((prev) => prev.filter((s) => s.isCurrent));
        toast.success('Device signed out successfully.');
      }
    } catch (err) {
      toast.error('Unable to load security settings.');
    }
  };

  // Recovery Codes Handler
  const handleCopyRecoveryCodes = () => {
    const codesText = recoveryCodes.map((c) => (typeof c === 'string' ? c : c.code)).join('\n');
    navigator.clipboard.writeText(codesText);
    toast.success('Recovery codes copied to clipboard.');
  };

  const handleRegenerateRecoveryCodes = async () => {
    setShowRegenerateCodesModal(false);
    try {
      const res = await api.post('/profile/recovery-codes/regenerate');
      if (res.success && res.recoveryCodes) {
        setRecoveryCodes(res.recoveryCodes);
        toast.success('Recovery codes copied to clipboard.');
      }
    } catch (err) {
      toast.error('Unable to load security settings.');
    }
  };

  // Notifications Toggle Handler (SETTINGS-119, SETTINGS-120)
  const handleNotificationToggle = async (key, value) => {
    const updated = { ...notificationState, [key]: value };
    setNotificationState(updated);
    try {
      await api.put('/profile/notifications', updated);
    } catch (err) {
      toast.error('Failed to update notification preferences.');
    }
  };

  // Privacy Toggle Handler (SETTINGS-123 to SETTINGS-125)
  const handlePrivacyToggle = async (key, value) => {
    const updated = { ...privacyState, [key]: value };
    setPrivacyState(updated);
    try {
      await api.put('/profile/privacy', updated);
    } catch (err) {
      toast.error('Failed to update privacy settings.');
    }
  };

  // Language Update Handler (SETTINGS-127 to SETTINGS-131)
  const handleApplyLanguage = async (langName) => {
    setPrefLanguage(langName);
    try {
      const res = await api.put('/profile/preferences', { language: langName });
      if (res.success) {
        toast.success('Language updated successfully.'); // SETTINGS-130
      } else {
        toast.error('Unable to update language preference.'); // SETTINGS-131
      }
    } catch (err) {
      toast.error('Unable to update language preference.'); // SETTINGS-131
    }
  };

  // Region Update Handler (SETTINGS-132)
  const handleRegionChange = async (regionName) => {
    setPrefRegion(regionName);
    try {
      await api.put('/profile/preferences', { region: regionName });
    } catch (err) {
      toast.error('Failed to update region preference.');
    }
  };

  // Theme Update Handler (SETTINGS-133 to SETTINGS-138)
  const handleThemeChange = async (themeMode) => {
    setPrefTheme(themeMode);
    localStorage.setItem('theme', themeMode);

    if (themeMode === 'dark') {
      document.body.classList.add('dark-theme');
    } else {
      document.body.classList.remove('dark-theme');
    }

    try {
      const res = await api.put('/profile/preferences', { theme: themeMode });
      if (res.success) {
        toast.success('Appearance updated.'); // SETTINGS-137
      }
    } catch (err) {
      toast.error('Failed to update theme preference.');
    }
  };

  // Address Form Submit Handler (SETTINGS-143 to SETTINGS-154, SETTINGS-158)
  const handleOpenAddressModal = (addrToEdit = null) => {
    setAddressFormErrors({});
    if (addrToEdit) {
      setEditingAddressId(addrToEdit._id);
      setAddressFormData({
        fullName: addrToEdit.fullName || '',
        house: addrToEdit.house || '',
        street: addrToEdit.street || '',
        city: addrToEdit.city || '',
        state: addrToEdit.state || '',
        pinCode: addrToEdit.pinCode || '',
        phone: addrToEdit.phone || '',
        country: addrToEdit.country || 'India',
        isDefault: Boolean(addrToEdit.isDefault)
      });
    } else {
      setEditingAddressId(null);
      setAddressFormData({
        fullName: userProfile?.name || '',
        house: '',
        street: '',
        city: '',
        state: '',
        pinCode: '',
        phone: userProfile?.phone || '',
        country: 'India',
        isDefault: addresses.length === 0
      });
    }
    setShowAddressModal(true);
  };

  const handleSaveAddress = async (e) => {
    e.preventDefault();
    const addrErrors = {};

    if (!addressFormData.fullName.trim()) addrErrors.fullName = 'Full name is required.';
    if (!addressFormData.house.trim() && !addressFormData.street.trim()) addrErrors.house = 'Address line is required.';
    if (!addressFormData.city.trim()) addrErrors.city = 'City is required.';
    if (!addressFormData.state.trim()) addrErrors.state = 'State is required.';
    if (!addressFormData.phone.trim()) addrErrors.phone = 'Mobile number is required.';

    const pin = addressFormData.pinCode.trim();
    if (!pin) {
      addrErrors.pinCode = 'Postal code is required.';
    } else if (!/^\d{4,10}$/.test(pin)) {
      addrErrors.pinCode = 'Enter a valid postal code.'; // SETTINGS-149
    }

    setAddressFormErrors(addrErrors);
    if (Object.keys(addrErrors).length > 0) return;

    setIsSavingAddress(true); // SETTINGS-152: Saving address…

    try {
      const endpoint = editingAddressId ? `/profile/addresses/${editingAddressId}` : '/profile/addresses';
      const method = editingAddressId ? 'put' : 'post';
      const res = await api[method](endpoint, addressFormData);

      if (res.success && res.addresses) {
        setAddresses(res.addresses);
        setShowAddressModal(false);
        toast.success('Address saved successfully.'); // SETTINGS-153
      } else {
        toast.error(res.message || 'Unable to update address.'); // SETTINGS-158
      }
    } catch (err) {
      toast.error(err.data?.message || 'Unable to update address.'); // SETTINGS-158
    } finally {
      setIsSavingAddress(false);
    }
  };

  // Delete Address Handler (SETTINGS-155 to SETTINGS-157)
  const confirmDeleteAddress = async () => {
    if (!targetDeleteAddress) return;
    const addrId = targetDeleteAddress._id;
    setShowDeleteAddressModal(false);

    try {
      const res = await api.delete(`/profile/addresses/${addrId}`);
      if (res.success && res.addresses) {
        setAddresses(res.addresses);
        toast.success('Address deleted successfully.');
      } else {
        if (res.message?.includes('another default address')) {
          toast.error('Please select another default address first.'); // SETTINGS-157
        } else {
          toast.error(res.message || 'Unable to update address.');
        }
      }
    } catch (err) {
      if (err.data?.message?.includes('another default address')) {
        toast.error('Please select another default address first.'); // SETTINGS-157
      } else {
        toast.error(err.data?.message || 'Unable to update address.');
      }
    } finally {
      setTargetDeleteAddress(null);
    }
  };

  // Payment Methods Logic (SETTINGS-159 to SETTINGS-165, SETTINGS-211 to SETTINGS-215)
  const fetchPaymentMethods = async () => {
    setLoadingPayments(true);
    try {
      const res = await api.get('/profile/payment-methods');
      if (res.success && res.paymentMethods) {
        setPaymentMethods(res.paymentMethods);
      }
    } catch (err) {
      toast.error('Unable to update payment settings.');
    } finally {
      setLoadingPayments(false);
    }
  };

  const handleAddCardSubmit = async (e) => {
    e.preventDefault();
    const newErrors = {};

    const cleanCardNum = cardFormData.cardNumber.replace(/\s+/g, '');
    if (!cleanCardNum || cleanCardNum.length < 13 || cleanCardNum.length > 19 || !/^\d+$/.test(cleanCardNum)) {
      newErrors.cardNumber = 'Enter a valid card number.'; // SETTINGS-211
    }

    const month = parseInt(cardFormData.expMonth, 10);
    const year = parseInt(cardFormData.expYear, 10);
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;

    if (!cardFormData.expMonth || !cardFormData.expYear || month < 1 || month > 12 || isNaN(year)) {
      newErrors.expMonth = 'This card has expired.'; // SETTINGS-212
    } else if (year < currentYear || (year === currentYear && month < currentMonth)) {
      newErrors.expMonth = 'This card has expired.'; // SETTINGS-212
    }

    if (!cardFormData.cvv || !/^\d{3,4}$/.test(cardFormData.cvv)) {
      newErrors.cvv = 'Enter a valid security code.'; // SETTINGS-213
    }

    if (Object.keys(newErrors).length > 0) {
      setCardFormErrors(newErrors);
      return;
    }

    setIsProcessingCard(true); // SETTINGS-214: "Verifying your payment method…"
    try {
      const res = await api.post('/profile/payment-methods', {
        cardNumber: cleanCardNum,
        cardBrand: cleanCardNum.startsWith('4') ? 'Visa' : cleanCardNum.startsWith('5') ? 'MasterCard' : 'Amex',
        expMonth: cardFormData.expMonth,
        expYear: cardFormData.expYear,
        cvv: cardFormData.cvv,
        nameOnCard: cardFormData.cardName,
        setAsDefault: cardFormData.isDefault
      });

      if (res.success && res.paymentMethods) {
        setPaymentMethods(res.paymentMethods);
        setShowAddCardModal(false);
        setCardFormData({ cardName: '', cardNumber: '', expMonth: '', expYear: '', cvv: '', isDefault: false });
        setCardFormErrors({});
        toast.success(res.message || 'Payment method saved successfully.');
      } else {
        toast.error(res.message || 'Your card was declined. Please try a different payment method.'); // SETTINGS-215
      }
    } catch (err) {
      toast.error(err.data?.message || 'Your card was declined. Please try a different payment method.');
    } finally {
      setIsProcessingCard(false);
    }
  };

  const confirmRemovePaymentMethod = async () => {
    if (!targetRemoveCard) return;
    try {
      const res = await api.delete(`/profile/payment-methods/${targetRemoveCard.paymentMethodId || targetRemoveCard._id}`);
      if (res.success && res.paymentMethods) {
        setPaymentMethods(res.paymentMethods);
        toast.success('Payment method removed successfully.');
      } else {
        toast.error('Unable to update payment settings.'); // SETTINGS-165
      }
    } catch (err) {
      toast.error('Unable to update payment settings.');
    } finally {
      setShowRemoveCardModal(false);
      setTargetRemoveCard(null);
    }
  };

  // Help & Support Logic (SETTINGS-166 to SETTINGS-175)
  const FAQS = [
    { id: 1, question: 'How do I track my jewellery order status?', answer: 'You can track your order status in real-time under Orders in your account profile, or using the tracking code provided in your dispatch email.' },
    { id: 2, question: 'What is your 30-day return & exchange policy?', answer: 'We offer a 30-day no-questions-asked return and exchange policy for undamaged jewellery pieces accompanied by their original hallmark certificate and packaging.' },
    { id: 3, question: 'Are all gold and diamond items certified and hallmarked?', answer: 'Yes! Every gold item is 100% BIS Hallmarked, and all diamond pieces come with certified documentation from IGI, GIA, or SGL.' },
    { id: 4, question: 'How can I resize or customize a ring or bracelet?', answer: 'You can select custom sizing during purchase or visit any authorized store with your invoice within 60 days of purchase for complimentary resizing.' }
  ];

  const filteredFaqs = FAQS.filter(
    (f) => f.question.toLowerCase().includes(faqSearchQuery.toLowerCase()) || f.answer.toLowerCase().includes(faqSearchQuery.toLowerCase())
  );

  const handleSupportAttachment = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) { // SETTINGS-174
      setSupportFormErrors((prev) => ({ ...prev, attachment: 'File size must be under 10MB.' }));
      return;
    }

    setSupportFormErrors((prev) => {
      const copy = { ...prev };
      delete copy.attachment;
      return copy;
    });
    setSupportFormData((prev) => ({ ...prev, attachment: file }));
  };

  const handleSupportSubmit = async (e) => {
    e.preventDefault();
    const newErrors = {};

    if (!supportFormData.message || !supportFormData.message.trim()) {
      newErrors.message = 'Please describe your issue before submitting.'; // SETTINGS-173
    }

    if (Object.keys(newErrors).length > 0) {
      setSupportFormErrors(newErrors);
      return;
    }

    setIsSubmittingSupport(true);
    try {
      const res = await api.post('/profile/support', {
        subject: supportFormData.subject || 'General Inquiry',
        message: supportFormData.message.trim(),
        attachmentName: supportFormData.attachment ? supportFormData.attachment.name : null
      });

      if (res.success) {
        toast.success('Your request has been submitted. Our team will respond within 24 hours.'); // SETTINGS-175
        setSupportFormData({ subject: '', message: '', attachment: null });
        setSupportFormErrors({});
        setSupportTabMode('main');
      } else {
        toast.error(res.message || 'Unable to complete your request.');
      }
    } catch (err) {
      toast.error('Unable to complete your request.');
    } finally {
      setIsSubmittingSupport(false);
    }
  };

  // Subscription & Billing Logic (SETTINGS-209 to SETTINGS-223)
  const fetchBillingDetails = async () => {
    setLoadingBilling(true);
    try {
      const res = await api.get('/profile/billing');
      if (res.success && res.billing) {
        setBillingDetails(res.billing);
      }
    } catch (err) {
      toast.error('Unable to load billing details.');
    } finally {
      setLoadingBilling(false);
    }
  };

  const confirmUpgradePlan = async () => {
    if (!targetUpgradePlan) return;
    setIsProcessingSub(true);
    try {
      const res = await api.post('/profile/subscription/upgrade', { planName: targetUpgradePlan.name, price: targetUpgradePlan.price });
      if (res.success) {
        toast.success(`Your plan has been upgraded to ${targetUpgradePlan.name}`); // SETTINGS-217
        fetchBillingDetails();
        fetchSettings();
        setShowUpgradeModal(false);
      } else {
        toast.error('Unable to complete your request.');
      }
    } catch (err) {
      toast.error('Unable to complete your request.');
    } finally {
      setIsProcessingSub(false);
      setTargetUpgradePlan(null);
    }
  };

  const confirmCancelSubscription = async () => {
    setIsProcessingSub(true);
    try {
      const res = await api.post('/profile/subscription/cancel');
      if (res.success) {
        toast.success(res.message || `Your subscription has been cancelled. You'll retain access until ${res.endDate}.`); // SETTINGS-219
        fetchBillingDetails();
        fetchSettings();
        setShowCancelSubModal(false);
      } else {
        toast.error('Unable to complete your request.');
      }
    } catch (err) {
      toast.error('Unable to complete your request.');
    } finally {
      setIsProcessingSub(false);
    }
  };

  // Logout Handlers (SETTINGS-183 to SETTINGS-188)
  const handleLogoutClick = () => {
    setShowLogoutModal(true); // SETTINGS-184: "Are you sure you want to log out?"
  };

  const confirmLogout = async () => {
    setShowLogoutModal(false);
    setIsLoggingOut(true); // SETTINGS-186: "Signing you out…"

    try {
      const res = await api.post('/auth/logout');
      if (res.success !== false) {
        localStorage.removeItem('token');
        localStorage.removeItem('isLoggedIn');
        toast.success('You have been logged out successfully.'); // SETTINGS-187
        navigate('/login');
      } else {
        toast.error('Unable to log out. Please try again.'); // SETTINGS-188
      }
    } catch (err) {
      localStorage.removeItem('token');
      localStorage.removeItem('isLoggedIn');
      toast.success('You have been logged out successfully.');
      navigate('/login');
    } finally {
      setIsLoggingOut(false);
    }
  };

  // Skeleton Loader View (SETTINGS-002, SETTINGS-004)
  if (loading) {
    return (
      <div className="settings-container">
        <div className="settings-header">
          <div className="skeleton-box" style={{ width: 120, height: 40 }} />
          <div className="skeleton-box" style={{ width: 150, height: 32 }} />
        </div>
        <div className="profile-summary-card">
          <div className="skeleton-box" style={{ width: 90, height: 90, borderRadius: '50%' }} />
          <div style={{ flex: 1 }}>
            <div className="skeleton-box" style={{ width: 200, height: 24, marginBottom: 8 }} />
            <div className="skeleton-box" style={{ width: 280, height: 16 }} />
          </div>
        </div>
        <div className="spinner-overlay">
          <div className="spinner" />
          <p style={{ color: '#64748B', fontWeight: 500 }}>Loading settings</p>
        </div>
      </div>
    );
  }

  // Error State View (SETTINGS-008, SETTINGS-009, SETTINGS-010)
  if (apiError) {
    return (
      <div className="settings-container">
        <div className="settings-header">
          <button className="back-btn" onClick={() => navigate(-1)}>
            ← Back
          </button>
          <h1 className="settings-title">Settings</h1>
        </div>
        <div className="error-alert-box">
          <h3>Unable to load settings</h3>
          <p>{apiError}</p>
          <button className="btn-primary" onClick={fetchSettings}>
            Retry
          </button>
        </div>
      </div>
    );
  }

  const isPremium = userProfile?.membership?.isPremium;
  const isScheduledForDeletion = userProfile?.status === 'ScheduledForDeletion' || Boolean(userProfile?.deletionGracePeriodExpires);

  const filteredLanguages = LANGUAGES.filter((l) =>
    l.name.toLowerCase().includes(languageSearch.toLowerCase())
  );

  return (
    <div className="settings-container">
      {/* Header & Back CTA (SETTINGS-001, SETTINGS-005) */}
      <div className="settings-header">
        <div className="settings-header-left">
          <button className="back-btn" onClick={handleBack}>
            ← Back
          </button>
          <h1 className="settings-title">Settings</h1>
        </div>
      </div>

      {/* Account Deletion Grace Period Banner (SETTINGS-083) */}
      {isScheduledForDeletion && (
        <div className="security-alert-box" style={{ background: '#FEE2E2', borderColor: '#FCA5A5' }}>
          <div>
            <p style={{ color: '#991B1B', fontWeight: 700 }}>Account Deletion Scheduled</p>
            <p style={{ color: '#791E1E' }}>
              Your account will be permanently deleted in 14 days. Log in anytime before then to cancel.
            </p>
          </div>
          <button
            className="btn-primary"
            disabled={isCancellingDeletion}
            onClick={handleCancelDeletion}
          >
            {isCancellingDeletion ? 'Cancelling…' : 'Cancel Deletion'}
          </button>
        </div>
      )}

      {/* Profile Summary Card (SETTINGS-001) */}
      <div className="profile-summary-card">
        <div className="avatar-container">
          {userProfile?.profileImage ? (
            <img src={userProfile.profileImage} alt="Profile Avatar" className="profile-avatar-img" />
          ) : (
            <span className="avatar-placeholder">
              {(userProfile?.name || 'U').charAt(0).toUpperCase()}
            </span>
          )}
        </div>
        <div className="summary-info">
          <h2>
            {userProfile?.displayName || userProfile?.name || 'User Name'}
            {isPremium && <span className="badge-premium">PREMIUM</span>}
          </h2>
          <p>{userProfile?.email}</p>
          {userProfile?.phone && <p>{userProfile.phone}</p>}
        </div>
      </div>

      {/* Offline Indicator Banner (SETTINGS-195, SETTINGS-207) */}
      {isOfflineState && (
        <div className="security-alert-box" style={{ background: '#FFFBEB', borderColor: '#FCD34D', marginBottom: 20 }}>
          <p style={{ color: '#92400E', fontWeight: 600 }}>Connection lost. Please try again. Settings cannot be updated while offline.</p>
        </div>
      )}

      {/* Connection Restored Banner (SETTINGS-196) */}
      {showConnectionRestored && (
        <div className="security-alert-box" style={{ background: '#ECFDF5', borderColor: '#6EE7B7', marginBottom: 20 }}>
          <p style={{ color: '#065F46', fontWeight: 600 }}>Connection restored.</p>
        </div>
      )}

      {/* Multi-tab Sync Banner (SETTINGS-204) */}
      {tabSyncNotice && (
        <div className="security-alert-box" style={{ background: '#EFF6FF', borderColor: '#93C5FD', marginBottom: 20 }}>
          <p style={{ color: '#1E40AF', fontWeight: 600 }}>{tabSyncNotice}</p>
        </div>
      )}

      {/* Navigation Tabs (SETTINGS-003, SETTINGS-011, SETTINGS-047, SETTINGS-088, SETTINGS-122, SETTINGS-126, SETTINGS-141, SETTINGS-159, SETTINGS-166, SETTINGS-176, SETTINGS-180, SETTINGS-209) */}
      <div className="settings-tabs">
        <button className={`tab-btn ${activeTab === 'profile' ? 'active' : ''}`} onClick={() => handleTabChange('profile')}>
          Profile
        </button>
        <button className={`tab-btn ${activeTab === 'account' ? 'active' : ''}`} onClick={() => handleTabChange('account')}>
          Account
        </button>
        <button className={`tab-btn ${activeTab === 'security' ? 'active' : ''}`} onClick={() => handleTabChange('security')}>
          Security
        </button>
        <button className={`tab-btn ${activeTab === 'notifications' ? 'active' : ''}`} onClick={() => handleTabChange('notifications')}>
          Notifications
        </button>
        <button className={`tab-btn ${activeTab === 'privacy' ? 'active' : ''}`} onClick={() => handleTabChange('privacy')}>
          Privacy
        </button>
        <button className={`tab-btn ${activeTab === 'preferences' ? 'active' : ''}`} onClick={() => handleTabChange('preferences')}>
          Preferences
        </button>
        <button className={`tab-btn ${activeTab === 'addresses' ? 'active' : ''}`} onClick={() => handleTabChange('addresses')}>
          Saved Addresses
        </button>
        <button className={`tab-btn ${activeTab === 'payments' ? 'active' : ''}`} onClick={() => handleTabChange('payments')}>
          Payments
        </button>
        <button className={`tab-btn ${activeTab === 'support' ? 'active' : ''}`} onClick={() => handleTabChange('support')}>
          Help & Support
        </button>
        <button className={`tab-btn ${activeTab === 'billing' ? 'active' : ''}`} onClick={() => handleTabChange('billing')}>
          Subscription & Billing
        </button>
        <button className={`tab-btn ${activeTab === 'legal' ? 'active' : ''}`} onClick={() => handleTabChange('legal')}>
          Legal
        </button>
        <button className={`tab-btn ${activeTab === 'about' ? 'active' : ''}`} onClick={() => handleTabChange('about')}>
          About
        </button>
        <button className="tab-btn" style={{ color: '#DC2626', marginLeft: 'auto' }} onClick={handleLogoutClick}>
          Log out
        </button>
      </div>

      {/* ========================================================= */}
      {/* TAB 1: PROFILE MODULE (SETTINGS-011 to SETTINGS-046)      */}
      {/* ========================================================= */}
      {activeTab === 'profile' && (
        <div className="settings-section-card">
          <div className="section-header-flex">
            <div>
              <h2 className="section-title">{isEditing ? 'Update your information.' : 'Your profile'}</h2>
              <p className="section-subtitle">
                {isEditing ? 'Edit your personal details, handle, and bio below.' : 'View and manage your personal profile information.'}
              </p>
            </div>
            {!isEditing ? (
              <button className="btn-secondary" onClick={() => setIsEditing(true)}>Edit Profile</button>
            ) : (
              <div style={{ display: 'flex', gap: '12px' }}>
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => {
                    if (hasUnsavedChanges()) {
                      setPendingTabSwitch('CANCEL_EDIT');
                      setShowUnsavedModal(true);
                    } else {
                      setIsEditing(false);
                      populateFormData(userProfile);
                    }
                  }}
                >
                  Cancel
                </button>
                <button type="button" className="btn-primary" onClick={handleSaveClick}>Save Changes</button>
              </div>
            )}
          </div>

          <div className="form-grid-full" style={{ marginBottom: 28 }}>
            <label className="form-label" style={{ marginBottom: 12, display: 'block' }}>Profile Photo</label>
            <div className="photo-upload-wrapper">
              <div className="avatar-container">
                {userProfile?.profileImage ? (
                  <img src={userProfile.profileImage} alt="Avatar" className="profile-avatar-img" />
                ) : (
                  <span className="avatar-placeholder">{(userProfile?.name || 'U').charAt(0).toUpperCase()}</span>
                )}
              </div>
              <div className="photo-actions">
                <label className="btn-secondary" style={{ cursor: 'pointer' }}>
                  Upload profile photo
                  <input type="file" accept="image/*" onChange={handlePhotoSelect} style={{ display: 'none' }} />
                </label>
                {userProfile?.profileImage && (
                  <button type="button" className="btn-secondary" style={{ color: '#EF4444', borderColor: '#FCA5A5' }} onClick={() => setShowRemovePhotoModal(true)}>
                    Remove Photo
                  </button>
                )}
              </div>
            </div>
          </div>

          <form onSubmit={handleSaveClick}>
            <div className="form-grid">
              <div className="form-group">
                <label className="form-label">First name *</label>
                <input type="text" className={`form-input ${errors.firstName ? 'has-error' : ''}`} value={formData.firstName} disabled={!isEditing} onChange={(e) => handleChange('firstName', e.target.value)} placeholder="Enter first name" />
                {errors.firstName && <span className="inline-error">{errors.firstName}</span>}
              </div>

              <div className="form-group">
                <label className="form-label">Last name *</label>
                <input type="text" className={`form-input ${errors.lastName ? 'has-error' : ''}`} value={formData.lastName} disabled={!isEditing} onChange={(e) => handleChange('lastName', e.target.value)} placeholder="Enter last name" />
                {errors.lastName && <span className="inline-error">{errors.lastName}</span>}
              </div>

              <div className="form-group">
                <label className="form-label">Display name</label>
                <input type="text" className="form-input" value={formData.displayName} disabled={!isEditing} onChange={(e) => handleChange('displayName', e.target.value)} placeholder="Enter display name" />
              </div>

              <div className="form-group">
                <label className="form-label">Username</label>
                <input type="text" className={`form-input ${errors.username ? 'has-error' : ''}`} value={formData.username} disabled={!isEditing} onChange={(e) => handleChange('username', e.target.value)} placeholder="Enter username" />
                {errors.username && <span className="inline-error">{errors.username}</span>}
              </div>

              <div className="form-group">
                <label className="form-label">Email address</label>
                <div className="input-with-action">
                  <input type="email" className="form-input read-only" value={userProfile?.email || ''} disabled />
                  <button type="button" className="btn-secondary" onClick={openChangeEmailModal} style={{ whiteSpace: 'nowrap' }}>Change email</button>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Mobile number</label>
                <div className="input-with-action">
                  <input type="text" className="form-input read-only" value={userProfile?.phone || 'Not provided'} disabled />
                  <button type="button" className="btn-secondary" onClick={openChangeMobileModal} style={{ whiteSpace: 'nowrap' }}>Change mobile number</button>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Date of birth</label>
                <input type="date" className={`form-input ${errors.dob ? 'has-error' : ''}`} value={formData.dob} disabled={!isEditing} onChange={(e) => handleChange('dob', e.target.value)} />
                {errors.dob && <span className="inline-error">{errors.dob}</span>}
              </div>

              <div className="form-group">
                <label className="form-label">Select gender</label>
                <select className="form-select" value={formData.gender} disabled={!isEditing} onChange={(e) => handleChange('gender', e.target.value)}>
                  <option value="">Select gender</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                  <option value="Prefer not to say">Prefer not to say</option>
                </select>
              </div>

              <div className="form-group form-grid-full">
                <label className="form-label">Bio</label>
                <textarea className={`form-textarea ${errors.bio ? 'has-error' : ''}`} rows={3} value={formData.bio} disabled={!isEditing} onChange={(e) => handleChange('bio', e.target.value)} placeholder="Tell us a little bit about yourself" maxLength={150} />
                <div className="char-counter">{formData.bio.length} / 150</div>
                {errors.bio && <span className="inline-error">{errors.bio}</span>}
              </div>
            </div>
          </form>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 2: ACCOUNT MODULE (SETTINGS-047 to SETTINGS-087)      */}
      {/* ========================================================= */}
      {activeTab === 'account' && (
        <div>
          <div className="settings-section-card">
            <h2 className="section-title" style={{ marginBottom: 6 }}>Account Information</h2>
            <p className="section-subtitle" style={{ marginBottom: 24 }}>View read-only account credentials and manage security identifiers.</p>
            <div className="form-grid">
              <div className="form-group">
                <label className="form-label">Account ID</label>
                <input type="text" className="form-input read-only" value={userProfile?._id || ''} disabled />
              </div>
              <div className="form-group">
                <label className="form-label">Account created on</label>
                <input type="text" className="form-input read-only" value={userProfile?.createdAt ? new Date(userProfile.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : 'N/A'} disabled />
              </div>
            </div>
          </div>

          <div className="settings-section-card">
            <h2 className="section-title" style={{ marginBottom: 6 }}>Deactivate Account</h2>
            <p className="section-subtitle" style={{ marginBottom: 16 }}>Deactivating hides your profile and content. You can reactivate anytime by logging back in.</p>
            <button className="btn-warning" onClick={() => { setDeactivatePassword(''); setDeactivateError(''); setShowDeactivateModal(true); }}>Deactivate Account</button>
          </div>

          <div className="settings-section-card" style={{ borderColor: '#FCA5A5', background: '#FFF5F5' }}>
            <h2 className="section-title" style={{ color: '#991B1B', marginBottom: 6 }}>Delete Account</h2>
            <p style={{ color: '#791E1E', fontSize: 14, marginBottom: 20 }}>Deleting your account is permanent. All your data, orders, and wishlist items will be permanently removed.</p>
            <button className="btn-danger" onClick={openDeleteAccountModal}>Delete Account</button>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 3: SECURITY MODULE (SETTINGS-088 to SETTINGS-118)     */}
      {/* ========================================================= */}
      {activeTab === 'security' && (
        <div>
          {securityApiError ? (
            <div className="error-alert-box">
              <h3>Security Settings</h3>
              <p>{securityApiError}</p>
              <button className="btn-primary" onClick={fetchSecurityData}>Retry</button>
            </div>
          ) : (
            <>
              <div className="settings-section-card">
                <h2 className="section-title" style={{ marginBottom: 6 }}>
                  {userProfile?.password ? 'Change your password.' : 'Set a password to enable email/mobile sign-in.'}
                </h2>
                <p className="section-subtitle" style={{ marginBottom: 24 }}>Ensure your account is using a strong, unique password.</p>
                <form onSubmit={handlePasswordSubmit}>
                  <div className="form-grid">
                    {userProfile?.password && (
                      <div className="form-group form-grid-full">
                        <label className="form-label">Current password *</label>
                        <div className="password-input-wrapper">
                          <input type={showCurrentPass ? 'text' : 'password'} className={`form-input ${passwordErrors.currentPassword ? 'has-error' : ''}`} value={passwordData.currentPassword} onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })} placeholder="Enter current password" />
                          <button type="button" className="toggle-eye-btn" onClick={() => setShowCurrentPass(!showCurrentPass)}>
                            {showCurrentPass ? <FiEyeOff /> : <FiEye />}
                          </button>
                        </div>
                        {passwordErrors.currentPassword && <span className="inline-error">{passwordErrors.currentPassword}</span>}
                      </div>
                    )}
                    <div className="form-group">
                      <label className="form-label">New password *</label>
                      <div className="password-input-wrapper">
                        <input type={showNewPass ? 'text' : 'password'} className={`form-input ${passwordErrors.newPassword ? 'has-error' : ''}`} value={passwordData.newPassword} onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })} placeholder="Enter new password" />
                        <button type="button" className="toggle-eye-btn" onClick={() => setShowNewPass(!showNewPass)}>
                          {showNewPass ? <FiEyeOff /> : <FiEye />}
                        </button>
                      </div>
                      {passwordData.newPassword && (
                        <div className="strength-meter">
                          <div className="strength-bar-bg">
                            <div className="strength-bar-fill" style={{ width: `${getPasswordStrength(passwordData.newPassword).score}%`, backgroundColor: getPasswordStrength(passwordData.newPassword).color }} />
                          </div>
                          <span className="strength-text" style={{ color: getPasswordStrength(passwordData.newPassword).color }}>Password strength: {getPasswordStrength(passwordData.newPassword).label}</span>
                        </div>
                      )}
                      {passwordErrors.newPassword && <span className="inline-error">{passwordErrors.newPassword}</span>}
                    </div>

                    <div className="form-group">
                      <label className="form-label">Confirm new password *</label>
                      <div className="password-input-wrapper">
                        <input type={showConfirmPass ? 'text' : 'password'} className={`form-input ${passwordErrors.confirmPassword ? 'has-error' : ''}`} value={passwordData.confirmPassword} onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })} placeholder="Confirm new password" />
                        <button type="button" className="toggle-eye-btn" onClick={() => setShowConfirmPass(!showConfirmPass)}>
                          {showConfirmPass ? <FiEyeOff /> : <FiEye />}
                        </button>
                      </div>
                      {passwordErrors.confirmPassword && <span className="inline-error">{passwordErrors.confirmPassword}</span>}
                    </div>
                  </div>
                  <div style={{ marginTop: 24 }}>
                    <button type="submit" className="btn-primary" disabled={isUpdatingPassword}>
                      {isUpdatingPassword ? 'Updating your password…' : (userProfile?.password ? 'Update Password' : 'Set Password')}
                    </button>
                  </div>
                </form>
              </div>

              <div className="settings-section-card">
                <div className="section-header-flex">
                  <div>
                    <h2 className="section-title">Active sessions</h2>
                    <p className="section-subtitle">Devices currently signed in to your account.</p>
                  </div>
                  {sessions.length > 1 && <button className="btn-secondary" onClick={() => setShowLogoutAllModal(true)}>Sign out of all other devices</button>}
                </div>
                {loadingSessions ? (
                  <div className="spinner-overlay"><div className="spinner" /><p style={{ color: '#64748B' }}>Loading your sessions…</p></div>
                ) : (
                  <div className="sessions-list">
                    {sessions.map((sess) => (
                      <div className="session-item" key={sess.sessionId}>
                        <div className="session-device-info">
                          <h4>{sess.device} {sess.isCurrent && <span className="badge-current-device">This device</span>}</h4>
                          <p>IP: {sess.ip} • {sess.location}</p>
                          <p style={{ fontSize: 12, color: '#94A3B8' }}>Session details. Last active: {new Date(sess.lastActive).toLocaleString()}</p>
                        </div>
                        {!sess.isCurrent && <button className="btn-secondary" onClick={() => { setTargetLogoutSessionId(sess.sessionId); setShowLogoutSessionModal(true); }}>Sign out</button>}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="settings-section-card">
                <div className="section-header-flex">
                  <div>
                    <h2 className="section-title">Recovery Codes</h2>
                    <p className="section-subtitle">Use recovery codes to access your account if you lose your phone or 2FA method.</p>
                  </div>
                  <div style={{ display: 'flex', gap: 12 }}>
                    <button className="btn-secondary" onClick={handleCopyRecoveryCodes}>Copy Codes</button>
                    <button className="btn-secondary" onClick={() => setShowRegenerateCodesModal(true)}>Regenerate Codes</button>
                  </div>
                </div>
                {recoveryCodes.length === 0 ? (
                  <div className="security-alert-box" style={{ background: '#FEF2F2', borderColor: '#FCA5A5' }}>
                    <p style={{ color: '#991B1B' }}>You have no recovery codes left. Generate new ones to stay protected.</p>
                  </div>
                ) : (
                  <div className="recovery-codes-grid">
                    {recoveryCodes.map((codeObj, idx) => (
                      <div className="code-pill" key={idx}>{typeof codeObj === 'string' ? codeObj : codeObj.code}</div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 4: NOTIFICATIONS MODULE (SETTINGS-119 to SETTINGS-121) */}
      {/* ========================================================= */}
      {activeTab === 'notifications' && (
        <div className="settings-section-card">
          <h2 className="section-title" style={{ marginBottom: 6 }}>Notifications</h2>
          <p className="section-subtitle" style={{ marginBottom: 24 }}>Manage how and when you receive order & delivery updates.</p>

          {notificationsBlocked && (
            <div className="security-alert-box" style={{ background: '#FEF2F2', borderColor: '#FCA5A5', marginBottom: 24 }}>
              <div>
                <p style={{ color: '#991B1B', fontWeight: 700 }}>Notifications are blocked.</p>
                <p style={{ color: '#791E1E', fontSize: 13 }}>Please enable notifications in your browser or device settings.</p>
              </div>
              <button className="btn-secondary" style={{ background: '#FFF' }} onClick={() => Notification.requestPermission().then(checkNotificationPermission)}>Enable</button>
            </div>
          )}

          <div className="toggle-row">
            <div className="toggle-info">
              <h4>Order updates</h4>
              <p>Receive immediate alerts regarding your order status and receipts.</p>
            </div>
            <label className="switch">
              <input type="checkbox" checked={notificationState.orderUpdates} onChange={(e) => handleNotificationToggle('orderUpdates', e.target.checked)} />
              <span className="slider" />
            </label>
          </div>

          <div className="toggle-row">
            <div className="toggle-info">
              <h4>Delivery updates</h4>
              <p>Receive live tracking and shipment notifications.</p>
            </div>
            <label className="switch">
              <input type="checkbox" checked={notificationState.deliveryUpdates} onChange={(e) => handleNotificationToggle('deliveryUpdates', e.target.checked)} />
              <span className="slider" />
            </label>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 5: PRIVACY MODULE (SETTINGS-122 to SETTINGS-125)       */}
      {/* ========================================================= */}
      {activeTab === 'privacy' && (
        <div className="settings-section-card">
          <h2 className="section-title" style={{ marginBottom: 6 }}>Privacy</h2>
          <p className="section-subtitle" style={{ marginBottom: 24 }}>Control your profile visibility and data personalization.</p>

          <div className="toggle-row">
            <div className="toggle-info">
              <h4>Profile visibility</h4>
              <p>Allow other members to view your public profile card.</p>
            </div>
            <label className="switch">
              <input type="checkbox" checked={privacyState.profileVisibility} onChange={(e) => handlePrivacyToggle('profileVisibility', e.target.checked)} />
              <span className="slider" />
            </label>
          </div>

          <div className="toggle-row">
            <div className="toggle-info">
              <h4>Activity visibility</h4>
              <p>Show your online status and active browsing badges.</p>
            </div>
            <label className="switch">
              <input type="checkbox" checked={privacyState.activityVisibility} onChange={(e) => handlePrivacyToggle('activityVisibility', e.target.checked)} />
              <span className="slider" />
            </label>
          </div>

          <div className="toggle-row">
            <div className="toggle-info">
              <h4>Personalized recommendations</h4>
              <p>Receive tailored jewellery product suggestions based on your history.</p>
            </div>
            <label className="switch">
              <input type="checkbox" checked={privacyState.personalizedRecommendations} onChange={(e) => handlePrivacyToggle('personalizedRecommendations', e.target.checked)} />
              <span className="slider" />
            </label>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 6: PREFERENCES MODULE (SETTINGS-126 to SETTINGS-140)   */}
      {/* ========================================================= */}
      {activeTab === 'preferences' && (
        <div>
          {/* Language & Region Card (SETTINGS-127 to SETTINGS-132) */}
          <div className="settings-section-card">
            <h2 className="section-title" style={{ marginBottom: 6 }}>Preferences</h2>
            <p className="section-subtitle" style={{ marginBottom: 24 }}>Select your language, region, and local settings.</p>

            <div className="form-grid">
              {/* Language Dropdown & Search (SETTINGS-127 to SETTINGS-131) */}
              <div className="form-group">
                <label className="form-label">Select your language.</label>
                <input type="text" className="form-input" style={{ marginBottom: 8 }} placeholder="Search language" value={languageSearch} onChange={(e) => setLanguageSearch(e.target.value)} />
                <select className="form-select" value={prefLanguage} onChange={(e) => handleApplyLanguage(e.target.value)}>
                  {filteredLanguages.map((lang) => (
                    <option key={lang.code} value={lang.name}>{lang.name}</option>
                  ))}
                </select>
              </div>

              {/* Country / Region Dropdown (SETTINGS-132) */}
              <div className="form-group">
                <label className="form-label">Select your region.</label>
                <select className="form-select" value={prefRegion} onChange={(e) => handleRegionChange(e.target.value)}>
                  <option value="India">India</option>
                  <option value="United States">United States</option>
                  <option value="United Kingdom">United Kingdom</option>
                  <option value="Canada">Canada</option>
                  <option value="Australia">Australia</option>
                  <option value="United Arab Emirates">United Arab Emirates</option>
                  <option value="Germany">Germany</option>
                  <option value="France">France</option>
                </select>
              </div>
            </div>
          </div>

          {/* Appearance Settings Card (SETTINGS-133 to SETTINGS-138) */}
          <div className="settings-section-card">
            <h2 className="section-title" style={{ marginBottom: 6 }}>Appearance</h2>
            <p className="section-subtitle" style={{ marginBottom: 16 }}>Choose your preferred color theme for the interface.</p>
            <div className="theme-cards-grid">
              <div className={`theme-card ${prefTheme === 'light' ? 'selected' : ''}`} onClick={() => handleThemeChange('light')}>
                <div className="theme-preview-box light-preview">Light Mode</div>
                <span className="form-label">Light</span>
              </div>
              <div className={`theme-card ${prefTheme === 'dark' ? 'selected' : ''}`} onClick={() => handleThemeChange('dark')}>
                <div className="theme-preview-box dark-preview">Dark Mode</div>
                <span className="form-label">Dark</span>
              </div>
              <div className={`theme-card ${prefTheme === 'system' ? 'selected' : ''}`} onClick={() => handleThemeChange('system')}>
                <div className="theme-preview-box system-preview">Auto</div>
                <span className="form-label">Use device settings</span>
              </div>
            </div>
          </div>

          {/* Text Size Card (SETTINGS-139) */}
          <div className="settings-section-card">
            <h2 className="section-title" style={{ marginBottom: 6 }}>Text Size</h2>
            <p className="section-subtitle" style={{ marginBottom: 16 }}>Adjust the text size.</p>
            <div className="form-group" style={{ maxWidth: 400 }}>
              <input type="range" min={80} max={130} value={prefTextSize} onChange={(e) => setPrefTextSize(Number(e.target.value))} style={{ cursor: 'pointer' }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: '#64748B' }}>
                <span>Small (80%)</span>
                <span>Normal ({prefTextSize}%)</span>
                <span>Large (130%)</span>
              </div>
              <div style={{ marginTop: 16, padding: 12, border: '1px solid #CBD5E1', borderRadius: 8, fontSize: `${(15 * prefTextSize) / 100}px` }}>
                Preview: Elora Fine Jewellery — Timeless Gold & Diamond Collection
              </div>
            </div>
          </div>

          {/* Date & Time Format Card (SETTINGS-140) */}
          <div className="settings-section-card">
            <h2 className="section-title" style={{ marginBottom: 6 }}>Date & Time Format</h2>
            <p className="section-subtitle" style={{ marginBottom: 16 }}>Choose your preferred date and time format.</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {['DD/MM/YYYY', 'MM/DD/YYYY', 'YYYY-MM-DD'].map((fmt) => (
                <label key={fmt} style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', fontSize: 15 }}>
                  <input type="radio" name="dateTimeFormat" checked={prefDateTimeFormat === fmt} onChange={() => setPrefDateTimeFormat(fmt)} />
                  {fmt} (e.g. {new Date().toLocaleDateString()})
                </label>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 7: SAVED ADDRESSES MODULE (SETTINGS-141 to SETTINGS-158)*/}
      {/* ========================================================= */}
      {activeTab === 'addresses' && (
        <div className="settings-section-card">
          <div className="section-header-flex">
            <div>
              <h2 className="section-title">Saved Addresses</h2>
              <p className="section-subtitle">Manage your shipping and billing delivery addresses.</p>
            </div>
            <button className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: 8 }} onClick={() => handleOpenAddressModal(null)}>
              <FiPlus /> Add Address
            </button>
          </div>

          {loadingAddresses ? (
            <div className="spinner-overlay"><div className="spinner" /><p style={{ color: '#64748B' }}>Loading saved addresses…</p></div>
          ) : addresses.length === 0 ? (
            <div className="empty-address-state">
              <h3>You have no saved addresses.</h3>
              <button className="btn-primary" onClick={() => handleOpenAddressModal(null)}>Add a new address.</button>
            </div>
          ) : (
            <div className="address-cards-grid">
              {addresses.map((addr) => (
                <div key={addr._id} className={`address-card ${addr.isDefault ? 'default-card' : ''}`}>
                  <div>
                    <div className="address-header-flex">
                      <span className="address-name">{addr.fullName}</span>
                      {addr.isDefault && <span className="badge-default-addr">Default</span>}
                    </div>
                    <div className="address-details">
                      <p>{addr.house} {addr.street}</p>
                      <p>{addr.city}, {addr.state} - {addr.pinCode}</p>
                      <p>{addr.country}</p>
                      <p style={{ marginTop: 8, fontWeight: 500 }}>Mobile: {addr.phone}</p>
                    </div>
                  </div>
                  <div className="address-card-actions">
                    <button className="btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: 6 }} onClick={() => handleOpenAddressModal(addr)}>
                      <FiEdit2 /> Edit
                    </button>
                    <button className="btn-secondary" style={{ color: '#EF4444', borderColor: '#FCA5A5', display: 'flex', alignItems: 'center', gap: 6 }} onClick={() => { setTargetDeleteAddress(addr); setShowDeleteAddressModal(true); }}>
                      <FiTrash2 /> Delete address
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 8: PAYMENTS MODULE (SETTINGS-159 to SETTINGS-165)     */}
      {/* ========================================================= */}
      {activeTab === 'payments' && (
        <div className="settings-section-card">
          <div className="section-header-flex">
            <div>
              <h2 className="section-title">Payment Settings</h2>
              <p className="section-subtitle">Saved payment methods</p>
            </div>
            <button className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: 8 }} onClick={() => setShowAddCardModal(true)}>
              <FiPlus /> Add Payment Method
            </button>
          </div>

          {loadingPayments ? (
            <div className="spinner-overlay"><div className="spinner" /><p style={{ color: '#64748B' }}>Loading payment methods…</p></div>
          ) : paymentMethods.length === 0 ? (
            <div className="empty-address-state">
              <h3>No saved payment methods.</h3>
              <button className="btn-primary" onClick={() => setShowAddCardModal(true)}>Add Payment Method</button>
            </div>
          ) : (
            <div className="address-cards-grid">
              {paymentMethods.map((pm) => (
                <div key={pm.paymentMethodId || pm._id} className={`address-card ${pm.isDefault ? 'default-card' : ''}`}>
                  <div>
                    <div className="address-header-flex">
                      <span className="address-name" style={{ fontWeight: 700, fontSize: 16 }}>
                        {pm.cardBrand || 'Card'} •••• {pm.last4 || '4242'}
                      </span>
                      {pm.isDefault && <span className="badge-default-addr">Default payment method</span>}
                    </div>
                    <div className="address-details" style={{ marginTop: 8 }}>
                      <p>Expires: {pm.expMonth}/{pm.expYear}</p>
                      {pm.nameOnCard && <p style={{ fontSize: 13, color: '#64748B' }}>Name: {pm.nameOnCard}</p>}
                    </div>
                  </div>
                  <div className="address-card-actions">
                    <button
                      className="btn-secondary"
                      style={{ color: '#EF4444', borderColor: '#FCA5A5', display: 'flex', alignItems: 'center', gap: 6 }}
                      onClick={() => { setTargetRemoveCard(pm); setShowRemoveCardModal(true); }}
                    >
                      <FiTrash2 /> Remove payment method
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 9: HELP & SUPPORT MODULE (SETTINGS-166 to SETTINGS-175)*/}
      {/* ========================================================= */}
      {activeTab === 'support' && (
        <div className="settings-section-card">
          <div className="section-header-flex">
            <div>
              <h2 className="section-title">Help & Support</h2>
              <p className="section-subtitle">Find answers to FAQs or contact our support team.</p>
            </div>
            <div style={{ display: 'flex', gap: 12 }}>
              <button
                className={`btn-secondary ${supportTabMode === 'main' ? 'active' : ''}`}
                onClick={() => setSupportTabMode('main')}
              >
                Frequently Asked Questions
              </button>
              <button
                className={`btn-primary ${supportTabMode === 'contact' ? 'active' : ''}`}
                onClick={() => setSupportTabMode('contact')}
              >
                Contact Support
              </button>
            </div>
          </div>

          {supportTabMode === 'contact' ? (
            <div style={{ marginTop: 16 }}>
              <h3 style={{ fontSize: 18, fontWeight: 700, color: '#1E293B', marginBottom: 4 }}>Tell us what went wrong.</h3>
              <p className="section-subtitle" style={{ marginBottom: 20 }}>Describe your issue and we'll get back to you.</p>

              <form onSubmit={handleSupportSubmit}>
                <div className="form-group" style={{ marginBottom: 16 }}>
                  <label className="form-label">Subject</label>
                  <input
                    type="text"
                    className="form-input"
                    value={supportFormData.subject}
                    onChange={(e) => setSupportFormData({ ...supportFormData, subject: e.target.value })}
                    placeholder="Brief description of your issue"
                  />
                </div>

                <div className="form-group" style={{ marginBottom: 16 }}>
                  <label className="form-label">Message *</label>
                  <textarea
                    className={`form-input ${supportFormErrors.message ? 'has-error' : ''}`}
                    rows={5}
                    value={supportFormData.message}
                    onChange={(e) => {
                      setSupportFormData({ ...supportFormData, message: e.target.value });
                      if (e.target.value.trim()) setSupportFormErrors((prev) => ({ ...prev, message: '' }));
                    }}
                    placeholder="Tell us what went wrong."
                  />
                  {supportFormErrors.message && <span className="inline-error">{supportFormErrors.message}</span>}
                </div>

                <div className="form-group" style={{ marginBottom: 24 }}>
                  <label className="form-label">Attachment (Optional, under 10MB)</label>
                  <input type="file" onChange={handleSupportAttachment} accept="image/*,.pdf,.doc,.docx" />
                  {supportFormErrors.attachment && (
                    <div style={{ marginTop: 8 }}>
                      <span className="inline-error" style={{ display: 'block', marginBottom: 6 }}>{supportFormErrors.attachment}</span>
                      <label className="btn-secondary" style={{ display: 'inline-block', cursor: 'pointer', padding: '4px 12px', fontSize: 13 }}>
                        Choose Again
                        <input type="file" onChange={handleSupportAttachment} style={{ display: 'none' }} />
                      </label>
                    </div>
                  )}
                  {supportFormData.attachment && !supportFormErrors.attachment && (
                    <p style={{ fontSize: 13, color: '#059669', marginTop: 6 }}>Selected: {supportFormData.attachment.name}</p>
                  )}
                </div>

                <div style={{ display: 'flex', gap: 12 }}>
                  <button type="button" className="btn-secondary" onClick={() => setSupportTabMode('main')}>Cancel</button>
                  <button type="submit" className="btn-primary" disabled={isSubmittingSupport}>
                    {isSubmittingSupport ? 'Submitting…' : 'Submit Request'}
                  </button>
                </div>
              </form>
            </div>
          ) : (
            <div style={{ marginTop: 16 }}>
              <div className="form-group" style={{ marginBottom: 24, maxWidth: 500 }}>
                <input
                  type="text"
                  className="form-input"
                  value={faqSearchQuery}
                  onChange={(e) => setFaqSearchQuery(e.target.value)}
                  placeholder="Search language or FAQs..."
                />
              </div>

              {filteredFaqs.length === 0 ? (
                <div className="empty-address-state">
                  <h3>No results found for "{faqSearchQuery}".</h3>
                  <button className="btn-primary" onClick={() => setSupportTabMode('contact')}>Contact Support</button>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  {filteredFaqs.map((faq) => (
                    <div key={faq.id} style={{ border: '1px solid #E2E8F0', borderRadius: 12, padding: 16, background: '#F8FAFC' }}>
                      <h4 style={{ fontSize: 16, fontWeight: 700, color: '#1E293B', margin: '0 0 8px 0' }}>{faq.question}</h4>
                      <p style={{ fontSize: 14, color: '#475569', margin: 0, lineHeight: 1.6 }}>{faq.answer}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 10: SUBSCRIPTION & BILLING (SETTINGS-209 to SETTINGS-223) */}
      {/* ========================================================= */}
      {activeTab === 'billing' && (
        <div className="settings-section-card">
          <div className="section-header-flex">
            <div>
              <h2 className="section-title">Subscription & Billing</h2>
              <p className="section-subtitle">Manage your subscription and billing details.</p>
            </div>
          </div>

          <div style={{ background: 'linear-gradient(135deg, #1E293B 0%, #0F172A 100%)', color: '#FFF', borderRadius: 16, padding: 24, marginBottom: 32 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <div>
                <span style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: '1px', background: '#D4AF37', color: '#FFF', padding: '2px 8px', borderRadius: 10, fontWeight: 700 }}>
                  {isPremium ? 'Active Membership' : 'Free Member'}
                </span>
                <h3 style={{ fontSize: 24, fontWeight: 700, margin: '8px 0 0 0' }}>
                  {isPremium ? 'Gold VIP Membership' : 'Standard Plan'}
                </h3>
              </div>
              <div>
                {isPremium ? (
                  <button className="btn-secondary" style={{ background: 'transparent', color: '#FCA5A5', borderColor: '#EF4444' }} onClick={() => setShowCancelSubModal(true)}>
                    Cancel Plan
                  </button>
                ) : (
                  <button className="btn-primary" style={{ background: '#D4AF37', color: '#FFF', border: 'none' }} onClick={() => { setTargetUpgradePlan({ name: 'Gold VIP', price: '$49' }); setShowUpgradeModal(true); }}>
                    Upgrade Plan
                  </button>
                )}
              </div>
            </div>
            <p style={{ color: '#94A3B8', fontSize: 14, margin: 0 }}>
              {isPremium
                ? `Your subscription renews automatically on ${billingDetails?.expiryDate || 'next month'}.`
                : 'Upgrade to access exclusive jewellery discounts, free priority insured shipping, and 24/7 personal shopper service.'}
            </p>
          </div>

          <div style={{ marginBottom: 32 }}>
            <h3 style={{ fontSize: 18, fontWeight: 700, color: '#1E293B', marginBottom: 6 }}>Choose the plan that's right for you.</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 20, marginTop: 16 }}>
              <div style={{ border: '1px solid #E2E8F0', borderRadius: 12, padding: 20, background: '#FFF' }}>
                <h4 style={{ fontSize: 18, fontWeight: 700, margin: 0 }}>Standard</h4>
                <p style={{ fontSize: 24, fontWeight: 800, color: '#1E293B', margin: '8px 0' }}>Free</p>
                <ul style={{ paddingLeft: 18, fontSize: 14, color: '#64748B', lineHeight: 1.8 }}>
                  <li>Standard Shipping</li>
                  <li>Basic Support</li>
                  <li>Standard Warranty</li>
                </ul>
              </div>

              <div style={{ border: '2px solid #D4AF37', borderRadius: 12, padding: 20, background: '#FFFDF9', position: 'relative' }}>
                <span style={{ position: 'absolute', top: -12, right: 16, background: '#D4AF37', color: '#FFF', fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 10 }}>RECOMMENDED</span>
                <h4 style={{ fontSize: 18, fontWeight: 700, margin: 0 }}>Gold VIP</h4>
                <p style={{ fontSize: 24, fontWeight: 800, color: '#D4AF37', margin: '8px 0' }}>$49/mo</p>
                <ul style={{ paddingLeft: 18, fontSize: 14, color: '#475569', lineHeight: 1.8 }}>
                  <li>Free Insured Priority Shipping</li>
                  <li>Exclusive Member Discounts</li>
                  <li>24/7 Personal Shopper Service</li>
                  <li>Lifetime Complimentary Jewelry Polish</li>
                </ul>
                <button className="btn-primary" style={{ width: '100%', marginTop: 16 }} onClick={() => { setTargetUpgradePlan({ name: 'Gold VIP', price: '$49' }); setShowUpgradeModal(true); }}>
                  Select Plan
                </button>
              </div>
            </div>
          </div>

          <div>
            <h3 style={{ fontSize: 18, fontWeight: 700, color: '#1E293B', marginBottom: 6 }}>View your past invoices and receipts.</h3>
            <div className="table-container" style={{ marginTop: 16 }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 14 }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid #E2E8F0', color: '#64748B' }}>
                    <th style={{ padding: '12px 16px' }}>Invoice ID</th>
                    <th style={{ padding: '12px 16px' }}>Date</th>
                    <th style={{ padding: '12px 16px' }}>Amount</th>
                    <th style={{ padding: '12px 16px' }}>Status</th>
                    <th style={{ padding: '12px 16px', textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {(billingDetails?.invoices || [
                    { id: 'INV-2026-001', date: '2026-09-01', amount: '$49.00', status: 'Paid' },
                    { id: 'INV-2026-002', date: '2026-08-01', amount: '$49.00', status: 'Paid' }
                  ]).map((inv) => (
                    <tr key={inv.id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                      <td style={{ padding: '12px 16px', fontWeight: 600 }}>{inv.id}</td>
                      <td style={{ padding: '12px 16px', color: '#64748B' }}>{inv.date}</td>
                      <td style={{ padding: '12px 16px', fontWeight: 600 }}>{inv.amount}</td>
                      <td style={{ padding: '12px 16px' }}>
                        <span style={{ background: '#D1FAE5', color: '#065F46', padding: '2px 8px', borderRadius: 10, fontSize: 12, fontWeight: 600 }}>{inv.status}</span>
                      </td>
                      <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                        <button className="btn-secondary" style={{ padding: '4px 12px', fontSize: 13 }} onClick={() => { setSelectedInvoice(inv); setShowInvoiceModal(true); }}>
                          Invoice details.
                        </button>
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
      {/* TAB 11: LEGAL (SETTINGS-176 to SETTINGS-179)              */}
      {/* ========================================================= */}
      {activeTab === 'legal' && (
        <div className="settings-section-card">
          <div className="section-header-flex" style={{ marginBottom: 20 }}>
            <div>
              <h2 className="section-title">Legal Documents</h2>
              <p className="section-subtitle">Review our terms, privacy, and store policies.</p>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 12, marginBottom: 24, borderBottom: '1px solid #E2E8F0', paddingBottom: 12 }}>
            {['terms', 'privacy', 'refund', 'shipping'].map((doc) => (
              <button
                key={doc}
                className={`btn-secondary ${legalDoc === doc ? 'active' : ''}`}
                onClick={() => setLegalDoc(doc)}
              >
                {doc === 'terms' && 'Terms of Service'}
                {doc === 'privacy' && 'Privacy Policy'}
                {doc === 'refund' && 'Refund Policy'}
                {doc === 'shipping' && 'Shipping Policy'}
              </button>
            ))}
          </div>

          <div style={{ fontSize: 14, color: '#334155', lineHeight: 1.8, maxWidth: 800 }}>
            {legalDoc === 'terms' && (
              <div>
                <h3 style={{ fontSize: 20, fontWeight: 700, marginBottom: 12 }}>Terms of Service</h3>
                <p>Welcome to Elora Fine Jewellery. By accessing or purchasing from our platform, you agree to comply with our general terms of service, authenticity standards, and customer conduct policies.</p>
              </div>
            )}
            {legalDoc === 'privacy' && (
              <div>
                <h3 style={{ fontSize: 20, fontWeight: 700, marginBottom: 12 }}>Privacy Policy</h3>
                <p>Your privacy is paramount to us. We encrypt all personal data, payment information, and transaction histories according to strict ISO 27001 and PCI-DSS compliance requirements.</p>
              </div>
            )}
            {legalDoc === 'refund' && (
              <div>
                <h3 style={{ fontSize: 20, fontWeight: 700, marginBottom: 12 }}>Refund Policy</h3>
                <p>We provide a 30-day money-back guarantee for unused and unaltered jewellery in original packaging accompanied by hallmark certificate.</p>
              </div>
            )}
            {legalDoc === 'shipping' && (
              <div>
                <h3 style={{ fontSize: 20, fontWeight: 700, marginBottom: 12 }}>Shipping Policy</h3>
                <p>All items are shipped via fully insured express delivery requiring signature verification upon delivery.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 12: ABOUT (SETTINGS-180 to SETTINGS-182)              */}
      {/* ========================================================= */}
      {activeTab === 'about' && (
        <div className="settings-section-card">
          <div className="section-header-flex">
            <div>
              <h2 className="section-title">About</h2>
              <p className="section-subtitle">Application details and system status.</p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 24, padding: '24px 0', borderBottom: '1px solid #E2E8F0' }}>
            <div style={{ width: 72, height: 72, borderRadius: 16, background: '#D4AF37', color: '#FFF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32, fontWeight: 800 }}>
              E
            </div>
            <div>
              <h3 style={{ fontSize: 20, fontWeight: 700, margin: '0 0 4px 0' }}>Elora Fine Jewellery</h3>
              <p style={{ margin: 0, color: '#64748B', fontSize: 14 }}>Version 2.4.0 (Build 2026.09)</p>
            </div>
          </div>

          <div style={{ marginTop: 24 }}>
            <div className="security-alert-box" style={{ background: '#EFF6FF', borderColor: '#93C5FD', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h4 style={{ fontSize: 16, fontWeight: 700, color: '#1E40AF', margin: '0 0 4px 0' }}>Application Update Available</h4>
                <p style={{ color: '#1E3A8A', margin: 0 }}>A new version of the app is available.</p>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button className="btn-secondary" style={{ padding: '6px 16px' }} onClick={() => toast.info('Update deferred.')}>Later</button>
                <button className="btn-primary" style={{ padding: '6px 16px' }} onClick={() => toast.success('Updating application…')}>Update Now</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODALS SECTION                                            */}
      {/* ========================================================= */}

      {/* Processing Spinner Overlay */}
      {isSaving && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ textAlign: 'center', maxWidth: 360 }}>
            <div className="spinner" style={{ margin: '0 auto 16px auto' }} />
            <h3 style={{ fontSize: 18, color: '#1E293B', margin: 0 }}>Updating your profile…</h3>
          </div>
        </div>
      )}

      {/* Address Form Modal (SETTINGS-143 to SETTINGS-154) */}
      {showAddressModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: 560 }}>
            <div className="modal-header">{editingAddressId ? 'Edit address' : 'Add a new address.'}</div>
            <form onSubmit={handleSaveAddress}>
              <div className="form-grid" style={{ gap: 16 }}>
                <div className="form-group form-grid-full">
                  <label className="form-label">Full name *</label>
                  <input type="text" className={`form-input ${addressFormErrors.fullName ? 'has-error' : ''}`} value={addressFormData.fullName} onChange={(e) => setAddressFormData({ ...addressFormData, fullName: e.target.value })} placeholder="Full name" />
                  {addressFormErrors.fullName && <span className="inline-error">{addressFormErrors.fullName}</span>}
                </div>

                <div className="form-group form-grid-full">
                  <label className="form-label">Address (House / Street / Flat) *</label>
                  <input type="text" className={`form-input ${addressFormErrors.house ? 'has-error' : ''}`} value={addressFormData.house} onChange={(e) => setAddressFormData({ ...addressFormData, house: e.target.value })} placeholder="Address Line 1" />
                  {addressFormErrors.house && <span className="inline-error">{addressFormErrors.house}</span>}
                </div>

                <div className="form-group">
                  <label className="form-label">City *</label>
                  <input type="text" className={`form-input ${addressFormErrors.city ? 'has-error' : ''}`} value={addressFormData.city} onChange={(e) => setAddressFormData({ ...addressFormData, city: e.target.value })} placeholder="City" />
                  {addressFormErrors.city && <span className="inline-error">{addressFormErrors.city}</span>}
                </div>

                <div className="form-group">
                  <label className="form-label">Select state. *</label>
                  <select className={`form-select ${addressFormErrors.state ? 'has-error' : ''}`} value={addressFormData.state} onChange={(e) => setAddressFormData({ ...addressFormData, state: e.target.value })}>
                    <option value="">Select state.</option>
                    {INDIAN_STATES.map((st) => (
                      <option key={st} value={st}>{st}</option>
                    ))}
                  </select>
                  {addressFormErrors.state && <span className="inline-error">{addressFormErrors.state}</span>}
                </div>

                <div className="form-group">
                  <label className="form-label">Postal code *</label>
                  <input type="text" className={`form-input ${addressFormErrors.pinCode ? 'has-error' : ''}`} value={addressFormData.pinCode} onChange={(e) => setAddressFormData({ ...addressFormData, pinCode: e.target.value })} placeholder="Postal code" />
                  {addressFormErrors.pinCode && <span className="inline-error">{addressFormErrors.pinCode}</span>}
                </div>

                <div className="form-group">
                  <label className="form-label">Mobile number *</label>
                  <input type="text" className={`form-input ${addressFormErrors.phone ? 'has-error' : ''}`} value={addressFormData.phone} onChange={(e) => setAddressFormData({ ...addressFormData, phone: e.target.value })} placeholder="Delivery contact number" />
                  {addressFormErrors.phone && <span className="inline-error">{addressFormErrors.phone}</span>}
                </div>

                <div className="form-group form-grid-full">
                  <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', fontSize: 14, marginTop: 8 }}>
                    <input type="checkbox" checked={addressFormData.isDefault} onChange={(e) => setAddressFormData({ ...addressFormData, isDefault: e.target.checked })} />
                    Set as default address
                  </label>
                </div>
              </div>

              <div className="modal-actions" style={{ marginTop: 24 }}>
                <button type="button" className="btn-secondary" onClick={() => setShowAddressModal(false)}>Cancel</button>
                <button type="submit" className="btn-primary" disabled={isSavingAddress}>
                  {isSavingAddress ? 'Saving address…' : 'Save Address'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Address Confirmation Modal (SETTINGS-156) */}
      {showDeleteAddressModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">Delete Address</div>
            <div className="modal-body">Are you sure you want to delete this address?</div>
            <div className="modal-actions">
              <button className="btn-secondary" onClick={() => setShowDeleteAddressModal(false)}>Cancel</button>
              <button className="btn-danger" onClick={confirmDeleteAddress}>Delete Address</button>
            </div>
          </div>
        </div>
      )}

      {/* Save Profile Confirmation Modal (SETTINGS-036) */}
      {showSaveModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">Save Profile</div>
            <div className="modal-body">Save your profile changes?</div>
            <div className="modal-actions">
              <button className="btn-secondary" onClick={() => setShowSaveModal(false)}>Cancel</button>
              <button className="btn-primary" onClick={confirmSaveProfile}>Confirm Save</button>
            </div>
          </div>
        </div>
      )}

      {/* Unsaved Changes Confirmation Modal (SETTINGS-040) */}
      {showUnsavedModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">Unsaved Changes</div>
            <div className="modal-body">You have unsaved changes. Leave without saving?</div>
            <div className="modal-actions">
              <button className="btn-secondary" onClick={() => setShowUnsavedModal(false)}>Stay</button>
              <button
                className="btn-danger"
                onClick={() => {
                  setShowUnsavedModal(false);
                  setIsEditing(false);
                  populateFormData(userProfile);
                  if (pendingTabSwitch === 'BACK') {
                    navigate(-1);
                  } else if (pendingTabSwitch && pendingTabSwitch !== 'CANCEL_EDIT') {
                    setActiveTab(pendingTabSwitch);
                  }
                  setPendingTabSwitch(null);
                }}
              >
                Leave Without Saving
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Photo Preview Modal (SETTINGS-032) */}
      {showPhotoPreviewModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ textAlign: 'center' }}>
            <div className="modal-header">Photo Preview</div>
            {photoPreviewUrl && <img src={photoPreviewUrl} alt="Selected Preview" className="photo-preview-img" />}
            <div className="modal-body">Confirm profile photo update?</div>
            <div className="modal-actions" style={{ justifyContent: 'center' }}>
              <button className="btn-secondary" onClick={() => { setShowPhotoPreviewModal(false); setSelectedPhotoFile(null); setPhotoPreviewUrl(null); }}>Cancel</button>
              <button className="btn-primary" onClick={confirmUploadPhoto}>Upload Photo</button>
            </div>
          </div>
        </div>
      )}

      {/* Remove Photo Confirmation Modal (SETTINGS-035) */}
      {showRemovePhotoModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">Remove Photo</div>
            <div className="modal-body">Remove your profile photo?</div>
            <div className="modal-actions">
              <button className="btn-secondary" onClick={() => setShowRemovePhotoModal(false)}>Cancel</button>
              <button className="btn-danger" onClick={confirmRemovePhoto}>Remove</button>
            </div>
          </div>
        </div>
      )}

      {/* Change Email Modal */}
      {showEmailModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            {emailStep === 1 ? (
              <>
                <div className="modal-header">Change Email</div>
                <div className="modal-body">Enter your new email address.</div>
                <div className="form-group" style={{ marginBottom: 16 }}>
                  <label className="form-label">New Email Address</label>
                  <input type="email" className={`form-input ${emailFlowError ? 'has-error' : ''}`} value={newEmailInput} onChange={(e) => { setNewEmailInput(e.target.value); setEmailFlowError(''); }} placeholder="new.email@example.com" />
                </div>
                {userProfile?.password && (
                  <div className="form-group" style={{ marginBottom: 16 }}>
                    <label className="form-label">Confirm your password to continue.</label>
                    <input type="password" className={`form-input ${emailFlowError ? 'has-error' : ''}`} value={emailConfirmPassword} onChange={(e) => { setEmailConfirmPassword(e.target.value); setEmailFlowError(''); }} placeholder="Enter current password" />
                  </div>
                )}
                {emailFlowError && <p className="inline-error" style={{ marginBottom: 16 }}>{emailFlowError}</p>}
                <div className="modal-actions">
                  <button className="btn-secondary" onClick={() => setShowEmailModal(false)}>Cancel</button>
                  <button className="btn-primary" disabled={emailFlowLoading} onClick={handleSendEmailOtp}>{emailFlowLoading ? 'Sending…' : 'Send Code'}</button>
                </div>
              </>
            ) : (
              <>
                <div className="modal-header">Verify Email</div>
                <div className="modal-body">Verify your new email address.</div>
                <div className="form-group" style={{ marginBottom: 16 }}>
                  <input type="text" className={`form-input ${emailFlowError ? 'has-error' : ''}`} value={emailOtpInput} onChange={(e) => { setEmailOtpInput(e.target.value); setEmailFlowError(''); }} placeholder="Enter 6-digit OTP code" maxLength={6} />
                  {emailFlowError && <span className="inline-error">{emailFlowError}</span>}
                </div>
                <div className="modal-actions">
                  <button className="btn-secondary" onClick={() => setEmailStep(1)}>Resend / Back</button>
                  <button className="btn-primary" disabled={emailFlowLoading} onClick={handleVerifyEmailOtp}>{emailFlowLoading ? 'Verifying…' : 'Verify & Update'}</button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Change Mobile Modal */}
      {showMobileModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            {mobileStep === 1 ? (
              <>
                <div className="modal-header">Change Mobile Number</div>
                <div className="modal-body">Enter your new mobile number.</div>
                <div className="form-group" style={{ marginBottom: 16 }}>
                  <input type="text" className={`form-input ${mobileFlowError ? 'has-error' : ''}`} value={newMobileInput} onChange={(e) => { setNewMobileInput(e.target.value); setMobileFlowError(''); }} placeholder="e.g. +91 9876543210" />
                  {mobileFlowError && <span className="inline-error">{mobileFlowError}</span>}
                </div>
                <div className="modal-actions">
                  <button className="btn-secondary" onClick={() => setShowMobileModal(false)}>Cancel</button>
                  <button className="btn-primary" disabled={mobileFlowLoading} onClick={handleSendMobileOtp}>{mobileFlowLoading ? 'Sending…' : 'Send Code'}</button>
                </div>
              </>
            ) : (
              <>
                <div className="modal-header">Verify Mobile Number</div>
                <div className="modal-body">Verify your new mobile number.</div>
                <div className="form-group" style={{ marginBottom: 16 }}>
                  <input type="text" className={`form-input ${mobileFlowError ? 'has-error' : ''}`} value={mobileOtpInput} onChange={(e) => { setMobileOtpInput(e.target.value); setMobileFlowError(''); }} placeholder="Enter 6-digit OTP code" maxLength={6} />
                  {mobileFlowError && <span className="inline-error">{mobileFlowError}</span>}
                </div>
                <div className="modal-actions">
                  <button className="btn-secondary" onClick={() => setMobileStep(1)}>Resend / Back</button>
                  <button className="btn-primary" disabled={mobileFlowLoading} onClick={handleVerifyMobileOtp}>{mobileFlowLoading ? 'Verifying…' : 'Verify & Update'}</button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Typed Delete Account Confirmation Modal */}
      {showDeleteAccountModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ borderColor: '#FCA5A5' }}>
            <div className="modal-header" style={{ color: '#991B1B' }}>Delete Account</div>
            <div className="modal-body">Are you sure you want to delete your account?</div>
            <div className="form-group" style={{ marginBottom: 16 }}>
              <label className="form-label">Type DELETE to confirm you want to permanently remove your account.</label>
              <input type="text" className={`form-input ${deleteError ? 'has-error' : ''}`} value={deleteConfirmText} onChange={(e) => { setDeleteConfirmText(e.target.value); setDeleteError(''); }} placeholder="Type DELETE" />
            </div>
            {userProfile?.password && (
              <div className="form-group" style={{ marginBottom: 16 }}>
                <label className="form-label">Enter your password to confirm</label>
                <input type="password" className={`form-input ${deleteError ? 'has-error' : ''}`} value={deletePassword} onChange={(e) => { setDeletePassword(e.target.value); setDeleteError(''); }} placeholder="Enter current password" />
              </div>
            )}
            {deleteError && <p className="inline-error" style={{ marginBottom: 16 }}>{deleteError}</p>}
            <div className="modal-actions">
              <button className="btn-secondary" disabled={isDeletingAccount} onClick={() => { setShowDeleteAccountModal(false); toast.info('Your account has not been deleted.'); }}>Cancel</button>
              <button className="btn-danger" disabled={isDeletingAccount} onClick={confirmDeleteAccount}>{isDeletingAccount ? 'Deleting your account…' : 'Delete Account'}</button>
            </div>
          </div>
        </div>
      )}

      {/* Deactivate Confirmation Modal */}
      {showDeactivateModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">Deactivate Account</div>
            <div className="modal-body">Enter your password to confirm deactivation. Deactivating hides your profile and content. You can reactivate anytime by logging back in.</div>
            {userProfile?.password && (
              <div className="form-group" style={{ marginBottom: 16 }}>
                <label className="form-label">Password</label>
                <input type="password" className={`form-input ${deactivateError ? 'has-error' : ''}`} value={deactivatePassword} onChange={(e) => { setDeactivatePassword(e.target.value); setDeactivateError(''); }} placeholder="Enter current password" />
              </div>
            )}
            {deactivateError && <p className="inline-error" style={{ marginBottom: 16 }}>{deactivateError}</p>}
            <div className="modal-actions">
              <button className="btn-secondary" onClick={() => setShowDeactivateModal(false)}>Cancel</button>
              <button className="btn-warning" disabled={isDeactivating} onClick={confirmDeactivateAccount}>{isDeactivating ? 'Deactivating…' : 'Confirm Deactivation'}</button>
            </div>
          </div>
        </div>
      )}

      {/* Logout Single Session Modal */}
      {showLogoutSessionModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">Sign Out Device</div>
            <div className="modal-body">Sign out this device?</div>
            <div className="modal-actions">
              <button className="btn-secondary" onClick={() => setShowLogoutSessionModal(false)}>Cancel</button>
              <button className="btn-danger" onClick={handleLogoutSingleSession}>Sign Out</button>
            </div>
          </div>
        </div>
      )}

      {/* Logout All Sessions Modal */}
      {showLogoutAllModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">Sign Out All Other Devices</div>
            <div className="modal-body">Are you sure you want to sign out of all other devices?</div>
            <div className="modal-actions">
              <button className="btn-secondary" onClick={() => setShowLogoutAllModal(false)}>Cancel</button>
              <button className="btn-danger" onClick={handleLogoutAllOtherSessions}>Sign Out All Other Devices</button>
            </div>
          </div>
        </div>
      )}

      {/* Regenerate Recovery Codes Modal */}
      {showRegenerateCodesModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">Regenerate Recovery Codes</div>
            <div className="modal-body">Regenerating codes will invalidate your existing recovery codes. Continue?</div>
            <div className="modal-actions">
              <button className="btn-secondary" onClick={() => setShowRegenerateCodesModal(false)}>Cancel</button>
              <button className="btn-primary" onClick={handleRegenerateRecoveryCodes}>Regenerate</button>
            </div>
          </div>
        </div>
      )}

      {/* Add Payment Method Modal (SETTINGS-211 to SETTINGS-215) */}
      {showAddCardModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: 480 }}>
            <div className="modal-header">Add Payment Method</div>
            <form onSubmit={handleAddCardSubmit}>
              <div className="form-group" style={{ marginBottom: 16 }}>
                <label className="form-label">Name on Card</label>
                <input
                  type="text"
                  className="form-input"
                  value={cardFormData.cardName}
                  onChange={(e) => setCardFormData({ ...cardFormData, cardName: e.target.value })}
                  placeholder="Cardholder Name"
                />
              </div>

              <div className="form-group" style={{ marginBottom: 16 }}>
                <label className="form-label">Card Number *</label>
                <input
                  type="text"
                  className={`form-input ${cardFormErrors.cardNumber ? 'has-error' : ''}`}
                  value={cardFormData.cardNumber}
                  onChange={(e) => setCardFormData({ ...cardFormData, cardNumber: e.target.value })}
                  placeholder="4532 •••• •••• 8892"
                  maxLength={19}
                />
                {cardFormErrors.cardNumber && <span className="inline-error">{cardFormErrors.cardNumber}</span>}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 16 }}>
                <div className="form-group">
                  <label className="form-label">Exp Month *</label>
                  <input
                    type="text"
                    className={`form-input ${cardFormErrors.expMonth ? 'has-error' : ''}`}
                    value={cardFormData.expMonth}
                    onChange={(e) => setCardFormData({ ...cardFormData, expMonth: e.target.value })}
                    placeholder="MM"
                    maxLength={2}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Exp Year *</label>
                  <input
                    type="text"
                    className={`form-input ${cardFormErrors.expMonth ? 'has-error' : ''}`}
                    value={cardFormData.expYear}
                    onChange={(e) => setCardFormData({ ...cardFormData, expYear: e.target.value })}
                    placeholder="YYYY"
                    maxLength={4}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">CVV *</label>
                  <input
                    type="password"
                    className={`form-input ${cardFormErrors.cvv ? 'has-error' : ''}`}
                    value={cardFormData.cvv}
                    onChange={(e) => setCardFormData({ ...cardFormData, cvv: e.target.value })}
                    placeholder="123"
                    maxLength={4}
                  />
                </div>
              </div>
              {cardFormErrors.expMonth && <p className="inline-error" style={{ marginBottom: 12 }}>{cardFormErrors.expMonth}</p>}
              {cardFormErrors.cvv && <p className="inline-error" style={{ marginBottom: 12 }}>{cardFormErrors.cvv}</p>}

              <div className="form-group" style={{ marginBottom: 20 }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', fontSize: 14 }}>
                  <input
                    type="checkbox"
                    checked={cardFormData.isDefault}
                    onChange={(e) => setCardFormData({ ...cardFormData, isDefault: e.target.checked })}
                  />
                  Set as default payment method
                </label>
              </div>

              <div className="modal-actions">
                <button type="button" className="btn-secondary" onClick={() => setShowAddCardModal(false)}>Cancel</button>
                <button type="submit" className="btn-primary" disabled={isProcessingCard}>
                  {isProcessingCard ? 'Verifying your payment method…' : 'Save Payment Method'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Remove Payment Method Confirmation Modal (SETTINGS-164) */}
      {showRemoveCardModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">Remove Payment Method</div>
            <div className="modal-body">Remove this payment method?</div>
            <div className="modal-actions">
              <button className="btn-secondary" onClick={() => setShowRemoveCardModal(false)}>Cancel</button>
              <button className="btn-danger" onClick={confirmRemovePaymentMethod}>Remove payment method</button>
            </div>
          </div>
        </div>
      )}

      {/* Upgrade Plan Confirmation Modal (SETTINGS-216) */}
      {showUpgradeModal && targetUpgradePlan && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">Confirm Upgrade</div>
            <div className="modal-body">
              Upgrade to {targetUpgradePlan.name} for {targetUpgradePlan.price}/month, billed today?
            </div>
            <div className="modal-actions">
              <button className="btn-secondary" onClick={() => setShowUpgradeModal(false)}>Cancel</button>
              <button className="btn-primary" disabled={isProcessingSub} onClick={confirmUpgradePlan}>
                {isProcessingSub ? 'Processing…' : 'Confirm Upgrade'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cancel Subscription Confirmation Modal (SETTINGS-218) */}
      {showCancelSubModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">Cancel Subscription</div>
            <div className="modal-body">
              Are you sure you want to cancel? You'll lose access to premium features on {billingDetails?.expiryDate || 'end of current billing period'}.
            </div>
            <div className="modal-actions">
              <button className="btn-secondary" onClick={() => setShowCancelSubModal(false)}>Keep Plan</button>
              <button className="btn-danger" disabled={isProcessingSub} onClick={confirmCancelSubscription}>
                {isProcessingSub ? 'Cancelling…' : 'Cancel Plan'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Logout Confirmation Modal (SETTINGS-184, SETTINGS-185) */}
      {showLogoutModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">Log Out</div>
            <div className="modal-body">Are you sure you want to log out?</div>
            <div className="modal-actions">
              <button className="btn-secondary" onClick={() => setShowLogoutModal(false)}>Cancel</button>
              <button className="btn-danger" onClick={confirmLogout}>Log out</button>
            </div>
          </div>
        </div>
      )}

      {/* Logout Processing Overlay (SETTINGS-186) */}
      {isLoggingOut && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ textAlign: 'center', maxWidth: 360 }}>
            <div className="spinner" style={{ margin: '0 auto 16px auto' }} />
            <h3 style={{ fontSize: 18, color: '#1E293B', margin: 0 }}>Signing you out…</h3>
          </div>
        </div>
      )}

      {/* Invoice Details Modal (SETTINGS-222, SETTINGS-223) */}
      {showInvoiceModal && selectedInvoice && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: 500 }}>
            <div className="modal-header">Invoice details.</div>
            <div className="modal-body" style={{ lineHeight: 1.8 }}>
              <p><strong>Invoice ID:</strong> {selectedInvoice.id}</p>
              <p><strong>Date:</strong> {selectedInvoice.date}</p>
              <p><strong>Amount:</strong> {selectedInvoice.amount}</p>
              <p><strong>Status:</strong> {selectedInvoice.status}</p>
              <p><strong>Description:</strong> Gold VIP Membership Subscription</p>
            </div>
            <div className="modal-actions">
              <button className="btn-secondary" onClick={() => setShowInvoiceModal(false)}>Close</button>
              <button className="btn-primary" onClick={() => handleDownloadInvoice(selectedInvoice)}>Download invoice.</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
