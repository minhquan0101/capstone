import mongoose, { Schema, Document, Model } from "mongoose";

export interface IPost extends Document {
  title: string;
  content: string;
  type: "showbiz" | "blog";
  createdAt: Date;
  updatedAt: Date;
}

const PostSchema: Schema<IPost> = new Schema(
  {
    title: { type: String, required: true, trim: true },
    content: { type: String, required: true },
    type: { type: String, enum: ["showbiz", "blog"], required: true },
  },
  {
    timestamps: true,
  }
);

export const Post: Model<IPost> =
  (mongoose.models.Post as Model<IPost>) || mongoose.model<IPost>("Post", PostSchema);


