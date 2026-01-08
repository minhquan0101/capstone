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

  // Create form states
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

  const [isFeatured, setIsFeatured] = useState(false);
  const [isTrending, setIsTrending] = useState(false);
  const [tags, setTags] = useState<string[]>([]);

  // Available tags for selection
  const availableTags = ["nhạc sống", "sân khấu & nghệ thuật", "thể thao", "khác"];

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Edit states
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingEvent, setEditingEvent] = useState<Partial<EventItem>>({});
  const [savedEventId, setSavedEventId] = useState<string | null>(null); // Track which event was just saved

  // Image upload states
  const [creatingImageFile, setCreatingImageFile] = useState<File | null>(null);
  const [creatingImagePreview, setCreatingImagePreview] = useState<string | null>(null);
  const [creatingImageInputKey, setCreatingImageInputKey] = useState(0);

  const [editingImageFile, setEditingImageFile] = useState<File | null>(null);
  const [editingImagePreview, setEditingImagePreview] = useState<string | null>(null);

  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
  const backendBase = API_BASE.replace(/\/api\/?$/, "");

  const resolveImage = (url?: string) => {
    if (!url) return "";
    return url.startsWith("http") ? url : `${backendBase}${url}`;
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return "—";
    try {
      return new Date(dateString).toLocaleDateString("vi-VN");
    } catch {
      return "—";
    }
  };

  // cleanup objectURL
  useEffect(() => {
    return () => {
      if (creatingImagePreview) URL.revokeObjectURL(creatingImagePreview);
      if (editingImagePreview) URL.revokeObjectURL(editingImagePreview);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadEvents = async () => {
    try {
      setError(null);
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

      let finalImageUrl = "";
      if (creatingImageFile) {
        finalImageUrl = await uploadImage(creatingImageFile);
      }

      const payload: any = {
        title,
        description,
        location,
        date: date ? new Date(date).toISOString() : null,
        imageUrl: finalImageUrl || undefined,
        isFeatured,
        isTrending,
        tags: Array.isArray(tags) ? tags.filter((t) => t && String(t).trim().length > 0) : [],
      };

      // Debug: Log tags being sent
      console.log("🔍 Frontend POST - Sending tags:", {
        tagsState: tags,
        tagsProcessed: payload.tags,
        tagsIsArray: Array.isArray(tags),
        tagsLength: Array.isArray(tags) ? tags.length : 0,
      });

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

      // Reset form
      setTitle("");
      setDescription("");
      setLocation("");
      setDate("");
      setPrice("");
      setTicketsTotal("");
      setUseTicketTypes(false);
      setTicketTypes([{ name: "Vé thường", price: "", total: "" }]);
      setIsFeatured(false);
      setIsTrending(false);
      setTags([]);

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

  const startEdit = (ev: EventItem) => {
    setEditingId(ev._id);
    setEditingEvent({
      ...ev,
      date: ev.date ? new Date(ev.date).toISOString().slice(0, 10) : "",
      tags: Array.isArray(ev.tags) ? ev.tags : [],
      ticketTypes: Array.isArray(ev.ticketTypes) ? ev.ticketTypes : [],
      isFeatured: ev.isFeatured === true,
      isTrending: ev.isTrending === true,
    });
    setEditingImageFile(null);
    setEditingImagePreview(null);
    setSavedEventId(null); // Reset saved state when starting new edit
    setError(null); // Clear any previous errors
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditingEvent({});
    setEditingImageFile(null);
    setEditingImagePreview(null);
    setSavedEventId(null); // Reset saved state when canceling
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

      // Ensure tags is always included, even if empty array
      const processedTags = Array.isArray(editingEvent.tags) 
        ? editingEvent.tags.filter((t) => t && String(t).trim().length > 0)
        : [];

      // Clean payload - only send necessary fields
      const payload: any = {
        title: editingEvent.title,
        description: editingEvent.description,
        location: editingEvent.location,
        date: editingEvent.date ? new Date(editingEvent.date).toISOString() : undefined,
        imageUrl: finalImageUrl || undefined,
        isFeatured: editingEvent.isFeatured === true,
        isTrending: editingEvent.isTrending === true,
        tags: processedTags,
      };

      // Handle ticketTypes or price/ticketsTotal
      if (hasTicketTypes) {
        // Clean ticketTypes - only send name, price, total
        payload.ticketTypes = editingEvent.ticketTypes
          ?.filter((tt) => tt && tt.name && (typeof tt.price === 'number' || tt.price === '') && (typeof tt.total === 'number' || tt.total === ''))
          .map((tt) => {
            const price = typeof tt.price === 'number' ? tt.price : (tt.price === '' ? 0 : Number(tt.price) || 0);
            const total = typeof tt.total === 'number' ? tt.total : (tt.total === '' ? 0 : Number(tt.total) || 0);
            return {
              name: String(tt.name).trim(),
              price: price,
              total: total,
            };
          })
          .filter((tt) => tt.name && !isNaN(tt.price) && !isNaN(tt.total) && tt.price >= 0 && tt.total >= 0) || [];
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
    return types
      .map((t) => `${t.name} (${Number(t.price).toLocaleString()}đ)`)
      .join(" • ");
  };

  return (
    <div className="admin-events">
      {/* ===== CREATE ===== */}
      <div className="admin-card">
        <div className="admin-card__header">
          <div>
            <h2 className="admin-title">Tạo sự kiện mới</h2>
            <p className="admin-subtitle">Nhập thông tin sự kiện và cấu hình vé</p>
          </div>
          <div className="admin-badges">
            {isFeatured && <span className="badge badge-star">⭐ Đặc biệt</span>}
            {isTrending && <span className="badge badge-fire">🔥 Xu hướng</span>}
          </div>
        </div>

        {error && <div className="admin-alert">{error}</div>}

        <form onSubmit={handleCreate} className="admin-form">
          <div className="admin-grid">
            <div className="admin-field span-2">
              <label>Tiêu đề</label>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="VD: Concert cuối năm 2025"
                required
              />
            </div>

            <div className="admin-field span-2">
              <label>Mô tả / Giới thiệu</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                placeholder="Mô tả nội dung, lịch trình, lưu ý, điều kiện tham gia..."
              />
            </div>

            <div className="admin-field">
              <label>Địa điểm</label>
              <input
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder=""
              />
            </div>

            <div className="admin-field">
              <label>Ngày</label>
              <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            </div>

            <div className="admin-field span-2">
              <label className="inline">
                <input
                  type="checkbox"
                  checked={useTicketTypes}
                  onChange={(e) => setUseTicketTypes(e.target.checked)}
                />
                <span>Chia hạng vé</span>
              </label>
            </div>

            {!useTicketTypes ? (
              <>
                <div className="admin-field">
                  <label>Giá vé</label>
                  <input
                    type="number"
                    placeholder=""
                    value={price}
                    onChange={(e) =>
                      setPrice(e.target.value === "" ? "" : Number(e.target.value))
                    }
                  />
                </div>

                <div className="admin-field">
                  <label>Tổng vé</label>
                  <input
                    type="number"
                    placeholder=""
                    value={ticketsTotal}
                    onChange={(e) =>
                      setTicketsTotal(e.target.value === "" ? "" : Number(e.target.value))
                    }
                  />
                </div>
              </>
            ) : (
              <div className="admin-field span-2">
                <div className="tickettypes-wrap">
                  {ticketTypes.map((t, idx) => (
                    <div key={idx} className="tickettype-row">
                      <input
                        placeholder="Tên hạng (VD: VIP)"
                        value={t.name}
                        onChange={(e) =>
                          setTicketTypes((prev) =>
                            prev.map((x, i) => (i === idx ? { ...x, name: e.target.value } : x))
                          )
                        }
                      />
                      <input
                        type="number"
                        placeholder="Giá"
                        value={t.price}
                        onChange={(e) =>
                          setTicketTypes((prev) =>
                            prev.map((x, i) =>
                              i === idx
                                ? {
                                    ...x,
                                    price:
                                      e.target.value === "" ? "" : Number(e.target.value),
                                  }
                                : x
                            )
                          )
                        }
                      />
                      <input
                        type="number"
                        placeholder="Số vé"
                        value={t.total}
                        onChange={(e) =>
                          setTicketTypes((prev) =>
                            prev.map((x, i) =>
                              i === idx
                                ? {
                                    ...x,
                                    total:
                                      e.target.value === "" ? "" : Number(e.target.value),
                                  }
                                : x
                            )
                          )
                        }
                      />
                      <button
                        type="button"
                        className="btn-icon"
                        title="Xóa hạng"
                        onClick={() => {
                          setTicketTypes((prev) =>
                            prev.length <= 1 ? prev : prev.filter((_, i) => i !== idx)
                          );
                        }}
                      >
                        ✕
                      </button>
                    </div>
                  ))}

                  <button
                    type="button"
                    className="btn secondary"
                    onClick={() => setTicketTypes([...ticketTypes, { name: "", price: "", total: "" }])}
                  >
                    + Thêm hạng vé
                  </button>
                </div>
              </div>
            )}

            <div className="admin-field span-2">
              <label>Banner</label>
              <div className="upload-row">
                <input
                  key={creatingImageInputKey}
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      setCreatingImageFile(file);
                      const url = URL.createObjectURL(file);
                      setCreatingImagePreview(url);
                    } else {
                      setCreatingImageFile(null);
                      setCreatingImagePreview(null);
                    }
                  }}
                />
                {creatingImagePreview && (
                  <img className="upload-preview" src={creatingImagePreview} alt="preview" />
                )}
              </div>
            </div>

            <div className="admin-field span-2">
              <div className="toggle-row">
                <label className="inline">
                  <input
                    type="checkbox"
                    checked={isFeatured}
                    onChange={(e) => setIsFeatured(e.target.checked)}
                  />
                  <span>Đặc biệt</span>
                </label>

                <label className="inline">
                  <input
                    type="checkbox"
                    checked={isTrending}
                    onChange={(e) => setIsTrending(e.target.checked)}
                  />
                  <span>Xu hướng</span>
                </label>
              </div>
            </div>

            <div className="admin-field span-2">
              <label>Tags (nhãn phân loại)</label>
              <div style={{ 
                display: "flex", 
                flexWrap: "wrap", 
                gap: "12px", 
                marginBottom: "12px",
                padding: "12px",
                backgroundColor: "#f9fafb",
                borderRadius: "8px",
                border: "1px solid #e5e7eb"
              }}>
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
                        padding: "8px 16px",
                        border: isSelected ? "2px solid #3b82f6" : "1px solid #d1d5db",
                        borderRadius: "20px",
                        backgroundColor: isSelected ? "#eff6ff" : "#fff",
                        color: isSelected ? "#3b82f6" : "#374151",
                        cursor: "pointer",
                        fontSize: "14px",
                        fontWeight: isSelected ? "600" : "400",
                        transition: "all 0.2s",
                        display: "flex",
                        alignItems: "center",
                        gap: "6px"
                      }}
                    >
                      {isSelected && <span>✓</span>}
                      {tag}
                    </button>
                  );
                })}
              </div>
              {tags.length > 0 && (
                <div style={{ marginTop: "8px" }}>
                  <p style={{ fontSize: "12px", color: "#6b7280", marginBottom: "8px" }}>
                    Đã chọn ({tags.length}):
                  </p>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                    {tags.map((tag, idx) => (
                      <span
                        key={idx}
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          padding: "4px 12px",
                          backgroundColor: "#eff6ff",
                          color: "#3b82f6",
                          borderRadius: "16px",
                          fontSize: "13px",
                          gap: "6px",
                          fontWeight: "500"
                        }}
                      >
                        {tag}
                        <button
                          type="button"
                          onClick={() => setTags(tags.filter((_, i) => i !== idx))}
                          style={{
                            background: "none",
                            border: "none",
                            color: "#3b82f6",
                            cursor: "pointer",
                            fontSize: "16px",
                            padding: 0,
                            lineHeight: 1,
                            display: "flex",
                            alignItems: "center"
                          }}
                          title="Xóa tag"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="admin-actions">
            <button className="btn primary" type="submit" disabled={loading}>
              {loading ? "Đang xử lý..." : "Tạo sự kiện"}
            </button>
          </div>
        </form>
      </div>

      {/* ===== LIST ===== */}
      <div className="admin-card">
        <div className="admin-card__header">
          <div>
            <h2 className="admin-title">Danh sách sự kiện</h2>
            <p className="admin-subtitle">Quản lý sự kiện đã tạo</p>
          </div>
          <button className="btn secondary" type="button" onClick={loadEvents} disabled={loading}>
            Làm mới
          </button>
        </div>

        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Ảnh</th>
                <th>Thông tin</th>
                <th>Ngày</th>
                <th>Giá</th>
                <th>Kho</th>
                <th>Hạng vé</th>
                <th>Flags</th>
                <th style={{ width: 180 }}>Thao tác</th>
              </tr>
            </thead>

            <tbody>
              {events.map((ev) => {
                const isEditing = editingId === ev._id;
                const row = (isEditing ? editingEvent : ev) as EventItem;

                const total = Number(row.ticketsTotal ?? 0);
                const sold = Number(row.ticketsSold ?? 0);
                const remaining = Math.max(0, total - sold);

                return (
                  <tr key={ev._id}>
                    <td>
                      <img
                        className="thumb"
                        src={resolveImage(row.imageUrl) || "https://via.placeholder.com/120x72?text=No+Image"}
                        alt="thumb"
                      />
                      {isEditing && (
                        <div style={{ marginTop: 8 }}>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => {
                              const f = e.target.files?.[0] || null;
                              setEditingImageFile(f);
                              setEditingImagePreview(f ? URL.createObjectURL(f) : null);
                            }}
                          />
                          {editingImagePreview && (
                            <img className="thumb" style={{ marginTop: 8 }} src={editingImagePreview} alt="edit-preview" />
                          )}
                        </div>
                      )}
                    </td>

                    <td>
                      {isEditing ? (
                        <div className="cell-stack">
                          <input
                            value={row.title || ""}
                            onChange={(e) => setEditingEvent({ ...row, title: e.target.value })}
                          />
                          <textarea
                            value={row.description || ""}
                            onChange={(e) =>
                              setEditingEvent({ ...row, description: e.target.value })
                            }
                            rows={3}
                            placeholder="Mô tả..."
                          />
                          <input
                            value={row.location || ""}
                            onChange={(e) => setEditingEvent({ ...row, location: e.target.value })}
                            placeholder="Địa điểm..."
                          />
                        </div>
                      ) : (
                        <div className="cell-info">
                          <div className="cell-title">{row.title}</div>
                          <div className="cell-meta">
                            {row.location || "—"}
                            {!!row.description && (
                              <>
                                {" • "}
                                <span className="muted">
                                  {row.description.length > 70
                                    ? row.description.slice(0, 70) + "..."
                                    : row.description}
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                      )}
                    </td>

                    <td>
                      {isEditing ? (
                        <input
                          type="date"
                          value={(row.date as string) || ""}
                          onChange={(e) => setEditingEvent({ ...row, date: e.target.value })}
                        />
                      ) : (
                        formatDate(row.date)
                      )}
                    </td>

                    <td>{row.price ? `${row.price.toLocaleString()}đ` : "—"}</td>

                    <td>{total ? `${remaining} / ${total}` : "—"}</td>

                    <td className="muted">{renderTicketTypesText(row)}</td>

                    <td>
                      {isEditing ? (
                        <div>
                          <div className="badge-row">
                            <label className="inline">
                              <input
                                type="checkbox"
                                checked={!!row.isFeatured}
                                onChange={(e) =>
                                  setEditingEvent({ ...row, isFeatured: e.target.checked })
                                }
                              />
                              <span>⭐</span>
                            </label>
                            <label className="inline">
                              <input
                                type="checkbox"
                                checked={!!row.isTrending}
                                onChange={(e) =>
                                  setEditingEvent({ ...row, isTrending: e.target.checked })
                                }
                              />
                              <span>🔥</span>
                            </label>
                          </div>
                          <div style={{ marginTop: "8px" }}>
                            <div style={{ 
                              display: "flex", 
                              flexWrap: "wrap", 
                              gap: "6px", 
                              marginBottom: "8px",
                              padding: "8px",
                              backgroundColor: "#f9fafb",
                              borderRadius: "6px"
                            }}>
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
                                      padding: "4px 10px",
                                      border: isSelected ? "2px solid #3b82f6" : "1px solid #d1d5db",
                                      borderRadius: "16px",
                                      backgroundColor: isSelected ? "#eff6ff" : "#fff",
                                      color: isSelected ? "#3b82f6" : "#374151",
                                      cursor: "pointer",
                                      fontSize: "11px",
                                      fontWeight: isSelected ? "600" : "400",
                                      transition: "all 0.2s",
                                      display: "flex",
                                      alignItems: "center",
                                      gap: "4px"
                                    }}
                                  >
                                    {isSelected && <span>✓</span>}
                                    {tag}
                                  </button>
                                );
                              })}
                            </div>
                            {(row.tags || []).length > 0 && (
                              <div style={{ display: "flex", flexWrap: "wrap", gap: "4px" }}>
                                {(row.tags || []).map((tag, idx) => (
                                  <span
                                    key={idx}
                                    style={{
                                      display: "inline-flex",
                                      alignItems: "center",
                                      padding: "2px 8px",
                                      backgroundColor: "#eff6ff",
                                      color: "#3b82f6",
                                      borderRadius: "12px",
                                      fontSize: "11px",
                                      gap: "4px"
                                    }}
                                  >
                                    {tag}
                                    <button
                                      type="button"
                                      onClick={() => {
                                        const newTags = (row.tags || []).filter((_, i) => i !== idx);
                                        setEditingEvent({ ...row, tags: newTags });
                                      }}
                                      style={{
                                        background: "none",
                                        border: "none",
                                        color: "#3b82f6",
                                        cursor: "pointer",
                                        fontSize: "14px",
                                        padding: 0,
                                        lineHeight: 1
                                      }}
                                    >
                                      ×
                                    </button>
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      ) : (
                        <div>
                          <div className="badge-row">
                            {ev.isFeatured && <span className="badge badge-star">⭐</span>}
                            {ev.isTrending && <span className="badge badge-fire">🔥</span>}
                            {!ev.isFeatured && !ev.isTrending && <span className="muted">—</span>}
                          </div>
                          {(ev.tags || []).length > 0 && (
                            <div style={{ marginTop: "4px", display: "flex", flexWrap: "wrap", gap: "4px" }}>
                              {ev.tags?.map((tag, idx) => (
                                <span
                                  key={idx}
                                  style={{
                                    display: "inline-block",
                                    padding: "2px 8px",
                                    backgroundColor: "#f3f4f6",
                                    color: "#374151",
                                    borderRadius: "12px",
                                    fontSize: "11px"
                                  }}
                                >
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
                        <div className="row-actions">
                          {savedEventId === ev._id ? (
                            <span className="btn success">
                              <span>✓</span> Đã lưu
                            </span>
                          ) : (
                            <button className="btn primary" onClick={saveEdit} disabled={loading}>
                              {loading ? "Đang lưu..." : "Lưu"}
                            </button>
                          )}
                          {savedEventId !== ev._id && (
                            <button
                              type="button"
                              className="btn secondary"
                              onClick={cancelEdit}
                              disabled={loading}
                            >
                              Hủy
                            </button>
                          )}
                        </div>
                      ) : (
                        <div className="row-actions">
                          <button className="btn secondary" onClick={() => startEdit(ev)}>
                            Sửa
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {events.length === 0 && (
            <div className="admin-empty">Chưa có sự kiện nào.</div>
          )}
        </div>
      </div>
    </div>
  );
};
