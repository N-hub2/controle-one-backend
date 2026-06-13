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

async function findActiveServiceById(serviceId) {
  const [rows] = await pool.execute(
    `SELECT service_id, status
     FROM services
     WHERE service_id = ?
       AND status = 'active'
     LIMIT 1`,
    [serviceId],
  );

  return rows[0] || null;
}

async function findActiveByGarageId(garageId) {
  const [rows] = await pool.execute(
    `SELECT
       t.tariff_id,
       t.garage_id,
       t.service_id,
       s.name AS service_name,
       s.description AS service_description,
       t.price,
       t.currency,
       t.status
     FROM tariffs t
     INNER JOIN services s ON s.service_id = t.service_id
     WHERE t.garage_id = ?
       AND t.status = 'active'
       AND s.status = 'active'
     ORDER BY s.name ASC`,
    [garageId],
  );

  return rows;
}

async function findActiveByGarageAndService(garageId, serviceId) {
  const [rows] = await pool.execute(
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

async function createTariff({ garageId, serviceId, price, currency }) {
  const [result] = await pool.execute(
    `INSERT INTO tariffs (garage_id, service_id, price, currency)
     VALUES (?, ?, ?, ?)`,
    [garageId, serviceId, price, currency],
  );

  return result.insertId;
}

async function findById(tariffId) {
  const [rows] = await pool.execute(
    `SELECT
       t.tariff_id,
       t.garage_id,
       t.service_id,
       s.name AS service_name,
       s.description AS service_description,
       t.price,
       t.currency,
       t.status
     FROM tariffs t
     INNER JOIN services s ON s.service_id = t.service_id
     WHERE t.tariff_id = ?
     LIMIT 1`,
    [tariffId],
  );

  return rows[0] || null;
}

async function findActiveById(tariffId) {
  const [rows] = await pool.execute(
    `SELECT
       t.tariff_id,
       t.garage_id,
       t.service_id,
       s.name AS service_name,
       s.description AS service_description,
       t.price,
       t.currency,
       t.status,
       g.manager_user_id
     FROM tariffs t
     INNER JOIN garages g ON g.garage_id = t.garage_id
     INNER JOIN services s ON s.service_id = t.service_id
     WHERE t.tariff_id = ?
       AND t.status = 'active'
     LIMIT 1`,
    [tariffId],
  );

  return rows[0] || null;
}

async function updateActiveById(tariffId, fieldsToUpdate) {
  const hasPrice = Object.prototype.hasOwnProperty.call(fieldsToUpdate, 'price');
  const hasCurrency = Object.prototype.hasOwnProperty.call(fieldsToUpdate, 'currency');

  if (hasPrice && hasCurrency) {
    await pool.execute(
      `UPDATE tariffs
       SET price = ?, currency = ?
       WHERE tariff_id = ?
         AND status = 'active'`,
      [fieldsToUpdate.price, fieldsToUpdate.currency, tariffId],
    );
  } else if (hasPrice) {
    await pool.execute(
      `UPDATE tariffs
       SET price = ?
       WHERE tariff_id = ?
         AND status = 'active'`,
      [fieldsToUpdate.price, tariffId],
    );
  } else if (hasCurrency) {
    await pool.execute(
      `UPDATE tariffs
       SET currency = ?
       WHERE tariff_id = ?
         AND status = 'active'`,
      [fieldsToUpdate.currency, tariffId],
    );
  }
}

async function softDeleteActiveById(tariffId) {
  await pool.execute(
    `UPDATE tariffs
     SET status = 'inactive', updated_at = CURRENT_TIMESTAMP
     WHERE tariff_id = ?
       AND status = 'active'`,
    [tariffId],
  );
}

module.exports = {
  findActiveGarageById,
  findActiveServiceById,
  findActiveByGarageId,
  findActiveByGarageAndService,
  createTariff,
  findById,
  findActiveById,
  updateActiveById,
  softDeleteActiveById,
};
