// src/controllers/foodController.ts
import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import Food from '../model/Food.model'; // Adjust path to your Food model
import Restaurant from '../model/restaurant.model';// Adjust path to your Restaurant model
import { CreateFoodSchema } from '../validations/foodValidation';
import catchAsync from "../error/catchAsync";
import AppError from "../error/AppError";
import AppResponse from "../helpers/AppResponse";
import { IFood } from '../interface/food.interface';
import mongoose from 'mongoose';


// Upload (create) a new food item
export const uploadFood = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    // Validate request body using Zod
    const validatedData = CreateFoodSchema.safeParse(req.body);
    if (!validatedData.success) {
      return next(new AppError('Validation failed', 400));
    }

    const { restaurant, name, description, price, image } = validatedData.data;

    // Check if restaurant exists
    const restaurantExists = await Restaurant.findById(restaurant);
    if (!restaurantExists) {
      return next(new AppError('Restaurant not found', 404));
    }

    // Check if food with same name and restaurant already exists
    const existingFood = await Food.findOne({ name, restaurant });
    if (existingFood) {
      return next(new AppError('A food item with this name already exists for this restaurant', 400));
    }

    // Create new food item
    const newFood: IFood = new Food({
      restaurant,
      name,
      description,
      price,
      image,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // Save to database
    const savedFood = await newFood.save();

    // Populate restaurant field
    const populatedFood = await savedFood.populate('restaurant');

    return AppResponse(res, 'Food item uploaded successfully', 201, {
      food: populatedFood,
    });
  }
);


// delete food
// Delete a food item by ID
export const deleteFood = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    // Validate request params using Zod
    const DeleteFoodSchema = z.object({
      id: z
        .string({ required_error: 'Food ID is required' })
        .refine((val) => mongoose.Types.ObjectId.isValid(val), {
          message: 'Food ID must be a valid MongoDB ObjectId',
        }),
    });

    const validatedData = DeleteFoodSchema.safeParse(req.params);
    if (!validatedData.success) {
      return next(new AppError('Validation failed', 400));
    }

    const { id } = validatedData.data;

    // Find food item by ID
    const food = await Food.findById(id);
    if (!food) {
      return next(new AppError('Food item not found', 404));
    }

    // Delete the food item
    await Food.deleteOne({ _id: id });

    return AppResponse(res, 'Food item deleted successfully', 200, {
      foodId: id,
    });
  }
);


// get food by ID
export const getFoodById = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    // Validate request para
    // ms using Zod
    const GetFoodSchema = z.object({
      id: z
        .string({ required_error: 'Food ID is required' })
        .refine((val) => mongoose.Types.ObjectId.isValid(val), {
          message: 'Food ID must be a valid MongoDB ObjectId',
        }),
    });

    const validatedData = GetFoodSchema.safeParse(req.params);
    if (!validatedData.success) {
      return next(new AppError('Validation failed', 400));
    }

    const { id } = validatedData.data;

    // Find food item by ID and populate restaurant
    const food = await Food.findById(id).populate('restaurant');
    if (!food) {
      return next(new AppError('Food item not found', 404));
    }

    return AppResponse(res, 'Food item fetched successfully', 200, {
      food,
    });
  }
);




// get all foods
export const getAllFoods = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    // Fetch all foods and populate restaurant
    const foods = await Food.find().populate('restaurant');

    if (!foods || foods.length === 0) {
      return next(new AppError('No food items found', 404));
    }

    return AppResponse(res, 'All food items fetched successfully', 200, {
      foods,
      total: foods.length,
    });
  }
);



// update food (admin only)
export const updateFood = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    // Validate params
    const UpdateFoodParamsSchema = z.object({
      id: z
        .string({ required_error: 'Food ID is required' })
        .refine((val) => mongoose.Types.ObjectId.isValid(val), {
          message: 'Food ID must be a valid MongoDB ObjectId',
        }),
    });

    const validatedParams = UpdateFoodParamsSchema.safeParse(req.params);
    if (!validatedParams.success) {
      return next(new AppError('Validation failed', 400));
    }
    const { id } = validatedParams.data;

    // Validate body (optional fields for updating)
    const UpdateFoodBodySchema = z.object({
      restaurant: z.string().optional(),
      name: z.string().min(1).optional(),
      description: z.string().optional(),
      price: z.number().positive().optional(),
      image: z.string().url().optional(),
    });

    const validatedBody = UpdateFoodBodySchema.safeParse(req.body);
    if (!validatedBody.success) {
      return next(new AppError('Validation failed', 400));
    }

    const updateData = validatedBody.data;

    // If restaurant provided, check if exists
    if (updateData.restaurant) {
      const restaurantExists = await Restaurant.findById(updateData.restaurant);
      if (!restaurantExists) {
        return next(new AppError('Restaurant not found', 404));
      }
    }

    // Find and update food
    const updatedFood = await Food.findByIdAndUpdate(
      id,
      { ...updateData, updatedAt: new Date() },
      { new: true, runValidators: true }
    ).populate('restaurant');

    if (!updatedFood) {
      return next(new AppError('Food item not found', 404));
    }

    return AppResponse(res, 'Food item updated successfully', 200, {
      food: updatedFood,
    });
  }
);




// delete food (admin only)
export const deleteFoodAdminOnly = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    // 🔐 Admin-only check (assumes req.user is populated by auth middleware)
    // Type assertion to include isAdmin property
    if (!req.user || !(req.user as { isAdmin?: boolean }).isAdmin) {
      return next(new AppError('Not authorized to delete food', 403));
    }

    // Validate request params using Zod
    const DeleteFoodSchema = z.object({
      id: z
        .string({ required_error: 'Food ID is required' })
        .refine((val) => mongoose.Types.ObjectId.isValid(val), {
          message: 'Food ID must be a valid MongoDB ObjectId',
        }),
    });

    const validatedData = DeleteFoodSchema.safeParse(req.params);
    if (!validatedData.success) {
      return next(new AppError('Validation failed', 400));
    }

    const { id } = validatedData.data;

    const food = await Food.findById(id);
    if (!food) {
      return next(new AppError('Food item not found', 404));
    }

    await Food.deleteOne({ _id: id });

    return AppResponse(res, 'Food item deleted successfully', 200, {
      foodId: id,
    });
  }
);