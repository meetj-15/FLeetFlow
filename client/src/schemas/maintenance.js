import { z } from 'zod';

/**
 * Maintenance Schema
 */
export const maintenanceSchema = z.object({
  vehicle_id: z
    .string()
    .min(1, 'Vehicle is required')
    .uuid('Please select a valid vehicle'),
  maintenance_type: z
    .string()
    .min(1, 'Maintenance type is required')
    .max(100, 'Maintenance type must not exceed 100 characters'),
  description: z
    .string()
    .max(1000, 'Description must not exceed 1000 characters')
    .optional(),
  cost: z
    .number({ invalid_type_error: 'Cost must be a number' })
    .min(0, 'Cost cannot be negative')
    .or(
      z.string().transform((val) => {
        if (!val) return 0;
        const num = parseFloat(val);
        if (isNaN(num) || num < 0) {
          throw new Error('Cost cannot be negative');
        }
        return num;
      })
    ),
  start_date: z
    .string()
    .min(1, 'Start date is required')
    .refine((val) => {
      const date = new Date(val);
      return !isNaN(date.getTime());
    }, 'Please enter a valid date'),
});
