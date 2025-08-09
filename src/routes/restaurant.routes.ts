import express from "express";
import {
  createOrUpdateRestaurant
} from "../controller/restaurant.controller";
import upload from "../middleware/multer";


const router = express.Router();

// @route   POST /api/restaurants
// @desc    Register a new restaurant
router.post("/", upload.single("logo"), createOrUpdateRestaurant);



export default router;
