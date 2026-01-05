import mongoose, { Schema, Types } from "mongoose";

export interface ISeatLock {
  eventId: Types.ObjectId;
  seatId: string; // "A1-01"
  ticketTypeId: Types.ObjectId;
  bookingId: Types.ObjectId;
  status: "held" | "sold";
  expiresAt?: Date;
  createdAt: Date;
}

const SeatLockSchema = new Schema<ISeatLock>(
  {
    eventId: { type: Schema.Types.ObjectId, ref: "Event", required: true, index: true },
    seatId: { type: String, required: true },
    ticketTypeId: { type: Schema.Types.ObjectId, ref: "TicketType", required: true },
    bookingId: { type: Schema.Types.ObjectId, ref: "Booking", required: true },
    status: { type: String, enum: ["held", "sold"], required: true },
    expiresAt: { type: Date },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

SeatLockSchema.index({ eventId: 1, seatId: 1 }, { unique: true });

export const SeatLock =
  (mongoose.models.SeatLock as mongoose.Model<ISeatLock>) ||
  mongoose.model<ISeatLock>("SeatLock", SeatLockSchema);
