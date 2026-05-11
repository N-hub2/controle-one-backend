const express = require('express');

const reservationController = require('../../controllers/reservations/reservation.controller');
const { requireAuth, requireRole } = require('../../middlewares/auth.middleware');

const router = express.Router();

router.get('/me', requireAuth, requireRole('client'), reservationController.getMyReservations);
router.post('/', requireAuth, requireRole('client'), reservationController.createReservation);

module.exports = router;
