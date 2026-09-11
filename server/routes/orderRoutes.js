const express = require('express');
const router = express.Router();
const { getAllOrders, getOrderById, updateOrderStatus, refundOrder } = require('../controllers/orderController');
const { protect, authorize } = require('../middleware/authMiddleware');

// All routes are protected and require Admin role
router.use(protect);
router.use(authorize('Admin'));

router.route('/allorders')
    .get(getAllOrders);

router.route('/getorder/:id')
    .get(getOrderById);

router.route('/updatestatus/:id')
    .put(updateOrderStatus);

router.route('/refund/:id')
    .post(refundOrder);

module.exports = router;
