const jwt = require('jsonwebtoken');
const authConfig = require('../../../config/auth.config');
const responseUtil = require('../../utils/response.util');

const getCookie = (req, name) => {
  const cookieHeader = req.headers.cookie || '';
  const cookies = cookieHeader.split(';').map((cookie) => cookie.trim());
  const match = cookies.find((cookie) => cookie.startsWith(`${name}=`));
  return match ? decodeURIComponent(match.substring(name.length + 1)) : '';
};

const requireSession = (req, res, next) => {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith('Bearer ')
    ? authHeader.substring(7)
    : getCookie(req, 'pricepulse_session');

  if (!token) {
    return res.status(401).json(responseUtil.error('Authentication required', 401));
  }

  try {
    req.user = jwt.verify(token, authConfig.jwt.secret);
    return next();
  } catch (error) {
    return res.status(401).json(responseUtil.error('Invalid or expired token', 401));
  }
};

const allowRoles = (...roles) => (req, res, next) => {
  if (!req.user || !roles.includes(req.user.role)) {
    return res.status(403).json(responseUtil.error('You do not have permission for this action', 403));
  }

  return next();
};

module.exports = {
  requireSession,
  allowRoles
};
