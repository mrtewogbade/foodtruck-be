import { Document } from "mongoose";

export interface IOperatingHour {
  day: string; // e.g. "Monday"
  open: string; // e.g. "08:00"
  close: string; // e.g. "17:00"
  isOpen: boolean;
}

export interface IRestaurant extends Document {
  name: string;
  address: string;
  phone: string;
  email: string;
  logo?: string;
  operatingHours: IOperatingHour[];
  isVerified: boolean;
}
