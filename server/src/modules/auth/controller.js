import bcrypt from 'bcryptjs';
import { query } from '../../config/db.js';
import { generateToken } from '../../middleware/auth.js';
import { 
  AppError, 
  ErrorCodes, 
  unauthorizedError,
  validationError 
} from '../../utils/errors.js';
import { successResponse, createdResponse } from '../../utils/response.js';
import { UserRoles, PASSWORD_MIN_LENGTH } from '../../utils/constants.js';

const SALT_ROUNDS = 10;

/**
 * Register a new user
 */
export const register = async (req, res, next) => {
  try {
    const { name, email, password, role } = req.body;

    // Validate role
    if (!Object.values(UserRoles).includes(role)) {
      throw validationError('Invalid role specified');
    }

    // Validate password length
    if (password.length < PASSWORD_MIN_LENGTH) {
      throw validationError(`Password must be at least ${PASSWORD_MIN_LENGTH} characters`);
    }

    // Check if user already exists
    const existingUser = await query(
      'SELECT id FROM users WHERE email = $1',
      [email]
    );

    if (existingUser.rows.length > 0) {
      throw new AppError(
        ErrorCodes.ALREADY_EXISTS,
        'User with this email already exists',
        400
      );
    }

    // Hash password
    const password_hash = await bcrypt.hash(password, SALT_ROUNDS);

    // Create user
    const result = await query(
      `INSERT INTO users (name, email, password_hash, role, is_active)
       VALUES ($1, $2, $3, $4, true)
       RETURNING id, name, email, role, is_active, created_at`,
      [name, email, password_hash, role]
    );

    const user = result.rows[0];

    // Generate token
    const token = generateToken(user.id, user.role);

    createdResponse(res, {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        is_active: user.is_active,
      },
      token,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Login user
 */
export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Find user
    const result = await query(
      'SELECT id, name, email, password_hash, role, is_active FROM users WHERE email = $1',
      [email]
    );

    if (result.rows.length === 0) {
      throw unauthorizedError('Invalid email or password');
    }

    const user = result.rows[0];

    // Check if account is active
    if (!user.is_active) {
      throw new AppError(
        ErrorCodes.FORBIDDEN,
        'Account is inactive',
        403
      );
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);

    if (!isPasswordValid) {
      throw unauthorizedError('Invalid email or password');
    }

    // Generate token
    const token = generateToken(user.id, user.role);

    successResponse(res, {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        is_active: user.is_active,
      },
      token,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get current user info
 */
export const me = async (req, res, next) => {
  try {
    // User is already attached by authenticate middleware
    successResponse(res, {
      user: {
        id: req.user.id,
        name: req.user.name,
        email: req.user.email,
        role: req.user.role,
        is_active: req.user.is_active,
      },
    });
  } catch (error) {
    next(error);
  }
};
