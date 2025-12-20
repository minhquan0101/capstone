import React, { useEffect, useMemo, useState } from "react";
import { API_BASE, uploadImage } from "../utils/api";

interface TicketTypeItem {
  _id?: string;
  name: string;
  price: number;
  total: number;
  sold?: number;
  held?: number;
}

interface EventItem {
  _id: string;
  title: string;
  description?: string;
  location?: string;
  date?: string;
  price?: number;
  imageUrl?: string;

  // ✅ vé tổng (backend có thể tự tổng hợp từ ticketTypes)
  ticketsTotal?: number;
  ticketsSold?: number;
  ticketsHeld?: number;

  // ✅ danh sách hạng vé nếu có
  ticketTypes?: TicketTypeItem[];
}

type TicketTypeDraft = {
  name: string;
  price: number | "";
  total: number | "";
};

export const AdminEvents: React.FC = () => {
  const [events, setEvents] = useState<EventItem[]>([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [date, setDate] = useState("");

  const [price, setPrice] = useState<number | "">("");
  const [ticketsTotal, setTicketsTotal] = useState<number | "">("");

  // ✅ chia hạng vé
  const [useTicketTypes, setUseTicketTypes] = useState(false);
  const [ticketTypes, setTicketTypes] = useState<TicketTypeDraft[]>([
    { name: "Vé thường", price: "", total: "" },
  ]);

  const [imageUrl, setImageUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingEvent, setEditingEvent] = useState<Partial<EventItem>>({});

  const [creatingImageFile, setCreatingImageFile] = useState<File | null>(null);
  const [creatingImagePreview, setCreatingImagePreview] = useState<string | null>(null);
  const [creatingImageInputKey, setCreatingImageInputKey] = useState(0);

  const [editingImageFile, setEditingImageFile] = useState<File | null>(null);
  const [editingImagePreview, setEditingImagePreview] = useState<string | null>(null);

  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
  const backendBase = API_BASE.replace(/\/api\/?$/, "");

  const loadEvents = async () => {
    try {
      const res = await fetch(`${API_BASE}/events`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Không tải được danh sách sự kiện");
      setEvents(data.events || []);
    } catch (err: any) {
      setError(err.message || "Có lỗi xảy ra");
    }
  };

  useEffect(() => {
    loadEvents();
  }, []);

  const createTicketTypesPayload = useMemo(() => {
    if (!useTicketTypes) return undefined;
    const cleaned = ticketTypes
      .map((t) => ({
        name: String(t.name || "").trim(),
        price: t.price === "" ? undefined : Number(t.price),
        total: t.total === "" ? undefined : Number(t.total),
      }))
      .filter((t) => t.name && t.price !== undefined && t.total !== undefined) as {
      name: string;
      price: number;
      total: number;
    }[];

    return cleaned.length > 0 ? cleaned : [];
  }, [useTicketTypes, ticketTypes]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (!token) throw new Error("Thiếu token admin");

      let finalImageUrl = imageUrl;
      if (creatingImageFile) {
        try {
          finalImageUrl = await uploadImage(creatingImageFile);
        } catch (uploadError: any) {
          throw new Error(`Upload ảnh thất bại: ${uploadError.message}`);
        }
      }

      // ✅ payload tạo event
      const payload: any = {
        title,
        description,
        location,
        date: date ? new Date(date).toISOString() : null,
        imageUrl: finalImageUrl,
      };

      if (useTicketTypes) {
        if (!createTicketTypesPayload || createTicketTypesPayload.length === 0) {
          throw new Error("Bạn bật chia hạng vé nhưng chưa nhập đủ name/price/total cho các hạng.");
        }
        payload.ticketTypes = createTicketTypesPayload;
        // price/ticketsTotal sẽ do backend tự tính từ ticketTypes
      } else {
        payload.price = price === "" ? undefined : Number(price);
        payload.ticketsTotal = ticketsTotal === "" ? undefined : Number(ticketsTotal);
      }

      const res = await fetch(`${API_BASE}/events`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Tạo sự kiện thất bại");

      // reset form
      setTitle("");
      setDescription("");
      setLocation("");
      setDate("");
      setPrice("");
      setTicketsTotal("");

      setUseTicketTypes(false);
      setTicketTypes([{ name: "Vé thường", price: "", total: "" }]);

      setImageUrl("");
      setCreatingImageFile(null);
      setCreatingImagePreview(null);
      setCreatingImageInputKey((prev) => prev + 1);

      await loadEvents();
    } catch (err: any) {
      setError(err.message || "Có lỗi xảy ra");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    setError(null);
    try {
      if (!token) throw new Error("Thiếu token admin");
      const res = await fetch(`${API_BASE}/events/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Xoá sự kiện thất bại");
      await loadEvents();
    } catch (err: any) {
      setError(err.message || "Có lỗi xảy ra");
    }
  };

  const startEdit = (ev: EventItem) => {
    setEditingId(ev._id);
    setEditingEvent({
      title: ev.title,
      description: ev.description,
      location: ev.location,
      date: ev.date,
      price: ev.price,
      imageUrl: ev.imageUrl,
      ticketsTotal: ev.ticketsTotal,
      ticketTypes: ev.ticketTypes,
      ticketsSold: ev.ticketsSold,
      ticketsHeld: ev.ticketsHeld,
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditingEvent({});
    setEditingImageFile(null);
    setEditingImagePreview(null);
  };

  const saveEdit = async () => {
    if (!editingId) return;
    setError(null);
    setLoading(true);

    try {
      if (!token) throw new Error("Thiếu token admin");

      let finalImageUrl = editingEvent.imageUrl || "";
      if (editingImageFile) {
        finalImageUrl = await uploadImage(editingImageFile);
      }

      const hasTicketTypes =
        Array.isArray(editingEvent.ticketTypes) && editingEvent.ticketTypes.length > 0;

      // ✅ payload update
      const payload: any = {
        ...editingEvent,
        imageUrl: finalImageUrl,
        date: editingEvent.date ? new Date(editingEvent.date as any).toISOString() : undefined,
      };

      // nếu event đang chia hạng vé thì không cho sửa ticketsTotal/price kiểu “1 giá”
      if (hasTicketTypes) {
        delete payload.ticketsTotal;
        delete payload.price;
      } else {
        payload.price =
          editingEvent.price === undefined || editingEvent.price === null
            ? undefined
            : Number(editingEvent.price);
        payload.ticketsTotal =
          (editingEvent as any).ticketsTotal === undefined || (editingEvent as any).ticketsTotal === null
            ? undefined
            : Number((editingEvent as any).ticketsTotal);
      }

      // backend PUT của bạn có hỗ trợ ticketTypes (nếu gửi mảng) nhưng có rule không cho đổi nếu đã sold/held
      // Ở UI này mình chưa bật chỉnh ticketTypes khi sửa để tránh rối.
      delete payload.ticketTypes;

      const res = await fetch(`${API_BASE}/events/${editingId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Cập nhật sự kiện thất bại");

      await loadEvents();
      cancelEdit();
    } catch (err: any) {
      setError(err.message || "Có lỗi xảy ra");
    } finally {
      setLoading(false);
    }
  };

  const renderTicketTypesText = (ev: EventItem) => {
    const types = ev.ticketTypes || [];
    if (types.length === 0) return "—";
    return types
      .map((t) => {
        const total = Number(t.total ?? 0);
        const sold = Number(t.sold ?? 0);
        const held = Number(t.held ?? 0);
        const remain = Math.max(0, total - sold - held);
        return `${t.name} (${Number(t.price ?? 0).toLocaleString("vi-VN")}đ, còn ${remain}/${total})`;
      })
      .join(" | ");
  };

  return (
    <div style={{ display: "flex", gap: 24, flexDirection: "column" }}>
      <form onSubmit={handleCreate} className="auth-form">
        <h2>Tạo sự kiện mới</h2>

        <div className="form-group">
          <label>Tiêu đề</label>
          <input value={title} onChange={(e) => setTitle(e.target.value)} required />
        </div>

        <div className="form-group">
          <label>Mô tả</label>
          <input value={description} onChange={(e) => setDescription(e.target.value)} />
        </div>

        <div className="form-group">
          <label>Địa điểm</label>
          <input value={location} onChange={(e) => setLocation(e.target.value)} />
        </div>

        <div className="form-group">
          <label>Ngày (YYYY-MM-DD)</label>
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </div>

        <div className="form-group">
          <label>
            <input
              type="checkbox"
              checked={useTicketTypes}
              onChange={(e) => setUseTicketTypes(e.target.checked)}
              style={{ marginRight: 8 }}
            />
            Chia hạng vé (VIP / Thường / Kim cương…)
          </label>
        </div>

        {/* Nếu không chia hạng vé -> nhập 1 giá + tổng vé */}
        {!useTicketTypes && (
          <>
            <div className="form-group">
              <label>Giá vé (VNĐ)</label>
              <input
                type="number"
                min={0}
                value={price}
                onChange={(e) => setPrice(e.target.value === "" ? "" : Number(e.target.value))}
              />
            </div>

            <div className="form-group">
              <label>Tổng số vé</label>
              <input
                type="number"
                min={0}
                value={ticketsTotal}
                onChange={(e) =>
                  setTicketsTotal(e.target.value === "" ? "" : Number(e.target.value))
                }
              />
            </div>
          </>
        )}

        {/* Nếu chia hạng vé -> nhập nhiều dòng */}
        {useTicketTypes && (
          <div className="form-group">
            <label>Danh sách hạng vé</label>

            {ticketTypes.map((t, idx) => (
              <div key={idx} style={{ display: "flex", gap: 8, marginBottom: 8 }}>
                <input
                  placeholder="Tên hạng (VIP/Thường...)"
                  value={t.name}
                  onChange={(e) => {
                    const val = e.target.value;
                    setTicketTypes((prev) =>
                      prev.map((x, i) => (i === idx ? { ...x, name: val } : x))
                    );
                  }}
                />

                <input
                  type="number"
                  min={0}
                  placeholder="Giá"
                  value={t.price}
                  onChange={(e) => {
                    const val = e.target.value === "" ? "" : Number(e.target.value);
                    setTicketTypes((prev) =>
                      prev.map((x, i) => (i === idx ? { ...x, price: val } : x))
                    );
                  }}
                />

                <input
                  type="number"
                  min={0}
                  placeholder="Số vé"
                  value={t.total}
                  onChange={(e) => {
                    const val = e.target.value === "" ? "" : Number(e.target.value);
                    setTicketTypes((prev) =>
                      prev.map((x, i) => (i === idx ? { ...x, total: val } : x))
                    );
                  }}
                />

                <button
                  className="btn small outline"
                  type="button"
                  onClick={() => setTicketTypes((prev) => prev.filter((_, i) => i !== idx))}
                  disabled={ticketTypes.length <= 1}
                >
                  Xóa
                </button>
              </div>
            ))}

            <button
              className="btn small outline"
              type="button"
              onClick={() => setTicketTypes((prev) => [...prev, { name: "", price: "", total: "" }])}
            >
              + Thêm hạng vé
            </button>

            <p className="subtitle" style={{ marginTop: 8 }}>
              Khi dùng hạng vé, hệ thống sẽ tự tính <b>Tổng vé</b> và <b>Giá hiển thị</b> theo từng hạng.
            </p>
          </div>
        )}

        <div className="form-group">
          <label>Hình ảnh sự kiện</label>
          <input
            key={creatingImageInputKey}
            type="file"
            accept="image/*"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) {
                setCreatingImageFile(file);
                const reader = new FileReader();
                reader.onloadend = () => setCreatingImagePreview(reader.result as string);
                reader.readAsDataURL(file);
              } else {
                setCreatingImageFile(null);
                setCreatingImagePreview(null);
              }
            }}
          />
          {creatingImagePreview && (
            <div style={{ marginTop: 8 }}>
              <img
                src={creatingImagePreview}
                alt="Preview"
                style={{
                  maxWidth: "200px",
                  maxHeight: "150px",
                  objectFit: "cover",
                  borderRadius: 6,
                  border: "1px solid #ddd",
                }}
              />
            </div>
          )}
        </div>

        <button className="btn primary full-width" type="submit" disabled={loading}>
          {loading ? "Đang tạo..." : "Tạo sự kiện"}
        </button>
      </form>

      <div>
        <h2>Danh sách sự kiện</h2>
        {error && <div className="global-message error">{error}</div>}

        <div style={{ overflowX: "auto", marginTop: 12 }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
            <thead>
              <tr style={{ backgroundColor: "#f3f4f6" }}>
                <th style={{ padding: 8, textAlign: "left" }}>Hình ảnh</th>
                <th style={{ padding: 8, textAlign: "left" }}>Tên sự kiện</th>
                <th style={{ padding: 8, textAlign: "left" }}>Địa điểm</th>
                <th style={{ padding: 8, textAlign: "left" }}>Ngày</th>
                <th style={{ padding: 8, textAlign: "left" }}>Giá hiển thị</th>

                <th style={{ padding: 8, textAlign: "right" }}>Tổng vé</th>
                <th style={{ padding: 8, textAlign: "right" }}>Đã bán</th>
                <th style={{ padding: 8, textAlign: "right" }}>Đang giữ</th>
                <th style={{ padding: 8, textAlign: "right" }}>Còn lại</th>

                <th style={{ padding: 8, textAlign: "left" }}>Hạng vé</th>
                <th style={{ padding: 8 }}></th>
              </tr>
            </thead>

            <tbody>
              {events.map((ev) => {
                const isEditing = editingId === ev._id;
                const row = (isEditing ? editingEvent : ev) as EventItem;

                const total = Number(row.ticketsTotal ?? 100);
                const sold = Number(row.ticketsSold ?? 0);
                const held = Number(row.ticketsHeld ?? 0);
                const remaining = Math.max(0, total - sold - held);

                const hasTicketTypes = Array.isArray(row.ticketTypes) && row.ticketTypes.length > 0;

                return (
                  <tr key={ev._id} style={{ borderBottom: "1px solid #e5e7eb" }}>
                    {/* Image */}
                    <td style={{ padding: 8 }}>
                      {isEditing ? (
                        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                          {row.imageUrl && (
                            <img
                              src={
                                row.imageUrl?.startsWith("http")
                                  ? row.imageUrl
                                  : `${backendBase}${row.imageUrl}`
                              }
                              alt={row.title}
                              style={{
                                width: 64,
                                height: 40,
                                objectFit: "cover",
                                borderRadius: 6,
                              }}
                            />
                          )}

                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                setEditingImageFile(file);
                                const reader = new FileReader();
                                reader.onloadend = () => setEditingImagePreview(reader.result as string);
                                reader.readAsDataURL(file);
                              } else {
                                setEditingImageFile(null);
                                setEditingImagePreview(null);
                              }
                            }}
                          />

                          {editingImagePreview && (
                            <img
                              src={editingImagePreview}
                              alt="Preview"
                              style={{
                                maxWidth: "100px",
                                maxHeight: "75px",
                                objectFit: "cover",
                                borderRadius: 6,
                                border: "1px solid #ddd",
                                marginTop: 4,
                              }}
                            />
                          )}
                        </div>
                      ) : row.imageUrl ? (
                        <img
                          src={
                            row.imageUrl.startsWith("http")
                              ? row.imageUrl
                              : `${backendBase}${row.imageUrl}`
                          }
                          alt={row.title}
                          style={{ width: 64, height: 40, objectFit: "cover", borderRadius: 6 }}
                        />
                      ) : (
                        <span className="event-meta">Không có</span>
                      )}
                    </td>

                    {/* Title */}
                    <td style={{ padding: 8 }}>
                      {isEditing ? (
                        <input
                          type="text"
                          value={row.title || ""}
                          onChange={(e) => setEditingEvent((prev) => ({ ...prev, title: e.target.value }))}
                        />
                      ) : (
                        <strong>{ev.title}</strong>
                      )}
                    </td>

                    {/* Location */}
                    <td style={{ padding: 8 }}>
                      {isEditing ? (
                        <input
                          type="text"
                          value={row.location || ""}
                          onChange={(e) =>
                            setEditingEvent((prev) => ({ ...prev, location: e.target.value }))
                          }
                        />
                      ) : (
                        ev.location && <span className="event-meta">{ev.location}</span>
                      )}
                    </td>

                    {/* Date */}
                    <td style={{ padding: 8 }}>
                      {isEditing ? (
                        <input
                          type="datetime-local"
                          value={row.date ? new Date(row.date).toISOString().slice(0, 16) : ""}
                          onChange={(e) =>
                            setEditingEvent((prev) => ({ ...prev, date: e.target.value }))
                          }
                        />
                      ) : (
                        ev.date && (
                          <span className="event-meta">{new Date(ev.date).toLocaleString("vi-VN")}</span>
                        )
                      )}
                    </td>

                    {/* Display Price */}
                    <td style={{ padding: 8 }}>
                      {isEditing ? (
                        hasTicketTypes ? (
                          <span className="event-meta">
                            (Chia hạng vé) {row.price ? row.price.toLocaleString("vi-VN") : "—"}
                          </span>
                        ) : (
                          <input
                            type="number"
                            min={0}
                            value={row.price ?? ""}
                            onChange={(e) =>
                              setEditingEvent((prev) => ({
                                ...prev,
                                price: e.target.value === "" ? undefined : Number(e.target.value),
                              }))
                            }
                          />
                        )
                      ) : (
                        <span className="event-meta">
                          {row.price !== undefined && row.price !== null
                            ? row.price.toLocaleString("vi-VN") + "đ"
                            : "Chưa đặt"}
                        </span>
                      )}
                    </td>

                    {/* Tickets total */}
                    <td style={{ padding: 8, textAlign: "right" }}>
                      {isEditing ? (
                        hasTicketTypes ? (
                          <span className="event-meta">{total}</span>
                        ) : (
                          <input
                            type="number"
                            min={0}
                            value={(row as any).ticketsTotal ?? ""}
                            onChange={(e) =>
                              setEditingEvent((prev) => ({
                                ...prev,
                                ticketsTotal:
                                  e.target.value === "" ? undefined : Number(e.target.value),
                              }))
                            }
                            style={{ width: 110 }}
                          />
                        )
                      ) : (
                        <span className="event-meta">{total}</span>
                      )}
                    </td>

                    {/* Sold / Held / Remaining */}
                    <td style={{ padding: 8, textAlign: "right" }}>
                      <span className="event-meta">{sold}</span>
                    </td>
                    <td style={{ padding: 8, textAlign: "right" }}>
                      <span className="event-meta">{held}</span>
                    </td>
                    <td style={{ padding: 8, textAlign: "right" }}>
                      <span className="event-meta">{remaining}</span>
                    </td>

                    {/* Ticket Types */}
                    <td style={{ padding: 8 }}>
                      <span className="event-meta">{renderTicketTypesText(row)}</span>
                    </td>

                    {/* Actions */}
                    <td style={{ padding: 8, whiteSpace: "nowrap" }}>
                      {isEditing ? (
                        <>
                          <button
                            className="btn small primary"
                            type="button"
                            onClick={saveEdit}
                            style={{ marginRight: 8 }}
                          >
                            Lưu
                          </button>
                          <button className="btn small outline" type="button" onClick={cancelEdit}>
                            Hủy
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            className="btn small outline"
                            type="button"
                            onClick={() => startEdit(ev)}
                            style={{ marginRight: 8 }}
                          >
                            Sửa
                          </button>
                          <button
                            className="btn small outline"
                            type="button"
                            onClick={() => handleDelete(ev._id)}
                          >
                            Xoá
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          <p className="subtitle" style={{ marginTop: 10 }}>
            * Nếu event đã chia hạng vé, sửa “Giá” và “Tổng vé” theo kiểu 1 giá sẽ bị khoá (vì dữ liệu lấy từ từng hạng).
          </p>
        </div>
      </div>
    </div>
  );
};
