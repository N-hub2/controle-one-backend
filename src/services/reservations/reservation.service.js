const { pool } = require('../../config/database');

const rollbackWith = async (connection, errorCode) => {
  await connection.rollback();

  return { errorCode };
};

const getReservationForUpdate = async (connection, reservationId) => {
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
};

const getReservationById = async (connection, reservationId) => {
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
};

const cancelReservationById = async (reservationId, user) => {
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const reservation = await getReservationForUpdate(connection, reservationId);

    if (!reservation) {
      return rollbackWith(connection, 'RESERVATION_NOT_FOUND');
    }

    if (reservation.garage_status !== 'active') {
      return rollbackWith(connection, 'RESOURCE_NOT_FOUND');
    }

    if (user.role === 'garage') {
      if (Number(reservation.manager_user_id) !== Number(user.user_id)) {
        return rollbackWith(connection, 'ACCESS_FORBIDDEN');
      }
    } else if (user.role === 'client') {
      if (Number(reservation.user_id) !== Number(user.user_id)) {
        return rollbackWith(connection, 'ACCESS_FORBIDDEN');
      }
    } else if (user.role !== 'admin') {
      return rollbackWith(connection, 'ACCESS_FORBIDDEN');
    }

    if (reservation.status !== 'pending' && reservation.status !== 'confirmed') {
      return rollbackWith(connection, 'INVALID_STATE_TRANSITION');
    }

    const [reservationUpdate] = await connection.execute(
      `UPDATE reservations
       SET status = 'cancelled',
           cancelled_at = CURRENT_TIMESTAMP,
           updated_at = CURRENT_TIMESTAMP
       WHERE reservation_id = ?
         AND status IN ('pending', 'confirmed')`,
      [reservationId],
    );

    if (reservationUpdate.affectedRows === 0) {
      return rollbackWith(connection, 'INVALID_STATE_TRANSITION');
    }

    const shouldReleaseSlot =
      reservation.slot_status === 'booked' &&
      new Date(reservation.slot_start_datetime).getTime() >= Date.now();

    if (shouldReleaseSlot) {
      await connection.execute(
        `UPDATE slots
         SET status = 'available',
             updated_at = CURRENT_TIMESTAMP
         WHERE slot_id = ?
           AND status = 'booked'`,
        [reservation.slot_id],
      );
    }

    const updatedReservation = await getReservationById(connection, reservationId);

    await connection.commit();

    return { reservation: updatedReservation };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};

const confirmReservationById = async (reservationId, user) => {
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const reservation = await getReservationForUpdate(connection, reservationId);

    if (!reservation) {
      return rollbackWith(connection, 'RESERVATION_NOT_FOUND');
    }

    if (reservation.garage_status !== 'active') {
      return rollbackWith(connection, 'RESOURCE_NOT_FOUND');
    }

    if (user.role === 'garage') {
      if (Number(reservation.manager_user_id) !== Number(user.user_id)) {
        return rollbackWith(connection, 'ACCESS_FORBIDDEN');
      }
    } else if (user.role !== 'admin') {
      return rollbackWith(connection, 'ACCESS_FORBIDDEN');
    }

    if (reservation.status !== 'pending') {
      return rollbackWith(connection, 'INVALID_STATE_TRANSITION');
    }

    const [reservationUpdate] = await connection.execute(
      `UPDATE reservations
       SET status = 'confirmed',
           confirmed_at = CURRENT_TIMESTAMP,
           updated_at = CURRENT_TIMESTAMP
       WHERE reservation_id = ?
         AND status = 'pending'`,
      [reservationId],
    );

    if (reservationUpdate.affectedRows === 0) {
      return rollbackWith(connection, 'INVALID_STATE_TRANSITION');
    }

    const updatedReservation = await getReservationById(connection, reservationId);

    await connection.commit();

    return { reservation: updatedReservation };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
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

const getReservationsByGarageId = async ({ garageId, user }) => {
  const [garageRows] = await pool.execute(
    `SELECT
       garage_id,
       manager_user_id,
       status
     FROM garages
     WHERE garage_id = ?
     LIMIT 1`,
    [garageId],
  );

  const garage = garageRows[0] || null;

  if (!garage || garage.status !== 'active') {
    return { errorCode: 'GARAGE_NOT_FOUND' };
  }

  if (user.role === 'garage') {
    if (Number(garage.manager_user_id) !== Number(user.user_id)) {
      return { errorCode: 'ACCESS_FORBIDDEN' };
    }
  } else if (user.role !== 'admin') {
    return { errorCode: 'ACCESS_FORBIDDEN' };
  }

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

  return {
    reservations: rows.map((row) => ({
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
      user: {
        user_id: row.user_user_id,
        first_name: row.user_first_name,
        last_name: row.user_last_name,
        email: row.user_email,
        phone: row.user_phone,
        role: row.user_role,
        status: row.user_status,
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
    })),
  };
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
  cancelReservationById,
  confirmReservationById,
  getReservationsByGarageId,
  getReservationsByUserId,
  createReservation,
};
