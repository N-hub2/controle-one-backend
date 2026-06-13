const { pool } = require('../config/database');

async function findByEmail(email) {
  const [rows] = await pool.execute(
    `SELECT user_id, first_name, last_name, email, password_hash, phone, role, status
     FROM users
     WHERE email = ?
     LIMIT 1`,
    [email],
  );

  return rows[0] || null;
}

async function findById(userId) {
  const [rows] = await pool.execute(
    `SELECT user_id, first_name, last_name, email, phone, role, status, created_at, updated_at
     FROM users
     WHERE user_id = ?
     LIMIT 1`,
    [userId],
  );

  return rows[0] || null;
}

async function createUser({ firstname, lastname, email, passwordHash, phone, role }) {
  const [result] = await pool.execute(
    `INSERT INTO users (first_name, last_name, email, password_hash, phone, role)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [firstname, lastname, email, passwordHash, phone, role],
  );

  return result.insertId;
}

module.exports = {
  findByEmail,
  findById,
  createUser,
};
