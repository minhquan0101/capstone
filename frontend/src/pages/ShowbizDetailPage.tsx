import React, { useEffect, useMemo, useState } from "react";
import DOMPurify from "dompurify";
import { API_BASE, getPost, getPosts, Post } from "../utils/api";
import "../styles/showbiz.css";

interface ShowbizDetailPageProps {
  postId: string;
  onBack: () => void;
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

  // ✅ click mở bài theo đúng route showbiz của bạn
  const openPostById = (id: string) => {
    if (onOpenPost) return onOpenPost(id);

    const next = `/showbiz/${id}`;
    window.history.pushState({}, "", next);
    window.dispatchEvent(new PopStateEvent("popstate"));
  };

  useEffect(() => {
    const run = async () => {
      try {
        setLoading(true);

        const p = await getPost(postId, true);
        setPost(p);

        const region = (p.region || "vn") as any;

        const [newList, viewList] = await Promise.all([
          getPosts({ type: "showbiz", sort: "new", limit: 80, region }),
          getPosts({ type: "showbiz", sort: "views", limit: 80, region }),
        ]);

        const newNoSelf = (newList || []).filter((x) => x._id !== postId);
        const viewNoSelf = (viewList || []).filter((x) => x._id !== postId);

        setLatest(newNoSelf.slice(0, 10));
        setMostViewed(viewNoSelf.slice(0, 10));

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

  const normalizeSrc = (s: string) =>
    (s || "")
      .trim()
      .replace(/^https?:\/\//, "")
      .replace(/\/+$/g, "");

  const removeDuplicateFirstImage = (rawHtml: string, heroUrl: string) => {
    if (!rawHtml || !heroUrl) return rawHtml;
    try {
      const doc = new DOMParser().parseFromString(rawHtml, "text/html");
      const firstImg = doc.body.querySelector("img");
      if (!firstImg) return rawHtml;

      const src = firstImg.getAttribute("src") || "";
      const a = normalizeSrc(src);
      const b = normalizeSrc(heroUrl);

      if (a && b && (a.includes(b) || b.includes(a))) {
        firstImg.remove();
        return doc.body.innerHTML;
      }
      return rawHtml;
    } catch {
      return rawHtml;
    }
  };

  const html = useMemo(() => {
    if (!post) return "";

    let raw = post.content || "";
    raw = raw.replace(/&nbsp;/g, " ").replace(/\u00A0/g, " ");
    raw = raw.replace(/[\u200B-\u200D\uFEFF\u00AD]/g, "");

    const looksLikeHtml = /<\/?[a-z][\s\S]*>/i.test(raw);
    if (!looksLikeHtml) raw = raw.replace(/\n/g, "<br/>");

    // Fix src="/uploads/.." hoặc src="/..."
    raw = raw.replace(/src="(\/[^"]+)"/g, `src="${backendBase}$1"`);

    // ✅ bỏ style inline gây “ô trắng/viền”
    const sanitized = DOMPurify.sanitize(raw, {
      FORBID_ATTR: ["style"],
    });

    const heroUrl = post.imageUrl ? getImageUrl(post.imageUrl) : "";
    return removeDuplicateFirstImage(sanitized, heroUrl);
  }, [post, backendBase]);

  if (loading) {
    return (
      <div className="ns-page">
        <div className="ns-container">
          <div style={{ padding: 28, color: "#6b7280", fontWeight: 800 }}>
            Đang tải…
          </div>
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
          <article className="ns-article">
            <h1>{post.title}</h1>

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
                      onClick={() => openPostById(p._id)}
                      style={{ cursor: "pointer" }}
                      title="Mở bài này"
                    >
                      <div className="ns-related-thumb">
                        {p.imageUrl ? (
                          <img src={getImageUrl(p.imageUrl)} alt={p.title} />
                        ) : (
                          <div />
                        )}
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
                    onClick={() => openPostById(p._id)}
                    style={{ cursor: "pointer" }}
                    title="Mở bài này"
                  >
                    <div className="ns-sideRank">{idx + 1}</div>
                    <div className="ns-sideText">
                      <div className="ns-sideMeta">
                        {fmtFull(p.createdAt)}
                        {sideTab === "views" && typeof p.views === "number"
                          ? ` • ${p.views} xem`
                          : ""}
                      </div>
                      <div className="ns-sideTitle">{p.title}</div>
                    </div>
                  </div>
                ))}

                {sideList.length === 0 && (
                  <div style={{ padding: 12, color: "#6b7280", fontWeight: 700 }}>
                    Chưa có dữ liệu
                  </div>
                )}
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
};
