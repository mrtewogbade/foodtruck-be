import { Document, ObjectId } from 'mongoose';
import { UserRole } from '../enums/user.emum';

export interface BaseDocument {
  _id?: ObjectId;
  createdAt: Date;
  updatedAt: Date;
}
export interface IUser extends BaseDocument {
  _id: ObjectId;
  name: string;
  email: string;
  password?: string;
  role: UserRole;
  phone_number?: string;
  address?: string;
  favourites: Array<{ itemId: ObjectId; addedAt: Date }>;
  cart: Array<{ itemId: ObjectId; addedAt: Date }>;
  orders: Array<{ orderId: ObjectId; createdAt: Date }>;
  image?: { key: string; url: string; alt?: string };
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
