const tariffService = require('../../services/tariffs/tariff.service');
const { successResponse, errorResponse } = require('../../utils/apiResponse');

const MAX_DECIMAL_VALUE = 99999999.99;

const isPositiveIntegerString = (value) => {
  return /^\d+$/.test(String(value)) && Number(value) > 0;
};

const normalizeCurrency = (currency) => {
  return String(currency).trim().toUpperCase();
};

const isValidPositiveDecimal = (value) => {
  const stringValue = String(value).trim();

  if (!/^\d+(\.\d{1,2})?$/.test(stringValue)) {
    return false;
  }

  const numericValue = Number(stringValue);

  return numericValue > 0 && numericValue <= MAX_DECIMAL_VALUE;
};

const listTariffs = async (req, res) => {
  const { garage_id: garageId } = req.query;

  if (!isPositiveIntegerString(garageId)) {
    return errorResponse(res, 'Validation failed', 400, {
      errors: [{ field: 'garage_id', message: 'garage_id must be a positive integer' }],
    });
  }

  const normalizedGarageId = Number(garageId);

  try {
    const garage = await tariffService.getActiveGarageById(normalizedGarageId);

    if (!garage) {
      return errorResponse(res, 'Garage not found', 404, {});
    }

    const tariffs = await tariffService.getActiveTariffsByGarageId(normalizedGarageId);

    return successResponse(res, 'Tariffs retrieved successfully', { tariffs });
  } catch (error) {
    return errorResponse(res, 'Tariffs could not be retrieved', 500, {});
  }
};

const validateCreateTariffInput = (body) => {
  const errors = [];
  const garageId = body.garage_id;
  const serviceId = body.service_id;
  const price = body.price;

  const hasCurrency = Object.prototype.hasOwnProperty.call(body, 'currency');
  const rawCurrency = hasCurrency ? body.currency : 'EUR';

  if (!isPositiveIntegerString(garageId)) {
    errors.push({ field: 'garage_id', message: 'garage_id must be a positive integer' });
  }

  if (!isPositiveIntegerString(serviceId)) {
    errors.push({ field: 'service_id', message: 'service_id must be a positive integer' });
  }

  if (!isValidPositiveDecimal(price)) {
    errors.push({ field: 'price', message: 'price must be a positive decimal value with up to 2 decimal places' });
  }

  if (rawCurrency === null || rawCurrency === undefined || String(rawCurrency).trim().length === 0) {
    errors.push({ field: 'currency', message: 'currency must contain exactly 3 letters' });
  } else {
    const currency = normalizeCurrency(rawCurrency);

    if (!/^[A-Z]{3}$/.test(currency)) {
      errors.push({ field: 'currency', message: 'currency must contain exactly 3 letters' });
    }
  }

  if (Object.prototype.hasOwnProperty.call(body, 'status')) {
    errors.push({ field: 'status', message: 'status cannot be set from request body' });
  }

  return {
    errors,
    values: {
      garage_id: Number(garageId),
      service_id: Number(serviceId),
      price: Number(price),
      currency: normalizeCurrency(rawCurrency || 'EUR'),
    },
  };
};

const createTariff = async (req, res) => {
  const { errors, values } = validateCreateTariffInput(req.body || {});

  if (errors.length > 0) {
    return errorResponse(res, 'Validation failed', 400, { errors });
  }

  try {
    const garage = await tariffService.getActiveGarageById(values.garage_id);

    if (!garage) {
      return errorResponse(res, 'Garage not found', 404, {});
    }

    if (req.user.role === 'garage' && Number(garage.manager_user_id) !== Number(req.user.user_id)) {
      return errorResponse(res, 'Access forbidden', 403, {});
    }

    const service = await tariffService.getActiveServiceById(values.service_id);

    if (!service) {
      return errorResponse(res, 'Service not found', 404, {});
    }

    const duplicate = await tariffService.getActiveTariffByGarageAndService(values.garage_id, values.service_id);

    if (duplicate) {
      return errorResponse(res, 'Tariff already exists for this garage and service', 409, {});
    }

    const tariff = await tariffService.createTariff({
      garageId: values.garage_id,
      serviceId: values.service_id,
      price: values.price,
      currency: values.currency,
    });

    return successResponse(res, 'Tariff created successfully', { tariff }, 201);
  } catch (error) {
    if (error.code === 'TARIFF_DUPLICATE') {
      return errorResponse(res, 'Tariff already exists for this garage and service', 409, {});
    }

    return errorResponse(res, 'Tariff could not be created', 500, {});
  }
};

const validateUpdateTariffInput = (body) => {
  const errors = [];
  const values = {};

  if (Object.prototype.hasOwnProperty.call(body, 'garage_id')) {
    errors.push({ field: 'garage_id', message: 'garage_id cannot be updated' });
  }

  if (Object.prototype.hasOwnProperty.call(body, 'service_id')) {
    errors.push({ field: 'service_id', message: 'service_id cannot be updated' });
  }

  if (Object.prototype.hasOwnProperty.call(body, 'status')) {
    errors.push({ field: 'status', message: 'status cannot be updated from request body' });
  }

  const hasPrice = Object.prototype.hasOwnProperty.call(body, 'price');
  const hasCurrency = Object.prototype.hasOwnProperty.call(body, 'currency');

  if (!hasPrice && !hasCurrency) {
    errors.push({ field: 'body', message: 'At least one updatable field is required' });
  }

  if (hasPrice) {
    if (!isValidPositiveDecimal(body.price)) {
      errors.push({ field: 'price', message: 'price must be a positive decimal value with up to 2 decimal places' });
    } else {
      values.price = Number(body.price);
    }
  }

  if (hasCurrency) {
    if (body.currency === null || body.currency === undefined || String(body.currency).trim().length === 0) {
      errors.push({ field: 'currency', message: 'currency must contain exactly 3 letters' });
    } else {
      const normalizedCurrency = normalizeCurrency(body.currency);

      if (!/^[A-Z]{3}$/.test(normalizedCurrency)) {
        errors.push({ field: 'currency', message: 'currency must contain exactly 3 letters' });
      } else {
        values.currency = normalizedCurrency;
      }
    }
  }

  return { errors, values };
};

const updateTariff = async (req, res) => {
  const { id } = req.params;

  if (!isPositiveIntegerString(id)) {
    return errorResponse(res, 'Validation failed', 400, {
      errors: [{ field: 'id', message: 'id must be a positive integer' }],
    });
  }

  const { errors, values } = validateUpdateTariffInput(req.body || {});

  if (errors.length > 0) {
    return errorResponse(res, 'Validation failed', 400, { errors });
  }

  const tariffId = Number(id);

  try {
    const tariff = await tariffService.getActiveTariffById(tariffId);

    if (!tariff) {
      return errorResponse(res, 'Tariff not found', 404, {});
    }

    if (req.user.role === 'garage' && Number(tariff.manager_user_id) !== Number(req.user.user_id)) {
      return errorResponse(res, 'Access forbidden', 403, {});
    }

    const updatedTariff = await tariffService.updateActiveTariffById(tariffId, values);

    return successResponse(res, 'Tariff updated successfully', { tariff: updatedTariff });
  } catch (error) {
    return errorResponse(res, 'Tariff could not be updated', 500, {});
  }
};

const deleteTariff = async (req, res) => {
  const { id } = req.params;

  if (!isPositiveIntegerString(id)) {
    return errorResponse(res, 'Validation failed', 400, {
      errors: [{ field: 'id', message: 'id must be a positive integer' }],
    });
  }

  const tariffId = Number(id);

  try {
    const tariff = await tariffService.getActiveTariffById(tariffId);

    if (!tariff) {
      return errorResponse(res, 'Tariff not found', 404, {});
    }

    if (req.user.role === 'garage' && Number(tariff.manager_user_id) !== Number(req.user.user_id)) {
      return errorResponse(res, 'Access forbidden', 403, {});
    }

    const deletedTariff = await tariffService.softDeleteActiveTariffById(tariffId);

    return successResponse(res, 'Tariff deleted successfully', { tariff: deletedTariff });
  } catch (error) {
    return errorResponse(res, 'Tariff could not be deleted', 500, {});
  }
};

module.exports = {
  createTariff,
  deleteTariff,
  listTariffs,
  updateTariff,
};
