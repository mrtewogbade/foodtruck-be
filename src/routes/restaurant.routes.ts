import express from "express";
import {
  createRestaurantHandler
} from "../controller/restaurant.controller";
import upload from "../middleware/multer";
import VerifyAccessToken from "../middleware/verifyAccessToken";
import validate from "../middleware/validateZod"
import { createRestaurantSchema } from "../validations/retaurantValidation";
import CheckRole from "../middleware/checkRole";



const router = express.Router();

router.post("/", VerifyAccessToken, upload.single("logo"), CheckRole("admin"), validate(createRestaurantSchema), createRestaurantHandler);

export default router;
