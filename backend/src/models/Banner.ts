import mongoose, { Schema, Document, Model } from "mongoose";

export interface IBanner extends Document {
  imageUrl: string;
  createdAt: Date;
  updatedAt: Date;
}

const BannerSchema: Schema<IBanner> = new Schema(
  {
    imageUrl: { type: String, required: true },
  },
  {
    timestamps: true,
  }
);

export const Banner: Model<IBanner> =
  (mongoose.models.Banner as Model<IBanner>) || mongoose.model<IBanner>("Banner", BannerSchema);

