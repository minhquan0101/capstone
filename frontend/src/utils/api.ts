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

  const uploadUrl = `${API_BASE}/upload`;
  console.log("Upload URL:", uploadUrl);
  console.log("API_BASE:", API_BASE);

  try {
    const res = await fetch(uploadUrl, {
      method: "POST",
      body: formData,
      // Không set Content-Type header, browser sẽ tự động set với boundary cho FormData
    });

    console.log("Upload response status:", res.status);
    console.log("Upload response ok:", res.ok);

    // Kiểm tra nếu response không phải JSON
    const contentType = res.headers.get("content-type");
    if (!contentType || !contentType.includes("application/json")) {
      const text = await res.text();
      console.error("Non-JSON response:", text);
      throw new Error(`Server trả về lỗi: ${text || res.statusText}`);
    }

    const data = await res.json();
    console.log("Upload response data:", data);
    
    if (!res.ok) {
      throw new Error(data.message || `Upload ảnh thất bại: ${res.status} ${res.statusText}`);
    }

    if (!data.url) {
      throw new Error("Server không trả về đường dẫn ảnh");
    }

    // Trả về đường dẫn tương đối để lưu vào DB (ví dụ: /uploads/filename.png)
    return data.url;
  } catch (error: any) {
    console.error("Upload error details:", {
      name: error.name,
      message: error.message,
      stack: error.stack,
    });
    
    // Nếu là lỗi network hoặc fetch
    if (error.name === "TypeError" || error.message.includes("fetch") || error.message.includes("Failed to fetch")) {
      throw new Error(
        `Không thể kết nối đến server tại ${uploadUrl}. ` +
        `Vui lòng kiểm tra:\n` +
        `1. Backend có đang chạy không?\n` +
        `2. URL backend có đúng không? (Hiện tại: ${API_BASE})\n` +
        `3. CORS có được cấu hình đúng không?`
      );
    }
    // Nếu đã có message từ server
    throw error;
  }
}

export interface Post {
  _id: string;
  title: string;
  content: string;
  type: "showbiz" | "blog";
  imageUrl?: string;

  // ✅ thêm để giống Ngôi Sao
  region?: "vn" | "asia" | "us_eu";
  section?: "news" | "photo";
  summary?: string;
  isFeatured?: boolean;
  views?: number;

  createdAt: string;
  updatedAt: string;
}

// Lấy danh sách posts
export async function getPosts(params?: Record<string, string | number | undefined>): Promise<Post[]> {
  const qs =
    params && Object.keys(params).length > 0
      ? "?" +
        Object.entries(params)
          .filter(([, v]) => v !== undefined && v !== null && `${v}` !== "")
          .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`)
          .join("&")
      : "";

  const res = await fetch(`${API_BASE}/posts${qs}`, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Lấy danh sách bài đăng thất bại");
  return data.posts || [];
}

// Lấy chi tiết một post
export async function getPost(id: string, incView: boolean = true): Promise<Post> {
  const url = new URL(`${API_BASE}/posts/${id}`);
  if (incView) url.searchParams.set("inc", "1");

  const res = await fetch(url.toString(), {
    method: "GET",
    headers: { "Content-Type": "application/json" },
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Lấy chi tiết bài đăng thất bại");
  return data.post;
}

export interface Event {
  _id: string;
  title: string;
  description?: string;
  location?: string;
  date?: string;
  price?: number;
  imageUrl?: string;
  isFeatured?: boolean;
  isTrending?: boolean;
  createdAt: string;
  updatedAt: string;
}

// Lấy banner
export async function getBanner(): Promise<{ imageUrl: string } | null> {
  const res = await fetch(`${API_BASE}/banner`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || "Lấy banner thất bại");
  }

  return data.banner;
}

// Lấy danh sách events
export async function getEvents(featured?: boolean, trending?: boolean): Promise<Event[]> {
  const params = new URLSearchParams();
  if (featured) params.append("featured", "true");
  if (trending) params.append("trending", "true");

  const url = `${API_BASE}/events${params.toString() ? `?${params.toString()}` : ""}`;
  const res = await fetch(url, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || "Lấy danh sách sự kiện thất bại");
  }

  return data.events || [];
}