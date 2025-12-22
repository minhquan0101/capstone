import React, { useEffect, useState } from "react";
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
  const [specialEvents, setSpecialEvents] = useState<Event[]>([]);
  const [trendingEvents, setTrendingEvents] = useState<Event[]>([]);
  const [allEvents, setAllEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Search states
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Event[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const backendBase = API_BASE.replace(/\/api\/?$/, "");

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        // Load banner
        const bannerData = await getBanner();
        if (bannerData) {
          const bannerUrl = bannerData.imageUrl.startsWith("http")
            ? bannerData.imageUrl
            : `${backendBase}${bannerData.imageUrl}`;
          setBanner(bannerUrl);
        }

        // Load featured events
        const featured = await getEvents(true, false);
        setSpecialEvents(featured);

        // Load trending events
        const trending = await getEvents(false, true);
        setTrendingEvents(trending);

        // Load all events for search
        const all = await getEvents();
        setAllEvents(all);
      } catch (error) {
        console.error("Error loading home data:", error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [backendBase]);

  // Handle search
  const handleSearch = (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    const filtered = allEvents.filter((event) => {
      const queryLower = query.toLowerCase();
      const titleMatch = event.title.toLowerCase().includes(queryLower);
      const locationMatch = event.location?.toLowerCase().includes(queryLower);
      const descriptionMatch = event.description?.toLowerCase().includes(queryLower);
      
      return titleMatch || locationMatch || descriptionMatch;
    });

    setSearchResults(filtered);
  };

  useEffect(() => {
    if (searchQuery) {
      handleSearch(searchQuery);
    } else {
      setSearchResults([]);
      setIsSearching(false);
    }
  }, [searchQuery, allEvents]);

  const formatDate = (dateString?: string) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleDateString("vi-VN");
  };

  const getEventTag = (event: Event) => {
    // Có thể thêm logic để xác định tag dựa trên description hoặc title
    if (event.description?.toLowerCase().includes("music") || event.title.toLowerCase().includes("concert")) {
      return "Music";
    }
    if (event.description?.toLowerCase().includes("sport") || event.title.toLowerCase().includes("bóng")) {
      return "Sports";
    }
    if (event.description?.toLowerCase().includes("theater") || event.title.toLowerCase().includes("kịch")) {
      return "Theater";
    }
    return "Event";
  };

  return (
    <div className="home">
      <div
        className="hero-banner"
        style={
          banner
            ? {
                backgroundImage: `url(${banner})`,
                backgroundSize: "cover",
                backgroundPosition: "center",
              }
            : {}
        }
      />

      {/* Search Modal */}
      <SearchModal
        isOpen={searchModalOpen}
        onClose={() => {
          onSearchModalClose?.();
        }}
        allEvents={allEvents}
        onSearch={handleSearch}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
      />

      {loading ? (
        <div style={{ padding: "40px", textAlign: "center" }}>
          <p>Đang tải...</p>
        </div>
      ) : (
        <>
          {/* Search Results */}
          {isSearching && (
            <section className="event-section search-results">
              <div className="section-header">
                <h2>
                  Kết quả tìm kiếm {searchResults.length > 0 && `(${searchResults.length})`}
                </h2>
              </div>
              {searchResults.length > 0 ? (
                <div className="event-grid special-grid">
                  {searchResults.map((event) => {
                    const imageUrl = event.imageUrl
                      ? event.imageUrl.startsWith("http")
                        ? event.imageUrl
                        : `${backendBase}${event.imageUrl}`
                      : "https://via.placeholder.com/300x200?text=No+Image";
                    return (
                      <article key={event._id} className="event-card special-card">
                        <div
                          className="event-thumb"
                          style={{ backgroundImage: `url(${imageUrl})` }}
                        >
                          <span className="event-tag">{getEventTag(event)}</span>
                        </div>
                        <div className="event-body">
                          <h3>{event.title}</h3>
                          {event.location && <p className="event-meta">{event.location}</p>}
                          {event.date && <p className="event-meta">{formatDate(event.date)}</p>}
                          <button
                            className="btn small full-width"
                            onClick={() => setView("booking")}
                          >
                            Đặt vé ngay
                          </button>
                        </div>
                      </article>
                    );
                  })}
                </div>
              ) : (
                <p style={{ padding: "20px", textAlign: "center", color: "#666" }}>
                  Không tìm thấy sự kiện nào phù hợp với tiêu chí tìm kiếm
                </p>
              )}
            </section>
          )}

          {/* Featured Events - Only show when not searching */}
          {!isSearching && (
            <section className="event-section special-events">
            <div className="section-header">
              <h2>sự kiện đặc biệt</h2>
            </div>
            {specialEvents.length > 0 ? (
              <div className="event-grid special-grid">
                {specialEvents.map((event) => {
                  const imageUrl = event.imageUrl
                    ? event.imageUrl.startsWith("http")
                      ? event.imageUrl
                      : `${backendBase}${event.imageUrl}`
                    : "https://via.placeholder.com/300x200?text=No+Image";
                  return (
                    <article key={event._id} className="event-card special-card">
                      <div
                        className="event-thumb"
                        style={{ backgroundImage: `url(${imageUrl})` }}
                      >
                        <span className="event-tag">{getEventTag(event)}</span>
                      </div>
                      <div className="event-body">
                        <h3>{event.title}</h3>
                        {event.location && <p className="event-meta">{event.location}</p>}
                        {event.date && <p className="event-meta">{formatDate(event.date)}</p>}
                        <button
                          className="btn small full-width"
                          onClick={() => setView("booking")}
                        >
                          Đặt vé ngay
                        </button>
                      </div>
                    </article>
                  );
                })}
              </div>
            ) : (
              <p style={{ padding: "20px", textAlign: "center", color: "#666" }}>
                Chưa có sự kiện đặc biệt nào
              </p>
            )}
          </section>
          )}

          {/* Trending Events - Only show when not searching */}
          {!isSearching && (
            <section className="event-section trending-events">
            <div className="section-header">
              <h2>sự kiện xu hướng</h2>
            </div>
            {trendingEvents.length > 0 ? (
              <div className="event-grid trending-grid">
                {trendingEvents.slice(0, 10).map((event, index) => {
                  const imageUrl = event.imageUrl
                    ? event.imageUrl.startsWith("http")
                      ? event.imageUrl
                      : `${backendBase}${event.imageUrl}`
                    : "https://via.placeholder.com/300x200?text=No+Image";
                  return (
                    <article key={event._id} className="event-card trending-card">
                      <span className="event-number">{index + 1}</span>
                      <div
                        className="event-thumb trending-thumb"
                        style={{ backgroundImage: `url(${imageUrl})` }}
                      >
                        <span className="event-tag">{getEventTag(event)}</span>
                      </div>
                    </article>
                  );
                })}
              </div>
            ) : (
              <p style={{ padding: "20px", textAlign: "center", color: "#666" }}>
                Chưa có sự kiện xu hướng nào
              </p>
            )}
          </section>
          )}
        </>
      )}
    </div>
  );
};


