import React, { useEffect, useMemo, useState } from "react";
import { UserInfo, View } from "../utils/types";
import { API_BASE } from "../utils/api";

interface ApiEvent {
  _id: string;
  title: string;
  location?: string;
  date?: string;
  price?: number;
  imageUrl?: string;

  // nếu backend có trả kèm ticketTypes/ticketsTotal thì không sao, không bắt buộc dùng ở Home
  ticketsTotal?: number;
  ticketsSold?: number;
  ticketsHeld?: number;
  ticketTypes?: any[];
}

interface HomeProps {
  user: UserInfo | null;
  setView: (v: View) => void;
}

export const Home: React.FC<HomeProps> = ({ user, setView }) => {
  const [events, setEvents] = useState<ApiEvent[]>([]);
  const [error, setError] = useState<string | null>(null);

  const backendBase = API_BASE.replace(/\/api\/?$/, "");

  const loadEvents = async () => {
    const res = await fetch(`${API_BASE}/events`);
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Không tải được danh sách sự kiện");
    setEvents(data.events || []);
  };

  useEffect(() => {
    loadEvents().catch((e: any) => setError(e.message || "Có lỗi xảy ra"));
  }, []);

  const specialEvents = useMemo(() => events.slice(0, 4), [events]);
  const trendingEvents = useMemo(() => events.slice(4, 14), [events]);

  const getThumb = (ev: ApiEvent) => {
    if (!ev.imageUrl) return "";
    return ev.imageUrl.startsWith("http") ? ev.imageUrl : `${backendBase}${ev.imageUrl}`;
  };

  const getTag = (ev: ApiEvent) => {
    // bạn có thể đổi tag theo category sau, tạm để "Event"
    if (Array.isArray(ev.ticketTypes) && ev.ticketTypes.length > 0) return "Ticket";
    return "Event";
  };

  const handleGoBooking = (eventId: string) => {
    // ✅ lưu eventId để BookingPage tự chọn đúng event
    localStorage.setItem("selectedEventId", eventId);
    setView("booking");
  };

  return (
    <div className="home">
      <div className="hero-banner" />

      <section className="event-section special-events">
        <div className="section-header">
          <h2>sự kiện đặc biệt</h2>
        </div>

        {error && <div className="global-message error">{error}</div>}

        <div className="event-grid special-grid">
          {specialEvents.map((ev) => (
            <article key={ev._id} className="event-card special-card">
              <div
                className="event-thumb"
                style={{
                  backgroundImage: getThumb(ev) ? `url(${getThumb(ev)})` : undefined,
                  backgroundColor: getThumb(ev) ? undefined : "#e5e7eb",
                }}
              >
                <span className="event-tag">{getTag(ev)}</span>
              </div>

              <div className="event-body">
                <h3>{ev.title}</h3>
                <p className="event-meta">{ev.location || "-"}</p>
                <p className="event-meta">
                  {ev.date ? new Date(ev.date).toLocaleString("vi-VN") : "-"}
                </p>

                <button
                  className="btn small full-width"
                  type="button"
                  onClick={() => handleGoBooking(ev._id)}
                >
                  Đặt vé ngay
                </button>
              </div>
            </article>
          ))}

          {specialEvents.length === 0 && (
            <p className="subtitle">Chưa có sự kiện nào.</p>
          )}
        </div>
      </section>

      <section className="event-section trending-events">
        <div className="section-header">
          <h2>sự kiện xu hướng</h2>
        </div>

        <div className="event-grid trending-grid">
          {trendingEvents.slice(0, 10).map((ev, index) => (
            <article key={ev._id} className="event-card trending-card">
              <span className="event-number">{index + 1}</span>

              <div
                className="event-thumb trending-thumb"
                style={{
                  backgroundImage: getThumb(ev) ? `url(${getThumb(ev)})` : undefined,
                  backgroundColor: getThumb(ev) ? undefined : "#e5e7eb",
                }}
                title={ev.title}
              >
                <span className="event-tag">{getTag(ev)}</span>
              </div>
            </article>
          ))}

          {trendingEvents.length === 0 && (
            <p className="subtitle">Chưa có sự kiện xu hướng.</p>
          )}
        </div>
      </section>
    </div>
  );
};
