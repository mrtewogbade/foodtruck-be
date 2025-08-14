import z from "zod";

export const createRestaurantSchema = z.object({
  name: z.string().min(1, "Restaurant name is required"),
  address: z.string().optional(),
  logo: z.string().url().optional(),
  foodItems: z.array(z.string()).optional(),
});