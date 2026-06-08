import React from "react";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";

interface PageHeroProps {
  titleKey?: string;
  subtitleKey?: string;
  titleAr?: string;
  titleEn?: string;
  subtitleAr?: string;
  subtitleEn?: string;
  eyebrow?: string;
  gradient?: string;
  namespace?: string;
  accentColor?: string;
}

const PageHero: React.FC<PageHeroProps> = ({
  titleKey,
  subtitleKey,
  titleAr,
  titleEn,
  subtitleAr,
  subtitleEn,
  eyebrow,
  gradient,
  namespace = "common",
  accentColor = "primary",
}) => {
  const { t, i18n } = useTranslation(namespace);
  const isRtl = i18n.dir() === "rtl";

  const displayTitle = titleAr && titleEn
    ? (isRtl ? titleAr : titleEn)
    : (titleKey ? t(titleKey) : "");

  const displaySubtitle = subtitleAr && subtitleEn
    ? (isRtl ? subtitleAr : subtitleEn)
    : (subtitleKey ? t(subtitleKey) : "");

  const displayEyebrow = eyebrow || t("siteName", { ns: "common", defaultValue: "مؤسسة نهر ديالى" });

  return (
    <section
      dir={isRtl ? "rtl" : "ltr"}
      className={`relative overflow-hidden pt-32 pb-20 ${
        gradient ? `bg-gradient-to-br ${gradient}` : "bg-background"
      }`}
      aria-label="Page Hero"
    >
      {/* Background radial glow */}
      {!gradient && (
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background: `radial-gradient(ellipse 80% 60% at 50% 0%, hsl(var(--${accentColor}) / 0.12) 0%, transparent 70%)`,
          }}
        />
      )}

      {/* Decorative SDG-coloured line at top */}
      <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-sdg-1 via-sdg-4 to-sdg-13 opacity-70" />

      <div className="relative container mx-auto px-4 md:px-8 text-center max-w-3xl">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-medium mb-6 border ${
            gradient
              ? "bg-white/10 text-white border-white/20"
              : "bg-primary/10 text-primary border-primary/20"
          }`}
        >
          <span className={`w-2 h-2 rounded-full ${gradient ? "bg-white animate-pulse" : "bg-primary animate-pulse"}`} />
          {displayEyebrow}
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 28 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.1 }}
          className={`font-hero text-5xl md:text-6xl font-black mb-5 leading-tight ${
            gradient ? "text-white" : "text-foreground"
          }`}
          style={{ lineHeight: "1.25" }}
        >
          {displayTitle}
        </motion.h1>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.7 }}
          className={`text-lg md:text-xl leading-relaxed ${
            gradient ? "text-white/80" : "text-muted-foreground"
          }`}
        >
          {displaySubtitle}
        </motion.p>
      </div>
    </section>
  );
};

export default PageHero;
