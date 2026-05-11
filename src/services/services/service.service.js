const { pool } = require('../../config/database');

const getActiveServices = async () => {
  const [rows] = await pool.execute(
    `SELECT service_id, name, description, status
     FROM services
     WHERE status = 'active'
     ORDER BY name ASC`,
  );

  return rows;
};

const findServiceByName = async (name) => {
  const [rows] = await pool.execute(
    `SELECT service_id
     FROM services
     WHERE LOWER(name) = LOWER(?)
     LIMIT 1`,
    [name],
  );

  return rows[0] || null;
};

const createService = async ({ name, description }) => {
  const sanitizedName = name.trim();
  const sanitizedDescription =
    typeof description === 'string' && description.trim().length > 0 ? description.trim() : null;

  const existingService = await findServiceByName(sanitizedName);

  if (existingService) {
    const error = new Error('Service name already exists');
    error.code = 'SERVICE_NAME_ALREADY_EXISTS';
    throw error;
  }

  let result;

  try {
    [result] = await pool.execute(
      `INSERT INTO services (name, description)
       VALUES (?, ?)`,
      [sanitizedName, sanitizedDescription],
    );
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      const duplicateError = new Error('Service name already exists');
      duplicateError.code = 'SERVICE_NAME_ALREADY_EXISTS';
      throw duplicateError;
    }

    throw error;
  }

  return {
    service_id: result.insertId,
    name: sanitizedName,
    description: sanitizedDescription,
    status: 'active',
  };
};

module.exports = {
  createService,
  getActiveServices,
};
