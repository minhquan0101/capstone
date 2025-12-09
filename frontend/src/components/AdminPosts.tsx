import React, { useEffect, useState } from "react";
import { API_BASE } from "../utils/api";

interface PostItem {
  _id: string;
  title: string;
  content: string;
  type: "showbiz" | "blog";
}

export const AdminPosts: React.FC = () => {
  const [posts, setPosts] = useState<PostItem[]>([]);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [type, setType] = useState<"showbiz" | "blog">("showbiz");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;

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
      const res = await fetch(`${API_BASE}/posts`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ title, content, type }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Tạo bài đăng thất bại");
      setTitle("");
      setContent("");
      setType("showbiz");
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
                padding: "8px 0",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                gap: 8,
              }}
            >
              <div>
                <strong>
                  [{p.type === "showbiz" ? "ShowBiz" : "Blog"}] {p.title}
                </strong>
                <div className="event-meta">{p.content.slice(0, 100)}...</div>
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


