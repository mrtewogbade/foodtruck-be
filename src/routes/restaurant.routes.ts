import express from "express";
import {
  createOrUpdateRestaurant
} from "../controller/restaurant.controller";
import upload from "../middleware/multer";
import VerifyAccessToken from "../middleware/verifyAccessToken";
import validate from "../middleware/validateZod"
import { createRestaurantSchema } from "../validations/retaurantValidation"



const router = express.Router();

router.post("/", VerifyAccessToken,  createOrUpdateRestaurant);



export default router;
