import React, { useEffect, useMemo, useRef, useState } from "react";
import { API_BASE } from "../utils/api";
import { Event, TicketType, View } from "../utils/types";

type Props = { user: any; setView: (v: View) => void };
type SeatStatus = { soldSeatIds: string[]; heldSeatIds: string[] };

function token(): string {
  return localStorage.getItem("token") || localStorage.getItem("authToken") || "";
}

// ✅ luôn trả Record<string,string> để fetch headers không bị TS chửi
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

  // seatId -> ticketTypeId (cho phép nhiều hạng)
  const [selected, setSelected] = useState<Record<string, string>>({});

  const remainingByTypeId = useMemo(() => {
    const m: Record<string, number> = {};
    for (const t of ticketTypes) {
      // TicketType._id là string (đã sửa types.ts)
      m[t._id] = (t.total || 0) - (t.sold || 0) - (t.held || 0);
    }
    return m;
  }, [ticketTypes]);

  const isBlocked = (seatId: string) =>
    status.soldSeatIds.includes(seatId) || status.heldSeatIds.includes(seatId);

  const selectedEntries = useMemo(() => Object.entries(selected), [selected]);

  const selectedByType = useMemo(() => {
    const g: Record<string, string[]> = {};
    for (const [seatId, tid] of selectedEntries) {
      (g[tid] ||= []).push(seatId);
    }
    Object.keys(g).forEach((k) => g[k].sort());
    return g;
  }, [selectedEntries]);

  const totalAmount = useMemo(() => {
    const priceById: Record<string, number> = {};
    for (const t of ticketTypes) priceById[t._id] = Number(t.price || 0);
    return selectedEntries.reduce<number>((sum, [, tid]) => sum + (priceById[tid] || 0), 0);
  }, [selectedEntries, ticketTypes]);

  // ✅ Nếu seat bị lock bởi người khác trong lúc mình đang chọn -> tự bỏ chọn
  useEffect(() => {
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
  }, [status.soldSeatIds, status.heldSeatIds]);

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

      const m = ev.seatMapMode || "seat";
      setMode(m === "zone" ? "zone" : "seat");

      const t = ev.seatMapType || "svg";
      setMapType(t === "json" ? "json" : "svg");

      if (t !== "svg") return;

      const url = ev.seatMapUrl
        ? ev.seatMapUrl.startsWith("http")
          ? ev.seatMapUrl
          : `${baseOrigin}${ev.seatMapUrl}`
        : "";

      if (!url) {
        setSvgText("");
        return;
      }

      const svg = await fetch(url).then((r) => r.text());
      setSvgText(svg);
    })();
  }, [eventId, baseOrigin]);

  // poll seat status
  useEffect(() => {
    if (!eventId) return;

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
  }, [eventId]);

  // paint svg seats
  useEffect(() => {
    const root = svgRef.current;
    if (!root) return;

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
  }, [status, selected]);

  const onSvgClick = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement | null;
    if (!target) return;

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

    if (!eventId || !event || selectedEntries.length === 0) return;

    const seats = selectedEntries.map(([seatId, ticketTypeId]) => ({ seatId, ticketTypeId }));

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      ...authHeaders(),
    };

    const res = await fetch(`${API_BASE}/bookings`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        eventId: event._id,
        seats,
        paymentMethod: "momo",
      }),
    });

    const data = await res.json();
    if (!res.ok) {
      alert(data?.message || "Đặt vé thất bại");
      return;
    }

    // ✅ backend của mình trả { booking } (không phải bookingId)
    const bookingId = data?.booking?._id || data?.bookingId;
    if (bookingId) localStorage.setItem("paymentBookingId", String(bookingId));

    setView("payment");
  };

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
          <button
            className="btn outline"
            onClick={() => setScale((s) => Math.max(0.5, +(s - 0.1).toFixed(2)))}
          >
            −
          </button>
          <button className="btn outline" onClick={() => setScale(1)}>
            100%
          </button>
          <button
            className="btn outline"
            onClick={() => setScale((s) => Math.min(2.5, +(s + 0.1).toFixed(2)))}
          >
            +
          </button>
        </div>
      </div>

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
                    <b>{t.name}</b>{" "}
                    <span style={{ opacity: 0.8 }}>• Còn {Math.max(0, remain)}</span>
                  </div>
                  <b>{money(Number(t.price || 0))}</b>
                </div>
              );
            })}
          </div>

          <div className="seatselect-card">
            <div className="seatselect-card__title">Ghế đã chọn</div>

            {selectedEntries.length === 0 ? (
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
                  <b>{money(totalAmount)}</b>
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
            )}
          </div>
        </aside>
      </div>
    </div>
  );
};
