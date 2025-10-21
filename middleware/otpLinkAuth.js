const jwt = require('jsonwebtoken');
const config = require('config');

module.exports = function (req, res, next) {
  const token = req.params.token;
  if (!token) {
    return res.status(401).send({ message: 'Access denied. No token provided.' });
  }

  try {
    const decoded = jwt.verify(token, config.get('jwtIDPrivateKey'));
    req.user = decoded;
    next();
  } catch (ex) {
    res.status(400).send('The reset password link has expired. Please request a new one.');
  }
};
