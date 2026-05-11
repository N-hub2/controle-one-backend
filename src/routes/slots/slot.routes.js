const express = require('express');
const slotController = require('../../controllers/slots/slot.controller');

const router = express.Router();

router.get('/available', slotController.listAvailableSlots);

module.exports = router;