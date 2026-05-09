const authService = require('../../services/auth/auth.service');
const { successResponse, errorResponse } = require('../../utils/apiResponse');

const allowedRoles = ['client', 'garage'];

const isValidEmail = (email) => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};

const validateRegisterInput = (body) => {
  const errors = [];
  const firstName = typeof body.first_name === 'string' ? body.first_name.trim() : '';
  const lastName = typeof body.last_name === 'string' ? body.last_name.trim() : '';
  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
  const password = typeof body.password === 'string' ? body.password : '';
  const phone = typeof body.phone === 'string' ? body.phone.trim() : null;
  const role = body.role ? String(body.role).trim().toLowerCase() : 'client';

  if (!firstName) {
    errors.push({ field: 'first_name', message: 'First name is required' });
  }

  if (!lastName) {
    errors.push({ field: 'last_name', message: 'Last name is required' });
  }

  if (!email) {
    errors.push({ field: 'email', message: 'Email is required' });
  } else if (!isValidEmail(email)) {
    errors.push({ field: 'email', message: 'Email format is invalid' });
  }

  if (!password) {
    errors.push({ field: 'password', message: 'Password is required' });
  } else if (password.length < 8) {
    errors.push({ field: 'password', message: 'Password must contain at least 8 characters' });
  }

  if (!allowedRoles.includes(role)) {
    errors.push({ field: 'role', message: 'Role must be client or garage' });
  }

  return {
    errors,
    values: {
      first_name: firstName,
      last_name: lastName,
      email,
      password,
      phone,
      role,
    },
  };
};

const validateLoginInput = (body) => {
  const errors = [];
  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
  const password = typeof body.password === 'string' ? body.password : '';

  if (!email) {
    errors.push({ field: 'email', message: 'Email is required' });
  } else if (!isValidEmail(email)) {
    errors.push({ field: 'email', message: 'Email format is invalid' });
  }

  if (!password || password.trim().length === 0) {
    errors.push({ field: 'password', message: 'Password is required' });
  }

  return {
    errors,
    values: {
      email,
      password,
    },
  };
};

const register = async (req, res, next) => {
  try {
    const { errors, values } = validateRegisterInput(req.body || {});

    if (errors.length > 0) {
      return errorResponse(res, 'Validation failed', 400, { errors });
    }

    const user = await authService.registerUser(values);

    return successResponse(res, 'User registered successfully', { user }, 201);
  } catch (error) {
    if (error.code === 'EMAIL_ALREADY_EXISTS') {
      return errorResponse(res, 'Email already exists', 409, {});
    }

    return errorResponse(res, 'Registration failed', 500, {});
  }
};

const login = async (req, res) => {
  try {
    const { errors, values } = validateLoginInput(req.body || {});

    if (errors.length > 0) {
      return errorResponse(res, 'Validation failed', 400, { errors });
    }

    const { token, user } = await authService.loginUser(values);

    return successResponse(res, 'Login successful', { token, user });
  } catch (error) {
    if (error.code === 'INVALID_CREDENTIALS' || error.code === 'USER_NOT_ACTIVE') {
      return errorResponse(res, 'Invalid email or password', 401, {});
    }

    return errorResponse(res, 'Login failed', 500, {});
  }
};

module.exports = {
  login,
  register,
};
