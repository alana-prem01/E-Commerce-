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

    failedLoginAttempts: {
        type: Number,
        default: 0
    },

    lockUntil: {
        type: Date
    },

    mobileOTP: {
        type: String
    },

    mobileOTPExpires: {
        type: Date
    },

    mobileOTPAttempts: {
        type: Number,
        default: 0
    },

    mobileOTPLastSent: {
        type: Date
    },

    resetPasswordOTP: {
        type: String
    },

    resetPasswordExpires: {
        type: Date
    },

    pendingEmail: {
        type: String,
        trim: true,
        lowercase: true
    },

    changeEmailOTP: {
        type: String
    },

    changeEmailExpires: {
        type: Date
    },

    deleteAccountOTP: {
        type: String
    },

    deleteAccountExpires: {
        type: Date
    },

    firstName: {
        type: String,
        trim: true
    },

    lastName: {
        type: String,
        trim: true
    },

    displayName: {
        type: String,
        trim: true
    },

    dob: {
        type: Date
    },

    gender: {
        type: String,
        enum: ["Male", "Female", "Other", "Prefer not to say", ""],
        default: ""
    },

    bio: {
        type: String,
        maxlength: 150,
        trim: true
    },

    pendingMobile: {
        type: String,
        trim: true
    },

    changeMobileOTP: {
        type: String
    },

    changeMobileExpires: {
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

    deactivated: {
        type: Boolean,
        default: false
    },

    deactivatedAt: {
        type: Date
    },

    deletionGracePeriodExpires: {
        type: Date
    },

    recoveryCodes: [{
        code: { type: String },
        used: { type: Boolean, default: false }
    }],

    sessions: [{
        sessionId: { type: String },
        device: { type: String },
        browser: { type: String },
        ip: { type: String },
        location: { type: String },
        lastActive: { type: Date, default: Date.now },
        isCurrent: { type: Boolean, default: false }
    }],

    loginActivities: [{
        device: { type: String },
        ip: { type: String },
        location: { type: String },
        timestamp: { type: Date, default: Date.now },
        isSuspicious: { type: Boolean, default: false }
    }],

    notificationSettings: {
        orderUpdates: { type: Boolean, default: true },
        deliveryUpdates: { type: Boolean, default: true }
    },

    privacySettings: {
        profileVisibility: { type: Boolean, default: true },
        activityVisibility: { type: Boolean, default: true },
        personalizedRecommendations: { type: Boolean, default: true }
    },

    preferences: {
        language: { type: String, default: "English" },
        region: { type: String, default: "India" },
        theme: { type: String, enum: ["light", "dark", "system"], default: "system" },
        textSize: { type: Number, default: 100 },
        dateTimeFormat: { type: String, default: "DD/MM/YYYY" }
    },

    savedPaymentMethods: [{
        paymentMethodId: { type: String },
        cardType: { type: String, default: "Visa" },
        last4: { type: String },
        expiryMonth: { type: String },
        expiryYear: { type: String },
        holderName: { type: String },
        isDefault: { type: Boolean, default: false }
    }],

    supportTickets: [{
        ticketId: { type: String },
        subject: { type: String },
        message: { type: String },
        attachment: { type: String },
        status: { type: String, default: "Open" },
        createdAt: { type: Date, default: Date.now }
    }],

    invoices: [{
        invoiceId: { type: String },
        amount: { type: Number },
        date: { type: Date, default: Date.now },
        status: { type: String, default: "Paid" },
        planName: { type: String, default: "Elora Premium" },
        pdfUrl: { type: String }
    }],

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
    },

    walletBalance: {
        type: Number,
        default: 0,
        min: 0
    }
}, {
    timestamps: true
});

module.exports = mongoose.model("User", userSchema);