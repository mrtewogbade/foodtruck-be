import mongoose, { Schema } from "mongoose";
import {
  IUser,
  IImage,
  BaseDocument,
  IOperatingHours,
  IAddress,
  ICustomer,
  IRestaurantOwner,
  IDeliveryDriver,
  IRating,
} from "../interface/user.interface";

// Image Schema (embedded)
const imageSchema = new Schema<IImage>({
  key: { type: String, default: "" },
  url: { type: String, default: "" },
});

// Address Schema (embedded)
const addressSchema = new Schema<IAddress>({
  street: { type: String, required: true },
  city: { type: String, required: true },
  state: { type: String, required: true },
  zipCode: { type: String, required: true },
  country: { type: String, required: true },
  coordinates: {
    latitude: { type: Number },
    longitude: { type: Number },
  },
  isDefault: { type: Boolean, default: false },
  label: { type: String },
});

// Operating Hours Schema (embedded)
const operatingHoursSchema = new Schema<IOperatingHours>({
  dayOfWeek: { type: Number, required: true, min: 0, max: 6 },
  isOpen: { type: Boolean, required: true },
  openTime: { type: String },
  closeTime: { type: String },
});

// Rating Schema (embedded)
const ratingSchema = new Schema<IRating>({
  user: { type: Schema.Types.ObjectId, ref: "User", required: true },
  rating: { type: Number, min: 1, max: 5, required: true },
  comment: { type: String },
  date: { type: Date, default: Date.now },
});

// Bank Details Schema (embedded)
const bankDetailsSchema = new Schema({
  bank_name: { type: String, default: null },
  bank_code: { type: String, default: null },
  account_name: { type: String, default: null },
  account_number: { type: String, default: null },
  recipient: { type: String, default: null },
});

// Base User Schema
const UserSchema: Schema<IUser> = new Schema(
  {
    _id: { type: Schema.Types.ObjectId, auto: true },
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String },
    role: {
      type: String,
      enum: ["customer", "restaurant_owner", "delivery_driver", "admin"],
      required: true,
    },
    phone_number: { type: String, default: null },
    images: [imageSchema],
    is_two_factor_enabled: { type: Boolean, default: false },
    two_factor_code: { type: String },
    googleId: { type: String },
    appleId: { type: String },
    isEmailVerified: { type: Boolean, default: false },
    isDeleted: { type: Boolean, default: false },
    otpExpires: { type: Date },
    otp: { type: String, default: "" },
    isActive: { type: Boolean, default: true },
    lastLogin: { type: Date, default: null },
    fcm_token: { type: String, default: "" },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
    discriminatorKey: "role",
  }
);

// Virtual for imageUrl
UserSchema.virtual("imageUrl").get(function (this: IUser) {
  return this.images?.map((image) => image.url).join(", ") || "";
});

// Transform to hide images in JSON/Object output
UserSchema.set("toJSON", {
  virtuals: true,
  transform: function (doc, ret, options) {
    delete ret.images;
    return ret;
  },
});

UserSchema.set("toObject", {
  virtuals: true,
  transform: function (doc, ret, options) {
    delete ret.images;
    return ret;
  },
});

// Customer Schema (discriminator) - DO NOT redefine 'role'
const CustomerSchema: Schema<ICustomer> = new Schema({
  orders: [{ type: Schema.Types.ObjectId, ref: "Order" }],
  cart: { type: Schema.Types.ObjectId, ref: "Cart", default: null },
  favouriteRestaurants: [{ type: Schema.Types.ObjectId, ref: "User" }],
  favouriteMenuItems: [{ type: Schema.Types.ObjectId, ref: "MenuItem" }],
  addresses: [addressSchema],
  preferences: {
    cuisine: [{ type: String }],
    dietaryRestrictions: [{ type: String }],
    maxDeliveryDistance: { type: Number, default: 10 },
  },
  loyaltyPoints: { type: Number, default: 0 },
});

// Restaurant Owner Schema (discriminator) - DO NOT redefine 'role'
const RestaurantOwnerSchema: Schema<IRestaurantOwner> = new Schema({
  restaurant: {
    type: new Schema({
      restaurantName: { type: String, required: true },
      restaurantDescription: { type: String, required: true },
      cuisine: [{ type: String, required: true }],
      address: { type: addressSchema, required: true },
      phone: { type: String, required: true },
      email: { type: String, required: true },
      images: [{ type: String }],
      logo: { type: String },
      isActive: { type: Boolean, default: true },
      isVerified: { type: Boolean, default: false },
      isApproved: { type: Boolean, default: false },
      isRejected: { type: Boolean, default: false },
      isSuspended: { type: Boolean, default: false },
      suspensionReason: { type: String, default: null },
      suspensionDate: { type: Date, default: null },
      isBlacklisted: { type: Boolean, default: false },
      rating: {
        average: { type: Number, default: 0, min: 0, max: 5 },
        count: { type: Number, default: 0 },
        ratings: [ratingSchema],
      },
      operatingHours: [operatingHoursSchema],
      deliveryInfo: {
        isDeliveryAvailable: { type: Boolean, default: true },
        deliveryRadius: { type: Number, required: true },
        minimumOrderAmount: { type: Number, default: 0 },
        deliveryFee: { type: Number, default: 0 },
        estimatedDeliveryTime: { type: Number, required: true },
      },
      paymentMethods: [{ type: String }],
      tags: [{ type: String }],
      categories: [{ type: Schema.Types.ObjectId, ref: "Category" }],
      menuItems: [{ type: Schema.Types.ObjectId, ref: "MenuItem" }],
      bank_details: bankDetailsSchema,
      total_earnings: { type: Number, default: 0 },
      balance: { type: Number, default: 0 },
      commission_rate: { type: Number, default: 10 }, // 10% default platform commission
    }),
    validate: {
      validator: function (v: any) {
        if (v === undefined) return true;
        return (
          v.restaurantName &&
          v.restaurantDescription &&
          v.cuisine &&
          v.address &&
          v.phone &&
          v.email
        );
      },
      message:
        "If restaurant object is provided, all required restaurant fields must be filled.",
    },
  },
});

// Delivery Driver Schema (discriminator) - DO NOT redefine 'role'
const DeliveryDriverSchema: Schema<IDeliveryDriver> = new Schema({
  driver: {
    type: new Schema({
      vehicleType: {
        type: String,
        enum: ["bike", "car", "scooter", "bicycle"],
        required: true,
      },
      vehicleNumber: { type: String, required: true },
      licenseNumber: { type: String, required: true },
      licenseExpiry: { type: Date, required: true },
      isAvailable: { type: Boolean, default: true },
      isVerified: { type: Boolean, default: false },
      isApproved: { type: Boolean, default: false },
      currentLocation: {
        latitude: { type: Number },
        longitude: { type: Number },
        lastUpdated: { type: Date, default: Date.now },
      },
      deliveryZones: [{ type: String }],
      rating: {
        average: { type: Number, default: 0, min: 0, max: 5 },
        count: { type: Number, default: 0 },
        ratings: [ratingSchema],
      },
      activeOrders: [{ type: Schema.Types.ObjectId, ref: "Order" }],
      completedOrders: [{ type: Schema.Types.ObjectId, ref: "Order" }],
      total_earnings: { type: Number, default: 0 },
      balance: { type: Number, default: 0 },
      bank_details: bankDetailsSchema,
    }),
    validate: {
      validator: function (v: any) {
        if (v === undefined) return true;
        return (
          v.vehicleType && v.vehicleNumber && v.licenseNumber && v.licenseExpiry
        );
      },
      message:
        "If driver object is provided, all required driver fields must be filled.",
    },
  },
});

// Create the base User model
const User = mongoose.model<IUser>("User", UserSchema);

// Create discriminators
const Customer = User.discriminator<ICustomer>("customer", CustomerSchema);
const RestaurantOwner = User.discriminator<IRestaurantOwner>(
  "restaurant_owner",
  RestaurantOwnerSchema
);
const DeliveryDriver = User.discriminator<IDeliveryDriver>(
  "delivery_driver",
  DeliveryDriverSchema
);

export {
  User,
  Customer,
  RestaurantOwner,
  DeliveryDriver,
  imageSchema,
  addressSchema,
  operatingHoursSchema,
  ratingSchema,
  bankDetailsSchema,
};

export default UserSchema;
