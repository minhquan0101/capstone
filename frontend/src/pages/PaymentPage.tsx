import React, { useEffect, useMemo, useRef, useState } from "react";
import QRCode from "qrcode";
import { API_BASE } from "../utils/api";
import { View } from "../utils/types";

type MomoCreateResponse = {
  payUrl?: string;
  deeplink?: string;
  qrCodeUrl?: string; // có thể có hoặc không tuỳ gói MoMo
};

type BookingDetail = {
  _id: string;
  eventTitle: string;
  ticketTypeName?: string;
  quantity: number;
  totalAmount: number;
  status: "pending" | "paid" | "failed" | "cancelled" | "expired";
  expiresAt?: string;
  createdAt: string;
};

interface Props {
  setView: (v: View) => void;
}

export const PaymentPage: React.FC<Props> = ({ setView }) => {
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [booking, setBooking] = useState<BookingDetail | null>(null);
  const [momo, setMomo] = useState<MomoCreateResponse | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string>("");

  const bookingId =
    typeof window !== "undefined" ? localStorage.getItem("paymentBookingId") : null;

  const backendBase = useMemo(() => API_BASE.replace(/\/api\/?$/, ""), []);
  const pollRef = useRef<number | null>(null);

  const formatMoney = (n: number) => n.toLocaleString("vi-VN") + "đ";
  const formatTime = (d?: string) => (d ? new Date(d).toLocaleString("vi-VN") : "—");

  const loadBooking = async () => {
    const token = localStorage.getItem("token");
    if (!token) throw new Error("Bạn cần đăng nhập để thanh toán.");

    if (!bookingId) throw new Error("Không tìm thấy booking để thanh toán.");

    const res = await fetch(`${API_BASE}/bookings/${bookingId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Không tải được thông tin đơn.");
    setBooking(data.booking);
    return data.booking as BookingDetail;
  };

  const createMomo = async () => {
    const token = localStorage.getItem("token");
    if (!token) throw new Error("Bạn cần đăng nhập để thanh toán.");
    if (!bookingId) throw new Error("Thiếu bookingId");

    setCreating(true);
    try {
      const res = await fetch(`${API_BASE}/payments/momo/create`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ bookingId }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Không tạo được giao dịch MoMo");

      setMomo(data);
      return data as MomoCreateResponse;
    } finally {
      setCreating(false);
    }
  };

  const buildQr = async (m: MomoCreateResponse) => {
    // Ưu tiên qrCodeUrl nếu backend trả về, không thì dùng payUrl
    const content = m.qrCodeUrl || m.payUrl || m.deeplink || "";
    if (!content) return;

    const url = await QRCode.toDataURL(content, { width: 280, margin: 1 });
    setQrDataUrl(url);
  };

  useEffect(() => {
    const run = async () => {
      try {
        setLoading(true);
        setError(null);

        if (!bookingId) {
          setError("Không có đơn để thanh toán. Vui lòng quay lại đặt vé.");
          return;
        }

        const b = await loadBooking();
        if (b.status === "paid") {
          setLoading(false);
          return;
        }

        const m = await createMomo();
        await buildQr(m);
      } catch (e: any) {
        setError(e.message || "Có lỗi xảy ra");
      } finally {
        setLoading(false);
      }
    };

    run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bookingId]);

  // Poll status mỗi 3s để tự đổi sang “Thanh toán thành công”
  useEffect(() => {
    if (!bookingId) return;

    const startPoll = () => {
      stopPoll();
      pollRef.current = window.setInterval(async () => {
        try {
          const b = await loadBooking();
          if (b.status === "paid" || b.status === "expired" || b.status === "failed" || b.status === "cancelled") {
            stopPoll();
          }
        } catch {
          // im lặng
        }
      }, 3000);
    };

    const stopPoll = () => {
      if (pollRef.current) window.clearInterval(pollRef.current);
      pollRef.current = null;
    };

    startPoll();
    return () => stopPoll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bookingId]);

  const backToBooking = () => {
    setView("booking");
  };

  const backToHome = () => {
    localStorage.removeItem("paymentBookingId");
    setView("home");
  };

  const openPay = () => {
    const link = momo?.payUrl || momo?.deeplink;
    if (link) window.open(link, "_blank", "noopener,noreferrer");
  };

  if (loading) {
    return (
      <div className="payment-page">
        <div className="payment-card">
          <h1 className="payment-title">Thanh toán</h1>
          <p className="payment-subtitle">Đang tải...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="payment-page">
        <div className="payment-card">
          <h1 className="payment-title">Thanh toán</h1>
          <div className="global-message error">{error}</div>
          <div className="payment-actions">
            <button className="btn outline" onClick={backToBooking}>Quay lại đặt vé</button>
            <button className="btn outline" onClick={backToHome}>Trang chủ</button>
          </div>
        </div>
      </div>
    );
  }

  const status = booking?.status || "pending";
  const isPaid = status === "paid";
  const isBad = status === "expired" || status === "failed" || status === "cancelled";

  return (
    <div className="payment-page">
      <div className="payment-grid">
        <div className="payment-card">
          <div className="payment-head">
            <div>
              <h1 className="payment-title">Thanh toán MoMo</h1>
              <p className="payment-subtitle">
                Quét QR để thanh toán. Đơn sẽ tự cập nhật khi thanh toán xong.
              </p>
            </div>

            <button className="btn outline small" onClick={backToBooking}>
              ← Quay lại
            </button>
          </div>

          {booking && (
            <div className="payment-order">
              <div className="payment-order__row">
                <span>Sự kiện</span>
                <b>{booking.eventTitle}</b>
              </div>
              <div className="payment-order__row">
                <span>Hạng vé</span>
                <b>{booking.ticketTypeName || "Vé"}</b>
              </div>
              <div className="payment-order__row">
                <span>Số lượng</span>
                <b>{booking.quantity}</b>
              </div>
              <div className="payment-order__row total">
                <span>Tổng tiền</span>
                <b>{formatMoney(booking.totalAmount)}</b>
              </div>
              <div className="payment-order__row">
                <span>Hết hạn giữ vé</span>
                <b>{formatTime(booking.expiresAt)}</b>
              </div>
            </div>
          )}

          <div className="payment-qrbox">
            {qrDataUrl ? (
              <img className="payment-qr" src={qrDataUrl} alt="MoMo QR" />
            ) : (
              <div className="payment-qr--empty">
                {creating ? "Đang tạo QR..." : "Chưa tạo được QR"}
              </div>
            )}

            <div className="payment-qrhint">
              <button className="btn primary" type="button" onClick={openPay} disabled={!momo?.payUrl && !momo?.deeplink}>
                Mở trang thanh toán
              </button>
              <div className="payment-note">
                Nếu bạn đã thanh toán nhưng chưa cập nhật, chờ vài giây (tự refresh).
              </div>
            </div>
          </div>

          <div className={`payment-status ${isPaid ? "paid" : isBad ? "bad" : "pending"}`}>
            {isPaid && "✅ Thanh toán thành công!"}
            {status === "pending" && "⏳ Đang chờ thanh toán..."}
            {isBad && "⚠️ Đơn không còn hiệu lực / thanh toán thất bại."}
          </div>

          <div className="payment-actions">
            <button className="btn outline" onClick={backToHome}>Về trang chủ</button>
            <button className="btn outline" onClick={backToBooking}>Về trang đặt vé</button>
          </div>
        </div>
      </div>
    </div>
  );
};
