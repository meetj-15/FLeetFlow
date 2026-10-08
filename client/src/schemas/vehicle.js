import { z } from 'zod';

/**
 * Vehicle Schema
 */
export const vehicleSchema = z.object({
  registration_no: z
    .string()
    .min(1, 'Registration number is required')
    .max(50, 'Registration number must not exceed 50 characters'),
  vehicle_name: z
    .string()
    .min(1, 'Vehicle name is required')
    .max(255, 'Vehicle name must not exceed 255 characters'),
  model: z
    .string()
    .max(255, 'Model must not exceed 255 characters')
    .optional(),
  vehicle_type: z
    .string()
    .min(1, 'Vehicle type is required')
    .max(100, 'Vehicle type must not exceed 100 characters'),
  region: z
    .string()
    .min(1, 'Region is required')
    .max(100, 'Region must not exceed 100 characters'),
  max_load_capacity: z
    .number({ invalid_type_error: 'Capacity must be a number' })
    .positive('Capacity must be greater than 0')
    .or(
      z.string().transform((val) => {
        const num = parseFloat(val);
        if (isNaN(num) || num <= 0) {
          throw new Error('Capacity must be greater than 0');
        }
        return num;
      })
    ),
  odometer: z
    .number({ invalid_type_error: 'Odometer must be a number' })
    .min(0, 'Odometer cannot be negative')
    .optional()
    .or(
      z.string().transform((val) => {
        if (!val) return 0;
        const num = parseFloat(val);
        if (isNaN(num) || num < 0) {
          throw new Error('Odometer cannot be negative');
        }
        return num;
      })
    ),
  acquisition_cost: z
    .number({ invalid_type_error: 'Acquisition cost must be a number' })
    .min(0, 'Acquisition cost cannot be negative')
    .optional()
    .or(
      z.string().transform((val) => {
        if (!val) return 0;
        const num = parseFloat(val);
        if (isNaN(num) || num < 0) {
          throw new Error('Acquisition cost cannot be negative');
        }
        return num;
      })
    ),
  status: z
    .enum(['Available', 'On Trip', 'In Shop', 'Retired'])
    .optional(),
});
