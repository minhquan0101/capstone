import { AuthResponse } from "./types";

// URL base của backend để gọi API.
export const API_BASE =
  (process.env.REACT_APP_API_BASE as string | undefined) || "http://localhost:3000/api";

export async function login(email: string, password: string): Promise<AuthResponse> {
  return authRequest("login", { email, password });
}

export async function register(
  name: string,
  email: string,
  password: string
): Promise<AuthResponse> {
  return authRequest("register", { name, email, password });
}

// Gọi API xác minh email
export async function verifyEmail(email: string, code: string): Promise<AuthResponse> {
  const res = await fetch(`${API_BASE}/auth/verify-email`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email, code }),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || "Có lỗi xảy ra");
  }

  return data as AuthResponse;
}

async function authRequest(
  mode: "login" | "register",
  body: Record<string, unknown>
): Promise<AuthResponse> {
  const endpoint = mode === "login" ? `${API_BASE}/auth/login` : `${API_BASE}/auth/register`;

  const res = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  const data = await res.json();

  if (!res.ok) {
    if (data && data.requireEmailVerification) {
      return data as AuthResponse;
    }
    throw new Error(data.message || "Có lỗi xảy ra");
  }

  return data as AuthResponse;
}
