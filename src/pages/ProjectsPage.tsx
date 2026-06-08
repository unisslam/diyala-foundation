/**
 * ProjectsPage.tsx
 * ----------------
 * Sections:
 *  1. PageHero   — unified hero component
 *  2. Filters    — status + category filter pills + text search
 *  3. Grid       — animated project cards with Supabase data
 *  4. Empty      — empty state when no matches
 */

import React, { useState, useEffect, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  Users,
  CalendarDays,
  MapPin,
  ArrowRight,
  Star,
  Filter,
  X,
} from "lucide-react";
import { Link } from "react-router-dom";
import PageHero from "@/components/shared/PageHero";
import { supabase } from "@/lib/supabaseClient";
import type { ProjectRow, ProjectStatus, ProjectCategory } from "@/types/database.types";

/* ── Animation variants ─────────────────────────────────────────────── */
const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08 } },
};
const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" as any } },
};

/* ── Status config ──────────────────────────────────────────────────── */
const STATUS_COLORS: Record<string, { bg: string; text: string; dot: string }> = {
  active:    { bg: "bg-emerald-100 dark:bg-emerald-900/30", text: "text-emerald-700 dark:text-emerald-400", dot: "bg-emerald-500" },
  completed: { bg: "bg-blue-100 dark:bg-blue-900/30",    text: "text-blue-700 dark:text-blue-400",    dot: "bg-blue-500" },
  planned:   { bg: "bg-amber-100 dark:bg-amber-900/30",  text: "text-amber-700 dark:text-amber-400",  dot: "bg-amber-500" },
  on_hold:   { bg: "bg-slate-100 dark:bg-slate-800",     text: "text-slate-600 dark:text-slate-400",  dot: "bg-slate-400" },
};

/* ── Category gradient map ──────────────────────────────────────────── */
const CATEGORY_GRADIENT: Record<string, string> = {
  water_management: "from-sky-500 to-blue-700",
  environmental:    "from-emerald-500 to-teal-700",
  community:        "from-violet-500 to-purple-700",
  research:         "from-amber-500 to-orange-600",
  education:        "from-rose-500 to-red-700",
  health:           "from-pink-500 to-fuchsia-700",
};

/* ── SDG color helper ───────────────────────────────────────────────── */
const SDG_COLORS: Record<string, string> = {
  "3":  "#4C9F38", "4":  "#C5192D", "5":  "#FF3A21",
  "6":  "#26BDE2", "7":  "#FCC30B", "8":  "#A21942",
  "11": "#FD9D24", "13": "#3F7E44", "14": "#0A97D9",
  "16": "#00689D", "17": "#19486A",
};

/* ── Format number ──────────────────────────────────────────────────── */
function formatNumber(n: number, isRtl: boolean): string {
  if (n >= 1000) return `${(n / 1000).toFixed(0)}k${isRtl ? "+" : "+"}`;
  return n.toLocaleString();
}

/* ── ProjectCard ────────────────────────────────────────────────────── */
interface ProjectCardProps {
  project: ProjectRow;
  isRtl: boolean;
}

function ProjectCard({ project, isRtl }: ProjectCardProps): React.ReactElement {
  const { t } = useTranslation("projects");
  const title = isRtl ? project.title_ar : project.title_en;
  const description = isRtl ? project.description_ar : project.description_en;
  const location = isRtl ? project.location_ar : project.location_en;
  const statusCfg = STATUS_COLORS[project.status] ?? STATUS_COLORS.active;
  const gradient = CATEGORY_GRADIENT[project.category] ?? "from-primary to-secondary";

  return (
    <motion.article
      variants={fadeUp}
      className="group relative flex flex-col rounded-3xl overflow-hidden border border-border bg-card hover:shadow-card-hover transition-all duration-300 hover:-translate-y-1.5"
      aria-labelledby={`project-${project.id}-title`}
    >
      {/* Cover — real image or gradient fallback */}
      <div className={`relative h-44 overflow-hidden flex items-end p-5 ${!project.cover_image_path ? `bg-gradient-to-br ${gradient}` : "bg-muted"}`}>
        {project.cover_image_path && (
          <img
            src={project.cover_image_path}
            alt={title}
            className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            loading="lazy"
          />
        )}
        {/* SDG tags */}
        {project.sdg_tags && project.sdg_tags.length > 0 && (
          <div className="absolute top-3 start-3 flex gap-1.5 flex-wrap">
            {project.sdg_tags.slice(0, 3).map((sdg: string) => (
              <span
                key={sdg}
                className="text-[10px] font-bold px-2 py-0.5 rounded-full text-white"
                style={{ backgroundColor: SDG_COLORS[sdg] ?? "#19486A" }}
              >
                SDG {sdg}
              </span>
            ))}
          </div>
        )}

        {/* Featured badge */}
        {project.is_featured && (
          <div className="absolute top-3 end-3 flex items-center gap-1 px-2.5 py-1 rounded-full bg-accent text-accent-foreground text-[10px] font-bold">
            <Star size={10} />
            {t("card.featured")}
          </div>
        )}

        <div className="absolute bottom-0 start-0 end-0 h-24 bg-gradient-to-t from-black/50 to-transparent" />
      </div>

      {/* Card body */}
      <div className="flex flex-col flex-1 p-5 gap-3">
        {/* Status pill */}
        <div className="flex items-center justify-between">
          <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold ${statusCfg.bg} ${statusCfg.text}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${statusCfg.dot}`} />
            {t(`status.${project.status}`)}
          </span>
          <span className="text-xs text-muted-foreground capitalize">
            {t(`category.${project.category}`)}
          </span>
        </div>

        {/* Title */}
        <h3
          id={`project-${project.id}-title`}
          className="font-display font-bold text-base leading-snug text-foreground line-clamp-2"
        >
          {title}
        </h3>

        {/* Description */}
        <p className="text-sm text-muted-foreground leading-relaxed line-clamp-2 flex-1">
          {description}
        </p>

        {/* Meta row */}
        <div className="flex flex-wrap gap-3 text-xs text-muted-foreground pt-1">
          {project.beneficiaries_count != null && project.beneficiaries_count > 0 && (
            <span className="flex items-center gap-1">
              <Users size={12} className="text-primary" />
              {formatNumber(project.beneficiaries_count, isRtl)} {t("card.beneficiaries")}
            </span>
          )}
          {project.start_date && (
            <span className="flex items-center gap-1">
              <CalendarDays size={12} className="text-primary" />
              {new Date(project.start_date).getFullYear()}
            </span>
          )}
          {location && (
            <span className="flex items-center gap-1">
              <MapPin size={12} className="text-primary" />
              {location}
            </span>
          )}
        </div>

        {/* CTA */}
        <Link
          to={`/projects/${project.slug}`}
          className="mt-auto inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:text-primary-dark transition-colors group-hover:gap-2.5"
        >
          {t("card.readMore")}
          <ArrowRight size={14} className="transition-transform group-hover:translate-x-0.5 rtl:rotate-180" />
        </Link>
      </div>

      {/* Hover accent border */}
      <div className="absolute bottom-0 start-0 end-0 h-0.5 scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-start bg-primary" />
    </motion.article>
  );
}

/* ── Filter Pill ────────────────────────────────────────────────────── */
interface PillProps {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}
function Pill({ active, onClick, children }: PillProps): React.ReactElement {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all duration-200 border whitespace-nowrap ${
        active
          ? "bg-primary text-primary-foreground border-primary shadow-sm"
          : "bg-card text-muted-foreground border-border hover:border-primary hover:text-primary"
      }`}
    >
      {children}
    </button>
  );
}

/* ── Skeleton card ──────────────────────────────────────────────────── */
function SkeletonCard(): React.ReactElement {
  return (
    <div className="rounded-3xl overflow-hidden border border-border bg-card">
      <div className="h-44 shimmer" />
      <div className="p-5 space-y-3">
        <div className="h-4 w-24 shimmer rounded-full" />
        <div className="h-5 w-3/4 shimmer rounded-lg" />
        <div className="h-4 w-full shimmer rounded-lg" />
        <div className="h-4 w-2/3 shimmer rounded-lg" />
      </div>
    </div>
  );
}

/* ── ProjectsPage ───────────────────────────────────────────────────── */
export default function ProjectsPage(): React.ReactElement {
  const { t, i18n } = useTranslation(["projects", "common"]);
  const isRtl = i18n.dir() === "rtl";

  const [projects, setProjects] = useState<ProjectRow[]>([]);
  const [filtered, setFiltered] = useState<ProjectRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [activeStatus, setActiveStatus] = useState<ProjectStatus | "all">("all");
  const [activeCategory, setActiveCategory] = useState<ProjectCategory | "all">("all");

  const fetchProjects = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const { data, error: err } = await supabase
        .from("projects")
        .select("*")
        .eq("is_published", true)
        .order("is_featured", { ascending: false })
        .order("start_date", { ascending: false });

      if (err) throw err;
      setProjects((data ?? []) as ProjectRow[]);
    } catch (e) {
      setError(t("error"));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => { fetchProjects(); }, [fetchProjects]);

  // Client-side filter + search
  useEffect(() => {
    let list = [...projects];
    if (activeStatus !== "all") list = list.filter((p) => p.status === activeStatus);
    if (activeCategory !== "all") list = list.filter((p) => p.category === activeCategory);
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(
        (p) =>
          p.title_ar?.toLowerCase().includes(q) ||
          p.title_en?.toLowerCase().includes(q) ||
          p.description_ar?.toLowerCase().includes(q) ||
          p.description_en?.toLowerCase().includes(q)
      );
    }
    setFiltered(list);
  }, [projects, activeStatus, activeCategory, search]);

  const statusOptions: Array<{ key: ProjectStatus | "all"; label: string }> = [
    { key: "all",       label: t("filter.all") },
    { key: "active",    label: t("filter.active") },
    { key: "completed", label: t("filter.completed") },
    { key: "planned",   label: t("filter.planned") },
    { key: "on_hold",   label: t("filter.on_hold") },
  ];

  const categoryOptions: Array<{ key: ProjectCategory | "all"; label: string }> = [
    { key: "all",              label: t("category.all") },
    { key: "water_management", label: t("category.water_management") },
    { key: "environmental",    label: t("category.environmental") },
    { key: "community",        label: t("category.community") },
    { key: "research",         label: t("category.research") },
    { key: "education",        label: t("category.education") },
    { key: "health",           label: t("category.health") },
  ];

  const hasActiveFilter = activeStatus !== "all" || activeCategory !== "all" || search.trim().length > 0;

  return (
    <div dir={isRtl ? "rtl" : "ltr"}>
      {/* ── HERO ────────────────────────────────────────────────────── */}
      <PageHero
        eyebrow="SDG Projects"
        titleKey="projects:hero.title"
        subtitleKey="projects:hero.subtitle"
        gradient="from-sky-500/20 via-background to-background"
      />

      {/* ── FILTERS + SEARCH ────────────────────────────────────────── */}
      <section className="sticky top-0 z-20 bg-background/90 backdrop-blur-md border-b border-border py-4 shadow-sm">
        <div className="container mx-auto px-4 md:px-8 space-y-3">
          {/* Search bar */}
          <div className="relative max-w-md">
            <Search
              size={16}
              className="absolute top-1/2 -translate-y-1/2 start-3.5 text-muted-foreground pointer-events-none"
            />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t("search.placeholder")}
              className="w-full ps-10 pe-9 py-2.5 rounded-xl border border-border bg-card focus:outline-none focus:ring-2 focus:ring-primary text-sm"
              dir={isRtl ? "rtl" : "ltr"}
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute top-1/2 -translate-y-1/2 end-3 text-muted-foreground hover:text-foreground"
                aria-label="Clear search"
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* Status + Category pills */}
          <div className="flex flex-wrap items-center gap-2">
            <Filter size={14} className="text-muted-foreground shrink-0" />
            <div className="flex flex-wrap gap-1.5">
              {statusOptions.map((opt) => (
                <Pill
                  key={opt.key}
                  active={activeStatus === opt.key}
                  onClick={() => setActiveStatus(opt.key)}
                >
                  {opt.label}
                </Pill>
              ))}
            </div>
            <div className="w-px h-5 bg-border mx-1 hidden sm:block" />
            <div className="flex flex-wrap gap-1.5">
              {categoryOptions.slice(1).map((opt) => (
                <Pill
                  key={opt.key}
                  active={activeCategory === opt.key}
                  onClick={() => setActiveCategory(opt.key as ProjectCategory)}
                >
                  {opt.label}
                </Pill>
              ))}
            </div>
            {hasActiveFilter && (
              <button
                onClick={() => { setActiveStatus("all"); setActiveCategory("all"); setSearch(""); }}
                className="ms-auto flex items-center gap-1 text-xs text-muted-foreground hover:text-destructive transition-colors"
              >
                <X size={12} />
                {isRtl ? "إلغاء التصفية" : "Clear filters"}
              </button>
            )}
          </div>

          {/* Count */}
          {!loading && (
            <p className="text-xs text-muted-foreground">
              {isRtl
                ? `${filtered.length} مشروع`
                : `${filtered.length} Projects`}
            </p>
          )}
        </div>
      </section>

      {/* ── PROJECTS GRID ───────────────────────────────────────────── */}
      <section className="section-padding bg-background">
        <div className="container mx-auto px-4 md:px-8">
          {/* Error */}
          {error && (
            <div className="text-center py-16">
              <p className="text-destructive mb-4">{error}</p>
              <button
                onClick={fetchProjects}
                className="px-6 py-2.5 rounded-full bg-primary text-primary-foreground text-sm font-medium hover:bg-primary-dark transition-colors"
              >
                {isRtl ? "إعادة المحاولة" : "Retry"}
              </button>
            </div>
          )}

          {/* Loading skeleton */}
          {loading && !error && (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
            </div>
          )}

          {/* Empty state */}
          {!loading && !error && filtered.length === 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center py-24"
            >
              <div className="w-20 h-20 mx-auto mb-6 rounded-3xl bg-muted flex items-center justify-center">
                <Search size={32} className="text-muted-foreground" />
              </div>
              <h3 className="font-display text-xl font-bold mb-2">{t("empty.title")}</h3>
              <p className="text-muted-foreground">{t("empty.subtitle")}</p>
            </motion.div>
          )}

          {/* Cards grid */}
          {!loading && !error && filtered.length > 0 && (
            <AnimatePresence mode="wait">
              <motion.div
                key={`${activeStatus}-${activeCategory}-${search}`}
                variants={stagger}
                initial="hidden"
                animate="show"
                className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6"
              >
                {filtered.map((project) => (
                  <ProjectCard key={project.id} project={project} isRtl={isRtl} />
                ))}
              </motion.div>
            </AnimatePresence>
          )}
        </div>
      </section>
    </div>
  );
}
