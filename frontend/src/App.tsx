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
import { VerifyEmailPage } from "./pages/VerifyEmailPage"; // 💡 thêm mới
import { getCurrentUser } from "./utils/api";

const App: React.FC = () => {
  const [view, setView] = useState<View>("home");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<UserInfo | null>(null);
  const [selectedPostId, setSelectedPostId] = useState<string | null>(null);

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
      const payload = JSON.parse(payloadJson) as {
        exp?: number;
      };

      // Nếu token đã hết hạn thì xoá luôn.
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
        {view === "showbiz" && (
          <ShowbizPage
            onPostClick={(postId) => {
              setSelectedPostId(postId);
              setView("showbizDetail");
            }}
          />
        )}
        {view === "showbizDetail" && selectedPostId && (
          <ShowbizDetailPage
            postId={selectedPostId}
            onBack={() => {
              setSelectedPostId(null);
              setView("showbiz");
            }}
          />
        )}
        {view === "blogs" && (
          <BlogsPage
            onPostClick={(postId) => {
              setSelectedPostId(postId);
              setView("blogDetail");
            }}
          />
        )}
        {view === "blogDetail" && selectedPostId && (
          <BlogDetailPage
            postId={selectedPostId}
            onBack={() => {
              setSelectedPostId(null);
              setView("blogs");
            }}
          />
        )}
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