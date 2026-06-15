const garageService = require('../../services/garages/garage.service');
const { successResponse, errorResponse } = require('../../utils/apiResponse');
const { isPositiveIntegerString } = require('../../utils/validators');

const listGarages = async (req, res) => {
  try {
    const garages = await garageService.getActiveGaragesList();

    return successResponse(res, 'Garages retrieved successfully', { garages });
  } catch (error) {
    return errorResponse(res, 'Garages could not be retrieved', 500, {});
  }
};

const getGarageById = async (req, res) => {
  const { id } = req.params;

  if (!isPositiveIntegerString(id)) {
    return errorResponse(res, 'Invalid garage id', 400, {});
  }

  try {
    const garage = await garageService.getGarageDetailsById(Number(id));

    if (!garage) {
      return errorResponse(res, 'Garage not found', 404, {});
    }

    return successResponse(res, 'Garage retrieved successfully', { garage });
  } catch (error) {
    return errorResponse(res, 'Garage could not be retrieved', 500, {});
  }
};

module.exports = {
  listGarages,
  getGarageById,
};
