import mongoose, { Schema, Document, Model } from "mongoose";

export type PostType = "showbiz" | "blog";
export type PostRegion = "vn" | "asia" | "us_eu";
export type PostSection = "news" | "photo";

export interface IPost extends Document {
  title: string;
  summary?: string;
  content: string; // HTML hoặc text
  type: PostType;
  imageUrl?: string;

  // showbiz
  region?: PostRegion;
  section?: PostSection;
  isFeatured?: boolean;

  // common
  views?: number;

  createdAt: Date;
  updatedAt: Date;
}

const PostSchema: Schema<IPost> = new Schema(
  {
    title: { type: String, required: true, trim: true },
    summary: { type: String, trim: true, default: "" },
    content: { type: String, required: true },
    type: { type: String, enum: ["showbiz", "blog"], required: true },
    imageUrl: { type: String },

    region: { type: String, enum: ["vn", "asia", "us_eu"], default: "vn" },
    section: { type: String, enum: ["news", "photo"], default: "news" },
    isFeatured: { type: Boolean, default: false },

    views: { type: Number, default: 0, min: 0 },
  },
  { timestamps: true }
);

// index gợi ý (không bắt buộc nhưng tốt)
PostSchema.index({ type: 1, createdAt: -1 });
PostSchema.index({ type: 1, views: -1, createdAt: -1 });
PostSchema.index({ type: 1, region: 1, section: 1, createdAt: -1 });

export const Post: Model<IPost> =
  (mongoose.models.Post as Model<IPost>) || mongoose.model<IPost>("Post", PostSchema);
