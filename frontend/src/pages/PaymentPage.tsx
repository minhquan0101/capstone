import React, { useEffect, useRef, useState } from "react";
import { API_BASE } from "../utils/api";
import { View } from "../utils/types";

type VietQRResponse = {
  bookingId: string;
  amount: number;
  addInfo: string;
  qrImageUrl: string;
  expiresAt?: string;
  receive?: {
    bankId: string;
    accountNo: string;
    accountName: string;
    template?: string;
  };
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

  // VietQR data
  const [vietqr, setVietqr] = useState<VietQRResponse | null>(null);
  const [qrImageUrl, setQrImageUrl] = useState<string>("");
  const [addInfo, setAddInfo] = useState<string>("");
  const [amount, setAmount] = useState<number>(0);

  const bookingId =
    typeof window !== "undefined" ? localStorage.getItem("paymentBookingId") : null;

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

  const loadVietQR = async () => {
    const token = localStorage.getItem("token");
    if (!token) throw new Error("Bạn cần đăng nhập để thanh toán.");
    if (!bookingId) throw new Error("Thiếu bookingId");

    setCreating(true);
    try {
      const res = await fetch(`${API_BASE}/payments/vietqr/${bookingId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Không tạo được VietQR");

      const v = data as VietQRResponse;
      setVietqr(v);
      setQrImageUrl(v.qrImageUrl || "");
      setAddInfo(v.addInfo || "");
      setAmount(Number(v.amount || 0));

      return v;
    } finally {
      setCreating(false);
    }
  };

  useEffect(() => {
    const run = async () => {
      try {
        setLoading(true);
        setError(null);

        if (!bookingId) {
          setError("Không có đơn để thanh toán. Vui lòng quay lại.");
          return;
        }

        const b = await loadBooking();
        if (b.status === "paid") return;

        await loadVietQR();
      } catch (e: any) {
        setError(e.message || "Có lỗi xảy ra");
      } finally {
        setLoading(false);
      }
    };

    run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bookingId]);

  // Poll status mỗi 3s để tự cập nhật
  useEffect(() => {
    if (!bookingId) return;

    const stopPoll = () => {
      if (pollRef.current) window.clearInterval(pollRef.current);
      pollRef.current = null;
    };

    const startPoll = () => {
      stopPoll();
      pollRef.current = window.setInterval(async () => {
        try {
          const b = await loadBooking();
          if (
            b.status === "paid" ||
            b.status === "expired" ||
            b.status === "failed" ||
            b.status === "cancelled"
          ) {
            stopPoll();
          }
        } catch {
          // im lặng
        }
      }, 3000);
    };

    startPoll();
    return () => stopPoll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bookingId]);

  const backToBooking = () => setView("booking");

  const backToHome = () => {
    localStorage.removeItem("paymentBookingId");
    setView("home");
  };

  const copyAddInfo = async () => {
    try {
      await navigator.clipboard.writeText(addInfo);
      alert("✅ Đã copy nội dung chuyển khoản");
    } catch {
      alert("Không copy được. Bạn copy thủ công nhé.");
    }
  };

  const openQrImage = () => {
    if (qrImageUrl) window.open(qrImageUrl, "_blank", "noopener,noreferrer");
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
            <button className="btn outline" onClick={backToBooking}>
              Quay lại
            </button>
            <button className="btn outline" onClick={backToHome}>
              Trang chủ
            </button>
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
      <div className="payment-card">
        <div className="payment-head">
          <div>
            <h1 className="payment-title">Thanh toán chuyển khoản</h1>
            <p className="payment-subtitle">
              Quét QR để chuyển khoản. Hệ thống sẽ tự xác nhận sau khi SePay ghi nhận tiền vào.
            </p>  
          </div>

          <button className="btn outline small" onClick={backToBooking}>
            ← Quay lại
          </button>
        </div>

        {isPaid ? (
          <div className="pay-success-wrap">
            <div className="pay-success-card">
              <div className="pay-success-logo">
                <div className="pay-success-brand">TicketFast</div>
              </div>

              <div className="pay-success-title">Thanh toán thành công</div>
              <div className="pay-success-sub">Đơn đặt vé của bạn đã được xác nhận.</div>

              <div className="payment-actions" style={{ marginTop: 18, justifyContent: "center" }}>
                <button className="btn outline" onClick={backToHome}>
                  Về trang chủ
                </button>
                <button className="btn outline" onClick={backToBooking}>
                  Về vé của tôi
                </button>
              </div>
            </div>
          </div>
        ) : (
          <>
            {/* ✅ 2 cột: trái thông tin, phải QR */}
            <div className="payment-grid" style={{ marginTop: 16 }}>
              {/* LEFT */}
              <div className="payment-summary">
                {booking && (
                  <div className="payment-order">
                    <div className="payment-order__row">
                      <span>Sự kiện </span>
                      <b>{booking.eventTitle}</b>
                    </div>
                    <div className="payment-order__row">
                      <span>Hạng vé </span>
                      <b>{booking.ticketTypeName || "Vé"}</b>
                    </div>
                    <div className="payment-order__row">
                      <span>Số lượng </span>
                      <b>{booking.quantity}</b>
                    </div>
                    <div className="payment-order__row total">
                      <span>Tổng tiền </span>
                      <b>{formatMoney(booking.totalAmount)}</b>
                    </div>
                    <div className="payment-order__row">
                      <span>Hết hạn giữ vé </span>
                      <b>{formatTime(booking.expiresAt)}</b>
                    </div>

                    <div className="payment-order__row">
                      <span>Nội dung CK </span>
                      <b style={{ wordBreak: "break-word" }}>{addInfo || "—"}</b>
                    </div>
                  </div>
                )}

                <div className={`payment-status ${isBad ? "bad" : "pending"}`} style={{ marginTop: 12 }}>
                  {status === "pending" && "⏳ Đang chờ hệ thống xác nhận..."}
                  {isBad && "⚠️ Đơn không còn hiệu lực / thanh toán thất bại."}
                </div>

                <div className="payment-actions" style={{ marginTop: 12 }}>
                  <button className="btn outline" onClick={backToHome}>
                    Về trang chủ
                  </button>
                  <button className="btn outline" onClick={backToBooking}>
                    Về vé của tôi
                  </button>
                </div>
              </div>

              {/* RIGHT */}
              <div className="payment-right">
                <div className="payment-qrbox">
                  {qrImageUrl ? (
                    // ✅ sửa class để ăn CSS -> QR sẽ nhỏ lại
                    <img className="payment-qrimg" src={qrImageUrl} alt="VietQR" />
                  ) : (
                    <div className="payment-qr--empty">
                      {creating ? "Đang tạo QR..." : "Chưa tạo được QR"}
                    </div>
                  )}

                  <div className="payment-qrhint">
                    <div className="payment-qrbtns">
                      <button className="btn primary" type="button" onClick={openQrImage} disabled={!qrImageUrl}>
                        Mở ảnh QR
                      </button>
                      <button className="btn outline" type="button" onClick={copyAddInfo} disabled={!addInfo}>
                        Copy nội dung CK
                      </button>
                    </div>

                    <div className="payment-note">
                      <div>
                        <b>Số tiền:</b> {formatMoney(amount || booking?.totalAmount || 0)}
                      </div>
                      <div style={{ marginTop: 6 }}>
                        Chuyển khoản xong, vui lòng chờ hệ thống xác nhận. Trang sẽ tự cập nhật.
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Debug nếu cần */}
            {/* <pre style={{ whiteSpace: "pre-wrap", fontSize: 12, opacity: 0.7 }}>
              vietqr: {JSON.stringify(vietqr, null, 2)}
            </pre> */}
          </>
        )}
      </div>
    </div>
  );
};
