/**
 * MemberVerificationPage.tsx
 * --------------------------
 * Official Public Membership Card Verification Portal for Diyala River Foundation.
 * 
 * Accessible to any citizen, authority, partner, or inspector scanning the QR code
 * on the digital or printed membership card:
 *   /verify/member/:membershipNumber
 *   /verify-member/:membershipNumber
 * 
 * Invokes the secure public RPC `verify_membership(search_identifier)` which:
 *  • Validates official foundation records
 *  • Confirms active, suspended, expired, or non-existent status
 *  • Displays the official personal photo, full name, role, tier, and dates
 *  • Provides verification timestamp and cryptographic authenticity seal
 */

import React, { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  ShieldCheck, AlertTriangle, XCircle, Search, CheckCircle2,
  Calendar, Award, RefreshCw, Copy, Check, Share2,
  Printer, Building2, Clock, HelpCircle
} from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import type { MemberVerificationResult } from "@/types/database.types";
import { generateQrDataUrl, getMemberVerificationUrl, OFFICIAL_DOMAIN } from "@/lib/membershipExport";

export default function MemberVerificationPage(): React.ReactElement {
  const { membershipNumber } = useParams<{ membershipNumber?: string }>();
  const navigate = useNavigate();

  const [inputVal, setInputVal] = useState<string>(membershipNumber ?? "");
  const [loading, setLoading] = useState<boolean>(false);
  const [result, setResult] = useState<MemberVerificationResult | null>(null);
  const [qrCodeUrl, setQrCodeUrl] = useState<string>("");
  const [copied, setCopied] = useState<boolean>(false);
  const [searchedId, setSearchedId] = useState<string>(membershipNumber ?? "");

  const performVerification = useCallback(async (id: string) => {
    const trimmed = id.trim();
    if (!trimmed) {
      setResult(null);
      return;
    }
    setLoading(true);
    setSearchedId(trimmed);

    try {
      const { data, error } = await supabase.rpc("verify_membership", {
        search_identifier: trimmed,
      });

      if (error) {
        console.error("Verification RPC error:", error);
        setResult({
          is_valid: false,
          status: "error",
          message: "تعذر الاتصال بخادم التحقق المركزي، يرجى المحاولة بعد قليل.",
        });
      } else {
        const res = data as MemberVerificationResult;
        setResult(res);

        // Generate verification page QR code for sharing
        const publicVerifyUrl = getMemberVerificationUrl(res.membership_number || trimmed);
        void generateQrDataUrl(publicVerifyUrl).then(setQrCodeUrl);
      }
    } catch (err) {
      console.error("Unexpected error during verification:", err);
      setResult({
        is_valid: false,
        status: "error",
        message: "حدث خطأ غير متوقع أثناء فحص السجل.",
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (membershipNumber) {
      setInputVal(membershipNumber);
      void performVerification(membershipNumber);
    }
  }, [membershipNumber, performVerification]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputVal.trim()) return;
    navigate(`/verify/member/${encodeURIComponent(inputVal.trim())}`);
  };

  const copyLink = () => {
    const targetUrl = searchedId
      ? getMemberVerificationUrl(result?.membership_number || searchedId)
      : `${OFFICIAL_DOMAIN}/verify`;
    void navigator.clipboard.writeText(targetUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const shareVerification = async () => {
    const targetUrl = searchedId
      ? getMemberVerificationUrl(result?.membership_number || searchedId)
      : `${OFFICIAL_DOMAIN}/verify`;
    if (navigator.share && result) {
      try {
        await navigator.share({
          title: `التحقق من عضوية ${result.full_name_ar ?? "مؤسسة نهر ديالى"}`,
          text: `نتيجة الفحص الرقمي الرسمي لبطاقة عضوية مؤسسة نهر ديالى للتنمية المستدامة: ${result.membership_number}`,
          url: targetUrl,
        });
      } catch {
        copyLink();
      }
    } else {
      copyLink();
    }
  };

  const printVerificationDoc = () => {
    window.print();
  };

  const tierLabels: Record<string, string> = {
    regular: "عضوية عادية",
    founding: "عضوية مؤسس",
    honorary: "عضوية فخرية",
    student: "عضوية طلابية",
  };

  const roleLabels: Record<string, string> = {
    board: "مجلس الإدارة",
    management: "الإدارة التنفيذية",
    advisor: "مستشار رسمي",
    staff: "الكادر التنفيذي",
    member: "عضو الهيئة العامة",
  };

  return (
    <div dir="rtl" className="min-h-screen bg-linear-to-b from-background via-muted/20 to-background py-10 px-4 sm:px-6">
      <div className="max-w-3xl mx-auto space-y-8">

        {/* ── Official Institutional Header ── */}
        <header className="text-center space-y-3">


          <div className="flex items-center justify-center gap-3 pt-2">
            <img
              src="/logo.png"
              alt="Diyala River Foundation Logo"
              className="w-14 h-14 sm:w-16 sm:h-16 object-contain drop-shadow-md"
              onError={(e) => { e.currentTarget.style.display = "none"; }}
            />
            <div className="text-start">
              <h1 className="font-display font-black text-lg sm:text-2xl text-foreground leading-tight">
                مؤسسة نهر ديالى للتنمية المستدامة
              </h1>
              <p className="text-[11px] sm:text-xs text-muted-foreground font-mono font-medium tracking-wide">
                DIYALA RIVER FOUNDATION FOR SUSTAINABLE DEVELOPMENT
              </p>
            </div>
          </div>
          <p className="text-xs text-muted-foreground max-w-lg mx-auto leading-relaxed">
            منصة الفحص الإلكتروني المعتمدة لمطابقة وتأكيد صحة بطاقات العضوية الصادرة عن المؤسسة لمنع التزوير وحماية الصفة التمثيلية.
          </p>
        </header>

        {/* ── Search / Input Bar ── */}
        <div className="bg-card border border-border rounded-3xl p-3 sm:p-4 shadow-sm">
          <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1">
              <Search size={16} className="absolute top-1/2 -translate-y-1/2 start-3.5 text-muted-foreground" />
              <input
                type="text"
                value={inputVal}
                onChange={(e) => setInputVal(e.target.value)}
                placeholder="أدخل رقم العضوية المعتمد (مثال: DRF-MEM-...)"
                className="w-full ps-10 pe-4 py-2.5 rounded-2xl border border-border bg-background text-xs sm:text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary shadow-inner"
                dir="ltr"
              />
            </div>
            <button
              type="submit"
              disabled={loading || !inputVal.trim()}
              className="px-6 py-2.5 rounded-2xl bg-primary text-primary-foreground font-bold text-xs sm:text-sm hover:bg-primary-dark transition-all disabled:opacity-60 flex items-center justify-center gap-2 shadow-sm"
            >
              {loading ? (
                <>
                  <RefreshCw size={15} className="animate-spin" />
                  <span>جاري الفحص...</span>
                </>
              ) : (
                <>
                  <ShieldCheck size={16} />
                  <span>فحص البطاقة</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* ── Verification Result Screen ── */}
        <AnimatePresence mode="wait">
          {loading ? (
            <motion.div
              key="loading"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="bg-card border border-border rounded-3xl p-10 text-center space-y-4 shadow-sm"
            >
              <div className="w-14 h-14 mx-auto rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center">
                <RefreshCw size={26} className="animate-spin text-primary" />
              </div>
              <h2 className="font-display font-bold text-base text-foreground">جاري فحص السجلات الرسمية...</h2>
              <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                يتم الآن مطابقة الرمز المدخل مع قاعدة البيانات المركزية ومراجعة سريان الصلاحية وحالة العضوية.
              </p>
            </motion.div>
          ) : result ? (
            result.is_valid && result.status === "valid_active" ? (
              /* ── 1. Valid Active Member Card ── */
              <motion.div
                key="valid"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-card border-2 border-emerald-500/40 rounded-3xl overflow-hidden shadow-xl"
              >
                {/* Official Verification Banner */}
                <div className="bg-linear-to-r from-emerald-700 via-emerald-600 to-teal-700 text-white px-6 py-4 flex items-center justify-between flex-wrap gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center shrink-0 border border-white/30">
                      <CheckCircle2 size={22} className="text-white" />
                    </div>
                    <div>
                      <h2 className="font-display font-black text-sm sm:text-base tracking-tight">
                        عضوية رسمية معتمدة وسارية المفعول
                      </h2>
                      <p className="text-[11px] text-emerald-100">
                        تم التحقق رقمياً ومطابقة بيانات العضو مع السجل المركزي للمؤسسة
                      </p>
                    </div>
                  </div>

                  <span className="text-[10.5px] font-bold px-3 py-1 rounded-full bg-white/20 border border-white/30 backdrop-blur-sm">
                    موثق بنجاح ✓
                  </span>
                </div>

                {/* Member Profile Display */}
                <div className="p-6 sm:p-8 space-y-6">
                  <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
                    {/* Avatar with emerald frame */}
                    <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl border-3 border-emerald-500 bg-muted/40 shadow-md overflow-hidden shrink-0 flex items-center justify-center font-display font-black text-3xl text-primary relative">
                      {result.avatar_path ? (
                        <img
                          src={result.avatar_path}
                          alt={result.full_name_ar ?? "صورة العضو"}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        (result.full_name_ar || "?").charAt(0)
                      )}
                    </div>

                    {/* Member Details */}
                    <div className="text-center sm:text-start flex-1 min-w-0 space-y-1.5">
                      <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                        <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20">
                          {roleLabels[result.role ?? ""] ?? result.title_ar ?? "عضو"}
                        </span>
                        <span className="text-[11px] font-medium px-2.5 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                          {tierLabels[result.membership_tier ?? ""] ?? "عضوية معتمدة"}
                        </span>
                      </div>

                      <h3 className="font-display font-black text-xl sm:text-2xl text-foreground">
                        {result.full_name_ar}
                      </h3>

                      {result.full_name_en && (
                        <p className="text-xs text-muted-foreground font-medium capitalize font-mono">
                          {result.full_name_en}
                        </p>
                      )}

                      <p className="text-xs font-semibold text-primary pt-1">
                        {result.title_ar || "عضو معتمد في الهيئة العامة"}
                      </p>

                      {result.bio_ar && (
                        <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed pt-2">
                          {result.bio_ar}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Meta Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-4 border-t border-border/60">
                    <div className="p-3 rounded-2xl bg-muted/30 border border-border/50 flex items-center justify-between">
                      <div>
                        <p className="text-[10px] text-muted-foreground font-medium">رقم العضوية المعتمد</p>
                        <p className="font-mono font-bold text-sm text-foreground" dir="ltr">
                          {result.membership_number}
                        </p>
                      </div>
                      <button
                        onClick={copyLink}
                        className="p-2 rounded-xl hover:bg-muted text-muted-foreground hover:text-primary transition-colors"
                        title="نسخ رابط التحقق"
                      >
                        {copied ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
                      </button>
                    </div>

                    <div className="p-3 rounded-2xl bg-muted/30 border border-border/50 flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                        <Calendar size={15} className="text-primary" />
                      </div>
                      <div>
                        <p className="text-[10px] text-muted-foreground font-medium">تاريخ الانتساب / البدء</p>
                        <p className="font-bold text-xs text-foreground">
                          {result.membership_start_date
                            ? new Date(result.membership_start_date).toLocaleDateString("ar-IQ")
                            : "معتمد رسمياً"}
                        </p>
                      </div>
                    </div>

                    <div className="p-3 rounded-2xl bg-muted/30 border border-border/50 flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl bg-amber-500/10 flex items-center justify-center shrink-0">
                        <Clock size={15} className="text-amber-600 dark:text-amber-400" />
                      </div>
                      <div>
                        <p className="text-[10px] text-muted-foreground font-medium">صلاحية البطاقة</p>
                        <p className="font-bold text-xs text-foreground">
                          {result.membership_expires_at
                            ? new Date(result.membership_expires_at).toLocaleDateString("ar-IQ")
                            : "تجديد سنوي معتمد (سارية)"}
                        </p>
                      </div>
                    </div>

                    <div className="p-3 rounded-2xl bg-muted/30 border border-border/50 flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl bg-emerald-500/10 flex items-center justify-center shrink-0">
                        <Award size={15} className="text-emerald-600 dark:text-emerald-400" />
                      </div>
                      <div>
                        <p className="text-[10px] text-muted-foreground font-medium">نقاط النشاط والورش</p>
                        <p className="font-bold text-xs text-foreground">
                          {result.activity_score ?? 100} نقطة · {result.workshops_count ?? 0} ورشة ومهمة
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Verification Seal & Security Info */}
                  <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/40 flex items-center justify-between flex-wrap gap-4">
                    <div className="flex items-center gap-3">
                      {qrCodeUrl && (
                        <a
                          href={getMemberVerificationUrl(result.membership_number || searchedId)}
                          target="_blank"
                          rel="noreferrer"
                          title="فتح رابط التحقق الرسمي"
                          className="shrink-0 group"
                        >
                          <img
                            src={qrCodeUrl}
                            alt="QR Verification"
                            className="w-14 h-14 rounded-xl border border-emerald-300 dark:border-emerald-800 bg-white p-1 shadow-xs group-hover:scale-105 transition-transform"
                          />
                        </a>
                      )}
                      <div className="text-xs space-y-0.5">
                        <p className="font-bold text-emerald-900 dark:text-emerald-200 flex items-center gap-1">
                          <ShieldCheck size={14} className="text-emerald-600" /> ختم المصادقة الإلكترونية
                        </p>
                        <p className="text-[10.5px] text-emerald-800/80 dark:text-emerald-300/70">
                          رمز التحقق: <strong className="font-mono text-emerald-950 dark:text-emerald-100" dir="ltr">{result.membership_number}</strong>
                        </p>
                        <p className="text-[9.5px] text-muted-foreground">
                          وقت الفحص: {new Date().toLocaleString("ar-IQ")}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={shareVerification}
                        className="px-3 py-1.5 rounded-xl border border-emerald-300 dark:border-emerald-800 bg-white dark:bg-emerald-900/40 text-emerald-800 dark:text-emerald-200 text-xs font-bold hover:bg-emerald-100 dark:hover:bg-emerald-900/60 transition-colors flex items-center gap-1.5"
                      >
                        <Share2 size={13} /> مشاركة
                      </button>
                      <button
                        onClick={printVerificationDoc}
                        className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-colors flex items-center gap-1.5 shadow-2xs"
                      >
                        <Printer size={13} /> طباعة
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            ) : result.status?.startsWith("application_") ? (
              /* ── 2. Membership Application Under Review / Processing ── */
              <motion.div
                key="app_status"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-card border-2 border-blue-500/50 rounded-3xl p-6 sm:p-8 space-y-4 shadow-md text-center"
              >
                <div className="w-14 h-14 mx-auto rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
                  <Clock size={28} className="text-blue-500" />
                </div>
                <h2 className="font-display font-black text-lg text-foreground">
                  طلب انتساب وعضوية قيد المراجعة والتدقيق
                </h2>
                <div className="p-4 rounded-2xl bg-muted/40 border border-border/50 max-w-md mx-auto text-start space-y-2">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-muted-foreground font-medium">مقدم الطلب:</span>
                    <strong className="text-foreground">{result.full_name_ar || "—"}</strong>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-muted-foreground font-medium">رقم الطلب:</span>
                    <span className="font-mono font-bold text-foreground" dir="ltr">{result.membership_number || searchedId}</span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-muted-foreground font-medium">حالة الاستمارة:</span>
                    <span className="font-bold text-blue-600 dark:text-blue-400">
                      {result.status === "application_under_review" ? "تحت المراجعة والتدقيق" :
                       result.status === "application_waitlisted" ? "في قائمة الانتظار" :
                       result.status === "application_rejected" ? "طلب معتذر عن قبوله" :
                       "قيد الانتظار والمراجعة الإدارية"}
                    </span>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground max-w-md mx-auto leading-relaxed">
                  {result.message || "طلب العضوية مسجل في قاعدة البيانات المركزية ويخضع حالياً لإجراءات التدقيق والاعتماد الإداري من قبل أمانة شؤون العضوية."}
                </p>
                <div className="pt-2">
                  <Link
                    to="/contact"
                    className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-primary text-primary-foreground font-bold text-xs hover:bg-primary-dark transition-colors shadow-2xs"
                  >
                    التواصل مع لجنة العضوية
                  </Link>
                </div>
              </motion.div>
            ) : result.status === "inactive_suspended" ? (
              /* ── 3. Inactive or Suspended Member ── */
              <motion.div
                key="inactive"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-card border-2 border-amber-500/50 rounded-3xl p-6 sm:p-8 space-y-4 shadow-md text-center"
              >
                <div className="w-14 h-14 mx-auto rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
                  <AlertTriangle size={28} className="text-amber-500" />
                </div>
                <h2 className="font-display font-black text-lg text-foreground">
                  عضوية مسجلة ولكنها غير مفعلة حالياً
                </h2>
                <p className="text-xs text-muted-foreground max-w-md mx-auto leading-relaxed">
                  السجل التابع للرقم <strong className="font-mono text-foreground">{result.membership_number}</strong> ({result.full_name_ar}) مسجل في النظام ولكنه موقوف أو بانتظار التجديد الإداري.
                </p>
                <div className="pt-2">
                  <Link
                    to="/contact"
                    className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-amber-500 text-white font-bold text-xs hover:bg-amber-600 transition-colors shadow-2xs"
                  >
                    التواصل مع إدارة المؤسسة للاستفسار
                  </Link>
                </div>
              </motion.div>
            ) : result.status === "expired" ? (
              /* ── 3. Expired Membership ── */
              <motion.div
                key="expired"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-card border-2 border-destructive/50 rounded-3xl p-6 sm:p-8 space-y-4 shadow-md text-center"
              >
                <div className="w-14 h-14 mx-auto rounded-2xl bg-destructive/10 border border-destructive/20 flex items-center justify-center">
                  <Clock size={28} className="text-destructive" />
                </div>
                <h2 className="font-display font-black text-lg text-foreground">
                  عضوية منتهية الصلاحية
                </h2>
                <p className="text-xs text-muted-foreground max-w-md mx-auto leading-relaxed">
                  هذه العضوية ({result.full_name_ar}) انتهت صلاحيتها في {result.membership_expires_at ? new Date(result.membership_expires_at).toLocaleDateString("ar-IQ") : "سابقاً"} وتتطلب التجديد الرسمي.
                </p>
                <div className="pt-2">
                  <Link
                    to="/contact"
                    className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-destructive text-destructive-foreground font-bold text-xs hover:opacity-90 transition-colors shadow-2xs"
                  >
                    تجديد العضوية لدى المؤسسة
                  </Link>
                </div>
              </motion.div>
            ) : (
              /* ── 4. Not Found / Invalid ── */
              <motion.div
                key="not_found"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-card border-2 border-destructive/40 rounded-3xl p-6 sm:p-8 space-y-4 shadow-md text-center"
              >
                <div className="w-14 h-14 mx-auto rounded-2xl bg-destructive/10 border border-destructive/20 flex items-center justify-center">
                  <XCircle size={28} className="text-destructive" />
                </div>
                <h2 className="font-display font-black text-lg text-destructive">
                  بطاقة غير معتمدة أو رقم غير مسجل
                </h2>
                <p className="text-xs text-muted-foreground max-w-md mx-auto leading-relaxed">
                  لم يتم العثور على أي عضوية مسجلة أو معتمدة بالرقم <strong className="font-mono text-foreground">{searchedId}</strong> في السجلات الرسمية لمؤسسة نهر ديالى للتنمية المستدامة.
                </p>
                <div className="p-3 rounded-2xl bg-destructive/5 border border-destructive/20 max-w-md mx-auto text-[11px] text-destructive leading-relaxed">
                  ⚠️ <strong>تنبيه أمني:</strong> يرجى التحقق من أصل البطاقة لتجنب استخدام بطاقات مقلدة أو غير معتمدة رسمياً.
                </div>
              </motion.div>
            )
          ) : (
            /* ── Default Prompt when no search performed ── */
            <motion.div
              key="prompt"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="bg-card border border-border rounded-3xl p-8 text-center space-y-3 shadow-xs"
            >
              <div className="w-12 h-12 mx-auto rounded-2xl bg-muted/60 flex items-center justify-center text-muted-foreground">
                <HelpCircle size={24} />
              </div>
              <h3 className="font-display font-bold text-sm text-foreground">كيفية التحقق من بطاقة العضوية</h3>
              <p className="text-xs text-muted-foreground max-w-md mx-auto leading-relaxed">
                امسح رمز الاستجابة السريعة (QR Code) المطبوع على بطاقة العضوية باستخدام كاميرا هاتفك المحمول، وسيتم نقلك مباشرة إلى نتيجة الفحص الموثقة مع صورة العضو وبياناته الرسمية.
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Official Contact & Verification Support ── */}
        <footer className="border-t border-border/60 pt-6 text-center text-xs text-muted-foreground space-y-2">
          <p className="flex items-center justify-center gap-1 font-medium">
            <Building2 size={13} className="text-primary" />
            مؤسسة نهر ديالى للتنمية المستدامة — جمهورية العراق، محافظة ديالى
          </p>
          <div className="flex items-center justify-center gap-4 text-[11px] flex-wrap">
            <span>البريد الإلكتروني: <a href="mailto:info@diyalariver.org" className="text-primary hover:underline font-mono">info@diyalariver.org</a></span>
            <span>·</span>
            <span>الموقع الرسمي: <a href="https://diyalariver.org" className="text-primary hover:underline font-mono">diyalariver.org</a></span>
          </div>
          <p className="text-[10px] text-muted-foreground/70 pt-1">
            جميع الحقوق محفوظة © {new Date().getFullYear()} — منصة التحقق الرقمي المركزية
          </p>
        </footer>

      </div>
    </div>
  );
}
