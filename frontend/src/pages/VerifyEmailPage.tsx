import React, { useEffect, useState } from "react";
import { verifyEmail } from "../utils/api";
import { UserInfo, View } from "../utils/types";

interface VerifyEmailPageProps {
  setView: (v: View) => void;
  setUser: (u: UserInfo) => void;
  setError: (e: string | null) => void;
  setLoading: (v: boolean) => void;
}

export const VerifyEmailPage: React.FC<VerifyEmailPageProps> = ({
  setView,
  setUser,
  setError,
  setLoading,
}) => {
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [infoMessage, setInfoMessage] = useState<string | null>(
    "Vui lòng nhập email và mã xác minh đã được gửi vào hộp thư của bạn."
  );

  // Lấy email đang chờ xác minh từ localStorage (nếu có)
  useEffect(() => {
    const pendingEmail = localStorage.getItem("pendingEmailVerify");
    if (pendingEmail) {
      setEmail(pendingEmail);
      setInfoMessage(
        `Mã xác minh đã được gửi tới ${pendingEmail}. Vui lòng kiểm tra hộp thư (kể cả mục Spam).`
      );
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const data = await verifyEmail(email, code);

      if (data.token && data.user) {
        localStorage.setItem("token", data.token);
        localStorage.removeItem("pendingEmailVerify");

        setUser({
          name: data.user.name,
          email: data.user.email,
          role: data.user.role || "user",
        });

        setView("home");
      } else {
        setError(data.message || "Xác minh email thất bại");
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
        <h2>Xác minh email</h2>
        {infoMessage && <div className="global-message">{infoMessage}</div>}
        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label>Email đã đăng ký</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="Nhập email bạn đã dùng để đăng ký"
            />
          </div>
          <div className="form-group">
            <label>Mã xác minh</label>
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              required
              placeholder="Nhập mã 6 số"
              maxLength={6}
            />
          </div>
          <button type="submit" className="btn primary full-width">
            Xác minh
          </button>
          <p className="switch-text">
            Đã có tài khoản?{" "}
            <button
              type="button"
              className="link-button"
              onClick={() => setView("login")}
            >
              Quay lại đăng nhập
            </button>
          </p>
        </form>
      </div>
    </section>
  );
};


export default VerifyEmailPage;