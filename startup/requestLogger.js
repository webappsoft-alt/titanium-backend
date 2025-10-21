const logger = require("./logger");

exports.requestLogger = (req, res, next) => {
  const start = Date.now();
  const forwarded = req.headers['x-forwarded-for'];
  const ip = forwarded ? forwarded.split(',')[0].trim() : req.socket.remoteAddress;
  res.on('finish', () => {
    const duration = Date.now() - start;
    logger.info(`API Request - PID: ${process.pid}----> path: ${req.originalUrl || req.path}, method: ${req.method}, status: ${res.statusCode}, duration: ${duration}ms, ip: ${ip}, userAgent: ${req.get('user-agent')}`);
  });

  next();
};