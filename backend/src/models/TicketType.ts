import mongoose, { Schema, Document, Model } from "mongoose";

export interface ITicketType extends Document {
  eventId: mongoose.Types.ObjectId;
  name: string;     // VIP / Thường / Kim cương...
  price: number;    // giá của hạng vé
  total: number;    // tổng vé hạng này
  sold: number;     // đã bán
  held: number;     // đang giữ (booking pending)
  createdAt: Date;
  updatedAt: Date;
}

const TicketTypeSchema = new Schema<ITicketType>(
  {
    eventId: { type: Schema.Types.ObjectId, ref: "Event", required: true, index: true },
    name: { type: String, required: true, trim: true },
    price: { type: Number, required: true, min: 0 },
    total: { type: Number, required: true, min: 0 },
    sold: { type: Number, default: 0, min: 0 },
    held: { type: Number, default: 0, min: 0 },
  },
  { timestamps: true }
);

TicketTypeSchema.index({ eventId: 1, name: 1 });

export const TicketType: Model<ITicketType> =
  (mongoose.models.TicketType as Model<ITicketType>) ||
  mongoose.model<ITicketType>("TicketType", TicketTypeSchema);
