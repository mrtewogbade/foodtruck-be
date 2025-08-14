import { Request, Response, NextFunction } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import speakeasy from "speakeasy";
import qrcode from "qrcode";
import catchAsync from "../error/catchAsync";
import AppResponse from "../helpers/AppResponse";
import UserSchema, {
  User,
  Customer,
  RestaurantOwner,
  DeliveryDriver,
} from "../model/user.model";
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

export const verifyEmailHandler = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { otp, email } = req.body as { otp: string; email: string };

    const findUser: any = await User.findOne({ email });

    if (!findUser) {
      return next(new AppError("User not found", 404));
    }

    const userDate = findUser.otpExpires;
    const dateToCheck = userDate ? new Date(userDate) : new Date(0);
    const now = new Date();
    const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    if (findUser.otp === otp) {
      if (findUser.isEmailVerified) {
        return next(
          new AppError("This user has already verified their account.", 400)
        );
      }
      if (dateToCheck < twentyFourHoursAgo) {
        return next(
          new AppError("This OTP has expired. Please request a new one.", 400)
        );
      } else {
        findUser.isEmailVerified = true;
        findUser.otp = "";
        findUser.otpExpires = null;
        await findUser.save();

        // Send welcome email
        await sendMail({
          email: findUser.email,
          subject: "Welcome to Foodtruck!",
          templateName: "welcome",
          context: { name: findUser.name || "User" }, // Use name if available
        }).catch((error: Error) =>
          console.error("Failed to send welcome email:", error)
        );

        //remove password from the user object
        findUser.password = undefined;

        const account = {
          id: findUser._id,
          name: findUser.name,
          email: findUser.email,
          role: findUser.role,
        };

        const accessToken: string | undefined = GenerateAccessToken(account);
        const refreshToken: string | undefined = GenerateRefreshToken(account);

        return AppResponse(res, "User verification successful.", 200, {
          accessToken: accessToken,
          refreshToken: refreshToken,
          account: findUser,
        });
      }
    }

    return next(new AppError("This is an invalid OTP", 400));
  }
);

export const loginHandler = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const isMobile = req.headers.mobilereqsender;

    const { phone_or_email, password } = req.body;
    // const user = await User.findOne({ email });
    const user: any = await User.findOne({
      $or: [{ email: phone_or_email }, { phone_number: phone_or_email }],
    }).populate("store");

    if (!user) return next(new AppError("User not found", 404));

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return next(new AppError("Invalid credentials", 401));
    if (!user.isEmailVerified)
      return next(new AppError("Please verify your email before log in.", 401));
    if (user.is_two_factor_enabled) {
      //We should send a token here to track that okay, this person has had their password stuff done
      const two_fa_track = {
        id: user._id,
        createdAt: Date.now(),
      };
      const two_fa_token = GenerateTrackingToken(two_fa_track);
      return AppResponse(
        res,
        "Please check your Authenticator app for your token.",
        200,
        two_fa_token
      );
    }
    const account = {
      id: user._id,
      name: user.name,
      email: user.email,
      // phone_number: user.phone_number,
      role: user.role,
      // profile_image:user.imageUrl,
    };

    // remove password from the user object
    user.password = undefined;

    await User.findByIdAndUpdate(user._id, { lastLogin: new Date() });
    const accessToken: string | undefined = GenerateAccessToken(account);
    const refreshToken: string | undefined = GenerateRefreshToken(account);
    //If it is mobile we send token in response

    if (isMobile)
      return AppResponse(res, "Login successful", 200, {
        accessToken: accessToken,
        refreshToken: refreshToken,
        account: user,
      });

    res.cookie("e_access_token", accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "none",
      partitioned: true,
      priority: "high",
      signed: true,
      maxAge: 60 * 24 * 60 * 60 * 1000,
      expires: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
    });

    res.cookie("e_refresh_token", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "none",
      partitioned: true,
      signed: true,
      priority: "high",
      maxAge: 60 * 24 * 60 * 60 * 1000,
      expires: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
    });

    return AppResponse(res, "Login successful", 200, {
      accessToken: accessToken,
      refreshToken: refreshToken,
      account: user,
    });
  }
);
