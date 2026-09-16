// validations/authValidation.js
const { z } = require('zod');

const PASSWORD_COMPLEXITY_REGEX =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?`~])/;
const PASSWORD_COMPLEXITY_MESSAGE =
  'Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, one number, and one special character.';

const registerSchema = z.object({
  name: z
    .string({ message: 'Name, email, and password are required' })
    .trim()
    .min(1, 'Name, email, and password are required'),
  email: z
    .string({ message: 'Name, email, and password are required' })
    .trim()
    .min(1, 'Name, email, and password are required')
    .email('Please provide a valid email address'),
  password: z
    .string({ message: 'Name, email, and password are required' })
    .min(8, PASSWORD_COMPLEXITY_MESSAGE)
    .regex(PASSWORD_COMPLEXITY_REGEX, PASSWORD_COMPLEXITY_MESSAGE),
});

const loginSchema = z.object({
  email: z
    .string({ message: 'Email and password are required' })
    .trim()
    .min(1, 'Email and password are required')
    .email('Please provide a valid email address'),
  password: z
    .string({ message: 'Email and password are required' })
    .min(1, 'Email and password are required'),
});

const adminLoginSchema = z.object({
  email: z
    .string({ message: 'Email and password are required' })
    .trim()
    .min(1, 'Email and password are required'),
  password: z
    .string({ message: 'Email and password are required' })
    .min(1, 'Email and password are required'),
});

const forgotPasswordSchema = z.object({
  email: z
    .string({ message: 'Email is required' })
    .trim()
    .min(1, 'Email is required')
    .email('Please provide a valid email address'),
});

const resetPasswordSchema = z.object({
  token: z
    .string({ message: 'Reset token and new password are required' })
    .trim()
    .min(1, 'Reset token and new password are required'),
  password: z
    .string({ message: 'Reset token and new password are required' })
    .min(8, PASSWORD_COMPLEXITY_MESSAGE)
    .regex(PASSWORD_COMPLEXITY_REGEX, PASSWORD_COMPLEXITY_MESSAGE),
});

const updateProfileSchema = z.object({
  name: z.string().trim().min(1, 'Name cannot be empty').optional(),
  email: z.string().trim().email('Please provide a valid email address').optional(),
  password: z
    .string()
    .min(8, PASSWORD_COMPLEXITY_MESSAGE)
    .regex(PASSWORD_COMPLEXITY_REGEX, PASSWORD_COMPLEXITY_MESSAGE)
    .optional(),
});

module.exports = {
  registerSchema,
  loginSchema,
  adminLoginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  updateProfileSchema,
  PASSWORD_COMPLEXITY_REGEX,
  PASSWORD_COMPLEXITY_MESSAGE,
};
