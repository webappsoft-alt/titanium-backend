const winston = require('winston');
require('winston-daily-rotate-file');
const path = require('path');

// Create logs directory if it doesn't exist
const fs = require('fs');
const logDir = path.join(__dirname, 'logs');
if (!fs.existsSync(logDir)) {
     fs.mkdirSync(logDir);
}

const dailyRotateTransport = new winston.transports.DailyRotateFile({
     filename: 'logs/%DATE%.log',
     datePattern: 'YYYY-MM-DD',
     zippedArchive: true, // optionally set to true to gzip logs
     maxSize: '1024m',
});

const logger = winston.createLogger({
     level: 'info',
     format: winston.format.combine(
          winston.format.colorize(), // Add colors to console output (optional)
          winston.format.simple(), // Use a simple log format (optional)
          winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
          winston.format.printf(({ level, message, timestamp }) => {
               return `[${timestamp}] ${level}: ${message}`;
          })
     ),
     transports: [
          new winston.transports.Console(),
          dailyRotateTransport
     ]
});

module.exports = logger;
