const { pool } = require('../../config/database');

const getActiveGarageById = async (garageId) => {
  const [rows] = await pool.execute(
    `SELECT garage_id, manager_user_id, status
     FROM garages
     WHERE garage_id = ?
       AND status = 'active'
     LIMIT 1`,
    [garageId],
  );

  return rows[0] || null;
};

const getActiveServiceById = async (serviceId) => {
  const [rows] = await pool.execute(
    `SELECT service_id, status
     FROM services
     WHERE service_id = ?
       AND status = 'active'
     LIMIT 1`,
    [serviceId],
  );

  return rows[0] || null;
};

const getActiveTariffsByGarageId = async (garageId) => {
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
};

const getActiveTariffByGarageAndService = async (garageId, serviceId) => {
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
};

const createTariff = async ({ garageId, serviceId, price, currency }) => {
  let result;

  try {
    [result] = await pool.execute(
      `INSERT INTO tariffs (garage_id, service_id, price, currency)
       VALUES (?, ?, ?, ?)`,
      [garageId, serviceId, price, currency],
    );
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      const duplicateError = new Error('Tariff already exists for this garage and service');
      duplicateError.code = 'TARIFF_DUPLICATE';
      throw duplicateError;
    }

    throw error;
  }

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
    [result.insertId],
  );

  return rows[0] || null;
};

const getActiveTariffById = async (tariffId) => {
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
};

const updateActiveTariffById = async (tariffId, fieldsToUpdate) => {
  const hasPrice = Object.prototype.hasOwnProperty.call(fieldsToUpdate, 'price');
  const hasCurrency = Object.prototype.hasOwnProperty.call(fieldsToUpdate, 'currency');

  if (!hasPrice && !hasCurrency) {
    return null;
  }

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
  } else {
    await pool.execute(
      `UPDATE tariffs
       SET currency = ?
       WHERE tariff_id = ?
         AND status = 'active'`,
      [fieldsToUpdate.currency, tariffId],
    );
  }

  return getActiveTariffById(tariffId);
};

const softDeleteActiveTariffById = async (tariffId) => {
  await pool.execute(
    `UPDATE tariffs
     SET status = 'inactive', updated_at = CURRENT_TIMESTAMP
     WHERE tariff_id = ?
       AND status = 'active'`,
    [tariffId],
  );

  return {
    tariff_id: tariffId,
    status: 'inactive',
  };
};

module.exports = {
  createTariff,
  getActiveGarageById,
  getActiveServiceById,
  getActiveTariffByGarageAndService,
  getActiveTariffById,
  getActiveTariffsByGarageId,
  softDeleteActiveTariffById,
  updateActiveTariffById,
};
