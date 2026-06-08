import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslation } from "react-i18next";
import { ExternalLink, Users, Leaf, Mic2, Dumbbell, ChevronRight } from "lucide-react";

/* ─── Static data extracted from Facebook JSON (فريق نساء وشباب ديالى للسلام) ─── */
interface Initiative {
  id: string;
  icon: React.ElementType;
  colorVar: string;
  teamKey: "youth" | "women";
  titleKey: string;
  descriptionKey: string;
  statsKey: string;
  fbUrl: string;
}

const INITIATIVES: Initiative[] = [
  {
    id: "peace-streets",
    icon: Leaf,
    colorVar: "--sdg-13",
    teamKey: "youth",
    titleKey: "teams.initiatives.peaceStreets.title",
    descriptionKey: "teams.initiatives.peaceStreets.description",
    statsKey: "teams.initiatives.peaceStreets.stats",
    fbUrl: "https://www.facebook.com/permalink.php?story_fbid=pfbid026j1pPHpc9AXtHuP6CJYzoqF7Wb3XUc9ZiXe2PXZp3hmBWzvS6eCz42SnUedBEyB9l&id=100068375258008",
  },
  {
    id: "peace-halls",
    icon: Dumbbell,
    colorVar: "--sdg-16",
    teamKey: "youth",
    titleKey: "teams.initiatives.peaceHalls.title",
    descriptionKey: "teams.initiatives.peaceHalls.description",
    statsKey: "teams.initiatives.peaceHalls.stats",
    fbUrl: "https://www.facebook.com/100068375258008/videos/1730483111047593/",
  },
  {
    id: "peace-workshop",
    icon: Users,
    colorVar: "--sdg-5",
    teamKey: "women",
    titleKey: "teams.initiatives.peaceWorkshop.title",
    descriptionKey: "teams.initiatives.peaceWorkshop.description",
    statsKey: "teams.initiatives.peaceWorkshop.stats",
    fbUrl: "https://www.facebook.com/100068375258008/videos/2942308355935171/",
  },
  {
    id: "peace-podcast",
    icon: Mic2,
    colorVar: "--sdg-4",
    teamKey: "women",
    titleKey: "teams.initiatives.peacePodcast.title",
    descriptionKey: "teams.initiatives.peacePodcast.description",
    statsKey: "teams.initiatives.peacePodcast.stats",
    fbUrl: "https://www.facebook.com/profile.php?id=61565895878291",
  },
];

const TEAMS = [
  {
    key: "youth",
    nameKey: "teams.youth.name",
    taglineKey: "teams.youth.tagline",
    emoji: "🕊️",
    colorVar: "--sdg-16",
    fbUrl: "https://www.facebook.com/profile.php?id=100068375258008",
  },
  {
    key: "women",
    nameKey: "teams.women.name",
    taglineKey: "teams.women.tagline",
    emoji: "💚",
    colorVar: "--sdg-5",
    fbUrl: "https://www.facebook.com/profile.php?id=100068375258008",
  },
] as const;

type TeamKey = "youth" | "women" | "all";

/* ─── Variants ───────────────────────────────────────────────────── */
const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  show:   { opacity: 1, y: 0, transition: { duration: 0.5 } },
};
const stagger = { show: { transition: { staggerChildren: 0.1 } } };

/* ─── Initiative Card ─────────────────────────────────────────────── */
const InitiativeCard: React.FC<{
  initiative: Initiative;
  isRtl: boolean;
  index: number;
}> = ({ initiative, isRtl, index }) => {
  const { t } = useTranslation("about");
  const Icon = initiative.icon;
  const color = `hsl(var(${initiative.colorVar}))`;
  const colorBg = `hsl(var(${initiative.colorVar}) / 0.12)`;
  const colorBorder = `hsl(var(${initiative.colorVar}) / 0.3)`;

  return (
    <motion.div
      initial={{ opacity: 0, y: 32 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay: index * 0.08 }}
      whileHover={{ y: -6, scale: 1.01 }}
      dir={isRtl ? "rtl" : "ltr"}
      className="relative rounded-3xl border bg-card flex flex-col overflow-hidden group transition-shadow duration-300 hover:shadow-card-hover"
      style={{ borderColor: colorBorder }}
    >
      {/* Top color strip */}
      <div className="h-1.5" style={{ background: color }} />

      <div className="p-6 flex flex-col gap-4 flex-1">
        {/* Icon + team badge */}
        <div className="flex items-start justify-between gap-3">
          <div
            className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0"
            style={{ background: colorBg }}
          >
            <Icon size={22} style={{ color }} />
          </div>
          <span
            className="text-xs font-semibold px-2.5 py-1 rounded-full flex-shrink-0"
            style={{ background: colorBg, color }}
          >
            {t(`teams.${initiative.teamKey}.badge`)}
          </span>
        </div>

        {/* Title */}
        <h3 className="font-display text-base font-bold leading-snug">
          {t(initiative.titleKey)}
        </h3>

        {/* Description */}
        <p className="text-sm text-muted-foreground leading-relaxed flex-1">
          {t(initiative.descriptionKey)}
        </p>

        {/* Stats pill */}
        <div
          className="inline-flex items-center gap-2 text-xs font-semibold px-3 py-1.5 rounded-full w-fit"
          style={{ background: colorBg, color }}
        >
          {t(initiative.statsKey)}
        </div>

        {/* Facebook link */}
        <a
          href={initiative.fbUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-auto pt-3 border-t border-border/40 flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors"
          aria-label={`Open initiative on Facebook`}
        >
          <ExternalLink size={12} />
          {t("teams.viewOnFacebook")}
        </a>
      </div>
    </motion.div>
  );
};

/* ─── Main Section ────────────────────────────────────────────────── */
const TeamsActivitySection: React.FC = () => {
  const { t, i18n } = useTranslation("about");
  const isRtl = i18n.dir() === "rtl";
  const [activeTeam, setActiveTeam] = useState<TeamKey>("all");

  const filtered = activeTeam === "all"
    ? INITIATIVES
    : INITIATIVES.filter((i) => i.teamKey === activeTeam);

  return (
    <section
      id="teams-activity"
      dir={isRtl ? "rtl" : "ltr"}
      className="py-24 bg-muted/20"
      aria-label="Affiliated Teams Activity"
    >
      <div className="container mx-auto px-4 md:px-8 max-w-6xl">

        {/* Header */}
        <motion.div
          className="text-center mb-14"
          initial="hidden" whileInView="show" viewport={{ once: true }} variants={fadeUp}
        >
          <div className="inline-flex items-center gap-2 text-xs font-semibold px-3 py-1.5 rounded-full bg-primary/10 text-primary mb-4">
            🕊️ {t("teams.eyebrow")}
          </div>
          <h2 className="font-display text-3xl md:text-4xl font-bold mb-3">
            {t("teams.title")}
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            {t("teams.description")}
          </p>
        </motion.div>

        {/* Team cards (two teams) */}
        <motion.div
          initial="hidden" whileInView="show" viewport={{ once: true }} variants={stagger}
          className="grid sm:grid-cols-2 gap-4 mb-10"
        >
          {TEAMS.map((team) => {
            const color = `hsl(var(${team.colorVar}))`;
            const colorBg = `hsl(var(${team.colorVar}) / 0.1)`;
            return (
              <motion.div
                key={team.key}
                variants={fadeUp}
                className="rounded-2xl border border-border/50 bg-card p-5 flex items-center gap-4"
              >
                <span
                  className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0"
                  style={{ background: colorBg }}
                >
                  {team.emoji}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="font-display font-bold text-sm">{t(team.nameKey)}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{t(team.taglineKey)}</p>
                </div>
                <a
                  href={team.fbUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`Visit ${t(team.nameKey)} on Facebook`}
                  className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center transition-colors"
                  style={{ background: colorBg, color }}
                >
                  <ChevronRight size={14} />
                </a>
              </motion.div>
            );
          })}
        </motion.div>

        {/* Filter tabs */}
        <div className="flex flex-wrap justify-center gap-2 mb-10">
          {(["all", "youth", "women"] as TeamKey[]).map((key) => {
            const isActive = activeTeam === key;
            return (
              <button
                key={key}
                id={`team-filter-${key}`}
                onClick={() => setActiveTeam(key)}
                className={`px-5 py-2 rounded-full text-sm font-semibold transition-all duration-200 border ${
                  isActive
                    ? "bg-primary text-primary-foreground border-primary shadow-sm"
                    : "bg-transparent text-muted-foreground border-border/50 hover:border-primary/40 hover:text-foreground"
                }`}
              >
                {t(`teams.filter.${key}`)}
              </button>
            );
          })}
        </div>

        {/* Initiatives grid */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTeam}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.3 }}
            className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5"
          >
            {filtered.map((initiative, idx) => (
              <InitiativeCard
                key={initiative.id}
                initiative={initiative}
                isRtl={isRtl}
                index={idx}
              />
            ))}
          </motion.div>
        </AnimatePresence>

        {/* Partners bar */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.4, duration: 0.6 }}
          className="mt-14 rounded-2xl border border-border/50 bg-card p-6 text-center"
        >
          <p className="text-xs text-muted-foreground mb-4 font-medium uppercase tracking-widest">
            {t("teams.partners.label")}
          </p>
          <div className="flex flex-wrap justify-center items-center gap-6">
            <span className="text-sm font-bold text-foreground/70">🇺🇳 UNDP</span>
            <span className="w-px h-5 bg-border/50" />
            <span className="text-sm font-bold text-foreground/70">
              {t("teams.partners.hawa")}
            </span>
            <span className="w-px h-5 bg-border/50" />
            <span className="text-sm font-bold text-foreground/70">
              {t("teams.partners.rahma")}
            </span>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default TeamsActivitySection;
