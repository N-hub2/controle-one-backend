const { pool } = require('../../config/database');

const rollbackWith = async (connection, errorCode) => {
  await connection.rollback();

  return { errorCode };
};

const getReservationsByUserId = async (userId) => {
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

  return rows.map((row) => ({
    reservation_id: row.reservation_id,
    user_id: row.user_id,
    garage_id: row.garage_id,
    service_id: row.service_id,
    slot_id: row.slot_id,
    status: row.status,
    vehicle_registration: row.vehicle_registration,
    vehicle_make: row.vehicle_make,
    vehicle_model: row.vehicle_model,
    vehicle_year: row.vehicle_year,
    vehicle_version: row.vehicle_version,
    created_at: row.created_at,
    updated_at: row.updated_at,
    garage: {
      garage_id: row.garage_garage_id,
      name: row.garage_name,
      address: row.garage_address,
      city: row.garage_city,
      postal_code: row.garage_postal_code,
      phone: row.garage_phone,
      email: row.garage_email,
      status: row.garage_status,
    },
    service: {
      service_id: row.service_service_id,
      name: row.service_name,
      description: row.service_description,
      status: row.service_status,
    },
    slot: {
      slot_id: row.slot_slot_id,
      start_datetime: row.slot_start_datetime,
      end_datetime: row.slot_end_datetime,
      status: row.slot_status,
    },
  }));
};

const createReservation = async ({
  userId,
  garageId,
  serviceId,
  slotId,
  vehicleRegistration,
  vehicleMake,
  vehicleModel,
  vehicleYear,
  vehicleVersion,
}) => {
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const [slotRows] = await connection.execute(
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

    const slot = slotRows[0] || null;

    if (!slot) {
      return rollbackWith(connection, 'RESOURCE_NOT_FOUND');
    }

    if (slot.status !== 'available') {
      return rollbackWith(connection, 'SLOT_UNAVAILABLE');
    }

    if (new Date(slot.start_datetime).getTime() < Date.now()) {
      return rollbackWith(connection, 'SLOT_UNAVAILABLE');
    }

    if (Number(slot.garage_id) !== Number(garageId)) {
      return rollbackWith(connection, 'GARAGE_SLOT_MISMATCH');
    }

    const [garageRows] = await connection.execute(
      `SELECT garage_id
       FROM garages
       WHERE garage_id = ?
         AND status = 'active'
       LIMIT 1`,
      [garageId],
    );

    if (!garageRows[0]) {
      return rollbackWith(connection, 'RESOURCE_NOT_FOUND');
    }

    const [serviceRows] = await connection.execute(
      `SELECT service_id
       FROM services
       WHERE service_id = ?
         AND status = 'active'
       LIMIT 1`,
      [serviceId],
    );

    if (!serviceRows[0]) {
      return rollbackWith(connection, 'RESOURCE_NOT_FOUND');
    }

    const [tariffRows] = await connection.execute(
      `SELECT tariff_id
       FROM tariffs
       WHERE garage_id = ?
         AND service_id = ?
         AND status = 'active'
       LIMIT 1`,
      [garageId, serviceId],
    );

    if (!tariffRows[0]) {
      return rollbackWith(connection, 'RESOURCE_NOT_FOUND');
    }

    let reservationInsertResult;

    try {
      [reservationInsertResult] = await connection.execute(
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
    } catch (error) {
      if (error.code === 'ER_DUP_ENTRY') {
        return rollbackWith(connection, 'SLOT_UNAVAILABLE');
      }

      throw error;
    }

    const [slotUpdateResult] = await connection.execute(
      `UPDATE slots
       SET status = 'booked', updated_at = CURRENT_TIMESTAMP
       WHERE slot_id = ?
         AND status = 'available'`,
      [slotId],
    );

    if (slotUpdateResult.affectedRows === 0) {
      return rollbackWith(connection, 'SLOT_UNAVAILABLE');
    }

    const [reservationRows] = await connection.execute(
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
      [reservationInsertResult.insertId],
    );

    await connection.commit();

    return {
      reservation: reservationRows[0] || null,
    };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};

module.exports = {
  getReservationsByUserId,
  createReservation,
};
