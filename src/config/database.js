// MySQL connection setup will be completed in the next database setup step.
// This placeholder keeps database configuration isolated without opening a real connection yet.

const databaseConfig = {
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
};

module.exports = databaseConfig;
