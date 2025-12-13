const helmet = require("helmet");
const compression = require("compression");

module.exports = function (app) {
    app.use(helmet({
        contentSecurityPolicy: {
            directives: {
                defaultSrc: ["'self'"],  // Allow only same-origin requests
                scriptSrc: ["'self'", "'unsafe-inline'"],  // Restrict script sources
                styleSrc: ["'self'", "'unsafe-inline'"],
                imgSrc: ["'self'", "data:"],
                connectSrc: ["'self'"],
            },
        },
        crossOriginResourcePolicy: { policy: "same-origin" },  // Prevent cross-origin data leaks
        xssFilter: true,  // Protect against cross-site scripting (XSS)
        noSniff: true,  // Prevent MIME type sniffing
        frameguard: { action: "deny" },  // Prevent clickjacking
        hsts: { maxAge: 31536000, includeSubDomains: true, preload: true },  // Enforce HTTPS
    }));

    app.use(compression());  // Improve performance by compressing responses
};
