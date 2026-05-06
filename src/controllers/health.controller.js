const { successResponse } = require('../utils/apiResponse');

const getHealth = (req, res) => {
  return successResponse(res, 'Controle One backend is running', {
    status: 'ok',
  });
};

module.exports = {
  getHealth,
};
