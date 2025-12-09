import React from "react";
import { UserInfo, View } from "../utils/types";

interface HomeProps {
  user: UserInfo | null;
  setView: (v: View) => void;
}

export const Home: React.FC<HomeProps> = ({ user, setView }) => {
  const specialEvents = [
    {
      id: 1,
      title: "Concert Live 2025 - Hà Nội",
      location: "Trung tâm Hội nghị Quốc gia",
      date: "12/01/2025",
      thumbnail:
        "https://images.pexels.com/photos/1190298/pexels-photo-1190298.jpeg?auto=compress&cs=tinysrgb&w=1200",
      tag: "Music",
    },
    {
      id: 2,
      title: "Tech Summit Vietnam",
      location: "SECC - TP. Hồ Chí Minh",
      date: "25/02/2025",
      thumbnail:
        "https://images.pexels.com/photos/1181396/pexels-photo-1181396.jpeg?auto=compress&cs=tinysrgb&w=1200",
      tag: "Conference",
    },
    {
      id: 3,
      title: "Stand-up Comedy Night",
      location: "Nhà hát Thành phố",
      date: "08/03/2025",
      thumbnail:
        "https://images.pexels.com/photos/799091/pexels-photo-799091.jpeg?auto=compress&cs=tinysrgb&w=1200",
      tag: "Comedy",
    },
    {
      id: 4,
      title: "Jazz Festival 2025",
      location: "Công viên Lê Văn Tám",
      date: "15/03/2025",
      thumbnail:
        "https://images.pexels.com/photos/1763075/pexels-photo-1763075.jpeg?auto=compress&cs=tinysrgb&w=1200",
      tag: "Music",
    },
  ];

  const trendingEvents = [
    {
      id: 5,
      title: "Rock Concert",
      location: "Sân vận động Mỹ Đình",
      date: "20/01/2025",
      thumbnail:
        "https://images.pexels.com/photos/1763075/pexels-photo-1763075.jpeg?auto=compress&cs=tinysrgb&w=1200",
      tag: "Music",
    },
    {
      id: 6,
      title: "Bóng đá V-League",
      location: "Sân vận động Hàng Đẫy",
      date: "28/01/2025",
      thumbnail:
        "https://images.pexels.com/photos/46798/the-ball-stadion-football-the-pitch-46798.jpeg?auto=compress&cs=tinysrgb&w=1200",
      tag: "Sports",
    },
    {
      id: 7,
      title: "Kịch: Romeo và Juliet",
      location: "Nhà hát Lớn",
      date: "05/02/2025",
      thumbnail:
        "https://images.pexels.com/photos/1763075/pexels-photo-1763075.jpeg?auto=compress&cs=tinysrgb&w=1200",
      tag: "Theater",
    },
    {
      id: 8,
      title: "Workshop Marketing",
      location: "Trung tâm Hội nghị",
      date: "10/02/2025",
      thumbnail:
        "https://images.pexels.com/photos/1181396/pexels-photo-1181396.jpeg?auto=compress&cs=tinysrgb&w=1200",
      tag: "Workshop",
    },
    {
      id: 9,
      title: "EDM Festival",
      location: "Công viên Thống Nhất",
      date: "18/02/2025",
      thumbnail:
        "https://images.pexels.com/photos/1190298/pexels-photo-1190298.jpeg?auto=compress&cs=tinysrgb&w=1200",
      tag: "Music",
    },
    {
      id: 10,
      title: "Bóng rổ CBA",
      location: "Nhà thi đấu Quân khu 7",
      date: "22/02/2025",
      thumbnail:
        "https://images.pexels.com/photos/46798/the-ball-stadion-football-the-pitch-46798.jpeg?auto=compress&cs=tinysrgb&w=1200",
      tag: "Sports",
    },
    {
      id: 11,
      title: "Opera: La Traviata",
      location: "Nhà hát Opera",
      date: "01/03/2025",
      thumbnail:
        "https://images.pexels.com/photos/1763075/pexels-photo-1763075.jpeg?auto=compress&cs=tinysrgb&w=1200",
      tag: "Theater",
    },
    {
      id: 12,
      title: "Startup Pitch Night",
      location: "Coworking Space",
      date: "08/03/2025",
      thumbnail:
        "https://images.pexels.com/photos/1181396/pexels-photo-1181396.jpeg?auto=compress&cs=tinysrgb&w=1200",
      tag: "Workshop",
    },
    {
      id: 13,
      title: "Acoustic Night",
      location: "Quán cà phê Acoustic",
      date: "15/03/2025",
      thumbnail:
        "https://images.pexels.com/photos/1190298/pexels-photo-1190298.jpeg?auto=compress&cs=tinysrgb&w=1200",
      tag: "Music",
    },
    {
      id: 14,
      title: "Marathon Hà Nội",
      location: "Hồ Hoàn Kiếm",
      date: "20/03/2025",
      thumbnail:
        "https://images.pexels.com/photos/46798/the-ball-stadion-football-the-pitch-46798.jpeg?auto=compress&cs=tinysrgb&w=1200",
      tag: "Sports",
    },
  ];

  return (
    <div className="home">
      <div className="hero-banner" />

      <section className="event-section special-events">
        <div className="section-header">
          <h2>sự kiện đặc biệt</h2>
        </div>
        <div className="event-grid special-grid">
          {specialEvents.map((event) => (
            <article key={event.id} className="event-card special-card">
              <div
                className="event-thumb"
                style={{ backgroundImage: `url(${event.thumbnail})` }}
              >
                <span className="event-tag">{event.tag}</span>
              </div>
              <div className="event-body">
                <h3>{event.title}</h3>
                <p className="event-meta">{event.location}</p>
                <p className="event-meta">{event.date}</p>
                <button
                  className="btn small full-width"
                  onClick={() => setView("booking")}
                >
                  Đặt vé ngay
                </button>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="event-section trending-events">
        <div className="section-header">
          <h2>sự kiện xu hướng</h2>
        </div>
        <div className="event-grid trending-grid">
          {trendingEvents.slice(0, 10).map((event, index) => (
            <article key={event.id} className="event-card trending-card">
              <span className="event-number">{index + 1}</span>
              <div
                className="event-thumb trending-thumb"
                style={{ backgroundImage: `url(${event.thumbnail})` }}
              >
                <span className="event-tag">{event.tag}</span>
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
};


