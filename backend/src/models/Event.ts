import mongoose, { Schema, Document, Model } from "mongoose";

export interface ITicketType {
  _id?: mongoose.Types.ObjectId;
  name: string;
  price: number;
  total: number;
  sold?: number;
  held?: number;
}

export type SeatMapMode = "none" | "seat" | "zone";
export type SeatMapType = "svg" | "json";

export interface ISeatMapJsonSeat {
  seatId: string; // "A1-01"
  x: number;
  y: number;
  ticketTypeId: string; // ObjectId string of TicketType
  label?: string;
}

export interface ISeatMapJsonZone {
  zoneId: string; // "VIP-A"
  x: number;
  y: number;
  width: number;
  height: number;
  ticketTypeId: string; // ObjectId string of TicketType
  label?: string;
}

export interface ISeatMapJson {
  width: number;
  height: number;
  seats?: ISeatMapJsonSeat[];
  zones?: ISeatMapJsonZone[];
  backgroundUrl?: string;
}

export interface IEvent extends Document {
  title: string;
  description?: string;
  location?: string;
  date?: Date;

  price?: number;

  ticketsTotal?: number;
  ticketsSold?: number;
  ticketsHeld?: number;

  ticketTypes?: ITicketType[];

  imageUrl?: string;
  isFeatured?: boolean;
  isTrending?: boolean;

  // ✅ tags for filtering and smart search
  tags?: string[];

  // ✅ seatmap
  seatMapMode?: SeatMapMode;
  seatMapType?: SeatMapType;
  seatMapUrl?: string;
  seatMapJson?: ISeatMapJson;

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

const SeatMapJsonSeatSchema = new Schema<ISeatMapJsonSeat>(
  {
    seatId: { type: String, required: true, trim: true },
    x: { type: Number, required: true },
    y: { type: Number, required: true },
    ticketTypeId: { type: String, required: true, trim: true },
    label: { type: String },
  },
  { _id: false }
);

const SeatMapJsonZoneSchema = new Schema<ISeatMapJsonZone>(
  {
    zoneId: { type: String, required: true, trim: true },
    x: { type: Number, required: true },
    y: { type: Number, required: true },
    width: { type: Number, required: true },
    height: { type: Number, required: true },
    ticketTypeId: { type: String, required: true, trim: true },
    label: { type: String },
  },
  { _id: false }
);

const SeatMapJsonSchema = new Schema<ISeatMapJson>(
  {
    width: { type: Number, required: true },
    height: { type: Number, required: true },
    seats: { type: [SeatMapJsonSeatSchema], default: undefined },
    zones: { type: [SeatMapJsonZoneSchema], default: undefined },
    backgroundUrl: { type: String },
  },
  { _id: false }
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

    ticketTypes: { type: [TicketTypeSchema], default: [] },

    imageUrl: { type: String },
    isFeatured: { type: Boolean, default: false },
    isTrending: { type: Boolean, default: false },

    // ✅ tags for filtering
    tags: { type: [String], default: [], required: false },

    // ✅ seatmap config
    seatMapMode: { type: String, enum: ["none", "seat", "zone"], default: "none" },
    seatMapType: { type: String, enum: ["svg", "json"], default: "svg" },
    seatMapUrl: { type: String },
    seatMapJson: { type: SeatMapJsonSchema },
  },
  { timestamps: true }
);

// ✅ Export BOTH named + default để VSCode import kiểu nào cũng không lỗi
const Event =
  (mongoose.models.Event as Model<IEvent>) ||
  mongoose.model<IEvent>("Event", EventSchema);

export { Event };
export default Event;
