const GarageModel = require('../../models/GarageModel');

const getActiveGaragesList = async () => {
  const garages = await GarageModel.findAllActive();

  return garages.map((garage) => ({
    ...garage,
    available_slots_count: Number(garage.available_slots_count),
  }));
};

const getGarageDetailsById = async (garageId) => {
  const garage = await GarageModel.findActiveById(garageId);

  if (!garage) {
    return null;
  }

  const tariffs = await GarageModel.findActiveTariffsByGarageId(garageId);
  const availableSlots = await GarageModel.findAvailableSlotsByGarageId(garageId);

  return {
    ...garage,
    tariffs,
    available_slots: availableSlots,
  };
};

module.exports = {
  getActiveGaragesList,
  getGarageDetailsById,
};
