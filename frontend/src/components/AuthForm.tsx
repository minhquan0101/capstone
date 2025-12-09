import React, { useState } from "react";
import { View, UserInfo } from "../utils/types";
import { login, register } from "../utils/api";


interface AuthFormProps {
  mode: "login" | "register";
  setView: (v: View) => void;
  setUser: (u: UserInfo) => void;
  setError: (e: string | null) => void;
  setLoading: (v: boolean) => void;
}


export const AuthForm: React.FC<AuthFormProps> = ({
  mode,
  setView,
  setUser,
  setError,
  setLoading,
}) => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);


    try {
      if (mode === "register") {
        const trimmedName = name.trim();
        // Chỉ cho phép chữ cái (kể cả tiếng Việt cơ bản) và khoảng trắng
        const nameRegex = /^[A-Za-zÀ-ÖØ-öø-ÿ\s]+$/;
        if (!trimmedName || !nameRegex.test(trimmedName)) {
          setLoading(false);
          setError("Họ tên chỉ được chứa chữ cái và khoảng trắng");
          return;
        }
        if (password !== confirmPassword) {
          setLoading(false);
          setError("Mật khẩu nhập lại không khớp");
          return;
        }
      }


      const authResponse =
        mode === "login"
          ? await login(email, password)
          : await register(name.trim(), email, password);


      // Trường hợp backend yêu cầu xác minh email
      if (authResponse.requireEmailVerification) {
        // lưu email để màn verify tự fill
        if (email) {
          localStorage.setItem("pendingEmailVerify", email);
        }


        if (authResponse.message) {
          setError(authResponse.message);
        } else if (mode === "register") {
          setError("Đăng ký thành công. Vui lòng kiểm tra email để lấy mã xác minh.");
        } else {
          setError(
            "Tài khoản chưa xác minh email. Vui lòng kiểm tra email hoặc nhập mã xác minh."
          );
        }


        setView("verifyEmail");
        return;
      }


      // Trường hợp login/register bình thường (đã verify email)
      if (authResponse.token && authResponse.user) {
        localStorage.setItem("token", authResponse.token);
        setUser({
          name: authResponse.user.name,
          email: authResponse.user.email,
          role: authResponse.user.role || "user",
        });
        setView("home");
      } else if (authResponse.message) {
        setError(authResponse.message);
      }
    } catch (err: any) {
      setError(err.message || "Có lỗi xảy ra");
    } finally {
      setLoading(false);
    }
  };


  return (
    <section className="auth-section">
      <div className="auth-card">
        <h1>{mode === "login" ? "Đăng nhập" : "Đăng ký tài khoản"}</h1>
        <p className="subtitle">
          {mode === "login"
            ? "Đăng nhập để đặt vé và quản lý đơn hàng của bạn."
            : "Tạo tài khoản để bắt đầu đặt vé sự kiện yêu thích."}
        </p>
        <form onSubmit={handleSubmit} className="auth-form">
          {mode === "register" && (
            <div className="form-group">
              <label>Họ và tên</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Nhập họ tên của bạn"
                required
              />
            </div>
          )}
          <div className="form-group">
            <label>Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
            />
          </div>
          <div className="form-group">
            <label>Mật khẩu</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              minLength={6}
            />
          </div>
          {mode === "register" && (
            <div className="form-group">
              <label>Nhập lại mật khẩu</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Nhập lại mật khẩu"
                required
                minLength={6}
              />
            </div>
          )}
          <button type="submit" className="btn primary full-width">
            {mode === "login" ? "Đăng nhập" : "Đăng ký"}
          </button>
        </form>
        {mode === "login" && (
          <p className="switch-text">
            Quên mật khẩu?{" "}
            <button
              type="button"
              className="link-button"
              onClick={() => setView("forgotPassword")}
            >
              Khôi phục mật khẩu
            </button>
          </p>
        )}
        <p className="switch-text">
          {mode === "login" ? (
            <>
              Chưa có tài khoản?{" "}
              <button
                type="button"
                className="link-button"
                onClick={() => setView("register")}
              >
                Đăng ký ngay
              </button>
            </>
          ) : (
            <>
              Đã có tài khoản?{" "}
              <button
                type="button"
                className="link-button"
                onClick={() => setView("login")}
              >
                Đăng nhập
              </button>
            </>
          )}
        </p>
      </div>
    </section>
  );
};
