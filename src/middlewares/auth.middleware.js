const jwt = require('jsonwebtoken');

const { errorResponse } = require('../utils/apiResponse');

const validRoles = ['client', 'garage', 'admin'];

const requireAuth = (req, res, next) => {
  const authorizationHeader = req.headers.authorization;

  if (!authorizationHeader) {
    return errorResponse(res, 'Authentication required', 401, {});
  }

  const [scheme, token] = authorizationHeader.split(' ');

  if (scheme !== 'Bearer' || !token) {
    return errorResponse(res, 'Authentication required', 401, {});
  }

  if (!process.env.JWT_SECRET) {
    return errorResponse(res, 'Authentication configuration is missing', 500, {});
  }

  try {
    const decodedToken = jwt.verify(token, process.env.JWT_SECRET);

    if (!decodedToken.user_id || !decodedToken.email || !decodedToken.role) {
      return errorResponse(res, 'Invalid or expired token', 401, {});
    }

    req.user = {
      user_id: decodedToken.user_id,
      email: decodedToken.email,
      role: decodedToken.role,
    };

    return next();
  } catch (error) {
    return errorResponse(res, 'Invalid or expired token', 401, {});
  }
};

const requireRole = (...allowedRolesInput) => {
  const allowedRoles = allowedRolesInput.flat();
  const hasInvalidRole = allowedRoles.some((role) => !validRoles.includes(role));

  return (req, res, next) => {
    if (hasInvalidRole || allowedRoles.length === 0) {
      return errorResponse(res, 'Role authorization configuration is invalid', 500, {});
    }

    if (!req.user || !req.user.role) {
      return errorResponse(res, 'Authentication required', 401, {});
    }

    if (!allowedRoles.includes(req.user.role)) {
      return errorResponse(res, 'Access forbidden', 403, {});
    }

    return next();
  };
};

module.exports = {
  requireAuth,
  requireRole,
};
