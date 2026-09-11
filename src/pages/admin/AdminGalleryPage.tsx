/**
 * AdminGalleryPage.tsx
 * --------------------
 * Full gallery management with:
 *  - Drag-and-drop / click file upload to Supabase Storage
 *  - Client-side image compression (canvas API, no extra dependencies)
 *  - URL fallback input
 *  - Grid view with hover controls
 *  - Active/inactive toggle + delete (also removes from storage)
 */

import React, { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Upload, Plus, Trash2, Eye, EyeOff, RefreshCw,
  X, ImageIcon, Link, Loader2, CheckCircle, AlertCircle, AlertTriangle,
} from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import type { GalleryItemRow } from "@/types/database.types";

// ── Image compression (canvas-based, no extra deps) ──────────────────
async function compressImage(
  file: File,
  maxWidthPx = 1920,
  quality = 0.82
): Promise<File> {
  // Only compress images larger than 500 KB
  if (file.size < 512 * 1024) return file;

  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      const ratio = Math.min(1, maxWidthPx / img.naturalWidth);
      const canvas = document.createElement("canvas");
      canvas.width = Math.round(img.naturalWidth * ratio);
      canvas.height = Math.round(img.naturalHeight * ratio);
      const ctx = canvas.getContext("2d");
      if (!ctx) { resolve(file); return; }
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      canvas.toBlob(
        (blob) => {
          if (!blob) { resolve(file); return; }
          const compressed = new File([blob], file.name.replace(/\.\w+$/, ".webp"), {
            type: "image/webp",
            lastModified: Date.now(),
          });
          resolve(compressed);
        },
        "image/webp",
        quality
      );
    };
    img.onerror = reject;
    img.src = url;
  });
}

// ── Format bytes ─────────────────────────────────────────────────────
function fmtBytes(b: number): string {
  if (b < 1024) return `${b} B`;
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(0)} KB`;
  return `${(b / 1024 / 1024).toFixed(1)} MB`;
}

// ── Upload queue item ────────────────────────────────────────────────
interface UploadItem {
  id: string;
  file: File;
  preview: string;
  status: "pending" | "compressing" | "uploading" | "done" | "error";
  progress: number;
  error?: string;
  publicUrl?: string;
  originalSize: number;
  compressedSize?: number;
}

// ── Upload Modal ─────────────────────────────────────────────────────
interface UploadModalProps {
  onClose: () => void;
  onUploaded: () => void;
}

function UploadModal({ onClose, onUploaded }: UploadModalProps): React.ReactElement {
  const [queue, setQueue] = useState<UploadItem[]>([]);
  const [tab, setTab] = useState<"upload" | "url">("upload");
  const [urlForm, setUrlForm] = useState({ url: "", title_ar: "", title_en: "" });
  const [savingUrl, setSavingUrl] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  function addFiles(files: FileList | null): void {
    if (!files) return;
    const allowed = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    Array.from(files).filter((f) => allowed.includes(f.type)).forEach((file) => {
      const item: UploadItem = {
        id: `${Date.now()}-${Math.random()}`,
        file,
        preview: URL.createObjectURL(file),
        status: "pending",
        progress: 0,
        originalSize: file.size,
      };
      setQueue((p) => [...p, item]);
    });
  }

  function updateItem(id: string, patch: Partial<UploadItem>): void {
    setQueue((p) => p.map((i) => i.id === id ? { ...i, ...patch } : i));
  }

  async function uploadItem(item: UploadItem): Promise<void> {
    try {
      // 1. Compress
      updateItem(item.id, { status: "compressing", progress: 10 });
      const compressed = await compressImage(item.file);
      updateItem(item.id, {
        status: "uploading",
        progress: 30,
        compressedSize: compressed.size,
      });

      // 2. Upload to storage
      const path = `${Date.now()}-${compressed.name}`;
      const { error: uploadErr } = await supabase.storage
        .from("gallery")
        .upload(path, compressed, { cacheControl: "3600", upsert: false });
      if (uploadErr) throw uploadErr;
      updateItem(item.id, { progress: 80 });

      // 3. Get public URL
      const { data: { publicUrl } } = supabase.storage.from("gallery").getPublicUrl(path);
      updateItem(item.id, { progress: 90 });

      // 4. Save to gallery_items table
      const maxOrder = await supabase.from("gallery_items").select("display_order").order("display_order", { ascending: false }).limit(1);
      const nextOrder = ((maxOrder.data?.[0] as { display_order: number } | undefined)?.display_order ?? 0) + 1;
      await supabase.from("gallery_items").insert({
        image_path: publicUrl,
        display_order: nextOrder,
        is_active: true,
      });

      updateItem(item.id, { status: "done", progress: 100, publicUrl });
    } catch (err) {
      updateItem(item.id, {
        status: "error",
        error: err instanceof Error ? err.message : "فشل الرفع",
      });
    }
  }

  async function startUpload(): Promise<void> {
    const pending = queue.filter((i) => i.status === "pending");
    await Promise.all(pending.map(uploadItem));
    onUploaded();
  }

  async function saveUrl(): Promise<void> {
    if (!urlForm.url.trim()) return;
    setSavingUrl(true);
    const { data: maxData } = await supabase.from("gallery_items").select("display_order").order("display_order", { ascending: false }).limit(1);
    const nextOrder = ((maxData?.[0] as { display_order: number } | undefined)?.display_order ?? 0) + 1;
    await supabase.from("gallery_items").insert({
      image_path: urlForm.url.trim(),
      title_ar: urlForm.title_ar || null,
      title_en: urlForm.title_en || null,
      display_order: nextOrder,
      is_active: true,
    });
    setSavingUrl(false);
    onUploaded();
    onClose();
  }

  const allDone = queue.length > 0 && queue.every((i) => i.status === "done" || i.status === "error");
  const anyBusy = queue.some((i) => i.status === "compressing" || i.status === "uploading");
  const hasPending = queue.some((i) => i.status === "pending");

  const inputCls = "w-full px-3 py-2 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary";

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" dir="rtl">
      <motion.div
        initial={{ opacity: 0, scale: 0.97 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-card rounded-3xl border border-border w-full max-w-xl max-h-[90vh] overflow-hidden flex flex-col"
      >
        {/* Header */}
        <div className="border-b border-border px-6 py-4 flex items-center justify-between shrink-0">
          <h2 className="font-display font-bold">إضافة صور للمعرض</h2>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-muted"><X size={16} /></button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 p-3 border-b border-border shrink-0">
          <button onClick={() => setTab("upload")}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-sm font-medium transition-all ${tab === "upload" ? "bg-primary text-primary-foreground" : "hover:bg-muted text-muted-foreground"
              }`}>
            <Upload size={14} /> رفع من الجهاز
          </button>
          <button onClick={() => setTab("url")}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-sm font-medium transition-all ${tab === "url" ? "bg-primary text-primary-foreground" : "hover:bg-muted text-muted-foreground"
              }`}>
            <Link size={14} /> إدراج رابط
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {/* ── Upload Tab ── */}
          {tab === "upload" && (
            <div className="space-y-4">
              {/* Drop zone */}
              <div
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={(e) => { e.preventDefault(); setDragOver(false); addFiles(e.dataTransfer.files); }}
                onClick={() => inputRef.current?.click()}
                className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all ${dragOver ? "border-primary bg-primary/5" : "border-border hover:border-primary/50 hover:bg-muted/30"
                  }`}
              >
                <Upload size={28} className="mx-auto mb-3 text-muted-foreground" />
                <p className="text-sm font-medium mb-1">اسحب وأفلت الصور هنا</p>
                <p className="text-xs text-muted-foreground">أو انقر للاختيار — JPEG, PNG, WebP, GIF</p>
                <p className="text-xs text-muted-foreground mt-1">الحد الأقصى 8 MB لكل صورة · يتم ضغط الصور الكبيرة تلقائياً</p>
                <input
                  ref={inputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  multiple
                  className="hidden"
                  onChange={(e) => addFiles(e.target.files)}
                />
              </div>

              {/* Queue */}
              {queue.length > 0 && (
                <div className="space-y-2">
                  {queue.map((item) => (
                    <div key={item.id} className="flex items-center gap-3 p-3 rounded-xl border border-border bg-muted/20">
                      <img src={item.preview} alt="" className="w-12 h-12 rounded-lg object-cover shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium truncate">{item.file.name}</p>
                        <p className="text-[10px] text-muted-foreground">
                          {fmtBytes(item.originalSize)}
                          {item.compressedSize && item.compressedSize < item.originalSize && (
                            <span className="text-emerald-600 ms-1">
                              → {fmtBytes(item.compressedSize)} ({Math.round((1 - item.compressedSize / item.originalSize) * 100)}% أصغر)
                            </span>
                          )}
                        </p>
                        {/* Progress bar */}
                        {(item.status === "compressing" || item.status === "uploading") && (
                          <div className="mt-1.5 h-1 bg-border rounded-full overflow-hidden">
                            <motion.div
                              className="h-full bg-primary rounded-full"
                              initial={{ width: 0 }}
                              animate={{ width: `${item.progress}%` }}
                              transition={{ duration: 0.3 }}
                            />
                          </div>
                        )}
                        {item.status === "error" && (
                          <p className="text-[10px] text-destructive mt-0.5">{item.error}</p>
                        )}
                        {item.status === "compressing" && <p className="text-[10px] text-amber-600">جاري الضغط...</p>}
                        {item.status === "uploading" && <p className="text-[10px] text-blue-600">جاري الرفع...</p>}
                      </div>
                      <div className="shrink-0">
                        {item.status === "pending" && <span className="text-[10px] text-muted-foreground">انتظار</span>}
                        {item.status === "done" && <CheckCircle size={16} className="text-emerald-500" />}
                        {item.status === "error" && <AlertCircle size={16} className="text-destructive" />}
                        {(item.status === "compressing" || item.status === "uploading") && (
                          <Loader2 size={16} className="text-primary animate-spin" />
                        )}
                        {item.status === "pending" && (
                          <button
                            onClick={() => setQueue((p) => { URL.revokeObjectURL(item.preview); return p.filter((i) => i.id !== item.id); })}
                            className="ms-2 p-1 rounded-lg hover:bg-muted text-muted-foreground hover:text-destructive"
                          >
                            <X size={12} />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── URL Tab ── */}
          {tab === "url" && (
            <div className="space-y-4">
              <div>
                <label className="text-xs font-medium mb-1 block">رابط الصورة *</label>
                <input
                  value={urlForm.url}
                  onChange={(e) => setUrlForm((p) => ({ ...p, url: e.target.value }))}
                  className={inputCls} dir="ltr" placeholder="https://..."
                />
              </div>
              <div className="grid sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium mb-1 block">العنوان (عربي)</label>
                  <input value={urlForm.title_ar} onChange={(e) => setUrlForm((p) => ({ ...p, title_ar: e.target.value }))} className={inputCls} dir="rtl" />
                </div>
                <div>
                  <label className="text-xs font-medium mb-1 block">Title (English)</label>
                  <input value={urlForm.title_en} onChange={(e) => setUrlForm((p) => ({ ...p, title_en: e.target.value }))} className={inputCls} dir="ltr" />
                </div>
              </div>
              {urlForm.url && (
                <img src={urlForm.url} alt="preview" className="w-full h-40 object-cover rounded-xl border border-border" onError={(e) => ((e.target as HTMLImageElement).style.display = "none")} />
              )}
            </div>
          )}
        </div>

        {/* Footer actions */}
        <div className="border-t border-border px-6 py-4 flex justify-end gap-3 shrink-0">
          <button onClick={onClose} className="px-4 py-2 rounded-xl border border-border text-sm hover:bg-muted">إلغاء</button>
          {tab === "upload" ? (
            <button
              onClick={allDone ? onClose : startUpload}
              disabled={anyBusy || (queue.length === 0 && !allDone) || (!hasPending && !allDone)}
              className="flex items-center gap-2 px-5 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-semibold disabled:opacity-50"
            >
              {anyBusy ? <><Loader2 size={14} className="animate-spin" /> جاري الرفع...</>
                : allDone ? "تم ✓"
                  : <><Upload size={14} /> رفع {queue.filter((i) => i.status === "pending").length} صورة</>}
            </button>
          ) : (
            <button
              onClick={saveUrl}
              disabled={savingUrl || !urlForm.url.trim()}
              className="flex items-center gap-2 px-5 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-semibold disabled:opacity-50"
            >
              {savingUrl ? <><Loader2 size={14} className="animate-spin" /> جاري الحفظ...</> : <><Plus size={14} /> إضافة</>}
            </button>
          )}
        </div>
      </motion.div>
    </div>
  );
}

// ── AdminGalleryPage ──────────────────────────────────────────────────
export default function AdminGalleryPage(): React.ReactElement {
  const [items, setItems] = useState<GalleryItemRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [showUpload, setShowUpload] = useState(false);
  const [filter, setFilter] = useState<"all" | "active" | "inactive">("all");
  const [deleteTarget, setDeleteTarget] = useState<GalleryItemRow | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase.from("gallery_items").select("*").order("display_order");
    setItems((data ?? []) as GalleryItemRow[]);
    setLoading(false);
  }, []);

  useEffect(() => { void load(); }, [load]);

  async function toggleActive(item: GalleryItemRow): Promise<void> {
    await supabase.from("gallery_items").update({ is_active: !item.is_active }).eq("id", item.id);
    void load();
  }

  async function confirmDelete(): Promise<void> {
    if (!deleteTarget) return;
    const item = deleteTarget;
    setDeleting(item.id);
    // If stored in Supabase storage, delete the file too
    if (item.image_path.includes("supabase") && item.image_path.includes("/gallery/")) {
      const path = item.image_path.split("/gallery/").pop();
      if (path) await supabase.storage.from("gallery").remove([path]);
    }
    await supabase.from("gallery_items").delete().eq("id", item.id);
    setDeleting(null);
    setDeleteTarget(null);
    void load();
  }
  const filtered = items.filter((item) => {
    if (filter === "active") return item.is_active;
    if (filter === "inactive") return !item.is_active;
    return true;
  });

  const activeCount = items.filter((i) => i.is_active).length;
  const inactiveCount = items.filter((i) => !i.is_active).length;

  return (
    <div dir="rtl" className="space-y-6">
      <AnimatePresence>
        {showUpload && (
          <UploadModal
            onClose={() => setShowUpload(false)}
            onUploaded={() => { void load(); }}
          />
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {deleteTarget && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4" dir="rtl">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-card rounded-3xl border border-border w-full max-w-md p-6 shadow-2xl space-y-4"
            >
              <div className="w-12 h-12 rounded-2xl bg-destructive/10 text-destructive flex items-center justify-center mx-auto">
                <AlertTriangle size={24} />
              </div>
              <div className="text-center space-y-1">
                <h3 className="font-display font-bold text-lg">تأكيد حذف الصورة</h3>
                <p className="text-sm text-muted-foreground">
                  هل أنت متأكد من حذف هذه الصورة نهائياً من المعرض وسجلات التخزين؟
                </p>
              </div>
              <div className="flex items-center gap-3 pt-2">
                <button
                  onClick={() => setDeleteTarget(null)}
                  disabled={Boolean(deleting)}
                  className="flex-1 py-2.5 rounded-xl border border-border text-sm font-semibold hover:bg-muted"
                >
                  إلغاء
                </button>
                <button
                  onClick={() => void confirmDelete()}
                  disabled={Boolean(deleting)}
                  className="flex-1 py-2.5 rounded-xl bg-destructive text-destructive-foreground text-sm font-semibold hover:bg-destructive/90 disabled:opacity-60"
                >
                  {deleting ? "جاري الحذف..." : "نعم، احذف"}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-xl sm:text-2xl font-black text-foreground flex items-center gap-2">
            <ImageIcon className="text-primary" size={24} />
            معرض الصور
          </h1>
          <p className="text-muted-foreground text-xs sm:text-sm mt-0.5">
            {items.length} صورة مسجلة · <span className="text-emerald-600 font-bold">{activeCount} نشطة</span>
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={load}
            className="p-2.5 rounded-xl border border-border hover:bg-muted text-muted-foreground transition-colors"
            title="تحديث المعرض"
          >
            <RefreshCw size={16} />
          </button>
          <button
            onClick={() => setShowUpload(true)}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary-dark shadow-sm transition-all active:scale-98 min-h-[44px]"
          >
            <Upload size={16} />
            إضافة صور
          </button>
        </div>
      </div>

      {/* Filters & Info Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Filter chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          <button
            onClick={() => setFilter("all")}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors min-h-[36px] ${
              filter === "all"
                ? "bg-primary text-primary-foreground shadow-xs"
                : "bg-muted/70 text-muted-foreground hover:bg-muted"
            }`}
          >
            الكل ({items.length})
          </button>
          <button
            onClick={() => setFilter("active")}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors min-h-[36px] ${
              filter === "active"
                ? "bg-emerald-600 text-white shadow-xs"
                : "bg-muted/70 text-muted-foreground hover:bg-muted"
            }`}
          >
            النشطة ({activeCount})
          </button>
          <button
            onClick={() => setFilter("inactive")}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors min-h-[36px] ${
              filter === "inactive"
                ? "bg-slate-700 text-white shadow-xs"
                : "bg-muted/70 text-muted-foreground hover:bg-muted"
            }`}
          >
            المخفية ({inactiveCount})
          </button>
        </div>

        <div className="p-2.5 rounded-2xl bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 text-xs text-blue-700 dark:text-blue-300 flex items-center gap-2">
          <ImageIcon size={14} className="shrink-0" />
          <span>تُضغط الصور تلقائياً إلى WebP لتسريع التحميل على الهواتف</span>
        </div>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {Array.from({ length: 8 }).map((_, i) => <div key={i} className="aspect-square shimmer rounded-3xl" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 gap-4 text-muted-foreground border-2 border-dashed border-border rounded-3xl bg-card">
          <ImageIcon size={40} className="opacity-30" />
          <p className="text-sm">لا توجد صور مطابقة</p>
          <button onClick={() => setShowUpload(true)} className="text-sm text-primary font-semibold hover:underline">
            أضف صورة جديدة
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
          {filtered.map((item) => (
            <div
              key={item.id}
              className={`relative group rounded-3xl overflow-hidden border bg-muted aspect-square transition-all shadow-2xs ${
                !item.is_active ? "opacity-60 border-dashed border-border" : "border-border"
              } ${deleting === item.id ? "opacity-30 pointer-events-none" : ""}`}
            >
              <img
                src={item.image_path}
                alt={item.title_ar ?? "gallery"}
                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                loading="lazy"
              />

              {/* Status and storage badge at top */}
              <div className="absolute top-2.5 start-2.5 end-2.5 flex items-center justify-between pointer-events-none">
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold backdrop-blur-md shadow-xs ${
                  item.is_active ? "bg-emerald-500/90 text-white" : "bg-black/70 text-zinc-300"
                }`}>
                  {item.is_active ? "نشطة" : "مخفية"}
                </span>

                {item.image_path.includes("supabase") && (
                  <span className="px-1.5 py-0.5 rounded-md bg-black/60 backdrop-blur-md text-white text-[9px] font-mono">
                    Cloud
                  </span>
                )}
              </div>

              {/* Bottom Touch Actions Bar (Persistent on mobile, hover on desktop) */}
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/60 to-transparent p-2.5 sm:p-3 flex items-center justify-between gap-1 transition-opacity sm:opacity-0 sm:group-hover:opacity-100">
                <div className="min-w-0 flex-1 pe-1">
                  {item.title_ar && (
                    <p className="text-white text-xs truncate font-semibold">{item.title_ar}</p>
                  )}
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    onClick={() => void toggleActive(item)}
                    title={item.is_active ? "إخفاء" : "إظهار"}
                    className="p-2 rounded-xl bg-white/20 backdrop-blur-md text-white hover:bg-white/40 active:scale-95 transition-all min-h-[34px] min-w-[34px] flex items-center justify-center shadow-xs"
                  >
                    {item.is_active ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                  <button
                    onClick={() => setDeleteTarget(item)}
                    title="حذف"
                    className="p-2 rounded-xl bg-white/20 backdrop-blur-md text-white hover:bg-destructive/80 active:scale-95 transition-all min-h-[34px] min-w-[34px] flex items-center justify-center shadow-xs"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>

              {/* Loading overlay */}
              {deleting === item.id && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                  <Loader2 size={24} className="text-white animate-spin" />
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
