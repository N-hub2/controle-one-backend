const garageService = require('../../services/garages/garage.service');
const { successResponse, errorResponse } = require('../../utils/apiResponse');

const listGarages = async (req, res) => {
  try {
    const garages = await garageService.getActiveGaragesList();

    return successResponse(res, 'Garages retrieved successfully', { garages });
  } catch (error) {
    return errorResponse(res, 'Garages could not be retrieved', 500, {});
  }
};

module.exports = {
  listGarages,
};
