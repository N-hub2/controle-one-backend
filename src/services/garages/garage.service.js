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

module.exports = {
  getActiveGaragesList,
};
