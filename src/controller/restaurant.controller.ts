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

// update restaurant
// delete restaurant
// get restaurant by id
// get all restaurants

