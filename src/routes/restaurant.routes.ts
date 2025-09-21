import express from "express";
import {
  createRestaurantHandler,
  updateRestaurantHandler,
  deleteRestaurantHandler,
  getRestaurantByIdHandler,
  getAllRestaurantsHandler,
} from "../controller/restaurant.controller";
import upload from "../middleware/multer";
import VerifyAccessToken from "../middleware/verifyAccessToken";
import validate from "../middleware/validateZod";
import { createRestaurantSchema } from "../validations/retaurantValidation";
import CheckRole from "../middleware/checkRole";

const router = express.Router();

// Create restaurant (admin only)
router.post(
  "/",
  VerifyAccessToken,
  upload.single("logo"),
  CheckRole("admin"),
  validate(createRestaurantSchema),
  createRestaurantHandler
);

// Update restaurant (admin only)
router.put("/:id", VerifyAccessToken, CheckRole("admin"), updateRestaurantHandler);

// Delete restaurant (admin only)
router.delete("/:id", VerifyAccessToken, CheckRole("admin"), deleteRestaurantHandler);

// Get restaurant by ID
router.get("/:id", getRestaurantByIdHandler);

// Get all restaurants
router.get("/", getAllRestaurantsHandler);

export default router;
