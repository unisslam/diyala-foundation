/**
 * AdminMembershipsPage.tsx
 * ------------------------
 * Professional membership applications management — Enterprise Edition.
 *
 * Features:
 *  • Full Mobile-First Responsive Design (Smart Cards on Mobile, Data Table on Desktop)
 *  • Official Iraqi NGO Letterhead PDF Export with dynamic QR verification & stamp
 *  • Unified Batch PDF & 2-Sheet Executive Excel exports
 *  • Safe Application Deletion with cascading team member checks
 *  • Direct integration with /admin/team & Member promotion to admin user
 *  • Detailed 47-field dossier panel
 */

import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";
import {
  Search, Download, X,
  ChevronRight, MessageSquare, RefreshCw,
  User, Mail, Phone, MapPin, GraduationCap, Calendar,
  FileText, Users, Star, Heart, Briefcase, Globe,
  AlertCircle, Shield, Printer, Filter, Trash2, KeyRound,
  ExternalLink
} from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import type { MembershipApplicationRow, MembershipStatus, MembershipType, TeamMemberRow } from "@/types/database.types";
import {
  STATUS_CFG,
  TYPE_LABEL,
  EDU_LABEL,
  GENDER_LABEL,
  printOfficialApplication,
  printBatchOfficialApplications,
  exportExecutiveExcel,
} from "@/lib/membershipExport";
import DeleteApplicationModal from "@/components/admin/DeleteApplicationModal";
import PromoteMemberModal from "@/components/admin/PromoteMemberModal";

// ── Detail Panel ────────────────────────────────────────────────────────

function DetailPanel({
  app,
  onClose,
  onStatusChange,
  onDeleteRequest,
  onPromoteRequest,
}: {
  app: MembershipApplicationRow;
  onClose: () => void;
  onStatusChange: (id: string, status: MembershipStatus, notes?: string) => Promise<void>;
  onDeleteRequest: (app: MembershipApplicationRow) => void;
  onPromoteRequest: (app: MembershipApplicationRow) => void;
}): React.ReactElement {
  const [notes, setNotes]   = useState(app.reviewer_notes ?? "");
  const [saving, setSaving] = useState(false);
  const [printing, setPrinting] = useState(false);
  const cfg = STATUS_CFG[app.status] ?? { label: app.status, color: "#64748b", cls: "bg-muted text-muted-foreground" };

  async function updateStatus(status: MembershipStatus): Promise<void> {
    setSaving(true);
    await onStatusChange(app.id, status, notes);
    setSaving(false);
  }

  async function handlePrint(): Promise<void> {
    setPrinting(true);
    try {
      await printOfficialApplication(app);
    } finally {
      setPrinting(false);
    }
  }

  // Reusable field row
  const InfoRow = ({ icon: Icon = User, label, value }: {
    icon?: React.ElementType; label: string; value: string | number | null | undefined;
  }): React.ReactElement | null =>
    value !== null && value !== undefined && value !== "" ? (
      <div className="flex items-start gap-3 py-2.5 border-b border-border/50 last:border-0">
        <Icon size={14} className="text-primary/70 mt-0.5 shrink-0" />
        <div className="min-w-0 flex-1">
          <p className="text-[10.5px] font-medium text-muted-foreground mb-0.5">{label}</p>
          <p className="text-sm font-semibold text-foreground break-words">{value}</p>
        </div>
      </div>
    ) : null;

  const Section = ({ icon: Icon = User, title, children }: {
    icon?: React.ElementType; title: string; children: React.ReactNode;
  }): React.ReactElement => (
    <section className="space-y-2">
      <p className="font-bold text-sm flex items-center gap-2 text-foreground">
        <span className="w-6 h-6 rounded-lg bg-primary/10 flex items-center justify-center">
          <Icon size={13} className="text-primary" />
        </span>
        {title}
      </p>
      <div className="bg-muted/30 rounded-2xl px-4 py-1.5 border border-border/50 shadow-xs">
        {children}
      </div>
    </section>
  );

  const TagList = ({ items, label }: { items: string[] | null | undefined; label: string }): React.ReactElement | null =>
    items && items.length > 0 ? (
      <div className="py-2.5 border-b border-border/50 last:border-0">
        <p className="text-[10px] font-medium text-muted-foreground mb-1.5">{label}</p>
        <div className="flex flex-wrap gap-1.5">
          {items.map((t) => (
            <span key={t} className="px-2.5 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-semibold">
              {t}
            </span>
          ))}
        </div>
      </div>
    ) : null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-end"
      dir="rtl"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <motion.div
        initial={{ x: "100%" }}
        animate={{ x: 0 }}
        exit={{ x: "100%" }}
        transition={{ type: "spring", damping: 28, stiffness: 300 }}
        className="h-full w-full sm:max-w-xl bg-card border-s border-border overflow-y-auto shadow-2xl flex flex-col justify-between"
      >
        {/* Sticky Header */}
        <div className="sticky top-0 bg-card/95 backdrop-blur-md border-b border-border px-5 py-4 flex items-center justify-between z-20 shadow-xs">
          <div className="min-w-0 flex-1 me-3">
            <h2 className="font-bold font-display text-base text-foreground truncate">{app.full_name_ar}</h2>
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                {TYPE_LABEL[app.membership_type] ?? app.membership_type}
              </span>
              <span className="text-xs text-muted-foreground font-mono font-bold" dir="ltr">
                {app.application_number ?? "—"}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {/* Print Official Letterhead PDF */}
            <button
              onClick={handlePrint}
              disabled={printing}
              title="طباعة الاستمارة الرسمية / PDF"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-border text-xs font-bold hover:bg-muted hover:border-primary transition-all text-foreground"
            >
              <Printer size={13} className="text-primary" />
              <span>{printing ? "جاري..." : "طباعة PDF"}</span>
            </button>

            {/* Delete button */}
            <button
              onClick={() => onDeleteRequest(app)}
              title="حذف الطلب"
              className="p-2 rounded-xl text-destructive hover:bg-destructive/10 border border-destructive/20 transition-colors"
            >
              <Trash2 size={14} />
            </button>

            <button onClick={onClose} className="p-2 rounded-xl hover:bg-muted text-muted-foreground transition-colors">
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-5 space-y-5 flex-1">
          {/* Status & Team Banner */}
          <div className="flex items-center justify-between p-3.5 rounded-2xl border border-border/60 bg-muted/20 flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold ${cfg.cls}`}>
                {cfg.label}
              </span>
              <span className="text-xs text-muted-foreground">
                تقديم: {new Date(app.created_at).toLocaleDateString("ar-IQ")}
              </span>
            </div>

            {app.status === "approved" && (
              <div className="flex items-center gap-2">
                <Link
                  to="/admin/team"
                  className="inline-flex items-center gap-1 text-xs font-bold text-primary hover:underline bg-primary/10 px-2.5 py-1 rounded-xl"
                >
                  <ExternalLink size={12} /> صفحة الفريق
                </Link>
                <button
                  onClick={() => onPromoteRequest(app)}
                  className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20 px-2.5 py-1 rounded-xl transition-colors border border-emerald-500/20"
                >
                  <KeyRound size={12} /> ترقية لمشرف
                </button>
              </div>
            )}
          </div>

          {/* ① Personal */}
          <Section icon={User} title="المعلومات الشخصية">
            <InfoRow icon={Star}     label="نوع العضوية"             value={TYPE_LABEL[app.membership_type] ?? app.membership_type} />
            <InfoRow icon={User}     label="الاسم الكامل (إنجليزي)" value={app.full_name_en} />
            <InfoRow icon={Calendar} label="تاريخ الميلاد"           value={app.date_of_birth ? new Date(app.date_of_birth).toLocaleDateString("ar-IQ") : null} />
            <InfoRow icon={User}     label="الجنس"                   value={GENDER_LABEL[app.gender ?? ""] ?? app.gender} />
            <InfoRow icon={Globe}    label="الجنسية"                 value={app.nationality} />
            <InfoRow icon={Shield}   label="رقم الهوية الوطنية / البطاقة الموحدة" value={app.national_id} />
          </Section>

          {/* ② Contact */}
          <Section icon={Phone} title="معلومات التواصل والسكن">
            <InfoRow icon={Mail}   label="البريد الإلكتروني" value={app.email} />
            <InfoRow icon={Phone}  label="الهاتف الرئيسي"   value={app.phone_primary} />
            <InfoRow icon={Phone}  label="الهاتف البديل"     value={app.phone_secondary} />
            <InfoRow icon={MapPin} label="المحافظة"           value={app.governorate} />
            <InfoRow icon={MapPin} label="المدينة / القضاء"  value={app.city} />
            <InfoRow icon={MapPin} label="العنوان التفصيلي"  value={app.address_detail} />
          </Section>

          {/* ③ Education & Work */}
          <Section icon={GraduationCap} title="المؤهلات العلمية والمهنية">
            <InfoRow icon={GraduationCap} label="المؤهل العلمي"      value={EDU_LABEL[app.education_level] ?? app.education_level} />
            <InfoRow icon={GraduationCap} label="التخصص الدراسي"     value={app.education_field} />
            <InfoRow icon={GraduationCap} label="المؤسسة التعليمية"  value={app.institution} />
            <InfoRow icon={Calendar}      label="سنة التخرج"          value={app.graduation_year} />
            <InfoRow icon={Briefcase}     label="جهة العمل الحالية"  value={app.current_employer} />
            <InfoRow icon={Briefcase}     label="المنصب الوظيفي"     value={app.current_position} />
            <InfoRow icon={Star}          label="سنوات الخبرة"       value={app.years_of_experience ? `${app.years_of_experience} سنوات` : null} />
            <TagList label="المهارات"             items={app.skills} />
            <TagList label="اللغات"              items={app.languages} />
            <TagList label="مجالات الاهتمام"     items={app.areas_of_interest} />
            {app.expertise_description && (
              <div className="py-2.5">
                <p className="text-[10px] font-medium text-muted-foreground mb-1">وصف الخبرة</p>
                <p className="text-sm text-foreground leading-relaxed bg-background/50 p-2.5 rounded-xl border border-border/40">
                  {app.expertise_description}
                </p>
              </div>
            )}
          </Section>

          {/* ④ Availability */}
          <Section icon={Calendar} title="التفرغ والمشاركة">
            <InfoRow icon={Calendar} label="أيام التفرغ أسبوعياً"  value={app.available_days_per_week ? `${app.available_days_per_week} أيام` : null} />
            <InfoRow icon={Calendar} label="ساعات التفرغ يومياً"   value={app.available_hours_per_day ? `${app.available_hours_per_day} ساعات` : null} />
            <InfoRow icon={Globe}    label="قنوات التعرف على المؤسسة"  value={app.how_heard_about_us} />
            <InfoRow icon={FileText} label="تجربة تطوع سابقة"      value={app.previous_volunteering} />
          </Section>

          {/* ⑤ Motivation */}
          {app.motivation_statement && (
            <section className="space-y-2">
              <p className="font-bold text-sm flex items-center gap-2">
                <span className="w-6 h-6 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Heart size={13} className="text-primary" />
                </span>
                بيان الدوافع والأهداف
              </p>
              <div className="bg-muted/30 rounded-2xl p-4 border border-border/50">
                <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">{app.motivation_statement}</p>
              </div>
            </section>
          )}

          {/* ⑥ References */}
          {(app.reference_1_name || app.reference_2_name) && (
            <Section icon={Users} title="المراجع والتزكية">
              {app.reference_1_name && (
                <div className="py-2 border-b border-border/50">
                  <p className="text-[10px] font-bold text-primary mb-1">المرجع الأول</p>
                  <InfoRow icon={User}  label="الاسم"         value={app.reference_1_name} />
                  <InfoRow icon={Phone} label="الهاتف"        value={app.reference_1_phone} />
                  <InfoRow icon={Users} label="صلة القرابة / العلاقة"  value={app.reference_1_relation} />
                </div>
              )}
              {app.reference_2_name && (
                <div className="py-2">
                  <p className="text-[10px] font-bold text-primary mb-1">المرجع الثاني</p>
                  <InfoRow icon={User}  label="الاسم"         value={app.reference_2_name} />
                  <InfoRow icon={Phone} label="الهاتف"        value={app.reference_2_phone} />
                  <InfoRow icon={Users} label="صلة القرابة / العلاقة"  value={app.reference_2_relation} />
                </div>
              )}
            </Section>
          )}

          {/* ⑦ Emergency Contact */}
          {app.emergency_contact_name && (
            <Section icon={AlertCircle} title="جهة الاتصال في الطوارئ">
              <InfoRow icon={User}  label="الاسم"         value={app.emergency_contact_name} />
              <InfoRow icon={Phone} label="الهاتف"        value={app.emergency_contact_phone} />
              <InfoRow icon={Users} label="صلة القرابة"  value={app.emergency_contact_relation} />
            </Section>
          )}

          {/* ⑧ Agreements */}
          <Section icon={Shield} title="الإقرارات والتوقيع">
            <div className="py-2 flex items-center gap-3 border-b border-border/50">
              <span className={`w-4 h-4 rounded flex items-center justify-center text-[10px] ${app.agrees_to_terms ? "bg-emerald-500 text-white" : "bg-muted border border-border"}`}>
                {app.agrees_to_terms ? "✓" : ""}
              </span>
              <span className="text-xs">موافق على الشروط والأحكام واللوائح الداخلية</span>
            </div>
            <div className="py-2 flex items-center gap-3 border-b border-border/50">
              <span className={`w-4 h-4 rounded flex items-center justify-center text-[10px] ${app.agrees_to_code_of_conduct ? "bg-emerald-500 text-white" : "bg-muted border border-border"}`}>
                {app.agrees_to_code_of_conduct ? "✓" : ""}
              </span>
              <span className="text-xs">موافق على ميثاق السلوك المهني والأخلاقي</span>
            </div>
            <InfoRow icon={Calendar} label="تاريخ التوقيع" value={app.signature_date ? new Date(app.signature_date).toLocaleDateString("ar-IQ") : null} />
          </Section>

          {/* ⑨ Reviewer Notes */}
          <section className="space-y-2">
            <p className="font-bold text-sm flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-muted flex items-center justify-center">
                <MessageSquare size={13} className="text-muted-foreground" />
              </span>
              ملاحظات وتوصيات المراجع
            </p>
            <textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="أضف ملاحظات المراجعة الداخلية..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-background text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary"
            />
            {app.reviewed_at && (
              <p className="text-[10px] text-muted-foreground">آخر مراجعة: {new Date(app.reviewed_at).toLocaleDateString("ar-IQ")}</p>
            )}
          </section>

          {/* ⑩ Status Actions */}
          <section className="space-y-3 pt-2">
            <p className="font-bold text-sm">تحديث حالة الطلب</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {(["approved", "under_review", "waitlisted", "rejected", "pending"] as MembershipStatus[]).map((s) => {
                const c = STATUS_CFG[s];
                const isActive = app.status === s;
                return (
                  <button
                    key={s}
                    type="button"
                    onClick={() => updateStatus(s)}
                    disabled={saving || isActive}
                    className={`flex items-center justify-center gap-1.5 py-2.5 px-2 rounded-xl text-xs font-bold transition-all disabled:opacity-40 shadow-xs ${
                      isActive
                        ? "ring-2 ring-primary ring-offset-1 bg-primary text-primary-foreground"
                        : "border border-border hover:bg-muted text-foreground"
                    }`}
                  >
                    <span>{c.label}</span>
                  </button>
                );
              })}
            </div>
            {saving && <p className="text-xs text-center text-muted-foreground animate-pulse">جاري الحفظ وتحديث السجلات...</p>}
          </section>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ── Export Modal (Date range + Batch Print + Excel) ─────────────────────

function ExportModal({
  apps,
  onClose,
}: {
  apps: MembershipApplicationRow[];
  onClose: () => void;
}): React.ReactElement {
  const [from, setFrom] = useState("");
  const [to, setTo]     = useState(new Date().toISOString().split("T")[0]);
  const [fmt, setFmt]   = useState<"excel" | "pdf">("excel");
  const [status, setStatus] = useState<MembershipStatus | "all">("all");
  const [exporting, setExporting] = useState(false);

  const filtered = apps.filter((a) => {
    const date = new Date(a.created_at);
    if (from && date < new Date(from)) return false;
    if (to   && date > new Date(to + "T23:59:59")) return false;
    if (status !== "all" && a.status !== status) return false;
    return true;
  });

  async function doExport(): Promise<void> {
    if (filtered.length === 0) return;
    setExporting(true);

    try {
      const label = from && to ? `_${from}_${to}` : "";
      if (fmt === "excel") {
        exportExecutiveExcel(filtered, label);
      } else {
        // Unified batch official print without popup blocker issues
        await printBatchOfficialApplications(filtered);
      }
      onClose();
    } finally {
      setExporting(false);
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4"
      dir="rtl"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-card rounded-3xl border border-border w-full max-w-md p-6 shadow-2xl space-y-4"
      >
        <div className="flex items-center justify-between border-b border-border pb-3">
          <h2 className="font-display font-bold text-lg flex items-center gap-2">
            <Download size={18} className="text-primary" /> تصدير طلبات العضوية
          </h2>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-muted text-muted-foreground">
            <X size={16} />
          </button>
        </div>

        <div className="space-y-3">
          {/* Date range */}
          <div>
            <label className="text-xs font-semibold text-muted-foreground mb-1 block flex items-center gap-1">
              <Filter size={12} /> الفترة الزمنية
            </label>
            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <p className="text-[10px] text-muted-foreground mb-1">من تاريخ</p>
                <input
                  type="date"
                  value={from}
                  onChange={(e) => setFrom(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-border bg-background text-xs focus:outline-none focus:ring-2 focus:ring-primary"
                  dir="ltr"
                />
              </div>
              <div>
                <p className="text-[10px] text-muted-foreground mb-1">إلى تاريخ</p>
                <input
                  type="date"
                  value={to}
                  onChange={(e) => setTo(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-border bg-background text-xs focus:outline-none focus:ring-2 focus:ring-primary"
                  dir="ltr"
                />
              </div>
            </div>
          </div>

          {/* Status filter */}
          <div>
            <label className="text-xs font-semibold text-muted-foreground mb-1 block">تصفية حسب الحالة</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as MembershipStatus | "all")}
              className="w-full px-3 py-2 rounded-xl border border-border bg-background text-xs focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="all">جميع الحالات</option>
              {Object.entries(STATUS_CFG).map(([k, v]) => (
                <option key={k} value={k}>{v.label}</option>
              ))}
            </select>
          </div>

          {/* Format */}
          <div>
            <label className="text-xs font-semibold text-muted-foreground mb-1 block">صيغة التصدير</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setFmt("excel")}
                className={`py-2.5 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                  fmt === "excel" ? "bg-primary text-primary-foreground border-primary" : "border-border hover:bg-muted"
                }`}
              >
                <FileText size={14} /> جدول Excel ذكي (ورقتين)
              </button>
              <button
                type="button"
                onClick={() => setFmt("pdf")}
                className={`py-2.5 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                  fmt === "pdf" ? "bg-primary text-primary-foreground border-primary" : "border-border hover:bg-muted"
                }`}
              >
                <Printer size={14} /> ملف PDF مجمع معتمد
              </button>
            </div>
          </div>

          {/* Preview count */}
          <div className={`rounded-2xl p-3 text-center text-xs font-bold ${
            filtered.length > 0 ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
          }`}>
            {filtered.length > 0 ? `سيتم تصدير ${filtered.length} طلب رسمياً` : "لا توجد طلبات مطابقة للمعايير المحددة"}
          </div>

          {/* Actions */}
          <div className="flex gap-2.5 pt-2">
            <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-border text-xs font-medium hover:bg-muted">
              إلغاء
            </button>
            <button
              onClick={doExport}
              disabled={filtered.length === 0 || exporting}
              className="flex-1 py-2.5 rounded-xl bg-primary text-primary-foreground text-xs font-bold disabled:opacity-50 flex items-center justify-center gap-1.5"
            >
              <Download size={14} /> {exporting ? "جاري التصدير..." : "بدء التصدير"}
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ── Main Page ────────────────────────────────────────────────────────────

export default function AdminMembershipsPage(): React.ReactElement {
  const [apps, setApps]                 = useState<MembershipApplicationRow[]>([]);
  const [loading, setLoading]           = useState(true);
  const [search, setSearch]             = useState("");
  const [statusFilter, setStatusFilter] = useState<MembershipStatus | "all">("all");
  const [typeFilter, setTypeFilter]     = useState<MembershipType | "all">("all");
  const [selected, setSelected]         = useState<MembershipApplicationRow | null>(null);
  const [showExport, setShowExport]     = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<MembershipApplicationRow | null>(null);
  const [promoteTarget, setPromoteTarget] = useState<TeamMemberRow | null>(null);

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
      status, reviewer_notes: notes, reviewed_at: new Date().toISOString(),
    }).eq("id", id);
    void load();
    setSelected((prev) => prev?.id === id ? { ...prev, status, reviewer_notes: notes ?? null } : prev);
  }

  function handleApplicationDeleted(deletedId: string) {
    setApps((prev) => prev.filter((a) => a.id !== deletedId));
    if (selected?.id === deletedId) setSelected(null);
  }

  async function handlePromoteInitiation(app: MembershipApplicationRow) {
    // Locate or build member row
    const { data: member } = await supabase
      .from("team_members")
      .select("*")
      .eq("membership_application_id", app.id)
      .maybeSingle();

    if (member) {
      setPromoteTarget(member as TeamMemberRow);
    } else {
      // Create a temporary representation to promote
      setPromoteTarget({
        id: app.id,
        created_at: app.created_at,
        updated_at: app.updated_at,
        full_name_ar: app.full_name_ar,
        full_name_en: app.full_name_en,
        role: "member",
        title_ar: "عضو معتمد",
        title_en: "Approved Member",
        bio_ar: app.motivation_statement,
        bio_en: null,
        avatar_path: null,
        email: app.email,
        linkedin_url: null,
        display_order: 0,
        is_active: true,
        membership_application_id: app.id,
      });
    }
  }

  const filtered = apps.filter((a) => {
    if (statusFilter !== "all" && a.status !== statusFilter) return false;
    if (typeFilter  !== "all" && a.membership_type !== typeFilter) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      return a.full_name_ar.toLowerCase().includes(q) ||
             a.full_name_en.toLowerCase().includes(q) ||
             a.email.toLowerCase().includes(q) ||
             (a.application_number ?? "").toLowerCase().includes(q) ||
             a.governorate.toLowerCase().includes(q) ||
             a.city.toLowerCase().includes(q);
    }
    return true;
  });

  // Summary counts
  const counts = Object.fromEntries(
    (Object.keys(STATUS_CFG) as MembershipStatus[]).map((s) => [s, apps.filter((a) => a.status === s).length])
  );

  const thCls = "px-4 py-3 text-start text-xs font-bold text-muted-foreground uppercase tracking-wide";
  const tdCls = "px-4 py-3 text-sm";

  return (
    <div dir="rtl" className="space-y-5">
      {/* Modals */}
      <AnimatePresence>
        {selected && (
          <DetailPanel
            app={selected}
            onClose={() => setSelected(null)}
            onStatusChange={handleStatusChange}
            onDeleteRequest={(app) => setDeleteTarget(app)}
            onPromoteRequest={(app) => void handlePromoteInitiation(app)}
          />
        )}
        {showExport && (
          <ExportModal apps={apps} onClose={() => setShowExport(false)} />
        )}
        {deleteTarget && (
          <DeleteApplicationModal
            app={deleteTarget}
            onClose={() => setDeleteTarget(null)}
            onDeleted={handleApplicationDeleted}
          />
        )}
        {promoteTarget && (
          <PromoteMemberModal
            member={promoteTarget}
            onClose={() => setPromoteTarget(null)}
            onSuccess={() => void load()}
          />
        )}
      </AnimatePresence>

      {/* Page Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="font-display text-xl sm:text-2xl font-black text-foreground">طلبات العضوية والانتساب</h1>
          <p className="text-muted-foreground text-xs sm:text-sm mt-0.5">
            {apps.length} طلب إجمالي · <span className="text-amber-600 dark:text-amber-400 font-bold">{counts.pending ?? 0} بانتظار المراجعة</span>
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={load}
            className="p-2.5 rounded-xl border border-border hover:bg-muted text-muted-foreground transition-colors"
            title="تحديث البيانات"
          >
            <RefreshCw size={16} />
          </button>

          <button
            onClick={() => setShowExport(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-primary-foreground text-xs sm:text-sm font-bold hover:bg-primary-dark transition-all shadow-sm"
          >
            <Download size={15} /> تصدير السجلات
          </button>
        </div>
      </div>

      {/* Status Summary Pills (Scrollable horizontally on mobile) */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1.5 no-scrollbar">
        {(Object.entries(STATUS_CFG) as [MembershipStatus, typeof STATUS_CFG[MembershipStatus]][]).map(([k, v]) => (
          <button
            key={k}
            onClick={() => setStatusFilter(statusFilter === k ? "all" : k)}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border transition-all shrink-0 ${
              statusFilter === k
                ? v.cls + " border-current shadow-xs"
                : "border-border text-muted-foreground hover:border-primary/50"
            }`}
          >
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: v.color }} />
            <span>{v.label}</span>
            <span className="opacity-75 font-mono text-[10px]">({counts[k] ?? 0})</span>
          </button>
        ))}

        {statusFilter !== "all" && (
          <button
            onClick={() => setStatusFilter("all")}
            className="px-3 py-1.5 rounded-full text-xs border border-border text-muted-foreground hover:text-destructive flex items-center gap-1 shrink-0"
          >
            <X size={12} /> إلغاء التصفية
          </button>
        )}
      </div>

      {/* Filters & Search Row */}
      <div className="flex flex-col sm:flex-row gap-2.5 items-stretch sm:items-center">
        <div className="relative flex-1">
          <Search size={14} className="absolute top-1/2 -translate-y-1/2 start-3 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="بحث بالاسم، البريد، رقم الطلب، المحافظة..."
            className="w-full ps-9 pe-4 py-2 rounded-xl border border-border bg-card text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-primary shadow-2xs"
          />
          {search && (
            <button onClick={() => setSearch("")} className="absolute top-1/2 -translate-y-1/2 end-3 text-muted-foreground hover:text-foreground">
              <X size={13} />
            </button>
          )}
        </div>

        <div className="flex items-center gap-2">
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value as MembershipType | "all")}
            className="flex-1 sm:flex-initial px-3 py-2 rounded-xl border border-border bg-card text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-primary font-medium"
          >
            <option value="all">جميع أنواع العضوية</option>
            {Object.entries(TYPE_LABEL).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>

          <span className="text-xs text-muted-foreground font-bold px-2 whitespace-nowrap">
            {filtered.length} نتيجة
          </span>
        </div>
      </div>

      {/* ── Mobile View: Responsive Smart Cards (< 768px) ───────────────── */}
      <div className="block md:hidden space-y-3">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-32 shimmer rounded-2xl border border-border/50" />
          ))
        ) : filtered.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground text-sm bg-card rounded-2xl border border-border">
            <FileText size={32} className="mx-auto mb-2 opacity-30" />
            لا توجد طلبات مطابقة للبحث
          </div>
        ) : (
          filtered.map((a) => {
            const cfg = STATUS_CFG[a.status] ?? { label: a.status, cls: "bg-muted text-muted-foreground" };
            return (
              <div
                key={a.id}
                className="p-4 rounded-2xl border border-border bg-card shadow-xs space-y-3 relative hover:border-primary/40 transition-all"
              >
                {/* Header: Name + Badge */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary font-display font-bold text-sm flex items-center justify-center shrink-0">
                      {a.full_name_ar.charAt(0)}
                    </div>
                    <div className="min-w-0">
                      <p className="font-bold text-sm text-foreground truncate">{a.full_name_ar}</p>
                      <p className="text-[11px] text-muted-foreground font-mono" dir="ltr">
                        {a.application_number ?? "—"}
                      </p>
                    </div>
                  </div>

                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10.5px] font-bold shrink-0 ${cfg.cls}`}>
                    {cfg.label}
                  </span>
                </div>

                {/* Key Meta Chips */}
                <div className="flex flex-wrap gap-1.5 text-[11px] text-muted-foreground">
                  <span className="px-2 py-0.5 rounded-lg bg-muted/60 border border-border/40">
                    📍 {a.governorate}
                  </span>
                  <span className="px-2 py-0.5 rounded-lg bg-muted/60 border border-border/40">
                    🎓 {EDU_LABEL[a.education_level] ?? a.education_level}
                  </span>
                  <span className="px-2 py-0.5 rounded-lg bg-primary/10 text-primary font-semibold">
                    {TYPE_LABEL[a.membership_type]}
                  </span>
                </div>

                {/* Quick Action Footer */}
                <div className="flex items-center justify-between pt-2 border-t border-border/50 text-xs">
                  <div className="flex items-center gap-3">
                    <a
                      href={`tel:${a.phone_primary}`}
                      onClick={(e) => e.stopPropagation()}
                      className="text-primary hover:underline flex items-center gap-1 font-bold text-xs"
                    >
                      <Phone size={12} /> {a.phone_primary}
                    </a>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => setDeleteTarget(a)}
                      className="p-1.5 rounded-lg text-destructive hover:bg-destructive/10 transition-colors"
                      title="حذف الطلب"
                    >
                      <Trash2 size={15} />
                    </button>

                    <button
                      onClick={() => setSelected(a)}
                      className="px-3 py-1.5 rounded-xl bg-primary/10 hover:bg-primary/20 text-primary font-bold text-xs flex items-center gap-1 transition-colors"
                    >
                      <span>مراجعة الطلب</span>
                      <ChevronRight size={13} className="rtl:rotate-180" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* ── Desktop View: Data Table (≥ 768px) ─────────────────────────── */}
      <div className="hidden md:block rounded-2xl border border-border bg-card overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="border-b border-border bg-muted/40">
              <tr>
                <th className={thCls}>رقم الطلب</th>
                <th className={thCls}>المتقدم بالطلب</th>
                <th className={thCls}>المحافظة والمدينة</th>
                <th className={thCls}>نوع العضوية</th>
                <th className={thCls}>المؤهل الدراسي</th>
                <th className={thCls}>الحالة</th>
                <th className={thCls}>تاريخ التقديم</th>
                <th className={`${thCls} text-center`}>الإجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}><td colSpan={8} className="p-4"><div className="h-8 shimmer rounded-lg" /></td></tr>
                ))
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-16 text-muted-foreground text-sm">
                    <FileText size={32} className="mx-auto mb-3 opacity-20" />
                    لا توجد طلبات مطابقة للبحث
                  </td>
                </tr>
              ) : (
                filtered.map((a) => {
                  const cfg = STATUS_CFG[a.status] ?? { label: a.status, cls: "bg-muted text-muted-foreground" };
                  return (
                    <tr
                      key={a.id}
                      className="hover:bg-muted/30 transition-colors cursor-pointer group"
                      onClick={() => setSelected(a)}
                    >
                      <td className={`${tdCls} font-mono text-xs font-bold text-muted-foreground`} dir="ltr">
                        {a.application_number ?? "—"}
                      </td>
                      <td className={tdCls}>
                        <p className="font-bold text-foreground group-hover:text-primary transition-colors">{a.full_name_ar}</p>
                        <p className="text-xs text-muted-foreground">{a.email}</p>
                      </td>
                      <td className={tdCls}>
                        <p className="text-xs font-semibold">{a.governorate}</p>
                        <p className="text-[11px] text-muted-foreground">{a.city}</p>
                      </td>
                      <td className={tdCls}>
                        <span className="text-xs font-semibold text-primary/90 bg-primary/5 px-2 py-0.5 rounded-md">
                          {TYPE_LABEL[a.membership_type]}
                        </span>
                      </td>
                      <td className={tdCls}>
                        <p className="text-xs font-medium">{EDU_LABEL[a.education_level] ?? a.education_level}</p>
                        {a.education_field && <p className="text-[10.5px] text-muted-foreground truncate max-w-[120px]">{a.education_field}</p>}
                      </td>
                      <td className={tdCls}>
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold ${cfg.cls}`}>
                          {cfg.label}
                        </span>
                      </td>
                      <td className={`${tdCls} text-xs text-muted-foreground`}>
                        {new Date(a.created_at).toLocaleDateString("ar-IQ")}
                      </td>
                      <td className={`${tdCls} text-center`} onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => printOfficialApplication(a)}
                            title="طباعة الاستمارة الرسمية"
                            className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-primary transition-colors"
                          >
                            <Printer size={15} />
                          </button>
                          <button
                            onClick={() => setDeleteTarget(a)}
                            title="حذف الطلب"
                            className="p-1.5 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                          >
                            <Trash2 size={15} />
                          </button>
                          <button
                            onClick={() => setSelected(a)}
                            title="عرض التفاصيل"
                            className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                          >
                            <ChevronRight size={16} className="rtl:rotate-180" />
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
