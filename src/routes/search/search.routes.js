const express = require('express');

const searchController = require('../../controllers/search/search.controller');

const router = express.Router();

router.get('/garages', searchController.searchGarages);

module.exports = router;
