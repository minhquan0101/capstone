import React, { useEffect, useMemo, useRef, useState } from "react";
import { API_BASE } from "../utils/api";
import { Event, TicketType, View } from "../utils/types";

type Props = { user: any; setView: (v: View) => void };
type SeatStatus = { soldSeatIds: string[]; heldSeatIds: string[] };

function token(): string {
  return localStorage.getItem("token") || localStorage.getItem("authToken") || "";
}

function authHeaders(): Record<string, string> {
  const t = token();
  return t ? { Authorization: `Bearer ${t}` } : {};
}

function money(v: number): string {
  return (v || 0).toLocaleString("vi-VN") + " đ";
}

export const SeatSelectPage: React.FC<Props> = ({ user, setView }) => {
  const eventId = localStorage.getItem("selectedEventId") || "";
  const baseOrigin = useMemo(() => API_BASE.replace(/\/api\/?$/, ""), []);

  const [event, setEvent] = useState<Event | null>(null);
  const [ticketTypes, setTicketTypes] = useState<TicketType[]>([]);
  const [status, setStatus] = useState<SeatStatus>({ soldSeatIds: [], heldSeatIds: [] });

  const [mapType, setMapType] = useState<"svg" | "json">("svg");
  const [mode, setMode] = useState<"seat" | "zone">("seat");
  const [svgText, setSvgText] = useState<string>("");

  const [scale, setScale] = useState<number>(1);
  const svgRef = useRef<HTMLDivElement | null>(null);

  // ===== SEAT MODE: seatId -> ticketTypeId
  const [selected, setSelected] = useState<Record<string, string>>({});

  // ===== ZONE MODE: chọn 1 khu vực + số lượng
  const [selectedZoneTypeId, setSelectedZoneTypeId] = useState<string>("");
  const [zoneQty, setZoneQty] = useState<number>(1);

  const remainingByTypeId = useMemo(() => {
    const m: Record<string, number> = {};
    for (const t of ticketTypes) {
      m[t._id] = (t.total || 0) - (t.sold || 0) - (t.held || 0);
    }
    return m;
  }, [ticketTypes]);

  const selectedEntries = useMemo(() => Object.entries(selected), [selected]);

  const isEnded = useMemo(() => {
    if (!event?.date) return false;
    const d = new Date((event as any).date);
    if (Number.isNaN(d.getTime())) return false;
    return d.getTime() < Date.now();
  }, [event?.date]);

  // SEAT MODE: lock block
  const isBlocked = (seatId: string) =>
    status.soldSeatIds.includes(seatId) || status.heldSeatIds.includes(seatId);

  const selectedByType = useMemo(() => {
    const g: Record<string, string[]> = {};
    for (const [seatId, tid] of selectedEntries) (g[tid] ||= []).push(seatId);
    Object.keys(g).forEach((k) => g[k].sort());
    return g;
  }, [selectedEntries]);

  const totalAmountSeat = useMemo(() => {
    const priceById: Record<string, number> = {};
    for (const t of ticketTypes) priceById[t._id] = Number(t.price || 0);
    return selectedEntries.reduce<number>((sum, [, tid]) => sum + (priceById[tid] || 0), 0);
  }, [selectedEntries, ticketTypes]);

  const zoneType = useMemo(() => {
    return ticketTypes.find((t) => t._id === selectedZoneTypeId) || null;
  }, [ticketTypes, selectedZoneTypeId]);

  const zoneRemain = useMemo(() => {
    if (!selectedZoneTypeId) return 0;
    return Math.max(0, remainingByTypeId[selectedZoneTypeId] ?? 0);
  }, [selectedZoneTypeId, remainingByTypeId]);

  const zoneUnitPrice = useMemo(() => Number(zoneType?.price || 0), [zoneType]);
  const zoneQtySafe = useMemo(() => Math.max(1, Number(zoneQty || 1)), [zoneQty]);
  const totalAmountZone = useMemo(() => zoneUnitPrice * zoneQtySafe, [zoneUnitPrice, zoneQtySafe]);

  // load event + seatmap
  useEffect(() => {
    if (!eventId) return;

    (async () => {
      const res = await fetch(`${API_BASE}/events/${eventId}`);
      const data = await res.json();

      const ev: Event = data.event || data;
      const types: TicketType[] = data.ticketTypes || ev.ticketTypes || [];

      setEvent(ev);
      setTicketTypes(types);

      const m = (ev as any).seatMapMode || "seat";
      setMode(m === "zone" ? "zone" : "seat");

      const t = (ev as any).seatMapType || "svg";
      setMapType(t === "json" ? "json" : "svg");

      if (t !== "svg") return;

      const url = (ev as any).seatMapUrl
        ? (ev as any).seatMapUrl.startsWith("http")
          ? (ev as any).seatMapUrl
          : `${baseOrigin}${(ev as any).seatMapUrl}`
        : "";

      if (!url) {
        setSvgText("");
        return;
      }

      const svg = await fetch(url).then((r) => r.text());
      setSvgText(svg);
    })();
  }, [eventId, baseOrigin]);

  // ✅ CHỈ poll seat status khi mode === "seat"
  useEffect(() => {
    if (!eventId) return;
    if (mode !== "seat") {
      setStatus({ soldSeatIds: [], heldSeatIds: [] });
      return;
    }

    let alive = true;

    const tick = async () => {
      try {
        const r = await fetch(`${API_BASE}/events/${eventId}/seats/status`);
        const d = await r.json();
        if (!alive) return;

        setStatus({
          soldSeatIds: Array.isArray(d.soldSeatIds) ? d.soldSeatIds : [],
          heldSeatIds: Array.isArray(d.heldSeatIds) ? d.heldSeatIds : [],
        });
      } catch {
        // ignore
      }
    };

    tick();
    const itv = setInterval(tick, 3000);
    return () => {
      alive = false;
      clearInterval(itv);
    };
  }, [eventId, mode]);

  // ✅ SEAT MODE: nếu seat bị lock -> tự bỏ chọn
  useEffect(() => {
    if (mode !== "seat") return;
    if (selectedEntries.length === 0) return;

    const blockedSet = new Set([...status.soldSeatIds, ...status.heldSeatIds]);
    let changed = false;
    const next: Record<string, string> = { ...selected };

    for (const [seatId] of selectedEntries) {
      if (blockedSet.has(seatId)) {
        delete next[seatId];
        changed = true;
      }
    }
    if (changed) setSelected(next);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status.soldSeatIds, status.heldSeatIds, mode]);

  // paint svg: seat vs zone
  useEffect(() => {
    const root = svgRef.current;
    if (!root) return;

    // ===== SEAT MODE: paint [data-seat-id]
    if (mode === "seat") {
      const seats = root.querySelectorAll<HTMLElement>("[data-seat-id]");
      seats.forEach((el) => {
        const seatId = el.getAttribute("data-seat-id") || "";
        if (!seatId) return;

        const blocked = isBlocked(seatId);
        const picked = Boolean(selected[seatId]);

        if (blocked) {
          el.style.fill = "#9ca3af";
          el.style.opacity = "0.7";
          el.style.cursor = "not-allowed";
        } else if (picked) {
          el.style.fill = "#22c55e";
          el.style.opacity = "1";
          el.style.cursor = "pointer";
        } else {
          el.style.fill = "#ffffff";
          el.style.opacity = "1";
          el.style.cursor = "pointer";
        }
      });
      return;
    }

    // ===== ZONE MODE: paint theo [data-ticket-type-id] (giữ màu fill gốc, chỉ thêm stroke/opacity)
    const zones = root.querySelectorAll<HTMLElement>("[data-ticket-type-id]");
    zones.forEach((el) => {
      const tid = el.getAttribute("data-ticket-type-id") || "";
      if (!tid) return;

      const remain = remainingByTypeId[tid] ?? 0;
      const active = tid === selectedZoneTypeId;

      if (remain <= 0) {
        el.style.opacity = "0.35";
        el.style.cursor = "not-allowed";
        el.style.stroke = "transparent";
        el.style.strokeWidth = "0";
      } else if (active) {
        el.style.opacity = "1";
        el.style.cursor = "pointer";
        el.style.stroke = "#22c55e";
        el.style.strokeWidth = "6";
      } else {
        el.style.opacity = "1";
        el.style.cursor = "pointer";
        el.style.stroke = "transparent";
        el.style.strokeWidth = "0";
      }
    });
  }, [mode, status, selected, remainingByTypeId, selectedZoneTypeId]); // eslint-disable-line

  const onSvgClick = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement | null;
    if (!target) return;

    if (isEnded) return;

    // ===== ZONE MODE: chỉ cần ticketTypeId
    if (mode === "zone") {
      const el = target.closest("[data-ticket-type-id]") as HTMLElement | null;
      if (!el) return;

      const ticketTypeId = el.getAttribute("data-ticket-type-id") || "";
      if (!ticketTypeId) return;

      const remain = remainingByTypeId[ticketTypeId] ?? 0;
      if (remain <= 0) return;

      setSelectedZoneTypeId(ticketTypeId);
      setZoneQty(1);
      return;
    }

    // ===== SEAT MODE: cần seatId + ticketTypeId
    const seatEl = target.closest("[data-seat-id]") as HTMLElement | null;
    if (!seatEl) return;

    const seatId = seatEl.getAttribute("data-seat-id") || "";
    const ticketTypeId = seatEl.getAttribute("data-ticket-type-id") || "";
    if (!seatId || !ticketTypeId) return;

    if (isBlocked(seatId)) return;

    const remain = remainingByTypeId[ticketTypeId] ?? 0;
    if (remain <= 0) return;

    setSelected((prev) => {
      const next = { ...prev };
      if (next[seatId]) delete next[seatId];
      else next[seatId] = ticketTypeId;
      return next;
    });
  };

  const continueToPay = async () => {
    if (!user) {
      alert("Bạn cần đăng nhập trước.");
      setView("login");
      return;
    }

    if (isEnded) {
      alert("Sự kiện đã diễn ra, không thể đặt vé.");
      return;
    }

    if (!eventId || !event) return;

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      ...authHeaders(),
    };

    // ===== ZONE MODE: normal booking (không gửi seats)
    if (mode === "zone") {
      if (!selectedZoneTypeId) {
        alert("Vui lòng chọn khu vực.");
        return;
      }
      const remain = remainingByTypeId[selectedZoneTypeId] ?? 0;
      if (remain <= 0) {
        alert("Khu vực này đã hết vé.");
        return;
      }
      if (zoneQtySafe > remain) {
        alert("Số lượng vượt quá vé còn lại.");
        return;
      }

      const res = await fetch(`${API_BASE}/bookings`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          eventId: event._id,
          ticketTypeId: selectedZoneTypeId,
          quantity: zoneQtySafe,
          paymentMethod: "momo",
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        alert(data?.message || "Đặt vé thất bại");
        return;
      }

      const bookingId = data?.booking?._id || data?.bookingId;
      if (bookingId) localStorage.setItem("paymentBookingId", String(bookingId));
      setView("payment");
      return;
    }

    // ===== SEAT MODE: seat booking
    if (selectedEntries.length === 0) return;

    const seats = selectedEntries.map(([seatId, ticketTypeId]) => ({ seatId, ticketTypeId }));

    const res = await fetch(`${API_BASE}/bookings`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        eventId: event._id,
        seats,
        paymentMethod: "momo",
      }),
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      alert(data?.message || "Đặt vé thất bại");
      return;
    }

    const bookingId = data?.booking?._id || data?.bookingId;
    if (bookingId) localStorage.setItem("paymentBookingId", String(bookingId));
    setView("payment");
  };

  const decZoneQty = () => setZoneQty((q) => Math.max(1, Number(q || 1) - 1));
  const incZoneQty = () => setZoneQty((q) => Math.min(zoneRemain || 1, Number(q || 1) + 1));

  if (!eventId) {
    return (
      <div style={{ padding: 20 }}>
        <div style={{ marginBottom: 12 }}>Chưa chọn sự kiện.</div>
        <button className="btn outline" onClick={() => setView("home")}>
          ← Về trang chủ
        </button>
      </div>
    );
  }

  return (
    <div className="seatselect-page">
      <div className="seatselect-topbar">
        <button className="btn outline" onClick={() => setView("event_detail")}>
          ← Trở về
        </button>

        <div className="seatselect-title">
          <div className="seatselect-title__main">{event?.title || "Chọn ghế"}</div>
          <div className="seatselect-title__sub">
            {mode === "seat" ? "Chọn ghế" : "Chọn khu vực"} • Zoom {Math.round(scale * 100)}%
          </div>
        </div>

        <div className="seatselect-controls">
          <button className="btn outline" onClick={() => setScale((s) => Math.max(0.5, +(s - 0.1).toFixed(2)))}>
            −
          </button>
          <button className="btn outline" onClick={() => setScale(1)}>
            100%
          </button>
          <button className="btn outline" onClick={() => setScale((s) => Math.min(2.5, +(s + 0.1).toFixed(2)))}>
            +
          </button>
        </div>
      </div>

      {isEnded ? (
        <div className="global-message error" style={{ margin: 12 }}>
          Sự kiện đã diễn ra. Hiện không thể đặt vé.
        </div>
      ) : null}

      <div className="seatselect-body">
        <div className="seatselect-mapwrap">
          <div className="seatselect-mapviewport">
            <div
              className="seatselect-map"
              ref={svgRef}
              onClick={onSvgClick}
              style={{ transform: `scale(${scale})` }}
              dangerouslySetInnerHTML={{
                __html: svgText || "<div style='color:#fff;opacity:.7'>Chưa có seatmap SVG</div>",
              }}
            />
          </div>
        </div>

        <aside className="seatselect-side">
          <div className="seatselect-card">
            <div className="seatselect-card__title">Giá vé</div>

            {ticketTypes.map((t) => {
              const remain = remainingByTypeId[t._id] ?? 0;
              return (
                <div
                  key={t._id}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    marginBottom: 6,
                    opacity: remain <= 0 ? 0.5 : 1,
                  }}
                >
                  <div>
                    <b>{t.name}</b> <span style={{ opacity: 0.8 }}>• Còn {Math.max(0, remain)}</span>
                  </div>
                  <b>{money(Number(t.price || 0))}</b>
                </div>
              );
            })}
          </div>

          <div className="seatselect-card">
            <div className="seatselect-card__title">
              {mode === "zone" ? "Khu vực đã chọn" : "Ghế đã chọn"}
            </div>

            {/* ===== ZONE MODE UI ===== */}
            {mode === "zone" ? (
              !selectedZoneTypeId ? (
                <div style={{ opacity: 0.75 }}>Click vào khu vực trên sơ đồ để tiếp tục.</div>
              ) : (
                <>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                    <b>{zoneType?.name || "Khu vực"}</b>
                    <b>{money(totalAmountZone)}</b>
                  </div>

                  <div style={{ opacity: 0.8, marginBottom: 10 }}>
                    Còn {zoneRemain} vé • {money(zoneUnitPrice)}/vé
                  </div>

                  <div style={{ marginBottom: 10 }}>
                    <div style={{ fontWeight: 700, marginBottom: 6 }}>Số lượng</div>
                    <div className="tkb-qty" style={{ display: "flex", gap: 8, alignItems: "center" }}>
                      <button className="btn outline" onClick={decZoneQty} disabled={zoneQtySafe <= 1}>
                        −
                      </button>
                      <input
                        value={zoneQtySafe}
                        onChange={(e) => setZoneQty(Number(e.target.value || 1))}
                        style={{ width: 60, textAlign: "center" }}
                        inputMode="numeric"
                      />
                      <button className="btn outline" onClick={incZoneQty} disabled={zoneQtySafe >= (zoneRemain || 1)}>
                        +
                      </button>
                    </div>
                  </div>

                  <button className="btn primary full-width" onClick={continueToPay}>
                    Tiếp tục
                  </button>

                  <div style={{ marginTop: 10, opacity: 0.85 }}>
                    <div>Tip: Click khu vực khác để đổi lựa chọn.</div>
                  </div>
                </>
              )
            ) : (
              // ===== SEAT MODE UI (giữ nguyên) =====
              selectedEntries.length === 0 ? (
                <div style={{ opacity: 0.75 }}>Chọn ghế trên sơ đồ để tiếp tục.</div>
              ) : (
                <>
                  {Object.entries(selectedByType).map(([tid, seats]) => {
                    const type = ticketTypes.find((x) => x._id === tid);
                    const price = Number(type?.price || 0);
                    return (
                      <div key={tid} style={{ marginBottom: 10 }}>
                        <div style={{ display: "flex", justifyContent: "space-between" }}>
                          <b>
                            {type?.name || "Hạng vé"} ({seats.length})
                          </b>
                          <b>{money(price * seats.length)}</b>
                        </div>
                        <div style={{ opacity: 0.8, marginTop: 4 }}>{seats.join(", ")}</div>
                      </div>
                    );
                  })}

                  <div className="seatselect-total">
                    <span>Tổng tiền</span>
                    <b>{money(totalAmountSeat)}</b>
                  </div>

                  <button className="btn primary full-width" onClick={continueToPay}>
                    Tiếp tục
                  </button>

                  <div style={{ marginTop: 10, opacity: 0.85 }}>
                    <div>
                      <span className="legend-dot available" /> Trống
                    </div>
                    <div>
                      <span className="legend-dot selected" /> Đang chọn
                    </div>
                    <div>
                      <span className="legend-dot blocked" /> Đã được chọn
                    </div>
                  </div>
                </>
              )
            )}
          </div>
        </aside>
      </div>
    </div>
  );
};
