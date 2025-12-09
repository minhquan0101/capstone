import React, { useState } from "react";
import { API_BASE } from "../utils/api";

interface ChangePasswordPageProps {
  setError: (e: string | null) => void;
  setLoading: (v: boolean) => void;
}

export const ChangePasswordPage: React.FC<ChangePasswordPageProps> = ({
  setError,
  setLoading,
}) => {
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [success, setSuccess] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);
    try {
      if (newPassword !== confirmNewPassword) {
        setLoading(false);
        setError("Mật khẩu mới nhập lại không khớp");
        return;
      }

      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("Bạn cần đăng nhập để đổi mật khẩu");
      }
      const res = await fetch(`${API_BASE}/auth/change-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ oldPassword, newPassword }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Đổi mật khẩu thất bại");
      }
      setSuccess("Đổi mật khẩu thành công");
      setOldPassword("");
      setNewPassword("");
      setConfirmNewPassword("");
    } catch (err: any) {
      setError(err.message || "Có lỗi xảy ra");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="auth-section">
      <div className="auth-card">
        <h1>Đổi mật khẩu</h1>
        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label>Mật khẩu hiện tại</label>
            <input
              type="password"
              value={oldPassword}
              onChange={(e) => setOldPassword(e.target.value)}
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
          <div className="form-group">
            <label>Nhập lại mật khẩu mới</label>
            <input
              type="password"
              value={confirmNewPassword}
              onChange={(e) => setConfirmNewPassword(e.target.value)}
              required
              minLength={6}
            />
          </div>
          <button type="submit" className="btn primary full-width">
            Cập nhật mật khẩu
          </button>
          {success && <div className="global-message">{success}</div>}
        </form>
      </div>
    </section>
  );
};


