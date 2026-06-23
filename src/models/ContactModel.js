const { pool } = require('../config/database');

async function createContact({ name, email_or_phone, message }) {
  const [result] = await pool.execute(
    `INSERT INTO contacts (name, email_or_phone, message)
     VALUES (?, ?, ?)`,
    [name, email_or_phone, message],
  );

  const [rows] = await pool.execute(
    `SELECT contact_id, name, email_or_phone, message, status, created_at, updated_at
     FROM contacts
     WHERE contact_id = ?
     LIMIT 1`,
    [result.insertId],
  );

  return rows[0] || null;
}

async function findAll() {
  const [rows] = await pool.execute(
    `SELECT contact_id, name, email_or_phone, message, status, created_at, updated_at
     FROM contacts
     ORDER BY created_at DESC`,
  );

  return rows;
}

module.exports = {
  createContact,
  findAll,
};
