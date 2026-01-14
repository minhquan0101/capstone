import React, { useState, useEffect } from "react";
import { Event } from "../utils/api";
import "../styles/SearchModal.css";


interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  allEvents: Event[];
  onSearch: (query: string) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
}

const POPULAR_SEARCHES = ["Nhạc sống", "Sân khấu", "Thể thao", "Workshop", "Hội chợ"];

const CATEGORIES = [
  {
    id: "music",
    name: "Nhạc sống",
    image:
      "https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=400&h=300&fit=crop",
  },
  {
    id: "theater",
    name: "Sân khấu & Nghệ thuật",
    image:
      "https://images.unsplash.com/photo-1503095396549-807759245b35?w=400&h=300&fit=crop",
  },
  {
    id: "sports",
    name: "Thể Thao",
    image:
      "https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=400&h=300&fit=crop",
  },
  {
    id: "other",
    name: "Khác",
    image:
      "https://images.unsplash.com/photo-1513475382585-d06e58bcb0e0?w=400&h=300&fit=crop",
  },
];

const CITIES = ["Hồ Chí Minh", "Hà Nội", "Đà Nẵng", "Hải Phòng", "Cần Thơ"];

export const SearchModal: React.FC<SearchModalProps> = ({
  isOpen,
  onClose,
  allEvents,
  onSearch,
  searchQuery,
  setSearchQuery,
}) => {
  const [activeTab, setActiveTab] = useState<"category" | "city">("category");
  const [suggestions, setSuggestions] = useState<string[]>([]);

  useEffect(() => {
    if (!isOpen) {
      setSuggestions([]);
      return;
    }

    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    document.addEventListener("keydown", handleEsc);
    return () => {
      document.removeEventListener("keydown", handleEsc);
      document.body.style.overflow = prevOverflow || "auto";
    };
  }, [isOpen, onClose]);

  useEffect(() => {
    if (searchQuery.trim()) {
      const eventTitles = allEvents
        .map((e) => e.title)
        .filter((title) => title.toLowerCase().includes(searchQuery.toLowerCase()))
        .slice(0, 5);
      setSuggestions(eventTitles);
    } else {
      setSuggestions([]);
    }
  }, [searchQuery, allEvents]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchQuery(value);
    if (value.trim()) onSearch(value);
  };

  const pick = (value: string) => {
    setSearchQuery(value);
    onSearch(value);
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="tf-search-overlay" onClick={onClose} />

      <div className="tf-search-modal">
        <div className="tf-search-modal-content" onClick={(e) => e.stopPropagation()}>
          <button className="tf-search-close" onClick={onClose} aria-label="Đóng">
            ✕
          </button>

          {/* Search Input */}
          <div className="tf-search-input-wrapper">
            <span>🔍</span>
            <input
              type="text"
              className="tf-search-input"
              placeholder="Tìm kiếm sự kiện..."
              value={searchQuery}
              onChange={handleSearchChange}
              autoFocus
            />
            <span>#</span>
          </div>

          {/* Popular Searches */}
          {!searchQuery && (
            <>
              <div className="tf-search-section-title">Tìm kiếm phổ biến</div>
              <div className="tf-popular-list">
                {POPULAR_SEARCHES.map((term) => (
                  <button key={term} className="tf-popular-item" onClick={() => pick(term)}>
                    ↗ {term}
                  </button>
                ))}
              </div>
            </>
          )}

          {/* Suggestions */}
          {searchQuery && suggestions.length > 0 && (
            <div className="tf-suggestion-list">
              {suggestions.map((s) => (
                <button key={s} className="tf-suggestion-item" onClick={() => pick(s)}>
                  {s}
                </button>
              ))}
            </div>
          )}

          {/* Tabs + Explore */}
          {!searchQuery && (
            <>
              <div className="tf-tabs">
                <button
                  className={`tf-tab ${activeTab === "category" ? "active" : ""}`}
                  onClick={() => setActiveTab("category")}
                >
                  Khám phá theo Thể loại
                </button>
                <button
                  className={`tf-tab ${activeTab === "city" ? "active" : ""}`}
                  onClick={() => setActiveTab("city")}
                >
                  Khám phá theo Thành phố
                </button>
              </div>

              {activeTab === "category" && (
                <div className="tf-category-grid">
                  {CATEGORIES.map((c) => (
                    <div key={c.id} className="tf-category-card" onClick={() => pick(c.name)}>
                      <div className="tf-category-img" style={{ backgroundImage: `url(${c.image})` }} />
                      <div className="tf-category-name">{c.name}</div>
                    </div>
                  ))}
                </div>
              )}

              {activeTab === "city" && (
                <div className="tf-city-list">
                  {CITIES.map((city) => (
                    <button key={city} className="tf-city-item" onClick={() => pick(city)}>
                      {city}
                    </button>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </>
  );
};
