/**
 * DigitalMemberCardModal.tsx
 * --------------------------
 * Official Digital Institutional Member Card Generator & Printer for Diyala River Foundation.
 * Redesigned to match the official institutional badge template (public/idArtboard 1.svg).
 * Features:
 *  • 100% Vector SVG fidelity (Vertical CR80 standard badge: 153.07 x 236.98)
 *  • Balanced typography preventing overlap on member portrait
 *  • High-DPI dynamic QR Code with direct public portal verification
 *  • Interactive photo upload, instant DB update, and real-time preview
 *  • Professional print engine for 54mm × 85.6mm ID card printers and A4 documents
 *  • Direct vector SVG / PDF export
 */

import React, { useState, useEffect, useRef, useMemo } from "react";
import { motion } from "framer-motion";
import {
  X,
  Printer,
  Download,
  Check,
  ShieldCheck,
  User,
  Camera,
  Loader2,
  ExternalLink,
  Copy,
  Image as ImageIcon,
} from "lucide-react";
import type { TeamMemberRow } from "@/types/database.types";
import { generateQrDataUrl, getMemberVerificationUrl } from "@/lib/membershipExport";
import { generateMemberIdCardSvg } from "@/lib/idCardSvgGenerator";
import { THMANYAH_EMBEDDED_FONTS_CSS } from "@/lib/thmanyahFontsBase64";
import { useImageUpload } from "@/hooks/useImageUpload";
import { supabase } from "@/lib/supabaseClient";

interface DigitalMemberCardModalProps {
  member: TeamMemberRow;
  onClose: () => void;
  onUpdate?: () => void;
}

export default function DigitalMemberCardModal({
  member,
  onClose,
  onUpdate,
}: DigitalMemberCardModalProps): React.ReactElement {
  const [qrUrl, setQrUrl] = useState<string>("");
  const [avatarPath, setAvatarPath] = useState<string | null>(member.avatar_path ?? null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [copied, setCopied] = useState(false);
  const [downloadingPng, setDownloadingPng] = useState(false);
  const { uploading, uploadImage } = useImageUpload("member-avatars");

  const memNumber =
    member.membership_number ||
    (member.id ? `DRF-MEM-${member.id.slice(0, 6).toUpperCase()}` : "DRF-MEM-OFFICIAL");
  const verifyUrl = getMemberVerificationUrl(memNumber);

  const joinDate = member.membership_start_date
    ? new Date(member.membership_start_date).toLocaleDateString("ar-IQ")
    : member.created_at
    ? new Date(member.created_at).toLocaleDateString("ar-IQ")
    : new Date().toLocaleDateString("ar-IQ");

  const expiryDate = member.membership_expires_at
    ? new Date(member.membership_expires_at).toLocaleDateString("ar-IQ")
    : "تجديد سنوي معتمد";

  useEffect(() => {
    void generateQrDataUrl(verifyUrl).then(setQrUrl);
  }, [verifyUrl]);

  async function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = await uploadImage(file);
    if (url) {
      if (member.id) {
        const { data } = await supabase
          .from("team_members")
          .update({ avatar_path: url })
          .eq("id", member.id)
          .select("id");
        if ((!data || data.length === 0) && member.membership_application_id) {
          await supabase
            .from("team_members")
            .update({ avatar_path: url })
            .eq("membership_application_id", member.membership_application_id);
        }
      } else if (member.membership_application_id) {
        await supabase
          .from("team_members")
          .update({ avatar_path: url })
          .eq("membership_application_id", member.membership_application_id);
      }
      setAvatarPath(url);
      onUpdate?.();
    }
  }

  // Generate vector SVG string matching idArtboard 1.svg
  const svgMarkup = useMemo(() => {
    return generateMemberIdCardSvg({
      fullNameAr: member.full_name_ar,
      fullNameEn: member.full_name_en,
      titleAr: member.title_ar || "عضو الهيئة العامة",
      titleEn: member.title_en || member.role || "General Member",
      membershipNumber: memNumber,
      joinDate,
      expiryDate,
      avatarPath,
      qrDataUrl: qrUrl,
    });
  }, [member, avatarPath, qrUrl, memNumber, joinDate, expiryDate]);

  // Print card at 54mm x 85.6mm standard vertical badge size with guaranteed font rendering
  const printCard = (): void => {
    const printWindow = window.open("", "_blank", "width=600,height=800");
    if (!printWindow) return;

    const html = `<!DOCTYPE html>
    <html dir="rtl" lang="ar">
    <head>
      <meta charset="UTF-8" />
      <title>بطاقة عضوية — ${member.full_name_ar}</title>
      <style>
        /* Exact local and origin font-face for maximum fidelity during print */
        @font-face {
          font-family: 'ThmanyahSans';
          src: url('${window.location.origin}/fonts/thmanyah/thmanyahsans-Bold.woff2') format('woff2');
          font-weight: 700;
          font-style: normal;
        }
        @font-face {
          font-family: 'ThmanyahSans';
          src: url('${window.location.origin}/fonts/thmanyah/thmanyahsans-Bold.woff2') format('woff2');
          font-weight: 800;
          font-style: normal;
        }
        @font-face {
          font-family: 'ThmanyahSans';
          src: url('${window.location.origin}/fonts/thmanyah/thmanyahsans-Medium.woff2') format('woff2');
          font-weight: 600;
          font-style: normal;
        }
        @font-face {
          font-family: 'ThmanyahSans';
          src: url('${window.location.origin}/fonts/thmanyah/thmanyahsans-Regular.woff2') format('woff2');
          font-weight: normal;
          font-style: normal;
        }
        @font-face {
          font-family: 'ThmanyahSerifDisplay';
          src: url('${window.location.origin}/fonts/thmanyah/thmanyahserifdisplay-Bold.woff2') format('woff2');
          font-weight: 700;
          font-style: normal;
        }
        @font-face {
          font-family: 'ThmanyahSerifDisplay';
          src: url('${window.location.origin}/fonts/thmanyah/thmanyahserifdisplay-Bold.woff2') format('woff2');
          font-weight: 800;
          font-style: normal;
        }
        @font-face {
          font-family: 'ThmanyahSerifDisplay';
          src: url('${window.location.origin}/fonts/thmanyah/thmanyahserifdisplay-Regular.woff2') format('woff2');
          font-weight: normal;
          font-style: normal;
        }

        ${THMANYAH_EMBEDDED_FONTS_CSS}

        @page {
          size: 54mm 85.6mm;
          margin: 0;
        }
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body {
          background: #ffffff;
          display: flex;
          align-items: center;
          justify-content: center;
          min-height: 100vh;
          margin: 0;
          padding: 0;
          font-family: 'ThmanyahSans', sans-serif;
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
        }
        .card-print-box {
          width: 54mm;
          height: 85.6mm;
          display: block;
        }
        .card-print-box svg {
          width: 100%;
          height: 100%;
          display: block;
        }
        @media screen {
          body {
            background: #f1f5f9;
            padding: 30px;
          }
          .card-print-box {
            box-shadow: 0 16px 40px rgba(0,0,0,0.18);
            border-radius: 8px;
            overflow: hidden;
            background: #ffffff;
          }
        }
        @media print {
          body {
            background: none;
            padding: 0;
            min-height: auto;
          }
          .card-print-box {
            box-shadow: none;
            border-radius: 0;
            page-break-inside: avoid;
            break-inside: avoid;
          }
        }
      </style>
    </head>
    <body>
      <div class="card-print-box">
        ${svgMarkup}
      </div>
      <script>
        async function triggerPrint() {
          try {
            if (document.fonts && document.fonts.ready) {
              await document.fonts.ready;
            }
          } catch (e) {
            console.warn(e);
          }
          setTimeout(() => {
            window.focus();
            window.print();
          }, 300);
        }
        if (document.readyState === 'complete') {
          triggerPrint();
        } else {
          window.addEventListener('load', triggerPrint);
        }
      </script>
    </body>
    </html>`;

    printWindow.document.write(html);
    printWindow.document.close();
  };

  // Download high-res vector SVG
  const downloadSvg = (): void => {
    const blob = new Blob([svgMarkup], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    const sanitizedName = member.full_name_ar.trim().replace(/\s+/g, "_");
    a.download = `DRF-ID-CARD-${sanitizedName}-${memNumber}.svg`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Download high-res PNG image (300+ DPI equivalent for digital card sharing)
  const downloadPng = async (): Promise<void> => {
    try {
      setDownloadingPng(true);
      if (document.fonts && document.fonts.ready) {
        await document.fonts.ready;
      }

      const scale = 6;
      const width = Math.round(153.07 * scale);
      const height = Math.round(236.98 * scale);

      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const img = new Image();
      const svgBlob = new Blob([svgMarkup], { type: "image/svg+xml;charset=utf-8" });
      const url = URL.createObjectURL(svgBlob);

      await new Promise<void>((resolve, reject) => {
        img.onload = () => {
          ctx.drawImage(img, 0, 0, width, height);
          URL.revokeObjectURL(url);
          resolve();
        };
        img.onerror = (e) => {
          URL.revokeObjectURL(url);
          reject(e);
        };
        img.src = url;
      });

      const pngUrl = canvas.toDataURL("image/png");
      const a = document.createElement("a");
      a.href = pngUrl;
      const sanitizedName = member.full_name_ar.trim().replace(/\s+/g, "_");
      a.download = `DRF-ID-CARD-${sanitizedName}-${memNumber}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch (err) {
      console.error("Failed to export PNG:", err);
    } finally {
      setDownloadingPng(false);
    }
  };

  const copyNumber = (): void => {
    void navigator.clipboard.writeText(memNumber);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/70 backdrop-blur-md z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto"
      dir="rtl"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.94, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        className="bg-card rounded-3xl border border-border w-full max-w-lg p-5 sm:p-6 shadow-2xl relative my-auto max-h-[92vh] overflow-y-auto"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-border/60">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-sky-500/10 text-[#119dd9] flex items-center justify-center shadow-inner">
              <ShieldCheck size={20} />
            </div>
            <div>
              <h3 className="font-display font-extrabold text-base text-foreground flex items-center gap-1.5">
                بطاقة العضوية المؤسسية المعتمدة
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/20">
                  CR80 عمودي
                </span>
              </h3>
              <p className="text-xs text-muted-foreground">
                Official Digital Member ID — Diyala River Foundation
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-muted text-muted-foreground transition-colors"
            title="إغلاق"
          >
            <X size={18} />
          </button>
        </div>

        {/* Vertical Digital ID Card Preview */}
        <div className="flex justify-center mb-5">
          <div className="relative w-full max-w-[290px] aspect-[153.07/236.98] rounded-2xl overflow-hidden shadow-2xl border border-slate-200/80 dark:border-slate-800 bg-white group select-none">
            {/* SVG Card Container */}
            <div
              className="w-full h-full [&>svg]:w-full [&>svg]:h-full [&>svg]:block"
              dangerouslySetInnerHTML={{ __html: svgMarkup }}
            />

            {/* Click-to-Upload Avatar Overlay over the exact photo box */}
            <div
              onClick={() => fileInputRef.current?.click()}
              title="اضغط لرفع أو تغيير الصورة الشخصية للبطاقة"
              style={{
                position: "absolute",
                top: `${(50.44 / 236.98) * 100}%`,
                left: `${(95.51 / 153.07) * 100}%`,
                width: `${(46.02 / 153.07) * 100}%`,
                height: `${(61.35 / 236.98) * 100}%`,
                borderRadius: "6px",
              }}
              className="cursor-pointer transition-all flex items-center justify-center group/photo"
            >
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover/photo:opacity-100 transition-opacity rounded-md flex flex-col items-center justify-center gap-1 text-white text-[9px] font-bold">
                {uploading ? (
                  <Loader2 size={16} className="animate-spin text-white" />
                ) : (
                  <>
                    <Camera size={14} />
                    <span>تغيير الصورة</span>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Controls & Operations */}
        <div className="space-y-2.5">
          {/* Avatar quick upload trigger */}
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleAvatarChange}
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
          />
          <div className="flex items-center justify-between bg-muted/40 p-2.5 px-3 rounded-2xl border border-border/50 text-xs">
            <span className="text-muted-foreground flex items-center gap-1.5 font-medium">
              <Camera size={14} className="text-[#119dd9]" /> الصورة الشخصية:
            </span>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="font-bold text-[#119dd9] hover:underline flex items-center gap-1.5 transition-colors disabled:opacity-60"
            >
              {uploading ? (
                <>
                  <Loader2 size={13} className="animate-spin" />
                  <span>جاري الرفع...</span>
                </>
              ) : avatarPath ? (
                "تغيير صورة العضو (PNG/JPG)"
              ) : (
                "رفع صورة العضو (PNG/JPG)"
              )}
            </button>
          </div>

          {/* Membership number copy bar */}
          <div className="flex items-center justify-between bg-muted/40 p-2.5 px-3 rounded-2xl border border-border/50 text-xs">
            <span className="text-muted-foreground flex items-center gap-1.5 font-medium">
              <User size={14} className="text-[#119dd9]" /> رقم العضوية المعتمد:
            </span>
            <button
              onClick={copyNumber}
              className="font-mono font-bold text-foreground hover:text-[#119dd9] flex items-center gap-1.5 transition-colors"
              title="نسخ رقم العضوية"
            >
              <span dir="ltr">{memNumber}</span>
              {copied ? (
                <Check size={13} className="text-emerald-500" />
              ) : (
                <Copy size={13} className="text-muted-foreground" />
              )}
            </button>
          </div>

          {/* Public Verification Link Bar */}
          <div className="flex items-center justify-between bg-sky-500/5 border border-sky-500/20 p-2.5 px-3 rounded-2xl text-xs">
            <div className="flex items-center gap-2 min-w-0">
              <ShieldCheck size={16} className="text-[#119dd9] shrink-0" />
              <div className="truncate">
                <p className="font-bold text-foreground text-[11px]">
                  بوابة التحقق الرسمية للمسح (QR):
                </p>
                <p className="text-[10px] text-muted-foreground font-mono truncate" dir="ltr">
                  {verifyUrl}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <button
                type="button"
                onClick={() => {
                  void navigator.clipboard.writeText(verifyUrl);
                  setCopied(true);
                  setTimeout(() => setCopied(false), 2000);
                }}
                className="p-1.5 rounded-lg hover:bg-sky-500/10 text-[#119dd9] transition-colors"
                title="نسخ رابط التحقق"
              >
                {copied ? <Check size={13} className="text-emerald-600" /> : <Copy size={13} />}
              </button>
              <a
                href={verifyUrl}
                target="_blank"
                rel="noreferrer"
                className="p-1.5 rounded-lg hover:bg-sky-500/10 text-[#119dd9] transition-colors flex items-center gap-1 text-[11px] font-bold"
                title="فتح بوابة التحقق في نافذة جديدة"
              >
                <ExternalLink size={13} />
              </a>
            </div>
          </div>

          {/* Action buttons */}
          <div className="space-y-2 pt-1">
            <button
              onClick={printCard}
              className="w-full py-2.5 px-4 rounded-xl bg-[#119dd9] hover:bg-[#0c82b4] text-white text-xs font-bold transition-all flex items-center justify-center gap-2 shadow-sm shadow-sky-500/20"
            >
              <Printer size={15} /> طباعة البطاقة / حفظ كـ PDF (CR80/A4)
            </button>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={downloadPng}
                disabled={downloadingPng}
                className="py-2.5 px-3 rounded-xl border border-border bg-card hover:bg-muted text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 text-foreground disabled:opacity-60"
              >
                {downloadingPng ? (
                  <Loader2 size={14} className="animate-spin text-[#119dd9]" />
                ) : (
                  <ImageIcon size={14} className="text-[#119dd9]" />
                )}
                <span>تحميل صورة (PNG)</span>
              </button>
              <button
                type="button"
                onClick={downloadSvg}
                className="py-2.5 px-3 rounded-xl border border-border bg-card hover:bg-muted text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 text-foreground"
              >
                <Download size={14} className="text-emerald-600" />
                <span>تحميل فيكتور (SVG)</span>
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
