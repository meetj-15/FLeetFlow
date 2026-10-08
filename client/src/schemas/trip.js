import { z } from 'zod';

/**
 * Trip Creation Schema
 */
export const tripSchema = z.object({
  vehicle_id: z
    .string()
    .min(1, 'Vehicle is required')
    .uuid('Please select a valid vehicle'),
  driver_id: z
    .string()
    .min(1, 'Driver is required')
    .uuid('Please select a valid driver'),
  source: z
    .string()
    .min(1, 'Source is required')
    .max(255, 'Source must not exceed 255 characters'),
  destination: z
    .string()
    .min(1, 'Destination is required')
    .max(255, 'Destination must not exceed 255 characters'),
  cargo_weight: z
    .number({ invalid_type_error: 'Cargo weight must be a number' })
    .positive('Cargo weight must be greater than 0')
    .or(
      z.string().transform((val) => {
        const num = parseFloat(val);
        if (isNaN(num) || num <= 0) {
          throw new Error('Cargo weight must be greater than 0');
        }
        return num;
      })
    ),
  planned_distance: z
    .number({ invalid_type_error: 'Planned distance must be a number' })
    .positive('Planned distance must be greater than 0')
    .or(
      z.string().transform((val) => {
        const num = parseFloat(val);
        if (isNaN(num) || num <= 0) {
          throw new Error('Planned distance must be greater than 0');
        }
        return num;
      })
    ),
  revenue: z
    .number({ invalid_type_error: 'Revenue must be a number' })
    .min(0, 'Revenue cannot be negative')
    .optional()
    .or(
      z.string().transform((val) => {
        if (!val) return 0;
        const num = parseFloat(val);
        if (isNaN(num) || num < 0) {
          throw new Error('Revenue cannot be negative');
        }
        return num;
      })
    ),
  scheduled_date: z
    .string()
    .optional()
    .refine((val) => {
      if (!val) return true;
      const date = new Date(val);
      return !isNaN(date.getTime());
    }, 'Please enter a valid date'),
});

/**
 * Trip Completion Schema
 */
export const tripCompleteSchema = z.object({
  actual_distance: z
    .number({ invalid_type_error: 'Actual distance must be a number' })
    .positive('Actual distance must be greater than 0')
    .or(
      z.string().transform((val) => {
        const num = parseFloat(val);
        if (isNaN(num) || num <= 0) {
          throw new Error('Actual distance must be greater than 0');
        }
        return num;
      })
    ),
  end_odometer: z
    .number({ invalid_type_error: 'End odometer must be a number' })
    .min(0, 'End odometer cannot be negative')
    .or(
      z.string().transform((val) => {
        const num = parseFloat(val);
        if (isNaN(num) || num < 0) {
          throw new Error('End odometer cannot be negative');
        }
        return num;
      })
    ),
});
