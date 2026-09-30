import express from 'express';
import { body } from 'express-validator';
import { register, login, me } from './controller.js';
import { authenticate } from '../../middleware/auth.js';
import { validate, asyncHandler } from '../../middleware/validator.js';
import { PASSWORD_MIN_LENGTH } from '../../utils/constants.js';

const router = express.Router();

/**
 * @route   POST /api/auth/register
 * @desc    Register a new user
 * @access  Public
 */
router.post(
  '/register',
  [
    body('name')
      .trim()
      .notEmpty()
      .withMessage('Name is required')
      .isLength({ max: 255 })
      .withMessage('Name must not exceed 255 characters'),
    body('email')
      .trim()
      .notEmpty()
      .withMessage('Email is required')
      .isEmail()
      .withMessage('Valid email is required')
      .normalizeEmail(),
    body('password')
      .notEmpty()
      .withMessage('Password is required')
      .isLength({ min: PASSWORD_MIN_LENGTH })
      .withMessage(`Password must be at least ${PASSWORD_MIN_LENGTH} characters`),
    body('role')
      .notEmpty()
      .withMessage('Role is required'),
    validate,
  ],
  asyncHandler(register)
);

/**
 * @route   POST /api/auth/login
 * @desc    Login user
 * @access  Public
 */
router.post(
  '/login',
  [
    body('email')
      .trim()
      .notEmpty()
      .withMessage('Email is required')
      .isEmail()
      .withMessage('Valid email is required')
      .normalizeEmail(),
    body('password')
      .notEmpty()
      .withMessage('Password is required'),
    validate,
  ],
  asyncHandler(login)
);

/**
 * @route   GET /api/auth/me
 * @desc    Get current user
 * @access  Private
 */
router.get('/me', authenticate, asyncHandler(me));

export default router;
