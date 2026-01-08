import React, { useEffect, useMemo, useState } from "react";
import { API_BASE } from "../utils/api";

type Booking = {
  _id: string;
  eventTitle?: string;
  ticketTypeName?: string;
  quantity: number;
  totalAmount: number;
  status: "pending" | "paid" | "failed" | "cancelled" | "expired";
  expiresAt?: string;
  createdAt: string;
};

export const AdminPayments: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [actingId, setActingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [items, setItems] = useState<Booking[]>([]);

  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;

  const formatMoney = (n: number) => n.toLocaleString("vi-VN") + "đ";
  const formatTime = (d?: string) => (d ? new Date(d).toLocaleString("vi-VN") : "—");

  const pending = useMemo(() => items.filter((b) => b.status === "pending"), [items]);

  const load = async () => {
    if (!token) {
      setError("Bạn cần đăng nhập admin.");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      // ✅ Admin list tất cả booking pending của mọi user
      const res = await fetch(`${API_BASE}/admin/bookings?status=pending`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || "Không tải được danh sách booking");

      const list: Booking[] = data.bookings || [];
      setItems(list);
    } catch (e: any) {
      setError(e?.message || "Lỗi");
    } finally {
      setLoading(false);
    }
  };

  const markPaid = async (id: string) => {
    if (!token) return;
    setActingId(id);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/admin/bookings/${id}/mark-paid`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || "Mark paid failed");

      await load();
      alert("✅ Đã xác nhận thanh toán");
    } catch (e: any) {
      setError(e?.message || "Lỗi");
    } finally {
      setActingId(null);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (loading) return <div>Đang tải...</div>;

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 8, flexWrap: "wrap" }}>
        <h2 style={{ margin: 0 }}>Xác nhận thanh toán</h2>
        <button className="btn outline" type="button" onClick={load}>
          Tải lại
        </button>
      </div>

      <p className="subtitle" style={{ marginTop: 8 }}>
        Danh sách booking <b>pending</b>. Admin kiểm tra chuyển khoản theo nội dung{" "}
        <b>BOOKING &lt;id&gt;</b> rồi bấm xác nhận.
      </p>

      {error && <div className="global-message error">{error}</div>}

      {pending.length === 0 ? (
        <div className="global-message">Không có booking pending.</div>
      ) : (
        <div style={{ display: "grid", gap: 10, marginTop: 12 }}>
          {pending.map((b) => (
            <div
              key={b._id}
              style={{
                border: "1px solid #2b2b2b",
                borderRadius: 12,
                padding: 12,
                display: "grid",
                gap: 8,
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", gap: 8, flexWrap: "wrap" }}>
                <div>
                  <div style={{ fontWeight: 700 }}>{b.eventTitle || "Sự kiện"}</div>
                  <div style={{ fontSize: 13, opacity: 0.8 }}>
                    {b.ticketTypeName ? `Hạng vé: ${b.ticketTypeName} • ` : ""}
                    SL: {b.quantity} • Tổng: {formatMoney(b.totalAmount)}
                  </div>
                </div>

                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: 13, opacity: 0.8 }}>Hết hạn: {formatTime(b.expiresAt)}</div>
                  <div style={{ fontSize: 12, opacity: 0.7 }}>ID: {b._id}</div>
                </div>
              </div>

              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                <button
                  className="btn primary"
                  type="button"
                  onClick={() => markPaid(b._id)}
                  disabled={actingId === b._id}
                >
                  {actingId === b._id ? "Đang xác nhận..." : "✅ Xác nhận đã nhận tiền"}
                </button>

                <button
                  className="btn outline"
                  type="button"
                  onClick={async () => {
                    try {
                      await navigator.clipboard.writeText(`BOOKING ${b._id}`);
                      alert("✅ Đã copy nội dung CK");
                    } catch {
                      alert("Không copy được");
                    }
                  }}
                >
                  Copy nội dung CK
                </button>
              </div>

              <div style={{ fontSize: 12, opacity: 0.75 }}>
                Nội dung chuyển khoản đề xuất: <b>BOOKING {b._id}</b>
              </div>
            </div>
          ))}
        </div>
      )}

      <div style={{ marginTop: 14, fontSize: 12, opacity: 0.75 }}>
        API đang dùng: <code>GET /api/admin/bookings?status=pending</code>
      </div>
    </div>
  );
};
