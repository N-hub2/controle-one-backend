const { pool } = require('../../config/database');

const searchGarages = async ({ postalCode, city, serviceId, priceMax }) => {
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
         SELECT MIN(t_min.price)
         FROM tariffs t_min
         INNER JOIN services s_min ON s_min.service_id = t_min.service_id
         WHERE t_min.garage_id = g.garage_id
           AND t_min.status = 'active'
           AND s_min.status = 'active'
       ) AS min_price,
       (
         SELECT COUNT(slt.slot_id)
         FROM slots slt
         WHERE slt.garage_id = g.garage_id
           AND slt.status = 'available'
           AND slt.start_datetime >= NOW()
       ) AS available_slots_count
     FROM garages g
     WHERE g.status = 'active'
       AND (? IS NULL OR g.postal_code = ?)
       AND (? IS NULL OR LOWER(g.city) = LOWER(?))
       AND (
         ? IS NULL
         OR EXISTS (
           SELECT 1
           FROM tariffs t_service
           INNER JOIN services s_service ON s_service.service_id = t_service.service_id
           WHERE t_service.garage_id = g.garage_id
             AND t_service.status = 'active'
             AND s_service.status = 'active'
             AND t_service.service_id = ?
         )
       )
       AND (
         ? IS NULL
         OR EXISTS (
           SELECT 1
           FROM tariffs t_price
           WHERE t_price.garage_id = g.garage_id
             AND t_price.status = 'active'
             AND t_price.price <= ?
         )
       )
     ORDER BY g.city ASC, g.name ASC`,
    [
      postalCode ?? null,
      postalCode ?? null,
      city ?? null,
      city ?? null,
      serviceId ?? null,
      serviceId ?? null,
      priceMax ?? null,
      priceMax ?? null,
    ],
  );

  return rows.map((garage) => ({
    ...garage,
    available_slots_count: Number(garage.available_slots_count),
  }));
};

module.exports = {
  searchGarages,
};
