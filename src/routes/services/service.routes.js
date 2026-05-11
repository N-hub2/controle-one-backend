const express = require('express');

const serviceController = require('../../controllers/services/service.controller');
const { requireAuth, requireRole } = require('../../middlewares/auth.middleware');

const router = express.Router();

router.get('/', serviceController.listServices);
router.post('/', requireAuth, requireRole('admin'), serviceController.createService);

module.exports = router;
