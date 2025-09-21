import express from "express";
import VerifyAccessToken from "../middleware/verifyAccessToken";
import CheckRole from "../middleware/checkRole";


import {
  getAllUsersHandler,
  getUserByIdHandler,
  updateUserHandler,
  deleteUserHandler,
} from "../controller/user.controller";


const router = express.Router();


router.get("/", VerifyAccessToken, CheckRole("admin"), getAllUsersHandler);
router.get("/:id", VerifyAccessToken, CheckRole("admin"), getUserByIdHandler);
router.put("/:id", VerifyAccessToken, updateUserHandler);
router.delete("/:id", VerifyAccessToken, CheckRole("admin"), deleteUserHandler);





export default router;