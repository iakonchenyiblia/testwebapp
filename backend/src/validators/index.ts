import { z } from 'zod';

export const registerSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  phone: z.string().optional(),
});

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

export const serviceCreateSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  price: z.number().positive('Price must be positive'),
  duration: z.number().int().positive('Duration must be positive'),
  categoryId: z.string().uuid('Invalid category ID'),
  imageUrl: z.string().url().optional(),
  specialistId: z.string().uuid().optional(),
});

export const bookingCreateSchema = z.object({
  serviceId: z.string().uuid('Invalid service ID'),
  scheduleId: z.string().uuid('Invalid schedule ID'),
  notes: z.string().optional(),
});

export const reviewCreateSchema = z.object({
  serviceId: z.string().uuid('Invalid service ID'),
  rating: z.number().int().min(1).max(5),
  comment: z.string().optional(),
});

export const paymentCreateSchema = z.object({
  bookingId: z.string().uuid('Invalid booking ID'),
  paymentMethod: z.string().optional(),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type ServiceCreateInput = z.infer<typeof serviceCreateSchema>;
export type BookingCreateInput = z.infer<typeof bookingCreateSchema>;
export type ReviewCreateInput = z.infer<typeof reviewCreateSchema>;
export type PaymentCreateInput = z.infer<typeof paymentCreateSchema>;
