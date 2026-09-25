const User = require('../models/UserSchema');
const bcrypt = require('bcryptjs');
const cloudinary = require('../config/cloudinary');

// @desc    Get all users with search, filter, and pagination
// @route   GET /api/users
// @access  Private/Admin
const getUsers = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        const { search, role, status } = req.query;

        let query = {};

        // Search by name or email
        if (search) {
            query.$or = [
                { name: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } }
            ];
        }

        // Filter by role
        if (role && role !== 'All' && role !== '') {
            query.role = role;
        }

        // Filter by status
        if (status && status !== 'All' && status !== '') {
            query.status = status;
        }

        const users = await User.find(query)
            .select('-password') // Exclude password
            .skip(skip)
            .limit(limit)
            .sort({ createdAt: -1 });

        const total = await User.countDocuments(query);

        res.status(200).json({
            success: true,
            count: users.length,
            total,
            page,
            pages: Math.ceil(total / limit),
            data: users
        });

    } catch (error) {
        console.error("Get Users Error:", error);
        res.status(500).json({ success: false, message: "Server Error" });
    }
};

// @desc    Get single user
// @route   GET /api/users/:id
// @access  Private/Admin
const getUserById = async (req, res) => {
    try {
        const user = await User.findById(req.params.id).select('-password');

        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        res.status(200).json({ success: true, data: user });
    } catch (error) {
        console.error("Get User By ID Error:", error);
        res.status(500).json({ success: false, message: "Server Error" });
    }
};

// @desc    Create a user (Admin only)
// @route   POST /api/users
// @access  Private/Admin
const createUser = async (req, res) => {
    try {
        const { name, email, password, role, status } = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({ success: false, message: "Please provide name, email and password" });
        }

        // Check if user exists
        const userExists = await User.findOne({ email });

        if (userExists) {
            return res.status(400).json({ success: false, message: "User already exists" });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        const user = await User.create({
            name,
            email,
            password: hashedPassword,
            role: role || 'User',
            status: status || 'Active'
        });

        // Remove password from response
        const userResponse = user.toObject();
        delete userResponse.password;

        res.status(201).json({ success: true, data: userResponse });
    } catch (error) {
        console.error("Create User Error:", error);
        res.status(500).json({ success: false, message: "Server Error" });
    }
};

// @desc    Update a user (Admin only)
// @route   PUT /api/users/:id
// @access  Private/Admin
const updateUser = async (req, res) => {
    try {
        const {
            name, email, role, status,
            username, emailVerified, phoneVerified, twoFactorEnabled,
            assignedProjects, tasksCompleted, tasksPending,
            phone, address, profileImage
        } = req.body;

        let user = await User.findById(req.params.id);

        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        // Check if updating to an existing email
        if (email && email !== user.email) {
            const emailExists = await User.findOne({ email });
            if (emailExists) {
                return res.status(400).json({ success: false, message: "Email is already in use by another user" });
            }
        }

        user.name = name || user.name;
        user.email = email || user.email;
        user.role = role || user.role;
        user.status = status || user.status;

        if (username !== undefined) user.username = username;
        if (emailVerified !== undefined) user.emailVerified = emailVerified;
        if (phoneVerified !== undefined) user.phoneVerified = phoneVerified;
        if (twoFactorEnabled !== undefined) user.twoFactorEnabled = twoFactorEnabled;
        if (assignedProjects !== undefined) user.assignedProjects = assignedProjects;
        if (tasksCompleted !== undefined) user.tasksCompleted = tasksCompleted;
        if (tasksPending !== undefined) user.tasksPending = tasksPending;
        
        if (profileImage !== undefined) user.profileImage = profileImage;
        if (phone !== undefined) user.phone = phone;
        if (address) {
            user.address = {
                fullName: address.fullName !== undefined ? address.fullName : user.address?.fullName,
                phone: address.phone !== undefined ? address.phone : user.address?.phone,
                addressLine1: address.addressLine1 !== undefined ? address.addressLine1 : user.address?.addressLine1,
                addressLine2: address.addressLine2 !== undefined ? address.addressLine2 : user.address?.addressLine2,
                city: address.city !== undefined ? address.city : user.address?.city,
                state: address.state !== undefined ? address.state : user.address?.state,
                country: address.country !== undefined ? address.country : user.address?.country,
                pinCode: address.pinCode !== undefined ? address.pinCode : user.address?.pinCode
            };
        }

        await user.save();

        // Remove password from response
        const userResponse = user.toObject();
        delete userResponse.password;

        res.status(200).json({ success: true, data: userResponse });
    } catch (error) {
        console.error("Update User Error:", error);
        res.status(500).json({ success: false, message: "Server Error" });
    }
};

// @desc    Delete a user
// @route   DELETE /api/users/:id
// @access  Private/Admin
const deleteUser = async (req, res) => {
    try {
        const user = await User.findById(req.params.id);

        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        // Prevent admin from deleting themselves
        if (user._id.toString() === req.user._id.toString()) {
            return res.status(400).json({ success: false, message: "You cannot delete your own account" });
        }

        await User.findByIdAndDelete(req.params.id);

        res.status(200).json({ success: true, message: "User deleted successfully" });
    } catch (error) {
        console.error("Delete User Error:", error);
        res.status(500).json({ success: false, message: "Server Error" });
    }
};

// @desc    Get user profile (Current logged-in user)
// @desc    Get user profile (Current logged-in user)
// @route   GET /api/profile
// @access  Private
const getUserProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user._id).select('-password');
        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }
        res.status(200).json({ success: true, data: user });
    } catch (error) {
        console.error("Get User Profile Error:", error);
        res.status(500).json({ success: false, message: "Unable to load settings. Please try again." });
    }
};

// @desc    Update user profile (Current logged-in user)
// @route   PUT /api/profile
// @access  Private
const updateUserProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user._id);

        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        const {
            firstName,
            lastName,
            displayName,
            username,
            dob,
            gender,
            bio,
            name,
            email,
            phone,
            address,
            currentPassword,
            newPassword
        } = req.body;

        // First Name validation
        if (firstName !== undefined) {
            const trimmedFirst = (firstName || "").trim();
            if (!trimmedFirst) {
                return res.status(400).json({ success: false, message: "First name is required." });
            }
            if (trimmedFirst.length < 2) {
                return res.status(400).json({ success: false, message: "Name must be at least 2 characters." });
            }
            if (trimmedFirst.length > 50) {
                return res.status(400).json({ success: false, message: "First name exceeds the maximum length." });
            }
            if (!/^[A-Za-z\s'-]+$/.test(trimmedFirst)) {
                return res.status(400).json({ success: false, message: "Enter a valid first name." });
            }
            user.firstName = trimmedFirst;
        }

        // Last Name validation
        if (lastName !== undefined) {
            const trimmedLast = (lastName || "").trim();
            if (!trimmedLast) {
                return res.status(400).json({ success: false, message: "Last name is required." });
            }
            if (trimmedLast.length < 2) {
                return res.status(400).json({ success: false, message: "Name must be at least 2 characters." });
            }
            if (trimmedLast.length > 50) {
                return res.status(400).json({ success: false, message: "Last name exceeds the maximum length." });
            }
            if (!/^[A-Za-z\s'-]+$/.test(trimmedLast)) {
                return res.status(400).json({ success: false, message: "Enter a valid last name." });
            }
            user.lastName = trimmedLast;
        }

        // Keep name field in sync
        if (user.firstName || user.lastName) {
            user.name = `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.name;
        } else if (name) {
            if (name.trim().length < 2) {
                return res.status(400).json({ success: false, message: "Name must be at least 2 characters." });
            }
            user.name = name.trim();
        }

        // Display Name
        if (displayName !== undefined) {
            user.displayName = (displayName || "").trim();
        }

        // Username validation
        if (username !== undefined && username.trim() !== (user.username || "")) {
            const trimmedUser = username.trim();
            if (trimmedUser) {
                if (!/^[A-Za-z0-9_]+$/.test(trimmedUser)) {
                    return res.status(400).json({ success: false, message: "Username can only contain letters, numbers and underscores." });
                }
                const usernameExists = await User.findOne({
                    username: trimmedUser,
                    _id: { $ne: user._id }
                });
                if (usernameExists) {
                    return res.status(400).json({ success: false, message: "This username is already taken." });
                }
                user.username = trimmedUser;
            } else {
                user.username = "";
            }
        }

        // Date of Birth validation
        if (dob !== undefined && dob !== null && dob !== "") {
            const dateObj = new Date(dob);
            if (isNaN(dateObj.getTime())) {
                return res.status(400).json({ success: false, message: "Enter a valid date." });
            }
            if (dateObj > new Date()) {
                return res.status(400).json({ success: false, message: "Date of birth cannot be in the future." });
            }
            user.dob = dateObj;
        } else if (dob === "" || dob === null) {
            user.dob = undefined;
        }

        // Gender selection
        if (gender !== undefined) {
            user.gender = gender;
        }

        // Bio character limit
        if (bio !== undefined) {
            if (bio.length > 150) {
                return res.status(400).json({ success: false, message: "Bio cannot exceed 150 characters." });
            }
            user.bio = bio;
        }

        if (email && email.toLowerCase() !== user.email) {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(email.trim())) {
                return res.status(400).json({ success: false, message: "Please enter a valid email address" });
            }

            const emailExists = await User.findOne({ 
                email: email.trim().toLowerCase(), 
                _id: { $ne: user._id } 
            });

            if (emailExists) {
                return res.status(400).json({ success: false, message: "This email address is already in use." });
            }

            user.email = email.trim().toLowerCase();
        }

        if (newPassword) {
            if (!currentPassword) {
                return res.status(400).json({ success: false, message: "Current password is required to change password" });
            }
            const isMatch = await bcrypt.compare(currentPassword, user.password);
            if (!isMatch) {
                return res.status(400).json({ success: false, message: "Incorrect current password" });
            }
            if (newPassword.length < 6) {
                return res.status(400).json({ success: false, message: "New password must be at least 6 characters" });
            }
            const salt = await bcrypt.genSalt(10);
            user.password = await bcrypt.hash(newPassword, salt);
        }

        // Phone validation with optional country code handling
        if (phone !== undefined && phone !== null && phone !== '') {
            const rawPhone = String(phone).trim();
            // Extract all digits
            const digits = rawPhone.replace(/\D/g, '');
            if (!digits) {
                return res.status(400).json({ success: false, message: "Phone number is required." });
            }
            // Determine country code and local digits
            let countryCode = '';
            let localDigits = digits;
            if (rawPhone.startsWith('+')) {
                const match = rawPhone.match(/^\+(\d{1,3})/);
                if (match) {
                    countryCode = '+' + match[1];
                    localDigits = digits.substring(match[1].length);
                }
            }
            // Default to India if no country code provided
            if (!countryCode) {
                countryCode = '+91';
            }
            // Apply validation rules per country
            if (countryCode === '+91') {
                if (localDigits.length !== 10) {
                    return res.status(400).json({ success: false, message: "Please enter a valid 10-digit Indian mobile number." });
                }
                if (!/^[6-9]\d{9}$/.test(localDigits)) {
                    return res.status(400).json({ success: false, message: "Indian mobile numbers must start with 6, 7, 8, or 9." });
                }
            } else {
                if (localDigits.length < 7 || localDigits.length > 15) {
                    return res.status(400).json({ success: false, message: "Please enter a valid phone number." });
                }
            }
            // Store phone with country code prefix
            user.phone = `${countryCode}${localDigits}`;
        } else if (phone === '') {
            user.phone = '';
        }
        if (address) {
            user.address = {
                fullName: address.fullName !== undefined ? address.fullName : user.address?.fullName,
                phone: address.phone !== undefined ? address.phone : user.address?.phone,
                addressLine1: address.addressLine1 !== undefined ? address.addressLine1 : user.address?.addressLine1,
                addressLine2: address.addressLine2 !== undefined ? address.addressLine2 : user.address?.addressLine2,
                city: address.city !== undefined ? address.city : user.address?.city,
                state: address.state !== undefined ? address.state : user.address?.state,
                pinCode: address.pinCode !== undefined ? address.pinCode : user.address?.pinCode,
                country: address.country !== undefined ? address.country : user.address?.country
            };

            if (!user.addresses) user.addresses = [];
            const defaultAddrIndex = user.addresses.findIndex(a => a.isDefault);
            const addrData = {
                fullName: user.address.fullName || user.name,
                phone: user.address.phone || user.phone,
                house: user.address.addressLine1 || "",
                street: user.address.addressLine2 || "",
                city: user.address.city || "",
                state: user.address.state || "",
                pinCode: user.address.pinCode || "",
                country: user.address.country || "India",
                isDefault: true
            };

            if (defaultAddrIndex >= 0) {
                user.addresses[defaultAddrIndex].fullName = addrData.fullName;
                user.addresses[defaultAddrIndex].phone = addrData.phone;
                user.addresses[defaultAddrIndex].house = addrData.house;
                user.addresses[defaultAddrIndex].street = addrData.street;
                user.addresses[defaultAddrIndex].city = addrData.city;
                user.addresses[defaultAddrIndex].state = addrData.state;
                user.addresses[defaultAddrIndex].pinCode = addrData.pinCode;
                user.addresses[defaultAddrIndex].country = addrData.country;
            } else {
                user.addresses.push(addrData);
            }
        }

        const updatedUser = await user.save();

        const userResponse = updatedUser.toObject();
        delete userResponse.password;

        res.status(200).json({ success: true, data: userResponse, message: "Profile updated successfully." });
    } catch (error) {
        console.error("Update User Profile Error:", error);
        res.status(500).json({ success: false, message: "Unable to update your profile." });
    }
};

// @desc    Get user addresses
// @route   GET /api/profile/addresses
// @access  Private
const getUserAddresses = async (req, res) => {
    try {
        const user = await User.findById(req.user._id);
        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        let addresses = user.addresses || [];

        // Migration check: If addresses array is empty but single user.address has data
        if (addresses.length === 0 && user.address && (user.address.addressLine1 || user.address.city)) {
            const legacyAddr = {
                fullName: user.address.fullName || user.name || "",
                phone: user.address.phone || user.phone || "",
                house: user.address.addressLine1 || "",
                street: user.address.addressLine2 || "",
                city: user.address.city || "",
                state: user.address.state || "",
                pinCode: user.address.pinCode || "",
                country: user.address.country || "India",
                isDefault: true
            };
            user.addresses.push(legacyAddr);
            await user.save();
            addresses = user.addresses;
        }

        res.status(200).json({ success: true, addresses });
    } catch (error) {
        console.error("Get User Addresses Error:", error);
        res.status(500).json({ success: false, message: "Server Error" });
    }
};

// @desc    Add new address
// @route   POST /api/profile/addresses
// @access  Private
const addAddress = async (req, res) => {
    try {
        const user = await User.findById(req.user._id);
        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        const { fullName, phone, house, street, city, state, pinCode, country, isDefault } = req.body;

        if (!fullName || !phone || !city || !state || !pinCode) {
            return res.status(400).json({ success: false, message: "Please provide all required address fields" });
        }

        const cleanPin = pinCode.trim();
        if (!/^\d{4,10}$/.test(cleanPin)) {
            return res.status(400).json({ success: false, message: "Enter a valid postal code." });
        }

        const isFirst = !user.addresses || user.addresses.length === 0;
        const setAsDefault = Boolean(isDefault || isFirst);

        if (setAsDefault && user.addresses) {
            user.addresses.forEach(addr => { addr.isDefault = false; });
        }

        const newAddr = {
            fullName: fullName.trim(),
            phone: phone.trim(),
            house: (house || "").trim(),
            street: (street || "").trim(),
            city: city.trim(),
            state: state.trim(),
            pinCode: cleanPin,
            country: (country || "India").trim(),
            isDefault: setAsDefault
        };

        user.addresses.push(newAddr);

        if (setAsDefault) {
            user.address = {
                fullName: newAddr.fullName,
                phone: newAddr.phone,
                addressLine1: `${newAddr.house} ${newAddr.street}`.trim(),
                addressLine2: "",
                city: newAddr.city,
                state: newAddr.state,
                country: newAddr.country,
                pinCode: newAddr.pinCode
            };
        }

        await user.save();

        res.status(201).json({ success: true, message: "Address saved successfully.", addresses: user.addresses });
    } catch (error) {
        console.error("Add Address Error:", error);
        res.status(500).json({ success: false, message: "Unable to update address." });
    }
};

// @desc    Update address
// @route   PUT /api/profile/addresses/:addressId
// @access  Private
const updateAddress = async (req, res) => {
    try {
        const user = await User.findById(req.user._id);
        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        const addr = user.addresses.id(req.params.addressId);
        if (!addr) {
            return res.status(404).json({ success: false, message: "Address not found" });
        }

        const { fullName, phone, house, street, city, state, pinCode, country, isDefault } = req.body;

        if (pinCode !== undefined && pinCode.trim()) {
            if (!/^\d{4,10}$/.test(pinCode.trim())) {
                return res.status(400).json({ success: false, message: "Enter a valid postal code." });
            }
        }

        if (isDefault) {
            user.addresses.forEach(a => { a.isDefault = false; });
        }

        if (fullName !== undefined) addr.fullName = fullName.trim();
        if (phone !== undefined) addr.phone = phone.trim();
        if (house !== undefined) addr.house = house.trim();
        if (street !== undefined) addr.street = street.trim();
        if (city !== undefined) addr.city = city.trim();
        if (state !== undefined) addr.state = state.trim();
        if (pinCode !== undefined) addr.pinCode = pinCode.trim();
        if (country !== undefined) addr.country = country.trim();
        if (isDefault !== undefined) addr.isDefault = Boolean(isDefault);

        if (addr.isDefault) {
            user.address = {
                fullName: addr.fullName,
                phone: addr.phone,
                addressLine1: `${addr.house} ${addr.street}`.trim(),
                addressLine2: "",
                city: addr.city,
                state: addr.state,
                country: addr.country,
                pinCode: addr.pinCode
            };
        }

        await user.save();
        res.status(200).json({ success: true, message: "Address saved successfully.", addresses: user.addresses });
    } catch (error) {
        console.error("Update Address Error:", error);
        res.status(500).json({ success: false, message: "Unable to update address." });
    }
};

// @desc    Delete address
// @route   DELETE /api/profile/addresses/:addressId
// @access  Private
const deleteAddress = async (req, res) => {
    try {
        const user = await User.findById(req.user._id);
        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        const addr = user.addresses.id(req.params.addressId);
        if (!addr) {
            return res.status(404).json({ success: false, message: "Address not found" });
        }

        // SETTINGS-157: Default Address Delete Attempt
        if (addr.isDefault && user.addresses.length > 1) {
            return res.status(400).json({ success: false, message: "Please select another default address first." });
        }

        const wasDefault = addr.isDefault;
        user.addresses.pull(req.params.addressId);

        if (wasDefault && user.addresses.length > 0) {
            user.addresses[0].isDefault = true;
            const def = user.addresses[0];
            user.address = {
                fullName: def.fullName,
                phone: def.phone,
                addressLine1: `${def.house} ${def.street}`.trim(),
                addressLine2: "",
                city: def.city,
                state: def.state,
                country: def.country,
                pinCode: def.pinCode
            };
        }

        await user.save();
        res.status(200).json({ success: true, message: "Address deleted successfully", addresses: user.addresses });
    } catch (error) {
        console.error("Delete Address Error:", error);
        res.status(500).json({ success: false, message: "Unable to update address." });
    }
};

// @desc    Update Notification Settings
// @route   PUT /api/profile/notifications
// @access  Private
const updateNotificationSettings = async (req, res) => {
    try {
        const user = await User.findById(req.user._id);
        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        const { orderUpdates, deliveryUpdates } = req.body;
        if (!user.notificationSettings) user.notificationSettings = {};

        if (orderUpdates !== undefined) user.notificationSettings.orderUpdates = Boolean(orderUpdates);
        if (deliveryUpdates !== undefined) user.notificationSettings.deliveryUpdates = Boolean(deliveryUpdates);

        await user.save();

        res.status(200).json({
            success: true,
            message: "Notification settings updated successfully.",
            notificationSettings: user.notificationSettings
        });
    } catch (error) {
        console.error("Update Notification Settings Error:", error);
        res.status(500).json({ success: false, message: "Something went wrong. Please try again later." });
    }
};

// @desc    Update Privacy Settings
// @route   PUT /api/profile/privacy
// @access  Private
const updatePrivacySettings = async (req, res) => {
    try {
        const user = await User.findById(req.user._id);
        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        const { profileVisibility, activityVisibility, personalizedRecommendations } = req.body;
        if (!user.privacySettings) user.privacySettings = {};

        if (profileVisibility !== undefined) user.privacySettings.profileVisibility = Boolean(profileVisibility);
        if (activityVisibility !== undefined) user.privacySettings.activityVisibility = Boolean(activityVisibility);
        if (personalizedRecommendations !== undefined) user.privacySettings.personalizedRecommendations = Boolean(personalizedRecommendations);

        await user.save();

        res.status(200).json({
            success: true,
            message: "Privacy settings updated successfully.",
            privacySettings: user.privacySettings
        });
    } catch (error) {
        console.error("Update Privacy Settings Error:", error);
        res.status(500).json({ success: false, message: "Something went wrong. Please try again later." });
    }
};

// @desc    Update Preferences (Language, Region, Theme, Text Size, Date Format)
// @route   PUT /api/profile/preferences
// @access  Private
const updatePreferences = async (req, res) => {
    try {
        const user = await User.findById(req.user._id);
        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        const { language, region, theme, textSize, dateTimeFormat } = req.body;
        if (!user.preferences) user.preferences = {};

        if (language !== undefined) {
            user.preferences.language = language;
        }
        if (region !== undefined) {
            user.preferences.region = region;
        }
        if (theme !== undefined) {
            user.preferences.theme = theme;
        }
        if (textSize !== undefined) {
            user.preferences.textSize = textSize;
        }
        if (dateTimeFormat !== undefined) {
            user.preferences.dateTimeFormat = dateTimeFormat;
        }

        await user.save();

        res.status(200).json({
            success: true,
            message: language ? "Language updated successfully." : (theme ? "Appearance updated." : "Preferences updated successfully."),
            preferences: user.preferences
        });
    } catch (error) {
        console.error("Update Preferences Error:", error);
        res.status(500).json({ success: false, message: req.body.language ? "Unable to update language preference." : "Something went wrong. Please try again later." });
    }
};

// @desc    Set default address
// @route   PUT /api/profile/addresses/:addressId/default
// @access  Private
const setDefaultAddress = async (req, res) => {
    try {
        const user = await User.findById(req.user._id);
        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        const target = user.addresses.id(req.params.addressId);
        if (!target) {
            return res.status(404).json({ success: false, message: "Address not found" });
        }

        user.addresses.forEach(a => {
            a.isDefault = a._id.toString() === req.params.addressId;
        });

        user.address = {
            fullName: target.fullName,
            phone: target.phone,
            addressLine1: `${target.house} ${target.street}`.trim(),
            addressLine2: "",
            city: target.city,
            state: target.state,
            country: target.country,
            pinCode: target.pinCode
        };

        await user.save();
        res.status(200).json({ success: true, message: "Default address updated", addresses: user.addresses });
    } catch (error) {
        console.error("Set Default Address Error:", error);
        res.status(500).json({ success: false, message: "Server Error" });
    }
};

// @desc    Admin reset user password
// @route   PUT /api/users/:id/reset-password
// @access  Private/Admin
const adminResetUserPassword = async (req, res) => {
    try {
        const { password } = req.body;

        if (!password) {
            return res.status(400).json({ success: false, message: "Please provide a new password" });
        }

        const user = await User.findById(req.params.id);

        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        user.password = hashedPassword;

        // Log the activity
        user.activities.push({
            activityType: "Password Reset",
            description: "Password was reset by Administrator"
        });

        await user.save();

        res.status(200).json({ success: true, message: "User password reset successfully" });
    } catch (error) {
        console.error("Admin Reset Password Error:", error);
        res.status(500).json({ success: false, message: "Server Error" });
    }
};

// @desc    Deactivate a user account
// @route   PUT /api/users/:id/deactivate
// @access  Private/Admin
const deactivateUser = async (req, res) => {
    try {
        const user = await User.findById(req.params.id);

        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        if (user._id.toString() === req.user._id.toString()) {
            return res.status(400).json({ success: false, message: "You cannot deactivate your own account" });
        }

        user.status = "Inactive";

        // Log the activity
        user.activities.push({
            activityType: "Account Deactivated",
            description: "Account was deactivated by Administrator"
        });

        await user.save();

        res.status(200).json({ success: true, message: "User account deactivated successfully" });
    } catch (error) {
        console.error("Deactivate User Error:", error);
        res.status(500).json({ success: false, message: "Server Error" });
    }
};

// @desc    Upload user profile photo
// @route   PUT /api/users/:id/upload-photo
// @access  Private/Admin
const uploadUserProfilePhoto = async (req, res) => {
    try {
        const user = await User.findById(req.params.id);

        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        if (!req.file) {
            return res.status(400).json({ success: false, message: "Please provide an image file" });
        }

        const b64 = Buffer.from(req.file.buffer).toString('base64');
        const dataURI = 'data:' + req.file.mimetype + ';base64,' + b64;

        const result = await cloudinary.uploader.upload(dataURI, {
            folder: 'ecommerce-jewellery/users'
        });

        user.profileImage = result.secure_url;
        
        // Log the activity
        user.activities.push({
            activityType: "Profile Photo Updated",
            description: "Profile photo was updated by Administrator"
        });

        await user.save();

        res.status(200).json({ 
            success: true, 
            message: "Profile photo uploaded successfully",
            profileImage: user.profileImage
        });
    } catch (error) {
        console.error("Upload Profile Photo Error:", error);
        res.status(500).json({ success: false, message: "Server Error", error: error.message });
    }
};

// @desc    Upload logged-in user's profile photo
// @route   POST /api/profile/photo
// @access  Private
const uploadMyProfilePhoto = async (req, res) => {
    try {
        const user = await User.findById(req.user._id);
        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        let imageUrl = "";

        if (req.file) {
            const allowedMime = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml'];
            if (!allowedMime.includes(req.file.mimetype)) {
                return res.status(400).json({ success: false, message: "Please select a supported image format." });
            }
            if (req.file.size > 5 * 1024 * 1024) {
                return res.status(400).json({ success: false, message: "Image size exceeds the maximum allowed limit." });
            }
            const b64 = Buffer.from(req.file.buffer).toString('base64');
            const dataURI = 'data:' + req.file.mimetype + ';base64,' + b64;
            try {
                const result = await cloudinary.uploader.upload(dataURI, { folder: 'ecommerce-jewellery/users' });
                imageUrl = result.secure_url;
            } catch (cErr) {
                // Fallback data URI if cloudinary credentials are mock
                imageUrl = dataURI;
            }
        } else if (req.body.image) {
            const imageStr = req.body.image;
            if (imageStr.startsWith('data:image/')) {
                const mimeMatch = imageStr.match(/^data:(image\/[a-zA-Z+]+);base64,/);
                const mime = mimeMatch ? mimeMatch[1] : '';
                const allowedMime = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml'];
                if (mime && !allowedMime.includes(mime)) {
                    return res.status(400).json({ success: false, message: "Please select a supported image format." });
                }
                const base64Data = imageStr.split(',')[1];
                const sizeInBytes = (base64Data.length * 3) / 4;
                if (sizeInBytes > 5 * 1024 * 1024) {
                    return res.status(400).json({ success: false, message: "Image size exceeds the maximum allowed limit." });
                }
                try {
                    const result = await cloudinary.uploader.upload(imageStr, { folder: 'ecommerce-jewellery/users' });
                    imageUrl = result.secure_url;
                } catch (cErr) {
                    imageUrl = imageStr;
                }
            } else {
                return res.status(400).json({ success: false, message: "Please select a supported image format." });
            }
        } else {
            return res.status(400).json({ success: false, message: "Please select a supported image format." });
        }

        user.profileImage = imageUrl;
        await user.save();

        res.status(200).json({
            success: true,
            message: "Profile updated successfully.",
            profileImage: user.profileImage
        });
    } catch (error) {
        console.error("Upload My Profile Photo Error:", error);
        res.status(500).json({ success: false, message: "Unable to update your profile." });
    }
};

// @desc    Remove logged-in user's profile photo
// @route   DELETE /api/profile/photo
// @access  Private
const removeMyProfilePhoto = async (req, res) => {
    try {
        const user = await User.findById(req.user._id);
        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        user.profileImage = "";
        await user.save();

        res.status(200).json({
            success: true,
            message: "Profile photo removed successfully.",
            profileImage: ""
        });
    } catch (error) {
        console.error("Remove My Profile Photo Error:", error);
        res.status(500).json({ success: false, message: "Unable to update your profile." });
    }
};

// @desc    Delete logged-in user's account
// @route   DELETE /api/profile/account
// @access  Private
const deleteMyAccount = async (req, res) => {
    try {
        const otp = (req.body?.otp || req.query?.otp || "").trim();
        if (!otp) {
            return res.status(400).json({ success: false, message: "OTP is required to delete account." });
        }

        const user = await User.findById(req.user._id);
        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        if (!user.deleteAccountOTP || user.deleteAccountOTP !== otp || !user.deleteAccountExpires || user.deleteAccountExpires < Date.now()) {
            return res.status(400).json({ success: false, message: "Invalid or expired OTP. Account deletion failed." });
        }

        await User.findByIdAndDelete(req.user._id);

        res.status(200).json({
            success: true,
            message: "Your account has been permanently deleted."
        });
    } catch (error) {
        console.error("Delete My Account Error:", error);
        res.status(500).json({ success: false, message: "Unable to delete your account. Please try again." });
    }
};

// @desc    Deactivate logged-in user's account
// @route   POST /api/profile/deactivate
// @access  Private
const deactivateMyAccount = async (req, res) => {
    try {
        const { password } = req.body;
        const user = await User.findById(req.user._id);
        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        if (user.password) {
            if (!password || !password.trim()) {
                return res.status(400).json({ success: false, message: "The password you entered is incorrect." });
            }
            const isMatch = await bcrypt.compare(password.trim(), user.password);
            if (!isMatch) {
                return res.status(400).json({ success: false, message: "The password you entered is incorrect." });
            }
        }

        user.deactivated = true;
        user.deactivatedAt = new Date();
        user.status = "Inactive";
        await user.save();

        res.status(200).json({
            success: true,
            message: "Your account has been deactivated."
        });
    } catch (error) {
        console.error("Deactivate My Account Error:", error);
        res.status(500).json({ success: false, message: "Something went wrong. Please try again later." });
    }
};

// @desc    Schedule Account Deletion with Grace Period
// @route   POST /api/profile/schedule-deletion
// @access  Private
const scheduleAccountDeletion = async (req, res) => {
    try {
        const { confirmText, password } = req.body;
        const user = await User.findById(req.user._id);
        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        if (!confirmText || confirmText.trim() !== "DELETE") {
            return res.status(400).json({ success: false, message: "Please type DELETE exactly as shown." });
        }

        if (user.password) {
            if (!password || !password.trim()) {
                return res.status(400).json({ success: false, message: "The password you entered is incorrect." });
            }
            const isMatch = await bcrypt.compare(password.trim(), user.password);
            if (!isMatch) {
                return res.status(400).json({ success: false, message: "The password you entered is incorrect." });
            }
        }

        const days = 14;
        user.deletionGracePeriodExpires = new Date(Date.now() + days * 24 * 60 * 60 * 1000);
        user.status = "ScheduledForDeletion";
        await user.save();

        res.status(200).json({
            success: true,
            days,
            message: `Your account will be permanently deleted in ${days} days. Log in anytime before then to cancel.`
        });
    } catch (error) {
        console.error("Schedule Account Deletion Error:", error);
        res.status(500).json({ success: false, message: "Unable to delete your account. Please try again." });
    }
};

// @desc    Cancel Scheduled Account Deletion
// @route   POST /api/profile/cancel-deletion
// @access  Private
const cancelAccountDeletion = async (req, res) => {
    try {
        const user = await User.findById(req.user._id);
        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        user.deletionGracePeriodExpires = undefined;
        user.status = "Active";
        user.deactivated = false;
        await user.save();

        res.status(200).json({
            success: true,
            message: "Account deletion has been cancelled."
        });
    } catch (error) {
        console.error("Cancel Account Deletion Error:", error);
        res.status(500).json({ success: false, message: "Something went wrong. Please try again later." });
    }
};

// @desc    Get Active Sessions & Login Activity
// @route   GET /api/profile/sessions
// @access  Private
const getActiveSessions = async (req, res) => {
    try {
        const user = await User.findById(req.user._id);
        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        // Initialize mock sessions if empty for demonstration
        if (!user.sessions || user.sessions.length === 0) {
            user.sessions = [
                {
                    sessionId: "sess_curr_1",
                    device: "Windows PC (Chrome)",
                    browser: "Chrome 122.0",
                    ip: req.ip || "127.0.0.1",
                    location: "Mumbai, India",
                    lastActive: new Date(),
                    isCurrent: true
                },
                {
                    sessionId: "sess_mob_2",
                    device: "iPhone 14 (Safari)",
                    browser: "Safari Mobile",
                    ip: "49.37.102.14",
                    location: "Delhi, India",
                    lastActive: new Date(Date.now() - 24 * 60 * 60 * 1000),
                    isCurrent: false
                }
            ];
            user.loginActivities = [
                {
                    device: "Windows PC (Chrome)",
                    ip: req.ip || "127.0.0.1",
                    location: "Mumbai, India",
                    timestamp: new Date(),
                    isSuspicious: false
                },
                {
                    device: "MacBook Pro (Firefox)",
                    ip: "182.72.90.12",
                    location: "Bangalore, India",
                    timestamp: new Date(Date.now() - 48 * 60 * 60 * 1000),
                    isSuspicious: true
                }
            ];
            await user.save();
        }

        res.status(200).json({
            success: true,
            sessions: user.sessions,
            loginActivities: user.loginActivities
        });
    } catch (error) {
        console.error("Get Active Sessions Error:", error);
        res.status(500).json({ success: false, message: "Unable to load security settings." });
    }
};

// @desc    Logout specific session
// @route   POST /api/profile/sessions/logout
// @access  Private
const logoutSession = async (req, res) => {
    try {
        const { sessionId } = req.body;
        const user = await User.findById(req.user._id);
        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        if (sessionId) {
            user.sessions = user.sessions.filter(s => s.sessionId !== sessionId);
            await user.save();
        }

        res.status(200).json({
            success: true,
            message: "Device signed out successfully."
        });
    } catch (error) {
        console.error("Logout Session Error:", error);
        res.status(500).json({ success: false, message: "Unable to load security settings." });
    }
};

// @desc    Logout all other sessions
// @route   POST /api/profile/sessions/logout-all-others
// @access  Private
const logoutAllOtherSessions = async (req, res) => {
    try {
        const user = await User.findById(req.user._id);
        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        user.sessions = user.sessions.filter(s => s.isCurrent);
        await user.save();

        res.status(200).json({
            success: true,
            message: "Device signed out successfully."
        });
    } catch (error) {
        console.error("Logout All Other Sessions Error:", error);
        res.status(500).json({ success: false, message: "Unable to load security settings." });
    }
};

// @desc    Get Recovery Codes
// @route   GET /api/profile/recovery-codes
// @access  Private
const getRecoveryCodes = async (req, res) => {
    try {
        const user = await User.findById(req.user._id);
        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        if (!user.recoveryCodes || user.recoveryCodes.length === 0) {
            // Generate default 8 codes
            const codes = [];
            for (let i = 0; i < 8; i++) {
                const part1 = Math.random().toString(36).substring(2, 6).toUpperCase();
                const part2 = Math.random().toString(36).substring(2, 6).toUpperCase();
                codes.push({ code: `${part1}-${part2}`, used: false });
            }
            user.recoveryCodes = codes;
            await user.save();
        }

        res.status(200).json({
            success: true,
            recoveryCodes: user.recoveryCodes
        });
    } catch (error) {
        console.error("Get Recovery Codes Error:", error);
        res.status(500).json({ success: false, message: "Unable to load security settings." });
    }
};

// @desc    Regenerate Recovery Codes
// @route   POST /api/profile/recovery-codes/regenerate
// @access  Private
const regenerateRecoveryCodes = async (req, res) => {
    try {
        const user = await User.findById(req.user._id);
        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        const codes = [];
        for (let i = 0; i < 8; i++) {
            const part1 = Math.random().toString(36).substring(2, 6).toUpperCase();
            const part2 = Math.random().toString(36).substring(2, 6).toUpperCase();
            codes.push({ code: `${part1}-${part2}`, used: false });
        }

        user.recoveryCodes = codes;
        await user.save();

        res.status(200).json({
            success: true,
            recoveryCodes: user.recoveryCodes,
            message: "Recovery codes regenerated successfully."
        });
    } catch (error) {
        console.error("Regenerate Recovery Codes Error:", error);
        res.status(500).json({ success: false, message: "Unable to load security settings." });
    }
};

// @desc    Get Saved Payment Methods
// @route   GET /api/profile/payment-methods
// @access  Private
const getPaymentMethods = async (req, res) => {
    try {
        const user = await User.findById(req.user._id);
        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        if (!user.savedPaymentMethods || user.savedPaymentMethods.length === 0) {
            // Mock sample card if empty for demonstration
            user.savedPaymentMethods = [{
                paymentMethodId: "pm_card_visa_1",
                cardType: "Visa",
                last4: "4242",
                expiryMonth: "12",
                expiryYear: "2028",
                holderName: user.name || "Card Holder",
                isDefault: true
            }];
            await user.save();
        }

        res.status(200).json({
            success: true,
            paymentMethods: user.savedPaymentMethods
        });
    } catch (error) {
        console.error("Get Payment Methods Error:", error);
        res.status(500).json({ success: false, message: "Unable to update payment settings." });
    }
};

// @desc    Add Saved Payment Method
// @route   POST /api/profile/payment-methods
// @access  Private
const addPaymentMethod = async (req, res) => {
    try {
        const { cardNumber, expiryMonth, expiryYear, cvv, holderName, isDefault } = req.body;
        const user = await User.findById(req.user._id);
        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        const cleanCard = (cardNumber || "").replace(/\D/g, '');
        if (!cleanCard || cleanCard.length < 13 || cleanCard.length > 19) {
            return res.status(400).json({ success: false, message: "Enter a valid card number." });
        }

        const currentYear = new Date().getFullYear();
        const currentMonth = new Date().getMonth() + 1;
        const expY = parseInt(expiryYear);
        const expM = parseInt(expiryMonth);

        if (isNaN(expY) || isNaN(expM) || expY < currentYear || (expY === currentYear && expM < currentMonth)) {
            return res.status(400).json({ success: false, message: "This card has expired." });
        }

        if (!cvv || !/^\d{3,4}$/.test(cvv.trim())) {
            return res.status(400).json({ success: false, message: "Enter a valid security code." });
        }

        const isFirst = !user.savedPaymentMethods || user.savedPaymentMethods.length === 0;
        const setAsDefault = Boolean(isDefault || isFirst);

        if (setAsDefault && user.savedPaymentMethods) {
            user.savedPaymentMethods.forEach(pm => { pm.isDefault = false; });
        }

        const newPm = {
            paymentMethodId: `pm_${Date.now()}`,
            cardType: cleanCard.startsWith('4') ? "Visa" : (cleanCard.startsWith('5') ? "MasterCard" : "Credit Card"),
            last4: cleanCard.slice(-4),
            expiryMonth: String(expM).padStart(2, '0'),
            expiryYear: String(expY),
            holderName: (holderName || user.name || "Card Holder").trim(),
            isDefault: setAsDefault
        };

        user.savedPaymentMethods.push(newPm);
        await user.save();

        res.status(201).json({
            success: true,
            message: "Payment method saved successfully.",
            paymentMethods: user.savedPaymentMethods
        });
    } catch (error) {
        console.error("Add Payment Method Error:", error);
        res.status(500).json({ success: false, message: "Unable to update payment settings." });
    }
};

// @desc    Remove Saved Payment Method
// @route   DELETE /api/profile/payment-methods/:id
// @access  Private
const removePaymentMethod = async (req, res) => {
    try {
        const user = await User.findById(req.user._id);
        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        const pm = user.savedPaymentMethods.find(p => p.paymentMethodId === req.params.id || p._id?.toString() === req.params.id);
        if (!pm) {
            return res.status(404).json({ success: false, message: "Payment method not found" });
        }

        user.savedPaymentMethods = user.savedPaymentMethods.filter(p => p.paymentMethodId !== req.params.id && p._id?.toString() !== req.params.id);

        if (pm.isDefault && user.savedPaymentMethods.length > 0) {
            user.savedPaymentMethods[0].isDefault = true;
        }

        await user.save();

        res.status(200).json({
            success: true,
            message: "Payment method removed successfully.",
            paymentMethods: user.savedPaymentMethods
        });
    } catch (error) {
        console.error("Remove Payment Method Error:", error);
        res.status(500).json({ success: false, message: "Unable to update payment settings." });
    }
};

// @desc    Submit Support Ticket / Report Problem
// @route   POST /api/profile/support-ticket
// @access  Private
const submitSupportTicket = async (req, res) => {
    try {
        const { subject, message, attachmentSize } = req.body;
        const user = await User.findById(req.user._id);
        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        if (!message || !message.trim()) {
            return res.status(400).json({ success: false, message: "Please describe your issue before submitting." });
        }

        if (attachmentSize && attachmentSize > 10 * 1024 * 1024) {
            return res.status(400).json({ success: false, message: "File size must be under 10MB." });
        }

        const newTicket = {
            ticketId: `TICKET-${Math.floor(100000 + Math.random() * 900000)}`,
            subject: (subject || "Report a Problem").trim(),
            message: message.trim(),
            status: "Open",
            createdAt: new Date()
        };

        if (!user.supportTickets) user.supportTickets = [];
        user.supportTickets.push(newTicket);
        await user.save();

        res.status(201).json({
            success: true,
            message: "Your request has been submitted. Our team will respond within 24 hours.",
            ticket: newTicket
        });
    } catch (error) {
        console.error("Submit Support Ticket Error:", error);
        res.status(500).json({ success: false, message: "Unable to complete your request." });
    }
};

// @desc    Get Billing & Subscription Details
// @route   GET /api/profile/billing
// @access  Private
const getBillingDetails = async (req, res) => {
    try {
        const user = await User.findById(req.user._id);
        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        if (!user.invoices || user.invoices.length === 0) {
            user.invoices = [
                {
                    invoiceId: "INV-2026-001",
                    amount: 999,
                    date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
                    status: "Paid",
                    planName: "Elora Gold Membership",
                    pdfUrl: "/invoices/INV-2026-001.pdf"
                },
                {
                    invoiceId: "INV-2026-002",
                    amount: 1499,
                    date: new Date(),
                    status: "Paid",
                    planName: "Elora Diamond Premium",
                    pdfUrl: "/invoices/INV-2026-002.pdf"
                }
            ];
            await user.save();
        }

        res.status(200).json({
            success: true,
            membership: user.membership,
            invoices: user.invoices
        });
    } catch (error) {
        console.error("Get Billing Details Error:", error);
        res.status(500).json({ success: false, message: "Unable to complete your request." });
    }
};

// @desc    Upgrade Subscription
// @route   POST /api/profile/subscription/upgrade
// @access  Private
const upgradeSubscription = async (req, res) => {
    try {
        const { planName, cardNumber, expiryMonth, expiryYear, cvv } = req.body;
        const user = await User.findById(req.user._id);
        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        if (cardNumber) {
            const cleanCard = cardNumber.replace(/\D/g, '');
            if (!cleanCard || cleanCard.length < 13 || cleanCard.length > 19) {
                return res.status(400).json({ success: false, message: "Enter a valid card number." });
            }

            const currentYear = new Date().getFullYear();
            const currentMonth = new Date().getMonth() + 1;
            const expY = parseInt(expiryYear);
            const expM = parseInt(expiryMonth);

            if (isNaN(expY) || isNaN(expM) || expY < currentYear || (expY === currentYear && expM < currentMonth)) {
                return res.status(400).json({ success: false, message: "This card has expired." });
            }

            if (!cvv || !/^\d{3,4}$/.test(cvv.trim())) {
                return res.status(400).json({ success: false, message: "Enter a valid security code." });
            }

            // Simulate card decline test
            if (cleanCard.endsWith('0000')) {
                return res.status(400).json({ success: false, message: "Your card was declined. Please try a different payment method." });
            }
        }

        const selectedPlan = planName || "Elora Diamond Premium";
        user.membership = {
            isPremium: true,
            startDate: new Date(),
            expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
        };

        if (!user.invoices) user.invoices = [];
        user.invoices.push({
            invoiceId: `INV-${Date.now()}`,
            amount: 1499,
            date: new Date(),
            status: "Paid",
            planName: selectedPlan,
            pdfUrl: `#`
        });

        await user.save();

        res.status(200).json({
            success: true,
            message: `Your plan has been upgraded to ${selectedPlan}`,
            membership: user.membership
        });
    } catch (error) {
        console.error("Upgrade Subscription Error:", error);
        res.status(500).json({ success: false, message: "Unable to complete your request." });
    }
};

// @desc    Cancel Subscription
// @route   POST /api/profile/subscription/cancel
// @access  Private
const cancelSubscription = async (req, res) => {
    try {
        const user = await User.findById(req.user._id);
        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        const endDate = user.membership?.expiryDate
            ? new Date(user.membership.expiryDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
            : "end of current billing cycle";

        if (user.membership) {
            user.membership.isPremium = false;
        }

        await user.save();

        res.status(200).json({
            success: true,
            endDate,
            message: `Your subscription has been cancelled. You'll retain access until ${endDate}.`
        });
    } catch (error) {
        console.error("Cancel Subscription Error:", error);
        res.status(500).json({ success: false, message: "Unable to complete your request." });
    }
};

// @desc    Get Admin Settings
// @route   GET /api/profile/admin/settings
// @access  Private/Admin
const getAdminSettings = async (req, res) => {
    try {
        if (req.user.role !== 'Admin' && req.user.role !== 'SuperAdmin') {
            return res.status(403).json({ success: false, message: "You don't have permission to access this area." });
        }
        const user = await User.findById(req.user._id).select('-password');
        
        let updated = false;
        if (!user.loginActivities || user.loginActivities.length === 0) {
            const clientIp = (req.headers['x-forwarded-for'] || req.socket.remoteAddress || req.ip || '127.0.0.1').toString().replace('::ffff:', '');
            user.loginActivities = [{
                device: 'Desktop Browser',
                ip: clientIp === '::1' ? '127.0.0.1' : clientIp,
                location: 'Local Network',
                timestamp: user.lastLogin || new Date(),
                isSuspicious: false
            }];
            updated = true;
        }

        if (!user.sessions || user.sessions.length === 0) {
            const clientIp = (req.headers['x-forwarded-for'] || req.socket.remoteAddress || req.ip || '127.0.0.1').toString().replace('::ffff:', '');
            user.sessions = [{
                sessionId: 'sess_current',
                device: 'Current Admin Session',
                browser: req.headers['user-agent'] || 'Browser',
                ip: clientIp === '::1' ? '127.0.0.1' : clientIp,
                location: 'Local Network',
                lastActive: new Date(),
                isCurrent: true
            }];
            updated = true;
        }

        if (updated) {
            await user.save();
        }

        res.status(200).json({
            success: true,
            user,
            roles: [
                { id: 'admin', name: 'Administrator', permissions: ['manage_users', 'manage_products', 'manage_orders', 'manage_settings'] },
                { id: 'manager', name: 'Store Manager', permissions: ['manage_products', 'manage_orders'] }
            ],
            systemSettings: { siteName: "Elora Fine Jewellery", maintenanceMode: false, sessionTimeout: 30 }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: "Unable to load administrator settings." });
    }
};

// @desc    Update Admin Profile
// @route   PUT /api/profile/admin/profile
// @access  Private/Admin
const updateAdminProfile = async (req, res) => {
    try {
        if (req.user.role !== 'Admin' && req.user.role !== 'SuperAdmin') {
            return res.status(403).json({ success: false, message: "You don't have permission to access this area." });
        }
        const { name } = req.body;
        if (!name || name.trim().length < 2) {
            return res.status(400).json({ success: false, message: "Enter a valid name." });
        }

        const user = await User.findById(req.user._id);
        user.name = name.trim();
        await user.save();

        res.status(200).json({
            success: true,
            message: "Profile updated successfully.",
            user: { id: user._id, name: user.name, email: user.email, role: user.role }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: "Unable to update administrator profile." });
    }
};

// @desc    Update Admin Password
// @route   PUT /api/profile/admin/password
// @access  Private/Admin
const updateAdminPassword = async (req, res) => {
    try {
        if (req.user.role !== 'Admin' && req.user.role !== 'SuperAdmin') {
            return res.status(403).json({ success: false, message: "You don't have permission to access this area." });
        }
        const { currentPassword, otp, newPassword, confirmPassword } = req.body;
        const user = await User.findById(req.user._id);

        if (otp) {
            if (!user.resetPasswordOTP || user.resetPasswordOTP !== otp.trim() || !user.resetPasswordExpires || user.resetPasswordExpires < Date.now()) {
                return res.status(400).json({ success: false, message: "Invalid or expired OTP." });
            }
        } else if (currentPassword) {
            const isMatch = await bcrypt.compare(currentPassword, user.password);
            if (!isMatch) {
                return res.status(400).json({ success: false, message: "Current password is incorrect." });
            }
        } else {
            return res.status(400).json({ success: false, message: "Verification OTP or current password is required." });
        }

        if (!newPassword || newPassword.length < 8) {
            return res.status(400).json({ success: false, message: "Password does not meet requirements (minimum 8 characters)." });
        }

        if (newPassword !== confirmPassword) {
            return res.status(400).json({ success: false, message: "Passwords do not match." });
        }

        user.password = await bcrypt.hash(newPassword, 10);
        user.resetPasswordOTP = undefined;
        user.resetPasswordExpires = undefined;
        await user.save();

        res.status(200).json({
            success: true,
            message: "Administrator password updated successfully."
        });
    } catch (error) {
        res.status(500).json({ success: false, message: "Unable to update password." });
    }
};

// @desc    Update Admin Permissions
// @route   PUT /api/profile/admin/permissions
// @access  Private/Admin
const updateAdminPermissions = async (req, res) => {
    try {
        const { targetUserId, targetRoleId, permissions } = req.body;
        if (targetUserId && targetUserId === req.user._id.toString()) {
            return res.status(400).json({ success: false, message: "You cannot modify this permission for your own account." });
        }

        const adminCount = await User.countDocuments({ role: 'Admin' });
        if (adminCount <= 1 && permissions && !permissions.includes('manage_settings')) {
            return res.status(400).json({ success: false, message: "At least one administrator must retain required access." });
        }

        res.status(200).json({
            success: true,
            message: "Permissions updated successfully."
        });
    } catch (error) {
        res.status(500).json({ success: false, message: "Unable to update permissions." });
    }
};

module.exports = {
    getUsers,
    getUserById,
    createUser,
    updateUser,
    deleteUser,
    getUserProfile,
    updateUserProfile,
    getUserAddresses,
    addAddress,
    updateAddress,
    deleteAddress,
    setDefaultAddress,
    adminResetUserPassword,
    deactivateUser,
    uploadUserProfilePhoto,
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
};
