import { Request, Response, NextFunction } from "express";
import catchAsync from "../error/catchAsync";
import AppResponse from "../helpers/AppResponse";
import AppError from "../error/AppError";
import { createRestaurantSchema } from "../validations/retaurantValidation";
import Restaurant from "../model/restaurant.model";
import { uploadMedia } from "../helpers/uploadAndDeleteImage copy";

export const createRestaurantHandler = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { name,  } = req.body;
    const parseResult = createRestaurantSchema.safeParse(req.body);
    if (!parseResult.success) {
      return next(new AppError(parseResult.error.errors[0].message, 400));
    }
    let imageUrl = null;
    if (req.file) {
      const result = await uploadMedia([req.file]);
      imageUrl = result[0]?.imageUrl;
    }

    const restaurant = await Restaurant.create({
      name,
      logo: [
        {
          key: req.file?.filename,
          url: imageUrl,
          alt: name,
        },
      ],
    });

    return AppResponse(res, "Restaurant created successfully.", 201, restaurant);
  }
);

// update restaurant (admin only)
export const updateRestaurantHandler = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;
    const updateData = req.body;

    const restaurant = await Restaurant.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    });

    if (!restaurant) {
      return next(new AppError("Restaurant not found", 404));
    }

    return AppResponse(res, "Restaurant updated successfully", 200, restaurant);
  }
);

// delete restaurant (admin only)
export const deleteRestaurantHandler = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;

    const restaurant = await Restaurant.findByIdAndDelete(id);

    if (!restaurant) {
      return next(new AppError("Restaurant not found", 404));
    }

    return AppResponse(res, "Restaurant deleted successfully", 200, null);
  }
);

// get restaurant by id
export const getRestaurantByIdHandler = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;

    const restaurant = await Restaurant.findById(id).populate("foodItems");

    if (!restaurant) {
      return next(new AppError("Restaurant not found", 404));
    }

    return AppResponse(res, "Restaurant retrieved successfully", 200, restaurant);
  }
);

// get all restaurants
export const getAllRestaurantsHandler = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const restaurants = await Restaurant.find().populate("foodItems");

    return AppResponse(res, "Restaurants retrieved successfully", 200, restaurants);
  }
);



// update restaurant (admin only)
// delete restaurant (admin only)
// get restaurant by id
// get all restaurants

