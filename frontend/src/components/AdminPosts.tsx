import React, { useEffect, useMemo, useRef, useState } from "react";
import ReactQuill from "react-quill-new";
import "react-quill-new/dist/quill.snow.css";

import { API_BASE, uploadImage } from "../utils/api";

type PostType = "showbiz" | "blog";
type PostRegion = "vn" | "asia" | "us_eu";
type PostSection = "news" | "photo";

interface AdminPostItem {
  _id: string;
  title: string;
  content: string; // HTML string
  type: PostType;
  imageUrl?: string;

  region?: PostRegion;
  section?: PostSection;
  summary?: string;
  isFeatured?: boolean;
  views?: number;

  createdAt?: string;
  updatedAt?: string;
}

const regionLabel = (r?: PostRegion) => {
  const rr = r || "vn";
  if (rr === "vn") return "Việt Nam";
  if (rr === "asia") return "Châu Á";
  return "Âu Mỹ";
};

const sectionLabel = (s?: PostSection) => ((s || "news") === "photo" ? "Ảnh sao" : "Tin");

// ✅ clean html/text: remove zero-width + NBSP (fix “d” xuống dòng rồi “âu”)
const cleanHidden = (s: string) =>
  (s || "")
    .replace(/[\u200B-\u200D\uFEFF\u00AD]/g, "") // zero-width + soft hyphen
    .replace(/&nbsp;/g, " ")
    .replace(/\u00A0/g, " ");

export const AdminPosts: React.FC = () => {
  const [posts, setPosts] = useState<AdminPostItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ====== Create form state ======
  const [title, setTitle] = useState("");
  const [summary, setSummary] = useState("");
  const [content, setContent] = useState<string>(""); // ✅ HTML
  const [type, setType] = useState<PostType>("showbiz");

  // showbiz fields
  const [region, setRegion] = useState<PostRegion>("vn");
  const [section, setSection] = useState<PostSection>("news");

  // ✅ featured for BOTH showbiz + blog
  const [isFeatured, setIsFeatured] = useState(false);

  // Cover image
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageInputKey, setImageInputKey] = useState(0);

  // ====== Edit state ======
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editSummary, setEditSummary] = useState("");
  const [editContent, setEditContent] = useState<string>(""); // ✅ HTML
  const [editType, setEditType] = useState<PostType>("showbiz");

  const [editRegion, setEditRegion] = useState<PostRegion>("vn");
  const [editSection, setEditSection] = useState<PostSection>("news");
  const [editIsFeatured, setEditIsFeatured] = useState(false);

  const [editImageFile, setEditImageFile] = useState<File | null>(null);
  const [editImagePreview, setEditImagePreview] = useState<string | null>(null);

  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;

  const backendBase = useMemo(() => API_BASE.replace(/\/api\/?$/, ""), []);
  const resolveImage = (url?: string) => {
    if (!url) return "";
    return url.startsWith("http") ? url : `${backendBase}${url}`;
  };

  // ====== QUILL refs + inline image upload ======
  const quillCreateRef = useRef<ReactQuill | null>(null);
  const quillEditRef = useRef<ReactQuill | null>(null);

  const inlineCreateInputRef = useRef<HTMLInputElement | null>(null);
  const inlineEditInputRef = useRef<HTMLInputElement | null>(null);

  const toolbarContainer = useMemo(
    () => [
      [{ header: [1, 2, 3, false] }],
      ["bold", "italic", "underline", "strike"],
      [{ color: [] }, { background: [] }],
      [{ list: "ordered" }, { list: "bullet" }],
      [{ align: [] }],
      ["blockquote", "link", "image"],
      ["clean"],
    ],
    []
  );

  const createModules = useMemo(
    () => ({
      toolbar: {
        container: toolbarContainer,
        handlers: {
          image: () => inlineCreateInputRef.current?.click(),
        },
      },
    }),
    [toolbarContainer]
  );

  const editModules = useMemo(
    () => ({
      toolbar: {
        container: toolbarContainer,
        handlers: {
          image: () => inlineEditInputRef.current?.click(),
        },
      },
    }),
    [toolbarContainer]
  );

  // ✅ insert image into editor at cursor
  const insertImageToEditor = async (file: File, target: "create" | "edit") => {
    const uploadedPath = await uploadImage(file); // "/uploads/xxx.jpg" or full url
    const src = uploadedPath; // keep relative if returned

    const ref = target === "create" ? quillCreateRef.current : quillEditRef.current;
    const editor = ref?.getEditor();
    if (!editor) return;

    const range = editor.getSelection(true);
    const index = range ? range.index : editor.getLength();

    editor.insertEmbed(index, "image", src, "user");

    // ✅ setSelection expects (index:number, length?:number) OR RangeStatic
    editor.setSelection(index + 1, 0);

    // ✅ add a newline after image so typing continues nicely
    editor.insertText(index + 1, "\n", "user");
    editor.setSelection(index + 2, 0);
  };

  const loadPosts = async () => {
    try {
      setError(null);
      const res = await fetch(`${API_BASE}/posts?sort=new&limit=200`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Không tải được danh sách bài đăng");

      const list: AdminPostItem[] = (data.posts || []).map((p: AdminPostItem) => ({
        ...p,
        region: (p.region || "vn") as PostRegion,
        section: (p.section || "news") as PostSection,
        views: typeof p.views === "number" ? p.views : 0,
        isFeatured: !!p.isFeatured,
        summary: p.summary || "",
        content: p.content || "",
      }));

      list.sort((a, b) => +new Date(b.createdAt || 0) - +new Date(a.createdAt || 0));
      setPosts(list);
    } catch (err: any) {
      setError(err?.message || "Có lỗi xảy ra");
    }
  };

  useEffect(() => {
    loadPosts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const resetCreateForm = () => {
    setTitle("");
    setSummary("");
    setContent("");
    setType("showbiz");
    setRegion("vn");
    setSection("news");
    setIsFeatured(false);

    setImageFile(null);
    setImagePreview(null);
    setImageInputKey((k) => k + 1);
  };

  const beginEdit = (p: AdminPostItem) => {
    setEditingId(p._id);

    setEditTitle(p.title || "");
    setEditSummary(p.summary || "");
    setEditContent(p.content || "");

    setEditType(p.type || "showbiz");
    setEditRegion((p.region || "vn") as PostRegion);
    setEditSection((p.section || "news") as PostSection);

    setEditIsFeatured(!!p.isFeatured);

    setEditImageFile(null);
    setEditImagePreview(p.imageUrl ? resolveImage(p.imageUrl) : null);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditTitle("");
    setEditSummary("");
    setEditContent("");
    setEditType("showbiz");
    setEditRegion("vn");
    setEditSection("news");
    setEditIsFeatured(false);
    setEditImageFile(null);
    setEditImagePreview(null);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (!token) throw new Error("Thiếu token admin");

      let finalImageUrl = "";
      if (imageFile) finalImageUrl = await uploadImage(imageFile);

      const payload: any = {
        title: title.trim(),
        summary: summary.trim() || undefined,
        content: cleanHidden(content), // ✅ clean before save
        type,
        imageUrl: finalImageUrl || undefined,

        // ✅ featured for both
        isFeatured: !!isFeatured,
      };

      // showbiz-only fields
      if (type === "showbiz") {
        payload.region = region;
        payload.section = section;
      } else {
        // blog: ensure no region/section
        payload.region = undefined;
        payload.section = undefined;
      }

      const res = await fetch(`${API_BASE}/posts`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Tạo bài đăng thất bại");

      resetCreateForm();
      await loadPosts();
    } catch (err: any) {
      setError(err?.message || "Có lỗi xảy ra");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async (id: string) => {
    setError(null);
    setLoading(true);

    try {
      if (!token) throw new Error("Thiếu token admin");

      let finalImageUrl: string | undefined = undefined;
      if (editImageFile) finalImageUrl = await uploadImage(editImageFile);

      const payload: any = {
        title: editTitle.trim(),
        summary: editSummary.trim() || undefined,
        content: cleanHidden(editContent),
        type: editType,
        isFeatured: !!editIsFeatured,
      };

      if (finalImageUrl) payload.imageUrl = finalImageUrl;

      if (editType === "showbiz") {
        payload.region = editRegion;
        payload.section = editSection;
      } else {
        payload.region = undefined;
        payload.section = undefined;
      }

      const res = await fetch(`${API_BASE}/posts/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Cập nhật bài đăng thất bại");

      cancelEdit();
      await loadPosts();
    } catch (err: any) {
      setError(err?.message || "Có lỗi xảy ra");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    setError(null);

    try {
      if (!token) throw new Error("Thiếu token admin");

      const ok = window.confirm("Bạn chắc chắn muốn xóa bài này?");
      if (!ok) return;

      const res = await fetch(`${API_BASE}/posts/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Xóa bài đăng thất bại");

      if (editingId === id) cancelEdit();
      await loadPosts();
    } catch (err: any) {
      setError(err?.message || "Có lỗi xảy ra");
    }
  };

  return (
    <div style={{ display: "flex", gap: 24, flexDirection: "column" }}>
      {/* ===== CREATE ===== */}
      <form onSubmit={handleCreate} className="auth-form">
        <h2>Tạo bài đăng mới</h2>

        {error && <div className="global-message error">{error}</div>}

        <div className="form-group">
          <label>Tiêu đề (H1)</label>
          <input value={title} onChange={(e) => setTitle(e.target.value)} required />
        </div>

        <div className="form-group">
          <label>Mô tả ngắn (Sapo/Summary)</label>
          <input
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
            placeholder="Dòng mô tả ngắn hiển thị dưới tiêu đề (không bắt buộc)"
          />
        </div>

        <div className="form-group">
          <label>Loại bài</label>
          <select value={type} onChange={(e) => setType(e.target.value as PostType)}>
            <option value="showbiz">Showbiz</option>
            <option value="blog">Blog</option>
          </select>
        </div>

        {/* ✅ Featured for both */}
        <div className="form-group">
          <label style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <input type="checkbox" checked={isFeatured} onChange={(e) => setIsFeatured(e.target.checked)} />
            Đánh dấu nổi bật (Featured)
          </label>
          <div style={{ fontSize: 12, color: "#6b7280", fontWeight: 600, marginTop: 4 }}>
            Blog: dùng để hiện strip “Nổi bật”. Showbiz: hiện ở tab/section tương ứng.
          </div>
        </div>

        {type === "showbiz" && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div className="form-group">
              <label>Khu vực (Tab)</label>
              <select value={region} onChange={(e) => setRegion(e.target.value as PostRegion)}>
                <option value="vn">Việt Nam</option>
                <option value="asia">Châu Á</option>
                <option value="us_eu">Âu Mỹ</option>
              </select>
            </div>

            <div className="form-group">
              <label>Chuyên mục</label>
              <select value={section} onChange={(e) => setSection(e.target.value as PostSection)}>
                <option value="news">Tin</option>
                <option value="photo">Ảnh sao</option>
              </select>
            </div>
          </div>
        )}

        {/* ✅ CONTENT EDITOR */}
        <div className="form-group">
          <label>Nội dung (bôi đen / in đậm / heading / chèn nhiều ảnh)</label>

          {/* input ẩn để chèn ảnh inline trong content */}
          <input
            ref={inlineCreateInputRef}
            type="file"
            accept="image/*"
            style={{ display: "none" }}
            onChange={async (e) => {
              const file = e.target.files?.[0];
              e.target.value = "";
              if (!file) return;
              try {
                setLoading(true);
                await insertImageToEditor(file, "create");
              } catch (err: any) {
                setError(err?.message || "Upload ảnh trong bài thất bại");
              } finally {
                setLoading(false);
              }
            }}
          />

          <div style={{ borderRadius: 12, overflow: "hidden", border: "1px solid #e5e7eb" }}>
            <ReactQuill
              ref={quillCreateRef}
              theme="snow"
              value={content}
              onChange={setContent}
              modules={createModules}
              placeholder="Soạn nội dung như Word… (bấm icon hình ảnh để chèn nhiều ảnh)"
            />
          </div>

          <div style={{ marginTop: 8, fontSize: 12, color: "#6b7280", fontWeight: 600 }}>
            Gợi ý: Title là H1. Sapo dùng ô Summary. Ảnh đại diện dùng “Hình ảnh bài đăng”.
          </div>
        </div>

        {/* COVER IMAGE */}
        <div className="form-group">
          <label>Hình ảnh bài đăng (Ảnh đại diện/hero)</label>
          <input
            key={imageInputKey}
            type="file"
            accept="image/*"
            onChange={(e) => {
              const file = e.target.files?.[0] || null;
              setImageFile(file);
              if (file) setImagePreview(URL.createObjectURL(file));
              else setImagePreview(null);
            }}
          />

          {imagePreview && (
            <div style={{ marginTop: 8 }}>
              <img
                src={imagePreview}
                alt="Preview"
                style={{
                  maxWidth: 260,
                  maxHeight: 170,
                  objectFit: "cover",
                  borderRadius: 10,
                  border: "1px solid #ddd",
                }}
              />
            </div>
          )}
        </div>

        <button className="btn primary full-width" type="submit" disabled={loading}>
          {loading ? "Đang tạo..." : "Tạo bài đăng"}
        </button>
      </form>

      {/* ===== LIST ===== */}
      <div>
        <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 12 }}>
          <h2>Danh sách bài đăng</h2>
          <button className="btn outline" type="button" onClick={loadPosts} disabled={loading}>
            Làm mới
          </button>
        </div>

        {error && <div className="global-message error">{error}</div>}

        <ul style={{ listStyle: "none", paddingLeft: 0, marginTop: 12, display: "grid", gap: 12 }}>
          {posts.map((p) => {
            const isEditing = editingId === p._id;

            return (
              <li
                key={p._id}
                style={{
                  border: "1px solid #e5e7eb",
                  borderRadius: 14,
                  padding: 12,
                  background: "#fff",
                }}
              >
                {/* Header row */}
                <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "flex-start" }}>
                  <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                    {p.imageUrl && (
                      <img
                        src={resolveImage(p.imageUrl)}
                        alt={p.title}
                        style={{
                          width: 96,
                          height: 64,
                          objectFit: "cover",
                          borderRadius: 10,
                          border: "1px solid #ddd",
                        }}
                      />
                    )}

                    <div>
                      <strong style={{ display: "block", lineHeight: 1.35 }}>
                        [{p.type === "showbiz" ? "Showbiz" : "Blog"}]
                        {p.type === "showbiz" ? ` • ${regionLabel(p.region)} • ${sectionLabel(p.section)}` : ""}
                        {p.isFeatured ? " • ⭐ Featured" : ""}{" "}
                        {typeof p.views === "number" ? ` • 👁 ${p.views.toLocaleString()}` : ""}
                        <br />
                        {p.title}
                      </strong>

                      <div className="event-meta" style={{ marginTop: 6 }}>
                        {(p.summary || "").trim() ? p.summary : "—"}
                      </div>
                    </div>
                  </div>

                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "flex-end" }}>
                    {!isEditing ? (
                      <>
                        <button className="btn outline" type="button" onClick={() => beginEdit(p)}>
                          Sửa
                        </button>
                        <button className="btn outline" type="button" onClick={() => handleDelete(p._id)}>
                          Xoá
                        </button>
                      </>
                    ) : (
                      <>
                        <button className="btn outline" type="button" onClick={cancelEdit}>
                          Huỷ
                        </button>
                        <button className="btn primary" type="button" onClick={() => handleUpdate(p._id)} disabled={loading}>
                          {loading ? "Đang lưu..." : "Lưu"}
                        </button>
                      </>
                    )}
                  </div>
                </div>

                {/* Edit form */}
                {isEditing && (
                  <div style={{ marginTop: 12, borderTop: "1px dashed #e5e7eb", paddingTop: 12 }}>
                    <div className="form-group">
                      <label>Tiêu đề</label>
                      <input value={editTitle} onChange={(e) => setEditTitle(e.target.value)} required />
                    </div>

                    <div className="form-group">
                      <label>Mô tả ngắn (Summary)</label>
                      <input value={editSummary} onChange={(e) => setEditSummary(e.target.value)} placeholder="Không bắt buộc" />
                    </div>

                    <div className="form-group">
                      <label>Loại bài</label>
                      <select value={editType} onChange={(e) => setEditType(e.target.value as PostType)}>
                        <option value="showbiz">Showbiz</option>
                        <option value="blog">Blog</option>
                      </select>
                    </div>

                    <div className="form-group">
                      <label style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <input
                          type="checkbox"
                          checked={editIsFeatured}
                          onChange={(e) => setEditIsFeatured(e.target.checked)}
                        />
                        Đánh dấu nổi bật (Featured)
                      </label>
                    </div>

                    {editType === "showbiz" && (
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                        <div className="form-group">
                          <label>Khu vực (Tab)</label>
                          <select value={editRegion} onChange={(e) => setEditRegion(e.target.value as PostRegion)}>
                            <option value="vn">Việt Nam</option>
                            <option value="asia">Châu Á</option>
                            <option value="us_eu">Âu Mỹ</option>
                          </select>
                        </div>

                        <div className="form-group">
                          <label>Chuyên mục</label>
                          <select value={editSection} onChange={(e) => setEditSection(e.target.value as PostSection)}>
                            <option value="news">Tin</option>
                            <option value="photo">Ảnh sao</option>
                          </select>
                        </div>
                      </div>
                    )}

                    {/* inline image input for edit */}
                    <input
                      ref={inlineEditInputRef}
                      type="file"
                      accept="image/*"
                      style={{ display: "none" }}
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        e.target.value = "";
                        if (!file) return;
                        try {
                          setLoading(true);
                          await insertImageToEditor(file, "edit");
                        } catch (err: any) {
                          setError(err?.message || "Upload ảnh trong bài thất bại");
                        } finally {
                          setLoading(false);
                        }
                      }}
                    />

                    <div className="form-group">
                      <label>Nội dung</label>
                      <div style={{ borderRadius: 12, overflow: "hidden", border: "1px solid #e5e7eb" }}>
                        <ReactQuill
                          ref={quillEditRef}
                          theme="snow"
                          value={editContent}
                          onChange={setEditContent}
                          modules={editModules}
                          placeholder="Sửa nội dung…"
                        />
                      </div>
                      <div style={{ marginTop: 8, fontSize: 12, color: "#6b7280", fontWeight: 600 }}>
                        Chèn ảnh trong bài: bấm icon hình ảnh trên toolbar.
                      </div>
                    </div>

                    <div className="form-group">
                      <label>Đổi ảnh đại diện (không bắt buộc)</label>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0] || null;
                          setEditImageFile(file);
                          if (file) setEditImagePreview(URL.createObjectURL(file));
                        }}
                      />

                      {editImagePreview && (
                        <div style={{ marginTop: 8 }}>
                          <img
                            src={editImagePreview}
                            alt="Edit preview"
                            style={{
                              maxWidth: 260,
                              maxHeight: 170,
                              objectFit: "cover",
                              borderRadius: 10,
                              border: "1px solid #ddd",
                            }}
                          />
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
};
