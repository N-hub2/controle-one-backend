const express = require('express');

const tariffController = require('../../controllers/tariffs/tariff.controller');
const { requireAuth, requireRole } = require('../../middlewares/auth.middleware');

const router = express.Router();

router.get('/', tariffController.listTariffs);
router.post('/', requireAuth, requireRole('garage', 'admin'), tariffController.createTariff);
router.put('/:id', requireAuth, requireRole('garage', 'admin'), tariffController.updateTariff);
router.delete('/:id', requireAuth, requireRole('garage', 'admin'), tariffController.deleteTariff);

module.exports = router;
