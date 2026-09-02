const express = require('express');
const router = express.Router();
const { 
    getUserProfile, 
    updateUserProfile,
    getUserAddresses,
    addAddress,
    updateAddress,
    deleteAddress,
    setDefaultAddress
} = require('../controllers/userController');
const { getMyOrders, getMyOrderById } = require('../controllers/orderController');
const { getWishlist, toggleWishlist } = require('../controllers/wishlistController');
const { protect } = require('../middleware/authMiddleware');

// All profile routes must be protected so the user is logged in
router.use(protect);

router.route('/')
    .get(getUserProfile)
    .put(updateUserProfile);

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

// Wishlist routes
router.get('/wishlist', getWishlist);
router.post('/wishlist/:productId', toggleWishlist);

module.exports = router;

