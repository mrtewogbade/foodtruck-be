// order.interface.ts

import { Document, ObjectId } from "mongoose";
import { IUser } from "./user.interface";
import { IRestaurant } from "./restaurant.interface";
import { IDeliveryDriver } from "./deliverydriver.interface";
import { IFood } from "./food.interface";

// Define the structure of the Order's Item (food + quantity)
export interface IOrderItem {
  food: ObjectId | IFood;   // Reference to Food by ObjectId OR populated IFood document
  quantity: number; // Quantity of the food item ordered
}

// Define the structure of the Order
export interface IOrder extends Document {
  _id: ObjectId; // MongoDB ObjectId for the order
  user: ObjectId; // Reference to the User who placed the order
  restaurant: ObjectId; // Reference to the Restaurant receiving the order
  items: IOrderItem[]; // Array of items in the order
  totalAmount: number; // Total price of the order
  deliveryAddress: string; // User's delivery address
  paymentStatus: "pending" | "completed" | "failed"; // Payment status of the order
  orderStatus: "received" | "preparing" | "out-for-delivery" | "delivered"; // Status of the order
  deliveryDriver: ObjectId | null; // Reference to the delivery driver if assigned (nullable)
  createdAt: Date; // When the order was placed
  updatedAt: Date; // When the order was last updated
  itemsTotal: number; // Virtual field for calculating the total price of the items
}