import { Document, ObjectId } from "mongoose";

export interface IFood extends Document {
  _id: ObjectId;
  restaurant: ObjectId;
  name: string;
  description: string;
  price: number;
  image?: { key: string; url: string; alt?: string };
  createdAt: Date;
  updatedAt: Date;
}