/**
 * AdminMembershipsPage.tsx
 * ─────────────────────────────────────────────────────────────────────
 * Professional membership applications management — Enhanced Edition.
 *
 * Features:
 *  • Full detail panel showing ALL 47 DB fields in organized sections
 *  • Single-application PDF export (official letterhead with logo)
 *  • Bulk CSV export with all fields + date range filter
 *  • Bulk PDF export for date-range selection
 *  • Status management with reviewer notes
 */

import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search, Download, X, CheckCircle, Clock, XCircle,
  ChevronRight, Eye, MessageSquare, RefreshCw, PauseCircle,
  User, Mail, Phone, MapPin, GraduationCap, Calendar,
  FileText, Users, Star, Heart, Briefcase, Globe,
  AlertCircle, Shield, Printer, Filter,
} from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import type { MembershipApplicationRow, MembershipStatus, MembershipType } from "@/types/database.types";
import * as XLSX from "xlsx";

// ── Labels & Config ────────────────────────────────────────────────────
const STATUS_CFG: Record<MembershipStatus, { label: string; cls: string; icon: React.ElementType; color: string }> = {
  pending:      { label: "قيد الانتظار",  cls: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",    icon: Clock,       color: "#d97706" },
  under_review: { label: "تحت المراجعة", cls: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",         icon: Eye,         color: "#2563eb" },
  approved:     { label: "مقبول",         cls: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400", icon: CheckCircle, color: "#059669" },
  rejected:     { label: "مرفوض",         cls: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",             icon: XCircle,     color: "#dc2626" },
  waitlisted:   { label: "قائمة انتظار", cls: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400",         icon: PauseCircle, color: "#64748b" },
};

const TYPE_LABEL: Record<MembershipType, string> = {
  regular: "عضوية عادية", founding: "عضوية مؤسس", honorary: "عضوية فخرية", student: "عضوية طلابية",
};

const EDU_LABEL: Record<string, string> = {
  high_school: "الثانوية العامة", diploma: "دبلوم", bachelor: "بكالوريوس",
  master: "ماجستير", phd: "دكتوراه", other: "أخرى",
};

const GENDER_LABEL: Record<string, string> = { male: "ذكر", female: "أنثى" };

// ── PDF Export (single application — print-optimized HTML) ─────────────
function printApplication(app: MembershipApplicationRow): void {
  const logoUrl = `${window.location.origin}/logo.png`;
  const statusCfg = STATUS_CFG[app.status];

  const field = (label: string, value: string | null | undefined): string =>
    value ? `<tr><td class="lbl">${label}</td><td class="val">${value}</td></tr>` : "";

  const html = `<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
  <meta charset="UTF-8" />
  <title>طلب عضوية — ${app.full_name_ar}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;900&display=swap');
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Cairo', 'Segoe UI', Arial, sans-serif; font-size: 11pt; color: #1e293b; background: #fff; direction: rtl; }
    .page { max-width: 210mm; margin: 0 auto; padding: 16mm 18mm; }

    /* Header */
    .header { display: flex; align-items: center; justify-content: space-between; border-bottom: 3px solid #16a34a; padding-bottom: 12px; margin-bottom: 18px; }
    .header-logo { display: flex; align-items: center; gap: 10px; }
    .header-logo img { width: 56px; height: 56px; object-fit: contain; }
    .header-title h1 { font-size: 15pt; font-weight: 900; color: #15803d; }
    .header-title p  { font-size: 8.5pt; color: #475569; }
    .header-meta { text-align: left; }
    .header-meta .app-no { font-size: 10pt; font-weight: 700; color: #0f172a; direction: ltr; }
    .header-meta .date   { font-size: 8.5pt; color: #64748b; }

    /* Status badge */
    .status-bar { display: flex; align-items: center; justify-content: space-between; background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 8px 14px; margin-bottom: 18px; }
    .status-bar .type { font-size: 10pt; font-weight: 700; }
    .status-badge { padding: 4px 14px; border-radius: 20px; font-size: 9.5pt; font-weight: 700; background: ${statusCfg.color}22; color: ${statusCfg.color}; border: 1px solid ${statusCfg.color}44; }

    /* Sections */
    .section { margin-bottom: 16px; page-break-inside: avoid; }
    .section-title { font-size: 11pt; font-weight: 700; color: #15803d; border-right: 4px solid #16a34a; padding-right: 8px; margin-bottom: 8px; background: #f0fdf4; padding: 5px 10px; border-radius: 4px; }
    table.info { width: 100%; border-collapse: collapse; }
    table.info td.lbl { width: 38%; color: #475569; font-size: 9.5pt; padding: 4px 6px; border-bottom: 1px solid #f1f5f9; font-weight: 600; }
    table.info td.val { font-size: 9.5pt; padding: 4px 6px; border-bottom: 1px solid #f1f5f9; font-weight: 400; }
    .tag { display: inline-block; background: #dcfce7; color: #15803d; border: 1px solid #bbf7d0; border-radius: 12px; padding: 2px 9px; font-size: 9pt; margin: 2px; }
    .motivation { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 10px 12px; font-size: 9.5pt; line-height: 1.8; color: #334155; }

    /* References grid */
    .ref-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-top: 6px; }
    .ref-card { border: 1px solid #e2e8f0; border-radius: 8px; padding: 10px; background: #f8fafc; }
    .ref-card .ref-title { font-size: 9pt; font-weight: 700; color: #16a34a; margin-bottom: 5px; }

    /* Signature section */
    .signature-bar { display: flex; justify-content: space-between; margin-top: 20px; padding-top: 14px; border-top: 2px dashed #cbd5e1; }
    .sig-box { text-align: center; }
    .sig-box .sig-line { width: 120px; border-bottom: 1px solid #334155; margin: 30px auto 4px; }
    .sig-box p { font-size: 8.5pt; color: #64748b; }

    /* Footer */
    .footer { margin-top: 20px; text-align: center; font-size: 8pt; color: #94a3b8; border-top: 1px solid #e2e8f0; padding-top: 8px; }

    .checkbox-row { display: flex; align-items: center; gap: 6px; margin-bottom: 4px; font-size: 9.5pt; }
    .checkbox { width: 12px; height: 12px; border: 1.5px solid #16a34a; border-radius: 3px; display: inline-flex; align-items: center; justify-content: center; }
    .checkbox.checked::after { content: "✓"; font-size: 9pt; color: #16a34a; }

    @media print {
      body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      .page { padding: 8mm 12mm; }
    }
  </style>
</head>
<body>
<div class="page">

  <!-- Header -->
  <div class="header">
    <div class="header-logo">
      <img src="${logoUrl}" alt="الشعار" onerror="this.style.display='none'" />
      <div class="header-title">
        <h1>مؤسسة نهر ديالى</h1>
        <p>Diyala River Foundation — النهر الذي يحيي العراق</p>
      </div>
    </div>
    <div class="header-meta">
      <div class="app-no">${app.application_number ?? "—"}</div>
      <div class="date">تاريخ التقديم: ${new Date(app.created_at).toLocaleDateString("ar-IQ", { year: "numeric", month: "long", day: "numeric" })}</div>
    </div>
  </div>

  <!-- Status bar -->
  <div class="status-bar">
    <span class="type">نوع العضوية: <strong>${TYPE_LABEL[app.membership_type] ?? app.membership_type}</strong></span>
    <span class="status-badge">${statusCfg.label}</span>
  </div>

  <!-- Personal Information -->
  <div class="section">
    <div class="section-title">أولاً: المعلومات الشخصية</div>
    <table class="info">
      ${field("الاسم الكامل بالعربية", app.full_name_ar)}
      ${field("الاسم الكامل بالإنجليزية", app.full_name_en)}
      ${field("تاريخ الميلاد", app.date_of_birth ? new Date(app.date_of_birth).toLocaleDateString("ar-IQ") : null)}
      ${field("الجنس", GENDER_LABEL[app.gender ?? ""] ?? app.gender)}
      ${field("الجنسية", app.nationality)}
      ${field("رقم الهوية الوطنية", app.national_id)}
    </table>
  </div>

  <!-- Contact Information -->
  <div class="section">
    <div class="section-title">ثانياً: معلومات التواصل</div>
    <table class="info">
      ${field("البريد الإلكتروني", app.email)}
      ${field("الهاتف الرئيسي", app.phone_primary)}
      ${field("الهاتف البديل", app.phone_secondary)}
      ${field("المحافظة", app.governorate)}
      ${field("المدينة / القضاء", app.city)}
      ${field("العنوان التفصيلي", app.address_detail)}
    </table>
  </div>

  <!-- Education & Work -->
  <div class="section">
    <div class="section-title">ثالثاً: المؤهلات العلمية والمهنية</div>
    <table class="info">
      ${field("المؤهل العلمي", EDU_LABEL[app.education_level] ?? app.education_level)}
      ${field("التخصص الدراسي", app.education_field)}
      ${field("المؤسسة التعليمية", app.institution)}
      ${field("سنة التخرج", app.graduation_year?.toString())}
      ${field("جهة العمل الحالية", app.current_employer)}
      ${field("المنصب الوظيفي", app.current_position)}
      ${field("سنوات الخبرة", app.years_of_experience ? `${app.years_of_experience} سنوات` : null)}
    </table>
    ${app.skills?.length ? `<p style="margin-top:6px;font-size:9pt;color:#475569;font-weight:600;">المهارات:</p><div style="margin-top:4px">${app.skills.map((s) => `<span class="tag">${s}</span>`).join("")}</div>` : ""}
    ${app.languages?.length ? `<p style="margin-top:8px;font-size:9pt;color:#475569;font-weight:600;">اللغات:</p><div style="margin-top:4px">${app.languages.map((l) => `<span class="tag">${l}</span>`).join("")}</div>` : ""}
    ${app.areas_of_interest?.length ? `<p style="margin-top:8px;font-size:9pt;color:#475569;font-weight:600;">مجالات الاهتمام:</p><div style="margin-top:4px">${app.areas_of_interest.map((a) => `<span class="tag">${a}</span>`).join("")}</div>` : ""}
    ${app.expertise_description ? `<p style="margin-top:8px;font-size:9pt;color:#475569;font-weight:600;">وصف الخبرة:</p><div class="motivation" style="margin-top:4px">${app.expertise_description}</div>` : ""}
  </div>

  <!-- Availability -->
  ${(app.available_days_per_week || app.available_hours_per_day) ? `
  <div class="section">
    <div class="section-title">رابعاً: التفرغ والمشاركة</div>
    <table class="info">
      ${field("أيام التفرغ أسبوعياً", app.available_days_per_week ? `${app.available_days_per_week} أيام` : null)}
      ${field("ساعات التفرغ يومياً", app.available_hours_per_day ? `${app.available_hours_per_day} ساعات` : null)}
      ${field("كيف عرفت عن المؤسسة", app.how_heard_about_us)}
      ${field("تجربة تطوع سابقة", app.previous_volunteering)}
    </table>
  </div>` : ""}

  <!-- Motivation -->
  ${app.motivation_statement ? `
  <div class="section">
    <div class="section-title">خامساً: بيان الدوافع والأهداف</div>
    <div class="motivation">${app.motivation_statement}</div>
  </div>` : ""}

  <!-- References -->
  ${(app.reference_1_name || app.reference_2_name) ? `
  <div class="section">
    <div class="section-title">سادساً: المراجع</div>
    <div class="ref-grid">
      ${app.reference_1_name ? `
      <div class="ref-card">
        <div class="ref-title">المرجع الأول</div>
        <table class="info">
          ${field("الاسم", app.reference_1_name)}
          ${field("الهاتف", app.reference_1_phone)}
          ${field("صلة القرابة", app.reference_1_relation)}
        </table>
      </div>` : ""}
      ${app.reference_2_name ? `
      <div class="ref-card">
        <div class="ref-title">المرجع الثاني</div>
        <table class="info">
          ${field("الاسم", app.reference_2_name)}
          ${field("الهاتف", app.reference_2_phone)}
          ${field("صلة القرابة", app.reference_2_relation)}
        </table>
      </div>` : ""}
    </div>
  </div>` : ""}

  <!-- Emergency Contact -->
  ${app.emergency_contact_name ? `
  <div class="section">
    <div class="section-title">سابعاً: جهة الاتصال في حالات الطوارئ</div>
    <table class="info">
      ${field("الاسم", app.emergency_contact_name)}
      ${field("الهاتف", app.emergency_contact_phone)}
      ${field("صلة القرابة", app.emergency_contact_relation)}
    </table>
  </div>` : ""}

  <!-- Agreements -->
  <div class="section">
    <div class="section-title">ثامناً: الإقرارات والتوقيع</div>
    <div class="checkbox-row">
      <span class="checkbox ${app.agrees_to_terms ? "checked" : ""}"></span>
      <span>أوافق على الشروط والأحكام واللوائح الداخلية للمؤسسة</span>
    </div>
    <div class="checkbox-row">
      <span class="checkbox ${app.agrees_to_code_of_conduct ? "checked" : ""}"></span>
      <span>أوافق على ميثاق السلوك المهني والأخلاقي للمؤسسة</span>
    </div>
    ${app.signature_date ? `<p style="margin-top:6px;font-size:9pt;color:#475569;">تاريخ التوقيع: <strong>${new Date(app.signature_date).toLocaleDateString("ar-IQ")}</strong></p>` : ""}
  </div>

  ${app.reviewer_notes ? `
  <div class="section">
    <div class="section-title">ملاحظات المراجع</div>
    <div class="motivation">${app.reviewer_notes}</div>
    ${app.reviewed_at ? `<p style="margin-top:6px;font-size:8.5pt;color:#64748b;">تاريخ المراجعة: ${new Date(app.reviewed_at).toLocaleDateString("ar-IQ")}</p>` : ""}
  </div>` : ""}

  <!-- Signature bars -->
  <div class="signature-bar">
    <div class="sig-box">
      <div class="sig-line"></div>
      <p>توقيع المتقدم / المتقدمة</p>
    </div>
    <div class="sig-box">
      <div class="sig-line"></div>
      <p>مسؤول قبول الطلبات</p>
    </div>
    <div class="sig-box">
      <div class="sig-line"></div>
      <p>مدير المؤسسة</p>
    </div>
  </div>

  <!-- Footer -->
  <div class="footer">
    مؤسسة نهر ديالى — جمهورية العراق | info@diyalariver.org | وثيقة رسمية — صادرة من نظام إدارة العضويات
    <br/>تاريخ الطباعة: ${new Date().toLocaleDateString("ar-IQ", { year: "numeric", month: "long", day: "numeric" })}
  </div>
</div>
</body>
</html>`;

  const w = window.open("", "_blank", "width=900,height=700");
  if (!w) return;
  w.document.write(html);
  w.document.close();
  w.focus();
  setTimeout(() => { w.print(); }, 600);
}

// ── Excel Export — real .xlsx via SheetJS ─────────────────────────────
function exportExcel(rows: MembershipApplicationRow[], label = ""): void {
  const now = new Date();
  const dateStr = now.toLocaleDateString("ar-IQ", { year: "numeric", month: "long", day: "numeric" });

  // ── Column definitions ────────────────────────────────────────────
  const COLS: { h: string; v: (r: MembershipApplicationRow) => string | number }[] = [
    // التعريف
    { h: "رقم الطلب",          v: (r) => r.application_number ?? "" },
    { h: "نوع العضوية",        v: (r) => TYPE_LABEL[r.membership_type] ?? r.membership_type },
    { h: "الحالة",             v: (r) => STATUS_CFG[r.status]?.label ?? r.status },
    { h: "تاريخ التقديم",     v: (r) => new Date(r.created_at).toLocaleDateString("ar-IQ") },
    // الشخصية
    { h: "الاسم الكامل (عربي)",     v: (r) => r.full_name_ar },
    { h: "الاسم الكامل (إنجليزي)",  v: (r) => r.full_name_en },
    { h: "تاريخ الميلاد",           v: (r) => r.date_of_birth ? new Date(r.date_of_birth).toLocaleDateString("ar-IQ") : "" },
    { h: "الجنس",                    v: (r) => GENDER_LABEL[r.gender ?? ""] ?? r.gender ?? "" },
    { h: "الجنسية",                  v: (r) => r.nationality },
    { h: "رقم الهوية",               v: (r) => r.national_id ?? "" },
    // التواصل
    { h: "البريد الإلكتروني",        v: (r) => r.email },
    { h: "الهاتف الرئيسي",          v: (r) => r.phone_primary },
    { h: "الهاتف البديل",            v: (r) => r.phone_secondary ?? "" },
    { h: "المحافظة",                 v: (r) => r.governorate },
    { h: "المدينة",                  v: (r) => r.city },
    { h: "العنوان التفصيلي",        v: (r) => r.address_detail ?? "" },
    // التعليم
    { h: "المؤهل العلمي",           v: (r) => EDU_LABEL[r.education_level] ?? r.education_level },
    { h: "التخصص",                   v: (r) => r.education_field ?? "" },
    { h: "المؤسسة التعليمية",       v: (r) => r.institution ?? "" },
    { h: "سنة التخرج",              v: (r) => r.graduation_year ?? "" },
    { h: "جهة العمل",               v: (r) => r.current_employer ?? "" },
    { h: "المنصب الوظيفي",         v: (r) => r.current_position ?? "" },
    { h: "سنوات الخبرة",           v: (r) => r.years_of_experience ?? "" },
    { h: "المهارات",                v: (r) => (r.skills ?? []).join(" | ") },
    { h: "اللغات",                  v: (r) => (r.languages ?? []).join(" | ") },
    { h: "مجالات الاهتمام",        v: (r) => (r.areas_of_interest ?? []).join(" | ") },
    { h: "وصف الخبرة",              v: (r) => r.expertise_description ?? "" },
    // التفرغ
    { h: "أيام التفرغ (أسبوعياً)",  v: (r) => r.available_days_per_week ?? "" },
    { h: "ساعات التفرغ (يومياً)",   v: (r) => r.available_hours_per_day ?? "" },
    { h: "بيان الدوافع",            v: (r) => r.motivation_statement },
    { h: "تجربة تطوع سابقة",       v: (r) => r.previous_volunteering ?? "" },
    { h: "كيف عرف عن المؤسسة",    v: (r) => r.how_heard_about_us ?? "" },
    // المراجع
    { h: "مرجع 1 — الاسم",          v: (r) => r.reference_1_name ?? "" },
    { h: "مرجع 1 — الهاتف",         v: (r) => r.reference_1_phone ?? "" },
    { h: "مرجع 1 — صلة القرابة",    v: (r) => r.reference_1_relation ?? "" },
    { h: "مرجع 2 — الاسم",          v: (r) => r.reference_2_name ?? "" },
    { h: "مرجع 2 — الهاتف",         v: (r) => r.reference_2_phone ?? "" },
    { h: "مرجع 2 — صلة القرابة",    v: (r) => r.reference_2_relation ?? "" },
    { h: "طوارئ — الاسم",           v: (r) => r.emergency_contact_name ?? "" },
    { h: "طوارئ — الهاتف",          v: (r) => r.emergency_contact_phone ?? "" },
    { h: "طوارئ — صلة القرابة",     v: (r) => r.emergency_contact_relation ?? "" },
    // الإقرارات
    { h: "يوافق على الشروط",        v: (r) => r.agrees_to_terms ? "نعم" : "لا" },
    { h: "يوافق على السلوك",        v: (r) => r.agrees_to_code_of_conduct ? "نعم" : "لا" },
    { h: "تاريخ التوقيع",           v: (r) => r.signature_date ?? "" },
    { h: "ملاحظات المراجع",         v: (r) => r.reviewer_notes ?? "" },
    { h: "تاريخ المراجعة",          v: (r) => r.reviewed_at ? new Date(r.reviewed_at).toLocaleDateString("ar-IQ") : "" },
  ];

  // ── Build AOA (Array of Arrays) ────────────────────────────────────
  const aoa: (string | number)[][] = [
    // Row 1: Foundation name (merged visually via wide content)
    ["مؤسسة نهر ديالى للتنمية المستدامة", ...Array(COLS.length - 1).fill("")],
    // Row 2: Foundation details
    ["Diyala River Foundation — info@diyalariver.org", ...Array(COLS.length - 1).fill("")],
    // Row 3: Report metadata
    [`تقرير طلبات العضوية | إجمالي: ${rows.length} طلب | ${dateStr}`, ...Array(COLS.length - 1).fill("")],
    // Row 4: Empty separator
    Array(COLS.length).fill(""),
    // Row 5: Column headers
    COLS.map((c) => c.h),
    // Rows 6+: Data
    ...rows.map((r) => COLS.map((c) => c.v(r))),
    // Last row: Footer
    Array(COLS.length).fill(""),
    [`وثيقة رسمية — نظام إدارة العضويات — ${dateStr}`, ...Array(COLS.length - 1).fill("")],
  ];

  // ── Create worksheet ───────────────────────────────────────────────
  const ws = XLSX.utils.aoa_to_sheet(aoa, { cellStyles: true });

  // Auto column widths based on longest content per column
  const colWidths = COLS.map((c) => {
    const headerLen = c.h.length;
    const dataMax = rows.reduce((max, r) => {
      const val = String(c.v(r));
      return Math.max(max, val.length);
    }, 0);
    return { wch: Math.min(Math.max(headerLen, dataMax, 8), 50) };
  });
  ws["!cols"] = colWidths;

  // Freeze header rows (rows 1-5, freeze at row 6)
  ws["!freeze"] = { xSplit: 0, ySplit: 5 };

  // ── Create workbook ────────────────────────────────────────────────
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "طلبات العضوية");

  // ── Write and download ─────────────────────────────────────────────
  const wbout = XLSX.write(wb, { bookType: "xlsx", type: "array" });
  const blob  = new Blob([wbout], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
  const url   = URL.createObjectURL(blob);
  const a     = document.createElement("a");
  a.href      = url;
  a.download  = `membership_applications${label}_${now.toISOString().split("T")[0]}.xlsx`;
  a.click();
  URL.revokeObjectURL(url);
}

// ── Detail Panel ────────────────────────────────────────────────────────

function DetailPanel({ app, onClose, onStatusChange }: {
  app: MembershipApplicationRow;
  onClose: () => void;
  onStatusChange: (id: string, status: MembershipStatus, notes?: string) => Promise<void>;
}): React.ReactElement {
  const [notes, setNotes]   = useState(app.reviewer_notes ?? "");
  const [saving, setSaving] = useState(false);
  const cfg = STATUS_CFG[app.status];

  async function updateStatus(status: MembershipStatus): Promise<void> {
    setSaving(true);
    await onStatusChange(app.id, status, notes);
    setSaving(false);
  }

  // Reusable field row
  const InfoRow = ({ icon: Icon = User, label, value }: {
    icon?: React.ElementType; label: string; value: string | null | undefined;
  }): React.ReactElement | null =>
    value ? (
      <div className="flex items-start gap-3 py-2.5 border-b border-border/50 last:border-0">
        <Icon size={13} className="text-primary/60 mt-0.5 shrink-0" />
        <div className="min-w-0">
          <p className="text-[10px] font-medium text-muted-foreground mb-0.5">{label}</p>
          <p className="text-sm font-medium break-words">{value}</p>
        </div>
      </div>
    ) : null;

  const Section = ({ icon: Icon = User, title, children }: {
    icon?: React.ElementType; title: string; children: React.ReactNode;
  }): React.ReactElement => (
    <section>
      <p className="font-bold text-sm mb-3 flex items-center gap-2 text-foreground">
        <span className="w-6 h-6 rounded-lg bg-primary/10 flex items-center justify-center">
          <Icon size={12} className="text-primary" />
        </span>
        {title}
      </p>
      <div className="bg-muted/20 rounded-2xl px-4 py-1 border border-border/40">
        {children}
      </div>
    </section>
  );

  const TagList = ({ items, label }: { items: string[] | null | undefined; label: string }): React.ReactElement | null =>
    items && items.length > 0 ? (
      <div className="py-2.5 border-b border-border/50 last:border-0">
        <p className="text-[10px] font-medium text-muted-foreground mb-1.5">{label}</p>
        <div className="flex flex-wrap gap-1.5">
          {items.map((t) => <span key={t} className="px-2.5 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-medium">{t}</span>)}
        </div>
      </div>
    ) : null;

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-end"
      dir="rtl"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <motion.div
        initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
        transition={{ type: "spring", damping: 28, stiffness: 300 }}
        className="h-full w-full max-w-xl bg-card border-s border-border overflow-y-auto shadow-2xl"
      >
        {/* Header */}
        <div className="sticky top-0 bg-card/95 backdrop-blur border-b border-border px-5 py-4 flex items-center justify-between z-10">
          <div>
            <p className="font-bold font-display text-base">{app.full_name_ar}</p>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                {TYPE_LABEL[app.membership_type] ?? app.membership_type}
              </span>
              <p className="text-xs text-muted-foreground font-mono" dir="ltr">{app.application_number ?? "—"}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {/* Export single PDF */}
            <button
              onClick={() => printApplication(app)}
              title="طباعة / تصدير PDF"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-border text-xs font-medium hover:bg-muted hover:border-primary transition-colors"
            >
              <Printer size={13} /> PDF
            </button>
            <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${cfg.cls}`}>
              <cfg.icon size={10} /> {cfg.label}
            </span>
            <button onClick={onClose} className="p-2 rounded-xl hover:bg-muted transition-colors"><X size={16} /></button>
          </div>
        </div>

        <div className="p-5 space-y-5">

          {/* ① Personal */}
          <Section icon={User} title="المعلومات الشخصية">
            <InfoRow icon={Star}     label="نوع العضوية"             value={TYPE_LABEL[app.membership_type] ?? app.membership_type} />
            <InfoRow icon={User}     label="الاسم الكامل (إنجليزي)" value={app.full_name_en} />
            <InfoRow icon={Calendar} label="تاريخ الميلاد"           value={app.date_of_birth ? new Date(app.date_of_birth).toLocaleDateString("ar-IQ") : null} />
            <InfoRow icon={User}     label="الجنس"                   value={GENDER_LABEL[app.gender ?? ""] ?? app.gender} />
            <InfoRow icon={Globe}    label="الجنسية"                 value={app.nationality} />
            <InfoRow icon={Shield}   label="رقم الهوية الوطنية"      value={app.national_id} />
          </Section>

          {/* ② Contact */}
          <Section icon={Phone} title="معلومات التواصل">
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
            <InfoRow icon={Calendar}      label="سنة التخرج"          value={app.graduation_year?.toString()} />
            <InfoRow icon={Briefcase}     label="جهة العمل الحالية"  value={app.current_employer} />
            <InfoRow icon={Briefcase}     label="المنصب الوظيفي"     value={app.current_position} />
            <InfoRow icon={Star}          label="سنوات الخبرة"       value={app.years_of_experience ? `${app.years_of_experience} سنوات` : null} />
            <TagList label="المهارات"             items={app.skills} />
            <TagList label="اللغات"              items={app.languages} />
            <TagList label="مجالات الاهتمام"     items={app.areas_of_interest} />
            {app.expertise_description && (
              <div className="py-2.5">
                <p className="text-[10px] font-medium text-muted-foreground mb-1">وصف الخبرة</p>
                <p className="text-sm text-muted-foreground leading-relaxed">{app.expertise_description}</p>
              </div>
            )}
          </Section>

          {/* ④ Availability */}
          <Section icon={Calendar} title="التفرغ والمشاركة">
            <InfoRow icon={Calendar} label="أيام التفرغ أسبوعياً"  value={app.available_days_per_week ? `${app.available_days_per_week} أيام` : null} />
            <InfoRow icon={Calendar} label="ساعات التفرغ يومياً"   value={app.available_hours_per_day ? `${app.available_hours_per_day} ساعات` : null} />
            <InfoRow icon={Globe}    label="كيف عرفت عن المؤسسة"  value={app.how_heard_about_us} />
            <InfoRow icon={FileText} label="تجربة تطوع سابقة"      value={app.previous_volunteering} />
          </Section>

          {/* ⑤ Motivation */}
          {app.motivation_statement && (
            <section>
              <p className="font-bold text-sm mb-3 flex items-center gap-2">
                <span className="w-6 h-6 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Heart size={12} className="text-primary" />
                </span>
                بيان الدوافع والأهداف
              </p>
              <div className="bg-muted/20 rounded-2xl p-4 border border-border/40">
                <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">{app.motivation_statement}</p>
              </div>
            </section>
          )}

          {/* ⑥ References */}
          {(app.reference_1_name || app.reference_2_name) && (
            <Section icon={Users} title="المراجع">
              {app.reference_1_name && (
                <div className="py-2 border-b border-border/50">
                  <p className="text-[10px] font-semibold text-primary mb-1.5">المرجع الأول</p>
                  <InfoRow icon={User}  label="الاسم"         value={app.reference_1_name} />
                  <InfoRow icon={Phone} label="الهاتف"        value={app.reference_1_phone} />
                  <InfoRow icon={Users} label="صلة القرابة"  value={app.reference_1_relation} />
                </div>
              )}
              {app.reference_2_name && (
                <div className="py-2">
                  <p className="text-[10px] font-semibold text-primary mb-1.5">المرجع الثاني</p>
                  <InfoRow icon={User}  label="الاسم"         value={app.reference_2_name} />
                  <InfoRow icon={Phone} label="الهاتف"        value={app.reference_2_phone} />
                  <InfoRow icon={Users} label="صلة القرابة"  value={app.reference_2_relation} />
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
          <Section icon={Shield} title="الإقرارات">
            <div className="py-2.5 flex items-center gap-3 border-b border-border/50">
              <span className={`w-4 h-4 rounded flex items-center justify-center border ${app.agrees_to_terms ? "bg-emerald-500 border-emerald-500 text-white" : "border-border"}`}>
                {app.agrees_to_terms && <CheckCircle size={11} />}
              </span>
              <span className="text-sm">يوافق على الشروط والأحكام</span>
            </div>
            <div className="py-2.5 flex items-center gap-3 border-b border-border/50">
              <span className={`w-4 h-4 rounded flex items-center justify-center border ${app.agrees_to_code_of_conduct ? "bg-emerald-500 border-emerald-500 text-white" : "border-border"}`}>
                {app.agrees_to_code_of_conduct && <CheckCircle size={11} />}
              </span>
              <span className="text-sm">يوافق على ميثاق السلوك</span>
            </div>
            <InfoRow icon={Calendar} label="تاريخ التوقيع" value={app.signature_date ? new Date(app.signature_date).toLocaleDateString("ar-IQ") : null} />
          </Section>

          {/* ⑨ Reviewer Notes */}
          <section>
            <p className="font-bold text-sm mb-2 flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-muted flex items-center justify-center">
                <MessageSquare size={12} className="text-muted-foreground" />
              </span>
              ملاحظات المراجع
            </p>
            <textarea rows={3} value={notes} onChange={(e) => setNotes(e.target.value)}
              placeholder="أضف ملاحظاتك هنا..."
              className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary" />
            {app.reviewed_at && (
              <p className="text-[10px] text-muted-foreground mt-1">آخر مراجعة: {new Date(app.reviewed_at).toLocaleDateString("ar-IQ")}</p>
            )}
          </section>

          {/* ⑩ Status Actions */}
          <section>
            <p className="font-bold text-sm mb-3">تغيير حالة الطلب</p>
            <div className="grid grid-cols-2 gap-2">
              {(["approved", "under_review", "waitlisted", "rejected", "pending"] as MembershipStatus[]).map((s) => {
                const c = STATUS_CFG[s];
                return (
                  <button key={s} onClick={() => updateStatus(s)} disabled={saving || app.status === s}
                    className={`flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium transition-all disabled:opacity-40
                      ${app.status === s ? `ring-2 ring-offset-1 ring-current ${c.cls}` : "border border-border hover:bg-muted"}`}
                  >
                    <c.icon size={13} /> {c.label}
                  </button>
                );
              })}
            </div>
            {saving && <p className="text-xs text-center text-muted-foreground mt-2 animate-pulse">جاري الحفظ...</p>}
          </section>

        </div>
      </motion.div>
    </motion.div>
  );
}

// ── Export Modal (date range + format) ─────────────────────────────────
function ExportModal({ apps, onClose }: {
  apps: MembershipApplicationRow[];
  onClose: () => void;
}): React.ReactElement {
  const [from, setFrom] = useState("");
  const [to, setTo]     = useState(new Date().toISOString().split("T")[0]);
  const [fmt, setFmt]   = useState<"excel" | "pdf">("excel");
  const [status, setStatus] = useState<MembershipStatus | "all">("all");

  const filtered = apps.filter((a) => {
    const date = new Date(a.created_at);
    if (from && date < new Date(from)) return false;
    if (to   && date > new Date(to + "T23:59:59")) return false;
    if (status !== "all" && a.status !== status) return false;
    return true;
  });

  function doExport(): void {
    if (filtered.length === 0) return;
    const label = from && to ? `_${from}_${to}` : "";
    if (fmt === "excel") {
      exportExcel(filtered, label);
    } else {
      filtered.forEach((app, i) => {
        setTimeout(() => printApplication(app), i * 300);
      });
    }
    onClose();
  }

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      dir="rtl"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
        className="bg-card rounded-3xl border border-border w-full max-w-md p-6 shadow-2xl"
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-display font-bold text-lg flex items-center gap-2">
            <Download size={18} className="text-primary" /> تصدير الطلبات
          </h2>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-muted"><X size={16} /></button>
        </div>

        <div className="space-y-4">
          {/* Date range */}
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1.5 block flex items-center gap-1">
              <Filter size={11} /> الفترة الزمنية
            </label>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-[10px] text-muted-foreground mb-1">من تاريخ</p>
                <input type="date" value={from} onChange={(e) => setFrom(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary" dir="ltr" />
              </div>
              <div>
                <p className="text-[10px] text-muted-foreground mb-1">إلى تاريخ</p>
                <input type="date" value={to} onChange={(e) => setTo(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary" dir="ltr" />
              </div>
            </div>
          </div>

          {/* Status filter */}
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">فلترة الحالة</label>
            <select value={status} onChange={(e) => setStatus(e.target.value as MembershipStatus | "all")}
              className="w-full px-3 py-2 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary">
              <option value="all">جميع الحالات</option>
              {Object.entries(STATUS_CFG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
            </select>
          </div>

          {/* Format */}
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">صيغة التصدير</label>
            <div className="grid grid-cols-2 gap-2">
              {(["excel", "pdf"] as const).map((f) => (
                <button key={f} onClick={() => setFmt(f)}
                  className={`py-2.5 rounded-xl border text-sm font-medium transition-all flex items-center justify-center gap-1.5 ${
                    fmt === f ? "bg-primary text-primary-foreground border-primary" : "border-border hover:bg-muted"
                  }`}
                >
                  {f === "excel" ? <><FileText size={13} /> جدول Excel</> : <><Printer size={13} /> ملفات PDF</>}
                </button>
              ))}
            </div>
          </div>

          {/* Preview count */}
          <div className={`rounded-2xl p-3 text-center text-sm font-semibold ${filtered.length > 0 ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}`}>
            {filtered.length > 0
              ? `سيتم تصدير ${filtered.length} طلب`
              : "لا توجد طلبات مطابقة للمعايير المحددة"}
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-border text-sm hover:bg-muted">إلغاء</button>
            <button onClick={doExport} disabled={filtered.length === 0}
              className="flex-1 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold disabled:opacity-50 flex items-center justify-center gap-2">
              <Download size={14} /> تصدير
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ── Main Page ────────────────────────────────────────────────────────────
export default function AdminMembershipsPage(): React.ReactElement {
  const [apps, setApps]         = useState<MembershipApplicationRow[]>([]);
  const [loading, setLoading]   = useState(true);
  const [search, setSearch]     = useState("");
  const [statusFilter, setStatusFilter] = useState<MembershipStatus | "all">("all");
  const [typeFilter, setTypeFilter]     = useState<MembershipType | "all">("all");
  const [selected, setSelected] = useState<MembershipApplicationRow | null>(null);
  const [showExport, setShowExport]     = useState(false);

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

  const filtered = apps.filter((a) => {
    if (statusFilter !== "all" && a.status !== statusFilter) return false;
    if (typeFilter  !== "all" && a.membership_type !== typeFilter) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      return a.full_name_ar.toLowerCase().includes(q) ||
             a.full_name_en.toLowerCase().includes(q) ||
             a.email.toLowerCase().includes(q) ||
             (a.application_number ?? "").toLowerCase().includes(q);
    }
    return true;
  });

  // Summary counts
  const counts = Object.fromEntries(
    (Object.keys(STATUS_CFG) as MembershipStatus[]).map((s) => [s, apps.filter((a) => a.status === s).length])
  );

  const thCls = "px-4 py-3 text-start text-xs font-semibold text-muted-foreground uppercase tracking-wide";
  const tdCls = "px-4 py-3 text-sm";

  return (
    <div dir="rtl">
      <AnimatePresence>
        {selected && (
          <DetailPanel app={selected} onClose={() => setSelected(null)} onStatusChange={handleStatusChange} />
        )}
        {showExport && (
          <ExportModal apps={apps} onClose={() => setShowExport(false)} />
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="font-display text-xl font-bold">طلبات العضوية</h1>
          <p className="text-muted-foreground text-sm">{apps.length} طلب · {counts.pending ?? 0} بانتظار المراجعة</p>
        </div>
        <div className="flex gap-2">
          <button onClick={load} className="p-2.5 rounded-xl border border-border hover:bg-muted text-muted-foreground" title="تحديث">
            <RefreshCw size={15} />
          </button>
          <button
            onClick={() => setShowExport(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary-dark transition-colors"
          >
            <Download size={15} /> تصدير
          </button>
        </div>
      </div>

      {/* Status summary pills */}
      <div className="flex flex-wrap gap-2 mb-5">
        {(Object.entries(STATUS_CFG) as [MembershipStatus, typeof STATUS_CFG[MembershipStatus]][]).map(([k, v]) => (
          <button key={k} onClick={() => setStatusFilter(statusFilter === k ? "all" : k)}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
              statusFilter === k ? v.cls + " border-current" : "border-border text-muted-foreground hover:border-primary"
            }`}>
            <v.icon size={10} /> {v.label} ({counts[k] ?? 0})
          </button>
        ))}
        {statusFilter !== "all" && (
          <button onClick={() => setStatusFilter("all")} className="px-3 py-1.5 rounded-full text-xs border border-border text-muted-foreground hover:text-destructive flex items-center gap-1">
            <X size={10} /> إلغاء
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 mb-4">
        <div className="relative">
          <Search size={13} className="absolute top-1/2 -translate-y-1/2 start-3 text-muted-foreground" />
          <input value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="بحث بالاسم، البريد، رقم الطلب..."
            className="ps-8 pe-4 py-2 rounded-xl border border-border bg-card text-sm focus:outline-none focus:ring-2 focus:ring-primary w-64" />
        </div>
        <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value as MembershipType | "all")}
          className="px-3 py-2 rounded-xl border border-border bg-card text-sm focus:outline-none focus:ring-2 focus:ring-primary">
          <option value="all">جميع الأنواع</option>
          {Object.entries(TYPE_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
        {(typeFilter !== "all" || search) && (
          <button onClick={() => { setTypeFilter("all"); setSearch(""); }}
            className="px-3 py-2 rounded-xl border border-border text-xs text-muted-foreground hover:text-destructive flex items-center gap-1">
            <X size={12} /> مسح
          </button>
        )}
        <span className="ms-auto text-xs text-muted-foreground self-center">{filtered.length} نتيجة</span>
      </div>

      {/* Table */}
      <div className="rounded-2xl border border-border bg-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[780px]">
            <thead className="border-b border-border bg-muted/40">
              <tr>
                <th className={thCls}>رقم الطلب</th>
                <th className={thCls}>المتقدم</th>
                <th className={thCls}>المحافظة</th>
                <th className={thCls}>النوع</th>
                <th className={thCls}>التعليم</th>
                <th className={thCls}>الحالة</th>
                <th className={thCls}>التقديم</th>
                <th className={thCls}></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? Array.from({ length: 5 }).map((_, i) => (
                <tr key={i}><td colSpan={8} className="p-4"><div className="h-8 shimmer rounded-lg" /></td></tr>
              )) : filtered.map((a) => {
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
                        <cfg.icon size={10} /> {cfg.label}
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
          <div className="text-center py-16 text-muted-foreground text-sm">
            <FileText size={32} className="mx-auto mb-3 opacity-20" />
            لا توجد طلبات مطابقة
          </div>
        )}
      </div>
    </div>
  );
}
