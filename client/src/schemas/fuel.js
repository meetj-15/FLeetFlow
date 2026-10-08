import { z } from 'zod';

/**
 * Fuel Log Schema
 */
export const fuelSchema = z.object({
  vehicle_id: z
    .string()
    .min(1, 'Vehicle is required')
    .uuid('Please select a valid vehicle'),
  trip_id: z
    .string()
    .uuid('Please select a valid trip')
    .optional()
    .or(z.literal('')),
  liters: z
    .number({ invalid_type_error: 'Liters must be a number' })
    .positive('Liters must be greater than 0')
    .or(
      z.string().transform((val) => {
        const num = parseFloat(val);
        if (isNaN(num) || num <= 0) {
          throw new Error('Liters must be greater than 0');
        }
        return num;
      })
    ),
  cost: z
    .number({ invalid_type_error: 'Cost must be a number' })
    .min(0, 'Cost cannot be negative')
    .or(
      z.string().transform((val) => {
        const num = parseFloat(val);
        if (isNaN(num) || num < 0) {
          throw new Error('Cost cannot be negative');
        }
        return num;
      })
    ),
  fuel_date: z
    .string()
    .min(1, 'Fuel date is required')
    .refine((val) => {
      const date = new Date(val);
      return !isNaN(date.getTime());
    }, 'Please enter a valid date'),
});
