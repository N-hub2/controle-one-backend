const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const UserModel = require('../../models/UserModel');

const SALT_ROUNDS = 12;
const TOKEN_EXPIRES_IN = '1d';

const getUserById = async (userId) => {
  return UserModel.findById(userId);
};

const registerUser = async ({ first_name, last_name, email, password, phone, role }) => {
  const existingUser = await UserModel.findByEmail(email);

  if (existingUser) {
    const error = new Error('Email already exists');
    error.code = 'EMAIL_ALREADY_EXISTS';
    throw error;
  }

  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

  let userId;

  try {
    userId = await UserModel.createUser({
      firstname: first_name,
      lastname: last_name,
      email,
      passwordHash,
      phone,
      role,
    });
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      const duplicateEmailError = new Error('Email already exists');
      duplicateEmailError.code = 'EMAIL_ALREADY_EXISTS';
      throw duplicateEmailError;
    }

    throw error;
  }

  return {
    user_id: userId,
    first_name,
    last_name,
    email,
    phone,
    role,
    status: 'active',
  };
};

const loginUser = async ({ email, password }) => {
  const user = await UserModel.findByEmail(email);

  if (!user) {
    const error = new Error('Invalid email or password');
    error.code = 'INVALID_CREDENTIALS';
    throw error;
  }

  if (user.status !== 'active') {
    const error = new Error('User is not active');
    error.code = 'USER_NOT_ACTIVE';
    throw error;
  }

  const isPasswordValid = await bcrypt.compare(password, user.password_hash);

  if (!isPasswordValid) {
    const error = new Error('Invalid email or password');
    error.code = 'INVALID_CREDENTIALS';
    throw error;
  }

  if (!process.env.JWT_SECRET) {
    const error = new Error('Authentication configuration is missing');
    error.code = 'AUTH_CONFIGURATION_MISSING';
    throw error;
  }

  const token = jwt.sign(
    {
      user_id: user.user_id,
      email: user.email,
      role: user.role,
    },
    process.env.JWT_SECRET,
    { expiresIn: TOKEN_EXPIRES_IN },
  );

  return {
    token,
    user: {
      user_id: user.user_id,
      first_name: user.first_name,
      last_name: user.last_name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      status: user.status,
    },
  };
};

module.exports = {
  getUserById,
  loginUser,
  registerUser,
};
