const reservationService = require('../../services/reservations/reservation.service');
const { successResponse, errorResponse } = require('../../utils/apiResponse');

const isPositiveIntegerString = (value) => {
  return /^\d+$/.test(String(value)) && Number(value) > 0;
};

const normalizeRequiredString = (value) => {
  if (value === null || value === undefined) {
    return null;
  }

  const normalized = String(value).trim();

  if (normalized.length === 0) {
    return null;
  }

  return normalized;
};

const normalizeOptionalString = (value) => {
  if (value === null || value === undefined) {
    return null;
  }

  const normalized = String(value).trim();

  if (normalized.length === 0) {
    return null;
  }

  return normalized;
};

const validateCreateReservationInput = (body) => {
  const errors = [];
  const garageId = body.garage_id;
  const serviceId = body.service_id;
  const slotId = body.slot_id;

  if (Object.prototype.hasOwnProperty.call(body, 'user_id')) {
    errors.push({ field: 'user_id', message: 'user_id cannot be set from request body' });
  }

  if (Object.prototype.hasOwnProperty.call(body, 'status')) {
    errors.push({ field: 'status', message: 'status cannot be set from request body' });
  }

  if (!isPositiveIntegerString(garageId)) {
    errors.push({ field: 'garage_id', message: 'garage_id must be a positive integer' });
  }

  if (!isPositiveIntegerString(serviceId)) {
    errors.push({ field: 'service_id', message: 'service_id must be a positive integer' });
  }

  if (!isPositiveIntegerString(slotId)) {
    errors.push({ field: 'slot_id', message: 'slot_id must be a positive integer' });
  }

  const vehicleRegistration = normalizeRequiredString(body.vehicle_registration);
  const vehicleMake = normalizeRequiredString(body.vehicle_make);
  const vehicleModel = normalizeRequiredString(body.vehicle_model);

  if (!vehicleRegistration) {
    errors.push({ field: 'vehicle_registration', message: 'vehicle_registration is required' });
  }

  if (!vehicleMake) {
    errors.push({ field: 'vehicle_make', message: 'vehicle_make is required' });
  }

  if (!vehicleModel) {
    errors.push({ field: 'vehicle_model', message: 'vehicle_model is required' });
  }

  let vehicleYear = null;

  if (Object.prototype.hasOwnProperty.call(body, 'vehicle_year') && body.vehicle_year !== null && String(body.vehicle_year).trim().length > 0) {
    const parsedYear = Number(body.vehicle_year);
    const currentYear = new Date().getFullYear();

    if (!Number.isInteger(parsedYear) || parsedYear < 1900 || parsedYear > currentYear + 1) {
      errors.push({ field: 'vehicle_year', message: 'vehicle_year must be an integer between 1900 and current year + 1' });
    } else {
      vehicleYear = parsedYear;
    }
  }

  const vehicleVersion = normalizeOptionalString(body.vehicle_version);

  return {
    errors,
    values: {
      garage_id: Number(garageId),
      service_id: Number(serviceId),
      slot_id: Number(slotId),
      vehicle_registration: vehicleRegistration,
      vehicle_make: vehicleMake,
      vehicle_model: vehicleModel,
      vehicle_year: vehicleYear,
      vehicle_version: vehicleVersion,
    },
  };
};

const createReservation = async (req, res) => {
  const { errors, values } = validateCreateReservationInput(req.body || {});

  if (errors.length > 0) {
    return errorResponse(res, 'Validation failed', 400, { errors });
  }

  try {
    const result = await reservationService.createReservation({
      userId: req.user.user_id,
      garageId: values.garage_id,
      serviceId: values.service_id,
      slotId: values.slot_id,
      vehicleRegistration: values.vehicle_registration,
      vehicleMake: values.vehicle_make,
      vehicleModel: values.vehicle_model,
      vehicleYear: values.vehicle_year,
      vehicleVersion: values.vehicle_version,
    });

    if (result.errorCode === 'RESOURCE_NOT_FOUND') {
      return errorResponse(res, 'Resource not found', 404, {});
    }

    if (result.errorCode === 'GARAGE_SLOT_MISMATCH') {
      return errorResponse(res, 'Garage does not match slot', 409, {});
    }

    if (result.errorCode === 'SLOT_UNAVAILABLE') {
      return errorResponse(res, 'Slot is no longer available', 409, {});
    }

    return successResponse(res, 'Reservation created successfully', { reservation: result.reservation }, 201);
  } catch (error) {
    return errorResponse(res, 'Reservation could not be created', 500, {});
  }
};

const getMyReservations = async (req, res) => {
  try {
    const reservations = await reservationService.getReservationsByUserId(req.user.user_id);

    return successResponse(res, 'Reservations retrieved successfully', { reservations }, 200);
  } catch (error) {
    return errorResponse(res, 'Reservations could not be retrieved', 500, {});
  }
};

const getGarageReservations = async (req, res) => {
  const garageId = req.params.garage_id;

  if (!isPositiveIntegerString(garageId)) {
    return errorResponse(res, 'Validation failed', 400, {
      errors: [{ field: 'garage_id', message: 'garage_id must be a positive integer' }],
    });
  }

  try {
    const result = await reservationService.getReservationsByGarageId({
      garageId: Number(garageId),
      user: req.user,
    });

    if (result.errorCode === 'GARAGE_NOT_FOUND' || result.errorCode === 'RESOURCE_NOT_FOUND') {
      return errorResponse(res, 'Resource not found', 404, {});
    }

    if (result.errorCode === 'ACCESS_FORBIDDEN') {
      return errorResponse(res, 'Access forbidden', 403, {});
    }

    return successResponse(res, 'Garage reservations retrieved successfully', { reservations: result.reservations }, 200);
  } catch (error) {
    return errorResponse(res, 'Garage reservations could not be retrieved', 500, {});
  }
};

module.exports = {
  getGarageReservations,
  getMyReservations,
  createReservation,
};
