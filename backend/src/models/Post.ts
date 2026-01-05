import mongoose, { Schema, Document, Model } from "mongoose";

export type PostRegion = "vn" | "asia" | "us_eu";
export type PostSection = "news" | "photo";

export interface IPost extends Document {
  title: string;
  content: string;
  type: "showbiz" | "blog";
  imageUrl?: string;

  // ✅ thêm để giống Ngôi Sao
  region?: PostRegion;        // vn / asia / us_eu
  section?: PostSection;      // news / photo (Ảnh sao)
  summary?: string;           // mô tả ngắn dưới title
  isFeatured?: boolean;       // nổi bật
  views: number;              // đọc nhiều

  createdAt: Date;
  updatedAt: Date;
}

const PostSchema: Schema<IPost> = new Schema(
  {
    title: { type: String, required: true, trim: true },
    content: { type: String, required: true },
    type: { type: String, enum: ["showbiz", "blog"], required: true },
    imageUrl: { type: String },

    region: { type: String, enum: ["vn", "asia", "us_eu"], default: "vn" },
    section: { type: String, enum: ["news", "photo"], default: "news" },
    summary: { type: String, trim: true, maxlength: 300 },
    isFeatured: { type: Boolean, default: false },
    views: { type: Number, default: 0 },
  },
  { timestamps: true }
);

// index để query nhanh
PostSchema.index({ type: 1, region: 1, section: 1, createdAt: -1 });
PostSchema.index({ type: 1, views: -1 });

export const Post: Model<IPost> =
  (mongoose.models.Post as Model<IPost>) || mongoose.model<IPost>("Post", PostSchema);
