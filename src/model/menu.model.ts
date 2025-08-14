import mongoose, { Schema } from "mongoose";
import { IMenu } from "../interface/menu.interface";

const MenuSchema: Schema<IMenu> = new Schema(
  {
    _id: { type: Schema.Types.ObjectId, auto: true },
    restaurant: { type: Schema.Types.ObjectId, ref: "Restaurant", required: true },
    items: [
      {
        name: { type: String, required: true },
        description: { type: String, required: true },
        price: { type: Number, required: true },
        image: {
          key: { type: String, required: true },
          url: { type: String, required: true },
          alt: { type: String, default: null },
        },
      },
    ],
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

const Menu = mongoose.model<IMenu>("Menu", MenuSchema);

export default Menu;
