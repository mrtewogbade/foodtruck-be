import mongoose, { Schema } from 'mongoose';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { IUser } from "../interface/user.interface";

const UserSchema = new Schema<IUser>({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String },
  role: { type: String, enum: ['buyer', 'seller'], required: true },
  phone_number: { type: String, default: null },
  address: { type: String, default: null },
  image: [
    {
      key: { type: String, required: true, default: "" },
      url: { type: String, required: true, default: "" },
    }
  ],
  is_two_factor_enabled: { type: Boolean, default: false },
  two_factor_code: { type: String },
  googleId: { type: String },
  appleId: { type: String },
  isEmailVerified: { type: Boolean, default: false },
  isDeleted: { type: Boolean, default: false },
  otpExpiry: { type: Date },
  otp: { type: String, default: "" },
  isActive: { type: Boolean, default: true },
  lastLogin: { type: Date, default: null },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  fcm_token: { type: String, default: null },
}, {
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
});

UserSchema.virtual('imageUrl').get(function () {
  return this.image?.map(image => image.url).join(', ') || '';
});

UserSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

UserSchema.methods.generateAuthToken = function () {
  return jwt.sign(
    { id: this._id, role: this.role },
    process.env.JWT_SECRET!,
    { expiresIn: '7d' }
  );
};

export const User = mongoose.model<IUser>('User', UserSchema);