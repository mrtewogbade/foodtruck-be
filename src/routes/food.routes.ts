// src/routes/foodRoutes.ts
import { Router } from 'express';
import { uploadFood, getAllFoods, updateFood, getFoodById, deleteFood, deleteFoodAdminOnly } from '../controller/food.controller';

const router = Router();

// Route to create a food item
router.post("/", uploadFood); // Create food
router.get("/", getAllFoods); // Get all foods
router.get("/:id", getFoodById); // Get food by id
router.patch("/:id", updateFood); // Update food (admin)
router.delete("/:id", deleteFood); // Normal delete
router.delete("/admin/:id", deleteFoodAdminOnly); // Admin-only delete


export default router;