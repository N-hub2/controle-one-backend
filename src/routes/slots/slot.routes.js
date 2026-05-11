const express = require('express');
const slotController = require('../../controllers/slots/slot.controller');
const { requireAuth, requireRole } = require('../../middlewares/auth.middleware');

const router = express.Router();

router.get('/available', slotController.listAvailableSlots);
router.post('/', requireAuth, requireRole('garage', 'admin'), slotController.createSlot);
router.patch('/:id/block', requireAuth, requireRole('garage', 'admin'), slotController.blockSlot);

module.exports = router;