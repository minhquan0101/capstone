import React, { useState } from "react";
import { AdminEvents } from "./AdminEvents";
import { AdminPosts } from "./AdminPosts";
import { AdminBanner } from "./AdminBanner";

export const AdminPage: React.FC = () => {
  const [tab, setTab] = useState<"events" | "posts" | "banner">("events");

  return (
    <section className="auth-section">
      <div className="auth-card" style={{ maxWidth: 900, width: "100%" }}>
        <h1>Khu vực quản trị</h1>
        <p className="subtitle">Quản lý sự kiện, bài đăng và banner.</p>
        <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
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
          <button
            className={`btn outline ${tab === "banner" ? "active" : ""}`}
            type="button"
            onClick={() => setTab("banner")}
          >
            Banner
          </button>
        </div>
        {tab === "events" && <AdminEvents />}
        {tab === "posts" && <AdminPosts />}
        {tab === "banner" && <AdminBanner />}
      </div>
    </section>
  );
};
