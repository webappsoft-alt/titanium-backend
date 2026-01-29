const jwt = require('jsonwebtoken');
const config = require('config');

module.exports = function (req, res, next) {
  const token = req.header('x-auth-token');

  if (!token) {
    return res.status(401).json({
      message: 'Access denied. No token provided.',
      code: 'NO_TOKEN'
    });
  }

  try {
    const decoded = jwt.verify(token, config.get('jwtPrivateKey'));
    req.user = decoded;
    next();
  } catch (err) {

    // 🔒 Token Expired
    if (err.name === 'TokenExpiredError') {
      return res.status(419).json({
        message: 'Session expired. Please login again.',
        code: 'TOKEN_EXPIRED'
      });
    }

    // 🔒 Invalid Token
    return res.status(403).json({
      message: 'Invalid authentication token.',
      code: 'INVALID_TOKEN'
    });
  }
};
