// restaurantValidation.ts
import z from "zod";

// Sub-schema for address
const addressSchema = z.object({
  street: z.string().min(1, "Street is required"),
  city: z.string().min(1, "City is required"),
  state: z.string().min(1, "State is required"),
  zipCode: z.string().min(1, "Zip code is required"),
  country: z.string().min(1, "Country is required"),
});

// Sub-schema for operating hours
const operatingHoursSchema = z.object({
  day: z.enum([
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
    "Sunday"
  ]),
  open: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Invalid open time (HH:mm)"),
  close: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Invalid close time (HH:mm)"),
  isClosed: z.boolean().optional(),
});

// Sub-schema for rating (optional for creation)
const ratingSchema = z.object({
  userId: z.string().optional(),
  score: z.number().min(0).max(5).optional(),
  comment: z.string().optional(),
});

// Sub-schema for bank details
const bankDetailsSchema = z.object({
  accountName: z.string().min(1, "Account name is required"),
  accountNumber: z.string().min(5, "Account number must be valid"),
  bankName: z.string().min(1, "Bank name is required"),
  swiftCode: z.string().optional(),
});

export const createRestaurantSchema = z.object({
  restaurantName: z.string().min(1, "Restaurant name is required"),
  // restaurantDescription: z.string().min(1, "Description is required"),
  // cuisine: z.array(z.string().min(1, "Cuisine is required")).min(1),
  address: addressSchema,
  phone: z.string().min(7, "Phone number must be valid"),
  email: z.string().email("Invalid email"),
  images: z.array(z.string().url()).optional(),
  logo: z.string().url().optional(),
  operatingHours: z.array(operatingHoursSchema).optional(),
  // deliveryInfo: z.object({
  //   isDeliveryAvailable: z.boolean().default(true),
  //   deliveryRadius: z.number().min(0),
  //   minimumOrderAmount: z.number().min(0).default(0),
  //   deliveryFee: z.number().min(0).default(0),
  //   estimatedDeliveryTime: z.number().min(1),
  // }),
  paymentMethods: z.array(z.string()).optional(),
  tags: z.array(z.string()).optional(),
  categories: z.array(z.string()).optional(),
  menuItems: z.array(z.string()).optional(),
  // bank_details: bankDetailsSchema,
  // commission_rate: z.number().min(0).max(100).default(10),
});
