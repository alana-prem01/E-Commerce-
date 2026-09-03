const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true,
        minlength: 3,
        maxlength: 50
    },

    email: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true,
        maxlength: 100
    },

    password: {
        type: String,
        required: false
    },

    googleId: {
        type: String
    },

    authProvider: {
        type: String,
        enum: ["local", "google"],
        default: "local"
    },

    role: {
        type: String,
        enum: ["Admin", "User"],
        default: "User"
    },

    status: {
        type: String,
        enum: ["Active", "Inactive", "Blocked"],
        default: "Active"
    },

    phone: {
        type: String,
        trim: true
    },

    address: {
        fullName: { type: String, trim: true },
        phone: { type: String, trim: true },
        addressLine1: { type: String, trim: true },
        addressLine2: { type: String, trim: true },
        city: { type: String, trim: true },
        state: { type: String, trim: true },
        country: { type: String, trim: true },
        pinCode: { type: String, trim: true }
    },

    addresses: [{
        fullName: { type: String, trim: true },
        phone: { type: String, trim: true },
        house: { type: String, trim: true },
        street: { type: String, trim: true },
        city: { type: String, trim: true },
        state: { type: String, trim: true },
        pinCode: { type: String, trim: true },
        country: { type: String, trim: true, default: "India" },
        isDefault: { type: Boolean, default: false }
    }],

    lastLogin: {
        type: Date
    },

    resetPasswordOTP: {
        type: String
    },

    resetPasswordExpires: {
        type: Date
    },

    username: {
        type: String,
        trim: true
    },

    profileImage: {
        type: String,
        default: ""
    },

    emailVerified: {
        type: Boolean,
        default: false
    },

    phoneVerified: {
        type: Boolean,
        default: false
    },

    twoFactorEnabled: {
        type: Boolean,
        default: false
    },

    loginCount: {
        type: Number,
        default: 0
    },

    assignedProjects: {
        type: Number,
        default: 0
    },

    tasksCompleted: {
        type: Number,
        default: 0
    },

    tasksPending: {
        type: Number,
        default: 0
    },

    activities: [{
        activityType: { type: String },
        description: { type: String },
        date: { type: Date, default: Date.now }
    }],

    wishlist: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product'
    }],

    membership: {
        isPremium: { type: Boolean, default: false },
        startDate: { type: Date },
        expiryDate: { type: Date },
        razorpay_order_id: { type: String },
        razorpay_payment_id: { type: String }
    }
}, {
    timestamps: true
});

module.exports = mongoose.model("User", userSchema);