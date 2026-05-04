const express = require('express');
const cors = require('cors');

const healthRoutes = require('./routes/health.routes');
const errorMiddleware = require('./middlewares/error.middleware');

const app = express();

const frontendUrl = process.env.FRONTEND_URL || 'http://localhost/controle-one-frontend-';

app.use(cors({
  origin: frontendUrl,
}));
app.use(express.json());

app.use('/api/health', healthRoutes);

app.use(errorMiddleware);

module.exports = app;
