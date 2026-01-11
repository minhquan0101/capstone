export type View =
  | "home"
  | "login"
  | "verifyEmail"
  | "register"
  | "showbiz"
  | "showbizDetail"
  | "blogs"
  | "blogDetail"
  | "booking"
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

export interface Post {
  _id: string;
  title: string;
  content: string;
  type: "showbiz" | "blog";
  imageUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export interface TicketType {
  _id: string;
  eventId: string;
  name: string;
  price: number;
  total: number;
  sold: number;
  held: number;
  createdAt: string;
  updatedAt: string;
}

export interface Event {
  _id: string;
  title: string;
  description?: string;
  location?: string;
  date?: string;
  price?: number;
  priceFrom?: number;
  imageUrl?: string;
  isFeatured?: boolean;
  isTrending?: boolean;
  tags?: string[];
  ticketsTotal?: number;
  ticketsSold?: number;
  ticketsHeld?: number;
  ticketsRemaining?: number;
  ticketTypes?: TicketType[];
  createdAt: string;
  updatedAt: string;
}

