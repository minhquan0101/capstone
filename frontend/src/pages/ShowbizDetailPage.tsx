import React, { useEffect, useMemo, useState } from "react";
import DOMPurify from "dompurify";
import { API_BASE, getPost, getPosts, Post } from "../utils/api";
import "../styles/showbiz.css";

interface ShowbizDetailPageProps {
  postId: string;
  onBack: () => void;

  // Optional: click “Tin liên quan” mở bài khác ngay
  onOpenPost?: (id: string) => void;
}

type SideTab = "new" | "views";

export const ShowbizDetailPage: React.FC<ShowbizDetailPageProps> = ({
  postId,
  onBack,
  onOpenPost,
}) => {
  const [post, setPost] = useState<Post | null>(null);
  const [related, setRelated] = useState<Post[]>([]);
  const [latest, setLatest] = useState<Post[]>([]);
  const [mostViewed, setMostViewed] = useState<Post[]>([]);
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

        // ✅ tăng views khi mở bài (incView = true)
        const p = await getPost(postId, true);
        setPost(p);

        const region = (p.region || "vn") as any;

        // ✅ lấy list cho sidebar + related
        const [newList, viewList] = await Promise.all([
          getPosts({ type: "showbiz", sort: "new", limit: 80, region }),
          getPosts({ type: "showbiz", sort: "views", limit: 80, region }),
        ]);

        const newNoSelf = (newList || []).filter((x) => x._id !== postId);
        const viewNoSelf = (viewList || []).filter((x) => x._id !== postId);

        // Sidebar
        setLatest(newNoSelf.slice(0, 10));
        setMostViewed(viewNoSelf.slice(0, 10));

        // Related: ưu tiên cùng region, lấy 6 bài mới nhất
        const rel = newNoSelf
          .slice()
          .sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt))
          .slice(0, 6);

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

  // ✅ render HTML từ editor + fix ảnh inline + sanitize
  const html = useMemo(() => {
    if (!post) return "";

    let raw = post.content || "";
    // ✅ convert NBSP to normal space (fix wrap inside Vietnamese words)
    raw = raw.replace(/&nbsp;/g, " ").replace(/\u00A0/g, " ");
    raw = raw.replace(/[\u200B-\u200D\uFEFF\u00AD]/g, "");


    // Nếu bài cũ là text thuần => xuống dòng
    const looksLikeHtml = /<\/?[a-z][\s\S]*>/i.test(raw);
    if (!looksLikeHtml) raw = raw.replace(/\n/g, "<br/>");

    // Fix ảnh chèn trong nội dung: src="/uploads/..." -> prefix backend
    raw = raw.replace(/src="(\/[^"]+)"/g, `src="${backendBase}$1"`);

    return DOMPurify.sanitize(raw);
  }, [post, backendBase]);

  const canOpen = !!onOpenPost;
  const handleOpen = (id: string) => {
    if (onOpenPost) onOpenPost(id);
  };

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
          <button className="ns-back" onClick={onBack}>
            ← Quay lại
          </button>
          <div style={{ padding: 20, color: "#b91c1c", fontWeight: 900 }}>
            {error || "Không tìm thấy bài viết"}
          </div>
        </div>
      </div>
    );
  }

  const sideList = sideTab === "new" ? latest : mostViewed;

  return (
    <div className="ns-page">
      <div className="ns-container">
        <button className="ns-back" onClick={onBack}>
          ← Quay lại
        </button>

        <div className="ns-detailGrid">
          {/* ===== MAIN ARTICLE ===== */}
          <article className="ns-article">
            <h1>{post.title}</h1>

            {/* Sapo (summary) nếu có */}
            {(post.summary || "").trim() && <div className="ns-sapo">{post.summary}</div>}

            <div className="ns-meta">
              <span>{fmtFull(post.createdAt)}</span>
              <span className="ns-dot" />
              <span>Showbiz</span>
              {typeof post.views === "number" && (
                <>
                  <span className="ns-dot" />
                  <span>{post.views.toLocaleString()} lượt xem</span>
                </>
              )}
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
                      onClick={() => handleOpen(p._id)}
                      style={{ opacity: canOpen ? 1 : 0.75, cursor: canOpen ? "pointer" : "default" }}
                      title={canOpen ? "Mở bài này" : "Cần truyền onOpenPost từ App.tsx để mở"}
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

          {/* ===== SIDEBAR ===== */}
          <aside className="ns-detailSide">
            <div className="ns-sideCard">
              <div className="ns-sideTabs">
                <button
                  type="button"
                  className={`ns-sideTab ${sideTab === "new" ? "active" : ""}`}
                  onClick={() => setSideTab("new")}
                >
                  Tin mới
                </button>
                <button
                  type="button"
                  className={`ns-sideTab ${sideTab === "views" ? "active" : ""}`}
                  onClick={() => setSideTab("views")}
                >
                  Đọc nhiều
                </button>
              </div>

              <div className="ns-sideList">
                {sideList.map((p, idx) => (
                  <div
                    key={p._id}
                    className="ns-sideItem"
                    onClick={() => handleOpen(p._id)}
                    style={{ cursor: canOpen ? "pointer" : "default", opacity: canOpen ? 1 : 0.75 }}
                    title={canOpen ? "Mở bài này" : "Cần truyền onOpenPost từ App.tsx để mở"}
                  >
                    <div className="ns-sideRank">{idx + 1}</div>
                    <div className="ns-sideText">
                      <div className="ns-sideMeta">
                        {fmtFull(p.createdAt)}
                        {sideTab === "views" && typeof p.views === "number" ? ` • ${p.views} xem` : ""}
                      </div>
                      <div className="ns-sideTitle">{p.title}</div>
                    </div>
                  </div>
                ))}

                {sideList.length === 0 && (
                  <div style={{ padding: 12, color: "#6b7280", fontWeight: 700 }}>Chưa có dữ liệu</div>
                )}
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
};
