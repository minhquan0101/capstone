import React from "react";

export const BlogsPage: React.FC = () => {
  const posts = [
    {
      id: 1,
      title: "Top 10 sự kiện không thể bỏ lỡ trong tháng này",
      period: "Tháng này",
      excerpt:
        "Từ nhạc sống, thể thao đến hội thảo chuyên ngành, đây là danh sách sự kiện nổi bật.",
    },
    {
      id: 2,
      title: "Lịch sự kiện nổi bật nửa đầu năm 2025",
      period: "Nửa đầu 2025",
      excerpt:
        "Cập nhật các festival, concert và giải đấu thể thao đã mở bán vé trên TicketFast.",
    },
    {
      id: 3,
      title: "Kinh nghiệm săn vé sớm cho các concert hot",
      period: "Blog",
      excerpt:
        "Một vài mẹo nhỏ giúp bạn không bỏ lỡ tấm vé tham dự những sự kiện lớn được mong đợi.",
    },
  ];

  return (
    <div className="home">
      <section className="event-section">
        <div className="section-header">
          <h2>blogs & news sự kiện</h2>
        </div>
        <div className="event-grid special-grid">
          {posts.map((p) => (
            <article key={p.id} className="event-card special-card">
              <div className="event-body">
                <h3>{p.title}</h3>
                <p className="event-meta">{p.period}</p>
                <p className="event-meta">{p.excerpt}</p>
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
};


