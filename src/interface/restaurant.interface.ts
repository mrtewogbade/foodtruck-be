import { Document, ObjectId } from "mongoose";

export interface IRestaurant extends Document {
  _id: ObjectId;
  name: string;
  address: string;
  menu: ObjectId[];
  logo?: { key: string; url: string; alt?: string }[];
  rating: number;
  isOpen: boolean;
  createdAt: Date;
  updatedAt: Date;
}