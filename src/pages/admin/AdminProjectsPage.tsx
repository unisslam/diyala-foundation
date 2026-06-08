/**
 * AdminProjectsPage.tsx
 * ----------------------
 * CRUD management for the `projects` table.
 * Features: DataTable, status badges, add/edit modal, publish toggle, delete.
 */

import React, { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { Plus, Edit2, Trash2, Eye, EyeOff, Search, Star } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import type { ProjectRow } from "@/types/database.types";
import { CoverImageUpload } from "@/components/shared/CoverImageUpload";

// ── Status badge ────────────────────────────────────────────────────
const STATUS_LABEL: Record<string, { label: string; cls: string }> = {
  active:    { label: "نشط",    cls: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400" },
  completed: { label: "منجز",   cls: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" },
  planned:   { label: "مخطط",  cls: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400" },
  on_hold:   { label: "متوقف", cls: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400" },
};

const CAT_LABEL: Record<string, string> = {
  water_management: "إدارة المياه",
  environmental:    "بيئي",
  community:        "مجتمعي",
  research:         "بحثي",
  education:        "تعليمي",
  health:           "صحي",
};

// ── Shared table styles ─────────────────────────────────────────────
const thCls = "px-4 py-3 text-start text-xs font-semibold text-muted-foreground uppercase tracking-wide";
const tdCls = "px-4 py-3 text-sm";

// ── Simple form modal ───────────────────────────────────────────────
interface ProjectFormProps {
  project: Partial<ProjectRow> | null;
  onSave: () => void;
  onClose: () => void;
}

function ProjectForm({ project, onSave, onClose }: ProjectFormProps): React.ReactElement {
  const isNew = !project?.id;
  const [saving, setSaving] = useState(false);
  const [error, setError]   = useState<string | null>(null);
  const [form, setForm]     = useState({
    title_ar:       project?.title_ar       ?? "",
    title_en:       project?.title_en       ?? "",
    slug:           project?.slug           ?? "",
    description_ar: project?.description_ar ?? "",
    description_en: project?.description_en ?? "",
    category:       project?.category       ?? "water_management",
    status:         project?.status         ?? "planned",
    start_date:     project?.start_date     ?? "",
    location_ar:    project?.location_ar    ?? "",
    cover_image_path: project?.cover_image_path ?? null as string | null,
    is_featured:    project?.is_featured    ?? false,
    is_published:   project?.is_published   ?? true,
  });

  function toSlug(s: string): string {
    return s.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
  }

  async function handleSave(): Promise<void> {
    if (!form.title_ar || !form.title_en) { setError("العنوان مطلوب (عربي وإنجليزي)"); return; }
    setSaving(true);
    setError(null);
    const payload = { ...form, slug: form.slug || toSlug(form.title_en) };
    const { error: err } = isNew
      ? await supabase.from("projects").insert(payload)
      : await supabase.from("projects").update(payload).eq("id", project!.id!);
    if (err) { setError(err.message); setSaving(false); return; }
    onSave();
    onClose();
  }

  const inputCls = "w-full px-3 py-2 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary";

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" dir="rtl">
      <motion.div
        initial={{ opacity: 0, scale: 0.97 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-card rounded-3xl border border-border w-full max-w-2xl max-h-[90vh] overflow-y-auto"
      >
        <div className="sticky top-0 bg-card border-b border-border px-6 py-4 flex items-center justify-between">
          <h2 className="font-display font-bold">{isNew ? "إضافة مشروع" : "تعديل المشروع"}</h2>
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
          <div><label className="text-xs font-medium mb-1 block">Slug (URL)</label>
            <input value={form.slug} onChange={(e) => setForm(p => ({...p, slug: e.target.value}))} className={inputCls} dir="ltr" placeholder="auto-generated if empty" /></div>
          <div><label className="text-xs font-medium mb-1 block">الوصف بالعربية</label>
            <textarea rows={3} value={form.description_ar} onChange={(e) => setForm(p => ({...p, description_ar: e.target.value}))} className={`${inputCls} resize-none`} dir="rtl" /></div>
          <div><label className="text-xs font-medium mb-1 block">Description in English</label>
            <textarea rows={3} value={form.description_en} onChange={(e) => setForm(p => ({...p, description_en: e.target.value}))} className={`${inputCls} resize-none`} dir="ltr" /></div>
          <div className="grid sm:grid-cols-3 gap-4">
            <div><label className="text-xs font-medium mb-1 block">التصنيف</label>
              <select value={form.category} onChange={(e) => setForm(p => ({...p, category: e.target.value as ProjectRow["category"]}))} className={inputCls}>
                {Object.entries(CAT_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select></div>
            <div><label className="text-xs font-medium mb-1 block">الحالة</label>
              <select value={form.status} onChange={(e) => setForm(p => ({...p, status: e.target.value as ProjectRow["status"]}))} className={inputCls}>
                <option value="planned">مخطط</option>
                <option value="active">نشط</option>
                <option value="completed">منجز</option>
                <option value="on_hold">متوقف</option>
              </select></div>
            <div><label className="text-xs font-medium mb-1 block">تاريخ البدء</label>
              <input type="date" value={form.start_date ?? ""} onChange={(e) => setForm(p => ({...p, start_date: e.target.value}))} className={inputCls} dir="ltr" /></div>
          </div>
          <div><label className="text-xs font-medium mb-1 block">الموقع (عربي)</label>
            <input value={form.location_ar ?? ""} onChange={(e) => setForm(p => ({...p, location_ar: e.target.value}))} className={inputCls} /></div>
          <div className="flex gap-6">
            <label className="flex items-center gap-2 cursor-pointer text-sm">
              <input type="checkbox" checked={form.is_featured} onChange={(e) => setForm(p => ({...p, is_featured: e.target.checked}))} className="w-4 h-4 rounded" />
              مميز ⭐
            </label>
            <label className="flex items-center gap-2 cursor-pointer text-sm">
              <input type="checkbox" checked={form.is_published} onChange={(e) => setForm(p => ({...p, is_published: e.target.checked}))} className="w-4 h-4 rounded" />
              منشور
            </label>
          </div>
          <CoverImageUpload
            bucket="projects"
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

// ── AdminProjectsPage ───────────────────────────────────────────────
export default function AdminProjectsPage(): React.ReactElement {
  const [projects, setProjects] = useState<ProjectRow[]>([]);
  const [loading, setLoading]   = useState(true);
  const [search, setSearch]     = useState("");
  const [editTarget, setEditTarget] = useState<Partial<ProjectRow> | null | undefined>(undefined);
  // undefined = closed, null = new project, object = edit existing

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase.from("projects").select("*").order("created_at", { ascending: false });
    setProjects((data ?? []) as ProjectRow[]);
    setLoading(false);
  }, []);

  useEffect(() => { void load(); }, [load]);

  async function togglePublish(p: ProjectRow): Promise<void> {
    await supabase.from("projects").update({ is_published: !p.is_published }).eq("id", p.id);
    void load();
  }

  async function deleteProject(p: ProjectRow): Promise<void> {
    if (!confirm(`حذف "${p.title_ar}"؟`)) return;
    await supabase.from("projects").delete().eq("id", p.id);
    void load();
  }

  const filtered = projects.filter((p) =>
    !search.trim() || p.title_ar.toLowerCase().includes(search.toLowerCase()) || p.title_en.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      {editTarget !== undefined && (
        <ProjectForm project={editTarget} onSave={load} onClose={() => setEditTarget(undefined)} />
      )}

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-xl font-bold">المشاريع</h1>
          <p className="text-muted-foreground text-sm">{projects.length} مشروع في قاعدة البيانات</p>
        </div>
        <button
          onClick={() => setEditTarget(null)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary-dark transition-colors"
        >
          <Plus size={15} />
          مشروع جديد
        </button>
      </div>

      {/* Search */}
      <div className="relative mb-4 max-w-xs">
        <Search size={14} className="absolute top-1/2 -translate-y-1/2 start-3 text-muted-foreground" />
        <input value={search} onChange={(e) => setSearch(e.target.value)}
          placeholder="بحث..." className="w-full ps-9 pe-4 py-2 rounded-xl border border-border bg-card text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
      </div>

      {/* Table */}
      <div className="rounded-2xl border border-border bg-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[700px]">
            <thead className="border-b border-border bg-muted/40">
              <tr>
                <th className={thCls}>العنوان</th>
                <th className={thCls}>التصنيف</th>
                <th className={thCls}>الحالة</th>
                <th className={thCls}>المستفيدون</th>
                <th className={thCls}>الإجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <tr key={i}><td colSpan={5} className="p-4"><div className="h-8 shimmer rounded-lg" /></td></tr>
                ))
              ) : filtered.map((p) => (
                <tr key={p.id} className="hover:bg-muted/30 transition-colors">
                  <td className={tdCls}>
                    <div className="flex items-center gap-2">
                      {p.is_featured && <Star size={13} className="text-amber-500 shrink-0" />}
                      <div>
                        <p className="font-medium">{p.title_ar}</p>
                        <p className="text-xs text-muted-foreground">{p.title_en}</p>
                      </div>
                    </div>
                  </td>
                  <td className={tdCls}><span className="text-xs text-muted-foreground">{CAT_LABEL[p.category]}</span></td>
                  <td className={tdCls}>
                    <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-semibold ${STATUS_LABEL[p.status]?.cls}`}>
                      {STATUS_LABEL[p.status]?.label}
                    </span>
                  </td>
                  <td className={tdCls}>{p.beneficiaries_count?.toLocaleString() ?? "—"}</td>
                  <td className={tdCls}>
                    <div className="flex items-center gap-1">
                      <button onClick={() => togglePublish(p)} title={p.is_published ? "إخفاء" : "نشر"}
                        className={`p-1.5 rounded-lg hover:bg-muted transition-colors ${p.is_published ? "text-emerald-600" : "text-muted-foreground"}`}>
                        {p.is_published ? <Eye size={15} /> : <EyeOff size={15} />}
                      </button>
                      <button onClick={() => setEditTarget(p)} title="تعديل"
                        className="p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-primary">
                        <Edit2 size={15} />
                      </button>
                      <button onClick={() => deleteProject(p)} title="حذف"
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
          <div className="text-center py-12 text-muted-foreground text-sm">لا توجد مشاريع مطابقة</div>
        )}
      </div>
    </div>
  );
}
