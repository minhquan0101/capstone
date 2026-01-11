import AsyncStorage from "@react-native-async-storage/async-storage";
import { AuthResponse, Post, UserInfo, Event, TicketType } from "./types";

// URL base của backend để gọi API.
// For React Native/Expo, use your computer's IP address instead of localhost
// Example: http://192.168.1.100:3000/api
// Or set EXPO_PUBLIC_API_BASE environment variable
export const API_BASE =
  (process.env.EXPO_PUBLIC_API_BASE as string | undefined) || "http://localhost:3000/api";

// Helper to get image URL from relative path
export function getImageUrl(url?: string): string {
  if (!url) return "";
  const baseUrl = API_BASE.replace("/api", "");
  return url.startsWith("http") ? url : `${baseUrl}${url}`;
}

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

// Lấy thông tin user hiện tại từ database
export async function getCurrentUser(): Promise<{ user: UserInfo & { id: string } }> {
  const token = await AsyncStorage.getItem("token");
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

export async function uploadImage(uri: string): Promise<string> {
  const formData = new FormData();
  formData.append("file", {
    uri,
    type: "image/jpeg",
    name: "photo.jpg",
  } as any);

  const token = await AsyncStorage.getItem("token");
  const res = await fetch(`${API_BASE}/upload`, {
    method: "POST",
    headers: {
      Authorization: token ? `Bearer ${token}` : "",
    },
    body: formData,
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || "Upload ảnh thất bại");
  }

  return data.url;
}

// Lấy danh sách posts
export async function getPosts(): Promise<Post[]> {
  const res = await fetch(`${API_BASE}/posts`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || "Lấy danh sách bài đăng thất bại");
  }

  return data.posts || [];
}

// Lấy chi tiết một post
export async function getPost(id: string): Promise<Post> {
  const res = await fetch(`${API_BASE}/posts/${id}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || "Lấy chi tiết bài đăng thất bại");
  }

  return data.post;
}

// Lấy danh sách events
export async function getEvents(featured?: boolean, trending?: boolean, tags?: string[]): Promise<Event[]> {
  const params = new URLSearchParams();
  if (featured) params.append("featured", "true");
  if (trending) params.append("trending", "true");
  if (tags && tags.length > 0) {
    params.append("tags", tags.join(","));
  }

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

// Lấy chi tiết event
export async function getEvent(eventId: string): Promise<{ event: Event; ticketTypes: TicketType[] }> {
  const res = await fetch(`${API_BASE}/events/${eventId}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || "Lấy chi tiết sự kiện thất bại");
  }

  return {
    event: data.event,
    ticketTypes: data.ticketTypes || [],
  };
}

// Tạo booking
export async function createBooking(
  eventId: string,
  quantity: number,
  paymentMethod: "momo" | "credit_card" | "bank_transfer",
  ticketTypeId?: string
): Promise<any> {
  const token = await AsyncStorage.getItem("token");
  if (!token) {
    throw new Error("Bạn cần đăng nhập để đặt vé");
  }

  const body: any = {
    eventId,
    quantity,
    paymentMethod,
  };
  
  if (ticketTypeId) {
    body.ticketTypeId = ticketTypeId;
  }

  const res = await fetch(`${API_BASE}/bookings`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(body),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || "Đặt vé thất bại");
  }

  return data;
}

// Lấy chi tiết booking
export async function getBooking(bookingId: string): Promise<any> {
  const token = await AsyncStorage.getItem("token");
  if (!token) {
    throw new Error("Bạn cần đăng nhập");
  }

  const res = await fetch(`${API_BASE}/bookings/${bookingId}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || "Lấy thông tin đơn thất bại");
  }

  return data.booking;
}

// Tạo VietQR cho booking
export async function createVietQR(bookingId: string): Promise<{
  bookingId: string;
  amount: number;
  addInfo: string;
  qrImageUrl: string;
  expiresAt?: string;
  receive?: {
    bankId: string;
    accountNo: string;
    accountName: string;
    template?: string;
  };
}> {
  const token = await AsyncStorage.getItem("token");
  if (!token) {
    throw new Error("Bạn cần đăng nhập để thanh toán");
  }

  const res = await fetch(`${API_BASE}/payments/vietqr/${bookingId}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || "Không tạo được VietQR");
  }

  return data;
}

// Đổi mật khẩu
export async function changePassword(
  oldPassword: string,
  newPassword: string
): Promise<{ message: string }> {
  const token = await AsyncStorage.getItem("token");
  if (!token) {
    throw new Error("Bạn cần đăng nhập để đổi mật khẩu");
  }

  const res = await fetch(`${API_BASE}/auth/change-password`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ oldPassword, newPassword }),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || "Đổi mật khẩu thất bại");
  }

  return data;
}

