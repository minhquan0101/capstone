import React, { useState } from "react";
import { UserInfo } from "../utils/types";
import { API_BASE } from "../utils/api";

interface ProfilePageProps {
  user: UserInfo | null;
}

export const ProfilePage: React.FC<ProfilePageProps> = ({ user }) => {
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError(null);
    setPasswordSuccess(null);
    setIsChangingPassword(true);

    try {
      if (newPassword !== confirmNewPassword) {
        setPasswordError("Mật khẩu mới nhập lại không khớp");
        setIsChangingPassword(false);
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

      setPasswordSuccess("Đổi mật khẩu thành công");
      setOldPassword("");
      setNewPassword("");
      setConfirmNewPassword("");
    } catch (err: any) {
      setPasswordError(err.message || "Có lỗi xảy ra");
    } finally {
      setIsChangingPassword(false);
    }
  };

  if (!user) {
    return (
      <section className="auth-section">
        <div className="auth-card">
          <h1>Hồ sơ người dùng</h1>
          <p className="subtitle">Bạn cần đăng nhập để xem thông tin hồ sơ.</p>
        </div>
      </section>
    );
  }

  return (
    <section className="auth-section">
      <div className="auth-card">
        <h1>Hồ sơ của bạn</h1>
        <p className="subtitle">Thông tin tài khoản hiện tại.</p>
        <div className="auth-form">
          <div className="form-group">
            <label>Họ và tên</label>
            <input value={user.name} readOnly />
          </div>
          <div className="form-group">
            <label>Email</label>
            <input value={user.email} readOnly />
          </div>
          <div className="form-group">
            <label>Vai trò</label>
            <input value={user.role === "admin" ? "Quản trị viên" : "Người dùng"} readOnly />
          </div>
        </div>

        <div style={{ marginTop: "2rem", paddingTop: "2rem", borderTop: "1px solid #e0e0e0" }}>
          <h2 style={{ marginBottom: "1rem", fontSize: "1.25rem" }}>Đổi mật khẩu</h2>
          <form onSubmit={handleChangePassword} className="auth-form">
            <div className="form-group">
              <label>Mật khẩu hiện tại</label>
              <input
                type="password"
                value={oldPassword}
                onChange={(e) => setOldPassword(e.target.value)}
                required
                disabled={isChangingPassword}
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
                disabled={isChangingPassword}
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
                disabled={isChangingPassword}
              />
            </div>
            <button
              type="submit"
              className="btn primary full-width"
              disabled={isChangingPassword}
            >
              {isChangingPassword ? "Đang xử lý..." : "Cập nhật mật khẩu"}
            </button>
            {passwordError && <div className="global-message error">{passwordError}</div>}
            {passwordSuccess && <div className="global-message">{passwordSuccess}</div>}
          </form>
        </div>
      </div>
    </section>
  );
};


