import { Document } from 'mongoose';

export interface IImage {
  key: string
  url: string
}

export interface IUser extends Document {
  name: string
  email: string
  password?: string
  role: 'buyer' | 'seller'
  phone_number: string | null
  address: string | null
  image: IImage[]
  is_two_factor_enabled: boolean
  two_factor_code?: string
  googleId?: string
  appleId?: string
  isEmailVerified: boolean
  isDeleted: boolean
  otpExpiry?: Date
  otp: string
  isActive: boolean
  lastLogin: Date | null
  createdAt: Date
 

   

  generateAuthToken(): string
}

export interface IBuyer extends IUser {
  role: 'buyer'
}



export interface ISeller extends IUser {
  role: 'seller'
}