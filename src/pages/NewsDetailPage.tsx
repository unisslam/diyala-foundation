/**
 * NewsDetailPage.tsx
 * ------------------
 * Full article view — /news/:slug
 * Shows cover image, body, tags, author, and related articles.
 */

import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { Calendar, Eye, Tag, ChevronLeft, Newspaper } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import type { NewsRow, NewsCategory } from "@/types/database.types";

const CAT_LABEL: Record<NewsCategory, { ar: string; en: string; cls: string }> = {
  news:          { ar: "خبر",          en: "News",         cls: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" },
  announcement:  { ar: "إعلان",        en: "Announcement", cls: "bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400" },
  report:        { ar: "تقرير",        en: "Report",       cls: "bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400" },
  event:         { ar: "فعالية",       en: "Event",        cls: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400" },
  press_release: { ar: "بيان صحفي",   en: "Press Release", cls: "bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400" },
};

function NewsDetailSkeleton(): React.ReactElement {
  return (
    <div className="container mx-auto px-4 md:px-8 py-12 max-w-4xl">
      <div className="h-8 w-32 shimmer rounded-xl mb-8" />
      <div className="h-96 shimmer rounded-3xl mb-8" />
      <div className="space-y-3">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className={`h-4 shimmer rounded-full ${i % 3 === 2 ? "w-2/3" : "w-full"}`} />
        ))}
      </div>
    </div>
  );
}

export default function NewsDetailPage(): React.ReactElement {
  const { slug } = useParams<{ slug: string }>();
  const { i18n } = useTranslation();
  const isRtl = i18n.dir() === "rtl";

  const [article, setArticle]   = useState<NewsRow | null>(null);
  const [related, setRelated]   = useState<NewsRow[]>([]);
  const [loading, setLoading]   = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    async function load(): Promise<void> {
      setLoading(true);
      const { data } = (await supabase
        .from("news")
        .select("*")
        .eq("slug", slug ?? "")
        .eq("is_published", true)
        .maybeSingle()) as any;

      if (!data) { setNotFound(true); setLoading(false); return; }
      setArticle(data as NewsRow);

      // Increment view count (fire-and-forget, ignore errors)
      try { await (supabase as any).rpc("increment_news_views", { news_id: data.id }); } catch { /* ignore */ }


      // Load related (same category, different article)
      const { data: relData } = (await supabase
        .from("news")
        .select("id, title_ar, title_en, slug, cover_image_path, published_at, category, excerpt_ar, excerpt_en")
        .eq("is_published", true)
        .eq("category", data.category)
        .neq("id", data.id)
        .order("published_at", { ascending: false })
        .limit(3)) as any;
      setRelated((relData ?? []) as NewsRow[]);
      setLoading(false);
    }
    void load();
  }, [slug]);

  if (loading) return <NewsDetailSkeleton />;

  if (notFound) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4" dir={isRtl ? "rtl" : "ltr"}>
        <Newspaper size={48} className="text-muted-foreground/30" />
        <h1 className="font-display text-2xl font-bold">{isRtl ? "الخبر غير موجود" : "Article Not Found"}</h1>
        <Link to="/news" className="text-primary underline text-sm">{isRtl ? "العودة للمركز الإعلامي" : "Back to Media Center"}</Link>
      </div>
    );
  }

  if (!article) return <></>;

  const title   = isRtl ? article.title_ar    : article.title_en;
  const excerpt = isRtl ? article.excerpt_ar  : article.excerpt_en;
  const body    = isRtl ? article.body_ar     : article.body_en;
  const cat     = CAT_LABEL[article.category];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      dir={isRtl ? "rtl" : "ltr"}
    >
      {/* Hero cover */}
      <div className="relative w-full h-72 md:h-[420px] bg-muted overflow-hidden">
        {article.cover_image_path ? (
          <img
            src={article.cover_image_path}
            alt={title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-primary/20 via-violet-500/10 to-blue-500/20 flex items-center justify-center">
            <Newspaper size={64} className="text-primary/20" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />

        {/* Back button */}
        <Link
          to="/news"
          className="absolute top-6 start-6 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/30 backdrop-blur-sm text-white text-xs hover:bg-black/50 transition-colors"
        >
          <ChevronLeft size={14} className="rtl:rotate-180" />
          {isRtl ? "المركز الإعلامي" : "Media Center"}
        </Link>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 md:px-8 max-w-4xl -mt-24 relative z-10 pb-20">
        <div className="bg-card rounded-3xl border border-border shadow-lg p-8 md:p-12">

          {/* Category + Date */}
          <div className="flex items-center gap-3 flex-wrap mb-6">
            <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold ${cat.cls}`}>
              {isRtl ? cat.ar : cat.en}
            </span>
            {article.published_at && (
              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                <Calendar size={12} />
                {new Date(article.published_at).toLocaleDateString(isRtl ? "ar-IQ" : "en-GB", { year: "numeric", month: "long", day: "numeric" })}
              </span>
            )}
            <span className="flex items-center gap-1 text-xs text-muted-foreground ms-auto">
              <Eye size={12} /> {article.views_count.toLocaleString()}
            </span>
          </div>

          {/* Title */}
          <h1 className="font-display text-2xl md:text-4xl font-black leading-tight mb-4">{title}</h1>

          {/* Excerpt */}
          {excerpt && (
            <p className="text-lg text-muted-foreground leading-relaxed border-s-4 border-primary ps-4 mb-8">
              {excerpt}
            </p>
          )}

          {/* Body */}
          {body ? (
            <div className="prose prose-sm max-w-none text-foreground/90 leading-loose whitespace-pre-wrap">
              {body}
            </div>
          ) : (
            <p className="text-muted-foreground text-sm italic">{isRtl ? "لا يوجد محتوى مفصّل" : "No detailed content available"}</p>
          )}

          {/* Tags */}
          {article.tags && article.tags.length > 0 && (
            <div className="mt-10 pt-6 border-t border-border flex items-center gap-2 flex-wrap">
              <Tag size={14} className="text-muted-foreground" />
              {article.tags.map((tag) => (
                <span key={tag} className="px-3 py-1 rounded-full bg-muted text-xs text-muted-foreground">
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Related articles */}
        {related.length > 0 && (
          <div className="mt-16">
            <h2 className="font-display text-xl font-bold mb-6">
              {isRtl ? "مقالات ذات صلة" : "Related Articles"}
            </h2>
            <div className="grid sm:grid-cols-3 gap-4">
              {related.map((item) => (
                <Link
                  key={item.id}
                  to={`/news/${item.slug}`}
                  className="group rounded-2xl border border-border bg-card overflow-hidden hover:border-primary/40 hover:shadow-sm transition-all"
                >
                  <div className="h-36 bg-muted overflow-hidden">
                    {item.cover_image_path ? (
                      <img src={item.cover_image_path} alt={isRtl ? item.title_ar : item.title_en}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-primary/10 to-violet-500/10 flex items-center justify-center">
                        <Newspaper size={24} className="text-primary/30" />
                      </div>
                    )}
                  </div>
                  <div className="p-4">
                    <p className="font-semibold text-sm line-clamp-2 mb-2">{isRtl ? item.title_ar : item.title_en}</p>
                    <p className="text-xs text-muted-foreground line-clamp-2">{isRtl ? item.excerpt_ar : item.excerpt_en}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}
