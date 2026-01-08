import React, { useEffect, useState, useMemo } from "react";
import { UserInfo, View } from "../utils/types";
import { API_BASE, getBanner, getEvents, Event } from "../utils/api";
import { SearchModal } from "./SearchModal";

interface HomeProps {
  user: UserInfo | null;
  setView: (v: View) => void;
  searchModalOpen?: boolean;
  onSearchModalClose?: () => void;
  selectedTags?: string[];
}

export const Home: React.FC<HomeProps> = ({
  user,
  setView,
  searchModalOpen = false,
  onSearchModalClose,
  selectedTags = [],
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

        const [bannerData, eventsData] = await Promise.all([
          getBanner(),
          getEvents(),
        ]);

        if (bannerData?.imageUrl) {
          const bannerUrl = bannerData.imageUrl.startsWith("http")
            ? bannerData.imageUrl
            : `${backendBase}${bannerData.imageUrl}`;
          setBanner(bannerUrl);
        } else {
          setBanner(null);
        }

        // Debug: Log raw API response
        console.log("📥 ========== RAW API RESPONSE ==========");
        console.log("📥 eventsData type:", typeof eventsData);
        console.log("📥 eventsData is array:", Array.isArray(eventsData));
        console.log("📥 eventsData length:", eventsData?.length);
        if (eventsData && eventsData.length > 0) {
          console.log("📥 First event raw:", JSON.stringify(eventsData[0], null, 2));
        }
        console.log("📥 ======================================");

        // Ensure tags are properly preserved
        const processedEvents = (eventsData || []).map((e: Event) => {
          // Debug each event's tags before processing
          const rawTags = e.tags;
          console.log(`📥 Processing "${e.title}":`, {
            rawTags: rawTags,
            rawTagsType: typeof rawTags,
            rawTagsIsArray: Array.isArray(rawTags),
            rawTagsValue: rawTags
          });

          // Ensure tags is always an array
          const tags = Array.isArray(e.tags) 
            ? e.tags.filter(t => t && String(t).trim().length > 0)
            : (e.tags ? [String(e.tags).trim()].filter(t => t.length > 0) : []);
          
          if (tags.length > 0) {
            console.log(`  ✅ "${e.title}" processed tags:`, tags);
          } else {
            console.log(`  ⚠️ "${e.title}" has NO tags after processing`);
          }
          
          return {
            ...e,
            tags: tags
          };
        });
        
        setAllEvents(processedEvents);
        
        // Debug: Log events with tags - check raw API response
        if (eventsData && eventsData.length > 0) {
          console.log("📥 ========== LOAD DATA DEBUG ==========");
          console.log("📥 Events loaded from API:", eventsData.length);
          console.log("📥 Raw first event (full):", JSON.stringify(eventsData[0], null, 2));
          
          eventsData.forEach((e: Event, idx: number) => {
            const tags = Array.isArray(e.tags) ? e.tags : (e.tags ? [e.tags] : []);
            console.log(`  [${idx + 1}] "${e.title}":`, {
              rawTags: e.tags,
              tagsType: typeof e.tags,
              tagsIsArray: Array.isArray(e.tags),
              processedTags: tags,
              hasTags: tags.length > 0,
              allKeys: Object.keys(e)
            });
          });
          
          const eventsWithTags = processedEvents.filter((e: Event) => e.tags && e.tags.length > 0);
          console.log("📥 Events with tags after processing:", eventsWithTags.length);
          if (eventsWithTags.length > 0) {
            console.log("📥 Sample events with tags:");
            eventsWithTags.forEach((e: Event) => {
              console.log(`  - "${e.title}":`, e.tags);
            });
          }
          console.log("📥 ======================================");
        }
      } catch (err: any) {
        console.error("Error loading home data:", err);
        setError("Không thể tải dữ liệu trang chủ");
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [backendBase]);

  // Filter events by tags
  const filteredEvents = useMemo(() => {
    if (selectedTags.length === 0) return allEvents;
    
    // Normalize tag function - handles Vietnamese diacritics and variations
    const normalizeTag = (tag: string | null | undefined): string => {
      if (!tag) return "";
      return String(tag)
        .trim()
        .toLowerCase()
        .replace(/\s+/g, " ") // Replace multiple spaces with single space
        .replace(/&/g, "và") // Replace & with và
        .replace(/&amp;/g, "và") // Replace &amp; with và
        .replace(/&nbsp;/g, " ") // Replace &nbsp; with space
        .replace(/\s+$/g, "") // Remove trailing spaces
        .replace(/^\s+/g, ""); // Remove leading spaces
    };
    
    // Normalize selected tags and remove duplicates
    const normalizedSelectedTags = Array.from(new Set(selectedTags.map(normalizeTag).filter(t => t.length > 0)));
    
    console.log("🔍 ========== FILTER DEBUG ==========");
    console.log("🔍 Selected tags (original):", selectedTags);
    console.log("🔍 Selected tags (normalized, unique):", normalizedSelectedTags);
    
    // Log ALL events and their tags
    console.log("📊 All events in database:");
    const eventsWithTags: Event[] = [];
    allEvents.forEach((event, idx) => {
      const hasTags = !!(event.tags && Array.isArray(event.tags) && event.tags.length > 0);
      const normalizedEventTags = hasTags ? (event.tags || []).map(normalizeTag).filter(t => t.length > 0) : [];
      
      console.log(`  [${idx + 1}] "${event.title}"`, {
        originalTags: event.tags || [],
        normalizedTags: normalizedEventTags,
        hasTags: hasTags
      });
      
      if (hasTags) {
        eventsWithTags.push(event);
      }
    });
    
    console.log(`📊 Total events: ${allEvents.length}, Events with tags: ${eventsWithTags.length}`);
    
    const filtered = allEvents.filter((event) => {
      // Skip events without tags
      if (!event.tags || !Array.isArray(event.tags) || event.tags.length === 0) {
        return false;
      }
      
      // Normalize event tags and filter out empty ones
      const eventTags = event.tags
        .map(normalizeTag)
        .filter(tag => tag.length > 0);
      
      if (eventTags.length === 0) {
        return false;
      }
      
      // Check if any event tag matches any selected tag
      // Use both exact match and match without diacritics for flexibility
      const matches = eventTags.some((eventTag) => {
        return normalizedSelectedTags.some((selectedTag) => {
          if (!selectedTag || selectedTag.length === 0) return false;
          
          // Strategy 1: Exact match (case-insensitive, normalized)
          if (eventTag === selectedTag) {
            console.log(`  ✅ Exact match: "${event.title}" - "${eventTag}" === "${selectedTag}"`);
            return true;
          }
          
          // Strategy 2: Match without diacritics (for Vietnamese variations)
          const eventTagNoDiac = eventTag.normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
          const selectedTagNoDiac = selectedTag.normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
          if (eventTagNoDiac === selectedTagNoDiac && eventTagNoDiac.length > 0) {
            console.log(`  ✅ Diacritics match: "${event.title}" - "${eventTag}" (no diac: "${eventTagNoDiac}") === "${selectedTag}" (no diac: "${selectedTagNoDiac}")`);
            return true;
          }
          
          return false;
        });
      });
      
      if (!matches && eventTags.length > 0) {
        console.log(`  ❌ No match: "${event.title}"`, {
          eventTags,
          lookingFor: normalizedSelectedTags
        });
      }
      
      return matches;
    });
    
    console.log(`✅ Filter result: ${filtered.length}/${allEvents.length} events found`);
    if (filtered.length > 0) {
      console.log("✅ Filtered events:", filtered.map(e => ({
        title: e.title,
        tags: e.tags
      })));
    } else {
      console.warn("⚠️ No events found!");
      const allUniqueTags = Array.from(new Set(allEvents.flatMap(e => e.tags || []).filter(Boolean)));
      console.log("📋 All unique tags in database (original):", allUniqueTags);
      console.log("📋 All unique tags (normalized):", allUniqueTags.map(normalizeTag));
      console.log("📋 Looking for:", normalizedSelectedTags);
      
      // Show helpful message
      if (eventsWithTags.length === 0) {
        console.warn("💡 TIP: Không có events nào có tags trong database. Hãy thêm tags cho events qua trang Admin.");
      } else {
        console.warn("💡 TIP: Có events có tags nhưng không match với tags đã chọn. Kiểm tra lại tags trong database.");
      }
    }
    console.log("🔍 ==================================");
    
    return filtered;
  }, [allEvents, selectedTags]);

  // Derived State for Sections
  // When filtering by tags, show all filtered events. Otherwise, show featured/trending separately
  const hasActiveFilter = selectedTags.length > 0;
  
  const specialEvents = useMemo(
    () => {
      if (hasActiveFilter) return []; // Don't show featured section when filtering
      return filteredEvents.filter((e) => e.isFeatured).slice(0, 4);
    },
    [filteredEvents, hasActiveFilter]
  );

  const trendingEvents = useMemo(() => {
    if (hasActiveFilter) return []; // Don't show trending section when filtering
    return filteredEvents.slice(0, 10);
  }, [filteredEvents, hasActiveFilter]);
  
  // All filtered events (used when filtering by tags)
  const allFilteredEvents = useMemo(() => {
    if (!hasActiveFilter) return [];
    return filteredEvents;
  }, [filteredEvents, hasActiveFilter]);

  // Search Logic
  useEffect(() => {
    const q = searchQuery.trim();
    if (q) {
      setIsSearching(true);
      const queryLower = q.toLowerCase();
      const filtered = filteredEvents.filter((event) => {
        const title = event.title?.toLowerCase() || "";
        const location = event.location?.toLowerCase() || "";
        const desc = event.description?.toLowerCase() || "";
        const tags = (event.tags || []).join(" ").toLowerCase();
        return (
          title.includes(queryLower) ||
          location.includes(queryLower) ||
          desc.includes(queryLower) ||
          tags.includes(queryLower)
        );
      });
      setSearchResults(filtered);
    } else {
      setIsSearching(false);
      setSearchResults([]);
    }
  }, [searchQuery, filteredEvents]);

  // Helpers
  const handleGoBooking = (eventId: string) => {
    localStorage.setItem("selectedEventId", eventId);
    setView("booking");
  };

  // ✅ NEW: mở trang chi tiết
  const handleOpenDetail = (eventId: string) => {
    localStorage.setItem("selectedEventId", eventId);
    setView("event_detail");
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
        style={
          banner
            ? { backgroundImage: `url(${banner})`, backgroundSize: "cover" }
            : {}
        }
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
          <section className="event-section search-results">
            <h2>Kết quả tìm kiếm ({searchResults.length})</h2>
            {searchResults.length === 0 ? (
              <div style={{ padding: "40px", textAlign: "center", color: "#6b7280" }}>
                <p>Không tìm thấy sự kiện nào phù hợp với từ khóa "{searchQuery}"</p>
              </div>
            ) : (
              <div className="event-grid special-grid">
                {searchResults.map((ev) => (
                  <EventCard
                    key={ev._id}
                    event={ev}
                    getImageUrl={getImageUrl}
                    formatDate={formatDate}
                    onBooking={handleGoBooking}
                    onOpenDetail={handleOpenDetail}
                  />
                ))}
              </div>
            )}
          </section>
        ) : hasActiveFilter ? (
          /* Show all filtered events when tags are selected */
          <section className="event-section filtered-results">
            <div className="section-header">
              <h2>
                Kết quả lọc: {selectedTags.join(", ")} ({allFilteredEvents.length})
              </h2>
            </div>
            {allFilteredEvents.length === 0 ? (
              <div style={{ padding: "40px", textAlign: "center", color: "#6b7280" }}>
                <p>Không có sự kiện nào với tag{selectedTags.length > 1 ? "s" : ""} "{selectedTags.join(", ")}"</p>
              </div>
            ) : (
              <div className="event-grid special-grid">
                {allFilteredEvents.map((ev) => (
                  <EventCard
                    key={ev._id}
                    event={ev}
                    getImageUrl={getImageUrl}
                    formatDate={formatDate}
                    onBooking={handleGoBooking}
                    onOpenDetail={handleOpenDetail}
                  />
                ))}
              </div>
            )}
          </section>
        ) : (
          <>
            {/* Featured Events */}
            <section className="event-section special-events">
              <div className="section-header">
                <h2>Sự kiện đặc biệt</h2>
              </div>
              {specialEvents.length === 0 ? (
                <div style={{ padding: "20px", textAlign: "center", color: "#6b7280" }}>
                  <p>Chưa có sự kiện đặc biệt</p>
                </div>
              ) : (
                <div className="event-grid special-grid">
                  {specialEvents.map((ev) => (
                    <EventCard
                      key={ev._id}
                      event={ev}
                      getImageUrl={getImageUrl}
                      formatDate={formatDate}
                      onBooking={handleGoBooking}
                      onOpenDetail={handleOpenDetail}
                    />
                  ))}
                </div>
              )}
            </section>

            {/* Trending Events */}
            <section className="event-section trending-events">
              <div className="section-header">
                <h2>Sự kiện xu hướng</h2>
              </div>
              {trendingEvents.length === 0 ? (
                <div style={{ padding: "20px", textAlign: "center", color: "#6b7280" }}>
                  <p>Chưa có sự kiện xu hướng</p>
                </div>
              ) : (
                <div className="event-grid trending-grid">
                  {trendingEvents.map((ev, idx) => (
                    <article
                      key={ev._id}
                      className="event-card trending-card"
                      onClick={() => handleOpenDetail(ev._id)}
                      style={{ cursor: "pointer" }}
                      title="Xem chi tiết"
                    >
                      <span className="event-number">{idx + 1}</span>

                      <div
                        className="event-thumb trending-thumb"
                        style={{
                          backgroundImage: `url(${getImageUrl(ev.imageUrl)})`,
                          backgroundSize: "cover",
                          backgroundPosition: "center",
                          backgroundRepeat: "no-repeat",
                        }}
                      />
                    </article>
                  ))}
                </div>
              )}
            </section>
          </>
        )}
      </div>
    </div>
  );
};

type EventCardProps = {
  event: Event;
  getImageUrl: (url?: string) => string;
  formatDate: (dateString?: string) => string;
  onBooking: (eventId: string) => void;
  onOpenDetail: (eventId: string) => void;
};

const EventCard: React.FC<EventCardProps> = ({
  event,
  getImageUrl,
  formatDate,
  onBooking,
  onOpenDetail,
}) => (
  <article
    className="event-card special-card"
    onClick={() => onOpenDetail(event._id)}
    style={{ cursor: "pointer" }}
    title="Xem chi tiết"
  >
    <div
      className="event-thumb"
      style={{
        backgroundImage: `url(${getImageUrl(event.imageUrl)})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
      }}
    >
      <span className="event-tag">Event</span>
    </div>

    <div className="event-body">
      <h3>{event.title}</h3>
      <p className="event-meta">{event.location}</p>
      <p className="event-meta">{formatDate(event.date)}</p>
      
      {/* Display tags */}
      {event.tags && event.tags.length > 0 && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: "4px", marginBottom: "8px" }}>
          {event.tags.map((tag, idx) => (
            <span
              key={idx}
              style={{
                display: "inline-block",
                padding: "2px 8px",
                backgroundColor: "#eff6ff",
                color: "#3b82f6",
                borderRadius: "12px",
                fontSize: "11px",
                fontWeight: "500"
              }}
            >
              {tag}
            </span>
          ))}
        </div>
      )}

      {/* ✅ Nút booking không làm mở chi tiết (stopPropagation) */}
      <button
        className="btn small full-width"
        onClick={(e) => {
          e.stopPropagation();
          onBooking(event._id);
        }}
      >
        Đặt vé ngay
      </button>
    </div>
  </article>
);
