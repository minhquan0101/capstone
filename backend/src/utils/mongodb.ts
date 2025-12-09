import mongoose from "mongoose";

// Ưu tiên dùng MONGODB_URI từ biến môi trường, nếu không có thì dùng URI local cho môi trường dev.
// Lưu ý: Khi triển khai production, BẮT BUỘC phải cấu hình MONGODB_URI thật trong biến môi trường.
const MONGODB_URI =
  process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/capstone1";

// Không throw lỗi ngay khi load module nữa, để tránh làm crash toàn bộ server.
let cached = (global as any)._mongooseCache;

if (!cached) {
  cached = (global as any)._mongooseCache = {
    conn: null as typeof mongoose | null,
    promise: null as Promise<typeof mongoose> | null,
  };
}

export async function connectDB() {
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    cached.promise = mongoose
      .connect(MONGODB_URI)
      .then((mongooseInstance) => mongooseInstance);
  }

  cached.conn = await cached.promise;
  return cached.conn;
}


