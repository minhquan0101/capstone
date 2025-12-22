import React, { useEffect, useState } from "react";
import { getPost, Post } from "../utils/api";
import "../styles/App.css";

interface ShowbizDetailPageProps {
  postId: string;
  onBack: () => void;
}

export const ShowbizDetailPage: React.FC<ShowbizDetailPageProps> = ({ postId, onBack }) => {
  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPost = async () => {
      try {
        setLoading(true);
        const data = await getPost(postId);
        setPost(data);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Không thể tải bài viết");
      } finally {
        setLoading(false);
      }
    };

    if (postId) {
      fetchPost();
    }
  }, [postId]);

  if (loading) {
    return (
      <div className="home">
        <div style={{ textAlign: "center", padding: "40px" }}>Đang tải...</div>
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="home">
        <div style={{ textAlign: "center", padding: "40px", color: "#b91c1c" }}>
          {error || "Không tìm thấy bài viết"}
        </div>
        <button onClick={onBack} className="btn primary" style={{ marginTop: "20px" }}>
          Quay lại
        </button>
      </div>
    );
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const day = date.getDate();
    const month = date.getMonth() + 1;
    const months = [
      "Th1",
      "Th2",
      "Th3",
      "Th4",
      "Th5",
      "Th6",
      "Th7",
      "Th8",
      "Th9",
      "Th10",
      "Th11",
      "Th12",
    ];
    return `${day} ${months[month - 1]}`;
  };

  const getImageUrl = (imageUrl?: string) => {
    if (!imageUrl) return "";
    if (imageUrl.startsWith("http")) return imageUrl;
    return `http://localhost:3000${imageUrl}`;
  };

  return (
    <div className="home">
      <button
        onClick={onBack}
        className="btn outline"
        style={{ marginBottom: "24px", cursor: "pointer" }}
      >
        ← Quay lại
      </button>

      <article className="blog-detail">
        {post.imageUrl && (
          <div className="blog-detail-image">
            <img src={getImageUrl(post.imageUrl)} alt={post.title} />
            <div className="blog-date-badge">{formatDate(post.createdAt)}</div>
          </div>
        )}

        <div className="blog-detail-content">
          <h1 className="blog-detail-title">{post.title}</h1>
          <div className="blog-detail-meta">
            <span>{formatDate(post.createdAt)}</span>
            <span>•</span>
            <span>Showbiz</span>
          </div>
          <div
            className="blog-detail-body"
            dangerouslySetInnerHTML={{ __html: post.content.replace(/\n/g, "<br />") }}
          />
        </div>
      </article>
    </div>
  );
};

