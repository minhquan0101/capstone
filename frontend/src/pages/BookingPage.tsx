import React, { useEffect, useMemo, useState } from "react";
import { API_BASE } from "../utils/api";
import { UserInfo, View } from "../utils/types";

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
  description?: string;
  imageUrl?: string;

  price?: number;
  ticketsTotal?: number;
  ticketsSold?: number;
  ticketsHeld?: number;

  ticketTypes?: TicketTypeItem[];
}

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
  setView: (v: View) => void; // ✅ thêm
}

export const BookingPage: React.FC<BookingPageProps> = ({ user, setView }) => {
  const [events, setEvents] = useState<EventItem[]>([]);
  const [eventId, setEventId] = useState<string>("");
  const [ticketTypeId, setTicketTypeId] = useState<string>("");

  const [quantity, setQuantity] = useState<number>(1);
  const [paymentMethod, setPaymentMethod] = useState<
    "momo" | "credit_card" | "bank_transfer"
  >("momo");

  const [myBookings, setMyBookings] = useState<BookingItem[]>([]);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loadingSubmit, setLoadingSubmit] = useState(false);
  const [loadingBookings, setLoadingBookings] = useState(false);

  const backendBase = useMemo(() => API_BASE.replace(/\/api\/?$/, ""), []);

  const selectedEvent = useMemo(
    () => events.find((e) => e._id === eventId) || null,
    [events, eventId]
  );

  const hasTicketTypes = useMemo(() => {
    return !!selectedEvent?.ticketTypes?.length;
  }, [selectedEvent]);

  const selectedType = useMemo(() => {
    if (!selectedEvent?.ticketTypes || !ticketTypeId) return null;
    return selectedEvent.ticketTypes.find((t) => t._id === ticketTypeId) || null;
  }, [selectedEvent, ticketTypeId]);

  const formatDateTime = (dateString?: string) => {
    if (!dateString) return "—";
    const d = new Date(dateString);
    if (Number.isNaN(d.getTime())) return "—";
    return d.toLocaleString("vi-VN");
  };

  const getImageUrl = (url?: string) => {
    if (!url) return "";
    return url.startsWith("http") ? url : `${backendBase}${url}`;
  };

  const calcRemaining = (total?: number, sold?: number, held?: number) => {
    const t = Number(total ?? 0);
    const s = Number(sold ?? 0);
    const h = Number(held ?? 0);
    return Math.max(0, t - s - h);
  };

  const availableTickets = useMemo(() => {
    if (!selectedEvent) return 0;

    if (hasTicketTypes) {
      if (!selectedType) return 0;
      return calcRemaining(selectedType.total, selectedType.sold, selectedType.held);
    }

    return calcRemaining(
      selectedEvent.ticketsTotal,
      selectedEvent.ticketsSold,
      selectedEvent.ticketsHeld
    );
  }, [selectedEvent, hasTicketTypes, selectedType]);

  const unitPrice = useMemo(() => {
    if (!selectedEvent) return 0;
    if (hasTicketTypes) return Number(selectedType?.price ?? 0);
    return Number(selectedEvent.price ?? 0);
  }, [selectedEvent, hasTicketTypes, selectedType]);

  const safeQuantity = useMemo(() => {
    // ✅ khi user đang xóa input => quantity có thể là 0
    // dùng safeQuantity cho tổng tiền / hiển thị
    return Math.max(1, Number(quantity || 1));
  }, [quantity]);

  const totalAmount = useMemo(() => unitPrice * safeQuantity, [unitPrice, safeQuantity]);

  const canSubmit = useMemo(() => {
    if (!selectedEvent) return false;
    if (hasTicketTypes && !selectedType) return false;
    if (availableTickets <= 0) return false;
    if (safeQuantity < 1) return false;
    if (safeQuantity > availableTickets) return false;
    return true;
  }, [selectedEvent, hasTicketTypes, selectedType, availableTickets, safeQuantity]);

  const loadEvents = async () => {
    const res = await fetch(`${API_BASE}/events`);
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Không tải được danh sách sự kiện");
    const list: EventItem[] = data.events || [];
    setEvents(list);

    const preferred = localStorage.getItem("selectedEventId");
    setEventId((prev) => {
      if (prev) return prev;
      if (preferred && list.some((e) => e._id === preferred)) return preferred;
      return list[0]?._id || "";
    });
  };

  const loadMyBookings = async () => {
    const token = localStorage.getItem("token");
    if (!token) return;

    setLoadingBookings(true);
    try {
      const res = await fetch(`${API_BASE}/bookings`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Không tải được vé của bạn");
      setMyBookings(data.bookings || []);
    } finally {
      setLoadingBookings(false);
    }
  };

  useEffect(() => {
    setError(null);
    loadEvents().catch((e: any) => setError(e.message || "Có lỗi xảy ra"));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!user) return;
    loadMyBookings().catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  // khi đổi event: reset & auto chọn hạng vé đầu tiên còn vé
  useEffect(() => {
    setQuantity(1);
    setSuccess(null);
    setError(null);

    if (!selectedEvent) {
      setTicketTypeId("");
      return;
    }

    if (selectedEvent.ticketTypes?.length) {
      const firstAvail =
        selectedEvent.ticketTypes.find(
          (t) => calcRemaining(t.total, t.sold, t.held) > 0
        ) || selectedEvent.ticketTypes[0];

      setTicketTypeId(firstAvail?._id || "");
    } else {
      setTicketTypeId("");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eventId]);

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

  const onDecQty = () => setQuantity((q) => Math.max(1, (q || 1) - 1));
  const onIncQty = () => setQuantity((q) => Math.min(availableTickets || 1, (q || 1) + 1));

  const clampQty = (q: number) => {
    const max = Math.max(1, availableTickets || 1);
    const n = Number.isFinite(q) ? q : 1;
    return Math.min(max, Math.max(1, n));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoadingSubmit(true);

    try {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("Bạn cần đăng nhập để đặt vé");
      if (!eventId) throw new Error("Vui lòng chọn sự kiện");
      if (hasTicketTypes && !ticketTypeId) throw new Error("Vui lòng chọn hạng vé");

      const qtyToSend = clampQty(safeQuantity);
      if (!selectedEvent || !canSubmit) throw new Error("Thông tin đặt vé chưa hợp lệ");

      const res = await fetch(`${API_BASE}/bookings`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          eventId,
          ticketTypeId: hasTicketTypes ? ticketTypeId : undefined,
          quantity: qtyToSend,
          paymentMethod,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Đặt vé thất bại");

      const b: BookingItem = data.booking;

      // ✅ Nếu MoMo -> chuyển sang trang payment
      if (paymentMethod === "momo") {
        localStorage.setItem("paymentBookingId", b._id);
        setView("payment");
        return;
      }

      // còn lại: chỉ báo thành công
      const expiresText = b.expiresAt ? new Date(b.expiresAt).toLocaleString("vi-VN") : "";
      const typeText = b.ticketTypeName ? ` • ${b.ticketTypeName}` : "";
      setSuccess(
        `Đặt vé thành công${typeText}. Đơn: ${b._id}. Tổng tiền: ${b.totalAmount.toLocaleString()}đ. Hết hạn lúc: ${expiresText}`
      );

      await Promise.all([loadMyBookings(), loadEvents()]);
      setQuantity(1);
    } catch (err: any) {
      setError(err.message || "Có lỗi xảy ra");
    } finally {
      setLoadingSubmit(false);
    }
  };

  if (!user) {
    return (
      <div className="booking-page">
        <div className="booking-empty">
          <div className="booking-card">
            <h1 className="booking-title">Đặt vé</h1>
            <p className="booking-subtitle">Vui lòng đăng nhập để tiếp tục.</p>
          </div>
        </div>
      </div>
    );
  }

  const banner = selectedEvent ? getImageUrl(selectedEvent.imageUrl) : "";

  return (
    <div className="booking-page">
      <div className="booking-layout">
        {/* LEFT */}
        <div className="booking-card">
          <div className="booking-header">
            <div>
              <h1 className="booking-title">Đặt vé</h1>
              <p className="booking-subtitle">
                Sau khi đặt, hệ thống sẽ <b>giữ vé 15 phút</b> để bạn thanh toán.
              </p>
            </div>
          </div>

          {error && <div className="global-message error">{error}</div>}
          {success && <div className="global-message">{success}</div>}

          <form onSubmit={handleSubmit} className="booking-form">
            {/* Event select */}
            <div className="booking-field">
              <label className="booking-label">Sự kiện</label>
              <select
                className="booking-select"
                value={eventId}
                onChange={(e) => setEventId(e.target.value)}
                required
              >
                <option value="">-- Chọn sự kiện --</option>
                {events.map((ev) => (
                  <option key={ev._id} value={ev._id}>
                    {ev.title}
                  </option>
                ))}
              </select>
            </div>

            {/* Event preview */}
            {selectedEvent && (
              <div className="booking-eventcard">
                <div
                  className="booking-eventthumb"
                  style={banner ? { backgroundImage: `url(${banner})` } : {}}
                />
                <div className="booking-eventinfo">
                  <div className="booking-eventtitle">{selectedEvent.title}</div>
                  <div className="booking-eventmeta">
                    <span>{selectedEvent.location || "—"}</span>
                    <span className="dot">•</span>
                    <span>{formatDateTime(selectedEvent.date)}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Ticket types */}
            {selectedEvent && (
              <div className="booking-field">
                <label className="booking-label">Chọn vé</label>

                {hasTicketTypes ? (
                  <div className="ticket-grid">
                    {selectedEvent.ticketTypes!.map((t) => {
                      const remain = calcRemaining(t.total, t.sold, t.held);
                      const active = t._id === ticketTypeId;
                      const soldout = remain <= 0;

                      return (
                        <button
                          type="button"
                          key={t._id}
                          className={`ticket-card ${active ? "active" : ""} ${
                            soldout ? "soldout" : ""
                          }`}
                          onClick={() => !soldout && setTicketTypeId(t._id)}
                          disabled={soldout}
                          title={soldout ? "Hết vé" : "Chọn hạng vé"}
                        >
                          <div className="ticket-card__top">
                            <div className="ticket-card__name">{t.name}</div>
                            <div className="ticket-card__price">
                              {Number(t.price).toLocaleString()}đ
                            </div>
                          </div>
                          <div className="ticket-card__bottom">
                            <div className="ticket-card__remain">
                              Còn <b>{remain}</b> / {t.total}
                            </div>
                            <span className={`pill ${soldout ? "bad" : "ok"}`}>
                              {soldout ? "Hết vé" : "Còn vé"}
                            </span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <div className="ticket-grid">
                    <div className="ticket-card single">
                      <div className="ticket-card__top">
                        <div className="ticket-card__name">Vé</div>
                        <div className="ticket-card__price">
                          {Number(selectedEvent.price ?? 0).toLocaleString()}đ
                        </div>
                      </div>
                      <div className="ticket-card__bottom">
                        <div className="ticket-card__remain">
                          Còn <b>{availableTickets}</b> / {selectedEvent.ticketsTotal ?? "—"}
                        </div>
                        <span className={`pill ${availableTickets <= 0 ? "bad" : "ok"}`}>
                          {availableTickets <= 0 ? "Hết vé" : "Còn vé"}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Quantity */}
            <div className="booking-field">
              <label className="booking-label">Số lượng</label>
              <div className="qty-row">
                <button
                  type="button"
                  className="qty-btn"
                  onClick={onDecQty}
                  disabled={!selectedEvent || safeQuantity <= 1}
                >
                  −
                </button>

                <input
                  className="qty-input"
                  type="number"
                  inputMode="numeric"
                  min={1}
                  max={availableTickets > 0 ? availableTickets : 1}
                  value={quantity === 0 ? "" : quantity}
                  onFocus={(e) => e.currentTarget.select()} // ✅ gõ 3 không thành 13
                  onChange={(e) => {
                    const v = e.target.value;
                    if (v === "") {
                      setQuantity(0); // ✅ cho phép xóa tạm thời
                      return;
                    }
                    setQuantity(Number(v));
                  }}
                  onBlur={() => setQuantity((q) => clampQty(q || 1))} // ✅ tự sửa về 1..max
                  disabled={!selectedEvent || availableTickets <= 0}
                />

                <button
                  type="button"
                  className="qty-btn"
                  onClick={onIncQty}
                  disabled={
                    !selectedEvent ||
                    availableTickets <= 0 ||
                    safeQuantity >= (availableTickets || 1)
                  }
                >
                  +
                </button>

                <div className="qty-hint">
                  Tối đa: <b>{availableTickets}</b>
                </div>
              </div>
            </div>

            {/* Payment method */}
            <div className="booking-field">
              <label className="booking-label">Phương thức thanh toán</label>
              <div className="pay-segment">
                <button
                  type="button"
                  className={`pay-btn ${paymentMethod === "momo" ? "active" : ""}`}
                  onClick={() => setPaymentMethod("momo")}
                >
                  Ví MoMo
                </button>
                <button
                  type="button"
                  className={`pay-btn ${paymentMethod === "credit_card" ? "active" : ""}`}
                  onClick={() => setPaymentMethod("credit_card")}
                >
                  Thẻ tín dụng
                </button>
                <button
                  type="button"
                  className={`pay-btn ${paymentMethod === "bank_transfer" ? "active" : ""}`}
                  onClick={() => setPaymentMethod("bank_transfer")}
                >
                  Chuyển khoản
                </button>
              </div>
            </div>

            {/* Summary */}
            <div className="booking-summary">
              <div className="sum-row">
                <span>Đơn giá</span>
                <b>{unitPrice.toLocaleString()}đ</b>
              </div>
              <div className="sum-row">
                <span>Số lượng</span>
                <b>{safeQuantity}</b>
              </div>
              <div className="sum-row total">
                <span>Tổng tiền</span>
                <b>{totalAmount.toLocaleString()}đ</b>
              </div>
            </div>

            <button
              type="submit"
              className="btn primary full-width"
              disabled={loadingSubmit || !canSubmit}
            >
              {loadingSubmit ? "Đang xử lý..." : "Đặt vé (giữ vé)"}
            </button>
          </form>
        </div>

        {/* RIGHT */}
        <aside className="booking-side">
          <div className="booking-card">
            <div className="side-header">
              <h2 className="side-title">Vé của tôi</h2>
              <button
                type="button"
                className="btn outline small"
                onClick={() => loadMyBookings().catch(() => {})}
                disabled={loadingBookings}
              >
                {loadingBookings ? "..." : "Tải lại"}
              </button>
            </div>

            {myBookings.length === 0 ? (
              <p className="booking-subtitle" style={{ marginTop: 8 }}>
                Bạn chưa có đơn đặt vé nào.
              </p>
            ) : (
              <div className="mybooking-list">
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
                  </div>
                ))}
              </div>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
};
