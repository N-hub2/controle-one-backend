const TariffModel = require('../../models/TariffModel');

const getActiveGarageById = async (garageId) => {
  return TariffModel.findActiveGarageById(garageId);
};

const getActiveServiceById = async (serviceId) => {
  return TariffModel.findActiveServiceById(serviceId);
};

const getActiveTariffsByGarageId = async (garageId) => {
  return TariffModel.findActiveByGarageId(garageId);
};

const getActiveTariffByGarageAndService = async (garageId, serviceId) => {
  return TariffModel.findActiveByGarageAndService(garageId, serviceId);
};

const createTariff = async ({ garageId, serviceId, price, currency }) => {
  let tariffId;

  try {
    tariffId = await TariffModel.createTariff({
      garageId,
      serviceId,
      price,
      currency,
    });
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      const duplicateError = new Error('Tariff already exists for this garage and service');
      duplicateError.code = 'TARIFF_DUPLICATE';
      throw duplicateError;
    }

    throw error;
  }

  return TariffModel.findById(tariffId);
};

const getActiveTariffById = async (tariffId) => {
  return TariffModel.findActiveById(tariffId);
};

const updateActiveTariffById = async (tariffId, fieldsToUpdate) => {
  const hasPrice = Object.prototype.hasOwnProperty.call(fieldsToUpdate, 'price');
  const hasCurrency = Object.prototype.hasOwnProperty.call(fieldsToUpdate, 'currency');

  if (!hasPrice && !hasCurrency) {
    return null;
  }

  await TariffModel.updateActiveById(tariffId, fieldsToUpdate);

  return TariffModel.findActiveById(tariffId);
};

const softDeleteActiveTariffById = async (tariffId) => {
  await TariffModel.softDeleteActiveById(tariffId);

  return {
    tariff_id: tariffId,
    status: 'inactive',
  };
};

module.exports = {
  createTariff,
  getActiveGarageById,
  getActiveServiceById,
  getActiveTariffByGarageAndService,
  getActiveTariffById,
  getActiveTariffsByGarageId,
  softDeleteActiveTariffById,
  updateActiveTariffById,
};
