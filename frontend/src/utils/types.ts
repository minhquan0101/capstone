export type View =
  | "home"
  | "login"
  | "verifyEmail"
  | "register"
  | "showbiz"
  | "showbizDetail"
  | "event_detail"
  | "seatmap" // ✅ thêm
  | "blogs"
  | "blogDetail"
  | "booking"
  | "payment"
  | "changePassword"
  | "forgotPassword"
  | "admin"
  | "profile";

export type UserRole = "user" | "admin";

export interface UserInfo {
  name: string;
  email: string;
  role: UserRole;
}

export interface AuthResponse {
  token?: string;
  user?: UserInfo & { id: string };
  message?: string;
  requireEmailVerification?: boolean;
}

/** ✅ TicketType (dùng cho event chia hạng vé) */
export interface TicketType {
  _id: string;
  name: string;
  price: number;
  total: number;
  sold?: number;
  held?: number;
}

/** ✅ Seatmap types */
export type SeatMapMode = "none" | "seat" | "zone";
export type SeatMapType = "svg" | "json";

export interface SeatMapJsonSeat {
  seatId: string;
  x: number;
  y: number;
  ticketTypeId: string;
  label?: string;
}

export interface SeatMapJsonZone {
  zoneId: string;
  x: number;
  y: number;
  width: number;
  height: number;
  ticketTypeId: string;
  label?: string;
}

export interface SeatMapJson {
  width: number;
  height: number;
  seats?: SeatMapJsonSeat[];
  zones?: SeatMapJsonZone[];
  backgroundUrl?: string;
}

/** ✅ Event type (FE) */
export interface Event {
  _id: string;

  title: string;
  description?: string;
  location?: string;
  date?: string; // backend Date => FE thường nhận ISO string

  price?: number;

  ticketsTotal?: number;
  ticketsSold?: number;
  ticketsHeld?: number;

  ticketTypes?: TicketType[];

  imageUrl?: string;
  isFeatured?: boolean;
  isTrending?: boolean;

  seatMapMode?: SeatMapMode;
  seatMapType?: SeatMapType;
  seatMapUrl?: string;
  seatMapJson?: SeatMapJson;

  createdAt?: string;
  updatedAt?: string;
}
