import mongoose, { Schema, Document, Model } from "mongoose";

export interface ITicketType {
  _id?: mongoose.Types.ObjectId;
  name: string;
  price: number;
  total: number;
  sold?: number;
  held?: number;
}

export interface IEvent extends Document {
  title: string;
  description?: string;
  location?: string;
  date?: Date;

  // giá hiển thị chung (có thể = min price nếu có ticketTypes)
  price?: number;

  // tổng vé chung (có thể = sum total nếu có ticketTypes)
  ticketsTotal?: number;
  ticketsSold?: number;
  ticketsHeld?: number;

  // ✅ hạng vé
  ticketTypes?: ITicketType[];

  imageUrl?: string;
  isFeatured?: boolean;
  isTrending?: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const TicketTypeSchema = new Schema<ITicketType>(
  {
    name: { type: String, required: true, trim: true },
    price: { type: Number, required: true, min: 0 },
    total: { type: Number, required: true, min: 0 },
    sold: { type: Number, default: 0, min: 0 },
    held: { type: Number, default: 0, min: 0 },
  },
  { _id: true }
);

const EventSchema: Schema<IEvent> = new Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String },
    location: { type: String },
    date: { type: Date },
    price: { type: Number, default: 0 },

    ticketsTotal: { type: Number, default: 100, min: 0 },
    ticketsSold: { type: Number, default: 0, min: 0 },
    ticketsHeld: { type: Number, default: 0, min: 0 },

    // ✅ nếu event có chia hạng vé thì lưu tại đây
    ticketTypes: { type: [TicketTypeSchema], default: [] },

    imageUrl: { type: String },
    isFeatured: { type: Boolean, default: false },
    isTrending: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export const Event: Model<IEvent> =
  (mongoose.models.Event as Model<IEvent>) ||
  mongoose.model<IEvent>("Event", EventSchema);
