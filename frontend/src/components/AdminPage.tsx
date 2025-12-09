import React, { useState } from "react";
import { AdminEvents } from "./AdminEvents";
import { AdminPosts } from "./AdminPosts";

export const AdminPage: React.FC = () => {
  const [tab, setTab] = useState<"events" | "posts">("events");

  return (
    <section className="auth-section">
      <div className="auth-card" style={{ maxWidth: 900, width: "100%" }}>
        <h1>Khu vực quản trị</h1>
        <p className="subtitle">Quản lý sự kiện và bài đăng (ShowBiz / Blogs).</p>
        <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
          <button
            className={`btn outline ${tab === "events" ? "active" : ""}`}
            type="button"
            onClick={() => setTab("events")}
          >
            Sự kiện
          </button>
          <button
            className={`btn outline ${tab === "posts" ? "active" : ""}`}
            type="button"
            onClick={() => setTab("posts")}
          >
            Bài đăng
          </button>
        </div>
        {tab === "events" ? <AdminEvents /> : <AdminPosts />}
      </div>
    </section>
  );
};
