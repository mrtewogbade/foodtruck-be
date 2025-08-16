import { Request, Response, NextFunction } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import speakeasy from "speakeasy";
import qrcode from "qrcode";
import catchAsync from "../error/catchAsync";
import AppResponse from "../helpers/AppResponse";
import { User, Customer, RestaurantOwner, DeliveryDriver } from "../model/user.model";
import AppError from "../error/AppError";
import sendMail from "../configs/nodemailer.config";

import {
  GenerateAccessToken,
  GenerateRefreshToken,
  GenerateTrackingToken,
} from "../helpers/GenerateToken";
import { NODE_ENV, RefreshToken_Secret_Key } from "../../serviceUrl";
import GenerateRandomId, {
  generateRandomAlphanumeric,
} from "../helpers/GenerateRandomId";



export const registerHandler = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { role, name, email, password } = req.body;

    const userExists = await User.findOne({ email });
    if (userExists) {
      return next(new AppError("User already exists", 400));
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    let user;

    if (role === "customer") {
      user = await Customer.create({
        name,
        email,
        password: hashedPassword,
      });
    } else if (role === "restaurant_owner") {
      user = await RestaurantOwner.create({
        name,
        email,
        password: hashedPassword,
        // Note: restaurantId is not in your schema, so I'm removing it
        // If you need it, add it to the RestaurantOwnerSchema
      });
    } else if (role === "delivery_driver") {
      user = await DeliveryDriver.create({
        name,
        email,
        password: hashedPassword,
      });
    } else {
      return next(new AppError("Invalid role", 400));
    }

    if (user == undefined) {
      return next(
        new AppError(
          "User can either be a customer, restaurant owner or delivery driver",
          500
        )
      );
    }

    const firstName = name.split(" ")[0];
    const otpCode = generateRandomAlphanumeric();
    user.otp = otpCode;
    user.otpExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);
    
    const mailOptions = {
      email,
      subject: "Verify Your Email Address",
      templateName: "verifyEmail",
      context: {
        name: firstName,
        otpCode,
      },
    };

    await user.save();

    const maxRetries = 3;
    let attempts = 0;
    let emailSent = false;

    while (attempts < maxRetries && !emailSent) {
      try {
        await sendMail(mailOptions);
        emailSent = true;
      } catch (error) {
        attempts++;
        console.error(`Attempt ${attempts} failed:`, error);
        if (attempts >= maxRetries) {
          console.log(
            `Failed to send email to ${email} after ${maxRetries} attempts.`
          );
        }
      }
    }

    const account = {
      name,
      email,
      role,
    };

    return AppResponse(
      res,
      "Registration successful, please check email to verify user.",
      201,
      account
    );
  }
);