const express = require('express');

const reservationController = require('../../controllers/reservations/reservation.controller');
const { requireAuth, requireRole } = require('../../middlewares/auth.middleware');

const router = express.Router();

router.get('/me', requireAuth, requireRole('client'), reservationController.getMyReservations);
router.get('/garage/:garage_id', requireAuth, requireRole('garage', 'admin'), reservationController.getGarageReservations);
router.patch('/:id/cancel', requireAuth, requireRole('client', 'garage', 'admin'), reservationController.cancelReservation);
router.patch('/:id/confirm', requireAuth, requireRole('garage', 'admin'), reservationController.confirmReservation);
router.post('/', requireAuth, requireRole('client'), reservationController.createReservation);

module.exports = router;
