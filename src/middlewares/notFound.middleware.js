const { errorResponse } = require('../utils/apiResponse');

const notFoundMiddleware = (req, res) => {
  return errorResponse(res, 'Route not found', 404, {
    method: req.method,
    path: req.originalUrl,
  });
};

module.exports = notFoundMiddleware;
