const express = require('express');
const cors = require('cors');

const authRoutes = require('./routes/auth/auth.routes');
const garageRoutes = require('./routes/garages/garage.routes');
const healthRoutes = require('./routes/health.routes');
const notFoundMiddleware = require('./middlewares/notFound.middleware');
const errorMiddleware = require('./middlewares/error.middleware');

const app = express();

const allowedOrigins = [
  process.env.FRONTEND_URL,
  'http://localhost',
  'http://localhost:3000',
  'http://localhost:5173',
  'http://localhost:5500',
  'http://127.0.0.1:5500',
].filter(Boolean);

const corsOptions = {
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    return callback(null, false);
  },
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
};

app.use(cors(corsOptions));
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/garages', garageRoutes);
app.use('/api/health', healthRoutes);

app.use(notFoundMiddleware);
app.use(errorMiddleware);

module.exports = app;
