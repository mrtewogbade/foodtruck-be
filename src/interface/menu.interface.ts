import { Document, ObjectId } from "mongoose";

export interface IMenu extends Document {
  _id: ObjectId;
  restaurant: ObjectId;
  items: {
    name: string;
    description: string;
    price: number;
    image?: { key: string; url: string; alt?: string };
  }[];
  createdAt: Date;
  updatedAt: Date;
}
