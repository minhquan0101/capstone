import React, { useState } from "react";
import { View, UserInfo } from "../utils/types";

interface NavbarProps {
  currentView: View;
  setView: (v: View) => void;
  user: UserInfo | null;
  onLogout: () => void;
  onSearchClick?: () => void;
  selectedTag?: string | null;
  onTagSelect?: (tag: string | null) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentView,
  setView,
  user,
  onLogout,
  onSearchClick,
  selectedTag,
  onTagSelect,
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
          <button 
            className={`category-link ${selectedTag === "nhạc sống" ? "active" : ""}`}
            onClick={() => onTagSelect?.(selectedTag === "nhạc sống" ? null : "nhạc sống")}
          >
            nhạc sống
          </button>
          <button 
            className={`category-link ${selectedTag === "sân khấu & nghệ thuật" ? "active" : ""}`}
            onClick={() => onTagSelect?.(selectedTag === "sân khấu & nghệ thuật" ? null : "sân khấu & nghệ thuật")}
          >
            sân khấu & nghệ thuật
          </button>
          <button 
            className={`category-link ${selectedTag === "thể thao" ? "active" : ""}`}
            onClick={() => onTagSelect?.(selectedTag === "thể thao" ? null : "thể thao")}
          >
            thể thao
          </button>
          <button 
            className={`category-link ${selectedTag === "khác" ? "active" : ""}`}
            onClick={() => onTagSelect?.(selectedTag === "khác" ? null : "khác")}
          >
            khác
          </button>
        </nav>
      )}
    </>
  );
};