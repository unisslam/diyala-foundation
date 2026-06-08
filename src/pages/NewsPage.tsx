/**
 * NewsPage.tsx — المركز الإعلامي
 * --------------------------------
 * Sections:
 *  1. PageHero        — unified hero
 *  2. Featured Story  — hero-sized card for is_featured=true
 *  3. Filter Bar      — sticky category pills + search
 *  4. News Grid       — animated cards in 3-column masonry-like layout
 *  5. Empty / Error   — graceful fallback states
 */

import React, { useState, useEffect, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  Eye,
  CalendarDays,
  ArrowRight,
  Star,
  Newspaper,
  Megaphone,
  FileText,
  CalendarCheck,
  Radio,
  X,
  Filter,
} from "lucide-react";
import { Link } from "react-router-dom";
import PageHero from "@/components/shared/PageHero";
import { supabase } from "@/lib/supabaseClient";
import type { NewsRow, NewsCategory } from "@/types/database.types";

/* ── Animation variants ─────────────────────────────────────────────── */
const stagger = { hidden: {}, show: { transition: { staggerChildren: 0.07 } } };
const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.45, ease: "easeOut" } },
};

/* ── Category config ────────────────────────────────────────────────── */
interface CategoryConfig {
  icon: React.ElementType;
  color: string;
  bg: string;
  text: string;
}

const CATEGORY_CFG: Record<string, CategoryConfig> = {
  news:          { icon: Newspaper,    color: "#1d4ed8", bg: "bg-blue-100 dark:bg-blue-900/30",    text: "text-blue-700 dark:text-blue-300" },
  announcement:  { icon: Megaphone,    color: "#7c3aed", bg: "bg-violet-100 dark:bg-violet-900/30", text: "text-violet-700 dark:text-violet-300" },
  report:        { icon: FileText,     color: "#0f766e", bg: "bg-teal-100 dark:bg-teal-900/30",    text: "text-teal-700 dark:text-teal-300" },
  event:         { icon: CalendarCheck, color: "#d97706", bg: "bg-amber-100 dark:bg-amber-900/30",  text: "text-amber-700 dark:text-amber-300" },
  press_release: { icon: Radio,        color: "#be185d", bg: "bg-pink-100 dark:bg-pink-900/30",    text: "text-pink-700 dark:text-pink-300" },
};

/* ── Category gradient for cover images ─────────────────────────────── */
const CATEGORY_GRADIENT: Record<string, string> = {
  news:          "from-blue-600 to-indigo-800",
  announcement:  "from-violet-600 to-purple-800",
  report:        "from-teal-600 to-emerald-800",
  event:         "from-amber-500 to-orange-700",
  press_release: "from-pink-600 to-rose-800",
};

/* ── Date formatter ─────────────────────────────────────────────────── */
function formatDate(iso: string, locale: string): string {
  return new Intl.DateTimeFormat(locale === "ar" ? "ar-IQ" : "en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(iso));
}

/* ── Estimate reading time ──────────────────────────────────────────── */
function readingTime(text: string | null): number {
  if (!text) return 2;
  return Math.max(1, Math.ceil(text.split(/\s+/).length / 200));
}

/* ── Filter Pill ────────────────────────────────────────────────────── */
interface PillProps {
  active: boolean;
  onClick: () => void;
  icon?: React.ElementType;
  children: React.ReactNode;
  color?: string;
}
function Pill({ active, onClick, icon: Icon, children, color }: PillProps): React.ReactElement {
  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all duration-200 border whitespace-nowrap ${
        active
          ? "bg-primary text-primary-foreground border-primary shadow-sm"
          : "bg-card text-muted-foreground border-border hover:border-primary hover:text-primary"
      }`}
      style={active && color ? { backgroundColor: color, borderColor: color } : {}}
    >
      {Icon && <Icon size={12} />}
      {children}
    </button>
  );
}

/* ── Skeleton card ──────────────────────────────────────────────────── */
function SkeletonCard({ tall = false }: { tall?: boolean }): React.ReactElement {
  return (
    <div className={`rounded-3xl overflow-hidden border border-border bg-card ${tall ? "sm:col-span-2" : ""}`}>
      <div className={`${tall ? "h-64" : "h-40"} shimmer`} />
      <div className="p-5 space-y-3">
        <div className="h-4 w-20 shimmer rounded-full" />
        <div className="h-5 w-full shimmer rounded-lg" />
        <div className="h-4 w-3/4 shimmer rounded-lg" />
        <div className="flex gap-3 pt-1">
          <div className="h-3 w-16 shimmer rounded" />
          <div className="h-3 w-12 shimmer rounded" />
        </div>
      </div>
    </div>
  );
}

/* ── FeaturedCard (hero) ─────────────────────────────────────────────── */
interface FeaturedCardProps { article: NewsRow; isRtl: boolean; locale: string; }
function FeaturedCard({ article, isRtl, locale }: FeaturedCardProps): React.ReactElement {
  const { t } = useTranslation("news");
  const title   = isRtl ? article.title_ar   : article.title_en;
  const excerpt = isRtl ? article.excerpt_ar  : article.excerpt_en;
  const cfg     = CATEGORY_CFG[article.category] ?? CATEGORY_CFG.news;
  const Icon    = cfg.icon;
  const gradient = CATEGORY_GRADIENT[article.category] ?? "from-primary to-secondary";

  return (
    <motion.article
      initial={{ opacity: 0, y: 28 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.65 }}
      className="group relative rounded-3xl overflow-hidden border border-border bg-card shadow-glass hover:shadow-card-hover transition-all duration-300"
    >
      {/* Cover — real image or gradient fallback */}
      <div className={`relative h-72 md:h-96 overflow-hidden ${!article.cover_image_path ? `bg-gradient-to-br ${gradient}` : "bg-muted"}`}>
        {article.cover_image_path && (
          <img
            src={article.cover_image_path}
            alt={title}
            className="absolute inset-0 w-full h-full object-cover"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

        {/* Featured badge */}
        <div className="absolute top-5 start-5 flex items-center gap-1.5 px-3 py-1 rounded-full bg-accent text-accent-foreground text-xs font-bold">
          <Star size={11} />
          {t("featured.label")}
        </div>

        {/* Category badge */}
        <div className={`absolute top-5 end-5 flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${cfg.bg} ${cfg.text}`}>
          <Icon size={11} />
          {t(`category.${article.category}`)}
        </div>

        {/* Meta overlay */}
        <div className="absolute bottom-0 start-0 end-0 p-6">
          <h2 className="font-display text-2xl md:text-3xl font-bold text-white leading-snug mb-2 line-clamp-2">
            {title}
          </h2>
          <p className="text-white/80 text-sm line-clamp-2 mb-4">{excerpt}</p>
          <div className="flex items-center gap-4 text-white/60 text-xs">
            {article.published_at && (
              <span className="flex items-center gap-1">
                <CalendarDays size={12} />
                {formatDate(article.published_at, locale)}
              </span>
            )}
            <span className="flex items-center gap-1">
              <Eye size={12} />
              {article.views_count.toLocaleString()} {t("card.views")}
            </span>
          </div>
        </div>
      </div>

      {/* CTA */}
      <div className="p-5 flex justify-end">
        <Link
          to={`/news/${article.slug}`}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary-dark transition-colors"
        >
          {t("card.readMore")}
          <ArrowRight size={14} className="rtl:rotate-180" />
        </Link>
      </div>
    </motion.article>
  );
}

/* ── NewsCard ────────────────────────────────────────────────────────── */
interface NewsCardProps { article: NewsRow; isRtl: boolean; locale: string; }
function NewsCard({ article, isRtl, locale }: NewsCardProps): React.ReactElement {
  const { t } = useTranslation("news");
  const title   = isRtl ? article.title_ar  : article.title_en;
  const excerpt = isRtl ? article.excerpt_ar : article.excerpt_en;
  const body    = isRtl ? article.body_ar    : article.body_en;
  const cfg     = CATEGORY_CFG[article.category] ?? CATEGORY_CFG.news;
  const Icon    = cfg.icon;
  const gradient = CATEGORY_GRADIENT[article.category] ?? "from-primary to-secondary";
  const mins    = readingTime(body);

  return (
    <motion.article
      variants={fadeUp}
      className="group flex flex-col rounded-3xl overflow-hidden border border-border bg-card hover:shadow-card-hover transition-all duration-300 hover:-translate-y-1"
    >
      {/* Cover — real image or gradient fallback */}
      <div className={`relative h-44 overflow-hidden ${!article.cover_image_path ? `bg-gradient-to-br ${gradient}` : "bg-muted"}`}>
        {article.cover_image_path ? (
          <img
            src={article.cover_image_path}
            alt={title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            loading="lazy"
          />
        ) : (
          <>
            <div
              className="absolute inset-0 opacity-10"
              style={{
                backgroundImage:
                  "linear-gradient(rgba(255,255,255,.3) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.3) 1px, transparent 1px)",
                backgroundSize: "24px 24px",
              }}
            />
          </>
        )}
        {/* Category badge */}
        <div className={`absolute top-3 start-3 flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold ${cfg.bg} ${cfg.text}`}>
          <Icon size={10} />
          {t(`category.${article.category}`)}
        </div>
        <div className="absolute bottom-0 start-0 end-0 h-20 bg-gradient-to-t from-black/40 to-transparent" />
      </div>

      {/* Body */}
      <div className="flex flex-col flex-1 p-5 gap-2.5">
        {/* Title */}
        <h3 className="font-display font-bold text-sm leading-snug text-foreground line-clamp-2">
          {title}
        </h3>

        {/* Excerpt */}
        <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2 flex-1">
          {excerpt}
        </p>

        {/* Meta */}
        <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-1 border-t border-border/60">
          <div className="flex items-center gap-3">
            {article.published_at && (
              <span className="flex items-center gap-1">
                <CalendarDays size={10} />
                {formatDate(article.published_at, locale)}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-0.5">
              <Eye size={10} />
              {article.views_count.toLocaleString()}
            </span>
            <span className="text-border">·</span>
            <span>{mins} {t("card.minutesRead")}</span>
          </div>
        </div>

        {/* CTA */}
        <Link
          to={`/news/${article.slug}`}
          className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:text-primary-dark transition-colors group-hover:gap-2"
        >
          {t("card.readMore")}
          <ArrowRight size={12} className="rtl:rotate-180 transition-transform" />
        </Link>
      </div>
    </motion.article>
  );
}

/* ── NewsPage ────────────────────────────────────────────────────────── */
export default function NewsPage(): React.ReactElement {
  const { t, i18n } = useTranslation(["news", "common"]);
  const isRtl  = i18n.dir() === "rtl";
  const locale = i18n.language;

  const [articles, setArticles]     = useState<NewsRow[]>([]);
  const [featured, setFeatured]     = useState<NewsRow | null>(null);
  const [filtered, setFiltered]     = useState<NewsRow[]>([]);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState<string | null>(null);
  const [search, setSearch]         = useState("");
  const [activeCategory, setActiveCategory] = useState<NewsCategory | "all">("all");

  const fetchNews = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: err } = await supabase
        .from("news")
        .select("*")
        .eq("is_published", true)
        .order("published_at", { ascending: false });

      if (err) throw err;

      const all = (data ?? []) as NewsRow[];
      const feat = all.find((a) => a.is_featured) ?? null;
      setFeatured(feat);
      // Exclude featured from main grid
      setArticles(feat ? all.filter((a) => a.id !== feat.id) : all);
    } catch {
      setError(t("error"));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => { fetchNews(); }, [fetchNews]);

  // Client-side filter + search
  useEffect(() => {
    let list = [...articles];
    if (activeCategory !== "all") {
      list = list.filter((a) => a.category === activeCategory);
    }
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(
        (a) =>
          a.title_ar?.toLowerCase().includes(q) ||
          a.title_en?.toLowerCase().includes(q) ||
          a.excerpt_ar?.toLowerCase().includes(q) ||
          a.excerpt_en?.toLowerCase().includes(q)
      );
    }
    setFiltered(list);
  }, [articles, activeCategory, search]);

  const categories: Array<{ key: NewsCategory | "all"; labelKey: string; icon?: React.ElementType }> = [
    { key: "all",           labelKey: "filter.all" },
    { key: "news",          labelKey: "filter.news",          icon: Newspaper },
    { key: "announcement",  labelKey: "filter.announcement",  icon: Megaphone },
    { key: "report",        labelKey: "filter.report",        icon: FileText },
    { key: "event",         labelKey: "filter.event",         icon: CalendarCheck },
    { key: "press_release", labelKey: "filter.press_release", icon: Radio },
  ];

  const hasFilter = activeCategory !== "all" || search.trim().length > 0;

  return (
    <div dir={isRtl ? "rtl" : "ltr"}>
      {/* ── HERO ────────────────────────────────────────────────────── */}
      <PageHero
        eyebrow="Media Center"
        titleKey="news:hero.title"
        subtitleKey="news:hero.subtitle"
        gradient="from-violet-500/20 via-background to-background"
      />

      {/* ── STICKY FILTER BAR ───────────────────────────────────────── */}
      <section className="sticky top-0 z-20 bg-background/90 backdrop-blur-md border-b border-border py-4 shadow-sm">
        <div className="container mx-auto px-4 md:px-8 space-y-3">
          {/* Search */}
          <div className="relative max-w-md">
            <Search size={16} className="absolute top-1/2 -translate-y-1/2 start-3.5 text-muted-foreground pointer-events-none" />
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

          {/* Category pills */}
          <div className="flex flex-wrap items-center gap-2">
            <Filter size={14} className="text-muted-foreground shrink-0" />
            <div className="flex flex-wrap gap-1.5">
              {categories.map(({ key, labelKey, icon }) => {
                const cfg = key !== "all" ? CATEGORY_CFG[key] : null;
                return (
                  <Pill
                    key={key}
                    active={activeCategory === key}
                    onClick={() => setActiveCategory(key)}
                    icon={icon}
                    color={activeCategory === key && cfg ? cfg.color : undefined}
                  >
                    {t(labelKey)}
                  </Pill>
                );
              })}
            </div>
            {hasFilter && (
              <button
                onClick={() => { setActiveCategory("all"); setSearch(""); }}
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
                ? `${filtered.length + (featured && activeCategory === "all" && !search ? 1 : 0)} مقال`
                : `${filtered.length + (featured && activeCategory === "all" && !search ? 1 : 0)} Articles`}
            </p>
          )}
        </div>
      </section>

      {/* ── CONTENT AREA ────────────────────────────────────────────── */}
      <section className="section-padding bg-background">
        <div className="container mx-auto px-4 md:px-8 space-y-10">

          {/* Error */}
          {error && (
            <div className="text-center py-16">
              <p className="text-destructive mb-4">{error}</p>
              <button
                onClick={fetchNews}
                className="px-6 py-2.5 rounded-full bg-primary text-primary-foreground text-sm font-medium hover:bg-primary-dark transition-colors"
              >
                {isRtl ? "إعادة المحاولة" : "Retry"}
              </button>
            </div>
          )}

          {/* Skeleton */}
          {loading && !error && (
            <div className="space-y-10">
              <SkeletonCard tall />
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
              </div>
            </div>
          )}

          {/* Featured article */}
          {!loading && !error && featured && activeCategory === "all" && !search && (
            <FeaturedCard article={featured} isRtl={isRtl} locale={locale} />
          )}

          {/* Empty state */}
          {!loading && !error && filtered.length === 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center py-24"
            >
              <div className="w-20 h-20 mx-auto mb-6 rounded-3xl bg-muted flex items-center justify-center">
                <Newspaper size={32} className="text-muted-foreground" />
              </div>
              <h3 className="font-display text-xl font-bold mb-2">{t("empty.title")}</h3>
              <p className="text-muted-foreground">{t("empty.subtitle")}</p>
            </motion.div>
          )}

          {/* Articles grid */}
          {!loading && !error && filtered.length > 0 && (
            <AnimatePresence mode="wait">
              <motion.div
                key={`${activeCategory}-${search}`}
                variants={stagger}
                initial="hidden"
                animate="show"
                className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6"
              >
                {filtered.map((article) => (
                  <NewsCard key={article.id} article={article} isRtl={isRtl} locale={locale} />
                ))}
              </motion.div>
            </AnimatePresence>
          )}

        </div>
      </section>
    </div>
  );
}
