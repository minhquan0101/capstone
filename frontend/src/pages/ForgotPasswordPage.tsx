import React, { useState } from "react";
import { requestResetPassword, resetPassword } from "../utils/api";
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
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [step, setStep] = useState<"email" | "reset">("email");
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoadingLocal] = useState(false);
  const [error, setErrorLocal] = useState<string | null>(null);

  const handleRequestCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorLocal(null);
    setError(null);
    setSuccess(null);
    setLoadingLocal(true);
    setLoading(true);
    try {
      await requestResetPassword(email);
      setSuccess("Mã xác minh đã được gửi đến email của bạn. Vui lòng kiểm tra email.");
      setStep("reset");
    } catch (err: any) {
      const errorMessage = err.message || "Có lỗi xảy ra";
      setErrorLocal(errorMessage);
      setError(errorMessage);
    } finally {
      setLoadingLocal(false);
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorLocal(null);
    setError(null);
    setSuccess(null);
    setLoadingLocal(true);
    setLoading(true);
    try {
      await resetPassword(email, code, newPassword);
      setSuccess("Đặt lại mật khẩu thành công. Đang chuyển đến trang đăng nhập...");
      setTimeout(() => setView("login"), 2000);
    } catch (err: any) {
      const errorMessage = err.message || "Có lỗi xảy ra";
      setErrorLocal(errorMessage);
      setError(errorMessage);
    } finally {
      setLoadingLocal(false);
      setLoading(false);
    }
  };

  return (
    <section className="auth-section">
      <div className="auth-card">
        <h1>Quên mật khẩu</h1>
        {step === "email" ? (
          <>
            <p className="subtitle">
              Nhập email đăng ký để nhận mã xác minh qua email.
            </p>
            <form onSubmit={handleRequestCode} className="auth-form">
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
              <button type="submit" className="btn primary full-width" disabled={loading}>
                {loading ? "Đang gửi..." : "Gửi mã xác minh"}
              </button>
              {success && <div className="global-message">{success}</div>}
              {error && <div className="global-message error">{error}</div>}
            </form>
          </>
        ) : (
          <>
            <p className="subtitle">
              Nhập mã xác minh đã được gửi đến email và mật khẩu mới.
            </p>
            <form onSubmit={handleResetPassword} className="auth-form">
              <div className="form-group">
                <label>Email</label>
                <input
                  type="email"
                  value={email}
                  disabled
                  style={{ backgroundColor: "#f3f4f6", cursor: "not-allowed" }}
                />
              </div>
              <div className="form-group">
                <label>Mã xác minh</label>
                <input
                  type="text"
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  placeholder="Nhập mã 6 số"
                  required
                  maxLength={6}
                  style={{ letterSpacing: "0.5em", textAlign: "center", fontSize: "1.2em" }}
                />
              </div>
              <div className="form-group">
                <label>Mật khẩu mới</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  minLength={6}
                />
              </div>
              <button type="submit" className="btn primary full-width" disabled={loading}>
                {loading ? "Đang xử lý..." : "Đặt lại mật khẩu"}
              </button>
              <button
                type="button"
                className="btn outline full-width"
                onClick={() => {
                  setStep("email");
                  setCode("");
                  setNewPassword("");
                  setErrorLocal(null);
                  setError(null);
                  setSuccess(null);
                }}
                style={{ marginTop: 8 }}
              >
                Quay lại
              </button>
              {success && <div className="global-message">{success}</div>}
              {error && <div className="global-message error">{error}</div>}
            </form>
          </>
        )}
      </div>
    </section>
  );
};


