import React, { useState } from "react";
import { API_BASE } from "../utils/api";
import { UserInfo } from "../utils/types";

interface BookingPageProps {
  user: UserInfo | null;
}

export const BookingPage: React.FC<BookingPageProps> = ({ user }) => {
  const [eventName, setEventName] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [paymentMethod, setPaymentMethod] = useState("credit_card");
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("Bạn cần đăng nhập để đặt vé");
      }
      const res = await fetch(`${API_BASE}/bookings`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          eventName,
          quantity,
          paymentMethod,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Đặt vé thất bại");
      }
      setSuccess(`Đặt vé thành công. Mã đơn: ${data.booking._id}`);
      setEventName("");
      setQuantity(1);
    } catch (err: any) {
      setError(err.message || "Có lỗi xảy ra");
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <section className="auth-section">
        <div className="auth-card">
          <h1>Đặt vé sự kiện</h1>
          <p className="subtitle">Vui lòng đăng nhập để tiếp tục đặt vé và thanh toán.</p>
        </div>
      </section>
    );
  }

  return (
    <section className="auth-section">
      <div className="auth-card">
        <h1>Đặt vé & thanh toán</h1>
        <p className="subtitle">
          Nhập thông tin sự kiện và số lượng vé. Thanh toán được mô phỏng (mock).
        </p>
        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label>Tên sự kiện</label>
            <input
              type="text"
              value={eventName}
              onChange={(e) => setEventName(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label>Số lượng vé</label>
            <input
              type="number"
              min={1}
              value={quantity}
              onChange={(e) => setQuantity(Number(e.target.value))}
              required
            />
          </div>
          <div className="form-group">
            <label>Phương thức thanh toán</label>
            <select
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
            >
              <option value="credit_card">Thẻ tín dụng</option>
              <option value="momo">Ví MoMo</option>
              <option value="bank_transfer">Chuyển khoản</option>
            </select>
          </div>
          <button type="submit" className="btn primary full-width" disabled={loading}>
            {loading ? "Đang xử lý..." : "Thanh toán & đặt vé"}
          </button>
          {error && <div className="global-message error">{error}</div>}
          {success && <div className="global-message">{success}</div>}
        </form>
      </div>
    </section>
  );
};


