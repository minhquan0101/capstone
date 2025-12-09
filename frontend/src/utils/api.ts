import { AuthResponse, UserInfo } from "./types";

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

// Lấy thông tin user hiện tại từ database (để đảm bảo role được cập nhật)
export async function getCurrentUser(): Promise<{ user: UserInfo & { id: string } }> {
  const token = localStorage.getItem("token");
  if (!token) {
    throw new Error("Không có token");
  }

  const res = await fetch(`${API_BASE}/auth/me`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || "Có lỗi xảy ra");
  }

  return data;
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

// Yêu cầu gửi mã xác minh để đặt lại mật khẩu
export async function requestResetPassword(email: string): Promise<{ message: string }> {
  const res = await fetch(`${API_BASE}/auth/request-reset-password`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email }),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || "Gửi mã xác minh thất bại");
  }

  return data;
}

// Đặt lại mật khẩu với mã xác minh
export async function resetPassword(
  email: string,
  code: string,
  newPassword: string
): Promise<{ message: string }> {
  const res = await fetch(`${API_BASE}/auth/reset-password-simple`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email, code, newPassword }),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || "Đặt lại mật khẩu thất bại");
  }

  return data;
}

export async function uploadImage(file: File): Promise<string> {
  const formData = new FormData();
  formData.append("file", file);

  const res = await fetch(`${API_BASE}/upload`, {
    method: "POST",
    body: formData,
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || "Upload ảnh thất bại");
  }

  // Trả về đường dẫn tương đối để lưu vào DB (ví dụ: /uploads/filename.png)
  // Backend đã trả về đường dẫn tương đối, giữ nguyên để lưu vào DB
  return data.url;
}