/**
 * HomePage.tsx
 * ------------
 * Landing page — SDG-aligned identity.
 * Sections:
 *  1. Hero         — Clear typographic hierarchy, SDG-centric copy
 *  2. Impact Stats — Key numbers (SDG-relevant metrics)
 *  3. SDGs Grid    — UN SDG matrix showcasing the Foundation's 6 targets
 *  4. Mission      — Vision & Mission framed around SDG implementation
 *  5. CTA          — Engagement call-to-action
 */

import React from "react";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import type { Variants } from "framer-motion";
import { Link } from "react-router-dom";
import {
  ArrowDown,
  Target,
  Users,
  CheckCircle,
  Globe2,
  TrendingUp,
  ArrowRight,
  ChevronRight,
} from "lucide-react";
import { FOUNDATION_SDGS } from "@/config/sdgsData";
import type { SDGItem } from "@/types/sdg";

/* ── Animation variants ─────────────────────────────────────────────── */
const fadeUp: Variants = {
  hidden: { opacity: 0, y: 28 },
  show: { opacity: 1, y: 0, transition: { duration: 0.65, ease: "easeOut" } },
};

const stagger: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.12 } },
};

const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.92 },
  show: { opacity: 1, scale: 1, transition: { duration: 0.5, ease: "easeOut" } },
};

/* ── Impact Stat definition ─────────────────────────────────────────── */
interface ImpactStat {
  icon: React.ElementType;
  value: string;
  labelAr: string;
  labelEn: string;
}

const IMPACT_STATS: ImpactStat[] = [
  { icon: Users, value: "25,000+", labelAr: "مستفيد مباشر", labelEn: "Direct Beneficiaries" },
  { icon: CheckCircle, value: "47", labelAr: "مشروع تنموي منجز", labelEn: "Completed Projects" },
  { icon: Globe2, value: "6", labelAr: "أهداف SDG مستهدفة", labelEn: "SDGs Targeted" },
  { icon: TrendingUp, value: "8+", labelAr: "سنوات من التأثير", labelEn: "Years of Impact" },
];

/* ── SDG Card component ─────────────────────────────────────────────── */
interface SDGCardProps {
  sdg: SDGItem;
  index: number;
}

function SDGCard({ sdg, index }: SDGCardProps): React.ReactElement {
  const { t } = useTranslation("home");
  const Icon = sdg.icon;

  return (
    <motion.article
      variants={scaleIn}
      custom={index}
      className="group relative flex flex-col rounded-2xl overflow-hidden border border-border/60 bg-card hover:shadow-card-hover transition-all duration-300 hover:-translate-y-1"
      aria-labelledby={`sdg-title-${sdg.id}`}
    >
      {/* SDG color header band */}
      <div
        className="flex items-center gap-3 px-5 py-4"
        style={{ backgroundColor: sdg.color }}
      >
        <span
          className="font-display font-black text-2xl leading-none opacity-90"
          style={{ color: sdg.textColor }}
          aria-hidden="true"
        >
          {sdg.number}
        </span>
        <Icon
          size={22}
          style={{ color: sdg.textColor }}
          className="shrink-0 opacity-90"
          aria-hidden="true"
        />
      </div>

      {/* Card body */}
      <div className="flex flex-col flex-1 p-5 gap-2">
        <h3
          id={`sdg-title-${sdg.id}`}
          className="font-display font-bold text-base text-foreground leading-snug"
        >
          {t(sdg.titleKey)}
        </h3>
        <p className="text-muted-foreground text-sm leading-relaxed flex-1">
          {t(sdg.descriptionKey)}
        </p>

        {/* SDG number indicator */}
        <div className="pt-2 flex items-center gap-1.5 text-xs font-medium"
          style={{ color: sdg.color }}>
          <span>SDG {sdg.id}</span>
          <ChevronRight size={12} aria-hidden="true" />
        </div>
      </div>

      {/* Hover accent line */}
      <div
        className="absolute bottom-0 start-0 end-0 h-0.5 scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-start"
        style={{ backgroundColor: sdg.color }}
        aria-hidden="true"
      />
    </motion.article>
  );
}

/* ── HomePage ───────────────────────────────────────────────────────── */
export default function HomePage(): React.ReactElement {
  const { t, i18n } = useTranslation(["home", "common"]);
  const isRtl = i18n.dir() === "rtl";

  return (
    <div dir={isRtl ? "rtl" : "ltr"}>

      {/* ══ HERO ══════════════════════════════════════════════════════ */}
      <section
        className="relative min-h-[100svh] flex flex-col items-center justify-center overflow-hidden bg-gradient-to-br from-brand-50 via-background to-brand-100"
        aria-labelledby="hero-headline"
      >
        {/* Geometric background shapes — no river/water metaphor */}
        <div aria-hidden="true" className="absolute inset-0 overflow-hidden pointer-events-none">
          {/* Large geometric circle top-left */}
          <div className="absolute -top-24 -start-24 w-[480px] h-[480px] rounded-full border border-primary/10 bg-primary/5 animate-float" />
          {/* Small accent circle bottom-right */}
          <div
            className="absolute -bottom-32 -end-16 w-[320px] h-[320px] rounded-full border border-accent/10 bg-accent/5 animate-float"
            style={{ animationDelay: "2.5s" }}
          />
          {/* Central subtle grid pattern */}
          <div
            className="absolute inset-0 opacity-[0.03]"
            style={{
              backgroundImage:
                "linear-gradient(var(--color-foreground) 1px, transparent 1px), linear-gradient(90deg, var(--color-foreground) 1px, transparent 1px)",
              backgroundSize: "48px 48px",
            }}
          />
          {/* SDG color dots — decorative */}
          <div className="absolute top-1/4 end-1/4 w-3 h-3 rounded-full opacity-60" style={{ backgroundColor: "#C5192D" }} />
          <div className="absolute top-1/3 end-1/3 w-2 h-2 rounded-full opacity-50" style={{ backgroundColor: "#FCC30B" }} />
          <div className="absolute bottom-1/3 start-1/4 w-3 h-3 rounded-full opacity-60" style={{ backgroundColor: "#3F7E44" }} />
          <div className="absolute bottom-1/4 start-1/3 w-2 h-2 rounded-full opacity-50" style={{ backgroundColor: "#19486A" }} />
        </div>

        <div className="relative z-10 container mx-auto px-4 md:px-8 text-center">
          <motion.div
            variants={stagger}
            initial="hidden"
            animate="show"
            className="max-w-4xl mx-auto"
          >
            {/* Badge */}
            <motion.div
              variants={fadeUp}
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-medium mb-8"
            >
              <Target size={14} aria-hidden="true" />
              {t("home:hero.badge")}
            </motion.div>

            {/* H1 Headline */}
            <motion.h1
              id="hero-headline"
              variants={fadeUp}
              className="font-hero text-4xl sm:text-5xl md:text-6xl lg:text-7xl mb-4 leading-tight"
            >
              <span className="text-foreground">{t("home:hero.headline")}</span>
              <br />
              <span className="text-gradient-sdg">{t("home:hero.headlineAccent")}</span>
            </motion.h1>

            {/* Organisation name */}
            <motion.p
              variants={fadeUp}
              className="font-display text-base md:text-lg text-muted-foreground font-medium mb-4"
            >
              {t("common:foundation.name")}
            </motion.p>

            {/* Subheadline */}
            <motion.p
              variants={fadeUp}
              className="text-muted-foreground text-lg md:text-xl max-w-2xl mx-auto leading-relaxed mb-10"
            >
              {t("home:hero.subheadline")}
            </motion.p>

            {/* CTAs */}
            <motion.div
              variants={fadeUp}
              className="flex flex-wrap items-center justify-center gap-4"
            >
              <Link
                id="hero-cta-projects"
                to="/projects"
                className="inline-flex items-center gap-2 px-8 py-3.5 rounded-full bg-primary text-primary-foreground font-semibold text-base hover:bg-primary-dark transition-all duration-200 shadow-brand-drop hover:shadow-card-hover hover:-translate-y-0.5"
              >
                {t("home:hero.ctaPrimary")}
                <ArrowRight size={16} aria-hidden="true" />
              </Link>
              <Link
                id="hero-cta-about"
                to="/about"
                className="inline-flex items-center gap-2 px-8 py-3.5 rounded-full border-2 border-primary text-primary font-semibold text-base hover:bg-primary/5 transition-all duration-200"
              >
                {t("home:hero.ctaSecondary")}
              </Link>
            </motion.div>
          </motion.div>

        </div>
      </section>

      {/* ══ IMPACT STATS ══════════════════════════════════════════════ */}
      <section
        className="section-padding bg-foreground text-background"
        aria-labelledby="impact-title"
      >
        <div className="container mx-auto px-4 md:px-8">
          <motion.div
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-80px" }}
            variants={stagger}
            className="text-center mb-14"
          >
            <motion.h2
              id="impact-title"
              variants={fadeUp}
              className="font-display text-3xl md:text-4xl font-bold text-background mb-3"
            >
              {t("home:impact.title")}
            </motion.h2>
            <motion.p variants={fadeUp} className="text-background/70 max-w-xl mx-auto">
              {t("home:impact.subtitle")}
            </motion.p>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-60px" }}
            variants={stagger}
            className="grid grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8"
          >
            {IMPACT_STATS.map(({ icon: Icon, value, labelAr, labelEn }) => {
              const label = isRtl ? labelAr : labelEn;
              return (
                <motion.div
                  key={label}
                  variants={fadeUp}
                  className="flex flex-col items-center text-center p-6 rounded-3xl bg-background/5 border border-background/10 hover:bg-primary/10 hover:border-primary/30 transition-all duration-300 group"
                >
                  <div className="w-14 h-14 rounded-2xl bg-primary/20 flex items-center justify-center mb-4 group-hover:bg-primary/30 transition-colors">
                    <Icon size={26} className="text-primary" aria-hidden="true" />
                  </div>
                  <span className="font-display text-3xl md:text-4xl font-black text-background mb-1">
                    {value}
                  </span>
                  <span className="text-background/60 text-sm">{label}</span>
                </motion.div>
              );
            })}
          </motion.div>
        </div>
      </section>

      {/* ══ SDGs GRID MATRIX ══════════════════════════════════════════ */}
      <section
        className="section-padding bg-background"
        aria-labelledby="sdgs-grid-title"
      >
        <div className="container mx-auto px-4 md:px-8">
          {/* Section header */}
          <motion.div
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-60px" }}
            variants={stagger}
            className="text-center mb-14"
          >
            {/* UN SDG emblem context badge */}
            <motion.div
              variants={fadeUp}
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-muted border border-border text-muted-foreground text-xs font-medium mb-6"
            >
              <Globe2 size={12} aria-hidden="true" />
              <span>UN Sustainable Development Goals</span>
            </motion.div>

            <motion.h2
              id="sdgs-grid-title"
              variants={fadeUp}
              className="font-display text-3xl md:text-4xl font-bold text-foreground mb-4"
            >
              {t("home:sdgsGrid.sectionTitle")}
            </motion.h2>
            <motion.p variants={fadeUp} className="text-muted-foreground max-w-2xl mx-auto">
              {t("home:sdgsGrid.sectionSubtitle")}
            </motion.p>
          </motion.div>

          {/* SDG cards grid */}
          <motion.div
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-40px" }}
            variants={stagger}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 md:gap-6"
          >
            {FOUNDATION_SDGS.map((sdg: SDGItem, index: number) => (
              <SDGCard key={sdg.id} sdg={sdg} index={index} />
            ))}
          </motion.div>

          {/* UN attribution note */}
          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.6 }}
            className="text-center text-xs text-muted-foreground mt-10"
          >
            {isRtl
              ? "الأهداف والألوان الرسمية للأمم المتحدة للتنمية المستدامة — undp.org/sustainable-development-goals"
              : "Official UN Sustainable Development Goals colors & framework — undp.org/sustainable-development-goals"}
          </motion.p>
        </div>
      </section>

      {/* ══ VISION & MISSION ══════════════════════════════════════════ */}
      <section
        className="section-padding section-accent bg-gradient-to-br from-brand-50 to-background"
        aria-labelledby="mission-title"
      >
        <div className="container mx-auto px-4 md:px-8">
          <motion.div
            initial="hidden"
            whileInView="show"
            viewport={{ once: true }}
            variants={stagger}
            className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center"
          >
            {/* Mission */}
            <motion.div variants={fadeUp}>
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary/10 mb-6">
                <Target size={28} className="text-primary" aria-hidden="true" />
              </div>
              <h2
                id="mission-title"
                className="font-display text-2xl md:text-3xl font-bold mb-4"
              >
                {t("home:mission.title")}
              </h2>
              <p className="text-muted-foreground text-lg leading-relaxed">
                {t("home:mission.body")}
              </p>
            </motion.div>

            {/* Vision */}
            <motion.div variants={fadeUp}>
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-accent/10 mb-6">
                <Globe2 size={28} className="text-accent" aria-hidden="true" />
              </div>
              <h2 className="font-display text-2xl md:text-3xl font-bold mb-4">
                {t("home:vision.title")}
              </h2>
              <p className="text-muted-foreground text-lg leading-relaxed">
                {t("home:vision.body")}
              </p>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ══ CTA STRIP ═════════════════════════════════════════════════ */}
      <section className="section-padding bg-foreground text-background" aria-labelledby="cta-title">
        <div className="container mx-auto px-4 md:px-8 max-w-3xl text-center">
          <motion.div
            initial="hidden"
            whileInView="show"
            viewport={{ once: true }}
            variants={stagger}
          >
            <motion.h2
              id="cta-title"
              variants={fadeUp}
              className="font-display text-3xl md:text-4xl font-bold text-background mb-4"
            >
              {t("home:cta.title")}
            </motion.h2>
            <motion.p variants={fadeUp} className="text-background/70 text-lg leading-relaxed mb-8">
              {t("home:cta.subtitle")}
            </motion.p>
            <motion.div
              variants={fadeUp}
              className="flex flex-wrap gap-4 justify-center"
            >
              <Link
                id="cta-volunteer"
                to="/contact"
                className="px-7 py-3 rounded-full bg-primary text-primary-foreground font-semibold hover:bg-primary-dark transition-colors"
              >
                {t("home:cta.volunteer")}
              </Link>
              <Link
                id="cta-projects"
                to="/projects"
                className="px-7 py-3 rounded-full bg-accent text-accent-foreground font-semibold hover:bg-accent-dark transition-colors"
              >
                {t("home:cta.donate")}
              </Link>
              <Link
                id="cta-partner"
                to="/contact"
                className="px-7 py-3 rounded-full border-2 border-background/30 text-background font-semibold hover:bg-background/10 transition-colors"
              >
                {t("home:cta.partner")}
              </Link>
            </motion.div>
          </motion.div>
        </div>
      </section>

    </div>
  );
}
