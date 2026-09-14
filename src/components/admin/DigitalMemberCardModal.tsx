/**
 * DigitalMemberCardModal.tsx
 * --------------------------
 * Premium interactive digital membership card generator & printer for Diyala River Foundation.
 * Uses public/logo.png, dynamic QR code, official Iraqi institutional styling, and print controls.
 */

import React, { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { X, Printer, Download, Check, ShieldCheck, User, Camera, Loader2, ExternalLink, Copy } from "lucide-react";
import type { TeamMemberRow } from "@/types/database.types";
import { generateQrDataUrl, getMemberVerificationUrl, OFFICIAL_DOMAIN } from "@/lib/membershipExport";
import { useImageUpload } from "@/hooks/useImageUpload";
import { supabase } from "@/lib/supabaseClient";

interface DigitalMemberCardModalProps {
  member: TeamMemberRow;
  onClose: () => void;
  onUpdate?: () => void;
}

export default function DigitalMemberCardModal({ member, onClose, onUpdate }: DigitalMemberCardModalProps): React.ReactElement {
  const [qrUrl, setQrUrl] = useState<string>("");
  const [avatarPath, setAvatarPath] = useState<string | null>(member.avatar_path ?? null);
  const cardRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [copied, setCopied] = useState(false);
  const { uploading, uploadImage } = useImageUpload("member-avatars");

  const memNumber = member.membership_number || `DRF-MEM-${member.id.slice(0, 6).toUpperCase()}`;
  const verifyUrl = getMemberVerificationUrl(memNumber);
  const joinDate = member.membership_start_date
    ? new Date(member.membership_start_date).toLocaleDateString("ar-IQ")
    : new Date(member.created_at).toLocaleDateString("ar-IQ");
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
        const { data } = await supabase.from("team_members").update({ avatar_path: url }).eq("id", member.id).select("id");
        if ((!data || data.length === 0) && member.membership_application_id) {
          await supabase.from("team_members").update({ avatar_path: url }).eq("membership_application_id", member.membership_application_id);
        }
      } else if (member.membership_application_id) {
        await supabase.from("team_members").update({ avatar_path: url }).eq("membership_application_id", member.membership_application_id);
      }
      setAvatarPath(url);
      onUpdate?.();
    }
  }

  const printCard = (): void => {
    const printWindow = window.open("", "_blank", "width=800,height=600");
    if (!printWindow) return;

    const logoUrl = typeof window !== "undefined" && window.location.origin.includes("diyalariver.org")
      ? `${window.location.origin}/logo.png`
      : `${OFFICIAL_DOMAIN}/logo.png`;

    const html = `<!DOCTYPE html>
    <html dir="rtl" lang="ar">
    <head>
      <meta charset="UTF-8" />
      <title>بطاقة عضوية — ${member.full_name_ar}</title>
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800;900&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body {
          font-family: 'Cairo', sans-serif;
          background: #ffffff;
          display: flex;
          align-items: center;
          justify-content: center;
          min-height: 100vh;
          padding: 20px;
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
        }

        .card-container {
          width: 86mm;
          height: 54mm;
          border-radius: 12px;
          background: linear-gradient(135deg, #064e3b 0%, #065f46 45%, #047857 100%);
          color: #ffffff;
          padding: 10px 14px;
          position: relative;
          overflow: hidden;
          box-shadow: 0 4px 15px rgba(0,0,0,0.15);
          border: 1px solid #10b981;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
        }

        .card-bg-watermark {
          position: absolute;
          top: -18px;
          left: -25px;
          width: 240px;
          height: 240px;
          opacity: 0.08;
          pointer-events: none;
          object-fit: contain;
        }

        .card-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          border-bottom: 1px solid rgba(255,255,255,0.2);
          padding-bottom: 5px;
          z-index: 2;
        }

        .header-brand {
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .header-brand img {
          width: 26px;
          height: 26px;
          object-fit: contain;
          filter: drop-shadow(0 1px 2px rgba(0,0,0,0.3));
        }

        .brand-text h1 {
          font-size: 7.5pt;
          font-weight: 900;
          color: #ffffff;
          line-height: 1.1;
        }

        .brand-text p {
          font-size: 5pt;
          color: #a7f3d0;
          letter-spacing: 0.3px;
        }

        .card-type-chip {
          background: rgba(255,255,255,0.15);
          backdrop-filter: blur(4px);
          border: 1px solid rgba(255,255,255,0.3);
          border-radius: 20px;
          padding: 2px 7px;
          font-size: 5.5pt;
          font-weight: 700;
          color: #fef08a;
        }

        .card-body {
          display: flex;
          align-items: center;
          gap: 10px;
          margin: 4px 0;
          z-index: 2;
        }

        .avatar-box {
          width: 44px;
          height: 44px;
          border-radius: 8px;
          border: 1.5px solid #34d399;
          background: rgba(255,255,255,0.1);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 16pt;
          font-weight: 900;
          color: #ffffff;
          overflow: hidden;
          flex-shrink: 0;
        }

        .avatar-box img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .member-details {
          flex: 1;
          min-width: 0;
        }

        .member-name-ar {
          font-size: 9pt;
          font-weight: 900;
          color: #ffffff;
          line-height: 1.2;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .member-name-en {
          font-size: 6pt;
          color: #d1fae5;
          text-transform: capitalize;
          margin-bottom: 2px;
        }

        .member-role {
          font-size: 6.5pt;
          color: #fef08a;
          font-weight: 700;
        }

        .card-footer {
          display: flex;
          justify-content: space-between;
          align-items: flex-end;
          border-top: 1px solid rgba(255,255,255,0.15);
          padding-top: 4px;
          z-index: 2;
        }

        .meta-col p {
          font-size: 4.8pt;
          color: #a7f3d0;
          line-height: 1.2;
        }

        .meta-col strong {
          font-size: 5.5pt;
          color: #ffffff;
        }

        .qr-box img {
          width: 40px;
          height: 40px;
          border-radius: 4px;
          border: 1px solid rgba(255,255,255,0.4);
          background: #ffffff;
          padding: 1.5px;
        }

        @media print {
          body { padding: 0; background: none; }
          .card-container {
            box-shadow: none;
            page-break-inside: avoid;
          }
        }
      </style>
    </head>
    <body>
      <div class="card-container">
        <img src="${logoUrl}" class="card-bg-watermark" alt="" />
        
        <div class="card-header">
          <div class="header-brand">
            <img src="${logoUrl}" alt="Logo" />
            <div class="brand-text">
              <h1>مؤسسة نهر ديالى للتنمية المستدامة</h1>
              <p>DIYALA RIVER FOUNDATION FOR SUSTAINABLE DEVELOPMENT</p>
            </div>
          </div>
          <div class="card-type-chip">بطاقة عضوية معتمدة</div>
        </div>

        <div class="card-body">
          <div class="avatar-box">
            ${avatarPath ? `<img src="${avatarPath}" alt="" />` : member.full_name_ar.charAt(0)}
          </div>
          <div class="member-details">
            <div class="member-name-ar">${member.full_name_ar}</div>
            <div class="member-name-en">${member.full_name_en || ""}</div>
            <div class="member-role">${member.title_ar || "عضو المؤسسة"}</div>
          </div>
        </div>

        <div class="card-footer">
          <div class="meta-col">
            <p>رقم العضوية: <strong dir="ltr">${memNumber}</strong></p>
            <p>تاريخ الانتساب: <strong>${joinDate}</strong></p>
            <p>صلاحية البطاقة: <strong>${expiryDate}</strong></p>
          </div>
          <div class="qr-box">
            ${qrUrl ? `
              <a href="${verifyUrl}" target="_blank" rel="noopener noreferrer" style="text-decoration:none; display:inline-block;">
                <img src="${qrUrl}" alt="QR" />
              </a>
              <p style="font-size: 3.8pt; color: #a7f3d0; text-align: center; margin-top: 2px;">امسح للتحقق</p>
            ` : ""}
          </div>
        </div>
      </div>
      <script>
        setTimeout(() => { window.print(); }, 400);
      </script>
    </body>
    </html>`;

    printWindow.document.write(html);
    printWindow.document.close();
  };

  const copyNumber = () => {
    void navigator.clipboard.writeText(memNumber);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      dir="rtl"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.93, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        className="bg-card rounded-3xl border border-border w-full max-w-md p-6 shadow-2xl overflow-hidden relative"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <ShieldCheck size={18} />
            </div>
            <div>
              <h3 className="font-display font-bold text-base">بطاقة العضوية الرقمية</h3>
              <p className="text-xs text-muted-foreground">Digital Institutional Membership ID</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-muted text-muted-foreground transition-colors">
            <X size={16} />
          </button>
        </div>

        {/* Digital Card Preview */}
        <div className="flex justify-center mb-6">
          <div
            ref={cardRef}
            className="w-full max-w-[360px] aspect-[1.586] rounded-2xl p-4 text-white relative overflow-hidden shadow-2xl flex flex-col justify-between border border-emerald-400/40 select-none"
            style={{
              background: "linear-gradient(135deg, #064e3b 0%, #065f46 50%, #047857 100%)",
            }}
          >
            {/* Ambient Lighting & Holographic Watermark */}
            <div className="absolute top-0 end-0 w-44 h-44 bg-emerald-400/10 rounded-full blur-2xl pointer-events-none" />
            <img
              src="/logo.png"
              alt=""
              className="absolute -top-4 -start-8 w-64 h-64 opacity-10 pointer-events-none object-contain"
            />

            {/* Card Header */}
            <div className="flex items-center justify-between border-b border-white/20 pb-2 z-10">
              <div className="flex items-center gap-2">
                <img
                  src="/logo.png"
                  alt="Diyala Foundation Logo"
                  className="w-7 h-7 object-contain drop-shadow"
                  onError={(e) => { e.currentTarget.style.display = "none"; }}
                />
                <div>
                  <p className="font-display font-black text-[10.5px] leading-tight tracking-tight">مؤسسة نهر ديالى للتنمية المستدامة</p>
                  <p className="text-[5px] text-emerald-200 tracking-wider font-mono">DIYALA RIVER FOUNDATION FOR SUSTAINABLE DEVELOPMENT</p>
                </div>
              </div>
              <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-white/20 border border-white/30 text-yellow-300 backdrop-blur-md">
                عضوية رسمية
              </span>
            </div>

            {/* Card Body */}
            <div className="flex items-center gap-3 my-auto z-10">
              <div
                onClick={() => fileInputRef.current?.click()}
                title="اضغط لرفع أو تغيير الصورة الشخصية"
                className="w-13 h-13 rounded-xl bg-white/10 border-2 border-emerald-300/60 flex items-center justify-center font-display font-black text-xl text-white shadow-inner overflow-hidden shrink-0 relative group cursor-pointer"
              >
                {uploading ? (
                  <Loader2 size={20} className="animate-spin text-emerald-300" />
                ) : avatarPath ? (
                  <img src={avatarPath} alt="" className="w-full h-full object-cover" />
                ) : (
                  member.full_name_ar.charAt(0)
                )}
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity rounded-xl">
                  <Camera size={14} className="text-white" />
                </div>
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-display font-extrabold text-sm leading-tight truncate">{member.full_name_ar}</p>
                {member.full_name_en && (
                  <p className="text-[9px] text-emerald-200 truncate capitalize font-medium">{member.full_name_en}</p>
                )}
                <div className="flex items-center gap-1.5 mt-1">
                  <span className="text-[10px] text-yellow-200 font-semibold bg-emerald-950/40 px-2 py-0.5 rounded-md border border-emerald-500/30">
                    {member.title_ar || "عضو الهيئة العامة"}
                  </span>
                </div>
              </div>
            </div>

            {/* Card Footer */}
            <div className="flex items-end justify-between border-t border-white/15 pt-2 z-10 text-[8.5px]">
              <div className="space-y-0.5 text-emerald-100">
                <p className="flex items-center gap-1">
                  <span className="text-emerald-300">رقم العضوية:</span>
                  <span className="font-mono font-bold text-white text-[9.5px]" dir="ltr">{memNumber}</span>
                </p>
                <p className="flex items-center gap-1">
                  <span>تاريخ الانتساب:</span>
                  <span className="font-semibold text-white">{joinDate}</span>
                </p>
                <p className="flex items-center gap-1">
                  <span>الصلاحية:</span>
                  <span className="font-semibold text-yellow-200">{expiryDate}</span>
                </p>
              </div>

              {/* QR Verification */}
              <div className="shrink-0">
                {qrUrl ? (
                  <a
                    href={verifyUrl}
                    target="_blank"
                    rel="noreferrer"
                    title="فتح بوابة التحقق الرسمية diyalariver.org"
                    className="block group"
                  >
                    <img
                      src={qrUrl}
                      alt="QR Verification"
                      className="w-10 h-10 rounded-md border border-white/40 bg-white p-0.5 shadow-md group-hover:scale-105 transition-transform"
                    />
                  </a>
                ) : (
                  <div className="w-10 h-10 rounded bg-white/20 animate-pulse" />
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="space-y-3">
          {/* Avatar upload quick action */}
          <div className="flex items-center justify-between bg-muted/40 p-2.5 px-3 rounded-2xl border border-border/50 text-xs">
            <span className="text-muted-foreground flex items-center gap-1.5">
              <Camera size={13} className="text-primary" /> الصورة الشخصية للبطاقة:
            </span>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleAvatarChange}
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="font-bold text-primary hover:underline flex items-center gap-1 transition-colors"
            >
              {uploading ? (
                <>
                  <Loader2 size={12} className="animate-spin" />
                  <span>جاري الرفع...</span>
                </>
              ) : avatarPath ? (
                "تغيير الصورة الشخصية"
              ) : (
                "رفع صورة العضو (PNG/JPG)"
              )}
            </button>
          </div>
          <div className="flex items-center justify-between bg-muted/40 p-3 rounded-2xl border border-border/50 text-xs">
            <span className="text-muted-foreground flex items-center gap-1.5">
              <User size={13} className="text-primary" /> رقم العضوية المعتمد:
            </span>
            <button
              onClick={copyNumber}
              className="font-mono font-bold text-foreground hover:text-primary flex items-center gap-1.5 transition-colors"
            >
              {memNumber}
              {copied ? <Check size={13} className="text-emerald-500" /> : null}
            </button>
          </div>

          {/* Public Verification Link Bar */}
          <div className="flex items-center justify-between bg-primary/5 border border-primary/20 p-2.5 px-3 rounded-2xl text-xs">
            <div className="flex items-center gap-2 min-w-0">
              <ShieldCheck size={15} className="text-primary shrink-0" />
              <div className="truncate">
                <p className="font-bold text-foreground text-[11px]">رابط الفحص والتحقق العام (QR):</p>
                <p className="text-[10px] text-muted-foreground font-mono truncate" dir="ltr">{verifyUrl}</p>
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
                className="p-1.5 rounded-lg hover:bg-primary/10 text-primary transition-colors"
                title="نسخ رابط التحقق"
              >
                {copied ? <Check size={13} className="text-emerald-600" /> : <Copy size={13} />}
              </button>
              <a
                href={verifyUrl}
                target="_blank"
                rel="noreferrer"
                className="p-1.5 rounded-lg hover:bg-primary/10 text-primary transition-colors flex items-center gap-1 text-[11px] font-bold"
                title="فتح صفحة التحقق في نافذة جديدة"
              >
                <ExternalLink size={13} />
              </a>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <button
              onClick={printCard}
              className="py-2.5 px-4 rounded-xl bg-primary text-primary-foreground text-xs font-bold hover:bg-primary-dark transition-all flex items-center justify-center gap-2 shadow-sm"
            >
              <Printer size={14} /> طباعة البطاقة (A4/ID)
            </button>
            <button
              onClick={printCard}
              className="py-2.5 px-4 rounded-xl border border-border hover:bg-muted text-xs font-semibold transition-colors flex items-center justify-center gap-2"
            >
              <Download size={14} /> حفظ كملف PDF
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
