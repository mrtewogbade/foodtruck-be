import { Request, Response, NextFunction } from "express";
import catchAsync from "../error/catchAsync";
import AppResponse from "../helpers/AppResponse";
import AppError from "../error/AppError";
import { createRestaurantSchema } from "../validations/retaurantValidation";
import Restaurant from "../model/restaurant.model";
import { uploadMedia } from "../helpers/uploadAndDeleteImage";
import { uploadMediaWithRetry } from "../helpers/uploadAndDeleteImage";
import { deleteImage } from "../helpers/uploadAndDeleteImage";

export const createRestaurantHandler = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    console.log("=== DEBUG INFO ===");
    console.log("Content-Type:", req.headers['content-type']);
    console.log("Body:", req.body);
    console.log("File:", req.file ? {
      fieldname: req.file.fieldname,
      originalname: req.file.originalname,
      mimetype: req.file.mimetype,
      size: req.file.size
    } : null);
    console.log("==================");

    const { name, address } = req.body;

    // Validate required fields
    if (!name) {
      return next(new AppError("Restaurant name is required", 400));
    }

    // Validate with schema
    const parseResult = createRestaurantSchema.safeParse(req.body);
    if (!parseResult.success) {
      console.log("Validation error:", parseResult.error.errors);
      return next(new AppError(parseResult.error.errors[0].message, 400));
    }

    let imageUrl = null;
    let fileKey = null;

    if (req.file) {
      try {
        console.log("Starting upload process...");
        
        // Use the retry upload function
        const result = await uploadMediaWithRetry([req.file], 3);
        imageUrl = result[0]?.imageUrl;
        fileKey = result[0]?.key;
        
        console.log("Upload completed successfully:", { imageUrl, fileKey });
      } catch (error: any) {
        console.error("Upload error:", error);
        
        // Check if it's a timeout specifically
        if (error.message.includes('timeout') || error.message.includes('Timeout')) {
          return next(new AppError("Image upload timed out. Please try with a smaller image or check your internet connection.", 408));
        }
        
        // Check if it's authentication
        if (error.message.includes('authentication')) {
          return next(new AppError("Image upload service configuration error. Please contact support.", 500));
        }
        
        return next(new AppError(`Failed to upload image: ${error.message}`, 500));
      }
    }

    try {
      const restaurant = await Restaurant.create({
        name,
        address: address || null,
        logo: req.file ? [
          {
            key: fileKey,
            url: imageUrl,
            alt: name,
          },
        ] : [],
      });

      console.log("Restaurant created successfully:", restaurant._id);
      return AppResponse(res, "Restaurant created successfully.", 201, restaurant);
    } catch (error: any) {
      console.error("Database error:", error);
      
      // If restaurant creation fails but image was uploaded, we should delete the uploaded image
      if (fileKey) {
        try {
          await deleteImage([fileKey]);
          console.log("Cleaned up uploaded image after database error");
        } catch (cleanupError) {
          console.error("Failed to cleanup uploaded image:", cleanupError);
        }
      }
      
      return next(new AppError(`Failed to create restaurant: ${error.message}`, 500));
    }
  }
);


// export const createRestaurantHandler = catchAsync(
//   async (req: Request, res: Response, next: NextFunction) => {
//     console.log("=== DEBUG INFO ===");
//     console.log("Content-Type:", req.headers['content-type']);
//     console.log("Body:", req.body);
//     console.log("File:", req.file);
//     console.log("Files:", req.files);
//     // console.log("Raw body exists:", !!req.rawBody); // Removed: req.rawBody does not exist on Express Request
//     console.log("==================");

//     // Check if we have form data
//     if (!req.body && !req.file) {
//       return next(new AppError("No data received", 400));
//     }

//     const { name } = req.body;

//     // Validate required fields
//     if (!name) {
//       return next(new AppError("Restaurant name is required", 400));
//     }

//     // Validate with schema (skip if causing issues)
//     const parseResult = createRestaurantSchema.safeParse(req.body);
//     if (!parseResult.success) {
//       console.log("Validation error:", parseResult.error.errors);
//       return next(new AppError(parseResult.error.errors[0].message, 400));
//     }

//     let imageUrl = null;
//     let fileKey = null;

//     if (req.file) {
//       try {
//         console.log("Uploading file...", req.file.originalname);
//         const result = await uploadMedia([req.file]);
//         imageUrl = result[0]?.imageUrl;
//         fileKey = result[0]?.key;
//         console.log("Upload successful:", { imageUrl, fileKey });
//       } catch (error) {
//         console.error("Upload error:", error);
//         return next(new AppError("Failed to upload image", 500));
//       }
//     }

//     const restaurant = await Restaurant.create({
//       name,
//       logo: req.file ? [
//         {
//           key: fileKey,
//           url: imageUrl,
//           alt: name,
//         },
//       ] : [],
//     });

//     return AppResponse(res, "Restaurant created successfully.", 201, restaurant);
//   }
// );

// export const createRestaurantHandler = catchAsync(
//   async (req: Request, res: Response, next: NextFunction) => {
//     const { name,  } = req.body;
//     const parseResult = createRestaurantSchema.safeParse(req.body);
//     if (!parseResult.success) {
//       return next(new AppError(parseResult.error.errors[0].message, 400));
//     }
//     let imageUrl = null;
//     if (req.file) {
//       const result = await uploadMedia([req.file]);
//       imageUrl = result[0]?.imageUrl;
//     }

//     const restaurant = await Restaurant.create({
//       name,
//       logo: [
//         {
//           key: req.file?.filename,
//           url: imageUrl,
//           alt: name,
//         },
//       ],
//     });

//     return AppResponse(res, "Restaurant created successfully.", 201, restaurant);
//   }
// );

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

