import React, { useEffect, useMemo, useState } from "react";
import { API_BASE } from "../utils/api";
import { View, UserInfo, TicketType } from "../utils/types";

type EventDetailData = {
  _id: string;
  title: string;
  description?: string;
  location?: string;
  date?: string;
  imageUrl?: string;

  // ticket info
  price?: number;
  priceFrom?: number;
  ticketsTotal?: number;
  ticketsSold?: number;
  ticketsHeld?: number;
  ticketsRemaining?: number;

  isFeatured?: boolean;
  isTrending?: boolean;

  ticketTypes?: TicketType[];

  // ✅ seatmap (để quyết định flow)
  seatMapMode?: "none" | "seat" | "zone";
  seatMapType?: "svg" | "json";
  seatMapUrl?: string;
};

interface Props {
  user: UserInfo | null;
  setView: (v: View) => void;
}

const money = (v: number) =>
  new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(v);

const dt = (iso?: string) => {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return new Intl.DateTimeFormat("vi-VN", {
    weekday: "long",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(d);
};

const remain = (total?: number, sold?: number, held?: number) => {
  const t = Number(total ?? 0);
  const s = Number(sold ?? 0);
  const h = Number(held ?? 0);
  return Math.max(0, t - s - h);
};

export const EventDetail: React.FC<Props> = ({ user, setView }) => {
  const [event, setEvent] = useState<EventDetailData | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  // Ticketbox-like
  const [tab, setTab] = useState<"intro" | "ticket" | "place">("intro");
  const [ticketTypeId, setTicketTypeId] = useState<string>("");
  const [quantity, setQuantity] = useState<number>(1);
  const [paymentMethod, setPaymentMethod] = useState<"momo" | "credit_card" | "bank_transfer">("momo");
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const selectedEventId =
    typeof window !== "undefined" ? localStorage.getItem("selectedEventId") : null;

  const backendBase = useMemo(() => API_BASE.replace(/\/api\/?$/, ""), []);

  const toAbsImage = (url?: string) => {
    if (!url) return "";
    return url.startsWith("http") ? url : `${backendBase}${url}`;
  };

  // Load detail
  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setErr(null);
        setToast(null);

        if (!selectedEventId) {
          setErr("Không tìm thấy sự kiện. Vui lòng quay lại trang chủ và chọn lại.");
          setEvent(null);
          return;
        }

        const res = await fetch(`${API_BASE}/events/${selectedEventId}`);
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data?.message || "Không thể tải chi tiết sự kiện");

        const ev = (data?.event || data) as EventDetailData;

        const types: TicketType[] = Array.isArray(data?.ticketTypes)
          ? (data.ticketTypes as TicketType[])
          : (ev?.ticketTypes ?? []);

        setEvent({
          ...ev,
          ticketTypes: types,
        });
      } catch (e: any) {
        setErr(e?.message || "Có lỗi xảy ra");
        setEvent(null);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [selectedEventId]);

  const ticketTypes = useMemo(() => event?.ticketTypes ?? [], [event?.ticketTypes]);
  const hasTicketTypes = ticketTypes.length > 0;

  // ✅ Event có seatmap thì đi flow chọn ghế
  const hasSeatMap = useMemo(() => {
    if (!event) return false;
    return (event.seatMapMode && event.seatMapMode !== "none") || Boolean(event.seatMapUrl);
  }, [event]);

  // auto chọn vé đầu tiên còn vé (chỉ dùng cho flow không seatmap)
  useEffect(() => {
    if (!event) return;
    setToast(null);
    setQuantity(1);

    if (hasTicketTypes) {
      const firstAvail =
        ticketTypes.find((t) => remain(t.total, t.sold, t.held) > 0) ?? ticketTypes[0];
      setTicketTypeId(firstAvail?._id || "");
    } else {
      setTicketTypeId("");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [event?._id]);

  const selectedType = useMemo(() => {
    if (!hasTicketTypes) return null;
    return ticketTypes.find((t) => t._id === ticketTypeId) ?? null;
  }, [hasTicketTypes, ticketTypes, ticketTypeId]);

  const available = useMemo(() => {
    if (!event) return 0;

    if (hasTicketTypes) {
      if (!selectedType) return 0;
      return remain(selectedType.total, selectedType.sold, selectedType.held);
    }

    if (typeof event.ticketsRemaining === "number") return Math.max(0, event.ticketsRemaining);
    return remain(event.ticketsTotal, event.ticketsSold, event.ticketsHeld);
  }, [event, hasTicketTypes, selectedType]);

  const unitPrice = useMemo(() => {
    if (!event) return 0;
    if (hasTicketTypes) return Number(selectedType?.price ?? 0);
    return Number(event.priceFrom ?? event.price ?? 0);
  }, [event, hasTicketTypes, selectedType]);

  const minPrice = useMemo(() => {
    if (!event) return 0;
    const pf = Number(event.priceFrom ?? event.price ?? 0);
    return Number.isFinite(pf) ? pf : 0;
  }, [event]);

  const qty = useMemo(() => Math.max(1, Number(quantity || 1)), [quantity]);
  const totalAmount = useMemo(() => unitPrice * qty, [unitPrice, qty]);

  const heroImage = useMemo(() => toAbsImage(event?.imageUrl), [event?.imageUrl, backendBase]);

  const back = () => setView("home");

  const scrollToBuy = () => {
    const el = document.getElementById("tkb-buy-card");
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const goSeatMap = () => {
    if (!event) return;
    if (typeof window !== "undefined") {
      localStorage.setItem("selectedEventId", event._id);
    }
    setView("seatmap"); // ✅ phải trùng View union
  };

  const share = async () => {
    try {
      const url = window.location.href;
      await navigator.clipboard.writeText(url);
      setToast("Đã copy link chia sẻ.");
      setTimeout(() => setToast(null), 2000);
    } catch {
      setToast("Không copy được link (trình duyệt chặn).");
      setTimeout(() => setToast(null), 2000);
    }
  };

  const decQty = () => setQuantity((q) => Math.max(1, Number(q || 1) - 1));
  const incQty = () => setQuantity((q) => Math.min(available || 1, Number(q || 1) + 1));

  const canSubmit = useMemo(() => {
    if (!event) return false;
    if (!user) return false;
    if (hasTicketTypes && !selectedType) return false;
    if (available <= 0) return false;
    if (qty > available) return false;
    return true;
  }, [event, user, hasTicketTypes, selectedType, available, qty]);

  const submitBooking = async () => {
    try {
      setErr(null);
      setToast(null);

      if (!user) {
        setToast("Bạn cần đăng nhập để đặt vé.");
        setView("login");
        return;
      }
      if (!event) throw new Error("Không có dữ liệu sự kiện.");
      if (hasTicketTypes && !ticketTypeId) throw new Error("Vui lòng chọn loại vé.");
      if (qty > available) throw new Error("Số lượng vượt quá vé còn lại.");

      const token = localStorage.getItem("token") || localStorage.getItem("authToken");
      if (!token) {
        setToast("Bạn cần đăng nhập để đặt vé.");
        setView("login");
        return;
      }

      setSubmitting(true);

      const res = await fetch(`${API_BASE}/bookings`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          eventId: event._id,
          ticketTypeId: hasTicketTypes ? ticketTypeId : undefined,
          quantity: qty,
          paymentMethod,
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.message || "Đặt vé thất bại");

      const bookingId = data?.booking?._id;

      if (paymentMethod === "momo" && bookingId) {
        localStorage.setItem("paymentBookingId", String(bookingId));
        setView("payment");
        return;
      }

      setToast("Đặt vé thành công! Vé đang được giữ chỗ 15 phút (pending).");
    } catch (e: any) {
      setErr(e?.message || "Có lỗi xảy ra");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="loading-state"><p>Đang tải...</p></div>;

  if (!event) {
    return (
      <div className="event-detail-page">
        {err ? <div className="global-message error">{err}</div> : <div className="global-message error">Không tìm thấy sự kiện.</div>}
        <button className="btn outline" onClick={back}>Quay lại</button>
      </div>
    );
  }

  return (
    <div className="tkb-detail">
      {/* HERO */}
      <header
        className="tkb-hero"
        style={heroImage ? ({ ["--tkb-hero" as any]: `url(${heroImage})` } as any) : undefined}
      >
        <div className="tkb-hero__bg" />
        <div className="tkb-hero__overlay" />

        <div className="tkb-hero__container">
          <div className="tkb-hero__topbar">
            <button className="btn outline" onClick={back}>← Trang chủ</button>
            <div className="tkb-hero__right">
              <button className="btn outline" onClick={share}>Chia sẻ</button>
            </div>
          </div>

          <div className="tkb-hero__grid">
            <div className="tkb-poster">
              {heroImage ? <img src={heroImage} alt={event.title} /> : <div className="tkb-poster__placeholder" />}
            </div>

            <div className="tkb-hero__info">
              <div className="tkb-breadcrumb">Sự kiện / {event.title}</div>

              <h1 className="tkb-title">{event.title}</h1>

              <div className="tkb-badges">
                {event.isFeatured ? <span className="tkb-badge">Nổi bật</span> : null}
                {event.isTrending ? <span className="tkb-badge tkb-badge--ghost">Xu hướng</span> : null}
                {minPrice > 0 ? <span className="tkb-badge tkb-badge--ghost">Giá từ {money(minPrice)}</span> : null}
              </div>

              <div className="tkb-meta">
                <div className="tkb-meta__item">
                  <div className="tkb-meta__label">Thời gian</div>
                  <div className="tkb-meta__value">{dt(event.date)}</div>
                </div>
                <div className="tkb-meta__item">
                  <div className="tkb-meta__label">Địa điểm</div>
                  <div className="tkb-meta__value">{event.location || "—"}</div>
                </div>
              </div>

              <div className="tkb-hero__actions">
                <button
                  className="tkb-btn-primary"
                  onClick={() => (hasSeatMap ? goSeatMap() : scrollToBuy())}
                >
                  {hasSeatMap ? "Mua vé (chọn ghế)" : "Mua vé"}
                </button>

                {!hasSeatMap ? (
                  <button className="btn outline" onClick={() => setView("booking")}>
                    Mở trang đặt vé
                  </button>
                ) : null}
              </div>

              {toast ? <div className="tkb-toast">{toast}</div> : null}
              {err ? <div className="global-message error" style={{ marginTop: 10 }}>{err}</div> : null}
            </div>
          </div>
        </div>
      </header>

      {/* BODY */}
      <div className="tkb-body">
        <div className="tkb-body__container">
          <div className="tkb-layout">
            {/* LEFT */}
            <main className="tkb-main">
              <div className="tkb-tabs">
                <button className={`tkb-tab ${tab === "intro" ? "active" : ""}`} onClick={() => setTab("intro")}>Giới thiệu</button>
                <button className={`tkb-tab ${tab === "ticket" ? "active" : ""}`} onClick={() => setTab("ticket")}>Thông tin vé</button>
                <button className={`tkb-tab ${tab === "place" ? "active" : ""}`} onClick={() => setTab("place")}>Địa điểm</button>
              </div>

              {tab === "intro" ? (
                <section className="tkb-card">
                  <h2 className="tkb-card__title">Giới thiệu</h2>
                  <p className="tkb-card__text">{event.description?.trim() ? event.description : "Chưa có mô tả."}</p>
                </section>
              ) : null}

              {tab === "ticket" ? (
                <section className="tkb-card">
                  <h2 className="tkb-card__title">Thông tin vé</h2>

                  {hasTicketTypes ? (
                    <div className="tkb-ticketlist">
                      {ticketTypes.map((t) => {
                        const r = remain(t.total, t.sold, t.held);
                        return (
                          <div key={t._id} className="tkb-ticketrow">
                            <div className="tkb-ticketrow__left">
                              <div className="tkb-ticketrow__name">{t.name}</div>
                              <div className="tkb-ticketrow__sub">Còn {r} / {t.total}</div>
                            </div>
                            <div className="tkb-ticketrow__right">
                              <div className="tkb-ticketrow__price">{money(Number(t.price))}</div>
                              <span className={`tkb-pill ${r <= 0 ? "bad" : "ok"}`}>{r <= 0 ? "Hết vé" : "Còn vé"}</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="tkb-ticketrow">
                      <div className="tkb-ticketrow__left">
                        <div className="tkb-ticketrow__name">Vé</div>
                        <div className="tkb-ticketrow__sub">
                          Còn {available} / {event.ticketsTotal ?? "—"}
                        </div>
                      </div>
                      <div className="tkb-ticketrow__right">
                        <div className="tkb-ticketrow__price">{money(Number(event.priceFrom ?? event.price ?? 0))}</div>
                      </div>
                    </div>
                  )}

                  <div className="tkb-note">
                    Vé được giữ chỗ 15 phút sau khi đặt (pending).
                  </div>
                </section>
              ) : null}

              {tab === "place" ? (
                <section className="tkb-card">
                  <h2 className="tkb-card__title">Địa điểm</h2>
                  <div className="tkb-kv">
                    <div className="tkb-kv__row">
                      <div className="tkb-kv__label">Địa điểm</div>
                      <div className="tkb-kv__value">{event.location || "—"}</div>
                    </div>
                    <div className="tkb-kv__row">
                      <div className="tkb-kv__label">Thời gian</div>
                      <div className="tkb-kv__value">{dt(event.date)}</div>
                    </div>
                  </div>
                </section>
              ) : null}
            </main>

            {/* RIGHT sticky */}
            <aside className="tkb-side">
              <div id="tkb-buy-card" className="tkb-buycard">
                <div className="tkb-buycard__head">
                  <div>
                    <div className="tkb-buycard__label">Giá</div>
                    <div className="tkb-buycard__price">
                      {hasTicketTypes ? money(unitPrice) : (minPrice > 0 ? `Từ ${money(minPrice)}` : "—")}
                    </div>
                  </div>
                  <div className="tkb-buycard__remain">
                    <div className="tkb-buycard__label">Còn lại</div>
                    <div className="tkb-buycard__remainNum">{available}</div>
                  </div>
                </div>

                <div className="tkb-buycard__meta">
                  <div className="tkb-buymeta">
                    <div className="tkb-buymeta__label">Thời gian</div>
                    <div className="tkb-buymeta__value">{dt(event.date)}</div>
                  </div>
                  <div className="tkb-buymeta">
                    <div className="tkb-buymeta__label">Địa điểm</div>
                    <div className="tkb-buymeta__value">{event.location || "—"}</div>
                  </div>
                </div>

                {/* ✅ Nếu có seatmap: chỉ hiển thị nút Chọn ghế */}
                {hasSeatMap ? (
                  <>
                    <div className="tkb-buycard__block">
                      <div className="tkb-buycard__blockTitle">Chọn chỗ</div>
                      <div style={{ opacity: 0.85, marginBottom: 10 }}>
                        Sự kiện này có sơ đồ chỗ ngồi/khu vực. Bạn cần chọn chỗ trước khi thanh toán.
                      </div>
                      <button className="tkb-btn-primary tkb-btn-full" onClick={goSeatMap}>
                        {event.seatMapMode === "zone" ? "Chọn khu vực" : "Chọn ghế"}
                      </button>
                    </div>

                    <div className="tkb-buycard__foot">* Vé sẽ được giữ chỗ 15 phút sau khi bạn chọn chỗ.</div>
                  </>
                ) : (
                  <>
                    {hasTicketTypes ? (
                      <div className="tkb-buycard__block">
                        <div className="tkb-buycard__blockTitle">Chọn loại vé</div>
                        <div className="tkb-buycard__tickets">
                          {ticketTypes.map((t) => {
                            const r = remain(t.total, t.sold, t.held);
                            const active = t._id === ticketTypeId;
                            return (
                              <button
                                key={t._id}
                                className={`tkb-ticketbtn ${active ? "active" : ""} ${r <= 0 ? "disabled" : ""}`}
                                onClick={() => {
                                  if (r <= 0) return;
                                  setTicketTypeId(t._id);
                                  setQuantity(1);
                                  setToast(null);
                                }}
                                type="button"
                              >
                                <div className="tkb-ticketbtn__row">
                                  <div className="tkb-ticketbtn__name">{t.name}</div>
                                  <div className="tkb-ticketbtn__p">{money(Number(t.price))}</div>
                                </div>
                                <div className="tkb-ticketbtn__sub">Còn {r} vé</div>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    ) : null}

                    <div className="tkb-buycard__block">
                      <div className="tkb-buycard__blockTitle">Số lượng</div>
                      <div className="tkb-qty">
                        <button className="tkb-qty__btn" onClick={decQty} disabled={submitting || qty <= 1} type="button">−</button>
                        <input
                          className="tkb-qty__input"
                          value={qty}
                          onChange={(e) => setQuantity(Number(e.target.value || 1))}
                          inputMode="numeric"
                        />
                        <button className="tkb-qty__btn" onClick={incQty} disabled={submitting || qty >= (available || 1)} type="button">+</button>
                      </div>
                    </div>

                    <div className="tkb-buycard__block">
                      <div className="tkb-buycard__blockTitle">Thanh toán</div>
                      <div className="tkb-pay">
                        <button className={`tkb-pay__btn ${paymentMethod === "momo" ? "active" : ""}`} onClick={() => setPaymentMethod("momo")} type="button">MoMo</button>
                        <button className={`tkb-pay__btn ${paymentMethod === "credit_card" ? "active" : ""}`} onClick={() => setPaymentMethod("credit_card")} type="button">Thẻ</button>
                        <button className={`tkb-pay__btn ${paymentMethod === "bank_transfer" ? "active" : ""}`} onClick={() => setPaymentMethod("bank_transfer")} type="button">CK</button>
                      </div>
                    </div>

                    <div className="tkb-total">
                      <div className="tkb-total__label">Tổng</div>
                      <div className="tkb-total__value">{money(totalAmount)}</div>
                    </div>

                    {!user ? (
                      <button className="tkb-btn-primary tkb-btn-full" onClick={() => setView("login")}>
                        Đăng nhập để đặt vé
                      </button>
                    ) : (
                      <button
                        className={`tkb-btn-primary tkb-btn-full ${(!canSubmit || submitting) ? "disabled" : ""}`}
                        onClick={submitBooking}
                        disabled={!canSubmit || submitting}
                      >
                        {submitting ? "Đang đặt..." : "Đặt vé"}
                      </button>
                    )}

                    <div className="tkb-buycard__foot">* Vé sẽ được giữ chỗ 15 phút (pending).</div>
                  </>
                )}
              </div>
            </aside>
          </div>
        </div>
      </div>
    </div>
  );
};
