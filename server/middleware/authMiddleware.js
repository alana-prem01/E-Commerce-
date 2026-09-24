const jwt = require('jsonwebtoken');
const User = require('../models/UserSchema');

const protect = async (req, res, next) => {
    let token;

    if (
        req.headers.authorization &&
        req.headers.authorization.startsWith('Bearer ')
    ) {
        try {
            // Get token from header
            token = req.headers.authorization.split(' ')[1];

            // Verify token
            const decoded = jwt.verify(token, process.env.JWT_SECRET);

            // Get user from the token
            req.user = await User.findById(decoded.id).select('-password');

            if (!req.user) {
                return res.status(401).json({
                    success: false,
                    message: "User not found"
                });
            }

            if (req.user.status === 'Blocked') {
                return res.status(403).json({
                    success: false,
                    message: "Account disabled during session. Please contact support."
                });
            }

            return next();
        } catch (error) {
            console.error("Auth Middleware Error:", error);
            return res.status(401).json({ success: false, message: "Not authorized, token failed" });
        }
    }

    if (!token) {
        return res.status(401).json({ success: false, message: "Not authorized, no token" });
    }
};

const authorize = (...roles) => {
    return (req, res, next) => {
        if (!req.user || !roles.includes(req.user.role)) {
            return res.status(403).json({ success: false, message: "Forbidden: You do not have permission to access this resource" });
        }
        next();
    };
};

module.exports = { protect, authorize };
