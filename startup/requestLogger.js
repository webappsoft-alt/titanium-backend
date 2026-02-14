const logger = require("./logger");

exports.requestLogger = (req, res, next) => {
  const start = Date.now();
  const forwarded = req.headers['x-forwarded-for'];
  const ip = forwarded ? forwarded.split(',')[0].trim() : req.socket.remoteAddress;
  const logBase = `PID: ${process.pid} | path: ${req.originalUrl || req.path}, method: ${req.method}, ip: ${ip}, email: ${req.body?.email || ''}, userAgent: ${req.get('user-agent')}`
  res.on('finish', () => {
    const duration = Date.now() - start;
    const message = `${logBase}, status: ${res.statusCode}, duration: ${duration}ms`;

    if (res.statusCode >= 400) {
      logger.error(`❌ ${message}`);
    } else {
      logger.info(message);
    }
  });

  next();
};