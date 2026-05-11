const { pool } = require('../../config/database');

const getActiveGarageById = async (garageId) => {
  const [rows] = await pool.execute(
    `SELECT garage_id
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

module.exports = {
  getAvailableSlotsByGarageId,
};