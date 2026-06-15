const { pool } = require('../config/database');

async function findActiveGarageById(garageId) {
  const [rows] = await pool.execute(
    `SELECT garage_id, manager_user_id, status
     FROM garages
     WHERE garage_id = ?
       AND status = 'active'
     LIMIT 1`,
    [garageId],
  );

  return rows[0] || null;
}

async function findAvailableByGarageId(garageId) {
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
}

async function findOverlappingSlot({ garageId, statuses, startDatetime, endDatetime }) {
  const [rows] = await pool.execute(
    `SELECT slot_id
     FROM slots
     WHERE garage_id = ?
       AND status IN (?, ?, ?)
       AND start_datetime < ?
       AND end_datetime > ?
     LIMIT 1`,
    [garageId, statuses[0], statuses[1], statuses[2], endDatetime, startDatetime],
  );

  return rows[0] || null;
}

async function createSlot({ garageId, startDatetime, endDatetime }) {
  const [result] = await pool.execute(
    `INSERT INTO slots (garage_id, start_datetime, end_datetime, status)
     VALUES (?, ?, ?, 'available')`,
    [garageId, startDatetime, endDatetime],
  );

  return result.insertId;
}

async function findById(slotId) {
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

  return rows[0] || null;
}

async function findWithGarageById(slotId) {
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
}

async function findActiveReservationBySlotId(slotId) {
  const [rows] = await pool.execute(
    `SELECT reservation_id
     FROM reservations
     WHERE slot_id = ?
       AND status IN ('pending', 'confirmed')
     LIMIT 1`,
    [slotId],
  );

  return rows[0] || null;
}

async function blockAvailableById(slotId) {
  const [result] = await pool.execute(
    `UPDATE slots
     SET status = 'blocked', updated_at = CURRENT_TIMESTAMP
     WHERE slot_id = ?
       AND status = 'available'`,
    [slotId],
  );

  return result.affectedRows;
}

async function findByIdForUpdate(slotId, connection) {
  const [rows] = await connection.execute(
    `SELECT
       slot_id,
       garage_id,
       start_datetime,
       end_datetime,
       status
     FROM slots
     WHERE slot_id = ?
     LIMIT 1
     FOR UPDATE`,
    [slotId],
  );

  return rows[0] || null;
}

async function markBookedIfAvailable(slotId, connection) {
  const [result] = await connection.execute(
    `UPDATE slots
     SET status = 'booked', updated_at = CURRENT_TIMESTAMP
     WHERE slot_id = ?
       AND status = 'available'`,
    [slotId],
  );

  return result.affectedRows;
}
module.exports = {
  findActiveGarageById,
  findAvailableByGarageId,
  findOverlappingSlot,
  createSlot,
  findById,
  findWithGarageById,
  findActiveReservationBySlotId,
  blockAvailableById,
  findByIdForUpdate,
  markBookedIfAvailable,
};
