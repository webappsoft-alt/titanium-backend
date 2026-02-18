const rateLimit = require('express-rate-limit');
const mongoSanitize = require('express-mongo-sanitize');
const hpp = require('hpp');

// --- IP Whitelist (comma-separated in env, e.g. WHITELISTED_IPS="1.2.3.4,5.6.7.8") ---
const WHITELISTED_IPS = process.env.WHITELISTED_IPS
    ? process.env.WHITELISTED_IPS.split(',').map(ip => ip.trim())
    : [];

function getClientIP(req) {
    const forwarded = req.headers['x-forwarded-for'];
    return forwarded ? forwarded.split(',')[0].trim() : req.socket.remoteAddress;
}

function isWhitelisted(req) {
    return WHITELISTED_IPS.includes(getClientIP(req));
}

// --- Global Rate Limiter (DDoS protection) ---
const globalLimiter = rateLimit({
    windowMs: 10 * 60 * 1000,
    max: 200,
    standardHeaders: true,
    legacyHeaders: false,
    message: { message: 'Too many requests, please try again later.' },
    skip: isWhitelisted,
    keyGenerator: getClientIP,
});

// --- Strict Rate Limiter for Auth Routes (brute-force protection) ---
const authLimiter = rateLimit({
    windowMs: 10 * 60 * 1000,
    max: 15, // limit each IP to 15 login/register attempts per window
    standardHeaders: true,
    legacyHeaders: false,
    message: { message: 'Too many authentication attempts, please try again after 15 minutes.' },
    skip: isWhitelisted,
    keyGenerator: getClientIP,
});

// --- Password Reset Rate Limiter ---
const passwordResetLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 5, // 5 password reset requests per hour
    standardHeaders: true,
    legacyHeaders: false,
    message: { message: 'Too many password reset requests, please try again after an hour.' },
    skip: isWhitelisted,
    keyGenerator: getClientIP,
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
module.exports.isWhitelisted = isWhitelisted;
module.exports.passwordResetLimiter = passwordResetLimiter;
