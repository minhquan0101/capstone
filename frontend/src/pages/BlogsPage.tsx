import React, { useEffect, useMemo, useState } from "react";
import { API_BASE, getPosts, Post } from "../utils/api";
import "../styles/showbiz.css";

interface BlogsPageProps {
  onPostClick: (postId: string) => void;
}

type SideTab = "new" | "top";

export const BlogsPage: React.FC<BlogsPageProps> = ({ onPostClick }) => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [sideTab, setSideTab] = useState<SideTab>("new");
  const [visibleCount, setVisibleCount] = useState(12);

  const backendBase = useMemo(() => API_BASE.replace(/\/api\/?$/, ""), []);
  const img = (u?: string) => (!u ? "" : u.startsWith("http") ? u : `${backendBase}${u}`);

  const decodeHtml = (s: string) => {
    const txt = document.createElement("textarea");
    txt.innerHTML = s;
    return txt.value;
  };

  const stripHtml = (html: string) => {
    const noTags = (html || "").replace(/<[^>]*>/g, " ");
    const decoded = decodeHtml(noTags);
    return decoded.replace(/\u00A0/g, " ").replace(/\s+/g, " ").trim();
  };

  const excerpt = (p: Post, maxLen: number) => {
    if ((p.summary || "").trim()) return (p.summary || "").trim();
    const t = stripHtml(p.content || "");
    return t.length <= maxLen ? t : t.slice(0, maxLen).trim() + "…";
  };

  const fmtDM = (iso: string) => {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return "";
    const dd = String(d.getDate()).padStart(2, "0");
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    return `${dd}/${mm}`;
  };

  useEffect(() => {
    const run = async () => {
      try {
        setLoading(true);
        const data = await getPosts({ type: "blog", sort: "new", limit: 200 });
        setPosts(data || []);
        setError(null);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Không thể tải Blogs / News");
      } finally {
        setLoading(false);
      }
    };
    run();
  }, []);

  const normalized = useMemo(() => {
    return (posts || []).map((p) => ({
      ...p,
      views: typeof p.views === "number" ? p.views : 0,
    }));
  }, [posts]);

  const lead = normalized[0];
  const minis = normalized.slice(1, 4);
  const feed = normalized.slice(4);

  const sideNew = normalized.slice(0, 10);
  const sideTop = [...normalized].sort((a, b) => (b.views || 0) - (a.views || 0)).slice(0, 10);

  if (loading) {
    return (
      <div className="ns-page">
        <div className="ns-container">
          <div className="ns-topline">
            <h1 className="ns-title">Blogs / News</h1>
          </div>
          <div style={{ padding: 28, color: "#6b7280", fontWeight: 800 }}>Đang tải…</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="ns-page">
        <div className="ns-container">
          <div className="ns-topline">
            <h1 className="ns-title">Blogs / News</h1>
          </div>
          <div style={{ padding: 28, color: "#b91c1c", fontWeight: 900 }}>{error}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="ns-page">
      <div className="ns-container">
        <div className="ns-topline">
          <h1 className="ns-title">Blogs / News</h1>
        </div>

        <div className="ns-grid">
          <main>
            {/* HERO: big + 3 minis */}
            <section className="ns-hero">
              {lead ? (
                <div className="ns-card ns-lead" onClick={() => onPostClick(lead._id)}>
                  <div className="ns-media r16x10">
                    {lead.imageUrl ? (
                      <img src={img(lead.imageUrl)} alt={lead.title} />
                    ) : (
                      <div style={{ width: "100%", height: "100%" }} />
                    )}
                    <div className="ns-badge">News</div>
                  </div>

                  <div className="ns-body">
                    <div className="ns-meta">
                      <span>{fmtDM(lead.createdAt)}</span>
                      <span className="ns-dot" />
                      <span>{(lead.views || 0).toLocaleString()} lượt xem</span>
                    </div>

                    <h2 className="ns-lead-title ns-title-hover">{lead.title}</h2>
                    <p className="ns-excerpt">{excerpt(lead, 170)}</p>
                  </div>
                </div>
              ) : (
                <div className="ns-card" style={{ padding: 18, color: "#6b7280", fontWeight: 800 }}>
                  Chưa có bài Blog/News.
                </div>
              )}

              <div className="ns-miniList">
                {minis.map((p) => (
                  <div key={p._id} className="ns-mini" onClick={() => onPostClick(p._id)}>
                    <div className="ns-mini-thumb">
                      {p.imageUrl ? <img src={img(p.imageUrl)} alt={p.title} /> : <div />}
                    </div>
                    <div>
                      <div className="ns-meta">
                        <span>{fmtDM(p.createdAt)}</span>
                        <span className="ns-dot" />
                        <span>{(p.views || 0).toLocaleString()} lượt xem</span>
                      </div>
                      <h3 className="ns-mini-title">{p.title}</h3>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* FEED */}
            <section className="ns-feed">
              {feed.slice(0, visibleCount).map((p) => (
                <article key={p._id} className="ns-item" onClick={() => onPostClick(p._id)}>
                  <div className="ns-thumb">
                    {p.imageUrl ? <img src={img(p.imageUrl)} alt={p.title} /> : <div />}
                  </div>
                  <div>
                    <div className="ns-meta">
                      <span>{fmtDM(p.createdAt)}</span>
                      <span className="ns-dot" />
                      <span>{(p.views || 0).toLocaleString()} lượt xem</span>
                    </div>
                    <h3 className="ns-item-title ns-title-hover">{p.title}</h3>
                    <p className="ns-item-excerpt">{excerpt(p, 160)}</p>
                  </div>
                </article>
              ))}

              {feed.length > visibleCount && (
                <button className="ns-loadmore" onClick={() => setVisibleCount((n) => n + 12)}>
                  Xem thêm
                </button>
              )}
            </section>
          </main>

          {/* SIDEBAR */}
          <aside className="ns-aside">
            <div className="ns-box">
              <div className="ns-box-head">
                <button
                  className={`ns-box-tab ${sideTab === "new" ? "active" : ""}`}
                  onClick={() => setSideTab("new")}
                >
                  Tin mới
                </button>
                <button
                  className={`ns-box-tab ${sideTab === "top" ? "active" : ""}`}
                  onClick={() => setSideTab("top")}
                >
                  Đọc nhiều
                </button>
              </div>

              <div className="ns-box-body">
                {(sideTab === "new" ? sideNew : sideTop).map((p, idx) => (
                  <div key={p._id} className="ns-rank" onClick={() => onPostClick(p._id)}>
                    <div className="ns-rank-num">{idx + 1}</div>
                    <p className="ns-rank-title">{p.title}</p>
                  </div>
                ))}
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
};
