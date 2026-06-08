import React, { useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslation } from "react-i18next";
import { X, Star, Send } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";

interface TestimonialSubmitModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const TestimonialSubmitModal: React.FC<TestimonialSubmitModalProps> = ({ isOpen, onClose }) => {
  const { t, i18n } = useTranslation("about");
  const isRtl = i18n.dir() === "rtl";
  const [rating, setRating] = React.useState(5);
  const [hovered, setHovered] = React.useState(0);
  const [submitting, setSubmitting] = React.useState(false);
  const [success, setSuccess] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const dialogRef = useRef<HTMLDivElement>(null);

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  // Trap focus
  useEffect(() => {
    if (isOpen) dialogRef.current?.focus();
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    const form = e.currentTarget;
    const fd = new FormData(form);
    try {
      const { error: dbError } = await supabase.from("testimonials").insert({
        author_name_ar: fd.get("name_ar") as string,
        author_name_en: fd.get("name_en") as string,
        role_ar: fd.get("role_ar") as string,
        role_en: fd.get("role_en") as string,
        body_ar: fd.get("body_ar") as string,
        body_en: fd.get("body_en") as string,
        rating,
        status: "pending",
      });
      if (dbError) throw dbError;
      setSuccess(true);
      form.reset();
      setRating(5);
    } catch {
      setError("حدث خطأ. يرجى المحاولة مجدداً.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
          aria-modal="true"
          role="dialog"
          aria-label={t("testimonials.modalTitle")}
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

          {/* Modal */}
          <motion.div
            ref={dialogRef}
            tabIndex={-1}
            initial={{ opacity: 0, scale: 0.94, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: 20 }}
            transition={{ type: "spring", stiffness: 280, damping: 28 }}
            dir={isRtl ? "rtl" : "ltr"}
            className="relative z-10 bg-card border border-border rounded-3xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto p-8 outline-none"
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-display text-xl font-bold">{t("testimonials.modalTitle")}</h2>
              <button
                onClick={onClose}
                className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-muted transition-colors"
                aria-label="إغلاق"
              >
                <X size={18} />
              </button>
            </div>

            {success ? (
              <div className="text-center py-8">
                <div className="w-16 h-16 rounded-full bg-green-500/15 flex items-center justify-center mx-auto mb-4">
                  <Send size={28} className="text-green-500" />
                </div>
                <p className="text-foreground font-medium leading-relaxed">
                  {t("testimonials.form.successMessage")}
                </p>
                <button
                  onClick={onClose}
                  className="mt-6 px-6 py-2.5 rounded-full bg-primary text-primary-foreground text-sm font-semibold"
                >
                  {isRtl ? "إغلاق" : "Close"}
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                {/* Rating */}
                <div>
                  <label className="block text-sm font-medium mb-2">{t("testimonials.form.rating")}</label>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setRating(star)}
                        onMouseEnter={() => setHovered(star)}
                        onMouseLeave={() => setHovered(0)}
                        className="transition-transform hover:scale-110"
                        aria-label={`${star} stars`}
                      >
                        <Star
                          size={24}
                          className={
                            (hovered || rating) >= star
                              ? "fill-amber-400 text-amber-400"
                              : "text-muted/40"
                          }
                        />
                      </button>
                    ))}
                  </div>
                </div>

                {/* Name AR / EN */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-muted-foreground mb-1">الاسم (عربي)</label>
                    <input name="name_ar" required className="input-field w-full" placeholder="محمد علي" />
                  </div>
                  <div>
                    <label className="block text-xs text-muted-foreground mb-1">Name (English)</label>
                    <input name="name_en" required className="input-field w-full" placeholder="Mohammed Ali" />
                  </div>
                </div>

                {/* Role AR / EN */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-muted-foreground mb-1">الصفة (عربي)</label>
                    <input name="role_ar" required className="input-field w-full" placeholder="شريك تنفيذي" />
                  </div>
                  <div>
                    <label className="block text-xs text-muted-foreground mb-1">Role (English)</label>
                    <input name="role_en" required className="input-field w-full" placeholder="Implementation Partner" />
                  </div>
                </div>

                {/* Body AR */}
                <div>
                  <label className="block text-xs text-muted-foreground mb-1">الرسالة (عربي)</label>
                  <textarea
                    name="body_ar"
                    required
                    rows={3}
                    className="input-field w-full resize-none"
                    placeholder="شاركنا تجربتك..."
                    dir="rtl"
                  />
                </div>

                {/* Body EN */}
                <div>
                  <label className="block text-xs text-muted-foreground mb-1">Message (English)</label>
                  <textarea
                    name="body_en"
                    required
                    rows={3}
                    className="input-field w-full resize-none"
                    placeholder="Share your experience..."
                    dir="ltr"
                  />
                </div>

                {error && (
                  <p className="text-sm text-destructive bg-destructive/10 px-4 py-2 rounded-xl">{error}</p>
                )}

                <button
                  type="submit"
                  disabled={submitting}
                  className="flex items-center justify-center gap-2 w-full py-3 rounded-full bg-primary text-primary-foreground font-semibold text-sm disabled:opacity-60 transition-all hover:shadow-lg hover:shadow-primary/20"
                >
                  <Send size={16} />
                  {submitting
                    ? (isRtl ? "جاري الإرسال..." : "Submitting...")
                    : t("testimonials.form.submit")}
                </button>
              </form>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default TestimonialSubmitModal;
