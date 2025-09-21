// Here you are going to implement the user-related functionalities

// get all users
// delete a user
// update a user
// get user by id


import { Request, Response } from "express";
import User from "../model/user.model";

// GET: Fetch all users
export const getAllUsersHandler = async (req: Request, res: Response): Promise<void> => {
  try {
    const users = await User.find({ isDeleted: false }).select("-password");
    res.status(200).json({ success: true, data: users });
  } catch (error) {
    res.status(500).json({ success: false, message: "Unable to retrieve users", error });
  }
};

// GET: Fetch a single user by ID
export const getUserByIdHandler = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = await User.findOne({ _id: req.params.id, isDeleted: false }).select("-password");
    if (!user) {
      res.status(404).json({ success: false, message: "User not found" });
      return;
    }
    res.status(200).json({ success: true, data: user });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error retrieving user", error });
  }
};

// PUT: Update user details
export const updateUserHandler = async (req: Request, res: Response): Promise<void> => {
  try {
    const updatedUser = await User.findOneAndUpdate(
      { _id: req.params.id, isDeleted: false },
      req.body,
      { new: true, runValidators: true }
    ).select("-password");

    if (!updatedUser) {
      res.status(404).json({ success: false, message: "User not found or already deleted" });
      return;
    }

    res.status(200).json({ success: true, data: updatedUser });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to update user", error });
  }
};

// DELETE: Soft delete a user
export const deleteUserHandler = async (req: Request, res: Response): Promise<void> => {
  try {
    const deletedUser = await User.findOneAndUpdate(
      { _id: req.params.id, isDeleted: false },
      { isDeleted: true },
      { new: true }
    );

    if (!deletedUser) {
      res.status(404).json({ success: false, message: "User not found or already deleted" });
      return;
    }

    res.status(200).json({ success: true, message: "User deleted successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to delete user", error });
  }
};