/**
 * JoinPage.tsx — "انضم إلينا"
 * ----------------------------
 * Multi-step official membership registration form (6 steps).
 * Fully connected to Supabase `membership_applications` table.
 * Saves progress in localStorage. Auto-generates application number.
 */

import React, { useState, useEffect, useCallback, useRef } from "react";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from "framer-motion";
import {
  User, Phone, GraduationCap, Star as StarIcon,
  Heart, FileText, CheckCircle, ChevronRight, ChevronLeft,
  X, Plus, Save, AlertCircle, ArrowLeft, ArrowRight,
  Shield, Award, BookOpen, Sparkles,
} from "lucide-react";
import { Link } from "react-router-dom";
import PageHero from "@/components/shared/PageHero";
import { supabase } from "@/lib/supabaseClient";
import type { MembershipType, EducationLevel } from "@/types/database.types";

/* ── Constants ─────────────────────────────────────────────────────── */
const STORAGE_KEY = "drf_membership_draft";
const TOTAL_STEPS = 6;

const IRAQI_GOVERNORATES = [
  "بغداد", "البصرة", "نينوى", "أربيل", "كركوك", "السليمانية",
  "ديالى", "الأنبار", "بابل", "كربلاء", "النجف", "واسط",
  "ميسان", "ذي قار", "المثنى", "القادسية", "صلاح الدين",
  "دهوك", "حلبجة",
];

/* ── Types ──────────────────────────────────────────────────────────── */
interface FormData {
  membership_type: MembershipType;
  // Step 1
  full_name_ar: string;
  full_name_en: string;
  date_of_birth: string;
  nationality: string;
  national_id: string;
  gender: "male" | "female" | "";
  // Step 2
  email: string;
  phone_primary: string;
  phone_secondary: string;
  governorate: string;
  city: string;
  address_detail: string;
  emergency_contact_name: string;
  emergency_contact_phone: string;
  emergency_contact_relation: string;
  // Step 3
  education_level: EducationLevel | "";
  education_field: string;
  institution: string;
  graduation_year: string;
  current_employer: string;
  current_position: string;
  years_of_experience: string;
  // Step 4
  skills: string[];
  languages: string[];
  areas_of_interest: string[];
  expertise_description: string;
  available_days_per_week: string;
  available_hours_per_day: string;
  // Step 5
  motivation_statement: string;
  previous_volunteering: string;
  how_heard_about_us: string;
  reference_1_name: string;
  reference_1_phone: string;
  reference_1_relation: string;
  reference_2_name: string;
  reference_2_phone: string;
  reference_2_relation: string;
  // Step 6
  agrees_to_terms: boolean;
  agrees_to_code_of_conduct: boolean;
}

const INITIAL_DATA: FormData = {
  membership_type: "regular",
  full_name_ar: "", full_name_en: "", date_of_birth: "", nationality: "عراقي",
  national_id: "", gender: "",
  email: "", phone_primary: "", phone_secondary: "", governorate: "", city: "",
  address_detail: "", emergency_contact_name: "", emergency_contact_phone: "",
  emergency_contact_relation: "",
  education_level: "", education_field: "", institution: "", graduation_year: "",
  current_employer: "", current_position: "", years_of_experience: "",
  skills: [], languages: [], areas_of_interest: [], expertise_description: "",
  available_days_per_week: "", available_hours_per_day: "",
  motivation_statement: "", previous_volunteering: "", how_heard_about_us: "",
  reference_1_name: "", reference_1_phone: "", reference_1_relation: "",
  reference_2_name: "", reference_2_phone: "", reference_2_relation: "",
  agrees_to_terms: false, agrees_to_code_of_conduct: false,
};

/* ── Helpers ────────────────────────────────────────────────────────── */
const inputCls = "w-full px-4 py-2.5 rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary text-sm transition-colors";
const labelCls = "block text-sm font-medium mb-1.5";
const gridCls  = "grid sm:grid-cols-2 gap-4";

function Field({ label, required, children, hint }: {
  label: string; required?: boolean; children: React.ReactNode; hint?: string;
}): React.ReactElement {
  return (
    <div>
      <label className={labelCls}>
        {label}{required && <span className="text-destructive ms-1">*</span>}
      </label>
      {children}
      {hint && <p className="text-xs text-muted-foreground mt-1">{hint}</p>}
    </div>
  );
}

/* ── TagInput: press Enter to add tags ──────────────────────────────── */
function TagInput({ tags, onChange, placeholder }: {
  tags: string[]; onChange: (tags: string[]) => void; placeholder: string;
}): React.ReactElement {
  const [input, setInput] = useState("");
  function add(): void {
    const val = input.trim();
    if (val && !tags.includes(val)) { onChange([...tags, val]); }
    setInput("");
  }
  return (
    <div>
      <div className="flex flex-wrap gap-1.5 mb-2 min-h-[28px]">
        {tags.map((tag) => (
          <span key={tag} className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-medium">
            {tag}
            <button type="button" onClick={() => onChange(tags.filter((t) => t !== tag))} aria-label="Remove">
              <X size={10} />
            </button>
          </span>
        ))}
      </div>
      <div className="flex gap-2">
        <input
          type="text" value={input} onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); add(); } }}
          placeholder={placeholder} className={inputCls}
        />
        <button type="button" onClick={add}
          className="px-3 py-2.5 rounded-xl border border-border hover:bg-muted transition-colors">
          <Plus size={16} />
        </button>
      </div>
    </div>
  );
}

/* ── MembershipTypeCard ─────────────────────────────────────────────── */
const TYPE_CONFIG = {
  regular:   { icon: User,      gradient: "from-blue-500 to-indigo-600" },
  founding:  { icon: StarIcon,  gradient: "from-amber-500 to-orange-600" },
  student:   { icon: BookOpen,  gradient: "from-emerald-500 to-teal-600" },
  honorary:  { icon: Award,     gradient: "from-violet-500 to-purple-600" },
};

/* ── Progress Bar ───────────────────────────────────────────────────── */
function ProgressBar({ step }: { step: number }): React.ReactElement {
  const { t } = useTranslation("join");
  return (
    <div className="mb-8">
      <div className="flex justify-between mb-2">
        {Array.from({ length: TOTAL_STEPS }, (_, i) => i + 1).map((s) => (
          <div key={s} className={`flex flex-col items-center gap-1 flex-1 ${s < step ? "opacity-100" : s === step ? "opacity-100" : "opacity-40"}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 ${
              s < step ? "bg-primary text-primary-foreground" :
              s === step ? "bg-primary text-primary-foreground ring-4 ring-primary/20" :
              "bg-muted text-muted-foreground"
            }`}>
              {s < step ? <CheckCircle size={14} /> : s}
            </div>
            <span className="text-[10px] text-center text-muted-foreground hidden sm:block leading-tight">
              {t(`steps.${s}`)}
            </span>
          </div>
        ))}
      </div>
      <div className="h-1.5 bg-muted rounded-full overflow-hidden">
        <motion.div
          className="h-full bg-gradient-to-r from-primary to-accent rounded-full"
          animate={{ width: `${((step - 1) / (TOTAL_STEPS - 1)) * 100}%` }}
          transition={{ duration: 0.4 }}
        />
      </div>
    </div>
  );
}

/* ── Step components ────────────────────────────────────────────────── */

function Step1({ data, update, isRtl }: { data: FormData; update: (k: keyof FormData, v: unknown) => void; isRtl: boolean }): React.ReactElement {
  const { t } = useTranslation("join");
  return (
    <div className="space-y-4">
      <div className={gridCls}>
        <Field label={t("step1.fullNameAr")} required>
          <input value={data.full_name_ar} onChange={(e) => update("full_name_ar", e.target.value)}
            placeholder={t("step1.fullNameArPlaceholder")} className={inputCls} dir="rtl" required />
        </Field>
        <Field label={t("step1.fullNameEn")} required>
          <input value={data.full_name_en} onChange={(e) => update("full_name_en", e.target.value)}
            placeholder={t("step1.fullNameEnPlaceholder")} className={inputCls} dir="ltr" required />
        </Field>
      </div>
      <div className={gridCls}>
        <Field label={t("step1.dateOfBirth")} required>
          <input type="date" value={data.date_of_birth} onChange={(e) => update("date_of_birth", e.target.value)}
            max={new Date().toISOString().split("T")[0]} className={inputCls} dir="ltr" required />
        </Field>
        <Field label={t("step1.nationality")} required>
          <input value={data.nationality} onChange={(e) => update("nationality", e.target.value)}
            placeholder={isRtl ? "عراقي" : "Iraqi"} className={inputCls} required />
        </Field>
      </div>
      <div className={gridCls}>
        <Field label={t("step1.nationalId")}>
          <input value={data.national_id} onChange={(e) => update("national_id", e.target.value)}
            placeholder="XX-XXXXXXXXXX" className={inputCls} dir="ltr" />
        </Field>
        <Field label={t("step1.gender")} required>
          <div className="flex gap-3">
            {(["male", "female"] as const).map((g) => (
              <button key={g} type="button"
                onClick={() => update("gender", g)}
                className={`flex-1 py-2.5 rounded-xl border text-sm font-medium transition-all ${
                  data.gender === g ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:border-primary"
                }`}>
                {t(`step1.${g}`)}
              </button>
            ))}
          </div>
        </Field>
      </div>
    </div>
  );
}

function Step2({ data, update }: { data: FormData; update: (k: keyof FormData, v: unknown) => void }): React.ReactElement {
  const { t } = useTranslation("join");
  return (
    <div className="space-y-4">
      <div className={gridCls}>
        <Field label={t("step2.email")} required>
          <input type="email" value={data.email} onChange={(e) => update("email", e.target.value)}
            placeholder={t("step2.emailPlaceholder")} className={inputCls} dir="ltr" required />
        </Field>
        <Field label={t("step2.phonePrimary")} required>
          <input type="tel" value={data.phone_primary} onChange={(e) => update("phone_primary", e.target.value)}
            placeholder="+964 77X XXX XXXX" className={inputCls} dir="ltr" required />
        </Field>
      </div>
      <div className={gridCls}>
        <Field label={t("step2.phoneSecondary")}>
          <input type="tel" value={data.phone_secondary} onChange={(e) => update("phone_secondary", e.target.value)}
            placeholder="+964 ..." className={inputCls} dir="ltr" />
        </Field>
        <Field label={t("step2.governorate")} required>
          <select value={data.governorate} onChange={(e) => update("governorate", e.target.value)}
            className={inputCls} required>
            <option value="" disabled>{t("step2.governorate")}</option>
            {IRAQI_GOVERNORATES.map((g) => <option key={g} value={g}>{g}</option>)}
          </select>
        </Field>
      </div>
      <div className={gridCls}>
        <Field label={t("step2.city")} required>
          <input value={data.city} onChange={(e) => update("city", e.target.value)}
            placeholder="بعقوبة" className={inputCls} required />
        </Field>
        <Field label={t("step2.addressDetail")}>
          <input value={data.address_detail} onChange={(e) => update("address_detail", e.target.value)}
            placeholder="حي، شارع..." className={inputCls} />
        </Field>
      </div>
      <div className="pt-2 border-t border-border">
        <p className="text-sm font-semibold mb-3">{t("step2.emergencyContact")}</p>
        <div className={gridCls}>
          <Field label={t("step2.emergencyName")}>
            <input value={data.emergency_contact_name} onChange={(e) => update("emergency_contact_name", e.target.value)}
              className={inputCls} />
          </Field>
          <Field label={t("step2.emergencyPhone")}>
            <input type="tel" value={data.emergency_contact_phone}
              onChange={(e) => update("emergency_contact_phone", e.target.value)}
              className={inputCls} dir="ltr" />
          </Field>
        </div>
        <Field label={t("step2.emergencyRelation")}>
          <input value={data.emergency_contact_relation}
            onChange={(e) => update("emergency_contact_relation", e.target.value)}
            placeholder="أب، أم، أخ..." className={inputCls} />
        </Field>
      </div>
    </div>
  );
}

function Step3({ data, update }: { data: FormData; update: (k: keyof FormData, v: unknown) => void }): React.ReactElement {
  const { t } = useTranslation("join");
  const levels: EducationLevel[] = ["high_school", "diploma", "bachelor", "master", "phd", "other"];
  return (
    <div className="space-y-4">
      <div className={gridCls}>
        <Field label={t("step3.educationLevel")} required>
          <select value={data.education_level} onChange={(e) => update("education_level", e.target.value)}
            className={inputCls} required>
            <option value="" disabled>{t("step3.educationLevel")}</option>
            {levels.map((l) => <option key={l} value={l}>{t(`step3.levels.${l}`)}</option>)}
          </select>
        </Field>
        <Field label={t("step3.educationField")} required>
          <input value={data.education_field} onChange={(e) => update("education_field", e.target.value)}
            placeholder="هندسة، طب، إدارة..." className={inputCls} required />
        </Field>
      </div>
      <div className={gridCls}>
        <Field label={t("step3.institution")}>
          <input value={data.institution} onChange={(e) => update("institution", e.target.value)}
            placeholder="جامعة ديالى" className={inputCls} />
        </Field>
        <Field label={t("step3.graduationYear")}>
          <input type="number" value={data.graduation_year}
            onChange={(e) => update("graduation_year", e.target.value)}
            min={1970} max={2030} placeholder="2020" className={inputCls} dir="ltr" />
        </Field>
      </div>
      <div className={gridCls}>
        <Field label={t("step3.currentEmployer")}>
          <input value={data.current_employer} onChange={(e) => update("current_employer", e.target.value)}
            placeholder="اسم الجهة..." className={inputCls} />
        </Field>
        <Field label={t("step3.currentPosition")}>
          <input value={data.current_position} onChange={(e) => update("current_position", e.target.value)}
            placeholder="مدير، مهندس، معلم..." className={inputCls} />
        </Field>
      </div>
      <Field label={t("step3.yearsOfExperience")}>
        <input type="number" value={data.years_of_experience}
          onChange={(e) => update("years_of_experience", e.target.value)}
          min={0} max={50} placeholder="0" className={`${inputCls} max-w-[180px]`} dir="ltr" />
      </Field>
    </div>
  );
}

function Step4({ data, update }: { data: FormData; update: (k: keyof FormData, v: unknown) => void }): React.ReactElement {
  const { t } = useTranslation("join");
  const areaKeys = ["water_management","environmental","community","research","education","health","media","legal","admin","fundraising"];

  function toggleArea(area: string): void {
    const cur = data.areas_of_interest;
    update("areas_of_interest", cur.includes(area) ? cur.filter((a) => a !== area) : [...cur, area]);
  }

  return (
    <div className="space-y-5">
      <Field label={t("step4.skills")}>
        <TagInput tags={data.skills} onChange={(v) => update("skills", v)} placeholder={t("step4.skillsPlaceholder")} />
      </Field>
      <Field label={t("step4.languages")}>
        <TagInput tags={data.languages} onChange={(v) => update("languages", v)} placeholder={t("step4.languagesPlaceholder")} />
      </Field>
      <Field label={t("step4.areasOfInterest")}>
        <div className="flex flex-wrap gap-2 pt-1">
          {areaKeys.map((area) => (
            <button key={area} type="button" onClick={() => toggleArea(area)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                data.areas_of_interest.includes(area)
                  ? "bg-primary text-primary-foreground border-primary"
                  : "border-border text-muted-foreground hover:border-primary hover:text-primary"
              }`}>
              {t(`step4.areas.${area}`)}
            </button>
          ))}
        </div>
      </Field>
      <div className={gridCls}>
        <Field label={t("step4.availableDays")}>
          <select value={data.available_days_per_week} onChange={(e) => update("available_days_per_week", e.target.value)} className={inputCls}>
            <option value="">—</option>
            {[1,2,3,4,5,6,7].map((d) => <option key={d} value={d}>{d}</option>)}
          </select>
        </Field>
        <Field label={t("step4.availableHours")}>
          <select value={data.available_hours_per_day} onChange={(e) => update("available_hours_per_day", e.target.value)} className={inputCls}>
            <option value="">—</option>
            {[1,2,3,4,5,6,7,8].map((h) => <option key={h} value={h}>{h}</option>)}
          </select>
        </Field>
      </div>
      <Field label={t("step4.expertiseDesc")}>
        <textarea rows={3} value={data.expertise_description}
          onChange={(e) => update("expertise_description", e.target.value)}
          placeholder={t("step4.expertiseDescPlaceholder")}
          className={`${inputCls} resize-none`} />
      </Field>
    </div>
  );
}

function Step5({ data, update }: { data: FormData; update: (k: keyof FormData, v: unknown) => void }): React.ReactElement {
  const { t } = useTranslation("join");
  const howHeardOptions = ["social_media","friend","event","media","website","other"];

  return (
    <div className="space-y-5">
      <Field label={t("step5.motivation")} required hint={t("step5.motivationHint")}>
        <textarea rows={5} value={data.motivation_statement}
          onChange={(e) => update("motivation_statement", e.target.value)}
          placeholder={t("step5.motivationPlaceholder")}
          className={`${inputCls} resize-none`} required />
      </Field>
      <Field label={t("step5.previousVolunteering")}>
        <textarea rows={3} value={data.previous_volunteering}
          onChange={(e) => update("previous_volunteering", e.target.value)}
          placeholder={t("step5.previousVolunteeringPlaceholder")}
          className={`${inputCls} resize-none`} />
      </Field>
      <Field label={t("step5.howHeard")}>
        <div className="flex flex-wrap gap-2">
          {howHeardOptions.map((opt) => (
            <button key={opt} type="button"
              onClick={() => update("how_heard_about_us", opt)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                data.how_heard_about_us === opt
                  ? "bg-primary text-primary-foreground border-primary"
                  : "border-border text-muted-foreground hover:border-primary"
              }`}>
              {t(`step5.howHeardOptions.${opt}`)}
            </button>
          ))}
        </div>
      </Field>
      <div className="space-y-3 pt-2 border-t border-border">
        <p className="text-sm font-semibold">{t("step5.references")}</p>
        {/* Reference 1 */}
        <div className="p-4 rounded-2xl bg-muted/50 space-y-3">
          <p className="text-xs text-muted-foreground font-medium">1</p>
          <div className={gridCls}>
            <Field label={t("step5.referenceName")}>
              <input value={data.reference_1_name} onChange={(e) => update("reference_1_name", e.target.value)} className={inputCls} />
            </Field>
            <Field label={t("step5.referencePhone")}>
              <input type="tel" value={data.reference_1_phone} onChange={(e) => update("reference_1_phone", e.target.value)} className={inputCls} dir="ltr" />
            </Field>
          </div>
          <Field label={t("step5.referenceRelation")}>
            <input value={data.reference_1_relation} onChange={(e) => update("reference_1_relation", e.target.value)}
              placeholder="زميل، مشرف..." className={inputCls} />
          </Field>
        </div>
        {/* Reference 2 */}
        <div className="p-4 rounded-2xl bg-muted/50 space-y-3">
          <p className="text-xs text-muted-foreground font-medium">2</p>
          <div className={gridCls}>
            <Field label={t("step5.referenceName")}>
              <input value={data.reference_2_name} onChange={(e) => update("reference_2_name", e.target.value)} className={inputCls} />
            </Field>
            <Field label={t("step5.referencePhone")}>
              <input type="tel" value={data.reference_2_phone} onChange={(e) => update("reference_2_phone", e.target.value)} className={inputCls} dir="ltr" />
            </Field>
          </div>
          <Field label={t("step5.referenceRelation")}>
            <input value={data.reference_2_relation} onChange={(e) => update("reference_2_relation", e.target.value)}
              placeholder="زميل، مشرف..." className={inputCls} />
          </Field>
        </div>
      </div>
    </div>
  );
}

function Step6({ data, update }: { data: FormData; update: (k: keyof FormData, v: unknown) => void }): React.ReactElement {
  const { t } = useTranslation("join");
  const today = new Date().toLocaleDateString("ar-IQ");

  return (
    <div className="space-y-5">
      {/* Terms */}
      <div className="p-5 rounded-2xl border border-border bg-muted/30">
        <p className="font-semibold mb-2 flex items-center gap-2">
          <FileText size={16} className="text-primary" />
          {t("step6.termsTitle")}
        </p>
        <p className="text-sm text-muted-foreground leading-relaxed mb-4">{t("step6.termsBody")}</p>
        <label className="flex items-start gap-3 cursor-pointer">
          <input type="checkbox" checked={data.agrees_to_terms}
            onChange={(e) => update("agrees_to_terms", e.target.checked)}
            className="mt-0.5 w-4 h-4 rounded border-border text-primary" />
          <span className="text-sm font-medium">{t("step6.agreeTerms")}</span>
        </label>
      </div>

      {/* Code of conduct */}
      <div className="p-5 rounded-2xl border border-border bg-muted/30">
        <p className="font-semibold mb-2 flex items-center gap-2">
          <Shield size={16} className="text-primary" />
          {t("step6.codeTitle")}
        </p>
        <p className="text-sm text-muted-foreground leading-relaxed mb-4">{t("step6.codeBody")}</p>
        <label className="flex items-start gap-3 cursor-pointer">
          <input type="checkbox" checked={data.agrees_to_code_of_conduct}
            onChange={(e) => update("agrees_to_code_of_conduct", e.target.checked)}
            className="mt-0.5 w-4 h-4 rounded border-border text-primary" />
          <span className="text-sm font-medium">{t("step6.agreeCode")}</span>
        </label>
      </div>

      {/* Signature date */}
      <div className="p-4 rounded-2xl border border-border bg-card flex items-center justify-between">
        <span className="text-sm text-muted-foreground">{t("step6.signatureDate")}</span>
        <span className="font-semibold text-sm">{today}</span>
      </div>
    </div>
  );
}

/* ── Success screen ─────────────────────────────────────────────────── */
function SuccessScreen({ appNumber, onReset }: { appNumber: string; onReset: () => void }): React.ReactElement {
  const { t, i18n } = useTranslation("join");
  const isRtl = i18n.dir() === "rtl";
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="text-center py-10 max-w-lg mx-auto"
    >
      <div className="w-24 h-24 rounded-3xl bg-emerald-100 dark:bg-emerald-900/30 mx-auto mb-6 flex items-center justify-center">
        <CheckCircle size={44} className="text-emerald-600" />
      </div>
      <h2 className="font-display text-2xl font-bold mb-2">{t("success.title")}</h2>
      <p className="text-muted-foreground mb-6">{t("success.subtitle")}</p>

      {/* Application number */}
      <div className="inline-flex flex-col items-center gap-1 px-8 py-4 rounded-2xl bg-primary/10 border border-primary/20 mb-8">
        <span className="text-xs text-muted-foreground">{t("success.applicationNumber")}</span>
        <span className="font-display text-2xl font-black text-primary tracking-widest" dir="ltr">{appNumber}</span>
      </div>

      {/* What next */}
      <div className="text-start p-5 rounded-2xl border border-border bg-muted/30 mb-6">
        <p className="font-semibold mb-3">{t("success.whatNext")}</p>
        <ol className="space-y-2">
          {[1, 2, 3].map((s) => (
            <li key={s} className="flex items-start gap-3 text-sm text-muted-foreground">
              <span className="w-5 h-5 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">{s}</span>
              {t(`success.steps.${s}`)}
            </li>
          ))}
        </ol>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <Link to="/"
          className="px-6 py-2.5 rounded-full bg-primary text-primary-foreground font-semibold text-sm hover:bg-primary-dark transition-colors inline-flex items-center gap-2">
          {isRtl ? <ArrowRight size={14} /> : <ArrowLeft size={14} />}
          {t("success.goHome")}
        </Link>
        <button onClick={onReset}
          className="px-6 py-2.5 rounded-full border border-border text-sm font-medium hover:bg-muted transition-colors">
          {t("success.newApp")}
        </button>
      </div>
    </motion.div>
  );
}

/* ── JoinPage ───────────────────────────────────────────────────────── */
export default function JoinPage(): React.ReactElement {
  const { t, i18n } = useTranslation(["join", "common"]);
  const isRtl = i18n.dir() === "rtl";
  const formRef = useRef<HTMLFormElement>(null);

  const [step, setStep] = useState(1);
  const [data, setData] = useState<FormData>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? { ...INITIAL_DATA, ...JSON.parse(saved) } : INITIAL_DATA;
    } catch { return INITIAL_DATA; }
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [appNumber, setAppNumber] = useState<string | null>(null);

  // Auto-save draft
  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); } catch { /* ignore */ }
  }, [data]);

  const update = useCallback((key: keyof FormData, value: unknown): void => {
    setData((prev) => ({ ...prev, [key]: value }));
  }, []);

  function validateStep(s: number): string | null {
    if (s === 1) {
      if (!data.full_name_ar.trim()) return t("validation.required");
      if (!data.full_name_en.trim()) return t("validation.required");
      if (!data.date_of_birth) return t("validation.required");
      if (!data.gender) return t("validation.required");
    }
    if (s === 2) {
      if (!data.email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) return t("validation.invalidEmail");
      if (!data.phone_primary.trim()) return t("validation.required");
      if (!data.governorate) return t("validation.required");
      if (!data.city.trim()) return t("validation.required");
    }
    if (s === 3) {
      if (!data.education_level) return t("validation.required");
      if (!data.education_field.trim()) return t("validation.required");
    }
    if (s === 5) {
      const words = data.motivation_statement.trim().split(/\s+/).length;
      if (words < 30) return t("validation.minWords", { min: 30 });
    }
    if (s === 6) {
      if (!data.agrees_to_terms) return t("validation.mustAgree");
      if (!data.agrees_to_code_of_conduct) return t("validation.mustAgree");
    }
    return null;
  }

  const [stepError, setStepError] = useState<string | null>(null);

  function handleNext(): void {
    const err = validateStep(step);
    if (err) { setStepError(err); return; }
    setStepError(null);
    setStep((s) => Math.min(s + 1, TOTAL_STEPS));
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function handlePrev(): void {
    setStepError(null);
    setStep((s) => Math.max(s - 1, 1));
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function handleSubmit(e: React.FormEvent): Promise<void> {
    e.preventDefault();
    const err = validateStep(6);
    if (err) { setStepError(err); return; }
    setSubmitting(true);
    setSubmitError(null);

    try {
      const payload = {
        membership_type:             data.membership_type,
        full_name_ar:                data.full_name_ar,
        full_name_en:                data.full_name_en,
        date_of_birth:               data.date_of_birth,
        nationality:                 data.nationality,
        national_id:                 data.national_id || null,
        gender:                      data.gender || null,
        email:                       data.email,
        phone_primary:               data.phone_primary,
        phone_secondary:             data.phone_secondary || null,
        governorate:                 data.governorate,
        city:                        data.city,
        address_detail:              data.address_detail || null,
        emergency_contact_name:      data.emergency_contact_name || null,
        emergency_contact_phone:     data.emergency_contact_phone || null,
        emergency_contact_relation:  data.emergency_contact_relation || null,
        education_level:             data.education_level as EducationLevel,
        education_field:             data.education_field || null,
        institution:                 data.institution || null,
        graduation_year:             data.graduation_year ? Number(data.graduation_year) : null,
        current_employer:            data.current_employer || null,
        current_position:            data.current_position || null,
        years_of_experience:         data.years_of_experience ? Number(data.years_of_experience) : null,
        skills:                      data.skills.length > 0 ? data.skills : null,
        languages:                   data.languages.length > 0 ? data.languages : null,
        areas_of_interest:           data.areas_of_interest.length > 0 ? data.areas_of_interest : null,
        expertise_description:       data.expertise_description || null,
        available_days_per_week:     data.available_days_per_week ? Number(data.available_days_per_week) : null,
        available_hours_per_day:     data.available_hours_per_day ? Number(data.available_hours_per_day) : null,
        motivation_statement:        data.motivation_statement,
        previous_volunteering:       data.previous_volunteering || null,
        how_heard_about_us:          data.how_heard_about_us || null,
        reference_1_name:            data.reference_1_name || null,
        reference_1_phone:           data.reference_1_phone || null,
        reference_1_relation:        data.reference_1_relation || null,
        reference_2_name:            data.reference_2_name || null,
        reference_2_phone:           data.reference_2_phone || null,
        reference_2_relation:        data.reference_2_relation || null,
        agrees_to_terms:             data.agrees_to_terms,
        agrees_to_code_of_conduct:   data.agrees_to_code_of_conduct,
        signature_date:              new Date().toISOString().split("T")[0],
      };

      const { data: result, error } = await supabase
        .from("membership_applications")
        .insert(payload)
        .select("application_number")
        .single();

      if (error) throw error;

      localStorage.removeItem(STORAGE_KEY);
      setAppNumber(result?.application_number ?? "DRF-PENDING");
    } catch (err) {
      setSubmitError(isRtl ? "حدث خطأ أثناء الإرسال، يرجى المحاولة مرة أخرى." : "Submission failed. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  function resetForm(): void {
    setData(INITIAL_DATA);
    setStep(1);
    setAppNumber(null);
    setSubmitError(null);
    localStorage.removeItem(STORAGE_KEY);
  }

  const membershipTypes: MembershipType[] = ["regular", "founding", "student", "honorary"];

  return (
    <div dir={isRtl ? "rtl" : "ltr"}>
      <PageHero
        eyebrow={isRtl ? "عضوية رسمية" : "Official Membership"}
        titleKey="join:hero.title"
        subtitleKey="join:hero.subtitle"
        gradient="from-accent/20 via-background to-background"
      />

      <section className="section-padding bg-background">
        <div className="container mx-auto px-4 md:px-8 max-w-3xl">

          {appNumber ? (
            <SuccessScreen appNumber={appNumber} onReset={resetForm} />
          ) : (
            <>
              {/* ── Membership type selector (above form) ── */}
              {step === 1 && (
                <motion.div
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mb-8"
                >
                  <p className="text-center font-display text-lg font-bold mb-1">{t("types.title")}</p>
                  <p className="text-center text-sm text-muted-foreground mb-5">{t("types.subtitle")}</p>
                  <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
                    {membershipTypes.map((type) => {
                      const cfg = TYPE_CONFIG[type];
                      const Icon = cfg.icon;
                      return (
                        <button
                          key={type}
                          type="button"
                          onClick={() => update("membership_type", type)}
                          className={`relative flex flex-col items-center text-center p-4 rounded-2xl border-2 transition-all duration-200 ${
                            data.membership_type === type
                              ? "border-primary bg-primary/5 shadow-sm"
                              : "border-border hover:border-primary/40"
                          }`}
                        >
                          {(t(`types.${type}.badge`, { defaultValue: "" })) && (
                            <span className="absolute -top-2 start-1/2 -translate-x-1/2 rtl:translate-x-1/2 px-2 py-0.5 rounded-full bg-accent text-accent-foreground text-[9px] font-bold whitespace-nowrap">
                              {t(`types.${type}.badge`)}
                            </span>
                          )}
                          <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${cfg.gradient} flex items-center justify-center mb-2`}>
                            <Icon size={18} className="text-white" />
                          </div>
                          <p className="font-semibold text-sm">{t(`types.${type}.title`)}</p>
                          <p className="text-[11px] text-muted-foreground mt-1 leading-tight">{t(`types.${type}.desc`)}</p>
                        </button>
                      );
                    })}
                  </div>
                </motion.div>
              )}

              {/* ── Form card ── */}
              <div className="glass-card rounded-3xl p-6 md:p-8 border border-border shadow-glass">
                <ProgressBar step={step} />

                <form ref={formRef} onSubmit={handleSubmit} noValidate>
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={step}
                      initial={{ opacity: 0, x: isRtl ? -20 : 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: isRtl ? 20 : -20 }}
                      transition={{ duration: 0.3 }}
                    >
                      <h2 className="font-display text-lg font-bold mb-5 flex items-center gap-2">
                        <span className="w-7 h-7 rounded-lg bg-primary/10 text-primary text-sm font-bold flex items-center justify-center">{step}</span>
                        {t(`steps.${step}`)}
                      </h2>

                      {step === 1 && <Step1 data={data} update={update} isRtl={isRtl} />}
                      {step === 2 && <Step2 data={data} update={update} />}
                      {step === 3 && <Step3 data={data} update={update} />}
                      {step === 4 && <Step4 data={data} update={update} />}
                      {step === 5 && <Step5 data={data} update={update} />}
                      {step === 6 && <Step6 data={data} update={update} />}
                    </motion.div>
                  </AnimatePresence>

                  {/* Step error */}
                  {stepError && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="flex items-center gap-2 mt-4 p-3 rounded-xl bg-destructive/10 text-destructive text-sm"
                    >
                      <AlertCircle size={15} />
                      {stepError}
                    </motion.div>
                  )}

                  {/* Submit error */}
                  {submitError && (
                    <div className="flex items-center gap-2 mt-4 p-3 rounded-xl bg-destructive/10 text-destructive text-sm">
                      <AlertCircle size={15} />
                      {submitError}
                    </div>
                  )}

                  {/* Navigation buttons */}
                  <div className="flex items-center justify-between mt-8 pt-5 border-t border-border">
                    <button
                      type="button"
                      onClick={handlePrev}
                      disabled={step === 1}
                      className="flex items-center gap-2 px-5 py-2.5 rounded-full border border-border text-sm font-medium disabled:opacity-40 hover:bg-muted transition-colors"
                    >
                      {isRtl ? <ChevronRight size={15} /> : <ChevronLeft size={15} />}
                      {t("navigation.prev")}
                    </button>

                    <div className="flex items-center gap-2">
                      {/* Save draft indicator */}
                      <span className="hidden sm:flex items-center gap-1 text-xs text-muted-foreground">
                        <Save size={11} />
                        {isRtl ? "محفوظ تلقائياً" : "Auto-saved"}
                      </span>

                      {step < TOTAL_STEPS ? (
                        <button
                          type="button"
                          onClick={handleNext}
                          className="flex items-center gap-2 px-6 py-2.5 rounded-full bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary-dark transition-colors"
                        >
                          {t("navigation.next")}
                          {isRtl ? <ChevronLeft size={15} /> : <ChevronRight size={15} />}
                        </button>
                      ) : (
                        <button
                          type="submit"
                          disabled={submitting || !data.agrees_to_terms || !data.agrees_to_code_of_conduct}
                          className="flex items-center gap-2 px-7 py-2.5 rounded-full bg-accent text-accent-foreground text-sm font-bold hover:bg-accent-dark disabled:opacity-50 transition-colors"
                        >
                          <Sparkles size={15} />
                          {submitting
                            ? (isRtl ? "جاري الإرسال..." : "Submitting...")
                            : t("step6.submit")}
                        </button>
                      )}
                    </div>
                  </div>
                </form>
              </div>
            </>
          )}
        </div>
      </section>
    </div>
  );
}
