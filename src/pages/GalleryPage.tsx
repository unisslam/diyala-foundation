/**
 * GalleryPage.tsx
 * ----------------
 * Public gallery page — masonry/grid layout with lightbox.
 * Pulls from gallery_items table (active only), images from Supabase Storage.
 */

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ChevronLeft, ChevronRight, Image as ImageIcon } from "lucide-react";
import { useTranslation } from "react-i18next";
import { supabase } from "@/lib/supabaseClient";
import type { GalleryItemRow } from "@/types/database.types";
import PageHero from "@/components/shared/PageHero";

// ── Lightbox ─────────────────────────────────────────────────────────
function Lightbox({ items, index, onClose }: {
  items: GalleryItemRow[];
  index: number;
  onClose: () => void;
}): React.ReactElement {
  const [current, setCurrent] = useState(index);
  const item = items[current];

  // Keyboard navigation
  useEffect(() => {
    function onKey(e: KeyboardEvent): void {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") setCurrent((p) => (p + 1) % items.length);
      if (e.key === "ArrowLeft")  setCurrent((p) => (p - 1 + items.length) % items.length);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [items.length, onClose]);

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-center justify-center"
      onClick={onClose}
    >
      {/* Close */}
      <button
        onClick={onClose}
        className="absolute top-4 end-4 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors z-10"
      >
        <X size={20} />
      </button>

      {/* Prev */}
      <button
        onClick={(e) => { e.stopPropagation(); setCurrent((p) => (p - 1 + items.length) % items.length); }}
        className="absolute start-4 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors z-10"
      >
        <ChevronLeft size={20} />
      </button>

      {/* Image */}
      <motion.div
        key={current}
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.2 }}
        className="max-w-4xl max-h-[85vh] w-full mx-16 flex flex-col items-center gap-4"
        onClick={(e) => e.stopPropagation()}
      >
        <img
          src={item.image_path}
          alt={item.title_ar ?? "gallery"}
          className="max-h-[75vh] max-w-full rounded-2xl object-contain shadow-2xl"
        />
        {(item.title_ar || item.title_en) && (
          <p className="text-white/80 text-sm text-center">
            {item.title_ar ?? item.title_en}
          </p>
        )}
        <p className="text-white/40 text-xs">{current + 1} / {items.length}</p>
      </motion.div>

      {/* Next */}
      <button
        onClick={(e) => { e.stopPropagation(); setCurrent((p) => (p + 1) % items.length); }}
        className="absolute end-4 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors z-10"
      >
        <ChevronRight size={20} />
      </button>
    </motion.div>
  );
}

// ── Skeleton card ─────────────────────────────────────────────────────
function GallerySkeleton(): React.ReactElement {
  return (
    <div className="columns-2 sm:columns-3 lg:columns-4 gap-3 space-y-3">
      {Array.from({ length: 12 }).map((_, i) => (
        <div
          key={i}
          className="shimmer rounded-2xl break-inside-avoid"
          style={{ height: `${160 + (i % 3) * 60}px` }}
        />
      ))}
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────
export default function GalleryPage(): React.ReactElement {
  const { i18n } = useTranslation();
  const isRtl = i18n.dir() === "rtl";

  const [items, setItems]     = useState<GalleryItemRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [lightbox, setLightbox] = useState<number | null>(null);

  useEffect(() => {
    async function load(): Promise<void> {
      const { data } = await supabase
        .from("gallery_items")
        .select("*")
        .eq("is_active", true)
        .order("display_order", { ascending: true });
      setItems((data ?? []) as GalleryItemRow[]);
      setLoading(false);
    }
    void load();
  }, []);

  return (
    <div>
      <PageHero
        titleAr="معرض الصور"
        titleEn="Photo Gallery"
        subtitleAr="لحظات من ميدان العمل — فعاليات، مشاريع، وذكريات"
        subtitleEn="Moments from the field — events, projects, and memories"
        gradient="from-violet-600 to-blue-600"
      />

      <section className="container mx-auto px-4 md:px-8 py-16" dir={isRtl ? "rtl" : "ltr"}>
        {loading ? (
          <GallerySkeleton />
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 gap-4 text-muted-foreground">
            <ImageIcon size={48} className="opacity-30" />
            <p className="text-sm">{isRtl ? "لا توجد صور بعد" : "No images yet"}</p>
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="columns-2 sm:columns-3 lg:columns-4 gap-3 space-y-3"
          >
            {items.map((item, idx) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: (idx % 8) * 0.05 }}
                className="break-inside-avoid relative group cursor-pointer rounded-2xl overflow-hidden bg-muted"
                onClick={() => setLightbox(idx)}
              >
                <img
                  src={item.image_path}
                  alt={item.title_ar ?? "gallery image"}
                  className="w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  loading="lazy"
                />
                {(item.title_ar || item.title_en) && (
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-3">
                    <p className="text-white text-xs font-medium">
                      {isRtl ? item.title_ar : item.title_en}
                    </p>
                  </div>
                )}
              </motion.div>
            ))}
          </motion.div>
        )}
      </section>

      {/* Lightbox */}
      <AnimatePresence>
        {lightbox !== null && (
          <Lightbox items={items} index={lightbox} onClose={() => setLightbox(null)} />
        )}
      </AnimatePresence>
    </div>
  );
}
