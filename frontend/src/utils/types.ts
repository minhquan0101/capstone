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


