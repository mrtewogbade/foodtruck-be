// src/validation/foodValidation.ts
import { z } from 'zod';
import mongoose from 'mongoose';

// Zod schema for validating the image object
const ImageSchema = z.object({
  key: z
    .string({ required_error: 'Image key is required' })
    .min(1, 'Image key must not be empty'),
  url: z
    .string({ required_error: 'Image URL is required' })
    .url('Image URL must be a valid URL'),
  alt: z
    .string()
    .optional()
    .nullable(),
});

// Zod schema for creating a food item
export const CreateFoodSchema = z.object({
  restaurant: z
    .string({ required_error: 'Restaurant ID is required' })
    .refine((val) => mongoose.Types.ObjectId.isValid(val), {
      message: 'Restaurant ID must be a valid MongoDB ObjectId',
    }),
  name: z
    .string({ required_error: 'Name is required' })
    .min(2, 'Name must be at least 2 characters long')
    .max(100, 'Name must not exceed 100 characters'),
  description: z
    .string({ required_error: 'Description is required' })
    .min(10, 'Description must be at least 10 characters long')
    .max(500, 'Description must not exceed 500 characters'),
  price: z
    .number({ required_error: 'Price is required' })
    .positive('Price must be a positive number'),
  image: ImageSchema,
});