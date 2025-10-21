
module.exports = function (req, res, next) {
  // 401 Unauthorized
  // 403 Forbidden 
  const userType = ['admin', 'sub-admin']
  if (!userType.includes(req.user.type)) return res.status(403).send({ message: 'Access denied.' });

  next();
}