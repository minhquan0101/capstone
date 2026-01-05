import mongoose, { Schema, Document, Model } from "mongoose";

export type BookingStatus = "pending" | "paid" | "failed" | "cancelled" | "expired";
export type BookingMode = "normal" | "seat";

export interface ISeatItem {
  seatId: string; // "A1-01"
  ticketTypeId: mongoose.Types.ObjectId;
  unitPrice: number;
}

export interface IBooking extends Document {
  userId: mongoose.Types.ObjectId;
  eventId: mongoose.Types.ObjectId;
  eventTitle: string;

  // ✅ booking theo số lượng
  ticketTypeId?: mongoose.Types.ObjectId;
  ticketTypeName?: string;

  // ✅ booking theo ghế
  mode?: BookingMode; // "normal" | "seat"
  seatItems?: ISeatItem[];

  quantity: number;
  unitPrice: number;
  totalAmount: number;
  paymentMethod: "momo" | "credit_card" | "bank_transfer";
  status: BookingStatus;
  expiresAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const SeatItemSchema = new Schema<ISeatItem>(
  {
    seatId: { type: String, required: true, trim: true },
    ticketTypeId: { type: Schema.Types.ObjectId, ref: "TicketType", required: true },
    unitPrice: { type: Number, required: true, min: 0, default: 0 },
  },
  { _id: false }
);

const BookingSchema: Schema<IBooking> = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    eventId: { type: Schema.Types.ObjectId, ref: "Event", required: true },

    eventTitle: { type: String, required: true },

    // ✅ hạng vé (normal)
    ticketTypeId: { type: Schema.Types.ObjectId, ref: "TicketType" },
    ticketTypeName: { type: String },

    // ✅ seat mode
    mode: { type: String, enum: ["normal", "seat"], default: "normal", index: true },
    seatItems: { type: [SeatItemSchema], default: [] },

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
      index: true,
    },

    expiresAt: { type: Date },
  },
  { timestamps: true }
);

BookingSchema.index({ userId: 1, createdAt: -1 });
BookingSchema.index({ status: 1, expiresAt: 1 });
BookingSchema.index({ eventId: 1 });
BookingSchema.index({ ticketTypeId: 1 });

// ✅ tiện debug seatmap
BookingSchema.index({ "seatItems.seatId": 1 });

export const Booking: Model<IBooking> =
  (mongoose.models.Booking as Model<IBooking>) ||
  mongoose.model<IBooking>("Booking", BookingSchema);
