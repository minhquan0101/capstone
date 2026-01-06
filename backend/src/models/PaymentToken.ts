import { Schema, model, models } from "mongoose";

const PaymentTokenSchema = new Schema(
  {
    bookingId: { type: Schema.Types.ObjectId, required: true, index: true },
    userId: { type: Schema.Types.ObjectId, required: true, index: true },
    token: { type: String, required: true, unique: true, index: true },
    expiresAt: { type: Date, required: true, index: true },
    usedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

export const PaymentToken =
  models.PaymentToken || model("PaymentToken", PaymentTokenSchema);
