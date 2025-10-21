
const { User } = require('../models/user')
module.exports = async function (req, res, next) {
  // 401 Unauthorized
  // 403 Forbidden 
  // const nUser = req.user

  // if (nUser?.currentType == 'service') return res.status(403).send({ message: 'Access denied.' });

  next();
}