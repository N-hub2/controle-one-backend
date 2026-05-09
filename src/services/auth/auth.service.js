const bcrypt = require('bcrypt');

const { pool } = require('../../config/database');

const SALT_ROUNDS = 12;

const findUserByEmail = async (email) => {
  const [rows] = await pool.execute(
    `SELECT user_id
     FROM users
     WHERE email = ?
     LIMIT 1`,
    [email],
  );

  return rows[0] || null;
};

const registerUser = async ({ first_name, last_name, email, password, phone, role }) => {
  const existingUser = await findUserByEmail(email);

  if (existingUser) {
    const error = new Error('Email already exists');
    error.code = 'EMAIL_ALREADY_EXISTS';
    throw error;
  }

  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

  let result;

  try {
    [result] = await pool.execute(
      `INSERT INTO users (first_name, last_name, email, password_hash, phone, role)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [first_name, last_name, email, passwordHash, phone, role],
    );
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      const duplicateEmailError = new Error('Email already exists');
      duplicateEmailError.code = 'EMAIL_ALREADY_EXISTS';
      throw duplicateEmailError;
    }

    throw error;
  }

  return {
    user_id: result.insertId,
    first_name,
    last_name,
    email,
    phone,
    role,
    status: 'active',
  };
};

module.exports = {
  registerUser,
};
