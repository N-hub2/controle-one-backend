const { pool } = require('../../config/database');

const getActiveGaragesList = async () => {
  const [rows] = await pool.execute(
    `SELECT
       g.garage_id,
       g.name,
       g.address,
       g.city,
       g.postal_code,
       g.phone,
       g.email,
       g.description,
       g.status,
       (
         SELECT MIN(t.price)
         FROM tariffs t
         WHERE t.garage_id = g.garage_id
           AND t.status = 'active'
       ) AS min_price,
       (
         SELECT COUNT(s.slot_id)
         FROM slots s
         WHERE s.garage_id = g.garage_id
           AND s.status = 'available'
           AND s.start_datetime >= NOW()
       ) AS available_slots_count
     FROM garages g
     WHERE g.status = 'active'
     ORDER BY g.city ASC, g.name ASC`,
  );

  return rows.map((garage) => ({
    ...garage,
    available_slots_count: Number(garage.available_slots_count),
  }));
};

const getGarageDetailsById = async (garageId) => {
  const [garageRows] = await pool.execute(
    `SELECT
       g.garage_id,
       g.name,
       g.address,
       g.city,
       g.postal_code,
       g.phone,
       g.email,
       g.description,
       g.status
     FROM garages g
     WHERE g.garage_id = ?
       AND g.status = 'active'
     LIMIT 1`,
    [garageId],
  );

  if (!garageRows.length) {
    return null;
  }

  const [tariffRows] = await pool.execute(
    `SELECT
       t.tariff_id,
       t.service_id,
       s.name AS service_name,
       s.description AS service_description,
       t.price,
       t.currency
     FROM tariffs t
     INNER JOIN services s ON s.service_id = t.service_id
     WHERE t.garage_id = ?
       AND t.status = 'active'
       AND s.status = 'active'
     ORDER BY s.name ASC`,
    [garageId],
  );

  const [slotRows] = await pool.execute(
    `SELECT
       s.slot_id,
       s.start_datetime,
       s.end_datetime,
       s.status
     FROM slots s
     WHERE s.garage_id = ?
       AND s.status = 'available'
       AND s.start_datetime >= NOW()
     ORDER BY s.start_datetime ASC`,
    [garageId],
  );

  return {
    ...garageRows[0],
    tariffs: tariffRows,
    available_slots: slotRows,
  };
};

module.exports = {
  getActiveGaragesList,
  getGarageDetailsById,
};
