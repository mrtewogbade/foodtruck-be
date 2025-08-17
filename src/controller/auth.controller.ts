import { Request, Response, NextFunction } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import speakeasy from "speakeasy";
import qrcode from "qrcode";
import catchAsync from "../error/catchAsync";
import AppResponse from "../helpers/AppResponse";
import User from "../model/user.model";
import { IUser } from "../interface/user.interface";
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
import { add } from "winston";

export const registerHandler = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { name, email, password, phone_number, address, } = req.body;

    const userExists = await User.findOne({ email });
    if (userExists) {
      return next(new AppError("User already exists", 400));
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    let user;

    user = await User.create({
      name,
      email,
      password: hashedPassword,
      phone_number,
      address,
    });

    if (user == undefined) {
      return next(
        new AppError(
          "User registration failed",
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
      phone_number,
      address,
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

        await sendMail({
          email: findUser.email,
          subject: "Welcome to Foodtruck!",
          templateName: "welcome",
          context: { name: findUser.name || "User" },
        }).catch((error: Error) =>
          console.error("Failed to send welcome email:", error)
        );

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

export const resendEmailVerificationHandler = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { email } = req.body as { email: string };

    // Validate email
    if (!email) {
      return next(new AppError("Email is required", 400));
    }

    // Find user by email
    const user: any = await User.findOne({ email });
    if (!user) {
      return next(new AppError("User not found", 404));
    }

    // Check if already verified
    if (user.isEmailVerified) {
      return next(
        new AppError("This user has already verified their account.", 400)
      );
    }

    // Generate new OTP (e.g., 6-digit random number)
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours from now

    // Update user with new OTP and expiration
    user.otp = otp;
    user.otpExpires = otpExpires;
    await user.save();

    // Send verification email
    try {
      await sendMail({
        email: user.email,
        subject: "Resend Email Verification - Foodtruck",
        templateName: "verifyEmail", // Assuming a template for OTP verification
        context: {
          name: user.name || "User",
          otp,
          expiresIn: "24 hours",
        },
      });

      return AppResponse(res, "Verification email resent successfully.", 200, {
        message: "A new OTP has been sent to your email.",
      });
    } catch (error: any) {
      console.error("Failed to send verification email:", error);
      return next(new AppError("Failed to send verification email", 500));
    }
  }
);

export const loginHandler = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const isMobile = req.headers.mobilereqsender;

    const { phone_or_email, password } = req.body;
    // const user = await User.findOne({ email });
    const user: any = await User.findOne({
      $or: [{ email: phone_or_email }, { phone_number: phone_or_email }],
    });

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
      phone_number: user.phone_number,
      address: user.address,
      role: user.role,
      profile_image: user.imageUrl,
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

// kelvin wrote this code
// This handler is for sending a password reset OTP to the user's email

export const forgotPasswordHandler = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { email } = req.body as { email: string };

    // Validate email input
    if (!email) {
      return next(new AppError("Email is required", 400));
    }

    // Normalize email
    const normalizedEmail = email.trim().toLowerCase();

    // Find user
    const user: any = await User.findOne({ email: normalizedEmail });
    if (!user) {
      return next(new AppError("User not found", 404));
    }

    // Generate OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    // Update user with OTP
    user.otp = otp;
    user.otpExpires = otpExpires;
    await user.save();

    // Send reset email
    try {
      await sendMail({
        email: user.email,
        subject: "Password Reset - Foodtruck",
        templateName: "resetPassword",
        context: {
          name: user.name || "User",
          otp,
          expiresIn: "24 hours",
        },
      });

      return AppResponse(res, "Password reset OTP sent successfully.", 200, {
        message: "A password reset OTP has been sent to your email.",
      });
    } catch (error: any) {
      console.error("Failed to send password reset email:", error);
      return next(new AppError("Failed to send password reset email", 500));
    }
  }
);

export const resetPasswordHandler = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { email, otp, newPassword } = req.body as {
      email: string;
      otp: string;
      newPassword: string;
    };

    // Validate inputs
    if (!email || !otp || !newPassword) {
      return next(
        new AppError("Email, OTP, and new password are required", 400)
      );
    }

    // Normalize email
    const normalizedEmail = email.trim().toLowerCase();

    // Find user
    const user: any = await User.findOne({ email: normalizedEmail });
    if (!user) {
      return next(new AppError("User not found", 404));
    }

    // Verify OTP
    const userDate = user.otpExpires;
    const dateToCheck = userDate ? new Date(userDate) : new Date(0);
    const now = new Date();
    const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    if (user.otp !== otp) {
      return next(new AppError("Invalid OTP", 400));
    }

    if (dateToCheck < twentyFourHoursAgo) {
      return next(
        new AppError("This OTP has expired. Please request a new one.", 400)
      );
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update user
    user.password = hashedPassword;
    user.otp = "";
    user.otpExpires = null;
    await user.save();

    // Send confirmation email
    await sendMail({
      email: user.email,
      subject: "Password Reset Successful - Foodtruck",
      templateName: "passwordResetConfirmation",
      context: { name: user.name || "User" },
    }).catch((error: Error) =>
      console.error("Failed to send password reset confirmation email:", error)
    );

    // Prepare response
    user.password = undefined;
    const account = {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
    };

    const accessToken = GenerateAccessToken(account);
    const refreshToken = GenerateRefreshToken(account);

    return AppResponse(res, "Password reset successful.", 200, {
      accessToken,
      refreshToken,
      account,
    });
  }
);


