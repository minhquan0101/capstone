import React, { useEffect, useState } from "react";
import { API_BASE, uploadImage } from "../utils/api";

interface EventItem {
  _id: string;
  title: string;
  description?: string;
  location?: string;
  date?: string;
  price?: number;
  imageUrl?: string;
}


export const AdminEvents: React.FC = () => {
  const [events, setEvents] = useState<EventItem[]>([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [date, setDate] = useState("");
  const [price, setPrice] = useState<number | "">("");
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

      const res = await fetch(`${API_BASE}/events`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title,
          description,
          location,
          date: date ? new Date(date).toISOString() : null,
          price: price === "" ? undefined : Number(price),
          imageUrl: finalImageUrl,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Tạo sự kiện thất bại");
      setTitle("");
      setDescription("");
      setLocation("");
      setDate("");
      setPrice("");
      setImageUrl("");
      setCreatingImageFile(null);
      setCreatingImagePreview(null);
      setCreatingImageInputKey((prev) => prev + 1); // Reset file input
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
        headers: {
          Authorization: `Bearer ${token}`,
        },
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

      const res = await fetch(`${API_BASE}/events/${editingId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...editingEvent,
          price:
            editingEvent.price === undefined || editingEvent.price === null
              ? undefined
              : Number(editingEvent.price),
          imageUrl: finalImageUrl,
          date: editingEvent.date ? new Date(editingEvent.date).toISOString() : undefined,
        }),
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
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
        </div>
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
          <label>Hình ảnh sự kiện</label>
          <input
            key={creatingImageInputKey}
            type="file"
            accept="image/*"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) {
                setCreatingImageFile(file);
                // Tạo preview cho ảnh
                const reader = new FileReader();
                reader.onloadend = () => {
                  setCreatingImagePreview(reader.result as string);
                };
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
                <th style={{ padding: 8, textAlign: "left" }}>Giá vé (VNĐ)</th>
                <th style={{ padding: 8 }}></th>
              </tr>
            </thead>
            <tbody>
              {events.map((ev) => {
                const isEditing = editingId === ev._id;
                const row = isEditing ? editingEvent : ev;
                return (
                  <tr key={ev._id} style={{ borderBottom: "1px solid #e5e7eb" }}>
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
                                // Tạo preview cho ảnh mới
                                const reader = new FileReader();
                                reader.onloadend = () => {
                                  setEditingImagePreview(reader.result as string);
                                };
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
                    <td style={{ padding: 8 }}>
                      {isEditing ? (
                        <input
                          type="text"
                          value={row.title || ""}
                          onChange={(e) =>
                            setEditingEvent((prev) => ({ ...prev, title: e.target.value }))
                          }
                        />
                      ) : (
                        <strong>{ev.title}</strong>
                      )}
                    </td>
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
                    <td style={{ padding: 8 }}>
                      {isEditing ? (
                        <input
                          type="datetime-local"
                          value={
                            row.date
                              ? new Date(row.date).toISOString().slice(0, 16)
                              : ""
                          }
                          onChange={(e) =>
                            setEditingEvent((prev) => ({ ...prev, date: e.target.value }))
                          }
                        />
                      ) : (
                        ev.date && (
                          <span className="event-meta">
                            {new Date(ev.date).toLocaleString("vi-VN")}
                          </span>
                        )
                      )}
                    </td>
                    <td style={{ padding: 8 }}>
                      {isEditing ? (
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
                      ) : (
                        <span className="event-meta">
                          {ev.price ? ev.price.toLocaleString("vi-VN") : "Chưa đặt"}
                        </span>
                      )}
                    </td>
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
                          <button
                            className="btn small outline"
                            type="button"
                            onClick={cancelEdit}
                          >
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
        </div>
      </div>
    </div>
  );
};


