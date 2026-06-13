const SlotModel = require('../../models/SlotModel');

const OVERLAP_STATUSES = ['available', 'booked', 'blocked'];

const getAvailableSlotsByGarageId = async (garageId) => {
  const garage = await SlotModel.findActiveGarageById(garageId);

  if (!garage) {
    return null;
  }

  return SlotModel.findAvailableByGarageId(garageId);
};

const createSlot = async ({ garageId, startDatetime, endDatetime, user }) => {
  const garage = await SlotModel.findActiveGarageById(garageId);

  if (!garage) {
    return { errorCode: 'GARAGE_NOT_FOUND' };
  }

  if (user.role === 'garage' && Number(garage.manager_user_id) !== Number(user.user_id)) {
    return { errorCode: 'ACCESS_FORBIDDEN' };
  }

  const overlappingSlot = await SlotModel.findOverlappingSlot({
    garageId,
    statuses: OVERLAP_STATUSES,
    startDatetime,
    endDatetime,
  });

  if (overlappingSlot) {
    return { errorCode: 'SLOT_OVERLAP' };
  }

  const slotId = await SlotModel.createSlot({ garageId, startDatetime, endDatetime });
  const slot = await SlotModel.findById(slotId);

  return { slot };
};

const blockSlotById = async ({ slotId, user }) => {
  const slot = await SlotModel.findWithGarageById(slotId);

  if (!slot || !slot.garage_status || slot.garage_status !== 'active') {
    return { errorCode: 'SLOT_NOT_FOUND' };
  }

  if (user.role === 'garage' && Number(slot.manager_user_id) !== Number(user.user_id)) {
    return { errorCode: 'ACCESS_FORBIDDEN' };
  }

  if (slot.slot_status === 'blocked') {
    return { errorCode: 'SLOT_ALREADY_BLOCKED' };
  }

  if (slot.slot_status === 'booked') {
    return { errorCode: 'SLOT_CANNOT_BE_BLOCKED' };
  }

  if (slot.slot_status !== 'available') {
    return { errorCode: 'SLOT_CANNOT_BE_BLOCKED' };
  }

  if (new Date(slot.start_datetime).getTime() < Date.now()) {
    return { errorCode: 'SLOT_CANNOT_BE_BLOCKED' };
  }

  const activeReservation = await SlotModel.findActiveReservationBySlotId(slotId);

  if (activeReservation) {
    return { errorCode: 'SLOT_CANNOT_BE_BLOCKED' };
  }

  const affectedRows = await SlotModel.blockAvailableById(slotId);

  if (affectedRows === 0) {
    return { errorCode: 'SLOT_CANNOT_BE_BLOCKED' };
  }

  const updatedSlot = await SlotModel.findById(slotId);

  return {
    slot: updatedSlot,
  };
};

module.exports = {
  blockSlotById,
  createSlot,
  getAvailableSlotsByGarageId,
};
