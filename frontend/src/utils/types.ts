export type View =
  | "home"
  | "login"
  | "register"
  | "verifyEmail"
  | "showbiz"
  | "blogs"
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


