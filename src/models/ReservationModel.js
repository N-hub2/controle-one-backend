const { pool } = require('../config/database');

async function findAllByUserId(userId) {
  const [rows] = await pool.execute(
    `SELECT
       r.reservation_id,
       r.user_id,
       r.garage_id,
       r.service_id,
       r.slot_id,
       r.status,
       r.vehicle_registration,
       r.vehicle_make,
       r.vehicle_model,
       r.vehicle_year,
       r.vehicle_version,
       r.created_at,
       r.updated_at,
       g.garage_id AS garage_garage_id,
       g.name AS garage_name,
       g.address AS garage_address,
       g.city AS garage_city,
       g.postal_code AS garage_postal_code,
       g.phone AS garage_phone,
       g.email AS garage_email,
       g.status AS garage_status,
       s.service_id AS service_service_id,
       s.name AS service_name,
       s.description AS service_description,
       s.status AS service_status,
       sl.slot_id AS slot_slot_id,
       sl.start_datetime AS slot_start_datetime,
       sl.end_datetime AS slot_end_datetime,
       sl.status AS slot_status
     FROM reservations r
     INNER JOIN garages g ON r.garage_id = g.garage_id
     INNER JOIN services s ON r.service_id = s.service_id
     INNER JOIN slots sl ON r.slot_id = sl.slot_id
     WHERE r.user_id = ?
     ORDER BY r.created_at DESC`,
    [userId],
  );

  return rows;
}

async function findGarageAccessById(garageId) {
  const [rows] = await pool.execute(
    `SELECT
       garage_id,
       manager_user_id,
       status
     FROM garages
     WHERE garage_id = ?
     LIMIT 1`,
    [garageId],
  );

  return rows[0] || null;
}

async function findAllByGarageId(garageId) {
  const [rows] = await pool.execute(
    `SELECT
       r.reservation_id,
       r.user_id,
       r.garage_id,
       r.service_id,
       r.slot_id,
       r.status,
       r.vehicle_registration,
       r.vehicle_make,
       r.vehicle_model,
       r.vehicle_year,
       r.vehicle_version,
       r.created_at,
       r.updated_at,
       u.user_id AS user_user_id,
       u.first_name AS user_first_name,
       u.last_name AS user_last_name,
       u.email AS user_email,
       u.phone AS user_phone,
       u.role AS user_role,
       u.status AS user_status,
       s.service_id AS service_service_id,
       s.name AS service_name,
       s.description AS service_description,
       s.status AS service_status,
       sl.slot_id AS slot_slot_id,
       sl.start_datetime AS slot_start_datetime,
       sl.end_datetime AS slot_end_datetime,
       sl.status AS slot_status
     FROM reservations r
     INNER JOIN users u ON r.user_id = u.user_id
     INNER JOIN services s ON r.service_id = s.service_id
     INNER JOIN slots sl ON r.slot_id = sl.slot_id
     WHERE r.garage_id = ?
     ORDER BY r.created_at DESC`,
    [garageId],
  );

  return rows;
}

async function findByIdForUpdate(reservationId, connection) {
  const [rows] = await connection.execute(
    `SELECT
       r.reservation_id,
       r.user_id,
       r.garage_id,
       r.service_id,
       r.slot_id,
       r.status,
       r.vehicle_registration,
       r.vehicle_make,
       r.vehicle_model,
       r.vehicle_year,
       r.vehicle_version,
       r.cancelled_at,
       r.confirmed_at,
       r.created_at,
       r.updated_at,
       sl.status AS slot_status,
       sl.start_datetime AS slot_start_datetime,
       g.manager_user_id,
       g.status AS garage_status
     FROM reservations r
     INNER JOIN slots sl ON r.slot_id = sl.slot_id
     INNER JOIN garages g ON r.garage_id = g.garage_id
     WHERE r.reservation_id = ?
     LIMIT 1
     FOR UPDATE`,
    [reservationId],
  );

  return rows[0] || null;
}

async function findById(reservationId, connection) {
  const [rows] = await connection.execute(
    `SELECT
       reservation_id,
       user_id,
       garage_id,
       service_id,
       slot_id,
       status,
       vehicle_registration,
       vehicle_make,
       vehicle_model,
       vehicle_year,
       vehicle_version,
       cancelled_at,
       confirmed_at,
       created_at,
       updated_at
     FROM reservations
     WHERE reservation_id = ?
     LIMIT 1`,
    [reservationId],
  );

  return rows[0] || null;
}

async function cancelById(reservationId, connection) {
  const [result] = await connection.execute(
    `UPDATE reservations
     SET status = 'cancelled',
         cancelled_at = CURRENT_TIMESTAMP,
         updated_at = CURRENT_TIMESTAMP
     WHERE reservation_id = ?
       AND status IN ('pending', 'confirmed')`,
    [reservationId],
  );

  return result.affectedRows;
}

async function confirmById(reservationId, connection) {
  const [result] = await connection.execute(
    `UPDATE reservations
     SET status = 'confirmed',
         confirmed_at = CURRENT_TIMESTAMP,
         updated_at = CURRENT_TIMESTAMP
     WHERE reservation_id = ?
       AND status = 'pending'`,
    [reservationId],
  );

  return result.affectedRows;
}

async function findActiveGarageById(garageId, connection) {
  const [rows] = await connection.execute(
    `SELECT garage_id
     FROM garages
     WHERE garage_id = ?
       AND status = 'active'
     LIMIT 1`,
    [garageId],
  );

  return rows[0] || null;
}

async function findActiveServiceById(serviceId, connection) {
  const [rows] = await connection.execute(
    `SELECT service_id
     FROM services
     WHERE service_id = ?
       AND status = 'active'
     LIMIT 1`,
    [serviceId],
  );

  return rows[0] || null;
}

async function findActiveTariffByGarageAndService(garageId, serviceId, connection) {
  const [rows] = await connection.execute(
    `SELECT tariff_id
     FROM tariffs
     WHERE garage_id = ?
       AND service_id = ?
       AND status = 'active'
     LIMIT 1`,
    [garageId, serviceId],
  );

  return rows[0] || null;
}

async function createReservation(
  {
    userId,
    garageId,
    serviceId,
    slotId,
    vehicleRegistration,
    vehicleMake,
    vehicleModel,
    vehicleYear,
    vehicleVersion,
  },
  connection,
) {
  const [result] = await connection.execute(
    `INSERT INTO reservations (
       user_id,
       garage_id,
       service_id,
       slot_id,
       status,
       vehicle_registration,
       vehicle_make,
       vehicle_model,
       vehicle_year,
       vehicle_version
     )
     VALUES (?, ?, ?, ?, 'pending', ?, ?, ?, ?, ?)`,
    [
      userId,
      garageId,
      serviceId,
      slotId,
      vehicleRegistration,
      vehicleMake,
      vehicleModel,
      vehicleYear,
      vehicleVersion,
    ],
  );

  return result.insertId;
}

async function findCreatedReservationById(reservationId, connection) {
  const [rows] = await connection.execute(
    `SELECT
       reservation_id,
       user_id,
       garage_id,
       service_id,
       slot_id,
       status,
       vehicle_registration,
       vehicle_make,
       vehicle_model,
       vehicle_year,
       vehicle_version
     FROM reservations
     WHERE reservation_id = ?
     LIMIT 1`,
    [reservationId],
  );

  return rows[0] || null;
}
module.exports = {
  findAllByUserId,
  findGarageAccessById,
  findAllByGarageId,
  findByIdForUpdate,
  findById,
  cancelById,
  confirmById,
  findActiveGarageById,
  findActiveServiceById,
  findActiveTariffByGarageAndService,
  createReservation,
  findCreatedReservationById,
};