import mongoose, { Schema } from "mongoose";
import { IRestaurant } from "../interface/restaurant.interface";

const RestaurantSchema: Schema<IRestaurant> = new Schema(
  {
    _id: { type: Schema.Types.ObjectId, auto: true },
    name: { type: String, required: true },
    address: { type: String, default: null },
    foodItems: [{ type: Schema.Types.ObjectId, ref: "Food" }],
    logo: [
      {
        key: { type: String, required: false },
        url: { type: String, required: false },
        alt: { type: String, default: null },
      },
    ],
    rating: { type: Number, default: 0 },
    isOpen: { type: Boolean, default: true },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

const Restaurant = mongoose.model<IRestaurant>("Restaurant", RestaurantSchema);

export default Restaurant;
