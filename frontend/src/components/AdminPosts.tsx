import React, { useEffect, useState } from "react";
import { API_BASE, uploadImage } from "../utils/api";

interface PostItem {
  _id: string;
  title: string;
  content: string;
  type: "showbiz" | "blog";
  imageUrl?: string;
}

export const AdminPosts: React.FC = () => {
  const [posts, setPosts] = useState<PostItem[]>([]);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [type, setType] = useState<"showbiz" | "blog">("showbiz");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageInputKey, setImageInputKey] = useState(0);

  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
  const backendBase = API_BASE.replace(/\/api\/?$/, "");

  const loadPosts = async () => {
    try {
      const res = await fetch(`${API_BASE}/posts`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Không tải được danh sách bài đăng");
      setPosts(data.posts || []);
    } catch (err: any) {
      setError(err.message || "Có lỗi xảy ra");
    }
  };

  useEffect(() => {
    loadPosts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      if (!token) throw new Error("Thiếu token admin");

      let finalImageUrl = "";
      if (imageFile) {
        try {
          finalImageUrl = await uploadImage(imageFile);
        } catch (uploadError: any) {
          throw new Error(`Upload ảnh thất bại: ${uploadError.message}`);
        }
      }

      const res = await fetch(`${API_BASE}/posts`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ 
          title, 
          content, 
          type,
          imageUrl: finalImageUrl || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Tạo bài đăng thất bại");
      setTitle("");
      setContent("");
      setType("showbiz");
      setImageFile(null);
      setImagePreview(null);
      setImageInputKey((prev) => prev + 1); // Reset file input
      await loadPosts();
    } catch (err: any) {
      setError(err.message || "Có lỗi xảy ra");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    setError(null);
    try {
      if (!token) throw new Error("Thiếu token admin");
      const res = await fetch(`${API_BASE}/posts/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Xoá bài đăng thất bại");
      await loadPosts();
    } catch (err: any) {
      setError(err.message || "Có lỗi xảy ra");
    }
  };

  return (
    <div style={{ display: "flex", gap: 24, flexDirection: "column" }}>
      <form onSubmit={handleCreate} className="auth-form">
        <h2>Tạo bài đăng mới</h2>
        <div className="form-group">
          <label>Tiêu đề</label>
          <input value={title} onChange={(e) => setTitle(e.target.value)} required />
        </div>
        <div className="form-group">
          <label>Loại bài</label>
          <select value={type} onChange={(e) => setType(e.target.value as "showbiz" | "blog")}>
            <option value="showbiz">ShowBiz</option>
            <option value="blog">Blog / Sự kiện</option>
          </select>
        </div>
        <div className="form-group">
          <label>Nội dung</label>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={4}
            style={{ resize: "vertical", padding: 10, borderRadius: 10, border: "1px solid #d1d5db" }}
            required
          />
        </div>
        <div className="form-group">
          <label>Hình ảnh bài đăng</label>
          <input
            key={imageInputKey}
            type="file"
            accept="image/*"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) {
                setImageFile(file);
                // Tạo preview cho ảnh
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
          />
          {imagePreview && (
            <div style={{ marginTop: 8 }}>
              <img
                src={imagePreview}
                alt="Preview"
                style={{
                  maxWidth: "200px",
                  maxHeight: "150px",
                  objectFit: "cover",
                  borderRadius: 6,
                  border: "1px solid #ddd",
                }}
              />
            </div>
          )}
        </div>
        <button className="btn primary full-width" type="submit" disabled={loading}>
          {loading ? "Đang tạo..." : "Tạo bài đăng"}
        </button>
      </form>

      <div>
        <h2>Danh sách bài đăng</h2>
        {error && <div className="global-message error">{error}</div>}
        <ul style={{ listStyle: "none", paddingLeft: 0, marginTop: 12 }}>
          {posts.map((p) => (
            <li
              key={p._id}
              style={{
                borderBottom: "1px solid #e5e7eb",
                padding: "12px 0",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                gap: 16,
              }}
            >
              <div style={{ display: "flex", gap: 12, alignItems: "center", flex: 1 }}>
                {p.imageUrl && (
                  <img
                    src={
                      p.imageUrl.startsWith("http")
                        ? p.imageUrl
                        : `${backendBase}${p.imageUrl}`
                    }
                    alt={p.title}
                    style={{
                      width: 80,
                      height: 60,
                      objectFit: "cover",
                      borderRadius: 6,
                      border: "1px solid #ddd",
                    }}
                  />
                )}
                <div>
                  <strong>
                    [{p.type === "showbiz" ? "ShowBiz" : "Blog"}] {p.title}
                  </strong>
                  <div className="event-meta">{p.content.slice(0, 100)}...</div>
                </div>
              </div>
              <button className="btn outline" type="button" onClick={() => handleDelete(p._id)}>
                Xoá
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};


