/**
 * AdminMembershipsPage.tsx
 * -------------------------
 * Professional membership applications management.
 * Features: DataTable, status filters, detail panel, status update, CSV export.
 */

import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search, Download, X, CheckCircle, Clock, XCircle,
  ChevronRight, Eye, MessageSquare, RefreshCw, PauseCircle,
  User, Mail, Phone, MapPin, GraduationCap, Calendar,
} from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import type { MembershipApplicationRow, MembershipStatus, MembershipType } from "@/types/database.types";

// ── Status config ───────────────────────────────────────────────────
const STATUS_CFG: Record<MembershipStatus, { label: string; cls: string; icon: React.ElementType }> = {
  pending:      { label: "قيد الانتظار",    cls: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",    icon: Clock },
  under_review: { label: "تحت المراجعة",   cls: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",       icon: Eye },
  approved:     { label: "مقبول",            cls: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400", icon: CheckCircle },
  rejected:     { label: "مرفوض",            cls: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",           icon: XCircle },
  waitlisted:   { label: "قائمة انتظار",    cls: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400",      icon: PauseCircle },
};

const TYPE_LABEL: Record<MembershipType, string> = {
  regular:  "عادي",
  founding: "مؤسس",
  honorary: "فخري",
  student:  "طلابي",
};

const EDU_LABEL: Record<string, string> = {
  high_school: "الثانوية",
  diploma: "دبلوم",
  bachelor: "بكالوريوس",
  master: "ماجستير",
  phd: "دكتوراه",
  other: "أخرى",
};

// ── Export to CSV ───────────────────────────────────────────────────
function exportCSV(rows: MembershipApplicationRow[]): void {
  const headers = [
    "رقم الطلب","الاسم عربي","الاسم إنجليزي","البريد","الهاتف","المحافظة","المدينة",
    "تاريخ الميلاد","الجنس","التعليم","التخصص","المؤسسة","جهة العمل","الخبرة (سنوات)",
    "نوع العضوية","الحالة","تاريخ التقديم",
  ];
  const rows2 = rows.map((r) => [
    r.application_number ?? "",
    r.full_name_ar,
    r.full_name_en,
    r.email,
    r.phone_primary,
    r.governorate,
    r.city,
    r.date_of_birth,
    r.gender === "male" ? "ذكر" : r.gender === "female" ? "أنثى" : "",
    EDU_LABEL[r.education_level] ?? r.education_level,
    r.education_field ?? "",
    r.institution ?? "",
    r.current_employer ?? "",
    r.years_of_experience?.toString() ?? "",
    TYPE_LABEL[r.membership_type],
    STATUS_CFG[r.status]?.label ?? r.status,
    new Date(r.created_at).toLocaleDateString("ar-IQ"),
  ]);

  const csv = [headers, ...rows2]
    .map((row) => row.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(","))
    .join("\n");

  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement("a");
  a.href     = url;
  a.download = `membership_applications_${new Date().toISOString().split("T")[0]}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

// ── Detail Panel ────────────────────────────────────────────────────
function DetailPanel({ app, onClose, onStatusChange }: {
  app: MembershipApplicationRow;
  onClose: () => void;
  onStatusChange: (id: string, status: MembershipStatus, notes?: string) => Promise<void>;
}): React.ReactElement {
  const [notes, setNotes]     = useState(app.reviewer_notes ?? "");
  const [saving, setSaving]   = useState(false);
  const cfg = STATUS_CFG[app.status];

  async function updateStatus(status: MembershipStatus): Promise<void> {
    setSaving(true);
    await onStatusChange(app.id, status, notes);
    setSaving(false);
  }

  const Row = ({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string | null | undefined }): React.ReactElement | null =>
    value ? (
      <div className="flex items-start gap-3 py-2 border-b border-border/60 last:border-0">
        <Icon size={14} className="text-muted-foreground mt-0.5 shrink-0" />
        <div>
          <p className="text-[10px] text-muted-foreground">{label}</p>
          <p className="text-sm font-medium">{value}</p>
        </div>
      </div>
    ) : null;

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 z-50 flex items-center justify-end" dir="rtl"
    >
      <motion.div
        initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
        transition={{ type: "spring", damping: 25 }}
        className="h-full w-full max-w-lg bg-card border-s border-border overflow-y-auto"
      >
        {/* Header */}
        <div className="sticky top-0 bg-card border-b border-border px-5 py-4 flex items-center justify-between">
          <div>
            <p className="font-bold font-display">{app.full_name_ar}</p>
            <p className="text-xs text-muted-foreground" dir="ltr">{app.application_number}</p>
          </div>
          <div className="flex items-center gap-2">
            <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${cfg.cls}`}>
              <cfg.icon size={11} />
              {cfg.label}
            </span>
            <button onClick={onClose} className="p-2 rounded-xl hover:bg-muted"><X size={16} /></button>
          </div>
        </div>

        <div className="p-5 space-y-6">
          {/* Personal */}
          <section>
            <p className="font-semibold text-sm mb-3 flex items-center gap-2"><User size={14} /> المعلومات الشخصية</p>
            <div className="bg-muted/30 rounded-2xl px-4 py-1">
              <Row icon={User}    label="الاسم الكامل (إنجليزي)" value={app.full_name_en} />
              <Row icon={Calendar} label="تاريخ الميلاد"          value={app.date_of_birth} />
              <Row icon={User}    label="الجنس"                    value={app.gender === "male" ? "ذكر" : app.gender === "female" ? "أنثى" : null} />
              <Row icon={User}    label="الجنسية"                  value={app.nationality} />
            </div>
          </section>

          {/* Contact */}
          <section>
            <p className="font-semibold text-sm mb-3 flex items-center gap-2"><Phone size={14} /> التواصل</p>
            <div className="bg-muted/30 rounded-2xl px-4 py-1">
              <Row icon={Mail}   label="البريد الإلكتروني" value={app.email} />
              <Row icon={Phone}  label="الهاتف الرئيسي"   value={app.phone_primary} />
              <Row icon={Phone}  label="الهاتف البديل"     value={app.phone_secondary} />
              <Row icon={MapPin} label="المحافظة"           value={app.governorate} />
              <Row icon={MapPin} label="المدينة"            value={app.city} />
            </div>
          </section>

          {/* Education */}
          <section>
            <p className="font-semibold text-sm mb-3 flex items-center gap-2"><GraduationCap size={14} /> التعليم والعمل</p>
            <div className="bg-muted/30 rounded-2xl px-4 py-1">
              <Row icon={GraduationCap} label="المؤهل العلمي"  value={EDU_LABEL[app.education_level]} />
              <Row icon={GraduationCap} label="التخصص"          value={app.education_field} />
              <Row icon={GraduationCap} label="المؤسسة التعليمية" value={app.institution} />
              <Row icon={GraduationCap} label="جهة العمل"       value={app.current_employer} />
              <Row icon={GraduationCap} label="المنصب"           value={app.current_position} />
              <Row icon={GraduationCap} label="سنوات الخبرة"    value={app.years_of_experience?.toString()} />
            </div>
          </section>

          {/* Skills */}
          {(app.skills?.length || app.areas_of_interest?.length) && (
            <section>
              <p className="font-semibold text-sm mb-3">المهارات والاهتمامات</p>
              {app.skills && app.skills.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {app.skills.map((s) => (
                    <span key={s} className="px-2.5 py-0.5 rounded-full bg-primary/10 text-primary text-xs">{s}</span>
                  ))}
                </div>
              )}
            </section>
          )}

          {/* Motivation */}
          {app.motivation_statement && (
            <section>
              <p className="font-semibold text-sm mb-2">بيان الدوافع</p>
              <p className="text-sm text-muted-foreground bg-muted/30 rounded-2xl p-4 leading-relaxed">{app.motivation_statement}</p>
            </section>
          )}

          {/* Reviewer notes */}
          <section>
            <p className="font-semibold text-sm mb-2 flex items-center gap-2"><MessageSquare size={14} /> ملاحظات المراجع</p>
            <textarea rows={3} value={notes} onChange={(e) => setNotes(e.target.value)}
              placeholder="أضف ملاحظاتك هنا..."
              className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary" />
          </section>

          {/* Actions */}
          <section>
            <p className="font-semibold text-sm mb-3">تغيير الحالة</p>
            <div className="grid grid-cols-2 gap-2">
              <button onClick={() => updateStatus("approved")} disabled={saving || app.status === "approved"}
                className="flex items-center justify-center gap-2 py-2 rounded-xl bg-emerald-500 text-white text-sm font-medium disabled:opacity-40">
                <CheckCircle size={14} /> قبول
              </button>
              <button onClick={() => updateStatus("under_review")} disabled={saving || app.status === "under_review"}
                className="flex items-center justify-center gap-2 py-2 rounded-xl bg-blue-500 text-white text-sm font-medium disabled:opacity-40">
                <Eye size={14} /> مراجعة
              </button>
              <button onClick={() => updateStatus("waitlisted")} disabled={saving || app.status === "waitlisted"}
                className="flex items-center justify-center gap-2 py-2 rounded-xl bg-slate-400 text-white text-sm font-medium disabled:opacity-40">
                <PauseCircle size={14} /> قائمة انتظار
              </button>
              <button onClick={() => updateStatus("rejected")} disabled={saving || app.status === "rejected"}
                className="flex items-center justify-center gap-2 py-2 rounded-xl bg-destructive text-white text-sm font-medium disabled:opacity-40">
                <XCircle size={14} /> رفض
              </button>
            </div>
            {saving && <p className="text-xs text-center text-muted-foreground mt-2">جاري الحفظ...</p>}
          </section>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ── AdminMembershipsPage ─────────────────────────────────────────────
export default function AdminMembershipsPage(): React.ReactElement {
  const [apps, setApps]         = useState<MembershipApplicationRow[]>([]);
  const [loading, setLoading]   = useState(true);
  const [search, setSearch]     = useState("");
  const [statusFilter, setStatusFilter] = useState<MembershipStatus | "all">("all");
  const [typeFilter, setTypeFilter]     = useState<MembershipType | "all">("all");
  const [selected, setSelected] = useState<MembershipApplicationRow | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from("membership_applications")
      .select("*")
      .order("created_at", { ascending: false });
    setApps((data ?? []) as MembershipApplicationRow[]);
    setLoading(false);
  }, []);

  useEffect(() => { void load(); }, [load]);

  async function handleStatusChange(id: string, status: MembershipStatus, notes?: string): Promise<void> {
    await supabase.from("membership_applications").update({
      status,
      reviewer_notes: notes,
      reviewed_at: new Date().toISOString(),
    }).eq("id", id);
    void load();
    // Update local selected state
    setSelected((prev) => prev?.id === id ? { ...prev, status, reviewer_notes: notes ?? null } : prev);
  }

  const filtered = apps.filter((a) => {
    if (statusFilter !== "all" && a.status !== statusFilter) return false;
    if (typeFilter  !== "all" && a.membership_type !== typeFilter)  return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      return a.full_name_ar.toLowerCase().includes(q) ||
             a.full_name_en.toLowerCase().includes(q) ||
             a.email.toLowerCase().includes(q) ||
             (a.application_number ?? "").toLowerCase().includes(q);
    }
    return true;
  });

  const thCls = "px-4 py-3 text-start text-xs font-semibold text-muted-foreground uppercase tracking-wide";
  const tdCls = "px-4 py-3 text-sm";

  return (
    <div dir="rtl">
      <AnimatePresence>
        {selected && (
          <DetailPanel
            app={selected}
            onClose={() => setSelected(null)}
            onStatusChange={handleStatusChange}
          />
        )}
      </AnimatePresence>

      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="font-display text-xl font-bold">طلبات العضوية</h1>
          <p className="text-muted-foreground text-sm">{apps.length} طلب في قاعدة البيانات</p>
        </div>
        <div className="flex gap-2">
          <button onClick={load} className="p-2.5 rounded-xl border border-border hover:bg-muted text-muted-foreground" title="تحديث">
            <RefreshCw size={15} />
          </button>
          <button
            onClick={() => exportCSV(filtered)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-border text-sm font-medium hover:bg-muted transition-colors"
          >
            <Download size={15} />
            تصدير CSV ({filtered.length})
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 mb-4">
        <div className="relative">
          <Search size={13} className="absolute top-1/2 -translate-y-1/2 start-3 text-muted-foreground" />
          <input value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="بحث بالاسم، البريد، رقم الطلب..."
            className="ps-8 pe-4 py-2 rounded-xl border border-border bg-card text-sm focus:outline-none focus:ring-2 focus:ring-primary w-64" />
        </div>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as MembershipStatus | "all")}
          className="px-3 py-2 rounded-xl border border-border bg-card text-sm focus:outline-none focus:ring-2 focus:ring-primary">
          <option value="all">جميع الحالات</option>
          {Object.entries(STATUS_CFG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
        </select>
        <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value as MembershipType | "all")}
          className="px-3 py-2 rounded-xl border border-border bg-card text-sm focus:outline-none focus:ring-2 focus:ring-primary">
          <option value="all">جميع الأنواع</option>
          {Object.entries(TYPE_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
        {(statusFilter !== "all" || typeFilter !== "all" || search) && (
          <button onClick={() => { setStatusFilter("all"); setTypeFilter("all"); setSearch(""); }}
            className="px-3 py-2 rounded-xl border border-border text-xs text-muted-foreground hover:text-destructive flex items-center gap-1">
            <X size={12} /> إلغاء
          </button>
        )}
      </div>

      {/* Table */}
      <div className="rounded-2xl border border-border bg-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[750px]">
            <thead className="border-b border-border bg-muted/40">
              <tr>
                <th className={thCls}>رقم الطلب</th>
                <th className={thCls}>المتقدم</th>
                <th className={thCls}>المحافظة</th>
                <th className={thCls}>النوع</th>
                <th className={thCls}>التعليم</th>
                <th className={thCls}>الحالة</th>
                <th className={thCls}>تاريخ التقديم</th>
                <th className={thCls}></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}><td colSpan={8} className="p-4"><div className="h-8 shimmer rounded-lg" /></td></tr>
                ))
              ) : filtered.map((a) => {
                const cfg = STATUS_CFG[a.status];
                return (
                  <tr key={a.id} className="hover:bg-muted/30 transition-colors cursor-pointer" onClick={() => setSelected(a)}>
                    <td className={`${tdCls} font-mono text-xs text-muted-foreground`} dir="ltr">{a.application_number ?? "—"}</td>
                    <td className={tdCls}>
                      <p className="font-medium">{a.full_name_ar}</p>
                      <p className="text-xs text-muted-foreground">{a.email}</p>
                    </td>
                    <td className={tdCls}><span className="text-xs">{a.governorate}</span></td>
                    <td className={tdCls}><span className="text-xs text-muted-foreground">{TYPE_LABEL[a.membership_type]}</span></td>
                    <td className={tdCls}><span className="text-xs">{EDU_LABEL[a.education_level] ?? a.education_level}</span></td>
                    <td className={tdCls}>
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${cfg.cls}`}>
                        <cfg.icon size={10} />
                        {cfg.label}
                      </span>
                    </td>
                    <td className={`${tdCls} text-xs text-muted-foreground`}>
                      {new Date(a.created_at).toLocaleDateString("ar-IQ")}
                    </td>
                    <td className={tdCls}>
                      <ChevronRight size={14} className="text-muted-foreground rtl:rotate-180" />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {!loading && filtered.length === 0 && (
          <div className="text-center py-12 text-muted-foreground text-sm">لا توجد طلبات مطابقة</div>
        )}
      </div>
    </div>
  );
}
