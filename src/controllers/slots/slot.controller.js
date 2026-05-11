const slotService = require('../../services/slots/slot.service');
const { successResponse, errorResponse } = require('../../utils/apiResponse');

const isPositiveIntegerString = (value) => {
  return /^\d+$/.test(String(value)) && Number(value) > 0;
};

const listAvailableSlots = async (req, res) => {
  const { garage_id: garageId } = req.query;

  if (!isPositiveIntegerString(garageId)) {
    return errorResponse(res, 'Validation failed', 400, {
      errors: [{ field: 'garage_id', message: 'garage_id must be a positive integer' }],
    });
  }

  const normalizedGarageId = Number(garageId);

  try {
    const slots = await slotService.getAvailableSlotsByGarageId(normalizedGarageId);

    if (slots === null) {
      return errorResponse(res, 'Garage not found', 404, {});
    }

    return successResponse(res, 'Available slots retrieved successfully', { slots });
  } catch (error) {
    return errorResponse(res, 'Available slots could not be retrieved', 500, {});
  }
};

module.exports = {
  listAvailableSlots,
};