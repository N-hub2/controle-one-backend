const { pool } = require('../../config/database');
const ReservationModel = require('../../models/ReservationModel');
const SlotModel = require('../../models/SlotModel');

const rollbackWith = async (connection, errorCode) => {
  await connection.rollback();

  return { errorCode };
};

const cancelReservationById = async (reservationId, user) => {
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const reservation = await ReservationModel.findByIdForUpdate(reservationId, connection);

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

    const affectedRows = await ReservationModel.cancelById(reservationId, connection);

    if (affectedRows === 0) {
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

    const updatedReservation = await ReservationModel.findById(reservationId, connection);

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

    const reservation = await ReservationModel.findByIdForUpdate(reservationId, connection);

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

    const affectedRows = await ReservationModel.confirmById(reservationId, connection);

    if (affectedRows === 0) {
      return rollbackWith(connection, 'INVALID_STATE_TRANSITION');
    }

    const updatedReservation = await ReservationModel.findById(reservationId, connection);

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
  const rows = await ReservationModel.findAllByUserId(userId);

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
  const garage = await ReservationModel.findGarageAccessById(garageId);

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

  const rows = await ReservationModel.findAllByGarageId(garageId);

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

    const slot = await SlotModel.findByIdForUpdate(slotId, connection);

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

    const garage = await ReservationModel.findActiveGarageById(garageId, connection);

    if (!garage) {
      return rollbackWith(connection, 'RESOURCE_NOT_FOUND');
    }

    const service = await ReservationModel.findActiveServiceById(serviceId, connection);

    if (!service) {
      return rollbackWith(connection, 'RESOURCE_NOT_FOUND');
    }

    const tariff = await ReservationModel.findActiveTariffByGarageAndService(
      garageId,
      serviceId,
      connection,
    );

    if (!tariff) {
      return rollbackWith(connection, 'RESOURCE_NOT_FOUND');
    }

    let reservationId;

    try {
      reservationId = await ReservationModel.createReservation(
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
      );
    } catch (error) {
      if (error.code === 'ER_DUP_ENTRY') {
        return rollbackWith(connection, 'SLOT_UNAVAILABLE');
      }

      throw error;
    }

    const affectedRows = await SlotModel.markBookedIfAvailable(slotId, connection);

    if (affectedRows === 0) {
      return rollbackWith(connection, 'SLOT_UNAVAILABLE');
    }

    const reservation = await ReservationModel.findCreatedReservationById(reservationId, connection);

    await connection.commit();

    return { reservation };
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
