const contactService = require('../../services/contacts/contact.service');
const { successResponse, errorResponse } = require('../../utils/apiResponse');

const isValidEmail = (value) => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
};

const isValidPhone = (value) => {
  return /^[+]?[-\d\s().]{7,30}$/.test(value) && /\d/.test(value);
};

const validateCreateContactInput = (body) => {
  const errors = [];
  const name = typeof body.name === 'string' ? body.name.trim() : '';
  const emailOrPhone = typeof body.email_or_phone === 'string' ? body.email_or_phone.trim() : '';
  const message = typeof body.message === 'string' ? body.message.trim() : '';

  if (!name) {
    errors.push({ field: 'name', message: 'Name is required' });
  } else if (name.length < 2 || name.length > 150) {
    errors.push({ field: 'name', message: 'Name must contain between 2 and 150 characters' });
  }

  if (!emailOrPhone) {
    errors.push({ field: 'email_or_phone', message: 'Email or phone is required' });
  } else if (!isValidEmail(emailOrPhone) && !isValidPhone(emailOrPhone)) {
    errors.push({ field: 'email_or_phone', message: 'Email or phone format is invalid' });
  }

  if (!message) {
    errors.push({ field: 'message', message: 'Message is required' });
  } else if (message.length < 10 || message.length > 2000) {
    errors.push({ field: 'message', message: 'Message must contain between 10 and 2000 characters' });
  }

  if (Object.prototype.hasOwnProperty.call(body, 'status')) {
    errors.push({ field: 'status', message: 'Status cannot be set from request body' });
  }

  return {
    errors,
    values: {
      name,
      email_or_phone: emailOrPhone,
      message,
    },
  };
};

const createContact = async (req, res) => {
  const { errors, values } = validateCreateContactInput(req.body || {});

  if (errors.length > 0) {
    return errorResponse(res, 'Validation failed', 400, { errors });
  }

  try {
    const contact = await contactService.createContact(values);

    return successResponse(res, 'Contact message created successfully', { contact }, 201);
  } catch (error) {
    return errorResponse(res, 'Contact message could not be created', 500, {});
  }
};

const listContacts = async (req, res) => {
  try {
    const contacts = await contactService.getContacts();

    return successResponse(res, 'Contacts retrieved successfully', { contacts });
  } catch (error) {
    return errorResponse(res, 'Contacts could not be retrieved', 500, {});
  }
};

module.exports = {
  createContact,
  listContacts,
};
