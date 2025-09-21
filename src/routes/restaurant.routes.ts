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
import { handleMulterError } from "../middleware/multer";
import CheckRole from "../middleware/checkRole";

const router = express.Router();



const logRequest = (req: any, res: any, next: any) => {
  console.log("=== REQUEST DEBUG ===");
  console.log("Method:", req.method);
  console.log("URL:", req.url);
  console.log("Content-Type:", req.headers['content-type']);
  console.log("Content-Length:", req.headers['content-length']);
  console.log("====================");
  next();
};



// router.post(
//   "/",
//   VerifyAccessToken,
//   upload.single("logo"),
//   CheckRole("admin"),
//   createRestaurantHandler
// );

router.post(
  "/",
  logRequest, // Add logging
  VerifyAccessToken,
  upload.single("logo"),
  handleMulterError, // Add multer error handling
  CheckRole("admin"),
  createRestaurantHandler
);

router.put("/:id", VerifyAccessToken, CheckRole("admin"), updateRestaurantHandler);

router.delete("/:id", VerifyAccessToken, CheckRole("admin"), deleteRestaurantHandler);

router.get("/:id", getRestaurantByIdHandler);

router.get("/", getAllRestaurantsHandler);

export default router;
