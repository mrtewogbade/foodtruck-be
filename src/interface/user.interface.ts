import { Document, ObjectId } from 'mongoose';

export interface IImage {
  key: string
  url: string
}

export interface BaseDocument {
  _id?: ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

export interface IRating {
  user: ObjectId;
  rating: number;
  comment?: string;
  date: Date;
}
export interface IOperatingHours {
  dayOfWeek: number; // 0-6 (Sunday-Saturday)
  isOpen: boolean;
  openTime?: string; // HH:MM format
  closeTime?: string; // HH:MM format
}

export interface IAddress {
  _id?: ObjectId;
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  coordinates?: {
    latitude: number;
    longitude: number;
  };
  isDefault: boolean;
  label?: string; // 'home', 'work', etc.
}


export interface IUser extends BaseDocument {
  _id: ObjectId;
  name: string;
  email: string;
  password?: string;
  role: 'customer' | 'restaurant_owner' | 'delivery_driver' | 'admin';
  phone_number?: string;
  images?: IImage[];
  is_two_factor_enabled: boolean;
  two_factor_code?: string;
  googleId?: string;
  appleId?: string;
  isEmailVerified: boolean;
  isDeleted: boolean;
  otpExpires?: Date;
  otp: string;
  isActive: boolean;
  lastLogin?: Date;
  fcm_token: string;
  imageUrl?: string; // virtual field
}

// Customer interface (discriminator)
export interface ICustomer extends IUser {
  role: 'customer';
  orders: ObjectId[];
  cart?: ObjectId;
  favouriteRestaurants: ObjectId[];
  favouriteMenuItems: ObjectId[];
  addresses: IAddress[];
  preferences: {
    cuisine: string[];
    dietaryRestrictions: string[];
    maxDeliveryDistance: number;
  };
  loyaltyPoints: number;
}

// Restaurant Owner interface (discriminator)
export interface IRestaurantOwner extends IUser {
  role: 'restaurant_owner';
  restaurant?: {
    restaurantName: string;
    restaurantDescription: string;
    cuisine: string[];
    address: IAddress;
    phone: string;
    email: string;
    images: string[];
    logo?: string;
    isActive: boolean;
    isVerified: boolean;
    isApproved: boolean;
    isRejected: boolean;
    isSuspended: boolean;
    suspensionReason?: string;
    suspensionDate?: Date;
    isBlacklisted: boolean;
    rating: {
      average: number;
      count: number;
      ratings: Array<{
        user: ObjectId;
        rating: number;
        comment?: string;
        date: Date;
      }>;
    };
    operatingHours: IOperatingHours[];
    deliveryInfo: {
      isDeliveryAvailable: boolean;
      deliveryRadius: number; // in km
      minimumOrderAmount: number;
      deliveryFee: number;
      estimatedDeliveryTime: number; // in minutes
    };
    paymentMethods: string[];
    tags: string[];
    categories: ObjectId[];
    menuItems: ObjectId[];
    bank_details: {
      bank_name?: string;
      bank_code?: string;
      account_name?: string;
      account_number?: string;
      recipient?: string;
    };
    total_earnings: number;
    balance: number;
    commission_rate: number; // platform commission percentage
  };
}

// Delivery Driver interface (discriminator)
export interface IDeliveryDriver extends IUser {
  role: 'delivery_driver';
  driver?: {
    vehicleType: 'bike' | 'car' | 'scooter' | 'bicycle';
    vehicleNumber: string;
    licenseNumber: string;
    licenseExpiry: Date;
    isAvailable: boolean;
    isVerified: boolean;
    isApproved: boolean;
    currentLocation?: {
      latitude: number;
      longitude: number;
      lastUpdated: Date;
    };
    deliveryZones: string[]; // areas they can deliver to
    rating: {
      average: number;
      count: number;
      ratings: Array<{
        user: ObjectId;
        rating: number;
        comment?: string;
        date: Date;
      }>;
    };
    activeOrders: ObjectId[];
    completedOrders: ObjectId[];
    total_earnings: number;
    balance: number;
    bank_details: {
      bank_name?: string;
      bank_code?: string;
      account_name?: string;
      account_number?: string;
      recipient?: string;
    };
  };
}
