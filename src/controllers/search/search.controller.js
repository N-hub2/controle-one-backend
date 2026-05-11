const searchService = require('../../services/search/search.service');
const { successResponse, errorResponse } = require('../../utils/apiResponse');

const unsupportedFilterKeys = ['registration', 'make', 'model', 'year', 'version'];

const isPositiveIntegerString = (value) => {
  return /^\d+$/.test(value) && Number(value) > 0;
};

const isPositiveNumberString = (value) => {
  if (!/^\d+(\.\d+)?$/.test(value)) {
    return false;
  }

  return Number(value) > 0;
};

const getSingleQueryValue = (value) => {
  if (Array.isArray(value)) {
    return null;
  }

  if (value === undefined || value === null) {
    return undefined;
  }

  return String(value);
};

const searchGarages = async (req, res) => {
  const hasUnsupportedFilters = unsupportedFilterKeys.some((key) => req.query[key] !== undefined);

  if (hasUnsupportedFilters) {
    return errorResponse(res, 'Unsupported search filters', 400, {});
  }

  const errors = [];

  const postalCodeInput = getSingleQueryValue(req.query.postalCode);
  const cityInput = getSingleQueryValue(req.query.city);
  const serviceIdInput = getSingleQueryValue(req.query.service_id);
  const priceMaxInput = getSingleQueryValue(req.query.price_max);

  if (postalCodeInput === null) {
    errors.push({ field: 'postalCode', message: 'postalCode must be a single string value' });
  }

  if (cityInput === null) {
    errors.push({ field: 'city', message: 'city must be a single string value' });
  }

  if (serviceIdInput === null) {
    errors.push({ field: 'service_id', message: 'service_id must be a single value' });
  }

  if (priceMaxInput === null) {
    errors.push({ field: 'price_max', message: 'price_max must be a single value' });
  }

  const postalCode = typeof postalCodeInput === 'string' ? postalCodeInput.trim() : undefined;
  const city = typeof cityInput === 'string' ? cityInput.trim() : undefined;

  if (postalCodeInput !== undefined && typeof postalCodeInput === 'string' && postalCode.length === 0) {
    errors.push({ field: 'postalCode', message: 'postalCode must not be empty' });
  }

  if (cityInput !== undefined && typeof cityInput === 'string' && city.length === 0) {
    errors.push({ field: 'city', message: 'city must not be empty' });
  }

  let serviceId;
  if (serviceIdInput !== undefined && typeof serviceIdInput === 'string') {
    const serviceIdTrimmed = serviceIdInput.trim();

    if (!isPositiveIntegerString(serviceIdTrimmed)) {
      errors.push({ field: 'service_id', message: 'service_id must be a positive integer' });
    } else {
      serviceId = Number(serviceIdTrimmed);
    }
  }

  let priceMax;
  if (priceMaxInput !== undefined && typeof priceMaxInput === 'string') {
    const priceMaxTrimmed = priceMaxInput.trim();

    if (!isPositiveNumberString(priceMaxTrimmed)) {
      errors.push({ field: 'price_max', message: 'price_max must be a positive number' });
    } else {
      priceMax = Number(priceMaxTrimmed);
    }
  }

  if (errors.length > 0) {
    return errorResponse(res, 'Validation failed', 400, { errors });
  }

  try {
    const garages = await searchService.searchGarages({
      postalCode,
      city,
      serviceId,
      priceMax,
    });

    return successResponse(res, 'Garages search results retrieved successfully', { garages });
  } catch (error) {
    return errorResponse(res, 'Garages search results could not be retrieved', 500, {});
  }
};

module.exports = {
  searchGarages,
};
