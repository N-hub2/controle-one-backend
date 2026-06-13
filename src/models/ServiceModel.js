const { pool } = require('../config/database');

async function findAll() {
  const [rows] = await pool.execute(
    `SELECT service_id, name, description, status
     FROM services
     WHERE status = 'active'
     ORDER BY name ASC`,
  );

  return rows;
}

async function findByName(name) {
  const [rows] = await pool.execute(
    `SELECT service_id
     FROM services
     WHERE LOWER(name) = LOWER(?)
     LIMIT 1`,
    [name],
  );

  return rows[0] || null;
}

async function createService({ name, description }) {
  const [result] = await pool.execute(
    `INSERT INTO services (name, description)
     VALUES (?, ?)`,
    [name, description],
  );

  return result.insertId;
}

module.exports = {
  findAll,
  findByName,
  createService,
};
