import React, { useEffect, useState } from "react";
import "./styles/App.css";
import { View, UserInfo } from "./utils/types";
import { Navbar } from "./components/Navbar";
import { AuthForm } from "./components/AuthForm";
import { Home } from "./components/Home";
import { AdminPage } from "./components/AdminPage";
import { ShowbizPage } from "./pages/ShowbizPage";
import { ShowbizDetailPage } from "./pages/ShowbizDetailPage";
import { BlogsPage } from "./pages/BlogsPage";
import { BlogDetailPage } from "./pages/BlogDetailPage";
import { BookingPage } from "./pages/BookingPage";
import { ChangePasswordPage } from "./pages/ChangePasswordPage";
import { ForgotPasswordPage } from "./pages/ForgotPasswordPage";
import { ProfilePage } from "./pages/ProfilePage";
import { VerifyEmailPage } from "./pages/VerifyEmailPage";
import { getCurrentUser } from "./utils/api";
import { SeatSelectPage } from "./pages/SeatSelectPage";
import { EventDetail } from "./components/EventDetail";
import { PaymentPage } from "./pages/PaymentPage";

type NavState = { view: View; selectedPostId: string | null };

const App: React.FC = () => {
  const [view, _setView] = useState<View>("home");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<UserInfo | null>(null);
  const [selectedPostId, setSelectedPostId] = useState<string | null>(null);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  // ✅ NEW: search chung cho Navbar -> Showbiz/Blogs
  const [searchTerm, setSearchTerm] = useState("");

  // ===== Helpers for URL <-> View =====
  const pathFor = (v: View, postId: string | null) => {
    const safe = (s?: string | null) => (s ? encodeURIComponent(s) : "");
    const eventId =
      typeof window !== "undefined" ? localStorage.getItem("selectedEventId") : null;

    switch (v) {
      case "home":
        return "/";
      case "showbiz":
        return "/showbiz";
      case "showbizDetail":
        return postId ? `/showbiz/${safe(postId)}` : "/showbiz";
      case "blogs":
        return "/blogs";
      case "blogDetail":
        return postId ? `/blogs/${safe(postId)}` : "/blogs";
      case "event_detail":
        return eventId ? `/event/${safe(eventId)}` : "/event";
      case "booking":
        return eventId ? `/booking/${safe(eventId)}` : "/booking";
      case "payment":
        return "/payment";
      case "profile":
        return "/profile";
      case "admin":
        return "/admin";
      case "login":
        return "/login";
      case "register":
        return "/register";
      case "verifyEmail":
        return "/verify-email";
      case "forgotPassword":
        return "/forgot-password";
      case "changePassword":
        return "/change-password";
      default:
        return "/";
    }
  };

  const parsePath = (pathname: string): NavState => {
    const p = pathname.split("?")[0].split("#")[0];
    const parts = p.split("/").filter(Boolean);

    if (parts.length === 0) return { view: "home", selectedPostId: null };

    // /showbiz or /showbiz/:id
    if (parts[0] === "showbiz") {
      if (parts[1]) return { view: "showbizDetail", selectedPostId: decodeURIComponent(parts[1]) };
      return { view: "showbiz", selectedPostId: null };
    }

    // /blogs or /blogs/:id
    if (parts[0] === "blogs") {
      if (parts[1]) return { view: "blogDetail", selectedPostId: decodeURIComponent(parts[1]) };
      return { view: "blogs", selectedPostId: null };
    }

    // /event/:id
    if (parts[0] === "event") {
      const id = parts[1] ? decodeURIComponent(parts[1]) : null;
      if (id && typeof window !== "undefined") localStorage.setItem("selectedEventId", id);
      return { view: "event_detail", selectedPostId: null };
    }

    // /booking/:id
    if (parts[0] === "booking") {
      const id = parts[1] ? decodeURIComponent(parts[1]) : null;
      if (id && typeof window !== "undefined") localStorage.setItem("selectedEventId", id);
      return { view: "booking", selectedPostId: null };
    }

    if (parts[0] === "payment") return { view: "payment", selectedPostId: null };
    if (parts[0] === "profile") return { view: "profile", selectedPostId: null };
    if (parts[0] === "admin") return { view: "admin", selectedPostId: null };
    if (parts[0] === "login") return { view: "login", selectedPostId: null };
    if (parts[0] === "register") return { view: "register", selectedPostId: null };
    if (parts[0] === "verify-email") return { view: "verifyEmail", selectedPostId: null };
    if (parts[0] === "forgot-password") return { view: "forgotPassword", selectedPostId: null };
    if (parts[0] === "change-password") return { view: "changePassword", selectedPostId: null };

    return { view: "home", selectedPostId: null };
  };

  const pushHistory = (nextView: View, nextPostId: string | null) => {
    if (typeof window === "undefined") return;
    const url = pathFor(nextView, nextPostId);
    const state: NavState = { view: nextView, selectedPostId: nextPostId };
    window.history.pushState(state, "", url);
  };

  // ✅ setView giữ nguyên signature để không phải sửa component con
  const setView = (next: View) => {
    _setView(next);
    // dùng selectedPostId hiện tại
    pushHistory(next, selectedPostId);
  };

  // ===== Init: sync view from URL (để refresh vẫn đúng trang) =====
  useEffect(() => {
    if (typeof window === "undefined") return;

    const init = parsePath(window.location.pathname);
    setSelectedPostId(init.selectedPostId);
    _setView(init.view);

    // đảm bảo history.state có format chuẩn
    window.history.replaceState(
      { view: init.view, selectedPostId: init.selectedPostId } as NavState,
      "",
      window.location.pathname
    );

    const onPopState = (e: PopStateEvent) => {
      const st = (e.state || null) as NavState | null;

      if (st?.view) {
        setSelectedPostId(st.selectedPostId ?? null);
        _setView(st.view);
      } else {
        // fallback parse URL
        const parsed = parsePath(window.location.pathname);
        setSelectedPostId(parsed.selectedPostId);
        _setView(parsed.view);
      }
    };

    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  // ===== Auth restore =====
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;

    try {
      const [, payloadBase64] = token.split(".");
      if (!payloadBase64) {
        localStorage.removeItem("token");
        return;
      }

      const payloadJson = atob(payloadBase64.replace(/-/g, "+").replace(/_/g, "/"));
      const payload = JSON.parse(payloadJson) as { exp?: number };

      if (payload.exp && payload.exp * 1000 < Date.now()) {
        localStorage.removeItem("token");
        return;
      }
    } catch {
      localStorage.removeItem("token");
      return;
    }

    getCurrentUser()
      .then((data) => {
        if (data.user) {
          setUser({
            name: data.user.name,
            email: data.user.email,
            role: data.user.role || "user",
          });
        }
      })
      .catch(() => {
        localStorage.removeItem("token");
      });
  }, []);

  // ✅ reset tags khi rời trang home
  useEffect(() => {
    if (view !== "home") setSelectedTags([]);
  }, [view]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("pendingEmailVerify");
    localStorage.removeItem("paymentBookingId");
    setUser(null);
    setSelectedPostId(null);

    // về home + cập nhật URL để back không quay lại trang protected
    _setView("home");
    if (typeof window !== "undefined") {
      window.history.pushState({ view: "home", selectedPostId: null } as NavState, "", "/");
    }
  };

  // Các view không hiển thị navbar
  const hideNavbarViews: View[] = ["login", "register", "verifyEmail"];
  const shouldShowNavbar = !hideNavbarViews.includes(view);

  // ===== helper điều hướng detail để push history đúng postId =====
  const openShowbizDetail = (postId: string) => {
    setSelectedPostId(postId);
    _setView("showbizDetail");
    pushHistory("showbizDetail", postId);
  };

  const openBlogDetail = (postId: string) => {
    setSelectedPostId(postId);
    _setView("blogDetail");
    pushHistory("blogDetail", postId);
  };

  return (
    <div className="app-root">
      {shouldShowNavbar && (
        <Navbar
          currentView={view}
          setView={setView}
          user={user}
          onLogout={handleLogout}
          selectedTags={selectedTags}
          onTagToggle={(tag) => {
            setSelectedTags((prev) =>
              prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
            );
          }}
          onClearTags={() => setSelectedTags([])}
          // ✅ NEW
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
        />
      )}

      <main className="main-content">
        {view === "home" && <Home user={user} setView={setView} selectedTags={selectedTags} />}

        {/* ✅ TRANG CHI TIẾT SỰ KIỆN */}
        {view === "event_detail" && <EventDetail user={user} setView={setView} />}

        {view === "seatmap" && <SeatSelectPage user={user} setView={setView} />}

        {/* ✅ TRANG THANH TOÁN */}
        {view === "payment" && <PaymentPage setView={setView} />}

        {/* ✅ truyền searchTerm vào Showbiz */}
        {view === "showbiz" && <ShowbizPage onPostClick={openShowbizDetail} searchTerm={searchTerm} />}

        {view === "showbizDetail" && selectedPostId && (
          <ShowbizDetailPage postId={selectedPostId} onBack={() => setView("showbiz")} />
        )}

        {/* ✅ truyền searchTerm vào Blogs */}
        {view === "blogs" && <BlogsPage onPostClick={openBlogDetail} searchTerm={searchTerm} />}

        {view === "blogDetail" && selectedPostId && (
          <BlogDetailPage postId={selectedPostId} onBack={() => setView("blogs")} />
        )}

        {/* ✅ QUAN TRỌNG: truyền setView vào BookingPage */}
        {view === "booking" && <BookingPage user={user} setView={setView} />}

        {view === "changePassword" && (
          <ChangePasswordPage setError={setError} setLoading={setLoading} />
        )}

        {view === "forgotPassword" && (
          <ForgotPasswordPage setError={setError} setLoading={setLoading} setView={setView} />
        )}

        {view === "admin" && user && user.role === "admin" && <AdminPage />}

        {view === "profile" && <ProfilePage user={user} />}

        {view === "login" && (
          <AuthForm
            mode="login"
            setView={setView}
            setUser={setUser}
            setError={setError}
            setLoading={setLoading}
          />
        )}

        {view === "register" && (
          <AuthForm
            mode="register"
            setView={setView}
            setUser={setUser}
            setError={setError}
            setLoading={setLoading}
          />
        )}

        {view === "verifyEmail" && (
          <VerifyEmailPage
            setView={setView}
            setUser={setUser}
            setError={setError}
            setLoading={setLoading}
          />
        )}

        {loading && <div className="global-message">Đang xử lý...</div>}
        {error && <div className="global-message error">{error}</div>}
      </main>
    </div>
  );
};

export default App;
