import { Request, Response, NextFunction } from "express";
import { IRestaurant } from "../interface/resturant.interface";
import catchAsync from "../error/catchAsync";
import AppResponse from "../helpers/AppResponse";
import { IUser } from "../interface/user.interface";
import { RestaurantOwner } from "../model/user.model";
import AppError from "../error/AppError";

export const createOrUpdateRestaurant = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {

    const userId = (req.user as IUser)?._id;
    const restaurantData = req.body;
    const restaurantOwner = await RestaurantOwner.findOne({ userId });

    if (!restaurantOwner) {
      return next(new AppError("Restaurant owner not found", 404));
    }

    // update or create restaurant
    const restaurant = await RestaurantOwner.findOneAndUpdate(
      { userId },
      {
        restaurantName: restaurantData.restaurantName,
        restaurantDescription: restaurantData.restaurantDescription,
        cuisine: restaurantData.cuisine,
        address: restaurantData.address,
        phone: restaurantData.phone,
        email: restaurantData.email,
        images: restaurantData.images,
        logo: restaurantData.logo,
        operatingHours: restaurantData.operatingHours,
        deliveryInfo: restaurantData.deliveryInfo,
        paymentMethods: restaurantData.paymentMethods,
        tags: restaurantData.tags,
        categories: restaurantData.categories,
        menuItems: restaurantData.menuItems,
        bank_details: restaurantData.bank_details,
        commission_rate: restaurantData.commission_rate,
      },
      { new: true, upsert: true }
    );

    if (!restaurant) {
      return next(new AppError("Failed to create or update restaurant", 500));
    }

    return AppResponse(res, "Restaurant created or updated successfully", 201, restaurant,
    );
  }
);
