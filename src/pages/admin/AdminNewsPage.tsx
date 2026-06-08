/**
 * AdminNewsPage.tsx
 * ------------------
 * CRUD management for the `news` table.
 */

import React, { useState, useEffect, useCallback } from "react";
import { Plus, Edit2, Trash2, Eye, EyeOff, Search, Star } from "lucide-react";
import { motion } from "framer-motion";
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
  news:          "bg-blue-100 text-blue-700",
  announcement:  "bg-violet-100 text-violet-700",
  report:        "bg-teal-100 text-teal-700",
  event:         "bg-amber-100 text-amber-700",
  press_release: "bg-pink-100 text-pink-700",
};

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
    if (!form.title_ar || !form.title_en) { setError("العنوان مطلوب"); return; }
    setSaving(true);
    const payload = { ...form, slug: form.slug || toSlug(form.title_en) };
    const { error: err } = isNew
      ? await supabase.from("news").insert(payload)
      : await supabase.from("news").update(payload).eq("id", article!.id!);
    if (err) { setError(err.message); setSaving(false); return; }
    onSave();
    onClose();
  }

  const inputCls = "w-full px-3 py-2 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary";

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" dir="rtl">
      <motion.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }}
        className="bg-card rounded-3xl border border-border w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-card border-b border-border px-6 py-4 flex items-center justify-between">
          <h2 className="font-display font-bold">{isNew ? "إضافة خبر" : "تعديل الخبر"}</h2>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-muted"><Plus size={16} className="rotate-45" /></button>
        </div>
        <div className="p-6 space-y-4">
          {error && <p className="text-destructive text-sm">{error}</p>}
          <div className="grid sm:grid-cols-2 gap-4">
            <div><label className="text-xs font-medium mb-1 block">العنوان بالعربية *</label>
              <input value={form.title_ar} onChange={(e) => setForm(p => ({...p, title_ar: e.target.value}))} className={inputCls} dir="rtl" /></div>
            <div><label className="text-xs font-medium mb-1 block">Title in English *</label>
              <input value={form.title_en} onChange={(e) => setForm(p => ({...p, title_en: e.target.value}))} className={inputCls} dir="ltr" /></div>
          </div>
          <div className="grid sm:grid-cols-3 gap-4">
            <div><label className="text-xs font-medium mb-1 block">التصنيف</label>
              <select value={form.category} onChange={(e) => setForm(p => ({...p, category: e.target.value as NewsCategory}))} className={inputCls}>
                {Object.entries(CAT_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select></div>
            <div><label className="text-xs font-medium mb-1 block">تاريخ النشر</label>
              <input type="date" value={form.published_at} onChange={(e) => setForm(p => ({...p, published_at: e.target.value}))} className={inputCls} dir="ltr" /></div>
            <div className="flex flex-col gap-2 pt-5">
              <label className="flex items-center gap-2 cursor-pointer text-sm">
                <input type="checkbox" checked={form.is_published} onChange={(e) => setForm(p => ({...p, is_published: e.target.checked}))} className="w-4 h-4 rounded" />
                منشور
              </label>
              <label className="flex items-center gap-2 cursor-pointer text-sm">
                <input type="checkbox" checked={form.is_featured} onChange={(e) => setForm(p => ({...p, is_featured: e.target.checked}))} className="w-4 h-4 rounded" />
                مميز ⭐
              </label>
            </div>
          </div>
          <div><label className="text-xs font-medium mb-1 block">الملخص (عربي)</label>
            <textarea rows={2} value={form.excerpt_ar} onChange={(e) => setForm(p => ({...p, excerpt_ar: e.target.value}))} className={`${inputCls} resize-none`} dir="rtl" /></div>
          <div><label className="text-xs font-medium mb-1 block">Excerpt (English)</label>
            <textarea rows={2} value={form.excerpt_en} onChange={(e) => setForm(p => ({...p, excerpt_en: e.target.value}))} className={`${inputCls} resize-none`} dir="ltr" /></div>
          <div><label className="text-xs font-medium mb-1 block">المحتوى الكامل (عربي)</label>
            <textarea rows={5} value={form.body_ar} onChange={(e) => setForm(p => ({...p, body_ar: e.target.value}))} className={`${inputCls} resize-none`} dir="rtl" /></div>
          <div><label className="text-xs font-medium mb-1 block">Full Content (English)</label>
            <textarea rows={5} value={form.body_en} onChange={(e) => setForm(p => ({...p, body_en: e.target.value}))} className={`${inputCls} resize-none`} dir="ltr" /></div>
          <CoverImageUpload
            bucket="news"
            currentUrl={form.cover_image_path}
            onUploaded={(url) => setForm(p => ({ ...p, cover_image_path: url }))}
            onRemoved={() => setForm(p => ({ ...p, cover_image_path: null }))}
          />
        </div>
        <div className="sticky bottom-0 bg-card border-t border-border px-6 py-4 flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 rounded-xl border border-border text-sm hover:bg-muted">إلغاء</button>
          <button onClick={handleSave} disabled={saving}
            className="px-5 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-semibold disabled:opacity-60">
            {saving ? "جاري الحفظ..." : "حفظ"}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

export default function AdminNewsPage(): React.ReactElement {
  const [articles, setArticles] = useState<NewsRow[]>([]);
  const [loading, setLoading]   = useState(true);
  const [search, setSearch]     = useState("");
  const [editTarget, setEditTarget] = useState<Partial<NewsRow> | null | undefined>(undefined);

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

  async function deleteArticle(a: NewsRow): Promise<void> {
    if (!confirm(`حذف "${a.title_ar}"؟`)) return;
    await supabase.from("news").delete().eq("id", a.id);
    void load();
  }

  const filtered = articles.filter((a) =>
    !search.trim() || a.title_ar.toLowerCase().includes(search.toLowerCase()) || a.title_en.toLowerCase().includes(search.toLowerCase())
  );

  const thCls = "px-4 py-3 text-start text-xs font-semibold text-muted-foreground uppercase tracking-wide";
  const tdCls = "px-4 py-3 text-sm";

  return (
    <div dir="rtl">
      {editTarget !== undefined && <NewsForm article={editTarget} onSave={load} onClose={() => setEditTarget(undefined)} />}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-xl font-bold">الأخبار والمقالات</h1>
          <p className="text-muted-foreground text-sm">{articles.length} مقال</p>
        </div>
        <button onClick={() => setEditTarget(null)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary-dark transition-colors">
          <Plus size={15} /> خبر جديد
        </button>
      </div>
      <div className="relative mb-4 max-w-xs">
        <Search size={14} className="absolute top-1/2 -translate-y-1/2 start-3 text-muted-foreground" />
        <input value={search} onChange={(e) => setSearch(e.target.value)}
          placeholder="بحث..." className="w-full ps-9 pe-4 py-2 rounded-xl border border-border bg-card text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
      </div>
      <div className="rounded-2xl border border-border bg-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[650px]">
            <thead className="border-b border-border bg-muted/40">
              <tr>
                <th className={thCls}>العنوان</th>
                <th className={thCls}>التصنيف</th>
                <th className={thCls}>المشاهدات</th>
                <th className={thCls}>تاريخ النشر</th>
                <th className={thCls}>الإجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? Array.from({ length: 4 }).map((_, i) => (
                <tr key={i}><td colSpan={5} className="p-4"><div className="h-8 shimmer rounded-lg" /></td></tr>
              )) : filtered.map((a) => (
                <tr key={a.id} className="hover:bg-muted/30 transition-colors">
                  <td className={tdCls}>
                    <div className="flex items-center gap-2">
                      {a.is_featured && <Star size={13} className="text-amber-500 shrink-0" />}
                      <div>
                        <p className="font-medium">{a.title_ar}</p>
                        <p className="text-xs text-muted-foreground">{a.title_en}</p>
                      </div>
                    </div>
                  </td>
                  <td className={tdCls}>
                    <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-semibold ${CAT_CLS[a.category]}`}>
                      {CAT_LABEL[a.category]}
                    </span>
                  </td>
                  <td className={tdCls}>{a.views_count.toLocaleString()}</td>
                  <td className={`${tdCls} text-xs text-muted-foreground`}>
                    {a.published_at ? new Date(a.published_at).toLocaleDateString("ar-IQ") : "—"}
                  </td>
                  <td className={tdCls}>
                    <div className="flex items-center gap-1">
                      <button onClick={() => togglePublish(a)} title={a.is_published ? "إخفاء" : "نشر"}
                        className={`p-1.5 rounded-lg hover:bg-muted transition-colors ${a.is_published ? "text-emerald-600" : "text-muted-foreground"}`}>
                        {a.is_published ? <Eye size={15} /> : <EyeOff size={15} />}
                      </button>
                      <button onClick={() => setEditTarget(a)} title="تعديل"
                        className="p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-primary">
                        <Edit2 size={15} />
                      </button>
                      <button onClick={() => deleteArticle(a)} title="حذف"
                        className="p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-destructive">
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {!loading && filtered.length === 0 && (
          <div className="text-center py-12 text-muted-foreground text-sm">لا توجد مقالات مطابقة</div>
        )}
      </div>
    </div>
  );
}
