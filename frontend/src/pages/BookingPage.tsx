import React, { useEffect, useMemo, useState } from "react";
import { API_BASE } from "../utils/api";
import { UserInfo } from "../utils/types";

interface TicketTypeItem {
  _id: string;
  name: string;
  price: number;
  total: number;
  sold?: number;
  held?: number;
}

interface EventItem {
  _id: string;
  title: string;
  location?: string;
  date?: string;
  price?: number;
  ticketsTotal?: number;
  ticketsSold?: number;
  ticketsHeld?: number;

  // ✅ nếu event chia hạng vé thì backend trả kèm
  ticketTypes?: TicketTypeItem[];
}

interface BookingItem {
  _id: string;
  eventId: string;
  eventTitle: string;

  // ✅ thêm để hiển thị hạng vé trong "Vé của tôi"
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
}

export const BookingPage: React.FC<BookingPageProps> = ({ user }) => {
  const [events, setEvents] = useState<EventItem[]>([]);
  const [eventId, setEventId] = useState<string>("");
  const [ticketTypeId, setTicketTypeId] = useState<string>("");

  const [quantity, setQuantity] = useState(1);
  const [paymentMethod, setPaymentMethod] = useState<
    "momo" | "credit_card" | "bank_transfer"
  >("momo");

  const [myBookings, setMyBookings] = useState<BookingItem[]>([]);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const selectedEvent = useMemo(
    () => events.find((e) => e._id === eventId) || null,
    [events, eventId]
  );

  const hasTicketTypes = useMemo(() => {
    return !!selectedEvent && Array.isArray(selectedEvent.ticketTypes) && selectedEvent.ticketTypes.length > 0;
  }, [selectedEvent]);

  const selectedType = useMemo(() => {
    if (!selectedEvent?.ticketTypes || !ticketTypeId) return null;
    return selectedEvent.ticketTypes.find((t) => t._id === ticketTypeId) || null;
  }, [selectedEvent, ticketTypeId]);

  // ✅ tính số vé còn lại (theo hạng nếu có, không thì theo event)
  const availableTickets = useMemo(() => {
    if (!selectedEvent) return 0;

    if (hasTicketTypes) {
      if (!selectedType) return 0;
      const total = Number(selectedType.total ?? 0);
      const sold = Number(selectedType.sold ?? 0);
      const held = Number(selectedType.held ?? 0);
      return Math.max(0, total - sold - held);
    }

    const total = Number(selectedEvent.ticketsTotal ?? 100);
    const sold = Number(selectedEvent.ticketsSold ?? 0);
    const held = Number(selectedEvent.ticketsHeld ?? 0);
    return Math.max(0, total - sold - held);
  }, [selectedEvent, hasTicketTypes, selectedType]);

  const displayPrice = useMemo(() => {
    if (!selectedEvent) return 0;
    if (hasTicketTypes && selectedType) return Number(selectedType.price ?? 0);
    return Number(selectedEvent.price ?? 0);
  }, [selectedEvent, hasTicketTypes, selectedType]);

  const loadEvents = async () => {
    const res = await fetch(`${API_BASE}/events`);
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Không tải được danh sách sự kiện");
    setEvents(data.events || []);
  };

  const loadMyBookings = async () => {
    const token = localStorage.getItem("token");
    if (!token) return;
    const res = await fetch(`${API_BASE}/bookings`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Không tải được vé của bạn");
    setMyBookings(data.bookings || []);
  };

  useEffect(() => {
    loadEvents().catch((e: any) => setError(e.message || "Có lỗi xảy ra"));
  }, []);

  useEffect(() => {
    if (!user) return;
    loadMyBookings().catch(() => {});
  }, [user]);

  // reset khi đổi event
  useEffect(() => {
    setQuantity(1);
    setTicketTypeId("");
  }, [eventId]);

  const canSubmit = useMemo(() => {
    if (!selectedEvent) return false;
    if (hasTicketTypes && !selectedType) return false;
    if (availableTickets <= 0) return false;
    return true;
  }, [selectedEvent, hasTicketTypes, selectedType, availableTickets]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);

    try {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("Bạn cần đăng nhập để đặt vé");
      if (!eventId) throw new Error("Vui lòng chọn sự kiện");

      if (hasTicketTypes && !ticketTypeId) {
        throw new Error("Vui lòng chọn hạng vé");
      }

      const res = await fetch(`${API_BASE}/bookings`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          eventId,
          ticketTypeId: hasTicketTypes ? ticketTypeId : undefined,
          quantity,
          paymentMethod,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Đặt vé thất bại");

      const b: BookingItem = data.booking;
      const expiresText = b.expiresAt ? new Date(b.expiresAt).toLocaleString() : "";

      const typeText = b.ticketTypeName ? ` (${b.ticketTypeName})` : "";

<<<<<<< Updated upstream
      setSuccess(
        `Đặt vé thành công${typeText} (đang giữ vé). Mã đơn: ${b._id}. Tổng tiền: ${b.totalAmount.toLocaleString()}đ. Hết hạn lúc: ${expiresText}`
=======
      // còn lại: chỉ báo thành công
      const expiresText = b.expiresAt ? new Date(b.expiresAt).toLocaleString("vi-VN") : "";
      const typeText = b.ticketTypeName ? ` • ${b.ticketTypeName}` : "";
      const totalAmt = Number(b.totalAmount ?? 0);
      setSuccess(
        `Đặt vé thành công${typeText}. Đơn: ${b._id}. Tổng tiền: ${totalAmt.toLocaleString()}đ. Hết hạn lúc: ${expiresText}`
>>>>>>> Stashed changes
      );

      await Promise.all([loadMyBookings(), loadEvents()]);
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
          <p className="subtitle">Vui lòng đăng nhập để tiếp tục.</p>
        </div>
      </section>
    );
  }

  return (
    <section className="auth-section">
      <div className="auth-card">
        <h1>Đặt vé</h1>
        <p className="subtitle">
          Sau khi đặt vé, hệ thống sẽ <b>giữ vé</b> trong 15 phút để bạn thanh toán.
        </p>

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label>Sự kiện</label>
            <select value={eventId} onChange={(e) => setEventId(e.target.value)} required>
              <option value="">-- Chọn sự kiện --</option>
              {events.map((ev) => (
                <option key={ev._id} value={ev._id}>
                  {ev.title}
                </option>
              ))}
            </select>
          </div>

          {/* ✅ Nếu event có chia hạng vé */}
          {selectedEvent && hasTicketTypes && (
            <div className="form-group">
              <label>Hạng vé</label>
              <select
                value={ticketTypeId}
                onChange={(e) => setTicketTypeId(e.target.value)}
                required
              >
                <option value="">-- Chọn hạng vé --</option>
                {(selectedEvent.ticketTypes || []).map((t) => {
                  const total = Number(t.total ?? 0);
                  const sold = Number(t.sold ?? 0);
                  const held = Number(t.held ?? 0);
                  const remain = Math.max(0, total - sold - held);

<<<<<<< Updated upstream
                  return (
                    <option key={t._id} value={t._id}>
                      {t.name} - {Number(t.price ?? 0).toLocaleString()}đ (còn {remain}/{total})
                    </option>
                  );
                })}
              </select>
=======
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
                      Tổng: <b>{Number(b.totalAmount ?? 0).toLocaleString()}đ</b>
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
>>>>>>> Stashed changes
            </div>
          )}

          {selectedEvent && (
            <div className="global-message" style={{ marginBottom: 12 }}>
              <div>
                <b>Giá:</b> {displayPrice.toLocaleString()}đ
                {hasTicketTypes && selectedType ? (
                  <span> (hạng: {selectedType.name})</span>
                ) : null}
              </div>
              <div>
                <b>Còn lại:</b> {availableTickets} vé
              </div>
            </div>
          )}

          <div className="form-group">
            <label>Số lượng vé</label>
            <input
              type="number"
              min={1}
              max={availableTickets > 0 ? availableTickets : 1}
              value={quantity}
              onChange={(e) => setQuantity(Number(e.target.value))}
              required
              disabled={!selectedEvent || (hasTicketTypes && !selectedType) || availableTickets <= 0}
            />
          </div>

          <div className="form-group">
            <label>Phương thức thanh toán</label>
            <select
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value as any)}
            >
              <option value="momo">Ví MoMo</option>
              <option value="credit_card">Thẻ tín dụng</option>
              <option value="bank_transfer">Chuyển khoản</option>
            </select>
          </div>

          <button
            type="submit"
            className="btn primary full-width"
            disabled={loading || !canSubmit}
          >
            {loading ? "Đang xử lý..." : "Đặt vé (giữ vé)"}
          </button>

          {error && <div className="global-message error">{error}</div>}
          {success && <div className="global-message">{success}</div>}
        </form>

        <hr style={{ margin: "24px 0" }} />

        <h2 style={{ marginBottom: 12 }}>Vé của tôi</h2>
        {myBookings.length === 0 ? (
          <p className="subtitle">Bạn chưa có đơn đặt vé nào.</p>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
              <thead>
                <tr style={{ backgroundColor: "#f3f4f6" }}>
                  <th style={{ textAlign: "left", padding: 8 }}>Sự kiện</th>
                  <th style={{ textAlign: "left", padding: 8 }}>Hạng vé</th>
                  <th style={{ textAlign: "right", padding: 8 }}>SL</th>
                  <th style={{ textAlign: "right", padding: 8 }}>Tổng</th>
                  <th style={{ textAlign: "left", padding: 8 }}>Trạng thái</th>
                  <th style={{ textAlign: "left", padding: 8 }}>Hết hạn</th>
                </tr>
              </thead>
              <tbody>
                {myBookings.map((b) => (
<<<<<<< Updated upstream
                  <tr key={b._id} style={{ borderTop: "1px solid #e5e7eb" }}>
                    <td style={{ padding: 8 }}>{b.eventTitle}</td>
                    <td style={{ padding: 8 }}>{b.ticketTypeName ?? "—"}</td>
                    <td style={{ padding: 8, textAlign: "right" }}>{b.quantity}</td>
                    <td style={{ padding: 8, textAlign: "right" }}>
                      {b.totalAmount.toLocaleString()}đ
                    </td>
                    <td style={{ padding: 8 }}>{b.status}</td>
                    <td style={{ padding: 8 }}>
                      {b.expiresAt ? new Date(b.expiresAt).toLocaleString() : "-"}
                    </td>
                  </tr>
=======
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
                        Tổng: <b>{Number(b.totalAmount ?? 0).toLocaleString()}đ</b>
                      </span>
                    </div>

                    <div className="mybooking-sub">
                      {b.expiresAt ? (
                        <span>Hết hạn: {new Date(b.expiresAt).toLocaleString("vi-VN")}</span>
                      ) : (
                        <span>Tạo lúc: {new Date(b.createdAt).toLocaleString("vi-VN")}</span>
                      )}
                    </div>
                  </div>
>>>>>>> Stashed changes
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  );
};
