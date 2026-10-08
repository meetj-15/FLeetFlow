import { z } from 'zod';

/**
 * Expense Schema
 */
export const expenseSchema = z.object({
  vehicle_id: z
    .string()
    .uuid('Please select a valid vehicle')
    .optional()
    .or(z.literal('')),
  trip_id: z
    .string()
    .uuid('Please select a valid trip')
    .optional()
    .or(z.literal('')),
  category: z.enum(
    ['Tolls', 'Parking', 'Maintenance', 'Fuel', 'Insurance', 'Other'],
    {
      errorMap: () => ({ message: 'Please select a valid expense category' }),
    }
  ),
  amount: z
    .number({ invalid_type_error: 'Amount must be a number' })
    .min(0, 'Amount cannot be negative')
    .or(
      z.string().transform((val) => {
        const num = parseFloat(val);
        if (isNaN(num) || num < 0) {
          throw new Error('Amount cannot be negative');
        }
        return num;
      })
    ),
  description: z
    .string()
    .max(1000, 'Description must not exceed 1000 characters')
    .optional(),
  expense_date: z
    .string()
    .min(1, 'Expense date is required')
    .refine((val) => {
      const date = new Date(val);
      return !isNaN(date.getTime());
    }, 'Please enter a valid date'),
});
