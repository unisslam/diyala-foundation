import React from "react";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import { Newspaper } from "lucide-react";

export default function NewsPage(): React.ReactElement {
  const { t, i18n } = useTranslation(["news", "common"]);
  const isRtl = i18n.dir() === "rtl";

  return (
    <div dir={isRtl ? "rtl" : "ltr"}>
      <section className="section-padding bg-gradient-to-br from-water-50 to-background">
        <div className="container mx-auto px-4 md:px-8">
          <motion.div className="text-center mb-12" initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }}>
            <h1 className="font-display text-4xl md:text-5xl font-black mb-4 text-gradient-water">
              {t("news:hero.title")}
            </h1>
            <p className="text-muted-foreground text-lg">{t("news:hero.subtitle")}</p>
          </motion.div>

          {/* Masonry-style placeholder */}
          <div className="columns-1 sm:columns-2 lg:columns-3 gap-6 space-y-6">
            {[300, 200, 260, 180, 320, 240].map((h, i) => (
              <div key={i} className="rounded-2xl border border-border bg-card shimmer break-inside-avoid" style={{ height: h }} />
            ))}
          </div>

          <p className="text-center text-muted-foreground mt-8 text-sm flex items-center justify-center gap-2">
            <Newspaper size={16} />
            سيتم ربط بيانات الأخبار مع Supabase في المرحلة القادمة
          </p>
        </div>
      </section>
    </div>
  );
}
