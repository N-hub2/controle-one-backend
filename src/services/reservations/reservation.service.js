const { pool } = require('../../config/database');

const rollbackWith = async (connection, errorCode) => {
  await connection.rollback();

  return { errorCode };
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
  createReservation,
};
