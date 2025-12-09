import React, { useState } from "react";
import { API_BASE } from "../utils/api";
import { View } from "../utils/types";

interface ForgotPasswordPageProps {
  setError: (e: string | null) => void;
  setLoading: (v: boolean) => void;
  setView: (v: View) => void;
}

export const ForgotPasswordPage: React.FC<ForgotPasswordPageProps> = ({
  setError,
  setLoading,
  setView,
}) => {
  const [email, setEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [success, setSuccess] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/auth/reset-password-simple`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, newPassword }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Khôi phục mật khẩu thất bại");
      }
      setSuccess("Đặt lại mật khẩu thành công, hãy đăng nhập lại.");
      setTimeout(() => setView("login"), 1500);
    } catch (err: any) {
      setError(err.message || "Có lỗi xảy ra");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="auth-section">
      <div className="auth-card">
        <h1>Quên mật khẩu</h1>
        <p className="subtitle">
          Nhập email đăng ký và mật khẩu mới để đặt lại mật khẩu (demo, không cần email thật).
        </p>
        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label>Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label>Mật khẩu mới</label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              minLength={6}
            />
          </div>
          <button type="submit" className="btn primary full-width">
            Đặt lại mật khẩu
          </button>
          {success && <div className="global-message">{success}</div>}
        </form>
      </div>
    </section>
  );
};


