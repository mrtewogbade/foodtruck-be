import mongoose, { Schema } from "mongoose";
import { IDeliveryDriver } from "../interface/deliverydriver.interface";

const DeliveryDriverSchema: Schema<IDeliveryDriver> = new Schema(
  {
    _id: { type: Schema.Types.ObjectId, auto: true },
    name: { type: String, required: true }, // Name of the delivery driver
    phone: { type: String, required: true, unique: true }, // Phone number (unique to each driver)
    email: { type: String, required: true, unique: true }, // Email (unique to each driver)
    deliveryStatus: {
      type: String,
      enum: ["available", "busy", "offline"],
      default: "available", // The current status of the delivery driver
    },
    location: {
      type: { type: String, enum: ["Point"], required: true }, // Type of location (GeoJSON Point)
      coordinates: { type: [Number], required: true }, // [longitude, latitude]
    },
    assignedOrders: [
      { type: Schema.Types.ObjectId, ref: "Order" }, // Orders assigned to the driver
    ],
    vehicleDetails: {
      type: String, // Type of vehicle used for deliveries (e.g., bike, car)
      default: "bike", // Default vehicle type
    },
    createdAt: { type: Date, default: Date.now }, // When the driver record was created
    updatedAt: { type: Date, default: Date.now }, // When the driver record was last updated
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Update the updatedAt field before saving
DeliveryDriverSchema.pre("save", function (next) {
  this.updatedAt = new Date();
  next();
});

// You could also add virtuals to calculate driver data, like distance from a given location, etc.

const DeliveryDriver = mongoose.model<IDeliveryDriver>("DeliveryDriver", DeliveryDriverSchema);

export default DeliveryDriver;
