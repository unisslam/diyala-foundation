/**
 * AdminNewsPage.tsx
 * ------------------
 * CRUD management for the `news` table.
 * Features:
 *  • Dual-mode responsive layout (Smart Cards on mobile, DataTable on desktop)
 *  • Category filter chips + Search
 *  • Non-blocking delete confirmation modal (no native window.confirm)
 *  • Touch-optimized add/edit modal (CoverImageUpload, categories, publication state)
 *  • Live views count, publish toggle & featured star toggling
 */

import React, { useState, useEffect, useCallback } from "react";
import {
  Plus, Edit2, Trash2, Eye, EyeOff, Search, Star,
  Newspaper, Calendar, Eye as EyeIcon, AlertTriangle, X
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/lib/supabaseClient";
import type { NewsRow, NewsCategory } from "@/types/database.types";
import { CoverImageUpload } from "@/components/shared/CoverImageUpload";

const CAT_LABEL: Record<NewsCategory, string> = {
  news:          "خبر",
  announcement:  "إعلان",
  report:        "تقرير",
  event:         "فعالية",
  press_release: "بيان صحفي",
};

const CAT_CLS: Record<NewsCategory, string> = {
  news:          "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300",
  announcement:  "bg-violet-100 text-violet-700 dark:bg-violet-950 dark:text-violet-300",
  report:        "bg-teal-100 text-teal-700 dark:bg-teal-950 dark:text-teal-300",
  event:         "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300",
  press_release: "bg-pink-100 text-pink-700 dark:bg-pink-950 dark:text-pink-300",
};

// ── Delete Confirmation Modal ───────────────────────────────────────
interface DeleteModalProps {
  article: NewsRow;
  onConfirm: () => Promise<void>;
  onClose: () => void;
  deleting: boolean;
}

function DeleteModal({ article, onConfirm, onClose, deleting }: DeleteModalProps): React.ReactElement {
  return (
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
          <h3 className="font-display font-bold text-lg">تأكيد حذف الخبر</h3>
          <p className="text-sm text-muted-foreground">
            هل أنت متأكد من رغبتك في حذف <strong className="text-foreground">"{article.title_ar}"</strong> نهائياً؟ لا يمكن التراجع عن هذا الإجراء.
          </p>
        </div>
        <div className="flex items-center gap-3 pt-2">
          <button
            onClick={onClose}
            disabled={deleting}
            className="flex-1 py-2.5 rounded-xl border border-border text-sm font-semibold hover:bg-muted transition-colors"
          >
            إلغاء
          </button>
          <button
            onClick={() => void onConfirm()}
            disabled={deleting}
            className="flex-1 py-2.5 rounded-xl bg-destructive text-destructive-foreground text-sm font-semibold hover:bg-destructive/90 transition-colors disabled:opacity-60"
          >
            {deleting ? "جاري الحذف..." : "نعم، احذف"}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

// ── News Form Modal ─────────────────────────────────────────────────
interface NewsFormProps {
  article: Partial<NewsRow> | null;
  onSave: () => void;
  onClose: () => void;
}

function NewsForm({ article, onSave, onClose }: NewsFormProps): React.ReactElement {
  const isNew = !article?.id;
  const [saving, setSaving] = useState(false);
  const [error, setError]   = useState<string | null>(null);
  const [form, setForm]     = useState({
    title_ar:    article?.title_ar    ?? "",
    title_en:    article?.title_en    ?? "",
    slug:        article?.slug        ?? "",
    excerpt_ar:  article?.excerpt_ar  ?? "",
    excerpt_en:  article?.excerpt_en  ?? "",
    body_ar:     article?.body_ar     ?? "",
    body_en:     article?.body_en     ?? "",
    category:    article?.category    ?? "news" as NewsCategory,
    cover_image_path: article?.cover_image_path ?? null as string | null,
    is_published: article?.is_published ?? true,
    is_featured: article?.is_featured  ?? false,
    published_at: article?.published_at ? article.published_at.split("T")[0] : new Date().toISOString().split("T")[0],
  });

  function toSlug(s: string): string {
    return s.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
  }

  async function handleSave(): Promise<void> {
    if (!form.title_ar || !form.title_en) { setError("العنوان مطلوب (عربي وإنجليزي)"); return; }
    setSaving(true);
    const payload = { ...form, slug: form.slug || toSlug(form.title_en) };
    const { error: err } = isNew
      ? await supabase.from("news").insert(payload)
      : await supabase.from("news").update(payload).eq("id", article!.id!);
    if (err) { setError(err.message); setSaving(false); return; }
    onSave();
    onClose();
  }

  const inputCls = "w-full px-3 py-2.5 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary";

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-3 sm:p-4" dir="rtl">
      <motion.div
        initial={{ opacity: 0, scale: 0.97 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.97 }}
        className="bg-card rounded-3xl border border-border w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl flex flex-col"
      >
        <div className="sticky top-0 bg-card/95 backdrop-blur-md border-b border-border px-5 sm:px-6 py-4 flex items-center justify-between z-10">
          <h2 className="font-display font-bold text-base sm:text-lg">{isNew ? "إضافة خبر أو مقال جديد" : "تعديل الخبر"}</h2>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-muted text-muted-foreground transition-colors">
            <X size={18} />
          </button>
        </div>

        <div className="p-5 sm:p-6 space-y-4 flex-1">
          {error && <p className="text-destructive text-sm bg-destructive/10 p-3 rounded-xl">{error}</p>}
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium mb-1.5 block">العنوان بالعربية *</label>
              <input value={form.title_ar} onChange={(e) => setForm(p => ({...p, title_ar: e.target.value}))} className={inputCls} dir="rtl" placeholder="عنوان الخبر بالعربية" />
            </div>
            <div>
              <label className="text-xs font-medium mb-1.5 block">Title in English *</label>
              <input value={form.title_en} onChange={(e) => setForm(p => ({...p, title_en: e.target.value}))} className={inputCls} dir="ltr" placeholder="Title in English" />
            </div>
          </div>
          <div>
            <label className="text-xs font-medium mb-1.5 block">المعرف اللطيف Slug (URL)</label>
            <input value={form.slug} onChange={(e) => setForm(p => ({...p, slug: e.target.value}))} className={inputCls} dir="ltr" placeholder="auto-generated from English title" />
          </div>
          <div className="grid sm:grid-cols-3 gap-4">
            <div>
              <label className="text-xs font-medium mb-1.5 block">التصنيف</label>
              <select value={form.category} onChange={(e) => setForm(p => ({...p, category: e.target.value as NewsCategory}))} className={inputCls}>
                {Object.entries(CAT_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium mb-1.5 block">تاريخ النشر</label>
              <input type="date" value={form.published_at} onChange={(e) => setForm(p => ({...p, published_at: e.target.value}))} className={inputCls} dir="ltr" />
            </div>
            <div className="flex flex-col gap-2 pt-2 sm:pt-6">
              <label className="flex items-center gap-2 cursor-pointer text-sm select-none">
                <input type="checkbox" checked={form.is_published} onChange={(e) => setForm(p => ({...p, is_published: e.target.checked}))} className="w-4 h-4 rounded text-primary" />
                منشور
              </label>
              <label className="flex items-center gap-2 cursor-pointer text-sm select-none">
                <input type="checkbox" checked={form.is_featured} onChange={(e) => setForm(p => ({...p, is_featured: e.target.checked}))} className="w-4 h-4 rounded text-primary" />
                خبر مميز ⭐
              </label>
            </div>
          </div>
          <div>
            <label className="text-xs font-medium mb-1.5 block">الملخص (عربي)</label>
            <textarea rows={2} value={form.excerpt_ar} onChange={(e) => setForm(p => ({...p, excerpt_ar: e.target.value}))} className={`${inputCls} resize-none`} dir="rtl" placeholder="موجز قصير يظهر في البطاقات" />
          </div>
          <div>
            <label className="text-xs font-medium mb-1.5 block">Excerpt (English)</label>
            <textarea rows={2} value={form.excerpt_en} onChange={(e) => setForm(p => ({...p, excerpt_en: e.target.value}))} className={`${inputCls} resize-none`} dir="ltr" placeholder="Short excerpt for cards" />
          </div>
          <div>
            <label className="text-xs font-medium mb-1.5 block">المحتوى الكامل (عربي)</label>
            <textarea rows={5} value={form.body_ar} onChange={(e) => setForm(p => ({...p, body_ar: e.target.value}))} className={`${inputCls} resize-none`} dir="rtl" />
          </div>
          <div>
            <label className="text-xs font-medium mb-1.5 block">Full Content (English)</label>
            <textarea rows={5} value={form.body_en} onChange={(e) => setForm(p => ({...p, body_en: e.target.value}))} className={`${inputCls} resize-none`} dir="ltr" />
          </div>
          <div>
            <label className="text-xs font-medium mb-1.5 block">صورة الغلاف</label>
            <CoverImageUpload
              bucket="news"
              currentUrl={form.cover_image_path}
              onUploaded={(url) => setForm(p => ({ ...p, cover_image_path: url }))}
              onRemoved={() => setForm(p => ({ ...p, cover_image_path: null }))}
            />
          </div>
        </div>

        <div className="sticky bottom-0 bg-card/95 backdrop-blur-md border-t border-border px-5 sm:px-6 py-4 flex justify-end gap-3 z-10">
          <button onClick={onClose} className="px-4 py-2.5 rounded-xl border border-border text-sm font-semibold hover:bg-muted transition-colors">
            إلغاء
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-6 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary-dark transition-colors disabled:opacity-60"
          >
            {saving ? "جاري الحفظ..." : "حفظ المقال"}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

// ── AdminNewsPage ───────────────────────────────────────────────────
export default function AdminNewsPage(): React.ReactElement {
  const [articles, setArticles] = useState<NewsRow[]>([]);
  const [loading, setLoading]   = useState(true);
  const [search, setSearch]     = useState("");
  const [selectedCat, setSelectedCat] = useState<string>("all");
  const [editTarget, setEditTarget] = useState<Partial<NewsRow> | null | undefined>(undefined);
  const [deleteTarget, setDeleteTarget] = useState<NewsRow | null>(null);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase.from("news").select("*").order("published_at", { ascending: false });
    setArticles((data ?? []) as NewsRow[]);
    setLoading(false);
  }, []);

  useEffect(() => { void load(); }, [load]);

  async function togglePublish(a: NewsRow): Promise<void> {
    await supabase.from("news").update({ is_published: !a.is_published }).eq("id", a.id);
    void load();
  }

  async function confirmDelete(): Promise<void> {
    if (!deleteTarget) return;
    setDeleting(true);
    await supabase.from("news").delete().eq("id", deleteTarget.id);
    setDeleting(false);
    setDeleteTarget(null);
    void load();
  }

  const filtered = articles.filter((a) => {
    if (selectedCat !== "all" && a.category !== selectedCat) return false;
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return a.title_ar.toLowerCase().includes(q) || a.title_en.toLowerCase().includes(q) || (a.excerpt_ar || "").toLowerCase().includes(q);
  });

  const thCls = "px-4 py-3 text-start text-xs font-semibold text-muted-foreground uppercase tracking-wide";
  const tdCls = "px-4 py-3.5 text-sm";

  return (
    <div dir="rtl" className="space-y-6">
      {/* Edit / Add Modal */}
      <AnimatePresence>
        {editTarget !== undefined && (
          <NewsForm article={editTarget} onSave={load} onClose={() => setEditTarget(undefined)} />
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {deleteTarget && (
          <DeleteModal
            article={deleteTarget}
            onConfirm={confirmDelete}
            onClose={() => setDeleteTarget(null)}
            deleting={deleting}
          />
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-xl sm:text-2xl font-black text-foreground flex items-center gap-2">
            <Newspaper className="text-primary" size={24} />
            الأخبار والمقالات
          </h1>
          <p className="text-muted-foreground text-xs sm:text-sm mt-0.5">
            {articles.length} مادة إعلامية · {articles.filter(a => a.is_published).length} منشورة
          </p>
        </div>
        <button
          onClick={() => setEditTarget(null)}
          className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary-dark shadow-sm transition-all active:scale-98 min-h-[44px]"
        >
          <Plus size={16} />
          خبر جديد
        </button>
      </div>

      {/* Search & Category Filter bar */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1 sm:max-w-xs">
            <Search size={15} className="absolute top-1/2 -translate-y-1/2 start-3.5 text-muted-foreground" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="بحث في الأخبار والمقالات..."
              className="w-full ps-10 pe-4 py-2.5 rounded-xl border border-border bg-card text-sm focus:outline-none focus:ring-2 focus:ring-primary shadow-2xs"
            />
          </div>

          {/* Horizontal scrollable category chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            <button
              onClick={() => setSelectedCat("all")}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors min-h-[36px] ${
                selectedCat === "all"
                  ? "bg-primary text-primary-foreground shadow-xs"
                  : "bg-muted/70 text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              الكل ({articles.length})
            </button>
            {Object.entries(CAT_LABEL).map(([key, label]) => {
              const count = articles.filter(a => a.category === key).length;
              if (count === 0) return null;
              return (
                <button
                  key={key}
                  onClick={() => setSelectedCat(key)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors min-h-[36px] ${
                    selectedCat === key
                      ? "bg-primary text-primary-foreground shadow-xs"
                      : "bg-muted/70 text-muted-foreground hover:bg-muted hover:text-foreground"
                  }`}
                >
                  {label} ({count})
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── MOBILE SMART CARDS (< 768px) ── */}
      <div className="md:hidden space-y-3">
        {loading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-44 shimmer rounded-3xl border border-border/50" />
          ))
        ) : filtered.length === 0 ? (
          <div className="text-center py-12 bg-card rounded-3xl border border-border text-muted-foreground text-sm">
            لا توجد مقالات مطابقة للبحث
          </div>
        ) : (
          filtered.map((a) => (
            <div
              key={a.id}
              className="bg-card rounded-3xl border border-border p-4 shadow-xs space-y-3"
            >
              {/* Image & Title Header */}
              <div className="flex items-start gap-3">
                {a.cover_image_path ? (
                  <img
                    src={a.cover_image_path}
                    alt={a.title_ar}
                    className="w-16 h-16 rounded-2xl object-cover shrink-0 border border-border"
                    loading="lazy"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-2xl bg-blue-500/10 text-primary flex items-center justify-center shrink-0 border border-primary/20 font-bold text-xl">
                    <Newspaper size={24} />
                  </div>
                )}

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <h3 className="font-bold text-sm text-foreground line-clamp-1">{a.title_ar}</h3>
                    {a.is_featured && <Star size={13} className="text-amber-500 shrink-0 fill-amber-500" />}
                  </div>
                  <p className="text-xs text-muted-foreground line-clamp-1">{a.title_en}</p>

                  <div className="flex items-center gap-2 mt-2 flex-wrap">
                    <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold ${CAT_CLS[a.category]}`}>
                      {CAT_LABEL[a.category]}
                    </span>
                    <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                      <EyeIcon size={11} /> {a.views_count.toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>

              {/* Excerpt Snippet */}
              {a.excerpt_ar && (
                <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                  {a.excerpt_ar}
                </p>
              )}

              {/* Date & Actions Toolbar */}
              <div className="flex items-center justify-between pt-2 border-t border-border/60">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => togglePublish(a)}
                    className={`flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors min-h-[36px] ${
                      a.is_published
                        ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {a.is_published ? <Eye size={13} /> : <EyeOff size={13} />}
                    {a.is_published ? "منشور" : "مخفي"}
                  </button>

                  <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                    <Calendar size={11} />
                    {a.published_at ? new Date(a.published_at).toLocaleDateString("ar-IQ") : "—"}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setEditTarget(a)}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-xl border border-border text-xs font-semibold hover:bg-muted text-foreground transition-colors min-h-[36px]"
                  >
                    <Edit2 size={13} />
                    تعديل
                  </button>
                  <button
                    onClick={() => setDeleteTarget(a)}
                    className="p-2 rounded-xl text-destructive hover:bg-destructive/10 transition-colors min-h-[36px] min-w-[36px] flex items-center justify-center"
                    title="حذف"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* ── DESKTOP DATA TABLE (≥ 768px) ── */}
      <div className="hidden md:block rounded-3xl border border-border bg-card overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="border-b border-border bg-muted/40">
              <tr>
                <th className={thCls}>العنوان</th>
                <th className={thCls}>التصنيف</th>
                <th className={thCls}>المشاهدات</th>
                <th className={thCls}>تاريخ النشر</th>
                <th className={thCls}>الحالة</th>
                <th className={thCls}>الإجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <tr key={i}><td colSpan={6} className="p-4"><div className="h-10 shimmer rounded-xl" /></td></tr>
                ))
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-muted-foreground text-sm">
                    لا توجد مقالات مطابقة
                  </td>
                </tr>
              ) : (
                filtered.map((a) => (
                  <tr key={a.id} className="hover:bg-muted/30 transition-colors">
                    <td className={tdCls}>
                      <div className="flex items-center gap-3">
                        {a.cover_image_path ? (
                          <img src={a.cover_image_path} alt="" className="w-10 h-10 rounded-xl object-cover shrink-0 border border-border" />
                        ) : (
                          <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-primary flex items-center justify-center shrink-0">
                            <Newspaper size={18} />
                          </div>
                        )}
                        <div>
                          <div className="flex items-center gap-1.5">
                            <p className="font-semibold text-foreground">{a.title_ar}</p>
                            {a.is_featured && <Star size={13} className="text-amber-500 fill-amber-500 shrink-0" />}
                          </div>
                          <p className="text-xs text-muted-foreground">{a.title_en}</p>
                        </div>
                      </div>
                    </td>
                    <td className={tdCls}>
                      <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-semibold ${CAT_CLS[a.category]}`}>
                        {CAT_LABEL[a.category]}
                      </span>
                    </td>
                    <td className={tdCls}>
                      <span className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                        <EyeIcon size={12} /> {a.views_count.toLocaleString()}
                      </span>
                    </td>
                    <td className={`${tdCls} text-xs text-muted-foreground`}>
                      {a.published_at ? new Date(a.published_at).toLocaleDateString("ar-IQ") : "—"}
                    </td>
                    <td className={tdCls}>
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold ${
                        a.is_published
                          ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"
                          : "bg-muted text-muted-foreground"
                      }`}>
                        {a.is_published ? "منشور" : "مسودة"}
                      </span>
                    </td>
                    <td className={tdCls}>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => togglePublish(a)}
                          title={a.is_published ? "إخفاء" : "نشر"}
                          className={`p-2 rounded-xl hover:bg-muted transition-colors ${
                            a.is_published ? "text-emerald-600" : "text-muted-foreground"
                          }`}
                        >
                          {a.is_published ? <Eye size={16} /> : <EyeOff size={16} />}
                        </button>
                        <button
                          onClick={() => setEditTarget(a)}
                          title="تعديل"
                          className="p-2 rounded-xl hover:bg-muted transition-colors text-muted-foreground hover:text-primary"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          onClick={() => setDeleteTarget(a)}
                          title="حذف"
                          className="p-2 rounded-xl hover:bg-muted transition-colors text-muted-foreground hover:text-destructive"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
