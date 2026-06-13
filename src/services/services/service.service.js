const ServiceModel = require('../../models/ServiceModel');

const getActiveServices = async () => {
  return ServiceModel.findAll();
};

const createService = async ({ name, description }) => {
  const sanitizedName = name.trim();
  const sanitizedDescription =
    typeof description === 'string' && description.trim().length > 0 ? description.trim() : null;

  const existingService = await ServiceModel.findByName(sanitizedName);

  if (existingService) {
    const error = new Error('Service name already exists');
    error.code = 'SERVICE_NAME_ALREADY_EXISTS';
    throw error;
  }

  let serviceId;

  try {
    serviceId = await ServiceModel.createService({
      name: sanitizedName,
      description: sanitizedDescription,
    });
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      const duplicateError = new Error('Service name already exists');
      duplicateError.code = 'SERVICE_NAME_ALREADY_EXISTS';
      throw duplicateError;
    }

    throw error;
  }

  return {
    service_id: serviceId,
    name: sanitizedName,
    description: sanitizedDescription,
    status: 'active',
  };
};

module.exports = {
  createService,
  getActiveServices,
};
