import React, { useEffect, useState } from "react";
import { API_BASE } from "../utils/api";
import { UserInfo, View } from "../utils/types";

// Trang /booking/*: CHỈ để xem "Vé của tôi".
// Nếu booking đang "pending" => cho phép "Tiếp tục thanh toán" bằng cách:
// localStorage.setItem("paymentBookingId", bookingId) rồi setView("payment")

interface BookingItem {
  _id: string;
  eventId: string;
  eventTitle: string;
  ticketTypeName?: string;
  quantity: number;
  unitPrice: number;
  totalAmount: number;
  paymentMethod: "momo" | "credit_card" | "bank_transfer";
  status: "pending" | "paid" | "failed" | "cancelled" | "expired";
  expiresAt?: string;
  createdAt: string;
}

interface BookingPageProps {
  user: UserInfo | null;
  setView: (v: View) => void;
}

export const BookingPage: React.FC<BookingPageProps> = ({ user, setView }) => {
  const [myBookings, setMyBookings] = useState<BookingItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadMyBookings = async () => {
    const token = localStorage.getItem("token");
    if (!token) return;

    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/bookings`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Không tải được vé của bạn");

      setMyBookings(data.bookings || []);
    } catch (e: any) {
      setError(e?.message || "Có lỗi xảy ra");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!user) return;
    loadMyBookings().catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const statusLabel = (s: BookingItem["status"]) => {
    switch (s) {
      case "pending":
        return "Đang giữ vé";
      case "paid":
        return "Đã thanh toán";
      case "failed":
        return "Thất bại";
      case "cancelled":
        return "Đã hủy";
      case "expired":
        return "Hết hạn";
      default:
        return s;
    }
  };

  const statusClass = (s: BookingItem["status"]) => {
    if (s === "paid") return "paid";
    if (s === "pending") return "pending";
    if (s === "expired" || s === "failed" || s === "cancelled") return "bad";
    return "";
  };

  const continuePayment = (bookingId: string) => {
    // PaymentPage của bạn đang dùng localStorage để lấy bookingId
    localStorage.setItem("paymentBookingId", bookingId);
    setView("payment");
  };

  if (!user) {
    return (
      <div className="booking-page">
        <div className="booking-layout booking-layout--single">
          <div className="booking-card">
            <div className="side-header">
              <h2 className="side-title">Vé của tôi</h2>
            </div>
            <p className="booking-subtitle" style={{ marginTop: 8 }}>
              Vui lòng đăng nhập để xem vé của bạn.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="booking-page">
      <div className="booking-layout booking-layout--single">
        <div className="booking-card">
          <div className="side-header">
            <h2 className="side-title">Vé của tôi</h2>
            <button
              type="button"
              className="btn outline small"
              onClick={() => loadMyBookings().catch(() => {})}
              disabled={loading}
            >
              {loading ? "..." : "Tải lại"}
            </button>
          </div>

          {error && <div className="global-message error">{error}</div>}

          {myBookings.length === 0 ? (
            <p className="booking-subtitle" style={{ marginTop: 8 }}>
              Bạn chưa có đơn đặt vé nào.
            </p>
          ) : (
            <div className="mybooking-list" style={{ marginTop: 12 }}>
              {myBookings.map((b) => (
                <div key={b._id} className="mybooking-item">
                  <div className="mybooking-top">
                    <div className="mybooking-title">
                      {b.eventTitle}
                      {b.ticketTypeName ? (
                        <span className="mybooking-type"> • {b.ticketTypeName}</span>
                      ) : null}
                    </div>
                    <span className={`status-pill ${statusClass(b.status)}`}>
                      {statusLabel(b.status)}
                    </span>
                  </div>

                  <div className="mybooking-meta">
                    <span>
                      SL: <b>{b.quantity}</b>
                    </span>
                    <span className="dot">•</span>
                    <span>
                      Tổng: <b>{b.totalAmount.toLocaleString()}đ</b>
                    </span>
                  </div>

                  <div className="mybooking-sub">
                    {b.expiresAt ? (
                      <span>Hết hạn: {new Date(b.expiresAt).toLocaleString("vi-VN")}</span>
                    ) : (
                      <span>Tạo lúc: {new Date(b.createdAt).toLocaleString("vi-VN")}</span>
                    )}
                  </div>

                  {/* ✅ pending thì cho tiếp tục thanh toán */}
                  {b.status === "pending" && (
                    <div
                      style={{
                        marginTop: 10,
                        display: "flex",
                        justifyContent: "flex-end",
                      }}
                    >
                      <button
                        type="button"
                        className="btn"
                        onClick={() => continuePayment(b._id)}
                      >
                        Tiếp tục thanh toán
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
