import mongoose, { Schema, Document, Model } from "mongoose";

export interface IEvent extends Document {
  title: string;
  description?: string;
  location?: string;
  date?: Date;
  price?: number;
  imageUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}

const EventSchema: Schema<IEvent> = new Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String },
    location: { type: String },
    date: { type: Date },
    price: { type: Number },
    imageUrl: { type: String },
  },
  {
    timestamps: true,
  }
);

export const Event: Model<IEvent> =
  (mongoose.models.Event as Model<IEvent>) || mongoose.model<IEvent>("Event", EventSchema);


