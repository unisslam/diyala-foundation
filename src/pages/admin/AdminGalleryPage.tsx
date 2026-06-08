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
  X, ImageIcon, Link, Loader2, CheckCircle, AlertCircle,
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
      canvas.width  = Math.round(img.naturalWidth  * ratio);
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
  if (b < 1024)        return `${b} B`;
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
  const [queue, setQueue]   = useState<UploadItem[]>([]);
  const [tab, setTab]       = useState<"upload" | "url">("upload");
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

  const allDone  = queue.length > 0 && queue.every((i) => i.status === "done" || i.status === "error");
  const anyBusy  = queue.some((i) => i.status === "compressing" || i.status === "uploading");
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
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-sm font-medium transition-all ${
              tab === "upload" ? "bg-primary text-primary-foreground" : "hover:bg-muted text-muted-foreground"
            }`}>
            <Upload size={14} /> رفع من الجهاز
          </button>
          <button onClick={() => setTab("url")}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-sm font-medium transition-all ${
              tab === "url" ? "bg-primary text-primary-foreground" : "hover:bg-muted text-muted-foreground"
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
                className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all ${
                  dragOver ? "border-primary bg-primary/5" : "border-border hover:border-primary/50 hover:bg-muted/30"
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
                        {item.status === "uploading"   && <p className="text-[10px] text-blue-600">جاري الرفع...</p>}
                      </div>
                      <div className="shrink-0">
                        {item.status === "pending"  && <span className="text-[10px] text-muted-foreground">انتظار</span>}
                        {item.status === "done"     && <CheckCircle size={16} className="text-emerald-500" />}
                        {item.status === "error"    && <AlertCircle size={16} className="text-destructive" />}
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
  const [items, setItems]     = useState<GalleryItemRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [showUpload, setShowUpload] = useState(false);
  const [deleting, setDeleting]    = useState<string | null>(null);

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

  async function deleteItem(item: GalleryItemRow): Promise<void> {
    if (!confirm("حذف هذه الصورة؟")) return;
    setDeleting(item.id);
    // If stored in Supabase storage, delete the file too
    if (item.image_path.includes("supabase") && item.image_path.includes("/gallery/")) {
      const path = item.image_path.split("/gallery/").pop();
      if (path) await supabase.storage.from("gallery").remove([path]);
    }
    await supabase.from("gallery_items").delete().eq("id", item.id);
    setDeleting(null);
    void load();
  }



  return (
    <div dir="rtl">
      <AnimatePresence>
        {showUpload && (
          <UploadModal
            onClose={() => setShowUpload(false)}
            onUploaded={() => { void load(); }}
          />
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="font-display text-xl font-bold">معرض الصور</h1>
          <p className="text-muted-foreground text-sm">
            {items.length} صورة · {items.filter((i) => i.is_active).length} نشطة
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={load} className="p-2.5 rounded-xl border border-border hover:bg-muted text-muted-foreground" title="تحديث">
            <RefreshCw size={15} />
          </button>
          <button
            onClick={() => setShowUpload(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary-dark transition-colors"
          >
            <Upload size={15} /> إضافة صور
          </button>
        </div>
      </div>

      {/* Info banner */}
      <div className="mb-5 p-3 rounded-2xl bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 text-xs text-blue-700 dark:text-blue-300 flex items-start gap-2">
        <ImageIcon size={14} className="shrink-0 mt-0.5" />
        <span>
          الصور المرفوعة تُضغط تلقائياً إلى WebP وتُخزَّن في Supabase Storage.
          الحد الأقصى 8 MB للصورة الواحدة — JPEG, PNG, WebP, GIF.
        </span>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {Array.from({ length: 8 }).map((_, i) => <div key={i} className="aspect-square shimmer rounded-2xl" />)}
        </div>
      ) : items.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 gap-4 text-muted-foreground border-2 border-dashed border-border rounded-3xl">
          <ImageIcon size={40} className="opacity-30" />
          <p className="text-sm">لا توجد صور بعد</p>
          <button onClick={() => setShowUpload(true)} className="text-sm text-primary underline">أضف أول صورة</button>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {items.map((item) => (
            <div
              key={item.id}
              className={`relative group rounded-2xl overflow-hidden border bg-muted aspect-square transition-all ${
                !item.is_active ? "opacity-50 border-dashed border-border" : "border-border"
              } ${deleting === item.id ? "opacity-30 pointer-events-none" : ""}`}
            >
              <img
                src={item.image_path}
                alt={item.title_ar ?? "gallery"}
                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                loading="lazy"
              />

              {/* Overlay controls */}
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                <button
                  onClick={() => toggleActive(item)}
                  title={item.is_active ? "إخفاء" : "إظهار"}
                  className="p-2 rounded-xl bg-white/20 backdrop-blur-sm text-white hover:bg-white/40 transition-colors"
                >
                  {item.is_active ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
                <button
                  onClick={() => deleteItem(item)}
                  title="حذف"
                  className="p-2 rounded-xl bg-white/20 backdrop-blur-sm text-white hover:bg-red-500/80 transition-colors"
                >
                  <Trash2 size={15} />
                </button>
              </div>

              {/* Title */}
              {item.title_ar && (
                <div className="absolute bottom-0 start-0 end-0 bg-gradient-to-t from-black/80 p-2 translate-y-full group-hover:translate-y-0 transition-transform">
                  <p className="text-white text-xs truncate">{item.title_ar}</p>
                </div>
              )}

              {/* Storage badge */}
              {item.image_path.includes("supabase") && (
                <div className="absolute top-2 start-2 px-1.5 py-0.5 rounded-md bg-black/60 text-white text-[10px] font-mono">
                  Storage
                </div>
              )}

              {/* Loading overlay */}
              {deleting === item.id && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                  <Loader2 size={20} className="text-white animate-spin" />
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
