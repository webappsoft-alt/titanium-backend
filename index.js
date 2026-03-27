require('dotenv').config();
const { requestLogger } = require('./startup/requestLogger');
const mongoose = require('mongoose');

const express = require('express');
const app = express();
app.set('trust proxy', 1);
const http = require('http');
const logger = require('./startup/logger'); // Adjust the path as needed
const server = http.createServer(app);
const auth = require('./middleware/auth')
const optionalAuth = require('./middleware/optionalAuth')

// ⚠️ Must call corsConfig before any routes
require('./startup/corsConfig')(app);
// 🔒 Security middleware (rate limiting, NoSQL sanitize, XSS, HPP)
require('./startup/security')(app);
// Cache control
app.use((req, res, next) => {
  res.set({
    "Cache-Control": "no-store, no-cache, must-revalidate, private",
    "Pragma": "no-cache",
    "Expires": "0"
  });
  next();
});

app.use(requestLogger);

require('./startup/config')();
require('./startup/logging')();
require('./startup/db')();
require('./startup/prod')(app);
require('./startup/validation')();
require('./startup/routes')(app);

// Start cron jobs
const { startQuotationEmailCron } = require('./cron/quotationEmailCron');
startQuotationEmailCron();

const port = process.env.PORT || 5022;
server.listen(port, '0.0.0.0', () => logger.info(`Listening on port  ${port}...`));

// Slowloris protection — close idle connections
server.headersTimeout = 30000; // 30s to send headers
server.requestTimeout = 30000; // 30s total request timeout
server.keepAliveTimeout = 15000; // 15s keep-alive

module.exports = server;