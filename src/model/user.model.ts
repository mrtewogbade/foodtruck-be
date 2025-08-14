import mongoose, { Schema } from "mongoose";
import {
  IUser,
} from "../interface/user.interface";
import { UserRole } from "../enums/user.emum";

const UserSchema: Schema<IUser> = new Schema(
  {
    _id: { type: Schema.Types.ObjectId, auto: true },
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String },
    role: { type: String, enum: Object.values(UserRole), default: UserRole.CUSTOMER },
    phone_number: { type: String, default: null },
    address: { type: String, default: null },
    // Fixed: Single image object for profile/avatar
    image: {
      key: { type: String, default: null },
      url: { type: String, default: null },
      alt: { type: String, default: null }
    },
    googleId: { type: String },
    isEmailVerified: { type: Boolean, default: false },
    isDeleted: { type: Boolean, default: false },
    otpExpires: { type: Date },
    otp: { type: String, default: "" },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Fixed: Virtual getter for single image
UserSchema.virtual("imageUrl").get(function (this: IUser) {
  return this.image?.url || "";
});

// Transform to hide image object in JSON/Object output (keeping only imageUrl virtual)
UserSchema.set("toJSON", {
  virtuals: true,
  transform: function (doc, ret, options) {
    delete ret.image;
    return ret;
  },
});

UserSchema.set("toObject", {
  virtuals: true,
  transform: function (doc, ret, options) {
    delete ret.image;
    return ret;
  },
});

const User = mongoose.model<IUser>("User", UserSchema);

export default User;