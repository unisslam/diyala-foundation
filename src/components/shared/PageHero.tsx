import React from "react";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";

interface PageHeroProps {
  titleKey: string;
  subtitleKey: string;
  namespace?: string;
  accentColor?: string;
}

const PageHero: React.FC<PageHeroProps> = ({
  titleKey,
  subtitleKey,
  namespace = "common",
  accentColor = "primary",
}) => {
  const { t, i18n } = useTranslation(namespace);
  const isRtl = i18n.dir() === "rtl";

  return (
    <section
      dir={isRtl ? "rtl" : "ltr"}
      className="relative overflow-hidden pt-32 pb-20 bg-background"
      aria-label="Page Hero"
    >
      {/* Background radial glow */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background: `radial-gradient(ellipse 80% 60% at 50% 0%, hsl(var(--${accentColor}) / 0.12) 0%, transparent 70%)`,
        }}
      />

      {/* Decorative SDG-coloured line at top */}
      <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-sdg-1 via-sdg-4 to-sdg-13 opacity-70" />

      <div className="relative container mx-auto px-4 md:px-8 text-center max-w-3xl">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6 border border-primary/20"
        >
          <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
          {t("siteName", { ns: "common", defaultValue: "مؤسسة نهر ديالى" })}
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 28 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.1 }}
          className="font-hero text-5xl md:text-6xl font-black mb-5 leading-tight"
          style={{ lineHeight: "1.25" }}
        >
          {t(titleKey)}
        </motion.h1>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.7 }}
          className="text-muted-foreground text-lg md:text-xl leading-relaxed"
        >
          {t(subtitleKey)}
        </motion.p>
      </div>
    </section>
  );
};

export default PageHero;
