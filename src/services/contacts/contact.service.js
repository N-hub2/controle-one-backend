const ContactModel = require('../../models/ContactModel');

const createContact = async (payload) => {
  return ContactModel.createContact(payload);
};

const getContacts = async () => {
  return ContactModel.findAll();
};

module.exports = {
  createContact,
  getContacts,
};
