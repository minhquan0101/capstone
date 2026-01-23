import React, { useEffect, useMemo, useState } from "react";
import { API_BASE, getPosts, Post } from "../utils/api";
import "../styles/showbiz.css";

interface ShowbizPageProps {
  onPostClick: (postId: string) => void;
  searchTerm: string;
}

type SubTab = "all" | "vn" | "asia" | "us_eu";
type SideTab = "new" | "top";

const PAGE_SIZE = 24;

export const ShowbizPage: React.FC<ShowbizPageProps> = ({ onPostClick, searchTerm }) => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [skip, setSkip] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const [subTab, setSubTab] = useState<SubTab>("all");
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
    return decoded.replace(/&nbsp;/g, " ").replace(/\u00A0/g, " ").replace(/\s+/g, " ").trim();
  };

  const excerpt = (p: Post, maxLen: number) => {
    if (p.summary && p.summary.trim()) return p.summary.trim();
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

  const fetchPage = async (nextSkip: number, mode: "reset" | "append") => {
    const data = await getPosts({ type: "showbiz", sort: "new", limit: PAGE_SIZE, skip: nextSkip });
    const list = data || [];
    setHasMore(list.length === PAGE_SIZE);

    if (mode === "reset") setPosts(list);
    else setPosts((prev) => [...prev, ...list]);

    setSkip(nextSkip + PAGE_SIZE);
  };

  // load page 1
  useEffect(() => {
    const run = async () => {
      try {
        setLoading(true);
        setError(null);
        setVisibleCount(12);
        setHasMore(true);
        setSkip(0);
        await fetchPage(0, "reset");
      } catch (e) {
        setError(e instanceof Error ? e.message : "Không thể tải Showbiz");
      } finally {
        setLoading(false);
      }
    };
    run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // reset visible when search or tab changes
  useEffect(() => {
    setVisibleCount(12);
  }, [searchTerm, subTab]);

  const normalized = useMemo(() => {
    return (posts || []).map((p) => ({
      ...p,
      region: (p.region || "vn") as any,
      section: (p.section || "news") as any,
      views: typeof p.views === "number" ? p.views : 0,
    }));
  }, [posts]);

  const byRegion = useMemo(() => {
    if (subTab === "all") return normalized;
    return normalized.filter((p) => p.region === subTab);
  }, [normalized, subTab]);

  const bySearch = useMemo(() => {
    const q = (searchTerm || "").trim().toLowerCase();
    if (!q) return byRegion;

    return byRegion.filter((p) => {
      const title = (p.title || "").toLowerCase();
      const sum = (p.summary || "").toLowerCase();
      const content = stripHtml(p.content || "").toLowerCase();
      return title.includes(q) || sum.includes(q) || content.includes(q);
    });
  }, [byRegion, searchTerm]);

  const photoPosts = useMemo(() => bySearch.filter((p) => p.section === "photo").slice(0, 8), [bySearch]);
  const newsPosts = useMemo(() => bySearch.filter((p) => p.section !== "photo"), [bySearch]);

  const lead = newsPosts[0];
  const minis = newsPosts.slice(1, 4);
  const feed = newsPosts.slice(4);

  const sideNew = newsPosts.slice(0, 10);
  const sideTop = [...newsPosts].sort((a, b) => (b.views || 0) - (a.views || 0)).slice(0, 10);

  const canShowMoreLocal = feed.length > visibleCount;
  const showLoadMoreBtn = canShowMoreLocal || hasMore;

  const handleLoadMore = async () => {
    if (canShowMoreLocal) {
      setVisibleCount((n) => n + 12);
      return;
    }
    if (!hasMore || loadingMore) return;

    try {
      setLoadingMore(true);
      await fetchPage(skip, "append");
      setVisibleCount((n) => n + 12);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Không thể tải thêm bài");
    } finally {
      setLoadingMore(false);
    }
  };

  const regionText =
    subTab === "vn" ? "Việt Nam" : subTab === "asia" ? "Châu Á" : subTab === "us_eu" ? "Âu Mỹ" : "Tất cả";

  if (loading) {
    return (
      <div className="ns-page">
        <div className="ns-container">
          <div className="ns-topline">
            <h1 className="ns-title">Showbiz</h1>
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
            <h1 className="ns-title">Showbiz</h1>
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
          <h1 className="ns-title">Showbiz</h1>
        </div>

        <div className="ns-subnav">
          <button className={`ns-tab ${subTab === "all" ? "active" : ""}`} onClick={() => setSubTab("all")}>
            Tất cả
          </button>
          <button className={`ns-tab ${subTab === "vn" ? "active" : ""}`} onClick={() => setSubTab("vn")}>
            Việt Nam
          </button>
          <button className={`ns-tab ${subTab === "asia" ? "active" : ""}`} onClick={() => setSubTab("asia")}>
            Châu Á
          </button>
          <button className={`ns-tab ${subTab === "us_eu" ? "active" : ""}`} onClick={() => setSubTab("us_eu")}>
            Âu Mỹ
          </button>
        </div>

        {photoPosts.length > 0 && (
          <section className="ns-photoWrap">
            <div className="ns-photoHead">
              <h3 className="ns-photoTitle">Ảnh sao</h3>
            </div>

            <div className="ns-photoRow">
              {photoPosts.map((p) => (
                <div key={p._id} className="ns-photoCard" onClick={() => onPostClick(p._id)}>
                  <div className="ns-photoMedia">
                    {p.imageUrl ? <img src={img(p.imageUrl)} alt={p.title} /> : <div style={{ width: "100%", height: "100%" }} />}
                  </div>
                  <div className="ns-photoBody">
                    <div className="ns-meta">
                      <span>{fmtDM(p.createdAt)}</span>
                      <span className="ns-dot" />
                      <span>Ảnh sao</span>
                    </div>
                    <div className="ns-photoCardTitle">{p.title}</div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        <div className="ns-grid">
          <main>
            <section className="ns-hero">
              {lead ? (
                <div className="ns-card ns-lead" onClick={() => onPostClick(lead._id)}>
                  <div className="ns-media r16x10">
                    {lead.imageUrl ? <img src={img(lead.imageUrl)} alt={lead.title} /> : <div style={{ width: "100%", height: "100%" }} />}
                    <div className="ns-badge">Showbiz</div>
                  </div>
                  <div className="ns-body">
                    <div className="ns-meta">
                      <span>{fmtDM(lead.createdAt)}</span>
                      <span className="ns-dot" />
                      <span>{regionText}</span>
                    </div>
                    <h2 className="ns-lead-title ns-title-hover">{lead.title}</h2>
                    <p className="ns-excerpt">{excerpt(lead, 170)}</p>
                  </div>
                </div>
              ) : (
                <div className="ns-card" style={{ padding: 18, color: "#6b7280", fontWeight: 800 }}>
                  {(searchTerm || "").trim() ? "Không có kết quả phù hợp." : "Chưa có bài Showbiz ở mục này."}
                </div>
              )}

              <div className="ns-miniList">
                {minis.map((p) => (
                  <div key={p._id} className="ns-mini" onClick={() => onPostClick(p._id)}>
                    <div className="ns-mini-thumb">{p.imageUrl ? <img src={img(p.imageUrl)} alt={p.title} /> : <div />}</div>
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

            <section className="ns-feed">
              {feed.slice(0, visibleCount).map((p) => (
                <article key={p._id} className="ns-item" onClick={() => onPostClick(p._id)}>
                  <div className="ns-thumb">{p.imageUrl ? <img src={img(p.imageUrl)} alt={p.title} /> : <div />}</div>
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

              {showLoadMoreBtn && (
                <button className="ns-loadmore" onClick={handleLoadMore} disabled={loadingMore}>
                  {loadingMore ? "Đang tải…" : "Xem thêm"}
                </button>
              )}
            </section>
          </main>

          <aside className="ns-aside">
            <div className="ns-box">
              <div className="ns-box-head">
                <button className={`ns-box-tab ${sideTab === "new" ? "active" : ""}`} onClick={() => setSideTab("new")}>
                  Tin mới
                </button>
                <button className={`ns-box-tab ${sideTab === "top" ? "active" : ""}`} onClick={() => setSideTab("top")}>
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
