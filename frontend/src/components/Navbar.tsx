import React, { useEffect, useMemo, useRef, useState } from "react";
import { View, UserInfo } from "../utils/types";

interface NavbarProps {
  currentView: View;
  setView: (v: View) => void;
  user: UserInfo | null;
  onLogout: () => void;
  selectedTags?: string[];
  onTagToggle?: (tag: string) => void;
  onClearTags?: () => void;
}

const POPULAR_SEARCHES = ["Nhạc sống", "Sân khấu", "Thể thao", "Workshop", "Hội chợ"];

/**
 * Navbar search behavior (Ticketbox-like):
 * - Gõ tới đâu: Home lọc tới đó (bắn event homeSearchQueryChanged)
 * - Dropdown: nếu có chữ => gợi ý theo event titles (đọc từ localStorage homeEventTitles)
 * - Không có chữ => show popular
 * - Click logo => reset search và về home
 */
export const Navbar: React.FC<NavbarProps> = ({
  currentView,
  setView,
  user,
  onLogout,
  selectedTags = [],
  onTagToggle,
  onClearTags,
}) => {
  const [menuOpen, setMenuOpen] = useState(false);

  // Search dropdown state
  const [searchOpen, setSearchOpen] = useState(false);
  const [q, setQ] = useState("");
  const [titles, setTitles] = useState<string[]>([]);
  const searchBoxRef = useRef<HTMLDivElement | null>(null);

  const handleMenuClick = () => setMenuOpen((prev) => !prev);

  const handleNavigate = (view: View) => {
    setView(view);
    setMenuOpen(false);
  };

  // Load titles from Home -> localStorage (homeEventTitles)
  useEffect(() => {
    try {
      const raw = localStorage.getItem("homeEventTitles");
      if (raw) setTitles(JSON.parse(raw) || []);
    } catch {
      setTitles([]);
    }
  }, []);

  // Keep input in sync with Home's current query (optional but nice)
  useEffect(() => {
    try {
      const saved = localStorage.getItem("homeSearchQuery") || "";
      setQ(saved);
    } catch {}
  }, []);

  const suggestions = useMemo(() => {
    const t = q.trim().toLowerCase();
    if (!t) return [];
    return titles
  .filter((x: string) => x && x.toLowerCase().includes(t))
  .slice(0, 6);

  }, [q, titles]);

  // click outside closes dropdown
  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (!searchBoxRef.current) return;
      if (!searchBoxRef.current.contains(e.target as Node)) setSearchOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  // ESC closes dropdown
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setSearchOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  const publishQuery = (value: string) => {
    localStorage.setItem("homeSearchQuery", value);
    window.dispatchEvent(new CustomEvent("homeSearchQueryChanged", { detail: value }));
  };

  const resetSearchAndGoHome = () => {
    setQ("");
    publishQuery("");
    setSearchOpen(false);
    setView("home");
  };

  const commitSearch = (value: string) => {
    const v = (value ?? "").trim();
    setQ(v);
    publishQuery(v);
    setView("home");
    setSearchOpen(false);
  };

  return (
    <>
      <header className="navbar">
        {/* Left: Logo */}
        <div
          className="navbar-left"
          role="button"
          tabIndex={0}
          onClick={resetSearchAndGoHome}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") resetSearchAndGoHome();
          }}
          style={{ cursor: "pointer" }}
        >
          <span className="logo-text">ticketfast</span>
        </div>

        {/* Center: Search anchored dropdown */}
        <div className="navbar-search" ref={searchBoxRef}>
          <div className={`tb-search ${searchOpen ? "open" : ""}`}>
            <span className="tb-search-icon">🔍</span>

            <input
              className="tb-search-input"
              placeholder="Bạn tìm gì hôm nay?"
              value={q}
              onFocus={() => setSearchOpen(true)}
              onChange={(e) => {
                const v = e.target.value;
                setQ(v);
                setSearchOpen(true);

                // ✅ auto-search: gõ tới đâu Home lọc tới đó
                publishQuery(v.trim());
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") commitSearch(q);
              }}
            />

            {/* ✅ clear button */}
            {q.trim() && (
              <button
                type="button"
                className="tb-search-clear"
                onClick={() => resetSearchAndGoHome()}
                aria-label="Xóa tìm kiếm"
              >
                ✕
              </button>
            )}

            <button className="tb-search-btn" type="button" onClick={() => commitSearch(q)}>
              Tìm kiếm
            </button>
          </div>

          {searchOpen && (
            <div className="tb-search-dropdown">
              {q.trim() ? (
                suggestions.length > 0 ? (
                  suggestions.map((s) => (
                    <button key={s} className="tb-drop-item" onClick={() => commitSearch(s)}>
                      {s}
                    </button>
                  ))
                ) : (
                  <div className="tb-drop-empty">Không có gợi ý</div>
                )
              ) : (
                POPULAR_SEARCHES.map((p) => (
                  <button key={p} className="tb-drop-item" onClick={() => commitSearch(p)}>
                    ↗ {p}
                  </button>
                ))
              )}
            </div>
          )}
        </div>

        {/* Right: User Menu */}
        <nav className="navbar-right">
          {user && user.role === "admin" && (
            <button className="btn-create-event" onClick={() => setView("admin")}>
              Tạo sự kiện
            </button>
          )}

          {!user ? (
            <button
              className={`btn outline ${currentView === "login" ? "active" : ""}`}
              onClick={() => setView("login")}
            >
              đăng nhập
            </button>
          ) : (
            <div
              className="user-menu"
              tabIndex={0}
              onBlur={(e) => {
                const next = e.relatedTarget as Node | null;
                if (!next || !e.currentTarget.contains(next)) setMenuOpen(false);
              }}
            >
              <button className="user-menu-button" type="button" onClick={handleMenuClick}>
                <div className="user-avatar">{user.name.charAt(0).toUpperCase()}</div>
                <span className="user-menu-label">Tài khoản</span>
              </button>

              {menuOpen && (
                <div className="user-menu-dropdown">
                  <button
                    type="button"
                    className="user-menu-item"
                    onClick={() => handleNavigate("booking")}
                  >
                    <span>Vé của tôi</span>
                  </button>

                  <button
                    type="button"
                    className="user-menu-item"
                    onClick={() => handleNavigate("profile")}
                  >
                    <span>Tài khoản của tôi</span>
                  </button>

                  {user.role === "admin" && (
                    <button
                      type="button"
                      className="user-menu-item"
                      onClick={() => handleNavigate("admin")}
                    >
                      <span>Quản trị hệ thống</span>
                    </button>
                  )}

                  <button
                    type="button"
                    className="user-menu-item user-menu-item-danger"
                    onClick={() => {
                      setMenuOpen(false);
                      onLogout();
                    }}
                  >
                    <span>Đăng xuất</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </nav>
      </header>

      {/* Category nav */}
      <nav className="category-nav">
        <button
          className={`category-link ${currentView === "showbiz" ? "active" : ""}`}
          onClick={() => setView("showbiz")}
        >
          ShowBiz
        </button>

        <button
          className={`category-link ${currentView === "blogs" ? "active" : ""}`}
          onClick={() => setView("blogs")}
        >
          Blogs / News
        </button>

        {currentView === "home" && (
          <>
            {["nhạc sống", "sân khấu & nghệ thuật", "thể thao", "khác"].map((tag) => {
              const isSelected = selectedTags.includes(tag);
              return (
                <button
                  key={tag}
                  className={`category-link ${isSelected ? "active" : ""}`}
                  onClick={() => onTagToggle?.(tag)}
                >
                  {tag}
                </button>
              );
            })}

            {selectedTags.length > 0 && onClearTags && (
              <button className="category-link" onClick={onClearTags}>
                Xóa bộ lọc
              </button>
            )}
          </>
        )}
      </nav>
    </>
  );
};
