/**
 * membershipExport.ts
 * -------------------
 * Professional, official Iraqi NGO document export engine for Diyala River Foundation.
 * Supports:
 *  • Single Application Official Letterhead with dynamic QR Code & Stamp placeholder
 *  • Unified Batch PDF printing without browser popup blockers
 *  • Executive 2-Sheet Excel Workbook (KPI Statistics + Full 47-field Register)
 */

import type { MembershipApplicationRow, MembershipStatus, MembershipType } from "@/types/database.types";
import * as XLSX from "xlsx";
import QRCode from "qrcode";

export const STATUS_CFG: Record<MembershipStatus, { label: string; cls: string; color: string }> = {
  pending: { label: "قيد الانتظار", cls: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400", color: "#d97706" },
  under_review: { label: "تحت المراجعة", cls: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400", color: "#2563eb" },
  approved: { label: "مقبول", cls: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400", color: "#059669" },
  rejected: { label: "مرفوض", cls: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400", color: "#dc2626" },
  waitlisted: { label: "قائمة انتظار", cls: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400", color: "#64748b" },
};

export const TYPE_LABEL: Record<MembershipType, string> = {
  regular: "عضوية عادية",
  founding: "عضوية مؤسس",
  honorary: "عضوية فخرية",
  student: "عضوية طلابية",
};

export const EDU_LABEL: Record<string, string> = {
  high_school: "الثانوية العامة",
  diploma: "دبلوم معهد",
  bachelor: "بكالوريوس",
  master: "ماجستير",
  phd: "دكتوراه",
  other: "أخرى",
};

export const GENDER_LABEL: Record<string, string> = {
  male: "ذكر",
  female: "أنثى",
};

export const OFFICIAL_DOMAIN = "https://diyalariver.org";

/**
 * Returns the official public verification portal URL for a member or application.
 * Always targets the canonical production domain https://diyalariver.org so mobile
 * QR scanner cameras navigate directly to the official public portal.
 */
export function getMemberVerificationUrl(identifier: string): string {
  const clean = (identifier || "").trim();
  return `${OFFICIAL_DOMAIN}/verify/member/${encodeURIComponent(clean)}`;
}

/**
 * Generates a QR Code as DataURL string
 */
export async function generateQrDataUrl(text: string): Promise<string> {
  try {
    return await QRCode.toDataURL(text, {
      width: 140,
      margin: 1,
      color: {
        dark: "#0f5132",
        light: "#ffffff",
      },
      errorCorrectionLevel: "M",
    });
  } catch (err) {
    console.warn("Failed to generate QR Code:", err);
    return "";
  }
}

/**
 * Builds standard application HTML body for print/export
 */
function buildApplicationHtml(
  app: MembershipApplicationRow,
  qrDataUrl: string,
  logoUrl: string,
  verifyUrl?: string
): string {
  const status = STATUS_CFG[app.status] ?? { label: app.status, color: "#475569" };
  const targetVerifyUrl = verifyUrl || getMemberVerificationUrl(app.application_number || app.id);

  const field = (label: string, value: string | number | null | undefined): string => {
    if (value === null || value === undefined || value === "") return "";
    return `
      <tr>
        <td class="lbl">${label}</td>
        <td class="val">${value}</td>
      </tr>
    `;
  };

  return `
  <div class="application-page">
    <!-- Official Institutional Letterhead Header -->
    <header class="official-header">
      <div class="header-col meta-right">
        <div class="country-line">جمهورية العراق</div>
        <div class="sub-line">محافظة ديالى</div>
        <div class="foundation-name">مؤسسة نهر ديالى للتنمية المستدامة</div>
        <div class="office-name">أمانة شؤون العضوية والانتساب</div>
      </div>

      <div class="header-col logo-center">
        <img src="${logoUrl}" alt="شعار المؤسسة" class="foundation-logo" onerror="this.style.display='none'" />
      </div>

      <div class="header-col qr-left">
        ${qrDataUrl ? `
          <a href="${targetVerifyUrl}" target="_blank" rel="noopener noreferrer" style="text-decoration:none; display:inline-block;" title="التحقق الرسمي من صحة الاستمارة عبر diyalariver.org">
            <img src="${qrDataUrl}" alt="QR Verification Code" class="qr-image" />
          </a>
          <div class="qr-sub">امسح للتحقق الرسمي</div>
        ` : ""}
        <div class="doc-code">رقم الطلب: <strong dir="ltr">${app.application_number ?? "—"}</strong></div>
        <div class="doc-date">تاريخ التقديم: ${new Date(app.created_at).toLocaleDateString("ar-IQ")}</div>
      </div>
    </header>

    <!-- Document Banner -->
    <div class="title-banner">
      <div class="banner-title">استمارة طلب انتساب وعضوية رسمية</div>
      <div class="banner-badge" style="border-color: ${status.color}; color: ${status.color};">
        الحالة: ${status.label} | نوع العضوية: ${TYPE_LABEL[app.membership_type] ?? app.membership_type}
      </div>
    </div>

    <!-- Section 1: Personal Info -->
    <section class="section-card">
      <h3 class="card-title">أولاً: البيانات الشخصية والتعريفية</h3>
      <table class="grid-table">
        ${field("الاسم الكامل (عربي)", app.full_name_ar)}
        ${field("الاسم الكامل (English)", app.full_name_en)}
        ${field("تاريخ الميلاد", app.date_of_birth ? new Date(app.date_of_birth).toLocaleDateString("ar-IQ") : null)}
        ${field("الجنس", GENDER_LABEL[app.gender ?? ""] ?? app.gender)}
        ${field("الجنسية", app.nationality)}
        ${field("رقم الهوية الوطنية / البطاقة الموحدة", app.national_id)}
      </table>
    </section>

    <!-- Section 2: Contact & Residency -->
    <section class="section-card">
      <h3 class="card-title">ثانياً: معلومات السكن والتواصل</h3>
      <table class="grid-table">
        ${field("البريد الإلكتروني", app.email)}
        ${field("الهاتف الرئيسي", app.phone_primary)}
        ${field("الهاتف البديل", app.phone_secondary)}
        ${field("المحافظة", app.governorate)}
        ${field("القضاء / المدينة", app.city)}
        ${field("العنوان التفصيلي", app.address_detail)}
      </table>
    </section>

    <!-- Section 3: Education & Career -->
    <section class="section-card">
      <h3 class="card-title">ثالثاً: المؤهلات العلمية والخبرة المهنية</h3>
      <table class="grid-table">
        ${field("المؤهل العلمي", EDU_LABEL[app.education_level] ?? app.education_level)}
        ${field("التخصص الدراسي", app.education_field)}
        ${field("الجامعة / المؤسسة التعليمية", app.institution)}
        ${field("سنة التخرج", app.graduation_year)}
        ${field("جهة العمل الحالية", app.current_employer)}
        ${field("المسمى الوظيفي الحالي", app.current_position)}
        ${field("سنوات الخبرة الإجمالية", app.years_of_experience ? `${app.years_of_experience} سنوات` : null)}
      </table>
      ${app.skills?.length ? `
        <div class="tags-container">
          <span class="tag-label">المهارات:</span>
          ${app.skills.map((s) => `<span class="badge-tag">${s}</span>`).join(" ")}
        </div>
      ` : ""}
      ${app.languages?.length ? `
        <div class="tags-container">
          <span class="tag-label">اللغات:</span>
          ${app.languages.map((l) => `<span class="badge-tag">${l}</span>`).join(" ")}
        </div>
      ` : ""}
      ${app.areas_of_interest?.length ? `
        <div class="tags-container">
          <span class="tag-label">مجالات الاهتمام:</span>
          ${app.areas_of_interest.map((a) => `<span class="badge-tag accent">${a}</span>`).join(" ")}
        </div>
      ` : ""}
      ${app.expertise_description ? `
        <div class="text-block">
          <strong>وصف الخبرة والتخصص:</strong>
          <p>${app.expertise_description}</p>
        </div>
      ` : ""}
    </section>

    <!-- Section 4: Volunteering & Motivation -->
    <section class="section-card">
      <h3 class="card-title">رابعاً: التفرغ، التطوع، وبيان الدوافع</h3>
      <table class="grid-table">
        ${field("أيام التفرغ المتاحة أسبوعياً", app.available_days_per_week ? `${app.available_days_per_week} أيام` : null)}
        ${field("ساعات التفرغ المتاحة يومياً", app.available_hours_per_day ? `${app.available_hours_per_day} ساعات` : null)}
        ${field("قنوات التعرف على المؤسسة", app.how_heard_about_us)}
        ${field("تجارب تطوعية سابقة", app.previous_volunteering)}
      </table>
      ${app.motivation_statement ? `
        <div class="text-block motivation">
          <strong>بيان الدوافع والأهداف الشخصية:</strong>
          <p>${app.motivation_statement}</p>
        </div>
      ` : ""}
    </section>

    <!-- Section 5: References & Emergency -->
    ${(app.reference_1_name || app.emergency_contact_name) ? `
    <section class="section-card">
      <h3 class="card-title">خامساً: المراجع وجهات الاتصال في الطوارئ</h3>
      <div class="split-cards">
        ${app.reference_1_name ? `
        <div class="sub-card">
          <h4>المرجع الشخصي / المهني</h4>
          <p><strong>الاسم:</strong> ${app.reference_1_name}</p>
          <p><strong>الهاتف:</strong> ${app.reference_1_phone ?? "—"}</p>
          <p><strong>صلة القرابة / العمل:</strong> ${app.reference_1_relation ?? "—"}</p>
        </div>` : ""}

        ${app.emergency_contact_name ? `
        <div class="sub-card alert-card">
          <h4>جهة الاتصال في الطوارئ</h4>
          <p><strong>الاسم:</strong> ${app.emergency_contact_name}</p>
          <p><strong>الهاتف:</strong> ${app.emergency_contact_phone ?? "—"}</p>
          <p><strong>صلة القرابة:</strong> ${app.emergency_contact_relation ?? "—"}</p>
        </div>` : ""}
      </div>
    </section>
    ` : ""}

    <!-- Section 6: Commitments & Review Notes -->
    <section class="section-card">
      <h3 class="card-title">سادساً: الإقرارات وقرار لجنة المراجعة</h3>
      <div class="agreements-box">
        <div class="chk-item">
          <span class="chk-box ${app.agrees_to_terms ? "chk-yes" : ""}">✓</span>
          <span>يقر المتقدم بالموافقة الكاملة على الشروط والأحكام واللوائح الداخلية لمؤسسة نهر ديالى.</span>
        </div>
        <div class="chk-item">
          <span class="chk-box ${app.agrees_to_code_of_conduct ? "chk-yes" : ""}">✓</span>
          <span>يقر المتقدم بالالتزام التام بميثاق السلوك المهني والأخلاقي للمؤسسة.</span>
        </div>
        ${app.signature_date ? `
          <div class="sig-date-line">تاريخ توقيع المتقدم: <strong>${new Date(app.signature_date).toLocaleDateString("ar-IQ")}</strong></div>
        ` : ""}
      </div>

      ${app.reviewer_notes ? `
        <div class="text-block review-block">
          <strong>ملاحظات لجنة مراجعة العضويات:</strong>
          <p>${app.reviewer_notes}</p>
          ${app.reviewed_at ? `<small>تاريخ المراجعة: ${new Date(app.reviewed_at).toLocaleDateString("ar-IQ")}</small>` : ""}
        </div>
      ` : ""}
    </section>

    <!-- Signatures and Official Stamp Block -->
    <div class="signatures-wrapper">
      <div class="sig-column">
        <div class="sig-title">توقيع المتقدم بالطلب</div>
        <div class="sig-name">${app.full_name_ar}</div>
        <div class="sig-space"></div>
      </div>

      <div class="sig-column center-stamp">
        <div class="stamp-seal">
          <div class="stamp-inner">
            <span>مؤسسة نهر ديالى</span>
            <span class="stamp-en">DIYALA RIVER</span>
            <span>معتمد رسمياً</span>
          </div>
        </div>
      </div>

      <div class="sig-column">
        <div class="sig-title">أمانة شؤون العضوية</div>
        <div class="sig-name">لجنة التدقيق والقبول</div>
        <div class="sig-space"></div>
      </div>
    </div>

    <!-- Official Footer -->
    <footer class="official-footer">
      <div>وثيقة رسمية صادرة إلكترونياً من نظام إدارة مؤسسة نهر ديالى للتنمية المستدامة | diyalariver.org | info@diyalariver.org</div>
      <div class="footer-time">تاريخ الإصدار: ${new Date().toLocaleDateString("ar-IQ", { year: "numeric", month: "long", day: "numeric" })}</div>
    </footer>
  </div>
  `;
}

/**
 * Complete Print Template Wrapper CSS
 */
function getDocumentStyles(): string {
  return `
    @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800;900&display=swap');
    
    * { box-sizing: border-box; margin: 0; padding: 0; }
    
    body {
      font-family: 'Cairo', 'Segoe UI', Tahoma, sans-serif;
      font-size: 9.5pt;
      line-height: 1.5;
      color: #0f172a;
      background: #ffffff;
      direction: rtl;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }

    @page {
      size: A4 portrait;
      margin: 10mm 12mm 10mm 12mm;
    }

    .application-page {
      max-width: 210mm;
      margin: 0 auto;
      padding: 4mm 0;
      page-break-after: always;
      position: relative;
    }

    .application-page:last-child {
      page-break-after: avoid;
    }

    /* Official Header */
    .official-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 2.5px solid #059669;
      padding-bottom: 8px;
      margin-bottom: 10px;
    }

    .header-col {
      flex: 1;
    }

    .meta-right {
      text-align: right;
    }

    .country-line {
      font-size: 9.5pt;
      font-weight: 700;
      color: #1e293b;
    }

    .sub-line {
      font-size: 8.5pt;
      color: #475569;
    }

    .foundation-name {
      font-size: 11pt;
      font-weight: 900;
      color: #047857;
      margin-top: 1px;
    }

    .office-name {
      font-size: 8pt;
      font-weight: 700;
      color: #64748b;
    }

    .logo-center {
      text-align: center;
      flex: 0 0 110px;
    }

    .foundation-logo {
      width: 52px;
      height: 52px;
      object-fit: contain;
      margin: 0 auto;
    }

    .motto {
      font-size: 7pt;
      font-weight: 700;
      color: #059669;
      margin-top: 2px;
    }

    .qr-left {
      text-align: left;
      display: flex;
      flex-direction: column;
      align-items: flex-end;
    }

    .qr-image {
      width: 56px;
      height: 56px;
      border: 1px solid #cbd5e1;
      border-radius: 4px;
      padding: 2px;
      background: #fff;
    }

    .qr-sub {
      font-size: 6pt;
      font-weight: 700;
      color: #059669;
      text-align: center;
      margin-top: 1.5px;
      letter-spacing: 0.2px;
    }

    .doc-code {
      font-size: 8.5pt;
      font-weight: 700;
      color: #0f172a;
      margin-top: 2px;
    }

    .doc-date {
      font-size: 7.5pt;
      color: #64748b;
    }

    /* Title Banner */
    .title-banner {
      display: flex;
      justify-content: space-between;
      align-items: center;
      background: #f0fdf4;
      border: 1px solid #bbf7d0;
      border-radius: 6px;
      padding: 6px 12px;
      margin-bottom: 10px;
    }

    .banner-title {
      font-size: 11pt;
      font-weight: 800;
      color: #065f46;
    }

    .banner-badge {
      font-size: 8.5pt;
      font-weight: 700;
      padding: 3px 10px;
      border-radius: 20px;
      border: 1.5px solid;
      background: #ffffff;
    }

    /* Section Cards */
    .section-card {
      margin-bottom: 8px;
      border: 1px solid #e2e8f0;
      border-radius: 6px;
      padding: 7px 10px;
      page-break-inside: avoid;
    }

    .card-title {
      font-size: 9.5pt;
      font-weight: 800;
      color: #065f46;
      border-bottom: 1.5px solid #dcfce7;
      padding-bottom: 3px;
      margin-bottom: 5px;
    }

    /* Grid Table */
    .grid-table {
      width: 100%;
      border-collapse: collapse;
    }

    .grid-table td {
      padding: 3px 5px;
      font-size: 8.5pt;
      vertical-align: middle;
      border-bottom: 1px dashed #f1f5f9;
    }

    .grid-table td.lbl {
      width: 32%;
      font-weight: 700;
      color: #475569;
    }

    .grid-table td.val {
      color: #0f172a;
    }

    /* Tags */
    .tags-container {
      margin-top: 4px;
      font-size: 8pt;
    }

    .tag-label {
      font-weight: 700;
      color: #475569;
      margin-inline-end: 6px;
    }

    .badge-tag {
      display: inline-block;
      padding: 1px 7px;
      border-radius: 10px;
      background: #f1f5f9;
      color: #334155;
      font-size: 7.5pt;
      font-weight: 600;
      margin: 1px;
      border: 1px solid #e2e8f0;
    }

    .badge-tag.accent {
      background: #dcfce7;
      color: #15803d;
      border-color: #bbf7d0;
    }

    .text-block {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 5px;
      padding: 6px 8px;
      font-size: 8pt;
      margin-top: 5px;
    }

    .text-block.motivation {
      border-right: 3px solid #059669;
    }

    .text-block.review-block {
      border-right: 3px solid #2563eb;
      background: #eff6ff;
    }

    /* Split Cards */
    .split-cards {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 8px;
    }

    .sub-card {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 5px;
      padding: 6px 8px;
      font-size: 8pt;
    }

    .sub-card h4 {
      font-size: 8.5pt;
      font-weight: 700;
      color: #0f172a;
      margin-bottom: 4px;
    }

    /* Agreements */
    .agreements-box {
      font-size: 8pt;
      margin-bottom: 4px;
    }

    .chk-item {
      display: flex;
      align-items: center;
      gap: 6px;
      margin-bottom: 3px;
    }

    .chk-box {
      width: 14px;
      height: 14px;
      border: 1.5px solid #059669;
      border-radius: 3px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      font-size: 9pt;
      color: transparent;
      font-weight: 900;
    }

    .chk-box.chk-yes {
      background: #059669;
      color: #ffffff;
    }

    .sig-date-line {
      font-size: 8pt;
      color: #475569;
      margin-top: 3px;
    }

    /* Signatures */
    .signatures-wrapper {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-top: 10px;
      padding-top: 8px;
      border-top: 1.5px dashed #cbd5e1;
      page-break-inside: avoid;
    }

    .sig-column {
      flex: 1;
      text-align: center;
    }

    .sig-title {
      font-size: 8.5pt;
      font-weight: 700;
      color: #334155;
    }

    .sig-name {
      font-size: 8pt;
      color: #64748b;
      margin-top: 2px;
    }

    .sig-space {
      width: 100px;
      height: 35px;
      border-bottom: 1px solid #334155;
      margin: 4px auto 0;
    }

    /* Center Stamp */
    .center-stamp {
      display: flex;
      justify-content: center;
    }

    .stamp-seal {
      width: 72px;
      height: 72px;
      border: 2px dashed #059669;
      border-radius: 50%;
      padding: 3px;
      display: flex;
      align-items: center;
      justify-content: center;
      opacity: 0.85;
      transform: rotate(-8deg);
    }

    .stamp-inner {
      width: 100%;
      height: 100%;
      border: 1px solid #059669;
      border-radius: 50%;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      font-size: 6.5pt;
      font-weight: 900;
      color: #059669;
      line-height: 1.1;
      text-align: center;
    }

    .stamp-en {
      font-size: 5pt;
      letter-spacing: 0.5px;
    }

    /* Footer */
    .official-footer {
      margin-top: 10px;
      padding-top: 5px;
      border-top: 1px solid #e2e8f0;
      display: flex;
      justify-content: space-between;
      font-size: 7pt;
      color: #94a3b8;
    }

    @media print {
      body { background: #fff; }
      .official-header, .section-card, .title-banner, .signatures-wrapper {
        page-break-inside: avoid;
      }
    }
  `;
}

/**
 * Print a single official application dossier with QR code and institutional header
 */
export async function printOfficialApplication(app: MembershipApplicationRow): Promise<void> {
  const logoUrl = typeof window !== "undefined" && window.location.origin.includes("diyalariver.org")
    ? `${window.location.origin}/logo.png`
    : `${OFFICIAL_DOMAIN}/logo.png`;
  const searchId = app.application_number || app.id;
  const verifyUrl = getMemberVerificationUrl(searchId);
  const qrDataUrl = await generateQrDataUrl(verifyUrl);

  const html = `<!DOCTYPE html>
  <html dir="rtl" lang="ar">
  <head>
    <meta charset="UTF-8" />
    <title>استمارة عضوية رسمية — ${app.full_name_ar} (${app.application_number ?? "DRF"})</title>
    <style>${getDocumentStyles()}</style>
  </head>
  <body>
    ${buildApplicationHtml(app, qrDataUrl, logoUrl, verifyUrl)}
  </body>
  </html>`;

  const w = window.open("", "_blank", "width=920,height=800");
  if (!w) {
    alert("يرجى السماح بالنوافذ المنبثقة لطباعة الاستمارة الرسمية.");
    return;
  }
  w.document.write(html);
  w.document.close();
  w.focus();
  setTimeout(() => { w.print(); }, 500);
}

/**
 * Print batch applications in a single unified print view (no popup blockers)
 */
export async function printBatchOfficialApplications(apps: MembershipApplicationRow[]): Promise<void> {
  if (!apps.length) return;

  const logoUrl = typeof window !== "undefined" && window.location.origin.includes("diyalariver.org")
    ? `${window.location.origin}/logo.png`
    : `${OFFICIAL_DOMAIN}/logo.png`;

  // Generate QR for all items in parallel
  const renderedPages = await Promise.all(
    apps.map(async (app) => {
      const searchId = app.application_number || app.id;
      const verifyUrl = getMemberVerificationUrl(searchId);
      const qrDataUrl = await generateQrDataUrl(verifyUrl);
      return buildApplicationHtml(app, qrDataUrl, logoUrl, verifyUrl);
    })
  );

  const html = `<!DOCTYPE html>
  <html dir="rtl" lang="ar">
  <head>
    <meta charset="UTF-8" />
    <title>تقرير استمارات العضوية المجمعة — (${apps.length} طلب)</title>
    <style>${getDocumentStyles()}</style>
  </head>
  <body>
    ${renderedPages.join("\n")}
  </body>
  </html>`;

  const w = window.open("", "_blank", "width=920,height=800");
  if (!w) {
    alert("يرجى السماح بالنوافذ المنبثقة لطباعة الملف المجمع.");
    return;
  }
  w.document.write(html);
  w.document.close();
  w.focus();
  setTimeout(() => { w.print(); }, 600);
}

/**
 * Export Executive Excel Report with 2 Sheets (KPI Summary + Full 47-column Register)
 */
export function exportExecutiveExcel(rows: MembershipApplicationRow[], label = ""): void {
  const now = new Date();
  const dateStr = now.toLocaleDateString("ar-IQ", { year: "numeric", month: "long", day: "numeric" });

  // 1. Calculations for KPI Sheet
  const total = rows.length;
  const statusCounts: Record<string, number> = {};
  const typeCounts: Record<string, number> = {};
  const govCounts: Record<string, number> = {};
  const eduCounts: Record<string, number> = {};

  rows.forEach((r) => {
    statusCounts[STATUS_CFG[r.status]?.label ?? r.status] = (statusCounts[STATUS_CFG[r.status]?.label ?? r.status] || 0) + 1;
    typeCounts[TYPE_LABEL[r.membership_type] ?? r.membership_type] = (typeCounts[TYPE_LABEL[r.membership_type] ?? r.membership_type] || 0) + 1;
    govCounts[r.governorate] = (govCounts[r.governorate] || 0) + 1;
    eduCounts[EDU_LABEL[r.education_level] ?? r.education_level] = (eduCounts[EDU_LABEL[r.education_level] ?? r.education_level] || 0) + 1;
  });

  const kpiAoa: (string | number)[][] = [
    ["مؤسسة نهر ديالى للتنمية المستدامة — Diyala River Foundation"],
    ["تقرير وإحصاءات طلبات العضوية والانتساب"],
    [`تاريخ التقرير: ${dateStr} | إجمالي الطلبات: ${total}`],
    [""],
    ["مؤشرات الحالات", "العدد", "النسبة المئوية"],
    ...Object.entries(statusCounts).map(([k, v]) => [k, v, `${((v / total) * 100).toFixed(1)}%`]),
    [""],
    ["توزيع أنواع العضوية", "العدد", "النسبة المئوية"],
    ...Object.entries(typeCounts).map(([k, v]) => [k, v, `${((v / total) * 100).toFixed(1)}%`]),
    [""],
    ["التوزيع الجغرافي (المحافظات)", "العدد", "النسبة المئوية"],
    ...Object.entries(govCounts).map(([k, v]) => [k, v, `${((v / total) * 100).toFixed(1)}%`]),
    [""],
    ["المؤهلات العلمية", "العدد", "النسبة المئوية"],
    ...Object.entries(eduCounts).map(([k, v]) => [k, v, `${((v / total) * 100).toFixed(1)}%`]),
  ];

  // 2. Full Register Columns
  const COLS: { h: string; v: (r: MembershipApplicationRow) => string | number }[] = [
    { h: "رقم الطلب", v: (r) => r.application_number ?? "" },
    { h: "نوع العضوية", v: (r) => TYPE_LABEL[r.membership_type] ?? r.membership_type },
    { h: "الحالة", v: (r) => STATUS_CFG[r.status]?.label ?? r.status },
    { h: "تاريخ التقديم", v: (r) => new Date(r.created_at).toLocaleDateString("ar-IQ") },
    { h: "الاسم الكامل (عربي)", v: (r) => r.full_name_ar },
    { h: "الاسم الكامل (إنجليزي)", v: (r) => r.full_name_en },
    { h: "تاريخ الميلاد", v: (r) => r.date_of_birth ? new Date(r.date_of_birth).toLocaleDateString("ar-IQ") : "" },
    { h: "الجنس", v: (r) => GENDER_LABEL[r.gender ?? ""] ?? r.gender ?? "" },
    { h: "الجنسية", v: (r) => r.nationality },
    { h: "رقم الهوية", v: (r) => r.national_id ?? "" },
    { h: "البريد الإلكتروني", v: (r) => r.email },
    { h: "الهاتف الرئيسي", v: (r) => r.phone_primary },
    { h: "الهاتف البديل", v: (r) => r.phone_secondary ?? "" },
    { h: "المحافظة", v: (r) => r.governorate },
    { h: "المدينة", v: (r) => r.city },
    { h: "العنوان التفصيلي", v: (r) => r.address_detail ?? "" },
    { h: "المؤهل العلمي", v: (r) => EDU_LABEL[r.education_level] ?? r.education_level },
    { h: "التخصص", v: (r) => r.education_field ?? "" },
    { h: "المؤسسة التعليمية", v: (r) => r.institution ?? "" },
    { h: "سنة التخرج", v: (r) => r.graduation_year ?? "" },
    { h: "جهة العمل", v: (r) => r.current_employer ?? "" },
    { h: "المنصب الوظيفي", v: (r) => r.current_position ?? "" },
    { h: "سنوات الخبرة", v: (r) => r.years_of_experience ?? "" },
    { h: "المهارات", v: (r) => (r.skills ?? []).join(" | ") },
    { h: "اللغات", v: (r) => (r.languages ?? []).join(" | ") },
    { h: "مجالات الاهتمام", v: (r) => (r.areas_of_interest ?? []).join(" | ") },
    { h: "وصف الخبرة", v: (r) => r.expertise_description ?? "" },
    { h: "أيام التفرغ أسبوعياً", v: (r) => r.available_days_per_week ?? "" },
    { h: "ساعات التفرغ يومياً", v: (r) => r.available_hours_per_day ?? "" },
    { h: "بيان الدوافع", v: (r) => r.motivation_statement },
    { h: "تجارب تطوعية سابقة", v: (r) => r.previous_volunteering ?? "" },
    { h: "كيف عرف عن المؤسسة", v: (r) => r.how_heard_about_us ?? "" },
    { h: "مرجع 1 — الاسم", v: (r) => r.reference_1_name ?? "" },
    { h: "مرجع 1 — الهاتف", v: (r) => r.reference_1_phone ?? "" },
    { h: "مرجع 1 — صلة القرابة", v: (r) => r.reference_1_relation ?? "" },
    { h: "مرجع 2 — الاسم", v: (r) => r.reference_2_name ?? "" },
    { h: "مرجع 2 — الهاتف", v: (r) => r.reference_2_phone ?? "" },
    { h: "مرجع 2 — صلة القرابة", v: (r) => r.reference_2_relation ?? "" },
    { h: "طوارئ — الاسم", v: (r) => r.emergency_contact_name ?? "" },
    { h: "طوارئ — الهاتف", v: (r) => r.emergency_contact_phone ?? "" },
    { h: "طوارئ — صلة القرابة", v: (r) => r.emergency_contact_relation ?? "" },
    { h: "يوافق على الشروط", v: (r) => r.agrees_to_terms ? "نعم" : "لا" },
    { h: "يوافق على السلوك", v: (r) => r.agrees_to_code_of_conduct ? "نعم" : "لا" },
    { h: "تاريخ التوقيع", v: (r) => r.signature_date ?? "" },
    { h: "ملاحظات المراجع", v: (r) => r.reviewer_notes ?? "" },
    { h: "تاريخ المراجعة", v: (r) => r.reviewed_at ? new Date(r.reviewed_at).toLocaleDateString("ar-IQ") : "" },
  ];

  const dataAoa: (string | number)[][] = [
    ["مؤسسة نهر ديالى للتنمية المستدامة — سجل بيانات المتقدمين الكامل"],
    [`إجمالي السجلات: ${rows.length} | تاريخ الاستخراج: ${dateStr}`],
    [""],
    COLS.map((c) => c.h),
    ...rows.map((r) => COLS.map((c) => c.v(r))),
  ];

  const wb = XLSX.utils.book_new();

  // Sheet 1: Dashboard KPIs
  const wsKpi = XLSX.utils.aoa_to_sheet(kpiAoa);
  wsKpi["!cols"] = [{ wch: 30 }, { wch: 15 }, { wch: 15 }];
  XLSX.utils.book_append_sheet(wb, wsKpi, "لوحة المؤشرات والإحصاءات");

  // Sheet 2: Detailed Register
  const wsData = XLSX.utils.aoa_to_sheet(dataAoa);
  wsData["!cols"] = COLS.map((c) => {
    const dataMax = rows.reduce((max, r) => Math.max(max, String(c.v(r)).length), c.h.length);
    return { wch: Math.min(Math.max(dataMax, 10), 45) };
  });
  XLSX.utils.book_append_sheet(wb, wsData, "سجل المتقدمين التفصيلي");

  const wbout = XLSX.write(wb, { bookType: "xlsx", type: "array" });
  const blob = new Blob([wbout], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `membership_applications${label}_${now.toISOString().split("T")[0]}.xlsx`;
  a.click();
  URL.revokeObjectURL(url);
}
