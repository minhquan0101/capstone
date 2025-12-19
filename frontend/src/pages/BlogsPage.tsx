import React, { useEffect, useState } from "react";
import { getPosts, Post } from "../utils/api";
import "../styles/App.css";

interface BlogsPageProps {
  onPostClick: (postId: string) => void;
}

export const BlogsPage: React.FC<BlogsPageProps> = ({ onPostClick }) => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        setLoading(true);
        const data = await getPosts();
        // Chỉ lấy các bài blog (type === "blog")
        const blogPosts = data.filter((post) => post.type === "blog");
        setPosts(blogPosts);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Không thể tải danh sách bài viết");
      } finally {
        setLoading(false);
      }
    };

    fetchPosts();
  }, []);

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

  const getExcerpt = (content: string, maxLength: number = 120) => {
    const text = content.replace(/<[^>]*>/g, ""); // Remove HTML tags
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + "...";
  };

  if (loading) {
    return (
      <div className="home">
        <section className="event-section">
          <div className="section-header">
            <h2>blogs & news sự kiện</h2>
          </div>
          <div style={{ textAlign: "center", padding: "40px" }}>Đang tải...</div>
        </section>
      </div>
    );
  }

  if (error) {
    return (
      <div className="home">
        <section className="event-section">
          <div className="section-header">
            <h2>blogs & news sự kiện</h2>
          </div>
          <div style={{ textAlign: "center", padding: "40px", color: "#b91c1c" }}>
            {error}
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="home">
      <section className="event-section">
        <div className="section-header">
          <h2>blogs & news sự kiện</h2>
        </div>
        <div className="event-grid special-grid blog-grid">
          {posts.length === 0 ? (
            <div style={{ gridColumn: "1 / -1", textAlign: "center", padding: "40px" }}>
              Chưa có bài viết nào
            </div>
          ) : (
            posts.map((post) => (
              <article
                key={post._id}
                className="event-card special-card blog-card"
                onClick={() => onPostClick(post._id)}
                style={{ cursor: "pointer" }}
              >
                {post.imageUrl && (
                  <div className="event-thumb blog-thumb" style={{ position: "relative" }}>
                    <img
                      src={getImageUrl(post.imageUrl)}
                      alt={post.title}
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                      }}
                    />
                    <div className="blog-date-badge">{formatDate(post.createdAt)}</div>
                  </div>
                )}
                <div className="event-body">
                  <h3>{post.title}</h3>
                  <p className="event-meta">{formatDate(post.createdAt)}</p>
                  <p className="event-meta">{getExcerpt(post.content)}</p>
                </div>
              </article>
            ))
          )}
        </div>
      </section>
    </div>
  );
};


