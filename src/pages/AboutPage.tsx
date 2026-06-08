import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import {
  Eye, Target, Handshake, Lightbulb, Leaf, Users,
  CheckCircle, Calendar, Globe2, BookOpen,
  ChevronDown,
} from "lucide-react";

import PageHero from "@/components/shared/PageHero";
import TeamSection from "@/components/sections/TeamSection";
import TestimonialsTrack from "@/components/sections/TestimonialsTrack";
import TestimonialSubmitModal from "@/components/sections/TestimonialSubmitModal";
import TeamsActivitySection from "@/components/sections/TeamsActivitySection";
import { useSupabaseQuery } from "@/hooks/useSupabaseQuery";
import type { ImpactStatRow } from "@/types/database.types";

/* ─── Animation variants ──────────────────────────────────────────── */
const fadeUp = {
  hidden: { opacity: 0, y: 28 },
  show:   { opacity: 1, y: 0, transition: { duration: 0.6 } },
};
const stagger = { show: { transition: { staggerChildren: 0.1 } } };

/* ─── Icon map for impact stats ────────────────────────────────────── */
const ICON_MAP: Record<string, React.ElementType> = {
  Users, CheckCircle, Calendar, Globe2, BookOpen,
};

/* ─── SDG goal data ─────────────────────────────────────────────────── */
const SDG_GOALS = [
  { number: "04", colorVar: "--sdg-4",  icon: "📚" },
  { number: "05", colorVar: "--sdg-5",  icon: "♀️" },
  { number: "08", colorVar: "--sdg-8",  icon: "💼" },
  { number: "13", colorVar: "--sdg-13", icon: "🌍" },
  { number: "16", colorVar: "--sdg-16", icon: "🕊️" },
  { number: "17", colorVar: "--sdg-17", icon: "🤝" },
];

/* ─── Timeline item ────────────────────────────────────────────────── */
interface TimelineItemProps {
  year: string;
  title: string;
  description: string;
  index: number;
  isRtl: boolean;
}
const TimelineItem: React.FC<TimelineItemProps> = ({ year, title, description, index, isRtl }) => {
  const [open, setOpen] = useState(false);
  const isLeft = index % 2 === 0;

  return (
    <motion.div
      initial="hidden"
      whileInView="show"
      viewport={{ once: true }}
      variants={fadeUp}
      className="relative flex items-start gap-6 md:gap-10"
    >
      {/* Year bubble */}
      <div className="flex-shrink-0 w-20 text-center">
        <span className="inline-block px-3 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-bold border border-primary/20">
          {year}
        </span>
        {/* Connector line */}
        <div className="mx-auto mt-2 w-px h-full bg-border/50" />
      </div>

      {/* Card */}
      <button
        onClick={() => setOpen(!open)}
        className="flex-1 text-start bg-card border border-border/50 rounded-2xl p-5 shadow-sm hover:shadow-card hover:border-primary/30 transition-all duration-300 group mb-6"
        aria-expanded={open}
      >
        <div className="flex items-center justify-between gap-3">
          <h3 className="font-display text-base font-bold group-hover:text-primary transition-colors">
            {title}
          </h3>
          <motion.div animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.3 }}>
            <ChevronDown size={16} className="text-muted-foreground flex-shrink-0" />
          </motion.div>
        </div>
        <motion.div
          initial={false}
          animate={{ height: open ? "auto" : 0, opacity: open ? 1 : 0 }}
          transition={{ duration: 0.3 }}
          className="overflow-hidden"
        >
          <p className="text-sm text-muted-foreground leading-relaxed mt-3">{description}</p>
        </motion.div>
      </button>
    </motion.div>
  );
};

/* ═══════════════════════════════════════════════════════════════════
   ABOUT PAGE
   ═══════════════════════════════════════════════════════════════════ */
export default function AboutPage(): React.ReactElement {
  const { t, i18n } = useTranslation("about");
  const isRtl = i18n.dir() === "rtl";
  const [modalOpen, setModalOpen] = useState(false);

  /* Live impact stats from Supabase */
  const { data: statsData } = useSupabaseQuery<ImpactStatRow>({
    table: "impact_stats",
    orderBy: { column: "display_order", ascending: true },
  });

  const FALLBACK_STATS: ImpactStatRow[] = [
    { id: "1", updated_at: "", stat_key: "beneficiaries_total", value_number: 25000, label_ar: "إجمالي المستفيدين",   label_en: "Total Beneficiaries",    icon_name: "Users",        display_order: 1 },
    { id: "2", updated_at: "", stat_key: "projects_completed",  value_number: 47,    label_ar: "مشاريع منجزة",         label_en: "Completed Projects",     icon_name: "CheckCircle",  display_order: 2 },
    { id: "3", updated_at: "", stat_key: "years_active",        value_number: 8,     label_ar: "سنوات من العمل",        label_en: "Years of Impact",        icon_name: "Calendar",     display_order: 3 },
    { id: "4", updated_at: "", stat_key: "partnerships",        value_number: 15,    label_ar: "شراكات استراتيجية",     label_en: "Strategic Partnerships", icon_name: "Globe2",       display_order: 4 },
  ];
  const impactStats = statsData.length > 0 ? statsData : FALLBACK_STATS;

  const timeline: { year: string; title: string; description: string }[] =
    t("history.timeline", { returnObjects: true }) as any;

  const values = [
    { icon: Eye,        key: "transparency" },
    { icon: Handshake,  key: "collaboration" },
    { icon: Leaf,       key: "sustainability" },
    { icon: Lightbulb,  key: "empowerment" },
  ];

  return (
    <div dir={isRtl ? "rtl" : "ltr"} className="min-h-screen bg-background">

      {/* ── 1. HERO ─────────────────────────────────────────────────── */}
      <PageHero
        titleKey="hero.title"
        subtitleKey="hero.subtitle"
        namespace="about"
      />

      {/* ── 2. INTRO — Vision & Mission ────────────────────────────── */}
      <section className="py-24 bg-background" id="intro">
        <div className="container mx-auto px-4 md:px-8 max-w-5xl">
          <motion.div
            initial="hidden" whileInView="show" viewport={{ once: true }}
            variants={stagger}
            className="grid md:grid-cols-2 gap-8"
          >
            {/* Vision */}
            <motion.div variants={fadeUp} className="rounded-3xl border border-primary/20 bg-primary/5 p-8">
              <div className="w-14 h-14 rounded-2xl bg-primary/15 flex items-center justify-center mb-6">
                <Eye size={26} className="text-primary" />
              </div>
              <h2 className="font-display text-xl font-bold mb-3">{t("intro.vision")}</h2>
              <p className="text-muted-foreground leading-relaxed">{t("intro.visionText")}</p>
            </motion.div>

            {/* Mission */}
            <motion.div variants={fadeUp} className="rounded-3xl border border-sdg-8/30 bg-sdg-8/5 p-8">
              <div className="w-14 h-14 rounded-2xl bg-sdg-8/15 flex items-center justify-center mb-6">
                <Target size={26} className="text-sdg-8" />
              </div>
              <h2 className="font-display text-xl font-bold mb-3">{t("intro.mission")}</h2>
              <p className="text-muted-foreground leading-relaxed">{t("intro.missionText")}</p>
            </motion.div>
          </motion.div>

          {/* Intro description */}
          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3, duration: 0.7 }}
            className="mt-10 text-center text-muted-foreground leading-loose max-w-3xl mx-auto"
          >
            {t("intro.description")}
          </motion.p>
        </div>
      </section>

      {/* ── 3. SDG FOCUS ────────────────────────────────────────────── */}
      <section className="py-24 bg-muted/20" id="sdgs">
        <div className="container mx-auto px-4 md:px-8 max-w-5xl">
          <motion.div
            className="text-center mb-14"
            initial="hidden" whileInView="show" viewport={{ once: true }} variants={fadeUp}
          >
            <h2 className="font-display text-3xl md:text-4xl font-bold mb-3">
              {t("sdgFocus.title")}
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">{t("sdgFocus.description")}</p>
          </motion.div>

          <motion.div
            initial="hidden" whileInView="show" viewport={{ once: true }} variants={stagger}
            className="grid grid-cols-2 sm:grid-cols-3 gap-4"
          >
            {SDG_GOALS.map(({ number, colorVar, icon }) => {
              const goalKey = String(parseInt(number));
              const goal = t(`sdgFocus.goals.${goalKey}`, { returnObjects: true }) as { title: string; description: string };
              return (
                <motion.div
                  key={number}
                  variants={fadeUp}
                  whileHover={{ y: -4, scale: 1.02 }}
                  className="group rounded-2xl border border-border/50 bg-card p-5 flex flex-col gap-3 hover:shadow-card-hover transition-all duration-300 cursor-default"
                  style={{ borderTopColor: `hsl(var(${colorVar}))`, borderTopWidth: "3px" }}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{icon}</span>
                    <span
                      className="text-xs font-bold px-2 py-0.5 rounded-full"
                      style={{
                        background: `hsl(var(${colorVar}) / 0.15)`,
                        color: `hsl(var(${colorVar}))`,
                      }}
                    >
                      SDG {parseInt(number)}
                    </span>
                  </div>
                  <h3 className="font-display font-bold text-sm leading-snug">{goal.title}</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">{goal.description}</p>
                </motion.div>
              );
            })}
          </motion.div>
        </div>
      </section>

      {/* ── 4. IMPACT STATS ─────────────────────────────────────────── */}
      <section className="py-24 bg-background" id="impact">
        <div className="container mx-auto px-4 md:px-8 max-w-5xl">
          <motion.div
            className="text-center mb-14"
            initial="hidden" whileInView="show" viewport={{ once: true }} variants={fadeUp}
          >
            <h2 className="font-display text-3xl md:text-4xl font-bold mb-3">
              {t("impact.title")}
            </h2>
            <p className="text-muted-foreground">{t("impact.description")}</p>
          </motion.div>

          <motion.div
            initial="hidden" whileInView="show" viewport={{ once: true }} variants={stagger}
            className="grid grid-cols-2 lg:grid-cols-4 gap-5"
          >
            {impactStats.map((stat) => {
              const Icon = ICON_MAP[stat.icon_name] ?? Users;
              const label = isRtl ? stat.label_ar : stat.label_en;
              return (
                <motion.div
                  key={stat.id}
                  variants={fadeUp}
                  whileHover={{ y: -5 }}
                  className="glass-card rounded-3xl p-7 text-center hover:shadow-card-hover transition-all duration-300"
                >
                  <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                    <Icon size={26} className="text-primary" />
                  </div>
                  <p className="font-hero text-4xl font-black text-primary mb-1">
                    {stat.value_number.toLocaleString()}
                    <span className="text-2xl">+</span>
                  </p>
                  <p className="text-sm text-muted-foreground font-medium">{label}</p>
                </motion.div>
              );
            })}
          </motion.div>
        </div>
      </section>

      {/* ── 5. TEAM ─────────────────────────────────────────────────── */}
      <TeamSection />

      {/* ── 6. HISTORY TIMELINE ─────────────────────────────────────── */}
      <section className="py-24 bg-muted/20" id="history">
        <div className="container mx-auto px-4 md:px-8 max-w-3xl">
          <motion.div
            className="text-center mb-14"
            initial="hidden" whileInView="show" viewport={{ once: true }} variants={fadeUp}
          >
            <h2 className="font-display text-3xl md:text-4xl font-bold mb-3">
              {t("history.title")}
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto">{t("history.description")}</p>
          </motion.div>

          <div className="relative">
            {/* Vertical line */}
            <div className={`absolute top-0 bottom-0 w-px bg-border/40 ${isRtl ? "right-20" : "left-20"}`} />

            <div className="flex flex-col">
              {Array.isArray(timeline) && timeline.map((item, idx) => (
                <TimelineItem
                  key={idx}
                  year={item.year}
                  title={item.title}
                  description={item.description}
                  index={idx}
                  isRtl={isRtl}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── 7. TEAMS ACTIVITY ────────────────────────────────────── */}
      <TeamsActivitySection />

      {/* ── 8. TESTIMONIALS TRACK ────────────────────────────────────── */}
      <TestimonialsTrack onSubmitClick={() => setModalOpen(true)} />

      {/* ── 8. VALUES ───────────────────────────────────────────────── */}
      <section className="py-24 bg-background" id="values">
        <div className="container mx-auto px-4 md:px-8 max-w-5xl">
          <motion.div
            className="text-center mb-14"
            initial="hidden" whileInView="show" viewport={{ once: true }} variants={fadeUp}
          >
            <h2 className="font-display text-3xl md:text-4xl font-bold mb-3">
              {t("values.title")}
            </h2>
          </motion.div>

          <motion.div
            initial="hidden" whileInView="show" viewport={{ once: true }} variants={stagger}
            className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6"
          >
            {values.map(({ icon: Icon, key }, idx) => (
              <motion.div
                key={key}
                variants={fadeUp}
                whileHover={{ y: -5 }}
                className="glass-card rounded-2xl p-6 text-center hover:shadow-card-hover transition-all duration-300"
              >
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <Icon size={22} className="text-primary" />
                </div>
                <h3 className="font-display font-bold mb-2">
                  {t(`values.items.${key}.title`)}
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {t(`values.items.${key}.description`)}
                </p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Testimonial Submit Modal */}
      <TestimonialSubmitModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
      />
    </div>
  );
}
