import React, { useEffect, useState } from "react";
import { API_BASE, uploadImage } from "../utils/api";

interface BannerItem {
  _id: string;
  imageUrl: string;
  createdAt: string;
}

export const AdminBanner: React.FC = () => {
  const [banner, setBanner] = useState<BannerItem | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [imageInputKey, setImageInputKey] = useState(0);

  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
  const backendBase = API_BASE.replace(/\/api\/?$/, "");

  const loadBanner = async () => {
    try {
      const res = await fetch(`${API_BASE}/banner`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Không tải được banner");
      setBanner(data.banner);
    } catch (err: any) {
      setError(err.message || "Có lỗi xảy ra");
    }
  };

  useEffect(() => {
    loadBanner();
  }, []);

  const testConnection = async () => {
    try {
      console.log("Testing connection to:", `${API_BASE}/banner`);
      const res = await fetch(`${API_BASE}/banner`, {
        method: "GET",
      });
      console.log("Connection test result:", res.status, res.ok);
      return res.ok;
    } catch (err) {
      console.error("Connection test failed:", err);
      return false;
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      if (!token) {
        throw new Error("Thiếu token admin. Vui lòng đăng nhập lại.");
      }
      if (!imageFile) {
        throw new Error("Vui lòng chọn ảnh banner");
      }

      // Test connection first
      console.log("Testing backend connection...");
      const isConnected = await testConnection();
      if (!isConnected) {
        throw new Error(
          `Không thể kết nối đến backend tại ${API_BASE}.\n` +
          `Vui lòng đảm bảo:\n` +
          `1. Backend đang chạy (cd backend && npm run dev)\n` +
          `2. Backend chạy trên port 3000\n` +
          `3. Kiểm tra console để xem chi tiết lỗi`
        );
      }

      console.log("Bắt đầu upload ảnh...");
      let imageUrl: string;
      try {
        imageUrl = await uploadImage(imageFile);
        console.log("Upload ảnh thành công:", imageUrl);
      } catch (uploadErr: any) {
        console.error("Lỗi upload ảnh:", uploadErr);
        throw new Error(`Upload ảnh thất bại: ${uploadErr.message || "Không thể upload file"}`);
      }

      console.log("Đang lưu banner vào database...");
      const res = await fetch(`${API_BASE}/banner`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ imageUrl }),
      });
      
      const data = await res.json();
      if (!res.ok) {
        console.error("Lỗi lưu banner:", data);
        throw new Error(data.message || `Tải banner thất bại: ${res.status}`);
      }
      
      console.log("Banner đã được lưu thành công");
      setImageFile(null);
      setImagePreview(null);
      setImageInputKey((prev) => prev + 1);
      await loadBanner();
    } catch (err: any) {
      console.error("Lỗi tổng thể:", err);
      setError(err.message || "Có lỗi xảy ra khi upload banner");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: "flex", gap: 24, flexDirection: "column" }}>
      <form onSubmit={handleUpload} className="auth-form">
        <h2>Quản lý Banner</h2>
        <div className="form-group">
          <label>Hình ảnh banner</label>
          <input
            key={imageInputKey}
            type="file"
            accept="image/*"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) {
                setImageFile(file);
                const reader = new FileReader();
                reader.onloadend = () => {
                  setImagePreview(reader.result as string);
                };
                reader.readAsDataURL(file);
              } else {
                setImageFile(null);
                setImagePreview(null);
              }
            }}
            required
          />
          {imagePreview && (
            <div style={{ marginTop: 8 }}>
              <img
                src={imagePreview}
                alt="Preview"
                style={{
                  maxWidth: "100%",
                  maxHeight: "300px",
                  objectFit: "contain",
                  borderRadius: 6,
                  border: "1px solid #ddd",
                }}
              />
            </div>
          )}
        </div>
        <button className="btn primary full-width" type="submit" disabled={loading}>
          {loading ? "Đang tải lên..." : "Tải banner lên"}
        </button>
      </form>

      <div>
        <h2>Banner hiện tại</h2>
        {error && (
          <div className="global-message error" style={{ whiteSpace: "pre-line" }}>
            {error}
          </div>
        )}
        <div style={{ marginTop: 8, fontSize: 12, color: "#666" }}>
          <p>API Base URL: {API_BASE}</p>
          <p>Backend URL: {backendBase}</p>
        </div>
        {banner ? (
          <div style={{ marginTop: 12 }}>
            <img
              src={
                banner.imageUrl.startsWith("http")
                  ? banner.imageUrl
                  : `${backendBase}${banner.imageUrl}`
              }
              alt="Banner"
              style={{
                width: "100%",
                maxHeight: "400px",
                objectFit: "contain",
                borderRadius: 6,
                border: "1px solid #ddd",
              }}
            />
            <p className="event-meta" style={{ marginTop: 8 }}>
              Đã tải lên: {new Date(banner.createdAt).toLocaleString("vi-VN")}
            </p>
          </div>
        ) : (
          <p className="event-meta" style={{ marginTop: 12 }}>
            Chưa có banner nào được tải lên
          </p>
        )}
      </div>
    </div>
  );
};

