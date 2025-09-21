// order.model.ts

import mongoose, { Schema } from "mongoose";
import { IOrder } from "../interface/order.interface";
import { IFood } from "../interface/food.interface";

const OrderSchema: Schema<IOrder> = new Schema(
  {
    _id: { type: Schema.Types.ObjectId, auto: true },
    user: { type: Schema.Types.ObjectId, ref: "User", required: true }, // User who placed the order
    restaurant: { type: Schema.Types.ObjectId, ref: "Restaurant", required: true }, // Restaurant receiving the order
    items: [
      {
        food: { type: Schema.Types.ObjectId, ref: "Food", required: true }, // Food item
        quantity: { type: Number, required: true, min: 1 }, // Quantity ordered
      }
    ],
    totalAmount: { type: Number, required: true }, // Total price of the order
    deliveryAddress: { type: String, required: true }, // User's delivery address
    paymentStatus: { 
      type: String, 
      enum: ["pending", "completed", "failed"], 
      default: "pending" 
    }, // Payment status
    orderStatus: { 
      type: String, 
      enum: ["received", "preparing", "out-for-delivery", "delivered"], 
      default: "received" 
    }, // Status of the order
    deliveryDriver: { 
      type: Schema.Types.ObjectId, 
      ref: "DeliveryDriver", 
      default: null 
    }, // Reference to delivery driver if assigned
    createdAt: { type: Date, default: Date.now }, // When the order was placed
    updatedAt: { type: Date, default: Date.now }, // When the order was last updated
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtual to calculate the total amount of the order (only works with populated food items)
OrderSchema.virtual("itemsTotal").get(function () {
  return this.items.reduce((acc, item) => {
    // Type guard to check if food is populated
    if (typeof item.food === 'object' && 'price' in item.food) {
      const food = item.food as IFood;
      return acc + item.quantity * food.price;
    }
    // Return 0 if food is not populated (just ObjectId)
    return acc;
  }, 0);
});

// Update the updatedAt field before saving
OrderSchema.pre("save", function (next) {
  this.updatedAt = new Date();
  next();
});

const Order = mongoose.model<IOrder>("Order", OrderSchema);

export default Order;