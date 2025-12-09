import React, { useEffect, useState } from "react";
import "./styles/App.css";
import { View, UserInfo } from "./utils/types";
import { Navbar } from "./components/Navbar";
import { AuthForm } from "./components/AuthForm";
import { Home } from "./components/Home";
import { AdminPage } from "./components/AdminPage";
import { ShowbizPage } from "./pages/ShowbizPage";
import { BlogsPage } from "./pages/BlogsPage";
import { BookingPage } from "./pages/BookingPage";
import { ChangePasswordPage } from "./pages/ChangePasswordPage";
import { ForgotPasswordPage } from "./pages/ForgotPasswordPage";
import { ProfilePage } from "./pages/ProfilePage";
import { VerifyEmailPage } from "./pages/VerifyEmailPage"; // 💡 thêm mới

const App: React.FC = () => {
  const [view, setView] = useState<View>("home");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<UserInfo | null>(null);

  // Khi load lại trang, nếu trong localStorage vẫn còn token hợp lệ thì tự khôi phục trạng thái đăng nhập.
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;

    try {
      const [, payloadBase64] = token.split(".");
      if (!payloadBase64) return;

      const payloadJson = atob(payloadBase64.replace(/-/g, "+").replace(/_/g, "/"));
      const payload = JSON.parse(payloadJson) as {
        email?: string;
        name?: string;
        role?: "user" | "admin";
        exp?: number;
      };

      // Nếu token đã hết hạn thì xoá luôn.
      if (payload.exp && payload.exp * 1000 < Date.now()) {
        localStorage.removeItem("token");
        return;
      }

      if (payload.email && payload.name) {
        setUser({ name: payload.name, email: payload.email, role: payload.role || "user" });
      }
    } catch {
      // Token không hợp lệ thì xoá.
      localStorage.removeItem("token");
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("pendingEmailVerify"); // xoá luôn email đang chờ verify (nếu có)
    setUser(null);
    setView("home");
  };

  return (
    <div className="app-root">
      <Navbar currentView={view} setView={setView} user={user} onLogout={handleLogout} />

      <main className="main-content">
        {view === "home" && <Home user={user} setView={setView} />}
        {view === "showbiz" && <ShowbizPage />}
        {view === "blogs" && <BlogsPage />}
        {view === "booking" && <BookingPage user={user} />}
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
