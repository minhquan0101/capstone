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
  // Merged: Flags + Ticket Logic
  isFeatured?: boolean;
  isTrending?: boolean;
  ticketsTotal?: number;
  ticketsSold?: number;
  ticketsHeld?: number;
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

  // Ticket Types Logic
  const [useTicketTypes, setUseTicketTypes] = useState(false);
  const [ticketTypes, setTicketTypes] = useState<TicketTypeDraft[]>([
    { name: "Vé thường", price: "", total: "" },
  ]);

  const [imageUrl, setImageUrl] = useState("");
  const [isFeatured, setIsFeatured] = useState(false);
  const [isTrending, setIsTrending] = useState(false);
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
        finalImageUrl = await uploadImage(creatingImageFile);
      }

      const payload: any = {
        title,
        description,
        location,
        date: date ? new Date(date).toISOString() : null,
        imageUrl: finalImageUrl,
        isFeatured, // From khanh
        isTrending, // From khanh
      };

      if (useTicketTypes) {
        if (!createTicketTypesPayload || createTicketTypesPayload.length === 0) {
          throw new Error("Vui lòng nhập đủ thông tin hạng vé.");
        }
        payload.ticketTypes = createTicketTypesPayload;
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

      // Reset
      setTitle(""); setDescription(""); setLocation(""); setDate(""); setPrice(""); setTicketsTotal("");
      setUseTicketTypes(false); setTicketTypes([{ name: "Vé thường", price: "", total: "" }]);
      setImageUrl(""); setIsFeatured(false); setIsTrending(false);
      setCreatingImageFile(null); setCreatingImagePreview(null);
      setCreatingImageInputKey((prev) => prev + 1);

      await loadEvents();
    } catch (err: any) {
      setError(err.message || "Có lỗi xảy ra");
    } finally {
      setLoading(false);
    }
  };

  const startEdit = (ev: EventItem) => {
    setEditingId(ev._id);
    setEditingEvent({
      ...ev,
      date: ev.date ? new Date(ev.date).toISOString().slice(0, 16) : "",
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

      const hasTicketTypes = Array.isArray(editingEvent.ticketTypes) && editingEvent.ticketTypes.length > 0;

      const payload: any = {
        ...editingEvent,
        imageUrl: finalImageUrl,
        date: editingEvent.date ? new Date(editingEvent.date).toISOString() : undefined,
      };

      if (hasTicketTypes) {
        delete payload.ticketsTotal;
        delete payload.price;
      }

      const res = await fetch(`${API_BASE}/events/${editingId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || "Cập nhật thất bại");
      }

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
    return types.map(t => `${t.name} (${t.price.toLocaleString()}đ)`).join(" | ");
  };

  return (
    <div style={{ display: "flex", gap: 24, flexDirection: "column", padding: 20 }}>
      {/* --- CREATE FORM --- */}
      <form onSubmit={handleCreate} className="auth-form" style={{ border: '1px solid #ddd', padding: 20, borderRadius: 8 }}>
        <h2>Tạo sự kiện mới</h2>
        <div className="form-group">
          <label>Tiêu đề</label>
          <input value={title} onChange={(e) => setTitle(e.target.value)} required />
        </div>
        <div className="form-group">
          <label>Địa điểm</label>
          <input value={location} onChange={(e) => setLocation(e.target.value)} />
        </div>
        <div className="form-group">
          <label>Ngày</label>
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </div>

        <div className="form-group">
          <label>
            <input type="checkbox" checked={useTicketTypes} onChange={(e) => setUseTicketTypes(e.target.checked)} />
             Chia hạng vé
          </label>
        </div>

        {!useTicketTypes ? (
          <div style={{ display: 'flex', gap: 10 }}>
            <input type="number" placeholder="Giá vé" value={price} onChange={(e) => setPrice(e.target.value === "" ? "" : Number(e.target.value))} />
            <input type="number" placeholder="Tổng vé" value={ticketsTotal} onChange={(e) => setTicketsTotal(e.target.value === "" ? "" : Number(e.target.value))} />
          </div>
        ) : (
          <div>
            {ticketTypes.map((t, idx) => (
              <div key={idx} style={{ display: "flex", gap: 8, marginBottom: 8 }}>
                <input placeholder="Tên hạng" value={t.name} onChange={(e) => setTicketTypes(prev => prev.map((x, i) => i === idx ? { ...x, name: e.target.value } : x))} />
                <input type="number" placeholder="Giá" value={t.price} onChange={(e) => setTicketTypes(prev => prev.map((x, i) => i === idx ? { ...x, price: e.target.value === "" ? "" : Number(e.target.value) } : x))} />
                <input type="number" placeholder="Số vé" value={t.total} onChange={(e) => setTicketTypes(prev => prev.map((x, i) => i === idx ? { ...x, total: e.target.value === "" ? "" : Number(e.target.value) } : x))} />
              </div>
            ))}
            <button type="button" onClick={() => setTicketTypes([...ticketTypes, { name: "", price: "", total: "" }])}>+ Thêm</button>
          </div>
        )}

        <div className="form-group" style={{ marginTop: 15 }}>
          <label>Banner</label>
          <input type="file" onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) {
              setCreatingImageFile(file);
              setCreatingImagePreview(URL.createObjectURL(file));
            }
          }} />
        </div>

        {/* --- KHANH BRANCH FLAGS --- */}
        <div style={{ display: "flex", gap: 16, margin: "15px 0" }}>
          <label><input type="checkbox" checked={isFeatured} onChange={e => setIsFeatured(e.target.checked)} /> Đặc biệt</label>
          <label><input type="checkbox" checked={isTrending} onChange={e => setIsTrending(e.target.checked)} /> Xu hướng</label>
        </div>

        <button className="btn primary full-width" type="submit" disabled={loading}>Tạo sự kiện</button>
      </form>

      {/* --- EVENTS TABLE --- */}
      <div>
        <h2>Danh sách sự kiện</h2>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: "#eee" }}>
              <th>Ảnh</th>
              <th>Tên</th>
              <th>Giá</th>
              <th>Kho (Còn/Tổng)</th>
              <th>Hạng vé</th>
              <th>Flags</th>
              <th>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {events.map((ev) => {
              const isEditing = editingId === ev._id;
              const row = isEditing ? editingEvent : ev;
              
              return (
                <tr key={ev._id} style={{ borderBottom: "1px solid #ddd" }}>
                  <td><img src={row.imageUrl?.startsWith("http") ? row.imageUrl : `${backendBase}${row.imageUrl}`} width={50} /></td>
                  <td>
                    {isEditing ? <input value={row.title} onChange={e => setEditingEvent({...row, title: e.target.value})} /> : row.title}
                  </td>
                  <td>{row.price?.toLocaleString()}đ</td>
                  <td>{Number(row.ticketsTotal ?? 0) - Number(row.ticketsSold ?? 0)} / {row.ticketsTotal}</td>
                  <td>{renderTicketTypesText(row as EventItem)}</td>
                  <td>
                    {isEditing ? (
                      <>
                        <input type="checkbox" checked={row.isFeatured} onChange={e => setEditingEvent({...row, isFeatured: e.target.checked})} /> ⭐
                        <input type="checkbox" checked={row.isTrending} onChange={e => setEditingEvent({...row, isTrending: e.target.checked})} /> 🔥
                      </>
                    ) : (
                      <>{ev.isFeatured && "⭐"} {ev.isTrending && "🔥"}</>
                    )}
                  </td>
                  <td>
                    {isEditing ? (
                      <button onClick={saveEdit}>Lưu</button>
                    ) : (
                      <button onClick={() => startEdit(ev)}>Sửa</button>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};