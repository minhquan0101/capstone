import jwt from "jsonwebtoken";
import { NextRequest, NextResponse } from "next/server";
import { IUser } from "@/models/User";


export const JWT_SECRET =
  process.env.JWT_SECRET || "dev_fallback_jwt_secret_change_in_production";

export type AuthRole = "user" | "admin";

export interface AuthPayload {
  sub: string;
  email: string;
  name: string;
  role: AuthRole;
}

export function signAuthToken(user: IUser): string {
  const payload: AuthPayload = {
    sub: user._id.toString(),
    email: user.email,
    name: user.name,
    role: user.role,
  };

  return jwt.sign(payload, JWT_SECRET, { expiresIn: "7d" });
}

export function parseAuthHeader(req: NextRequest): string | null {
  const authHeader = req.headers.get("authorization") || req.headers.get("Authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) return null;
  return authHeader.split(" ")[1] ?? null;
}

export function verifyToken(token: string): AuthPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as AuthPayload;
  } catch {
    return null;
  }
}

export function requireUser(req: NextRequest): AuthPayload | NextResponse {
  const token = parseAuthHeader(req);
  if (!token) {
    return NextResponse.json({ message: "Thiếu token xác thực" }, { status: 401 });
  }

  const payload = verifyToken(token);
  if (!payload) {
    return NextResponse.json({ message: "Token không hợp lệ" }, { status: 401 });
  }

  return payload;
}

export function requireAdmin(req: NextRequest): AuthPayload | NextResponse {
  const user = requireUser(req);
  if (user instanceof NextResponse) return user;

  if (user.role !== "admin") {
    return NextResponse.json(
      { message: "Bạn không có quyền thực hiện thao tác này" },
      { status: 403 }
    );
  }

  return user;
}