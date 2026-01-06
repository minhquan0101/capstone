import React, { useEffect, useMemo, useState } from "react";
import { API_BASE, getPost, getPosts, Post } from "../utils/api";
import "../styles/showbiz.css";

interface BlogDetailPageProps {
  postId: string;
  onBack: () => void;
  onOpenPost?: (id: string) => void;
}

type SideTab = "new" | "top";

export const BlogDetailPage: React.FC<BlogDetailPageProps> = ({ postId, onBack, onOpenPost }) => {
  const [post, setPost] = useState<Post | null>(null);
  const [list, setList] = useState<Post[]>([]);
  const [related, setRelated] = useState<Post[]>([]);
  const [sideTab, setSideTab] = useState<SideTab>("new");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const backendBase = useMemo(() => API_BASE.replace(/\/api\/?$/, ""), []);

  const getImageUrl = (imageUrl?: string) => {
    if (!imageUrl) return "";
    if (imageUrl.startsWith("http")) return imageUrl;
    return `${backendBase}${imageUrl}`;
  };

  const fmtFull = (iso: string) => {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return "";
    return d.toLocaleString("vi-VN", {
      hour: "2-digit",
      minute: "2-digit",
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  useEffect(() => {
    const run = async () => {
      try {
        setLoading(true);

        // tăng view khi mở detail
        const p = await getPost(postId, true);

        const all = await getPosts({ type: "blog", sort: "new", limit: 200 });

        setPost(p);
        setList(all || []);

        const rel = (all || [])
          .filter((x) => x._id !== postId)
          .sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt))
          .slice(0, 8);

        setRelated(rel);
        setError(null);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Không thể tải bài viết");
      } finally {
        setLoading(false);
      }
    };

    run();
  }, [postId]);

  // ✅ fix ảnh trong content nếu src là "/uploads/..."
  const html = useMemo(() => {
    if (!post) return "";
    const raw = post.content || "";

    const isHtmlLike = /<\/?[a-z][\s\S]*>/i.test(raw);
    const base = raw;

    const normalized = isHtmlLike ? base : base.replace(/\n/g, "<br/>");

    return normalized.replace(
      /src=(["'])(\/uploads\/[^"']+)\1/g,
      (_m, q, path) => `src=${q}${backendBase}${path}${q}`
    );
  }, [post, backendBase]);

  const normalizedList = useMemo(() => {
    return (list || []).map((p) => ({ ...p, views: typeof p.views === "number" ? p.views : 0 }));
  }, [list]);

  const sideNew = normalizedList.slice(0, 10);
  const sideTop = [...normalizedList].sort((a, b) => (b.views || 0) - (a.views || 0)).slice(0, 10);

  if (loading) {
    return (
      <div className="ns-page">
        <div className="ns-container">
          <div style={{ padding: 28, color: "#6b7280", fontWeight: 800 }}>Đang tải…</div>
        </div>
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="ns-page">
        <div className="ns-container">
          <button className="ns-back" onClick={onBack}>← Quay lại</button>
          <div style={{ padding: 20, color: "#b91c1c", fontWeight: 900 }}>
            {error || "Không tìm thấy bài viết"}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="ns-page">
      <div className="ns-container">
        <button className="ns-back" onClick={onBack}>← Quay lại</button>

        <div className="ns-detailGrid">
          <article className="ns-article">
            <h1>{post.title}</h1>

            <div className="ns-meta">
              <span>{fmtFull(post.createdAt)}</span>
              <span className="ns-dot" />
              <span>Blogs / News</span>
              <span className="ns-dot" />
              <span>{(post.views || 0).toLocaleString()} lượt xem</span>
            </div>

            {post.imageUrl && (
              <div className="ns-heroImg">
                <img src={getImageUrl(post.imageUrl)} alt={post.title} />
              </div>
            )}

            <div className="ns-content" dangerouslySetInnerHTML={{ __html: html }} />

            {related.length > 0 && (
              <section className="ns-related">
                <h3>Tin liên quan</h3>
                <div className="ns-related-list">
                  {related.map((p) => (
                    <div
                      key={p._id}
                      className="ns-related-item"
                      onClick={() => (onOpenPost ? onOpenPost(p._id) : undefined)}
                      style={{ opacity: onOpenPost ? 1 : 0.75 }}
                      title={onOpenPost ? "Mở bài này" : "Cần truyền onOpenPost để mở"}
                    >
                      <div className="ns-related-thumb">
                        {p.imageUrl ? <img src={getImageUrl(p.imageUrl)} alt={p.title} /> : <div />}
                      </div>
                      <div>
                        <div className="ns-meta">
                          <span>{fmtFull(p.createdAt)}</span>
                        </div>
                        <p className="ns-related-title">{p.title}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </article>

          {/* SIDEBAR */}
          <aside className="ns-aside ns-aside-sticky">
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
                  <div
                    key={p._id}
                    className="ns-rank"
                    onClick={() => (onOpenPost ? onOpenPost(p._id) : undefined)}
                    style={{ opacity: onOpenPost ? 1 : 0.75 }}
                  >
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
