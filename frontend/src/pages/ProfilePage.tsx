import React from "react";
import { UserInfo } from "../utils/types";

interface ProfilePageProps {
  user: UserInfo | null;
}

export const ProfilePage: React.FC<ProfilePageProps> = ({ user }) => {
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
      </div>
    </section>
  );
};


