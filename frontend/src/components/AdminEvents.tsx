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
  tags?: string[];
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
  const [tags, setTags] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Available tags from Navbar categories
  const availableTags = ["nhạc sống", "sân khấu & nghệ thuật", "thể thao", "khác"];

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingEvent, setEditingEvent] = useState<Partial<EventItem>>({});
  const [savedEventId, setSavedEventId] = useState<string | null>(null); // Track which event was just saved

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
        tags: Array.isArray(tags) ? tags.filter((t) => t && String(t).trim().length > 0) : [],
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
      setImageUrl(""); setIsFeatured(false); setIsTrending(false); setTags([]);
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
      tags: Array.isArray(ev.tags) ? ev.tags : [],
    });
    setSavedEventId(null); // Reset saved state when starting new edit
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditingEvent({});
    setEditingImageFile(null);
    setEditingImagePreview(null);
    setSavedEventId(null); // Reset saved state when canceling
  };

  const saveEdit = async () => {
    if (!editingId) {
      console.error("❌ saveEdit: No editingId");
      return;
    }
    
    console.log("🔍 saveEdit called:", { editingId, editingEvent });
    
    setError(null);
    setLoading(true);

    try {
      if (!token) throw new Error("Thiếu token admin");

      let finalImageUrl = editingEvent.imageUrl || "";
      if (editingImageFile) {
        finalImageUrl = await uploadImage(editingImageFile);
      }

      const hasTicketTypes = Array.isArray(editingEvent.ticketTypes) && editingEvent.ticketTypes.length > 0;

      // Process tags - ensure it's always sent, even if empty array
      const processedTags = Array.isArray(editingEvent.tags) 
        ? editingEvent.tags.filter((t) => t && String(t).trim().length > 0).map((t) => String(t).trim())
        : [];
      
      console.log("🔍 Frontend saveEdit - Tags processing:", {
        editingEventTags: editingEvent.tags,
        processedTags,
        tagsType: typeof editingEvent.tags,
        tagsIsArray: Array.isArray(editingEvent.tags),
      });

      // Clean payload - remove fields that shouldn't be sent
      // Handle date - convert to ISO string if it's a valid date
      let dateValue: string | undefined = undefined;
      if (editingEvent.date) {
        try {
          // If date is already in ISO format or date string, use it
          if (typeof editingEvent.date === 'string') {
            const dateObj = new Date(editingEvent.date);
            if (!isNaN(dateObj.getTime())) {
              dateValue = dateObj.toISOString();
            }
          }
        } catch (e) {
          console.warn("Invalid date format:", editingEvent.date);
        }
      }

      const payload: any = {
        title: editingEvent.title,
        description: editingEvent.description,
        location: editingEvent.location,
        date: dateValue,
        imageUrl: finalImageUrl || undefined,
        isFeatured: editingEvent.isFeatured === true,
        isTrending: editingEvent.isTrending === true,
        // Always include tags, even if empty array - ensure it's always sent
        tags: processedTags,
      };

      console.log("🔍 Frontend saveEdit - Full payload with tags:", {
        ...payload,
        tags: payload.tags,
        tagsType: typeof payload.tags,
        tagsIsArray: Array.isArray(payload.tags),
        tagsLength: Array.isArray(payload.tags) ? payload.tags.length : 0,
      });

      // Handle ticketTypes or price/ticketsTotal
      if (hasTicketTypes) {
        // Clean ticketTypes - only send name, price, total
        payload.ticketTypes = editingEvent.ticketTypes
          ?.filter((tt) => tt && tt.name && typeof tt.price === 'number' && typeof tt.total === 'number')
          .map((tt) => ({
            name: String(tt.name).trim(),
            price: Number(tt.price),
            total: Number(tt.total),
          })) || [];
      } else {
        // Only set price/ticketsTotal if not using ticketTypes
        if (editingEvent.price !== undefined && editingEvent.price !== null) {
          const priceNum = typeof editingEvent.price === 'number' ? editingEvent.price : Number(editingEvent.price);
          if (!isNaN(priceNum)) {
            payload.price = priceNum;
          }
        }
        if (editingEvent.ticketsTotal !== undefined && editingEvent.ticketsTotal !== null) {
          const totalNum = typeof editingEvent.ticketsTotal === 'number' ? editingEvent.ticketsTotal : Number(editingEvent.ticketsTotal);
          if (!isNaN(totalNum)) {
            payload.ticketsTotal = totalNum;
          }
        }
      }

      // Debug: Log payload being sent
      console.log("🔍 Frontend PUT - Sending payload:", {
        editingEventId: editingId,
        payload,
        hasTicketTypes,
      });

      const res = await fetch(`${API_BASE}/events/${editingId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        console.error("❌ PUT /api/events error:", data);
        throw new Error(data.message || "Cập nhật thất bại");
      }

      console.log("✅ PUT /api/events success:", data);

      // Show success feedback before closing
      setSavedEventId(editingId);
      await loadEvents();
      
      // Close edit form after showing success message for 1.5 seconds
      setTimeout(() => {
        cancelEdit();
        setSavedEventId(null);
      }, 1500);
    } catch (err: any) {
      console.error("❌ saveEdit error:", err);
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

        {/* Tags Selection */}
        <div className="form-group" style={{ marginTop: 15 }}>
          <label>Tags (Phân loại sự kiện)</label>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 8 }}>
            {availableTags.map((tag) => {
              const isSelected = tags.includes(tag);
              return (
                <button
                  key={tag}
                  type="button"
                  onClick={() => {
                    if (isSelected) {
                      setTags(tags.filter((t) => t !== tag));
                    } else {
                      setTags([...tags, tag]);
                    }
                  }}
                  style={{
                    padding: "6px 12px",
                    border: isSelected ? "2px solid #3b82f6" : "1px solid #d1d5db",
                    borderRadius: "16px",
                    backgroundColor: isSelected ? "#eff6ff" : "#fff",
                    color: isSelected ? "#3b82f6" : "#374151",
                    cursor: "pointer",
                    fontSize: "13px",
                    fontWeight: isSelected ? "600" : "400",
                  }}
                >
                  {isSelected && "✓ "}{tag}
                </button>
              );
            })}
          </div>
          {tags.length > 0 && (
            <div style={{ marginTop: 8, fontSize: "12px", color: "#6b7280" }}>
              Đã chọn: {tags.join(", ")}
            </div>
          )}
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
                      <div>
                        <div style={{ marginBottom: 8 }}>
                          <input type="checkbox" checked={row.isFeatured} onChange={e => setEditingEvent({...row, isFeatured: e.target.checked})} /> ⭐
                          <input type="checkbox" checked={row.isTrending} onChange={e => setEditingEvent({...row, isTrending: e.target.checked})} /> 🔥
                        </div>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                          {availableTags.map((tag) => {
                            const isSelected = (row.tags || []).includes(tag);
                            return (
                              <button
                                key={tag}
                                type="button"
                                onClick={() => {
                                  const currentTags = row.tags || [];
                                  const newTags = isSelected
                                    ? currentTags.filter((t) => t !== tag)
                                    : [...currentTags, tag];
                                  setEditingEvent({ ...row, tags: newTags });
                                }}
                                style={{
                                  padding: "4px 8px",
                                  border: isSelected ? "2px solid #3b82f6" : "1px solid #d1d5db",
                                  borderRadius: "12px",
                                  backgroundColor: isSelected ? "#eff6ff" : "#fff",
                                  color: isSelected ? "#3b82f6" : "#374151",
                                  cursor: "pointer",
                                  fontSize: "11px",
                                }}
                              >
                                {isSelected && "✓ "}{tag}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    ) : (
                      <div>
                        <div>{ev.isFeatured && "⭐"} {ev.isTrending && "🔥"}</div>
                        {(ev.tags || []).length > 0 && (
                          <div style={{ marginTop: 4, display: "flex", flexWrap: "wrap", gap: 4 }}>
                            {ev.tags?.map((tag, idx) => (
                              <span key={idx} style={{ fontSize: "10px", padding: "2px 6px", backgroundColor: "#f3f4f6", borderRadius: "8px" }}>
                                {tag}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </td>
                  <td>
                    {isEditing ? (
                      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                        {savedEventId === ev._id ? (
                          <span style={{ 
                            padding: "6px 12px",
                            backgroundColor: "#10b981",
                            color: "#ffffff",
                            borderRadius: "6px",
                            fontSize: "14px",
                            fontWeight: "500",
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "6px"
                          }}>
                            <span>✓</span> Đã lưu
                          </span>
                        ) : (
                          <>
                            <button 
                              onClick={saveEdit} 
                              disabled={loading}
                              style={{
                                padding: "6px 12px",
                                backgroundColor: "#3b82f6",
                                color: "#ffffff",
                                border: "none",
                                borderRadius: "6px",
                                cursor: loading ? "not-allowed" : "pointer",
                                fontSize: "14px",
                                fontWeight: "500",
                                opacity: loading ? 0.6 : 1
                              }}
                            >
                              {loading ? "Đang lưu..." : "Lưu"}
                            </button>
                            <button 
                              onClick={cancelEdit}
                              disabled={loading}
                              style={{
                                padding: "6px 12px",
                                backgroundColor: "#e5e7eb",
                                color: "#374151",
                                border: "none",
                                borderRadius: "6px",
                                cursor: loading ? "not-allowed" : "pointer",
                                fontSize: "14px",
                                fontWeight: "500",
                                opacity: loading ? 0.6 : 1
                              }}
                            >
                              Hủy
                            </button>
                          </>
                        )}
                      </div>
                    ) : (
                      <button 
                        onClick={() => startEdit(ev)}
                        style={{
                          padding: "6px 12px",
                          backgroundColor: "#e5e7eb",
                          color: "#374151",
                          border: "none",
                          borderRadius: "6px",
                          cursor: "pointer",
                          fontSize: "14px",
                          fontWeight: "500"
                        }}
                      >
                        Sửa
                      </button>
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