const express = require('express');

const garageController = require('../../controllers/garages/garage.controller');

const router = express.Router();

router.get('/list', garageController.listGarages);
router.get('/:id', garageController.getGarageById);

module.exports = router;
