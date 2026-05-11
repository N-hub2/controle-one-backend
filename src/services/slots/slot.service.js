const { pool } = require('../../config/database');

const OVERLAP_STATUSES = ['available', 'booked', 'blocked'];

const getActiveGarageById = async (garageId) => {
  const [rows] = await pool.execute(
    `SELECT garage_id, manager_user_id, status
     FROM garages
     WHERE garage_id = ?
       AND status = 'active'
     LIMIT 1`,
    [garageId],
  );

  return rows[0] || null;
};

const getAvailableSlotsByGarageId = async (garageId) => {
  const garage = await getActiveGarageById(garageId);

  if (!garage) {
    return null;
  }

  const [rows] = await pool.execute(
    `SELECT
       slot_id,
       garage_id,
       start_datetime,
       end_datetime,
       status
     FROM slots
     WHERE garage_id = ?
       AND status = 'available'
       AND start_datetime >= NOW()
     ORDER BY start_datetime ASC`,
    [garageId],
  );

  return rows;
};

const hasOverlappingSlot = async ({ garageId, startDatetime, endDatetime }) => {
  const [rows] = await pool.execute(
    `SELECT slot_id
     FROM slots
     WHERE garage_id = ?
       AND status IN (?, ?, ?)
       AND start_datetime < ?
       AND end_datetime > ?
     LIMIT 1`,
    [garageId, OVERLAP_STATUSES[0], OVERLAP_STATUSES[1], OVERLAP_STATUSES[2], endDatetime, startDatetime],
  );

  return rows[0] || null;
};

const createSlot = async ({ garageId, startDatetime, endDatetime, user }) => {
  const garage = await getActiveGarageById(garageId);

  if (!garage) {
    return { errorCode: 'GARAGE_NOT_FOUND' };
  }

  if (user.role === 'garage' && Number(garage.manager_user_id) !== Number(user.user_id)) {
    return { errorCode: 'ACCESS_FORBIDDEN' };
  }

  const overlappingSlot = await hasOverlappingSlot({ garageId, startDatetime, endDatetime });

  if (overlappingSlot) {
    return { errorCode: 'SLOT_OVERLAP' };
  }

  const [insertResult] = await pool.execute(
    `INSERT INTO slots (garage_id, start_datetime, end_datetime, status)
     VALUES (?, ?, ?, 'available')`,
    [garageId, startDatetime, endDatetime],
  );

  const [rows] = await pool.execute(
    `SELECT
       slot_id,
       garage_id,
       start_datetime,
       end_datetime,
       status
     FROM slots
     WHERE slot_id = ?
     LIMIT 1`,
    [insertResult.insertId],
  );

  return {
    slot: rows[0] || null,
  };
};

const getSlotWithGarageById = async (slotId) => {
  const [rows] = await pool.execute(
    `SELECT
       s.slot_id,
       s.garage_id,
       s.start_datetime,
       s.end_datetime,
       s.status AS slot_status,
       g.status AS garage_status,
       g.manager_user_id
     FROM slots s
     LEFT JOIN garages g ON g.garage_id = s.garage_id
     WHERE s.slot_id = ?
     LIMIT 1`,
    [slotId],
  );

  return rows[0] || null;
};

const hasActiveReservationForSlot = async (slotId) => {
  const [rows] = await pool.execute(
    `SELECT reservation_id
     FROM reservations
     WHERE slot_id = ?
       AND status IN ('pending', 'confirmed')
     LIMIT 1`,
    [slotId],
  );

  return rows[0] || null;
};

const blockSlotById = async ({ slotId, user }) => {
  const slot = await getSlotWithGarageById(slotId);

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

  const activeReservation = await hasActiveReservationForSlot(slotId);

  if (activeReservation) {
    return { errorCode: 'SLOT_CANNOT_BE_BLOCKED' };
  }

  const [updateResult] = await pool.execute(
    `UPDATE slots
     SET status = 'blocked', updated_at = CURRENT_TIMESTAMP
     WHERE slot_id = ?
       AND status = 'available'`,
    [slotId],
  );

  if (updateResult.affectedRows === 0) {
    return { errorCode: 'SLOT_CANNOT_BE_BLOCKED' };
  }

  const [rows] = await pool.execute(
    `SELECT
       slot_id,
       garage_id,
       start_datetime,
       end_datetime,
       status
     FROM slots
     WHERE slot_id = ?
     LIMIT 1`,
    [slotId],
  );

  return {
    slot: rows[0] || null,
  };
};

module.exports = {
  blockSlotById,
  createSlot,
  getAvailableSlotsByGarageId,
};