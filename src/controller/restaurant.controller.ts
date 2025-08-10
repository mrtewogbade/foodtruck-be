import { Request, Response, NextFunction } from "express";
import catchAsync from "../error/catchAsync";
import AppResponse from "../helpers/AppResponse";
import { IUser } from "../interface/user.interface";
import { RestaurantOwner } from "../model/user.model";
import AppError from "../error/AppError";
import { createRestaurantSchema } from "../validations/retaurantValidation";
import { uploadToCloudinary } from "../helpers/UploadToCloudinary";

import upload from "../middleware/multer";

// restaurant.controller.ts
export const createOrUpdateRestaurant = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const user = req.user as IUser;

    if (!user) {
      return next(new AppError("User not found", 404));
    }
    if (!user.isEmailVerified) {
      return next(new AppError("Email must be verified before creating a restaurant", 403));
    }

    // Remove this entire file upload section:
    /*
    if (req.files) {
      if ((req.files as any).logo) {
        const logoFile = (req.files as any).logo[0];
        req.body.logo = await uploadToCloudinary(logoFile.buffer, "logos");
      }
      if ((req.files as any).images) {
        const imageFiles = (req.files as any).images;
        req.body.images = await Promise.all(
          imageFiles.map((file: Express.Multer.File) =>
            uploadToCloudinary(file.buffer, "restaurants")
          )
        );
      }
    }
    */

    const validatedData = createRestaurantSchema.parse(req.body);

    const restaurant = await RestaurantOwner.findOneAndUpdate(
      { _id: user._id },
      { restaurant: validatedData },
      { new: true, upsert: true, runValidators: true }
    );

    if (!restaurant) {
      return next(new AppError("Failed to create or update restaurant", 500));
    }

    return AppResponse(res, "Restaurant created or updated successfully", 201, restaurant);
  }
);

// export const createOrUpdateRestaurant = catchAsync(
//   async (req: Request, res: Response, next: NextFunction) => {
//     const user = req.user as IUser;

//     if (!user) {
//       return next(new AppError("User not found", 404));
//     }
//     if (!user.isEmailVerified) {
//       return next(new AppError("Email must be verified before creating a restaurant", 403));
//     }

//     // Handle file uploads
//     if (req.files) {
//       if ((req.files as any).logo) {
//         const logoFile = (req.files as any).logo[0];
//         req.body.logo = await uploadToCloudinary(logoFile.buffer, "logos");
//       }
//       if ((req.files as any).images) {
//         const imageFiles = (req.files as any).images;
//         req.body.images = await Promise.all(
//           imageFiles.map((file: Express.Multer.File) =>
//             uploadToCloudinary(file.buffer, "restaurants")
//           )
//         );
//       }
//     }
//     const validatedData = createRestaurantSchema.parse(req.body);

//     const restaurant = await RestaurantOwner.findOneAndUpdate(
//       { _id: user._id },
//       { restaurant: validatedData },
//       { new: true, upsert: true, runValidators: true }
//     );

//     if (!restaurant) {
//       return next(new AppError("Failed to create or update restaurant", 500));
//     }

//     return AppResponse(res, "Restaurant created or updated successfully", 201, restaurant);
//   }
// );


