import React, { useState } from "react";
import { View, UserInfo } from "../utils/types";

interface NavbarProps {
  currentView: View;
  setView: (v: View) => void;
  user: UserInfo | null;
  onLogout: () => void;
  onSearchClick?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentView,
  setView,
  user,
  onLogout,
  onSearchClick,
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
        <div className="navbar-left" onClick={() => setView("home")}>
          <span className="logo-text">ticketfast</span>
        </div>
        
        {/* Search Bar in Center */}
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

        <nav className="navbar-right">
          {user && user.role === "admin" && (
            <button
              className="btn-create-event"
              onClick={() => setView("admin")}
            >
              Tạo sự kiện
            </button>
          )}
          {user && (
            <button
              className="nav-ticket-button"
              onClick={() => handleNavigate("booking")}
            >
              <span className="ticket-text">Vé của tôi</span>
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
            <div className="user-menu" onBlur={() => setMenuOpen(false)} tabIndex={0}>
              <button className="user-menu-button" type="button" onClick={handleMenuClick}>
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
                    onClick={() => handleNavigate("home")}
                  >
                    <span>Sự kiện của tôi</span>
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
      {currentView === "home" && (
        <nav className="category-nav">
          <button className="category-link">nhạc sống</button>
          <button className="category-link">sân khấu & nghệ thuật</button>
          <button className="category-link">thể thao</button>
          <button className="category-link">khác</button>
        </nav>
      )}
    </>
  );
};


