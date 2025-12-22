import mongoose, { Schema, Document, Model } from "mongoose";

export type BookingStatus = "pending" | "paid" | "failed" | "cancelled" | "expired";

export interface IBooking extends Document {
  userId: mongoose.Types.ObjectId;
  eventId: mongoose.Types.ObjectId;
  eventTitle: string;

  // ✅ thêm hạng vé
  ticketTypeId?: mongoose.Types.ObjectId;
  ticketTypeName?: string;

  quantity: number;
  unitPrice: number;
  totalAmount: number;
  paymentMethod: "momo" | "credit_card" | "bank_transfer";
  status: BookingStatus;
  expiresAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const BookingSchema: Schema<IBooking> = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    eventId: { type: Schema.Types.ObjectId, ref: "Event", required: true },

    eventTitle: { type: String, required: true }, // snapshot tên event

    // ✅ hạng vé (nếu event có chia hạng)
    ticketTypeId: { type: Schema.Types.ObjectId, ref: "TicketType" },
    ticketTypeName: { type: String },

    quantity: { type: Number, required: true, min: 1 },

    unitPrice: { type: Number, required: true, min: 0, default: 0 },
    totalAmount: { type: Number, required: true, min: 0, default: 0 },

    paymentMethod: {
      type: String,
      enum: ["momo", "credit_card", "bank_transfer"],
      required: true,
      default: "momo",
    },

    status: {
      type: String,
      enum: ["pending", "paid", "failed", "cancelled", "expired"],
      default: "pending",
    },

    expiresAt: { type: Date }, // hết hạn giữ vé
  },
  { timestamps: true }
);

BookingSchema.index({ userId: 1, createdAt: -1 });
BookingSchema.index({ status: 1, expiresAt: 1 });
BookingSchema.index({ eventId: 1 });
BookingSchema.index({ ticketTypeId: 1 });

export const Booking: Model<IBooking> =
  (mongoose.models.Booking as Model<IBooking>) ||
  mongoose.model<IBooking>("Booking", BookingSchema);
