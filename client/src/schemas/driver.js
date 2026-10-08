import { z } from 'zod';

/**
 * Driver Schema
 */
export const driverSchema = z.object({
  license_no: z
    .string()
    .min(1, 'License number is required')
    .max(50, 'License number must not exceed 50 characters'),
  license_category: z
    .string()
    .min(1, 'License category is required')
    .max(50, 'License category must not exceed 50 characters'),
  license_expiry: z
    .string()
    .min(1, 'License expiry date is required')
    .refine((val) => {
      const date = new Date(val);
      return !isNaN(date.getTime());
    }, 'Please enter a valid date')
    .refine((val) => {
      const date = new Date(val);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return date >= today;
    }, 'License expiry date must be in the future'),
  phone: z
    .string()
    .regex(/^[\d\s\-\+\(\)]*$/, 'Please enter a valid phone number')
    .min(10, 'Phone number must be at least 10 digits')
    .max(20, 'Phone number must not exceed 20 characters')
    .optional()
    .or(z.literal('')),
  safety_score: z
    .number({ invalid_type_error: 'Safety score must be a number' })
    .min(0, 'Safety score must be between 0 and 100')
    .max(100, 'Safety score must be between 0 and 100')
    .optional()
    .or(
      z.string().transform((val) => {
        if (!val) return 100;
        const num = parseInt(val);
        if (isNaN(num) || num < 0 || num > 100) {
          throw new Error('Safety score must be between 0 and 100');
        }
        return num;
      })
    ),
  status: z
    .enum(['Available', 'On Trip', 'Suspended'])
    .optional(),
});
