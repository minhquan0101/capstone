import mongoose, { Schema, Document, Model } from "mongoose";

export interface IBooking extends Document {
  userId: mongoose.Types.ObjectId;
  eventName: string;
  quantity: number;
  paymentMethod: string;
  status: "paid" | "pending" | "failed";
  createdAt: Date;
  updatedAt: Date;
}

const BookingSchema: Schema<IBooking> = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    eventName: { type: String, required: true },
    quantity: { type: Number, required: true, min: 1 },
    paymentMethod: { type: String, required: true },
    status: {
      type: String,
      enum: ["paid", "pending", "failed"],
      default: "paid", // demo: coi như thanh toán thành công
    },
  },
  {
    timestamps: true,
  }
);

export const Booking: Model<IBooking> =
  (mongoose.models.Booking as Model<IBooking>) ||
  mongoose.model<IBooking>("Booking", BookingSchema);


