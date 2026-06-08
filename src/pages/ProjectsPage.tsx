import React from "react";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import { Search, Layers } from "lucide-react";

export default function ProjectsPage(): React.ReactElement {
  const { t, i18n } = useTranslation(["projects", "common"]);
  const isRtl = i18n.dir() === "rtl";

  return (
    <div dir={isRtl ? "rtl" : "ltr"}>
      <section className="section-padding bg-gradient-to-br from-water-50 to-background">
        <div className="container mx-auto px-4 md:px-8">
          <motion.div className="text-center mb-12" initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }}>
            <h1 className="font-display text-4xl md:text-5xl font-black mb-4 text-gradient-water">
              {t("projects:hero.title")}
            </h1>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">{t("projects:hero.subtitle")}</p>
          </motion.div>

          {/* Search bar */}
          <div className="max-w-lg mx-auto mb-10">
            <div className="relative">
              <Search size={18} className="absolute top-1/2 -translate-y-1/2 start-4 text-muted-foreground" />
              <input
                type="search"
                placeholder={t("projects:search.placeholder")}
                className="w-full ps-11 pe-4 py-3 rounded-full border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                dir={isRtl ? "rtl" : "ltr"}
              />
            </div>
          </div>

          {/* Placeholder grid */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="rounded-2xl border border-border bg-card overflow-hidden shimmer h-64" />
            ))}
          </div>

          <p className="text-center text-muted-foreground mt-8 text-sm flex items-center justify-center gap-2">
            <Layers size={16} />
            يتم تحميل البيانات من Supabase — سيتم ربط الجداول في المرحلة القادمة
          </p>
        </div>
      </section>
    </div>
  );
}
