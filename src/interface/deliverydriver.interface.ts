import { Document, ObjectId } from "mongoose";
import { IOrder } from "./order.interface";

// Delivery Driver interface
export interface IDeliveryDriver extends Document {
  _id: ObjectId; // MongoDB ObjectId for the delivery driver
  name: string; // Driver's name
  phone: string; // Driver's phone number (unique)
  email: string; // Driver's email address (unique)
  deliveryStatus: "available" | "busy" | "offline"; // Current delivery status of the driver
  location: {
    type: "Point"; // Type of GeoJSON data
    coordinates: [number, number]; // [longitude, latitude]
  };
  assignedOrders: ObjectId[]; // List of orders assigned to the driver (references to Order model)
  vehicleDetails: string; // Vehicle used by the driver (e.g., "bike", "car")
  createdAt: Date; // When the driver record was created
  updatedAt: Date; // When the driver record was last updated
}
