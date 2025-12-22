import React, { useEffect, useState, useMemo } from "react";
import { UserInfo, View } from "../utils/types";
import { API_BASE, getBanner, getEvents, Event } from "../utils/api";
import { SearchModal } from "./SearchModal";

interface HomeProps {
  user: UserInfo | null;
  setView: (v: View) => void;
  searchModalOpen?: boolean;
  onSearchModalClose?: () => void;
}

export const Home: React.FC<HomeProps> = ({
  user,
  setView,
  searchModalOpen = false,
  onSearchModalClose,
}) => {
  const [banner, setBanner] = useState<string | null>(null);
  const [allEvents, setAllEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Search states
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Event[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const backendBase = API_BASE.replace(/\/api\/?$/, "");

  // Load Data
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Load banner & events in parallel
        const [bannerData, eventsData] = await Promise.all([
          getBanner(),
          getEvents()
        ]);

        if (bannerData) {
          const bannerUrl = bannerData.imageUrl.startsWith("http")
            ? bannerData.imageUrl
            : `${backendBase}${bannerData.imageUrl}`;
          setBanner(bannerUrl);
        }

        setAllEvents(eventsData || []);
      } catch (err: any) {
        console.error("Error loading home data:", err);
        setError("Không thể tải dữ liệu trang chủ");
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [backendBase]);

  // Derived State for Sections
  const specialEvents = useMemo(() => allEvents.filter(e => e.isFeatured).slice(0, 4), [allEvents]);
  const trendingEvents = useMemo(() => allEvents.slice(0, 10), [allEvents]);

  // Search Logic
  useEffect(() => {
    if (searchQuery.trim()) {
      setIsSearching(true);
      const queryLower = searchQuery.toLowerCase();
      const filtered = allEvents.filter((event) => 
        event.title.toLowerCase().includes(queryLower) ||
        event.location?.toLowerCase().includes(queryLower) ||
        event.description?.toLowerCase().includes(queryLower)
      );
      setSearchResults(filtered);
    } else {
      setIsSearching(false);
      setSearchResults([]);
    }
  }, [searchQuery, allEvents]);

  // Helpers
  const handleGoBooking = (eventId: string) => {
    localStorage.setItem("selectedEventId", eventId);
    setView("booking");
  };

  const getImageUrl = (url?: string) => {
    if (!url) return "https://via.placeholder.com/300x200?text=No+Image";
    return url.startsWith("http") ? url : `${backendBase}${url}`;
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return "";
    return new Date(dateString).toLocaleDateString("vi-VN");
  };

  if (loading) return <div className="loading-state"><p>Đang tải...</p></div>;

  return (
    <div className="home">
      <div
        className="hero-banner"
        style={banner ? { backgroundImage: `url(${banner})`, backgroundSize: "cover" } : {}}
      />

      <SearchModal
        isOpen={searchModalOpen}
        onClose={() => onSearchModalClose?.()}
        allEvents={allEvents}
        onSearch={setSearchQuery}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
      />

      {error && <div className="global-message error">{error}</div>}

      <div className="content-wrapper">
        {isSearching ? (
          /* Search Results Section */
          <section className="event-section search-results">
            <h2>Kết quả tìm kiếm ({searchResults.length})</h2>
            <div className="event-grid special-grid">
              {searchResults.map(ev => (
                <EventCard key={ev._id} event={ev} getImageUrl={getImageUrl} formatDate={formatDate} onBooking={handleGoBooking} />
              ))}
            </div>
          </section>
        ) : (
          <>
            {/* Featured Events */}
            <section className="event-section special-events">
              <div className="section-header"><h2>Sự kiện đặc biệt</h2></div>
              <div className="event-grid special-grid">
                {specialEvents.map(ev => (
                  <EventCard key={ev._id} event={ev} getImageUrl={getImageUrl} formatDate={formatDate} onBooking={handleGoBooking} />
                ))}
              </div>
            </section>

            {/* Trending Events */}
            <section className="event-section trending-events">
              <div className="section-header"><h2>Sự kiện xu hướng</h2></div>
              <div className="event-grid trending-grid">
                {trendingEvents.map((ev, idx) => (
                  <article key={ev._id} className="event-card trending-card">
                    <span className="event-number">{idx + 1}</span>
                    <div className="event-thumb" style={{ backgroundImage: `url(${getImageUrl(ev.imageUrl)})` }} />
                  </article>
                ))}
              </div>
            </section>
          </>
        )}
      </div>
    </div>
  );
};

// Extracted Sub-component for clarity
const EventCard = ({ event, getImageUrl, formatDate, onBooking }: any) => (
  <article className="event-card special-card">
    <div className="event-thumb" style={{ backgroundImage: `url(${getImageUrl(event.imageUrl)})` }}>
      <span className="event-tag">Event</span>
    </div>
    <div className="event-body">
      <h3>{event.title}</h3>
      <p className="event-meta">{event.location}</p>
      <p className="event-meta">{formatDate(event.date)}</p>
      <button className="btn small full-width" onClick={() => onBooking(event._id)}>
        Đặt vé ngay
      </button>
    </div>
  </article>
);