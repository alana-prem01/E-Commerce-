const Contact = require('../models/ContactSchema');

// @desc    Submit a contact message
// @route   POST /api/contact
// @access  Public
const submitContactMessage = async (req, res) => {
    try {
        const { name, email, phone, comment } = req.body;

        if (!name || !email || !comment) {
            return res.status(400).json({ 
                success: false, 
                message: "Please fill in all required fields (Name, Email, Message)." 
            });
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email.trim())) {
            return res.status(400).json({ 
                success: false, 
                message: "Please enter a valid email address." 
            });
        }

        const newContact = await Contact.create({
            name: name.trim(),
            email: email.trim().toLowerCase(),
            phone: phone ? phone.trim() : "",
            comment: comment.trim(),
            status: 'Unread'
        });

        res.status(201).json({
            success: true,
            message: "Your message has been sent successfully. We will get back to you soon!",
            data: newContact
        });
    } catch (error) {
        console.error("Submit Contact Message Error:", error);
        res.status(500).json({ success: false, message: "Server error. Could not send message." });
    }
};

// @desc    Get all contact messages (Admin)
// @route   GET /api/contact
// @access  Private/Admin
const getContactMessages = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        const { search, status } = req.query;
        let query = {};

        if (search) {
            query.$or = [
                { name: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } },
                { comment: { $regex: search, $options: 'i' } }
            ];
        }

        if (status && status !== 'All') {
            query.status = status;
        }

        const messages = await Contact.find(query)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        const total = await Contact.countDocuments(query);
        const unreadCount = await Contact.countDocuments({ status: 'Unread' });

        res.status(200).json({
            success: true,
            count: messages.length,
            total,
            unreadCount,
            page,
            pages: Math.ceil(total / limit),
            data: messages
        });
    } catch (error) {
        console.error("Get Contact Messages Error:", error);
        res.status(500).json({ success: false, message: "Server Error" });
    }
};

// @desc    Update contact message status
// @route   PUT /api/contact/:id
// @access  Private/Admin
const updateContactStatus = async (req, res) => {
    try {
        const { status } = req.body;
        const message = await Contact.findById(req.params.id);

        if (!message) {
            return res.status(404).json({ success: false, message: "Message not found" });
        }

        if (status) message.status = status;
        await message.save();

        res.status(200).json({
            success: true,
            message: `Message status updated to ${message.status}`,
            data: message
        });
    } catch (error) {
        console.error("Update Contact Status Error:", error);
        res.status(500).json({ success: false, message: "Server Error" });
    }
};

// @desc    Delete contact message
// @route   DELETE /api/contact/:id
// @access  Private/Admin
const deleteContactMessage = async (req, res) => {
    try {
        const message = await Contact.findById(req.params.id);
        if (!message) {
            return res.status(404).json({ success: false, message: "Message not found" });
        }

        await Contact.findByIdAndDelete(req.params.id);
        res.status(200).json({ success: true, message: "Message deleted successfully" });
    } catch (error) {
        console.error("Delete Contact Message Error:", error);
        res.status(500).json({ success: false, message: "Server Error" });
    }
};

module.exports = {
    submitContactMessage,
    getContactMessages,
    updateContactStatus,
    deleteContactMessage
};
