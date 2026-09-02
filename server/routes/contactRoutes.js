const express = require('express');
const router = express.Router();
const {
    submitContactMessage,
    getContactMessages,
    updateContactStatus,
    deleteContactMessage
} = require('../controllers/contactController');
const { protect, authorize } = require('../middleware/authMiddleware');

// Public route to submit contact form
router.post('/', submitContactMessage);

// Admin routes to view, update, delete messages
router.get('/', protect, authorize('Admin'), getContactMessages);
router.put('/:id', protect, authorize('Admin'), updateContactStatus);
router.delete('/:id', protect, authorize('Admin'), deleteContactMessage);

module.exports = router;
