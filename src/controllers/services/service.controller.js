const serviceService = require('../../services/services/service.service');
const { successResponse, errorResponse } = require('../../utils/apiResponse');

const validateCreateServiceInput = (body) => {
  const errors = [];
  const name = typeof body.name === 'string' ? body.name.trim() : '';
  const hasDescription = Object.prototype.hasOwnProperty.call(body, 'description');
  const descriptionRaw = hasDescription ? body.description : undefined;

  if (!name) {
    errors.push({ field: 'name', message: 'Name is required' });
  } else if (name.length < 2 || name.length > 150) {
    errors.push({ field: 'name', message: 'Name must contain between 2 and 150 characters' });
  }

  if (hasDescription && typeof descriptionRaw !== 'string') {
    errors.push({ field: 'description', message: 'Description must be a string' });
  }

  const description = typeof descriptionRaw === 'string' ? descriptionRaw.trim() : undefined;

  if (typeof description === 'string' && description.length > 1000) {
    errors.push({ field: 'description', message: 'Description must not exceed 1000 characters' });
  }

  if (Object.prototype.hasOwnProperty.call(body, 'status')) {
    errors.push({ field: 'status', message: 'Status cannot be set from request body' });
  }

  return {
    errors,
    values: {
      name,
      description,
    },
  };
};

const listServices = async (req, res) => {
  try {
    const services = await serviceService.getActiveServices();

    return successResponse(res, 'Services retrieved successfully', { services });
  } catch (error) {
    return errorResponse(res, 'Services could not be retrieved', 500, {});
  }
};

const createService = async (req, res) => {
  try {
    const { errors, values } = validateCreateServiceInput(req.body || {});

    if (errors.length > 0) {
      return errorResponse(res, 'Validation failed', 400, { errors });
    }

    const service = await serviceService.createService(values);

    return successResponse(res, 'Service created successfully', { service }, 201);
  } catch (error) {
    if (error.code === 'SERVICE_NAME_ALREADY_EXISTS') {
      return errorResponse(res, 'Service name already exists', 409, {});
    }

    return errorResponse(res, 'Service could not be created', 500, {});
  }
};

module.exports = {
  createService,
  listServices,
};
