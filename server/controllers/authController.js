const User = require('../models/UserSchema');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { OAuth2Client } = require('google-auth-library');
const verifyTurnstileToken = require('../utils/verifyTurnstile');
const verifyReCaptchaToken = require('../utils/verifyReCaptcha');

// @desc    Register a new user
// @route   POST /api/auth/signup
// @access  Public

const signup = async (req, res) => {
    try {
        let { name, email, phone, password, confirmPassword, consent, recaptchaToken } = req.body;

        // Google reCAPTCHA Verification
        if (!recaptchaToken) {
            return res.status(400).json({ success: false, message: "reCAPTCHA token is missing" });
        }
        const isRecaptchaValid = await verifyReCaptchaToken(recaptchaToken);
        if (!isRecaptchaValid) {
            return res.status(400).json({ success: false, message: "reCAPTCHA verification failed" });
        }

        // Trim inputs
        const trimmedName = name?.trim();
        const trimmedEmail = email?.trim().toLowerCase();
        const trimmedPassword = password?.trim();
        const trimmedConfirmPassword = confirmPassword?.trim();

        // 1. Check if all required fields are provided
        if (!trimmedName || !trimmedEmail || !trimmedPassword || !trimmedConfirmPassword) {
            return res.status(400).json({
                success: false,
                message: "All fields are required"
            });
        }

        // 2. Consent check
        if (!consent) {
            return res.status(400).json({
                success: false,
                message: "You must accept the Terms & Conditions and Privacy Policy"
            });
        }

        // 3. Name Validation
        if (trimmedName.length < 3 || trimmedName.length > 50) {
            return res.status(400).json({
                success: false,
                message: "Name must be between 3 and 50 characters"
            });
        }

        // Accept alphabets and only single spaces between words
        const nameRegex = /^[A-Za-z]+(?: [A-Za-z]+)*$/;

        if (!nameRegex.test(trimmedName)) {
            return res.status(400).json({
                success: false,
                message: "Name can only contain letters and single spaces between words"
            });
        }

        // 4. Email Validation
        if (trimmedEmail.length > 100) {
            return res.status(400).json({
                success: false,
                message: "Email cannot exceed 100 characters"
            });
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        if (!emailRegex.test(trimmedEmail)) {
            return res.status(400).json({
                success: false,
                message: "Invalid email format"
            });
        }

        // Check duplicate email
        const existingUser = await User.findOne({ email: trimmedEmail });

        if (existingUser) {
            return res.status(409).json({
                success: false,
                message: "Email is already registered"
            });
        }

        // Check duplicate phone
        if (phone) {
            const phoneDigits = phone.replace(/\D/g, '');
            const cleanCode = '91';
            let localDigits = phoneDigits;
            if (phoneDigits.startsWith(cleanCode) && phoneDigits.length > cleanCode.length) {
                localDigits = phoneDigits.slice(cleanCode.length);
            }
            const existingPhoneUser = await User.findOne({
                $or: [
                    { phone: `+${cleanCode}${localDigits}` },
                    { phone: `${cleanCode}${localDigits}` },
                    { phone: localDigits },
                    { phone: phone.trim() }
                ]
            });

            if (existingPhoneUser) {
                return res.status(409).json({
                    success: false,
                    message: "Mobile number is already registered"
                });
            }
        }

        // 5. Password Validation

        if (trimmedPassword.length < 8 || trimmedPassword.length > 20) {
            return res.status(400).json({
                success: false,
                message: "Password must be between 8 and 20 characters"
            });
        }

        // No spaces allowed
        if (/\s/.test(trimmedPassword)) {
            return res.status(400).json({
                success: false,
                message: "Password cannot contain spaces"
            });
        }

        // Password format validation
        const passwordRegex =
            /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&^#_.+-])[A-Za-z\d@$!%*?&^#_.+-]{8,20}$/;

        if (!passwordRegex.test(trimmedPassword)) {
            return res.status(400).json({
                success: false,
                message:
                    "Password must contain at least one uppercase letter, one lowercase letter, one number and one special character"
            });
        }

        // 6. Confirm Password Validation
        if (trimmedPassword !== trimmedConfirmPassword) {
            return res.status(400).json({
                success: false,
                message: "Passwords do not match"
            });
        }

        // 7. Phone Validation (optional field but if provided must be valid)
        if (phone) {
            const phoneDigits = phone.replace(/\D/g, '');
            if (phoneDigits.length < 7 || phoneDigits.length > 15) {
                return res.status(400).json({
                    success: false,
                    message: "Please enter a valid phone number (7-15 digits)"
                });
            }
            // Indian mobile: 10 digits starting with 6-9
            if (phoneDigits.length === 10 && !/^[6-9]\d{9}$/.test(phoneDigits)) {
                return res.status(400).json({
                    success: false,
                    message: "Please enter a valid Indian mobile number (10 digits starting with 6-9)"
                });
            }
        }

        // 8. Hash Password
        const hashedPassword = await bcrypt.hash(trimmedPassword, 10);

        // 9. Create User
        const newUser = new User({
            name: trimmedName,
            email: trimmedEmail,
            phone: phone ? phone.replace(/\D/g, '') : "",
            password: hashedPassword
            // role will automatically be "User"
        })

        await newUser.save();

        return res.status(201).json({
            success: true,
            message: "User registered successfully",
            user: {
                id: newUser._id,
                name: newUser.name,
                email: newUser.email,
                role: newUser.role
            }
        })

    } catch (error) {
        console.error("Signup Error:", error);

        return res.status(500).json({
            success: false,
            message: "Internal Server Error"
        })
    }
}

// @desc    Authenticate user & get token
// @route   POST /api/auth/signin
// @access  Public
const signin = async (req, res) => {
    try {
        const { email, phone, countryCode, password, recaptchaToken, turnstileToken, captchaToken } = req.body;

        const tokenToVerify = recaptchaToken || captchaToken;

        // Verify CAPTCHA
        if (!tokenToVerify && !turnstileToken) {
            return res.status(400).json({ success: false, message: "CAPTCHA verification is required" });
        }

        if (tokenToVerify) {
            const isValidReCaptcha = await verifyReCaptchaToken(tokenToVerify, req.ip);
            if (!isValidReCaptcha) {
                return res.status(400).json({ success: false, message: "Google reCAPTCHA verification failed. Please try again." });
            }
        }

        if (turnstileToken) {
            const isValidTurnstile = await verifyTurnstileToken(turnstileToken, req.ip);
            if (!isValidTurnstile) {
                return res.status(400).json({ success: false, message: "Turnstile CAPTCHA verification failed. Please try again." });
            }
        }

        if (!email && !phone) {
            return res.status(400).json({ success: false, message: "Email or mobile number is required" });
        }
        if (!password) {
            return res.status(400).json({ success: false, message: "Password is required" });
        }

        const trimmedPassword = password.trim();
        if (trimmedPassword.length < 8 || trimmedPassword.length > 20) {
            return res.status(400).json({ success: false, message: "Password must be between 8 and 20 characters" });
        }

        if (/\s/.test(trimmedPassword)) {
            return res.status(400).json({ success: false, message: "Password cannot contain spaces" });
        }

        let user;
        let isPhoneAuth = false;

        const isNumericPhoneInput = email && !email.includes('@') && /^\+?[0-9\s-]{7,15}$/.test(email.trim());

        if (phone || isNumericPhoneInput) {
            isPhoneAuth = true;
            const targetPhone = phone || email;
            const phoneDigits = targetPhone.replace(/\D/g, '');
            if (phoneDigits.length < 7 || phoneDigits.length > 15) {
                return res.status(400).json({ success: false, message: "Please enter a valid phone number (7-15 digits)" });
            }
            if ((countryCode === '+91' || !countryCode) && phoneDigits.length === 10 && !/^[6-9]\d{9}$/.test(phoneDigits)) {
                return res.status(400).json({ success: false, message: "Please enter a valid 10-digit Indian mobile number starting with 6-9" });
            }

            const cleanCode = (countryCode || '+91').replace(/\D/g, ''); // e.g. "91"
            let localDigits = phoneDigits;
            if (cleanCode && phoneDigits.startsWith(cleanCode) && phoneDigits.length > cleanCode.length) {
                localDigits = phoneDigits.slice(cleanCode.length);
            }

            const fullWithPlus = `+${cleanCode}${localDigits}`;
            const fullDigits = `${cleanCode}${localDigits}`;
            const localNum = localDigits;

            user = await User.findOne({
                $or: [
                    { phone: fullWithPlus },
                    { phone: fullDigits },
                    { phone: localNum },
                    { phone: targetPhone.trim() }
                ]
            });

            if (!user) {
                return res.status(401).json({
                    success: false,
                    message: "Invalid mobile number or password"
                });
            }
        } else {
            const trimmedEmail = email.trim().toLowerCase();
            if (trimmedEmail.length > 100) {
                return res.status(400).json({ success: false, message: "Email cannot exceed 100 characters" });
            }

            const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
            if (/\s/.test(email) || (email.match(/@/g) || []).length !== 1 || !emailRegex.test(trimmedEmail)) {
                return res.status(400).json({ success: false, message: "Invalid email format" });
            }

            user = await User.findOne({
                email: trimmedEmail
            });

            if (!user) {
                return res.status(401).json({
                    success: false,
                    message: "Invalid email or password"
                });
            }
        }

        if (user.status === 'Blocked') {
            return res.status(403).json({
                success: false,
                message: "Your account has been blocked. Please contact support."
            });
        }

        // Account Lockout check for multiple failed attempts
        if (user.lockUntil && user.lockUntil > Date.now()) {
            const minutesLeft = Math.ceil((user.lockUntil - Date.now()) / (60 * 1000));
            return res.status(429).json({
                success: false,
                message: `Account is temporarily locked due to multiple failed login attempts. Please try again in ${minutesLeft} minute(s).`
            });
        }

        const isMatch = await bcrypt.compare(
            trimmedPassword,
            user.password
        );

        if (!isMatch) {
            user.failedLoginAttempts = (user.failedLoginAttempts || 0) + 1;
            if (user.failedLoginAttempts >= 5) {
                user.lockUntil = new Date(Date.now() + 15 * 60 * 1000); // 15-minute lock
                user.failedLoginAttempts = 0;
                await user.save();
                return res.status(429).json({
                    success: false,
                    message: "Too many failed login attempts. Account is temporarily locked for 15 minutes."
                });
            }
            await user.save();
            const attemptsLeft = 5 - user.failedLoginAttempts;
            const warningMsg = attemptsLeft === 1
                ? "Invalid credentials. Warning: This is your final attempt before your account is temporarily locked for 15 minutes!"
                : (isPhoneAuth ? "Invalid mobile number or password" : "Invalid email or password");
            return res.status(401).json({
                success: false,
                message: warningMsg
            });
        }

        // Reset failed login tracking on success
        if (user.failedLoginAttempts > 0 || user.lockUntil) {
            user.failedLoginAttempts = 0;
            user.lockUntil = undefined;
        }

        user.lastLogin = new Date();
        await user.save();

        const payload = {
            id: user._id,
            role: user.role
        };

        const accessToken = jwt.sign(
            payload,
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );

        return res.status(200).json({
            success: true,
            message: "User logged in successfully",
            accessToken,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                membership: user.membership
            }
        });

    } catch (error) {
        console.error("Signin Error:", error);
        return res.status(500).json({
            success: false,
            message: "Internal Server Error"
        });
    }
};

// @desc    Forgot Password (Send OTP)
// @route   POST /api/auth/forgot-password
// @access  Public
const forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({ success: false, message: "Email is required" });
        }

        const user = await User.findOne({ email: email.trim().toLowerCase() });

        if (!user) {
            // Send 404 so frontend can show "email not registered" error as requested
            return res.status(404).json({ success: false, message: "Email address is not registered" });
        }

        // Generate a 6-digit OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString();

        console.log(`[DEBUG] Forgot Password OTP for ${user.email}: ${otp}`);

        // OTP expires in 10 minutes
        user.resetPasswordOTP = otp;
        user.resetPasswordExpires = Date.now() + 10 * 60 * 1000;
        await user.save();

        // Send Email
        const sendEmail = require('../utils/sendEmail');

        const message = `You are receiving this email because you (or someone else) have requested the reset of a password. \n\n Your OTP is: ${otp} \n\n It is valid for 10 minutes.`;

        try {
            await sendEmail({
                email: user.email,
                subject: 'Password Reset OTP',
                message
            });

            res.status(200).json({ success: true, message: "OTP sent to email successfully" });
        } catch (error) {
            console.error("Email Sending Error:", error);
            user.resetPasswordOTP = undefined;
            user.resetPasswordExpires = undefined;
            await user.save();
            return res.status(500).json({
                success: false,
                message: error?.message ? `Email could not be sent: ${error.message}` : "Email could not be sent"
            });
        }

    } catch (error) {
        console.error("Forgot Password Error:", error);
        res.status(500).json({ success: false, message: "Internal Server Error" });
    }
};

// @desc    Reset Password
// @route   POST /api/auth/reset-password
// @access  Public
const resetPassword = async (req, res) => {
    try {
        // Expected request body: email, otp, newPassword, confirmPassword, recaptchaToken
        const { email, otp, newPassword, confirmPassword, recaptchaToken, captchaToken } = req.body;

        const tokenToVerify = recaptchaToken || captchaToken;

        // Verify Google reCAPTCHA
        if (!tokenToVerify) {
            return res.status(400).json({ success: false, message: "reCAPTCHA verification token is missing" });
        }

        const isValidReCaptcha = await verifyReCaptchaToken(tokenToVerify);
        if (!isValidReCaptcha) {
            return res.status(400).json({ success: false, message: "Google reCAPTCHA verification failed. Please try again." });
        }

        if (!email || !otp || !newPassword || !confirmPassword) {
            return res.status(400).json({ success: false, message: "Please provide email, OTP, new password, and confirm password" });
        }

        const user = await User.findOne({
            email: email.trim().toLowerCase(),
            resetPasswordOTP: otp,
            resetPasswordExpires: { $gt: Date.now() }
        });

        if (!user) {
            return res.status(400).json({ success: false, message: "Invalid or expired OTP" });
        }

        // Password Validation
        const trimmedPassword = newPassword.trim();
        const trimmedConfirmPassword = confirmPassword.trim();

        if (trimmedPassword !== trimmedConfirmPassword) {
            return res.status(400).json({ success: false, message: "Passwords do not match" });
        }

        if (trimmedPassword.length < 8 || trimmedPassword.length > 20) {
            return res.status(400).json({ success: false, message: "Password must be between 8 and 20 characters" });
        }

        if (/\s/.test(trimmedPassword)) {
            return res.status(400).json({ success: false, message: "Password cannot contain spaces" });
        }

        const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&^#_.+-])[A-Za-z\d@$!%*?&^#_.+-]{8,20}$/;
        if (!passwordRegex.test(trimmedPassword)) {
            return res.status(400).json({
                success: false,
                message: "Password must contain at least one uppercase letter, one lowercase letter, one number and one special character"
            });
        }

        // Password History Check: Cannot reuse current password
        if (user.password) {
            const isSamePassword = await bcrypt.compare(trimmedPassword, user.password);
            if (isSamePassword) {
                return res.status(400).json({
                    success: false,
                    message: "New password cannot be the same as your current password. Please choose a different password."
                });
            }
        }

        // Hash new password
        user.password = await bcrypt.hash(trimmedPassword, 10);
        user.resetPasswordOTP = undefined;
        user.resetPasswordExpires = undefined;

        await user.save();

        res.status(200).json({ success: true, message: "Password reset successful. You can now login." });

    } catch (error) {
        console.error("Reset Password Error:", error);
        res.status(500).json({ success: false, message: "Internal Server Error" });
    }
};

// @desc    Verify OTP
// @route   POST /api/auth/verify-otp
// @access  Public
const verifyOTP = async (req, res) => {
    try {
        const { email, otp } = req.body;

        if (!email || !otp) {
            return res.status(400).json({ success: false, message: "Email and OTP are required" });
        }

        const user = await User.findOne({
            email: email.trim().toLowerCase(),
            resetPasswordOTP: otp.trim(),
            resetPasswordExpires: { $gt: Date.now() }
        });

        if (!user) {
            return res.status(400).json({ success: false, message: "Invalid or expired OTP" });
        }

        res.status(200).json({ success: true, message: "OTP verified successfully" });

    } catch (error) {
        console.error("Verify OTP Error:", error);
        res.status(500).json({ success: false, message: "Internal Server Error" });
    }
};

// @desc    Change Password (Send OTP)
// @route   POST /api/auth/change-password/send-otp
// @access  Private
const sendChangePasswordOTP = async (req, res) => {
    try {
        const userId = req.user.id;
        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        const otp = Math.floor(100000 + Math.random() * 900000).toString();

        console.log(`[DEBUG] Change Password OTP for ${user.email}: ${otp}`);

        // OTP expires in 10 minutes
        user.resetPasswordOTP = otp;
        user.resetPasswordExpires = Date.now() + 10 * 60 * 1000;
        await user.save();

        const sendEmail = require('../utils/sendEmail');
        const message = `You requested a password change. \n\n Your OTP is: ${otp} \n\n It is valid for 10 minutes.`;

        try {
            await sendEmail({
                email: user.email,
                subject: 'Change Password OTP',
                message
            });
            res.status(200).json({ success: true, message: "OTP sent to your registered email" });
        } catch (error) {
            console.error("Email Sending Error:", error);
            user.resetPasswordOTP = undefined;
            user.resetPasswordExpires = undefined;
            await user.save();
            return res.status(500).json({
                success: false,
                message: error?.message ? `Email could not be sent: ${error.message}` : "Email could not be sent"
            });
        }
    } catch (error) {
        console.error("Send Change Password OTP Error:", error);
        res.status(500).json({ success: false, message: "Internal Server Error" });
    }
};

// @desc    Change Password (Verify OTP)
// @route   POST /api/auth/change-password/verify-otp
// @access  Private
const verifyChangePasswordOTP = async (req, res) => {
    try {
        const { otp } = req.body;
        const userId = req.user.id;

        if (!otp) {
            return res.status(400).json({ success: false, message: "OTP is required" });
        }

        const user = await User.findOne({
            _id: userId,
            resetPasswordOTP: otp.trim(),
            resetPasswordExpires: { $gt: Date.now() }
        });

        if (!user) {
            return res.status(400).json({ success: false, message: "Invalid or expired OTP" });
        }

        res.status(200).json({ success: true, message: "OTP verified successfully" });
    } catch (error) {
        console.error("Verify Change Password OTP Error:", error);
        res.status(500).json({ success: false, message: "Internal Server Error" });
    }
};

// @desc    Change Password (Reset)
// @route   POST /api/auth/change-password/reset
// @access  Private
const resetChangePassword = async (req, res) => {
    try {
        const { otp, newPassword, confirmPassword } = req.body;
        const userId = req.user.id;

        if (!otp || !newPassword || !confirmPassword) {
            return res.status(400).json({ success: false, message: "Please provide OTP, new password, and confirm password" });
        }

        const user = await User.findOne({
            _id: userId,
            resetPasswordOTP: otp,
            resetPasswordExpires: { $gt: Date.now() }
        });

        if (!user) {
            return res.status(400).json({ success: false, message: "Invalid or expired OTP" });
        }

        const trimmedPassword = newPassword.trim();
        const trimmedConfirmPassword = confirmPassword.trim();

        if (trimmedPassword !== trimmedConfirmPassword) {
            return res.status(400).json({ success: false, message: "Passwords do not match" });
        }

        if (trimmedPassword.length < 8 || trimmedPassword.length > 20) {
            return res.status(400).json({ success: false, message: "Password must be between 8 and 20 characters" });
        }

        if (/\s/.test(trimmedPassword)) {
            return res.status(400).json({ success: false, message: "Password cannot contain spaces" });
        }

        const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&^#_.+-])[A-Za-z\d@$!%*?&^#_.+-]{8,20}$/;
        if (!passwordRegex.test(trimmedPassword)) {
            return res.status(400).json({
                success: false,
                message: "Password must contain at least one uppercase letter, one lowercase letter, one number and one special character"
            });
        }

        user.password = await bcrypt.hash(trimmedPassword, 10);
        user.resetPasswordOTP = undefined;
        user.resetPasswordExpires = undefined;

        await user.save();

        res.status(200).json({ success: true, message: "Password changed successfully" });

    } catch (error) {
        console.error("Reset Change Password Error:", error);
        res.status(500).json({ success: false, message: "Internal Server Error" });
    }
};

// @desc    Change Email (Send OTP to CURRENT email for identity confirmation)
// @route   POST /api/auth/change-email/send-otp
// @access  Private
const sendChangeEmailOTP = async (req, res) => {
    try {
        const userId = req.user.id;

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        console.log(`[DEBUG] Change Email OTP for ${user.email}: ${otp}`);

        // Store OTP — expires in 10 minutes
        user.changeEmailOTP = otp;
        user.changeEmailExpires = Date.now() + 10 * 60 * 1000;
        await user.save();

        const sendEmail = require('../utils/sendEmail');
        try {
            await sendEmail({
                email: user.email,
                subject: 'Email Change Request — Elora Admin',
                message: `You requested to change your admin account email address.\n\nYour OTP verification code is: ${otp}\n\nThis code is valid for 10 minutes.\n\nIf you did not request this, please ignore this email and your email will remain unchanged.`
            });
            res.status(200).json({ success: true, message: `OTP sent to your current email (${user.email}). Please check your inbox.` });
        } catch (emailError) {
            console.error("Email Sending Error:", emailError);
            user.changeEmailOTP = undefined;
            user.changeEmailExpires = undefined;
            await user.save();
            return res.status(500).json({ success: false, message: "Failed to send OTP email. Please try again." });
        }
    } catch (error) {
        console.error("Send Change Email OTP Error:", error);
        res.status(500).json({ success: false, message: "Internal Server Error" });
    }
};

// @desc    Change Email (Verify OTP, then update to new email)
// @route   POST /api/auth/change-email/verify-otp
// @access  Private
const verifyChangeEmailOTP = async (req, res) => {
    try {
        const { otp, newEmail } = req.body;
        const userId = req.user.id;

        if (!otp || !newEmail) {
            return res.status(400).json({ success: false, message: "OTP and new email are required" });
        }

        const trimmedNewEmail = newEmail.trim().toLowerCase();

        // Validate new email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(trimmedNewEmail)) {
            return res.status(400).json({ success: false, message: "Please enter a valid email address" });
        }

        // Find user and verify OTP
        const user = await User.findOne({
            _id: userId,
            changeEmailOTP: otp.trim(),
            changeEmailExpires: { $gt: Date.now() }
        });

        if (!user) {
            return res.status(400).json({ success: false, message: "Invalid or expired OTP. Please request a new one." });
        }

        if (user.email === trimmedNewEmail) {
            return res.status(400).json({ success: false, message: "New email must be different from your current email" });
        }

        // Check new email is not already taken by another account
        const conflict = await User.findOne({ email: trimmedNewEmail, _id: { $ne: userId } });
        if (conflict) {
            return res.status(400).json({ success: false, message: "This email is already in use by another account" });
        }

        // Update email
        user.email = trimmedNewEmail;
        user.changeEmailOTP = undefined;
        user.changeEmailExpires = undefined;
        await user.save();

        res.status(200).json({ success: true, message: "Email updated successfully!", email: trimmedNewEmail });
    } catch (error) {
        console.error("Verify Change Email OTP Error:", error);
        res.status(500).json({ success: false, message: "Internal Server Error" });
    }
};

// @desc    Authenticate user with Google OAuth (Signup / Signin)
// @route   POST /api/auth/google
// @access  Public
const googleAuth = async (req, res) => {
    try {
        const { credential, access_token } = req.body;

        if (!credential && !access_token) {
            return res.status(400).json({
                success: false,
                message: "Google token is required"
            });
        }

        let name, email, googleId, picture;

        if (credential) {
            // Verify Google ID token (Credential string from Google OAuth)
            const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
            try {
                const ticket = await client.verifyIdToken({
                    idToken: credential,
                    audience: process.env.GOOGLE_CLIENT_ID ? [process.env.GOOGLE_CLIENT_ID] : undefined,
                });
                const payload = ticket.getPayload();
                email = payload.email?.toLowerCase();
                name = payload.name || payload.given_name || "Google User";
                googleId = payload.sub;
                picture = payload.picture || "";
            } catch (err) {
                // Fallback to manual payload decode if verifyIdToken fails without client id check
                const decoded = jwt.decode(credential);
                if (decoded && decoded.email) {
                    email = decoded.email?.toLowerCase();
                    name = decoded.name || "Google User";
                    googleId = decoded.sub;
                    picture = decoded.picture || "";
                } else {
                    return res.status(400).json({
                        success: false,
                        message: "Invalid Google token: " + err.message
                    });
                }
            }
        } else if (access_token) {
            const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));
            const response = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
                headers: { Authorization: `Bearer ${access_token}` }
            });
            if (!response.ok) {
                return res.status(400).json({
                    success: false,
                    message: "Google access token validation failed. Unable to authenticate with Google."
                });
            }
            const googleData = await response.json();
            email = googleData.email?.toLowerCase();
            name = googleData.name || "Google User";
            googleId = googleData.sub;
            picture = googleData.picture || "";
        }

        if (!email) {
            return res.status(400).json({
                success: false,
                message: "Unable to retrieve email from Google Account"
            });
        }

        // Check if user already exists
        let user = await User.findOne({ email });

        if (user) {
            if (user.status === 'Blocked') {
                return res.status(403).json({
                    success: false,
                    message: "Your account has been blocked. Please contact support."
                });
            }

            if (!user.googleId) {
                user.googleId = googleId;
            }
            if (picture && (!user.profileImage || user.profileImage === "")) {
                user.profileImage = picture;
            }
            user.lastLogin = new Date();
            await user.save();
        } else {
            // Register new user via Google
            user = new User({
                name: name.slice(0, 50),
                email,
                googleId,
                authProvider: 'google',
                profileImage: picture,
                emailVerified: true,
                status: 'Active',
                role: 'User'
            });
            await user.save();
        }

        // Issue JWT token
        const payload = {
            id: user._id,
            role: user.role
        };

        const accessToken = jwt.sign(
            payload,
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );

        return res.status(200).json({
            success: true,
            message: "Signed in with Google successfully",
            accessToken,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                profileImage: user.profileImage,
                membership: user.membership
            }
        });

    } catch (error) {
        console.error("Google Auth Error:", error);
        return res.status(500).json({
            success: false,
            message: error.message || "Internal Server Error"
        });
    }
};

// @desc    Send Mobile Login OTP
// @route   POST /api/auth/send-mobile-otp
// @access  Public
const sendMobileOTP = async (req, res) => {
    try {
        const { phone, countryCode } = req.body;

        if (!phone) {
            return res.status(400).json({ success: false, message: "Mobile number is required" });
        }

        const phoneDigits = phone.replace(/\D/g, '');
        if (phoneDigits.length < 7 || phoneDigits.length > 15) {
            return res.status(400).json({ success: false, message: "Please enter a valid phone number (7-15 digits)" });
        }

        // Check if Indian mobile
        if ((countryCode === '+91' || !countryCode) && phoneDigits.length === 10 && !/^[6-9]\d{9}$/.test(phoneDigits)) {
            return res.status(400).json({ success: false, message: "Please enter a valid 10-digit Indian mobile number starting with 6-9" });
        }

        const formattedPhone = countryCode ? `${countryCode}${phoneDigits}` : phoneDigits;

        let user = await User.findOne({
            $or: [
                { phone: formattedPhone },
                { phone: phoneDigits },
                { phone: `+91${phoneDigits}` }
            ]
        });

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "Mobile number is not registered. Please sign up first."
            });
        }

        if (user.status === 'Blocked') {
            return res.status(403).json({
                success: false,
                message: "Your account has been blocked. Please contact support."
            });
        }

        // Cooldown check: 60 seconds rate limit
        if (user.mobileOTPLastSent && (Date.now() - new Date(user.mobileOTPLastSent).getTime()) < 60000) {
            const waitSec = Math.ceil((60000 - (Date.now() - new Date(user.mobileOTPLastSent).getTime())) / 1000);
            return res.status(429).json({
                success: false,
                message: `Please wait ${waitSec} seconds before requesting a new OTP.`
            });
        }

        // Generate 6-digit OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        console.log(`[DEBUG] Mobile Login OTP for ${formattedPhone}: ${otp}`);

        user.mobileOTP = otp;
        user.mobileOTPExpires = Date.now() + 10 * 60 * 1000;
        user.mobileOTPAttempts = 0;
        user.mobileOTPLastSent = new Date();
        await user.save();

        return res.status(200).json({
            success: true,
            message: `OTP sent successfully to ${formattedPhone}`,
            debugOtp: process.env.NODE_ENV !== 'production' ? otp : undefined
        });
    } catch (error) {
        console.error("Send Mobile OTP Error:", error);
        return res.status(500).json({ success: false, message: "Internal Server Error" });
    }
};

// @desc    Verify Mobile Login OTP & Login
// @route   POST /api/auth/verify-mobile-otp
// @access  Public
const verifyMobileOTP = async (req, res) => {
    try {
        const { phone, countryCode, otp } = req.body;

        if (!phone || !otp) {
            return res.status(400).json({ success: false, message: "Mobile number and OTP are required" });
        }

        const trimmedOtp = otp.trim();
        if (trimmedOtp.length !== 6 || !/^\d+$/.test(trimmedOtp)) {
            return res.status(400).json({ success: false, message: "Please enter a valid 6-digit numeric OTP" });
        }

        const phoneDigits = phone.replace(/\D/g, '');
        const formattedPhone = countryCode ? `${countryCode}${phoneDigits}` : phoneDigits;

        let user = await User.findOne({
            $or: [
                { phone: formattedPhone },
                { phone: phoneDigits },
                { phone: `+91${phoneDigits}` }
            ]
        });

        if (!user) {
            return res.status(404).json({ success: false, message: "Mobile number is not registered" });
        }

        if (user.status === 'Blocked') {
            return res.status(403).json({ success: false, message: "Your account has been blocked. Please contact support." });
        }

        // Check active OTP presence & expiration
        if (!user.mobileOTP || !user.mobileOTPExpires || user.mobileOTPExpires < Date.now()) {
            return res.status(400).json({ success: false, message: "OTP has expired or is invalid. Please request a new OTP." });
        }

        // Check max failed attempts (max 5)
        if (user.mobileOTPAttempts >= 5) {
            user.mobileOTP = undefined;
            user.mobileOTPExpires = undefined;
            await user.save();
            return res.status(429).json({
                success: false,
                message: "Maximum OTP verification attempts exceeded. Please request a new OTP."
            });
        }

        // Compare OTP
        if (user.mobileOTP !== trimmedOtp) {
            user.mobileOTPAttempts = (user.mobileOTPAttempts || 0) + 1;
            await user.save();
            const attemptsLeft = 5 - user.mobileOTPAttempts;
            return res.status(400).json({
                success: false,
                message: `Invalid OTP. ${attemptsLeft} attempt(s) remaining.`
            });
        }

        // OTP Verified successfully!
        user.mobileOTP = undefined;
        user.mobileOTPExpires = undefined;
        user.mobileOTPAttempts = 0;
        user.phoneVerified = true;
        user.lastLogin = new Date();
        await user.save();

        if (user.role === 'Admin') {
            return res.status(403).json({
                success: false,
                message: "Admins must use the Admin Portal to sign in."
            });
        }

        const payload = { id: user._id, role: user.role };
        const accessToken = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '7d' });

        return res.status(200).json({
            success: true,
            message: "Mobile OTP login successful",
            accessToken,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                phone: user.phone,
                role: user.role,
                membership: user.membership
            }
        });
    } catch (error) {
        console.error("Verify Mobile OTP Error:", error);
        return res.status(500).json({ success: false, message: "Internal Server Error" });
    }
};

module.exports = {
    signup,
    signin,
    googleAuth,
    forgotPassword,
    verifyOTP,
    resetPassword,
    sendChangePasswordOTP,
    verifyChangePasswordOTP,
    resetChangePassword,
    sendChangeEmailOTP,
    verifyChangeEmailOTP,
    sendMobileOTP,
    verifyMobileOTP
};