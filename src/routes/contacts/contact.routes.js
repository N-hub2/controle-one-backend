const express = require('express');

const contactController = require('../../controllers/contacts/contact.controller');
const { requireAuth, requireRole } = require('../../middlewares/auth.middleware');

const router = express.Router();

router.post('/', contactController.createContact);
router.get('/', requireAuth, requireRole('admin'), contactController.listContacts);

module.exports = router;
