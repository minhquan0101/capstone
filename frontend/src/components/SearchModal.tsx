import React, { useState, useEffect } from "react";
import { Event } from "../utils/api";

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  allEvents: Event[];
  onSearch: (query: string) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
}

const POPULAR_SEARCHES = [
  "Nhạc sống",
  "Sân khấu",
  "Thể thao",
  "Workshop",
  "Hội chợ",
];

const CATEGORIES = [
  {
    id: "music",
    name: "Nhạc sống",
    image: "https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=400&h=300&fit=crop",
  },
  {
    id: "theater",
    name: "Sân khấu & Nghệ thuật",
    image: "https://images.unsplash.com/photo-1503095396549-807759245b35?w=400&h=300&fit=crop",
  },
  {
    id: "sports",
    name: "Thể Thao",
    image: "https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=400&h=300&fit=crop",
  },
  {
    id: "other",
    name: "Khác",
    image: "https://images.unsplash.com/photo-1513475382585-d06e58bcb0e0?w=400&h=300&fit=crop",
  },
];

const CITIES = [
  "Hồ Chí Minh",
  "Hà Nội",
  "Đà Nẵng",
  "Hải Phòng",
  "Cần Thơ",
];

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

    // Handle ESC key to close modal
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    // Không block scroll của body
    document.body.style.overflow = "auto";

    document.addEventListener("keydown", handleEsc);
    return () => {
      document.removeEventListener("keydown", handleEsc);
      document.body.style.overflow = "auto";
    };
  }, [isOpen, onClose]);

  useEffect(() => {
    if (searchQuery.trim()) {
      // Generate suggestions from event titles
      const eventTitles = allEvents
        .map((e) => e.title)
        .filter((title) =>
          title.toLowerCase().includes(searchQuery.toLowerCase())
        )
        .slice(0, 5);
      setSuggestions(eventTitles);
    } else {
      setSuggestions([]);
    }
  }, [searchQuery, allEvents]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchQuery(value);
    if (value.trim()) {
      onSearch(value);
    }
  };

  const handlePopularClick = (term: string) => {
    setSearchQuery(term);
    onSearch(term);
  };

  const handleSuggestionClick = (suggestion: string) => {
    setSearchQuery(suggestion);
    onSearch(suggestion);
  };

  if (!isOpen) return null;

  return (
    <>
      <div 
        className="search-overlay" 
        onClick={onClose}
        style={{ pointerEvents: 'auto' }}
      />
      <div className="search-modal" onClick={(e) => e.stopPropagation()}>
        <div className="search-modal-content">
          <button className="search-modal-close" onClick={onClose} aria-label="Đóng">
            ✕
          </button>
          {/* Search Input */}
          <div className="search-input-wrapper">
            <div className="search-icon">🔍</div>
            <input
              type="text"
              className="search-modal-input"
              placeholder="Tìm kiếm sự kiện..."
              value={searchQuery}
              onChange={handleSearchChange}
              autoFocus
            />
            <div className="search-hashtag">#</div>
          </div>

          {/* Popular Searches */}
          {!searchQuery && (
            <div className="popular-searches">
              <div className="popular-searches-title">Tìm kiếm phổ biến</div>
              <div className="popular-searches-list">
                {POPULAR_SEARCHES.map((term, index) => (
                  <button
                    key={index}
                    className="popular-search-item"
                    onClick={() => handlePopularClick(term)}
                  >
                    <span className="trending-icon">↗</span>
                    {term}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Suggestions */}
          {searchQuery && suggestions.length > 0 && (
            <div className="search-suggestions">
              {suggestions.map((suggestion, index) => (
                <button
                  key={index}
                  className="suggestion-item"
                  onClick={() => handleSuggestionClick(suggestion)}
                >
                  {suggestion}
                </button>
              ))}
            </div>
          )}

          {/* Tabs */}
          {!searchQuery && (
            <>
              <div className="search-tabs">
                <button
                  className={`search-tab ${activeTab === "category" ? "active" : ""}`}
                  onClick={() => setActiveTab("category")}
                >
                  Khám phá theo Thể loại
                </button>
                <button
                  className={`search-tab ${activeTab === "city" ? "active" : ""}`}
                  onClick={() => setActiveTab("city")}
                >
                  Khám phá theo Thành phố
                </button>
              </div>

              {/* Category Cards */}
              {activeTab === "category" && (
                <div className="category-cards">
                  {CATEGORIES.map((category) => (
                    <div
                      key={category.id}
                      className="category-card"
                      onClick={() => handlePopularClick(category.name)}
                    >
                      <div
                        className="category-card-image"
                        style={{ backgroundImage: `url(${category.image})` }}
                      />
                      <div className="category-card-name">{category.name}</div>
                    </div>
                  ))}
                </div>
              )}

              {/* City List */}
              {activeTab === "city" && (
                <div className="city-list">
                  {CITIES.map((city, index) => (
                    <button
                      key={index}
                      className="city-item"
                      onClick={() => handlePopularClick(city)}
                    >
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

