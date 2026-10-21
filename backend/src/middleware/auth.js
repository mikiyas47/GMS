const jwt = require('jsonwebtoken');
const { User } = require('../models');

const JWT_SECRET = process.env.JWT_SECRET || 'gym_super_secure_jwt_token_secret_key_2026';

/**
 * Authenticates staff JWT token and populates req.user
 */
async function authenticate(req, res, next) {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({
                success: false,
                message: 'Authentication required. No Bearer token provided.'
            });
        }

        const token = authHeader.split(' ')[1];
        let decoded;
        try {
            decoded = jwt.verify(token, JWT_SECRET);
        } catch (jwtErr) {
            return res.status(401).json({
                success: false,
                message: 'Invalid or expired session token.'
            });
        }

        const user = await User.findById(decoded.id).select('full_name email role is_active');
        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Account not found. Please log in again.'
            });
        }

        if (!user.is_active) {
            return res.status(403).json({
                success: false,
                message: 'Your staff account has been deactivated. Contact an administrator.'
            });
        }

        req.user = {
            id: user._id,
            full_name: user.full_name,
            email: user.email,
            role: user.role
        };

        next();
    } catch (err) {
        next(err);
    }
}

/**
 * Authorizes specific staff roles (e.g. ['admin'], or ['admin', 'receptionist'])
 */
function authorize(roles = []) {
    if (typeof roles === 'string') {
        roles = [roles];
    }

    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: 'Unauthorized. Authentication required.'
            });
        }

        if (roles.length > 0 && !roles.includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                message: `Access denied. Requires one of: ${roles.join(', ')} (Your role: ${req.user.role})`
            });
        }

        next();
    };
}

module.exports = {
    authenticate,
    authorize,
    JWT_SECRET
};
