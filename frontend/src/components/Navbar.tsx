import React, { useState } from "react";
import { View, UserInfo } from "../utils/types";

interface NavbarProps {
  currentView: View;
  setView: (v: View) => void;
  user: UserInfo | null;
  onLogout: () => void;
  onSearchClick?: () => void;
  selectedTags?: string[];
  onTagToggle?: (tag: string) => void;
  onClearTags?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentView,
  setView,
  user,
  onLogout,
  onSearchClick,
  selectedTags = [],
  onTagToggle,
  onClearTags,
}) => {
  const [menuOpen, setMenuOpen] = useState(false);

  const handleMenuClick = () => {
    setMenuOpen((prev) => !prev);
  };

  const handleNavigate = (view: View) => {
    setView(view);
    setMenuOpen(false);
  };

  return (
    <>
      <header className="navbar">
        {/* Left: Logo */}
        <div className="navbar-left" onClick={() => setView("home")}>
          <span className="logo-text">ticketfast</span>
        </div>

        {/* Center: Search Bar (from khanh branch) */}
        {onSearchClick && (
          <div className="navbar-search">
            <div className="search-bar-wrapper" onClick={onSearchClick}>
              <span className="search-bar-placeholder">Bạn tìm gì hôm nay?</span>
              <button className="search-bar-button" type="button">
                Tìm kiếm
              </button>
            </div>
          </div>
        )}

        {/* Right: Navigation & User Menu */}
        <nav className="navbar-right">
          {/* Main Links (from main branch) */}
          <button
            className={`nav-link ${currentView === "home" ? "active" : ""}`}
            onClick={() => setView("home")}
          >
            Trang chủ
          </button>

          <button
            className={`nav-link ${currentView === "showbiz" ? "active" : ""}`}
            onClick={() => setView("showbiz")}
          >
            ShowBiz
          </button>

          <button
            className={`nav-link ${currentView === "blogs" ? "active" : ""}`}
            onClick={() => setView("blogs")}
          >
            Blogs / News
          </button>

          {/* Conditional Admin/User Buttons */}
          {user && user.role === "admin" && (
            <button
              className="btn-create-event"
              onClick={() => setView("admin")}
            >
              Tạo sự kiện
            </button>
          )}

          {!user ? (
            /* Login Button for guests */
            <button
              className={`btn outline ${currentView === "login" ? "active" : ""}`}
              onClick={() => setView("login")}
            >
              đăng nhập
            </button>
          ) : (
            /* User Menu Dropdown */
            <div
              className="user-menu"
              tabIndex={0}
              onBlur={(e) => {
                const next = e.relatedTarget as Node | null;
                if (!next || !e.currentTarget.contains(next)) {
                  setMenuOpen(false);
                }
              }}
            >
              <button
                className="user-menu-button"
                type="button"
                onClick={handleMenuClick}
              >
                <div className="user-avatar">
                  {user.name.charAt(0).toUpperCase()}
                </div>
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

      {/* Category Sub-nav (Only on Home) */}
      {currentView === "home" && (
        <nav className="category-nav">
          {["nhạc sống", "sân khấu & nghệ thuật", "thể thao", "khác"].map((tag) => {
            const isSelected = selectedTags.includes(tag);
            return (
              <button
                key={tag}
                className={`category-link ${isSelected ? "active" : ""}`}
                onClick={() => onTagToggle?.(tag)}
                style={{
                  border: isSelected ? "2px solid #3b82f6" : "1px solid #d1d5db",
                  backgroundColor: isSelected ? "#eff6ff" : "#fff",
                  color: isSelected ? "#3b82f6" : "#374151",
                  fontWeight: isSelected ? "600" : "400",
                }}
              >
                {tag}
              </button>
            );
          })}
          {selectedTags.length > 0 && onClearTags && (
            <button
              className="category-link"
              onClick={onClearTags}
              style={{
                border: "1px solid #d1d5db",
                backgroundColor: "#fff",
                color: "#6b7280",
              }}
            >
              Xóa bộ lọc
            </button>
          )}
        </nav>
      )}
    </>
  );
};