require('dotenv').config();

const mysql = require('mysql2/promise');

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT) || 3306,
  database: process.env.DB_NAME || 'controle_one',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

const testDatabaseConnection = async () => {
  const [rows] = await pool.query('SELECT 1 AS connection_test');

  return rows;
};

module.exports = {
  pool,
  testDatabaseConnection,
};
