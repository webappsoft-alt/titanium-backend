//corsConfig.js
const cors = require('cors');

const allowedOrigins = [
    'https://qqa.titanium.com',
    'https://www.qqa.titanium.com',
    'https://api.titanium.com',
    'https://www.api.titanium.com',
    'https://titanium.com',
    'https://www.titanium.com',
];
const blockApiCallers = (req, res, next) => {

    const userAgent = req.headers['user-agent'] || '';
    const blockedAgents = ['PostmanRuntime', 'curl', 'Insomnia']; // Add more if needed
    if (blockedAgents.some(agent => userAgent.includes(agent))) {
        return res.status(403).json({ message: 'Forbidden: access not allowed.' });
    }

    next();
};

const corsOptions = {
    origin: (origin, callback) => {
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error(`Not allowed by CORS ${origin}`));
        }
    },
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Accept", "X-AUTH-TOKEN"],
    credentials: true,
};

module.exports = function (app) {
    app.use(blockApiCallers);
    app.use(cors(corsOptions));
    app.options('*', cors(corsOptions)); // Handles preflight requests
};

exports.allowedOrigins = allowedOrigins;
