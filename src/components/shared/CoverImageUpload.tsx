/**
 * CoverImageUpload.tsx
 * ---------------------
 * Reusable cover image upload widget — drag & drop or click.
 * Shows preview, compression indicator, and remove button.
 */

import React, { useRef, useState } from "react";
import { motion } from "framer-motion";
import { Upload, X, Loader2, ImageIcon } from "lucide-react";
import { useImageUpload } from "@/hooks/useImageUpload";

interface CoverImageUploadProps {
  bucket: "news" | "projects" | "gallery" | "team";
  currentUrl: string | null | undefined;
  onUploaded: (url: string) => void;
  onRemoved: () => void;
  label?: string;
}

export function CoverImageUpload({
  bucket, currentUrl, onUploaded, onRemoved, label = "صورة الغلاف",
}: CoverImageUploadProps): React.ReactElement {
  const { uploading, uploadImage } = useImageUpload(bucket);
  const [dragOver, setDragOver] = useState(false);
  const [error, setError]       = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFile(file: File | undefined): Promise<void> {
    if (!file) return;
    const allowed = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    if (!allowed.includes(file.type)) { setError("نوع الملف غير مدعوم"); return; }
    setError(null);
    const url = await uploadImage(file);
    if (url) onUploaded(url);
    else setError("فشل الرفع — حاول مجدداً");
  }

  // If there's already an image, show preview with replace/remove controls
  if (currentUrl) {
    return (
      <div>
        <label className="text-xs font-medium mb-1.5 block text-muted-foreground">{label}</label>
        <div className="relative rounded-2xl overflow-hidden border border-border group">
          <img
            src={currentUrl}
            alt="cover"
            className="w-full h-44 object-cover"
            onError={(e) => ((e.target as HTMLImageElement).src = "")}
          />
          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              disabled={uploading}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/20 text-white text-xs font-medium hover:bg-white/40 transition-colors"
            >
              {uploading ? <Loader2 size={13} className="animate-spin" /> : <Upload size={13} />}
              تغيير
            </button>
            <button
              type="button"
              onClick={onRemoved}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-red-500/70 text-white text-xs font-medium hover:bg-red-500 transition-colors"
            >
              <X size={13} /> حذف
            </button>
          </div>
        </div>
        <input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp"
          className="hidden" onChange={(e) => handleFile(e.target.files?.[0])} />
        {error && <p className="text-destructive text-xs mt-1">{error}</p>}
      </div>
    );
  }

  // Empty state — drop zone
  return (
    <div>
      <label className="text-xs font-medium mb-1.5 block text-muted-foreground">{label}</label>
      <motion.div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => { e.preventDefault(); setDragOver(false); handleFile(e.dataTransfer.files[0]); }}
        onClick={() => !uploading && inputRef.current?.click()}
        animate={{ borderColor: dragOver ? "var(--color-primary)" : "var(--color-border)" }}
        className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-colors ${
          dragOver ? "bg-primary/5" : "hover:bg-muted/30"
        }`}
      >
        {uploading ? (
          <div className="flex flex-col items-center gap-2">
            <Loader2 size={22} className="text-primary animate-spin" />
            <p className="text-xs text-muted-foreground">جاري الرفع والضغط...</p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center">
              <ImageIcon size={18} className="text-muted-foreground" />
            </div>
            <p className="text-xs text-muted-foreground">اسحب صورة أو <span className="text-primary font-medium">انقر للاختيار</span></p>
            <p className="text-[10px] text-muted-foreground/60">JPEG, PNG, WebP · تُضغط تلقائياً</p>
          </div>
        )}
      </motion.div>
      <input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp"
        className="hidden" onChange={(e) => handleFile(e.target.files?.[0])} />
      {error && <p className="text-destructive text-xs mt-1">{error}</p>}
    </div>
  );
}
