const express = require('express');
const router = express.Router();
const { 
    getUserProfile, 
    updateUserProfile,
    getUserAddresses,
    addAddress,
    updateAddress,
    deleteAddress,
    setDefaultAddress,
    uploadMyProfilePhoto,
    removeMyProfilePhoto,
    deleteMyAccount,
    deactivateMyAccount,
    scheduleAccountDeletion,
    cancelAccountDeletion,
    getActiveSessions,
    logoutSession,
    logoutAllOtherSessions,
    getRecoveryCodes,
    regenerateRecoveryCodes,
    updateNotificationSettings,
    updatePrivacySettings,
    updatePreferences,
    getPaymentMethods,
    addPaymentMethod,
    removePaymentMethod,
    submitSupportTicket,
    getBillingDetails,
    upgradeSubscription,
    cancelSubscription,
    getAdminSettings,
    updateAdminProfile,
    updateAdminPassword,
    updateAdminPermissions
} = require('../controllers/userController');
const upload = require('../middleware/ImageUploadMiddleware');
const { getMyOrders, getMyOrderById, cancelMyOrder } = require('../controllers/orderController');
const { getWishlist, toggleWishlist } = require('../controllers/wishlistController');
const { getWalletDetails, getWalletTransactions } = require('../controllers/walletController');
const { protect } = require('../middleware/authMiddleware');

// All profile routes must be protected so the user is logged in
router.use(protect);

router.route('/')
    .get(getUserProfile)
    .put(updateUserProfile);

router.post('/photo', upload.single('profileImage'), uploadMyProfilePhoto);
router.delete('/photo', removeMyProfilePhoto);
router.delete('/account', deleteMyAccount);

// Notifications, Privacy, Preferences
router.put('/notifications', updateNotificationSettings);
router.put('/privacy', updatePrivacySettings);
router.put('/preferences', updatePreferences);

// Deactivation & Grace Period Deletion
router.post('/deactivate', deactivateMyAccount);
router.post('/schedule-deletion', scheduleAccountDeletion);
router.post('/cancel-deletion', cancelAccountDeletion);

// Active Sessions & Security
router.get('/sessions', getActiveSessions);
router.post('/sessions/logout', logoutSession);
router.post('/sessions/logout-all-others', logoutAllOtherSessions);
router.get('/recovery-codes', getRecoveryCodes);
router.post('/recovery-codes/regenerate', regenerateRecoveryCodes);

// Address Management routes
router.route('/addresses')
    .get(getUserAddresses)
    .post(addAddress);

router.route('/addresses/:addressId')
    .put(updateAddress)
    .delete(deleteAddress);

router.route('/addresses/:addressId/default')
    .put(setDefaultAddress);

router.route('/orders')
    .get(getMyOrders);

router.route('/orders/:id')
    .get(getMyOrderById);

router.post('/orders/:id/cancel', cancelMyOrder);

// Wallet routes
router.get('/wallet', getWalletDetails);
router.get('/wallet/transactions', getWalletTransactions);

// Payment Methods
router.route('/payment-methods')
    .get(getPaymentMethods)
    .post(addPaymentMethod);
router.delete('/payment-methods/:id', removePaymentMethod);

// Support Tickets
router.post('/support', submitSupportTicket);

// Billing & Subscription
router.get('/billing', getBillingDetails);
router.post('/subscription/upgrade', upgradeSubscription);
router.post('/subscription/cancel', cancelSubscription);

// Admin Settings & Security
router.get('/admin/settings', getAdminSettings);
router.put('/admin/profile', updateAdminProfile);
router.put('/admin/password', updateAdminPassword);
router.put('/admin/permissions', updateAdminPermissions);

module.exports = router;

