const jwt = require('jsonwebtoken');

const { errorResponse } = require('../utils/apiResponse');

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

module.exports = {
  requireAuth,
};
