const slotService = require('../../services/slots/slot.service');
const { successResponse, errorResponse } = require('../../utils/apiResponse');
const { isPositiveIntegerString } = require('../../utils/validators');

const parseValidDate = (value) => {
  if (value === null || value === undefined || String(value).trim().length === 0) {
    return null;
  }

  const parsedDate = new Date(value);

  if (Number.isNaN(parsedDate.getTime())) {
    return null;
  }

  return parsedDate;
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

const validateCreateSlotInput = (body) => {
  const errors = [];
  const garageId = body.garage_id;
  const startDatetime = body.start_datetime;
  const endDatetime = body.end_datetime;

  if (!isPositiveIntegerString(String(garageId))) {
    errors.push({ field: 'garage_id', message: 'garage_id must be a positive integer' });
  }

  if (Object.prototype.hasOwnProperty.call(body, 'status')) {
    errors.push({ field: 'status', message: 'status cannot be set from request body' });
  }

  const parsedStartDatetime = parseValidDate(startDatetime);
  const parsedEndDatetime = parseValidDate(endDatetime);

  if (!parsedStartDatetime) {
    errors.push({ field: 'start_datetime', message: 'start_datetime must be a valid datetime' });
  }

  if (!parsedEndDatetime) {
    errors.push({ field: 'end_datetime', message: 'end_datetime must be a valid datetime' });
  }

  if (parsedStartDatetime && parsedStartDatetime.getTime() < Date.now()) {
    errors.push({ field: 'start_datetime', message: 'start_datetime must be greater than or equal to the current datetime' });
  }

  if (parsedStartDatetime && parsedEndDatetime && parsedEndDatetime.getTime() <= parsedStartDatetime.getTime()) {
    errors.push({ field: 'end_datetime', message: 'end_datetime must be greater than start_datetime' });
  }

  return {
    errors,
    values: {
      garage_id: Number(garageId),
      start_datetime: startDatetime,
      end_datetime: endDatetime,
    },
  };
};

const createSlot = async (req, res) => {
  const { errors, values } = validateCreateSlotInput(req.body || {});

  if (errors.length > 0) {
    return errorResponse(res, 'Validation failed', 400, { errors });
  }

  try {
    const result = await slotService.createSlot({
      garageId: values.garage_id,
      startDatetime: values.start_datetime,
      endDatetime: values.end_datetime,
      user: req.user,
    });

    if (result.errorCode === 'GARAGE_NOT_FOUND') {
      return errorResponse(res, 'Garage not found', 404, {});
    }

    if (result.errorCode === 'ACCESS_FORBIDDEN') {
      return errorResponse(res, 'Access forbidden', 403, {});
    }

    if (result.errorCode === 'SLOT_OVERLAP') {
      return errorResponse(res, 'Slot overlaps with an existing slot', 409, {});
    }

    return successResponse(res, 'Slot created successfully', { slot: result.slot }, 201);
  } catch (error) {
    return errorResponse(res, 'Slot could not be created', 500, {});
  }
};

const validateBlockSlotInput = (params, body) => {
  const errors = [];
  const { id } = params;

  if (!isPositiveIntegerString(id)) {
    errors.push({ field: 'id', message: 'id must be a positive integer' });
  }

  if (Object.prototype.hasOwnProperty.call(body, 'reason')) {
    errors.push({ field: 'reason', message: 'reason cannot be set from request body' });
  }

  if (Object.prototype.hasOwnProperty.call(body, 'block_reason')) {
    errors.push({ field: 'block_reason', message: 'block_reason cannot be set from request body' });
  }

  if (Object.prototype.hasOwnProperty.call(body, 'block_message')) {
    errors.push({ field: 'block_message', message: 'block_message cannot be set from request body' });
  }

  return {
    errors,
    values: {
      id: Number(id),
    },
  };
};

const blockSlot = async (req, res) => {
  const { errors, values } = validateBlockSlotInput(req.params || {}, req.body || {});

  if (errors.length > 0) {
    return errorResponse(res, 'Validation failed', 400, { errors });
  }

  try {
    const result = await slotService.blockSlotById({
      slotId: values.id,
      user: req.user,
    });

    if (result.errorCode === 'SLOT_NOT_FOUND') {
      return errorResponse(res, 'Slot not found', 404, {});
    }

    if (result.errorCode === 'ACCESS_FORBIDDEN') {
      return errorResponse(res, 'Access forbidden', 403, {});
    }

    if (result.errorCode === 'SLOT_ALREADY_BLOCKED') {
      return errorResponse(res, 'Slot is already blocked', 409, {});
    }

    if (result.errorCode === 'SLOT_CANNOT_BE_BLOCKED') {
      return errorResponse(res, 'Slot cannot be blocked', 409, {});
    }

    return successResponse(res, 'Slot blocked successfully', { slot: result.slot }, 200);
  } catch (error) {
    return errorResponse(res, 'Slot could not be blocked', 500, {});
  }
};

module.exports = {
  blockSlot,
  createSlot,
  listAvailableSlots,
};