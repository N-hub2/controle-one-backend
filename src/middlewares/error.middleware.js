const { errorResponse } = require('../utils/apiResponse');

const errorMiddleware = (err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal server error';

  return errorResponse(res, message, statusCode);
};

module.exports = errorMiddleware;
