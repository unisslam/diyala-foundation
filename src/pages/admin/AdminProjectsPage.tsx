/**
 * AdminProjectsPage.tsx
 * ----------------------
 * CRUD management for the `projects` table.
 * Features:
 *  • Dual-mode responsive view (Smart Cards on mobile, DataTable on desktop)
 *  • Category filter chips + Search
 *  • Non-blocking delete confirmation modal (no native window.confirm)
 *  • Touch-optimized add/edit modal (CoverImageUpload, categories, status)
 *  • Publish toggle & featured star toggling
 */

import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus, Edit2, Trash2, Eye, EyeOff, Search, Star,
  FolderOpen, MapPin, Users, AlertTriangle, X
} from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import type { ProjectRow } from "@/types/database.types";
import { CoverImageUpload } from "@/components/shared/CoverImageUpload";

// ── Status badge ────────────────────────────────────────────────────
const STATUS_LABEL: Record<string, { label: string; cls: string }> = {
  active:    { label: "نشط",    cls: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300" },
  completed: { label: "منجز",   cls: "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300" },
  planned:   { label: "مخطط",  cls: "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300" },
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
const tdCls = "px-4 py-3.5 text-sm";

// ── Delete Confirmation Modal ───────────────────────────────────────
interface DeleteModalProps {
  project: ProjectRow;
  onConfirm: () => Promise<void>;
  onClose: () => void;
  deleting: boolean;
}

function DeleteModal({ project, onConfirm, onClose, deleting }: DeleteModalProps): React.ReactElement {
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
          <h3 className="font-display font-bold text-lg">تأكيد حذف المشروع</h3>
          <p className="text-sm text-muted-foreground">
            هل أنت متأكد من رغبتك في حذف <strong className="text-foreground">"{project.title_ar}"</strong> نهائياً من قاعدة البيانات؟
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
          <h2 className="font-display font-bold text-base sm:text-lg">{isNew ? "إضافة مشروع جديد" : "تعديل بيانات المشروع"}</h2>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-muted text-muted-foreground transition-colors">
            <X size={18} />
          </button>
        </div>

        <div className="p-5 sm:p-6 space-y-4 flex-1">
          {error && <p className="text-destructive text-sm bg-destructive/10 p-3 rounded-xl">{error}</p>}
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium mb-1.5 block">العنوان بالعربية *</label>
              <input value={form.title_ar} onChange={(e) => setForm(p => ({...p, title_ar: e.target.value}))} className={inputCls} dir="rtl" placeholder="مثال: مشروع حصاد مياه الأمطار" />
            </div>
            <div>
              <label className="text-xs font-medium mb-1.5 block">Title in English *</label>
              <input value={form.title_en} onChange={(e) => setForm(p => ({...p, title_en: e.target.value}))} className={inputCls} dir="ltr" placeholder="e.g. Rainwater Harvesting" />
            </div>
          </div>
          <div>
            <label className="text-xs font-medium mb-1.5 block">المعرف اللطيف Slug (URL)</label>
            <input value={form.slug} onChange={(e) => setForm(p => ({...p, slug: e.target.value}))} className={inputCls} dir="ltr" placeholder="auto-generated from English title" />
          </div>
          <div>
            <label className="text-xs font-medium mb-1.5 block">الوصف بالعربية</label>
            <textarea rows={3} value={form.description_ar} onChange={(e) => setForm(p => ({...p, description_ar: e.target.value}))} className={`${inputCls} resize-none`} dir="rtl" />
          </div>
          <div>
            <label className="text-xs font-medium mb-1.5 block">Description in English</label>
            <textarea rows={3} value={form.description_en} onChange={(e) => setForm(p => ({...p, description_en: e.target.value}))} className={`${inputCls} resize-none`} dir="ltr" />
          </div>
          <div className="grid sm:grid-cols-3 gap-4">
            <div>
              <label className="text-xs font-medium mb-1.5 block">التصنيف</label>
              <select value={form.category} onChange={(e) => setForm(p => ({...p, category: e.target.value as ProjectRow["category"]}))} className={inputCls}>
                {Object.entries(CAT_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium mb-1.5 block">الحالة</label>
              <select value={form.status} onChange={(e) => setForm(p => ({...p, status: e.target.value as ProjectRow["status"]}))} className={inputCls}>
                <option value="planned">مخطط</option>
                <option value="active">نشط</option>
                <option value="completed">منجز</option>
                <option value="on_hold">متوقف</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-medium mb-1.5 block">تاريخ البدء</label>
              <input type="date" value={form.start_date ?? ""} onChange={(e) => setForm(p => ({...p, start_date: e.target.value}))} className={inputCls} dir="ltr" />
            </div>
          </div>
          <div>
            <label className="text-xs font-medium mb-1.5 block">الموقع الجغرافي (عربي)</label>
            <input value={form.location_ar ?? ""} onChange={(e) => setForm(p => ({...p, location_ar: e.target.value}))} className={inputCls} placeholder="مثال: بعقوبة، محافظة ديالى" />
          </div>
          <div className="flex flex-wrap gap-6 pt-2">
            <label className="flex items-center gap-2 cursor-pointer text-sm select-none">
              <input type="checkbox" checked={form.is_featured} onChange={(e) => setForm(p => ({...p, is_featured: e.target.checked}))} className="w-4 h-4 rounded text-primary" />
              مشروع مميز ⭐
            </label>
            <label className="flex items-center gap-2 cursor-pointer text-sm select-none">
              <input type="checkbox" checked={form.is_published} onChange={(e) => setForm(p => ({...p, is_published: e.target.checked}))} className="w-4 h-4 rounded text-primary" />
              منشور للجمهور
            </label>
          </div>
          <div>
            <label className="text-xs font-medium mb-1.5 block">صورة غلاف المشروع</label>
            <CoverImageUpload
              bucket="projects"
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
            {saving ? "جاري الحفظ..." : "حفظ المشروع"}
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
  const [selectedCat, setSelectedCat] = useState<string>("all");
  const [editTarget, setEditTarget]   = useState<Partial<ProjectRow> | null | undefined>(undefined);
  const [deleteTarget, setDeleteTarget] = useState<ProjectRow | null>(null);
  const [deleting, setDeleting] = useState(false);

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

  async function confirmDelete(): Promise<void> {
    if (!deleteTarget) return;
    setDeleting(true);
    await supabase.from("projects").delete().eq("id", deleteTarget.id);
    setDeleting(false);
    setDeleteTarget(null);
    void load();
  }

  const filtered = projects.filter((p) => {
    if (selectedCat !== "all" && p.category !== selectedCat) return false;
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return p.title_ar.toLowerCase().includes(q) || p.title_en.toLowerCase().includes(q) || (p.location_ar || "").toLowerCase().includes(q);
  });

  return (
    <div dir="rtl" className="space-y-6">
      {/* Edit / Add Modal */}
      <AnimatePresence>
        {editTarget !== undefined && (
          <ProjectForm project={editTarget} onSave={load} onClose={() => setEditTarget(undefined)} />
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {deleteTarget && (
          <DeleteModal
            project={deleteTarget}
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
            <FolderOpen className="text-primary" size={24} />
            المشاريع التنموية
          </h1>
          <p className="text-muted-foreground text-xs sm:text-sm mt-0.5">
            {projects.length} مشروع مسجل · {projects.filter(p => p.is_published).length} منشور للجمهور
          </p>
        </div>
        <button
          onClick={() => setEditTarget(null)}
          className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary-dark shadow-sm transition-all active:scale-98 min-h-[44px]"
        >
          <Plus size={16} />
          مشروع جديد
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
              placeholder="بحث بالاسم أو الموقع..."
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
              الكل ({projects.length})
            </button>
            {Object.entries(CAT_LABEL).map(([key, label]) => {
              const count = projects.filter(p => p.category === key).length;
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
            لا توجد مشاريع مطابقة للبحث
          </div>
        ) : (
          filtered.map((p) => {
            const statusCfg = STATUS_LABEL[p.status] ?? { label: p.status, cls: "bg-muted text-muted-foreground" };
            return (
              <div
                key={p.id}
                className="bg-card rounded-3xl border border-border p-4 shadow-xs space-y-3"
              >
                {/* Image & Title Header */}
                <div className="flex items-start gap-3">
                  {p.cover_image_path ? (
                    <img
                      src={p.cover_image_path}
                      alt={p.title_ar}
                      className="w-16 h-16 rounded-2xl object-cover shrink-0 border border-border"
                      loading="lazy"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shrink-0 border border-primary/20 font-bold text-xl">
                      {p.title_ar.charAt(0)}
                    </div>
                  )}

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <h3 className="font-bold text-sm text-foreground line-clamp-1">{p.title_ar}</h3>
                      {p.is_featured && <Star size={13} className="text-amber-500 shrink-0 fill-amber-500" />}
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-1">{p.title_en}</p>

                    <div className="flex items-center gap-2 mt-2 flex-wrap">
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold ${statusCfg.cls}`}>
                        {statusCfg.label}
                      </span>
                      <span className="text-[10px] bg-muted px-2 py-0.5 rounded-full text-muted-foreground font-medium">
                        {CAT_LABEL[p.category] ?? p.category}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Details snippet */}
                {(p.location_ar || p.beneficiaries_count) && (
                  <div className="flex items-center gap-4 text-xs text-muted-foreground pt-1 border-t border-border/50">
                    {p.location_ar && (
                      <span className="flex items-center gap-1 truncate">
                        <MapPin size={12} className="shrink-0 text-primary" />
                        {p.location_ar}
                      </span>
                    )}
                    {p.beneficiaries_count ? (
                      <span className="flex items-center gap-1 shrink-0">
                        <Users size={12} className="text-blue-500" />
                        {p.beneficiaries_count.toLocaleString()} مستفيد
                      </span>
                    ) : null}
                  </div>
                )}

                {/* Actions Toolbar */}
                <div className="flex items-center justify-between pt-2 border-t border-border/60">
                  <button
                    onClick={() => togglePublish(p)}
                    className={`flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors min-h-[36px] ${
                      p.is_published
                        ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {p.is_published ? <Eye size={13} /> : <EyeOff size={13} />}
                    {p.is_published ? "منشور" : "مخفي"}
                  </button>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setEditTarget(p)}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-xl border border-border text-xs font-semibold hover:bg-muted text-foreground transition-colors min-h-[36px]"
                    >
                      <Edit2 size={13} />
                      تعديل
                    </button>
                    <button
                      onClick={() => setDeleteTarget(p)}
                      className="p-2 rounded-xl text-destructive hover:bg-destructive/10 transition-colors min-h-[36px] min-w-[36px] flex items-center justify-center"
                      title="حذف"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* ── DESKTOP DATA TABLE (≥ 768px) ── */}
      <div className="hidden md:block rounded-3xl border border-border bg-card overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="border-b border-border bg-muted/40">
              <tr>
                <th className={thCls}>المشروع</th>
                <th className={thCls}>التصنيف</th>
                <th className={thCls}>الحالة</th>
                <th className={thCls}>المستفيدون</th>
                <th className={thCls}>الموقع</th>
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
                    لا توجد مشاريع مطابقة
                  </td>
                </tr>
              ) : (
                filtered.map((p) => {
                  const statusCfg = STATUS_LABEL[p.status] ?? { label: p.status, cls: "bg-muted text-muted-foreground" };
                  return (
                    <tr key={p.id} className="hover:bg-muted/30 transition-colors">
                      <td className={tdCls}>
                        <div className="flex items-center gap-3">
                          {p.cover_image_path ? (
                            <img src={p.cover_image_path} alt="" className="w-10 h-10 rounded-xl object-cover shrink-0 border border-border" />
                          ) : (
                            <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0 font-bold">
                              {p.title_ar.charAt(0)}
                            </div>
                          )}
                          <div>
                            <div className="flex items-center gap-1.5">
                              <p className="font-semibold text-foreground">{p.title_ar}</p>
                              {p.is_featured && <Star size={13} className="text-amber-500 fill-amber-500 shrink-0" />}
                            </div>
                            <p className="text-xs text-muted-foreground">{p.title_en}</p>
                          </div>
                        </div>
                      </td>
                      <td className={tdCls}>
                        <span className="text-xs font-medium text-muted-foreground">{CAT_LABEL[p.category] ?? p.category}</span>
                      </td>
                      <td className={tdCls}>
                        <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-semibold ${statusCfg.cls}`}>
                          {statusCfg.label}
                        </span>
                      </td>
                      <td className={tdCls}>
                        <span className="text-xs font-medium">{p.beneficiaries_count?.toLocaleString() ?? "—"}</span>
                      </td>
                      <td className={tdCls}>
                        <span className="text-xs text-muted-foreground">{p.location_ar || "—"}</span>
                      </td>
                      <td className={tdCls}>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => togglePublish(p)}
                            title={p.is_published ? "منشور (انقر للإخفاء)" : "مخفي (انقر للنشر)"}
                            className={`p-2 rounded-xl hover:bg-muted transition-colors ${
                              p.is_published ? "text-emerald-600" : "text-muted-foreground"
                            }`}
                          >
                            {p.is_published ? <Eye size={16} /> : <EyeOff size={16} />}
                          </button>
                          <button
                            onClick={() => setEditTarget(p)}
                            title="تعديل"
                            className="p-2 rounded-xl hover:bg-muted transition-colors text-muted-foreground hover:text-primary"
                          >
                            <Edit2 size={16} />
                          </button>
                          <button
                            onClick={() => setDeleteTarget(p)}
                            title="حذف"
                            className="p-2 rounded-xl hover:bg-muted transition-colors text-muted-foreground hover:text-destructive"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
