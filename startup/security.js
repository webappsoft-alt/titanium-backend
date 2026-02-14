const rateLimit = require('express-rate-limit');
const mongoSanitize = require('express-mongo-sanitize');
const hpp = require('hpp');

// --- Global Rate Limiter (DDoS protection) ---
const globalLimiter = rateLimit({
    windowMs: 10 * 60 * 1000, // 15 minutes
    max: 200, // limit each IP to 200 requests per window
    standardHeaders: true,
    legacyHeaders: false,
    message: { message: 'Too many requests, please try again later.' },
    keyGenerator: (req) => {
        const forwarded = req.headers['x-forwarded-for'];
        const ip = forwarded ? forwarded.split(',')[0].trim() : req.socket.remoteAddress;
        return ip;
    }
});

// --- Strict Rate Limiter for Auth Routes (brute-force protection) ---
const authLimiter = rateLimit({
    windowMs: 10 * 60 * 1000, // 15 minutes
    max: 15, // limit each IP to 15 login/register attempts per window
    standardHeaders: true,
    legacyHeaders: false,
    message: { message: 'Too many authentication attempts, please try again after 15 minutes.' },
    keyGenerator: (req) => {
        const forwarded = req.headers['x-forwarded-for'];
        const ip = forwarded ? forwarded.split(',')[0].trim() : req.socket.remoteAddress;
        return ip;
    }
});

// --- Password Reset Rate Limiter ---
const passwordResetLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 5, // 5 password reset requests per hour
    standardHeaders: true,
    legacyHeaders: false,
    message: { message: 'Too many password reset requests, please try again after an hour.' },
    keyGenerator: (req) => {
        const forwarded = req.headers['x-forwarded-for'];
        const ip = forwarded ? forwarded.split(',')[0].trim() : req.socket.remoteAddress;
        return ip;
    }
});

// --- Simple XSS Sanitizer (replaces deprecated xss-clean) ---
function sanitizeString(value) {
    if (typeof value !== 'string') return value;
    return value
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#x27;');
}

function sanitizeObject(obj) {
    if (typeof obj !== 'object' || obj === null) return sanitizeString(obj);
    if (Array.isArray(obj)) return obj.map(sanitizeObject);
    const sanitized = {};
    for (const key of Object.keys(obj)) {
        sanitized[key] = sanitizeObject(obj[key]);
    }
    return sanitized;
}

function xssSanitizer(req, res, next) {
    if (req.body) req.body = sanitizeObject(req.body);
    if (req.query) req.query = sanitizeObject(req.query);
    if (req.params) req.params = sanitizeObject(req.params);
    next();
}

// --- Apply all security middleware ---
module.exports = function (app) {
    // Global rate limiter — applies to all routes
    app.use(globalLimiter);

    // NoSQL injection protection — strips $ and . from req.body/query/params
    // app.use(mongoSanitize());

    // XSS input sanitization
    // app.use(xssSanitizer);

    // HTTP Parameter Pollution protection
    app.use(hpp());
};

module.exports.authLimiter = authLimiter;
module.exports.passwordResetLimiter = passwordResetLimiter;
