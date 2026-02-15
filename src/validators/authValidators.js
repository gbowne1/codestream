import { body, validationResult } from 'express-validator';

/**
 * Middleware that returns 400 with validation errors if any checks failed.
 * Call after running validation chains.
 */
export const handleValidationErrors = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            message: 'Validation failed.',
            errors: errors.array().map((e) => ({ field: e.path, msg: e.msg })),
        });
    }
    next();
};

/**
 * Validation rules for POST /api/auth/register
 * Aligns with User model: username (max 50), email, password (min 6)
 */
export const registerValidation = [
    body('username')
        .trim()
        .notEmpty()
        .withMessage('Username is required')
        .isLength({ max: 50 })
        .withMessage('Username must be at most 50 characters')
        .matches(/^[a-zA-Z0-9_-]+$/)
        .withMessage('Username may only contain letters, numbers, underscores, and hyphens'),
    body('email')
        .trim()
        .notEmpty()
        .withMessage('Email is required')
        .isEmail()
        .withMessage('Please provide a valid email address')
        .normalizeEmail(),
    body('password')
        .notEmpty()
        .withMessage('Password is required')
        .isLength({ min: 6 })
        .withMessage('Password must be at least 6 characters'),
];

/**
 * Validation rules for POST /api/auth/login
 */
export const loginValidation = [
    body('email')
        .trim()
        .notEmpty()
        .withMessage('Email is required')
        .isEmail()
        .withMessage('Please provide a valid email address')
        .normalizeEmail(),
    body('password').notEmpty().withMessage('Password is required'),
];
