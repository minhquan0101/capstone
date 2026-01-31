import React, { useEffect, useState, useMemo, useRef } from "react";
import { UserInfo, View } from "../utils/types";
import { API_BASE, getBanner, getEvents, Event } from "../utils/api";

// ✅ NEW: HeroBanner (Ticketbox-style)
import HeroBanner, { HeroBannerItem } from "./HeroBanner";

interface HomeProps {
  user: UserInfo | null;
  setView: (v: View) => void;
  selectedTags?: string[];
}

/** ✅ Các section đa dạng theo tag */
const TAG_SECTIONS: { title: string; tag: string }[] = [
  { title: "Nhạc sống", tag: "Nhạc sống" },
  { title: "Sân khấu & Nghệ thuật", tag: "Sân khấu" },
  { title: "Thể thao", tag: "Thể thao" },
  { title: "Hội thảo & Workshop", tag: "Workshop" },
  { title: "Hội chợ", tag: "Hội chợ" },
  { title: "Tham quan & Trải nghiệm", tag: "Trải nghiệm" },
];

const normalizeTagLoose = (tag: string | null | undefined): string => {
  if (!tag) return "";
  return String(tag)
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ")
    .replace(/&/g, "và")
    .replace(/&amp;/g, "và")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+$/g, "")
    .replace(/^\s+/g, "");
};

const removeDiacritics = (s: string) =>
  s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();

const hasTagLoose = (event: Event, tag: string) => {
  const target = normalizeTagLoose(tag);
  if (!target) return false;

  const tags = Array.isArray(event.tags) ? event.tags : [];
  const normTags = tags.map((t) => normalizeTagLoose(t)).filter(Boolean);

  if (normTags.includes(target)) return true;

  const targetNo = removeDiacritics(target);
  return normTags.some((t) => removeDiacritics(t) === targetNo);
};

const safeDate = (v?: any) => {
  const d = new Date(v);
  return isNaN(d.getTime()) ? null : d;
};

// ✅ NEW: check sự kiện đã diễn ra
const isEndedDate = (v?: any) => {
  const d = safeDate(v);
  return d ? d.getTime() < Date.now() : false;
};

const shufflePick = <T,>(arr: T[], n: number) => {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a.slice(0, n);
};

export const Home: React.FC<HomeProps> = ({ user, setView, selectedTags = [] }) => {
  const [banner, setBanner] = useState<string | null>(null);
  const [allEvents, setAllEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Search states
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Event[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // ✅ NEW: price filter + sort state
  const [priceMin, setPriceMin] = useState<string>("");
  const [priceMax, setPriceMax] = useState<string>("");
  const [priceSort, setPriceSort] = useState<"" | "asc" | "desc">("");

  // ✅ NEW: đang lọc theo giá không?
  const isPriceFiltering = useMemo(() => {
    return Boolean(priceMin.trim()) || Boolean(priceMax.trim()) || Boolean(priceSort);
  }, [priceMin, priceMax, priceSort]);

  const backendBase = API_BASE.replace(/\/api\/?$/, "");

  // ✅ Nhận searchQuery từ Navbar (localStorage + event)
  useEffect(() => {
    const apply = () => {
      const q = localStorage.getItem("homeSearchQuery") || "";
      setSearchQuery(q);
    };

    apply();

    const handler = (e: any) => {
      setSearchQuery(e?.detail || "");
    };

    window.addEventListener("homeSearchQueryChanged", handler);
    return () => window.removeEventListener("homeSearchQueryChanged", handler);
  }, []);

  const formatVND = (digits: string) => {
    const n = Number(digits || 0);
    if (!digits) return "";
    if (!Number.isFinite(n)) return "";
    return n.toLocaleString("vi-VN"); // 100.000
  };

  const toDigits = (s: string) => (s || "").replace(/[^\d]/g, "");

  const normalizeMoneyInput = (v: string) => v.replace(/[^\d]/g, "");

  // ✅ Load Data (tách thành function để “Áp dụng” / “Xoá lọc” gọi lại)
  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [bannerData, eventsData] = await Promise.all([
        getBanner(),
        getEvents({
          priceMin: priceMin.trim() ? priceMin.trim() : undefined,
          priceMax: priceMax.trim() ? priceMax.trim() : undefined,
          priceSort: priceSort || undefined,
        }),
      ]);

      if (bannerData?.imageUrl) {
        const bannerUrl = bannerData.imageUrl.startsWith("http")
          ? bannerData.imageUrl
          : `${backendBase}${bannerData.imageUrl}`;
        setBanner(bannerUrl);
      } else {
        setBanner(null);
      }

      const processedEvents = (eventsData || []).map((e: Event) => {
        const tags = Array.isArray(e.tags)
          ? e.tags.filter((t) => t && String(t).trim().length > 0)
          : e.tags
          ? [String(e.tags).trim()].filter((t) => t.length > 0)
          : [];
        return { ...e, tags };
      });

      setAllEvents(processedEvents);

      try {
        const titles = processedEvents.map((e: any) => String(e.title || "")).filter(Boolean);
        localStorage.setItem("homeEventTitles", JSON.stringify(titles));
      } catch {}
    } catch (err: any) {
      console.error("Error loading home data:", err);
      setError("Không thể tải dữ liệu trang chủ");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [backendBase]);

  // Filter events by tags
  const filteredEvents = useMemo(() => {
    if (selectedTags.length === 0) return allEvents;

    const normalizedSelectedTags = Array.from(
      new Set(selectedTags.map(normalizeTagLoose).filter((t) => t.length > 0))
    );

    return allEvents.filter((event) => {
      if (!event.tags || !Array.isArray(event.tags) || event.tags.length === 0) return false;

      const eventTags = event.tags.map(normalizeTagLoose).filter((tag) => tag.length > 0);
      if (eventTags.length === 0) return false;

      return eventTags.some((eventTag) =>
        normalizedSelectedTags.some((selectedTag) => {
          if (!selectedTag) return false;
          if (eventTag === selectedTag) return true;
          return removeDiacritics(eventTag) === removeDiacritics(selectedTag);
        })
      );
    });
  }, [allEvents, selectedTags]);

  const hasActiveFilter = selectedTags.length > 0;

  const specialEvents = useMemo(() => {
    if (hasActiveFilter) return [];
    return filteredEvents.filter((e: any) => !!e.isFeatured).slice(0, 4);
  }, [filteredEvents, hasActiveFilter]);

  const trendingEvents = useMemo(() => {
    if (hasActiveFilter) return [];
    return filteredEvents.slice(0, 10);
  }, [filteredEvents, hasActiveFilter]);

  const allFilteredEvents = useMemo(() => {
    if (!hasActiveFilter) return [];
    return filteredEvents;
  }, [filteredEvents, hasActiveFilter]);

  // ✅ NEW (đưa xuống dưới): Dành cho bạn + Sắp diễn ra + section tag
  const forYouEvents = useMemo(() => {
    if (hasActiveFilter) return [];
    return shufflePick(filteredEvents, 12);
  }, [filteredEvents, hasActiveFilter]);

  const upcomingEvents = useMemo(() => {
    if (hasActiveFilter) return [];
    const now = Date.now();
    return [...filteredEvents]
      .map((e) => ({ e, d: safeDate((e as any).date) }))
      .filter((x) => x.d && x.d.getTime() >= now)
      .sort((a, b) => a.d!.getTime() - b.d!.getTime())
      .map((x) => x.e)
      .slice(0, 12);
  }, [filteredEvents, hasActiveFilter]);

  const tagSections = useMemo(() => {
    if (hasActiveFilter) return [];
    return TAG_SECTIONS.map((sec) => ({
      title: sec.title,
      tag: sec.tag,
      items: filteredEvents.filter((e) => hasTagLoose(e, sec.tag)).slice(0, 12),
    })).filter((sec) => sec.items.length > 0);
  }, [filteredEvents, hasActiveFilter]);

  // ✅ NEW: list kết quả khi lọc giá (từ backend) => dùng filteredEvents luôn
  const priceFilterResults = useMemo(() => {
    return filteredEvents;
  }, [filteredEvents]);

  // Search Logic
  useEffect(() => {
    const q = searchQuery.trim();
    if (q) {
      setIsSearching(true);
      const queryLower = q.toLowerCase();
      const filtered = filteredEvents.filter((event: any) => {
        const title = (event.title || "").toLowerCase();
        const location = (event.location || "").toLowerCase();
        const desc = (event.description || "").toLowerCase();
        const tags = (event.tags || []).join(" ").toLowerCase();
        return title.includes(queryLower) || location.includes(queryLower) || desc.includes(queryLower) || tags.includes(queryLower);
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

  const onApplyPriceFilter = () => {
    const mn = priceMin.trim() ? Number(priceMin) : null;
    const mx = priceMax.trim() ? Number(priceMax) : null;
    if (mn !== null && mx !== null && Number.isFinite(mn) && Number.isFinite(mx) && mn > mx) {
      alert("Giá từ không được lớn hơn giá đến.");
      return;
    }
    loadData();
  };

  const onClearPriceFilter = () => {
    setPriceMin("");
    setPriceMax("");
    setPriceSort("");
    setTimeout(() => loadData(), 0);
  };

  if (loading)
    return (
      <div className="loading-state">
        <p>Đang tải...</p>
      </div>
    );

  // ✅ build hero banners
  const heroBanners: HeroBannerItem[] = (() => {
    const featured = allEvents.filter((e: any) => e.isFeatured && e.imageUrl).slice(0, 10);
    const featuredIds = new Set(featured.map((e) => e._id));
    const filler = allEvents
      .filter((e: any) => !featuredIds.has(e._id) && e.imageUrl)
      .slice(0, Math.max(0, 10 - featured.length));

    const list = [...featured, ...filler];

    if (list.length > 0) {
      return list.map((e: any) => ({
        imageUrl: getImageUrl(e.imageUrl),
        href: "#",
        title: e.title,
        onClick: () => handleOpenDetail(e._id),
      })) as any;
    }

    if (banner) {
      return [
        {
          imageUrl: banner,
          href: "#",
          title: "Banner",
          onClick: () => {},
        } as any,
      ];
    }

    return [];
  })();

  return (
    <div className="home">
      {heroBanners.length > 0 ? (
        <HeroBanner
          banners={heroBanners.map((b: any) => ({
            imageUrl: b.imageUrl,
            title: b.title,
            href: b.href,
            onClick: b.onClick,
          }))}
        />
      ) : null}

      {error && <div className="global-message error">{error}</div>}

      {/* ✅ Price filter + sort bar (chỉ show khi không search và không tag filter) */}
      {!isSearching && !hasActiveFilter ? (
        <div className="content-wrapper" style={{ paddingTop: 10 }}>
          <div className="price-filter-bar">
            <div className="price-filter-fields">
              <input
                className="price-filter-input"
                value={formatVND(priceMin)}
                onChange={(e) => setPriceMin(toDigits(e.target.value))}
                onBlur={(e) => setPriceMin(toDigits(e.target.value))}
                placeholder="Giá từ"
                inputMode="numeric"
              />

              <span className="price-filter-sep">—</span>

              <input
                className="price-filter-input"
                value={formatVND(priceMax)}
                onChange={(e) => setPriceMax(toDigits(e.target.value))}
                onBlur={(e) => setPriceMax(toDigits(e.target.value))}
                placeholder="Giá đến"
                inputMode="numeric"
              />

              <select
                className="price-filter-select"
                value={priceSort}
                onChange={(e) => setPriceSort(e.target.value as any)}
              >
                <option value="">Sắp xếp theo giá</option>
                <option value="asc">Giá: tăng dần</option>
                <option value="desc">Giá: giảm dần</option>
              </select>
            </div>

            <div className="price-filter-actions">
              <button className="btn small" onClick={onApplyPriceFilter}>
                Áp dụng
              </button>
              <button className="btn outline small" onClick={onClearPriceFilter}>
                Xoá lọc
              </button>
            </div>
          </div>
        </div>
      ) : null}

      <div className="content-wrapper">
        {isSearching ? (
          <section className="event-section search-results">
            <h2>
              Kết quả tìm kiếm ({searchResults.length})
              {searchQuery ? `: "${searchQuery}"` : ""}
            </h2>
            {searchResults.length === 0 ? (
              <div style={{ padding: "40px", textAlign: "center", color: "#6b7280" }}>
                <p>Không tìm thấy sự kiện nào phù hợp</p>
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
          <section className="event-section filtered-results">
            <div className="section-header">
              <h2>
                Kết quả lọc: {selectedTags.join(", ")} ({allFilteredEvents.length})
              </h2>
            </div>
            {allFilteredEvents.length === 0 ? (
              <div style={{ padding: "40px", textAlign: "center", color: "#6b7280" }}>
                <p>Không có sự kiện nào phù hợp</p>
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
        ) : isPriceFiltering ? (
          // ✅ NEW: Khi lọc giá => chỉ hiện kết quả (không đặc biệt/xu hướng/dành cho bạn...)
          <section className="event-section filtered-results">
            <div className="section-header">
              <h2>Kết quả theo giá ({priceFilterResults.length})</h2>
            </div>

            {priceFilterResults.length === 0 ? (
              <div style={{ padding: "40px", textAlign: "center", color: "#6b7280" }}>
                <p>Không có sự kiện nào trong khoảng giá này</p>
              </div>
            ) : (
              <div className="event-grid special-grid">
                {priceFilterResults.map((ev) => (
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
                          backgroundImage: `url(${getImageUrl((ev as any).imageUrl)})`,
                          backgroundSize: "cover",
                          backgroundPosition: "center",
                          backgroundRepeat: "no-repeat",
                        }}
                      >
                        {isEndedDate((ev as any).date) ? (
                          <span
                            style={{
                              position: "absolute",
                              top: 10,
                              right: 10,
                              padding: "4px 10px",
                              borderRadius: 999,
                              fontSize: 12,
                              fontWeight: 700,
                              background: "rgba(249,115,22,0.95)",
                              color: "#fff",
                            }}
                          >
                            Đã diễn ra
                          </span>
                        ) : null}
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </section>

            <section className="event-section">
              <div className="section-header">
                <h2>Dành cho bạn</h2>
              </div>
              <ArrowCarousel>
                {forYouEvents.map((ev) => (
                  <RowEventCard
                    key={ev._id}
                    event={ev}
                    getImageUrl={getImageUrl}
                    formatDate={formatDate}
                    onOpenDetail={handleOpenDetail}
                  />
                ))}
              </ArrowCarousel>
            </section>

            <section className="event-section">
              <div className="section-header">
                <h2>Sắp diễn ra</h2>
              </div>
              {upcomingEvents.length === 0 ? (
                <div style={{ padding: "20px", textAlign: "center", color: "#6b7280" }}>
                  <p>Chưa có sự kiện sắp diễn ra</p>
                </div>
              ) : (
                <ArrowCarousel>
                  {upcomingEvents.map((ev) => (
                    <RowEventCard
                      key={ev._id}
                      event={ev}
                      getImageUrl={getImageUrl}
                      formatDate={formatDate}
                      onOpenDetail={handleOpenDetail}
                    />
                  ))}
                </ArrowCarousel>
              )}
            </section>

            {tagSections.map((sec) => (
              <section className="event-section" key={sec.title}>
                <div className="section-header">
                  <h2>{sec.title}</h2>
                </div>
                <ArrowCarousel>
                  {sec.items.map((ev) => (
                    <RowEventCard
                      key={ev._id}
                      event={ev}
                      getImageUrl={getImageUrl}
                      formatDate={formatDate}
                      onOpenDetail={handleOpenDetail}
                    />
                  ))}
                </ArrowCarousel>
              </section>
            ))}
          </>
        )}
      </div>
    </div>
  );
};

/** ✅ Carousel có mũi tên, không hiện scrollbar */
const ArrowCarousel: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const ref = useRef<HTMLDivElement | null>(null);

  const scrollByAmount = (dir: "left" | "right") => {
    const el = ref.current;
    if (!el) return;
    const amount = Math.floor(el.clientWidth * 0.8);
    el.scrollBy({ left: dir === "left" ? -amount : amount, behavior: "smooth" });
  };

  return (
    <div className="tb-carousel">
      <button type="button" className="tb-arrow left" onClick={() => scrollByAmount("left")}>
        ‹
      </button>
      <div className="tb-track" ref={ref}>
        {children}
      </div>
      <button type="button" className="tb-arrow right" onClick={() => scrollByAmount("right")}>
        ›
      </button>
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
}) => {
  const ended = (event as any).date ? isEndedDate((event as any).date) : false;

  return (
    <article
      className="event-card special-card"
      onClick={() => onOpenDetail(event._id)}
      style={{ cursor: "pointer" }}
      title="Xem chi tiết"
    >
      <div
        className="event-thumb"
        style={{
          position: "relative",
          backgroundImage: `url(${getImageUrl((event as any).imageUrl)})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
        }}
      >
        <span className="event-tag">Event</span>

        {ended ? (
          <span
            style={{
              position: "absolute",
              top: 10,
              right: 10,
              padding: "4px 10px",
              borderRadius: 999,
              fontSize: 12,
              fontWeight: 700,
              background: "rgba(249,115,22,0.95)",
              color: "#fff",
            }}
          >
            Đã diễn ra
          </span>
        ) : null}
      </div>

      <div className="event-body">
        <h3>{(event as any).title}</h3>
        <p className="event-meta">{(event as any).location}</p>
        <p className="event-meta">{formatDate((event as any).date)}</p>

        {(event as any).price ? (
  <p className="event-meta event-price">
    Từ {Number((event as any).price).toLocaleString("vi-VN")}đ
  </p>
) : null}

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
                  fontWeight: "500",
                }}
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        <button
          className="btn small full-width"
          disabled={ended}
          style={ended ? { opacity: 0.6, cursor: "not-allowed" } : undefined}
          onClick={(e) => {
            e.stopPropagation();
            if (ended) return;
            onBooking(event._id);
          }}
        >
          {ended ? "Đã diễn ra" : "Đặt vé ngay"}
        </button>
      </div>
    </article>
  );
};

type RowEventCardProps = {
  event: Event;
  getImageUrl: (url?: string) => string;
  formatDate: (dateString?: string) => string;
  onOpenDetail: (eventId: string) => void;
};

const RowEventCard: React.FC<RowEventCardProps> = ({
  event,
  getImageUrl,
  formatDate,
  onOpenDetail,
}) => {
  const ended = isEndedDate((event as any).date);

  return (
    <article
      className="home-row-card"
      onClick={() => onOpenDetail(event._id)}
      style={{ cursor: "pointer" }}
    >
      <div
        className="home-row-thumb"
        style={{
          position: "relative",
          backgroundImage: `url(${getImageUrl((event as any).imageUrl)})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
        }}
      >
        {ended ? (
          <span
            style={{
              position: "absolute",
              top: 8,
              right: 8,
              padding: "3px 8px",
              borderRadius: 999,
              fontSize: 11,
              fontWeight: 700,
              background: "rgba(249,115,22,0.95)",
              color: "#fff",
            }}
          >
            Đã diễn ra
          </span>
        ) : null}
      </div>

      <div className="home-row-body">
        <div className="home-row-title">{(event as any).title}</div>
        <div className="home-row-price">
          {(event as any).price ? `Từ ${Number((event as any).price).toLocaleString("vi-VN")}đ` : ""}
        </div>
        <div className="home-row-meta">
          {formatDate((event as any).date)}
          {(event as any).location ? ` • ${(event as any).location}` : ""}
        </div>
      </div>
    </article>
  );
};
