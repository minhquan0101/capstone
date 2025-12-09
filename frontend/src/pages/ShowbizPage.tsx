import React from "react";

export const ShowbizPage: React.FC = () => {
  const articles = [
    {
      id: 1,
      title: "Sao hạng A phủ sóng các lễ trao giải cuối năm",
      summary:
        "Hàng loạt nghệ sĩ nổi tiếng xác nhận tham gia chuỗi sự kiện giải trí lớn nhất năm.",
      tag: "ShowBiz",
    },
    {
      id: 2,
      title: "Liveshow kỷ niệm 20 năm sự nghiệp của ca sĩ X",
      summary:
        "Đêm nhạc hứa hẹn mang đến những bản hit gắn liền với tuổi thơ của khán giả.",
      tag: "Music",
    },
    {
      id: 3,
      title: "Thảm đỏ rực lửa với những bộ cánh ấn tượng",
      summary:
        "Dàn sao khoe phong cách thời trang độc đáo, tạo nên bữa tiệc thị giác mãn nhãn.",
      tag: "Red Carpet",
    },
  ];

  return (
    <div className="home">
      <section className="event-section">
        <div className="section-header">
          <h2>tin tức showbiz</h2>
        </div>
        <div className="event-grid special-grid">
          {articles.map((a) => (
            <article key={a.id} className="event-card special-card">
              <div className="event-body">
                <h3>{a.title}</h3>
                <p className="event-meta">{a.tag}</p>
                <p className="event-meta">{a.summary}</p>
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
};


