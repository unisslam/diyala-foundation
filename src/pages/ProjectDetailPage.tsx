/**
 * ProjectDetailPage.tsx
 * ----------------------
 * Full project view — /projects/:slug
 * Shows cover image, stats, body content, SDG tags, gallery.
 */

import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import {
  Calendar, MapPin, Users, DollarSign, Tag,
  ChevronLeft, FolderOpen, ExternalLink, CheckCircle,
} from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import type { ProjectRow, ProjectStatus, ProjectCategory } from "@/types/database.types";

const STATUS_CFG: Record<ProjectStatus, { ar: string; en: string; cls: string }> = {
  active:    { ar: "نشط",    en: "Active",    cls: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400" },
  completed: { ar: "منجز",   en: "Completed", cls: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" },
  planned:   { ar: "مخطط",  en: "Planned",   cls: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400" },
  on_hold:   { ar: "متوقف", en: "On Hold",   cls: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400" },
};

const CAT_CFG: Record<ProjectCategory, { ar: string; en: string }> = {
  water_management: { ar: "إدارة المياه",    en: "Water Management" },
  environmental:    { ar: "بيئي",            en: "Environmental" },
  community:        { ar: "مجتمعي",          en: "Community" },
  research:         { ar: "بحثي",            en: "Research" },
  education:        { ar: "تعليمي",          en: "Education" },
  health:           { ar: "صحي",             en: "Health" },
};

function ProjectSkeleton(): React.ReactElement {
  return (
    <div className="container mx-auto px-4 md:px-8 py-12 max-w-5xl">
      <div className="h-80 shimmer rounded-3xl mb-8" />
      <div className="grid md:grid-cols-3 gap-8">
        <div className="md:col-span-2 space-y-3">
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className={`h-4 shimmer rounded-full ${i % 3 === 2 ? "w-1/2" : "w-full"}`} />
          ))}
        </div>
        <div className="space-y-4">
          {Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-16 shimmer rounded-2xl" />)}
        </div>
      </div>
    </div>
  );
}

export default function ProjectDetailPage(): React.ReactElement {
  const { slug } = useParams<{ slug: string }>();
  const { i18n } = useTranslation();
  const isRtl = i18n.dir() === "rtl";

  const [project, setProject]   = useState<ProjectRow | null>(null);
  const [related, setRelated]   = useState<ProjectRow[]>([]);
  const [loading, setLoading]   = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [lightbox, setLightbox] = useState<string | null>(null);

  useEffect(() => {
    async function load(): Promise<void> {
      setLoading(true);
      const { data } = await supabase
        .from("projects")
        .select("*")
        .eq("slug", slug ?? "")
        .eq("is_published", true)
        .maybeSingle();

      if (!data) { setNotFound(true); setLoading(false); return; }
      setProject(data as ProjectRow);

      const { data: relData } = await supabase
        .from("projects")
        .select("id, title_ar, title_en, slug, cover_image_path, status, category, description_ar, description_en")
        .eq("is_published", true)
        .eq("category", data.category)
        .neq("id", data.id)
        .limit(3);
      setRelated((relData ?? []) as ProjectRow[]);
      setLoading(false);
    }
    void load();
  }, [slug]);

  if (loading) return <ProjectSkeleton />;

  if (notFound || !project) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4" dir={isRtl ? "rtl" : "ltr"}>
        <FolderOpen size={48} className="text-muted-foreground/30" />
        <h1 className="font-display text-2xl font-bold">{isRtl ? "المشروع غير موجود" : "Project Not Found"}</h1>
        <Link to="/projects" className="text-primary underline text-sm">
          {isRtl ? "العودة للمشاريع" : "Back to Projects"}
        </Link>
      </div>
    );
  }

  const title    = isRtl ? project.title_ar       : project.title_en;
  const desc     = isRtl ? project.description_ar : project.description_en;
  const content  = isRtl ? project.content_ar     : project.content_en;
  const location = isRtl ? project.location_ar    : project.location_en;
  const status   = STATUS_CFG[project.status];
  const cat      = CAT_CFG[project.category];

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} dir={isRtl ? "rtl" : "ltr"}>

      {/* Hero */}
      <div className="relative w-full h-72 md:h-[440px] bg-muted overflow-hidden">
        {project.cover_image_path ? (
          <img src={project.cover_image_path} alt={title} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-primary/20 via-emerald-500/10 to-teal-500/20 flex items-center justify-center">
            <FolderOpen size={80} className="text-primary/20" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent" />

        {/* Back */}
        <Link to="/projects"
          className="absolute top-6 start-6 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/30 backdrop-blur-sm text-white text-xs hover:bg-black/50 transition-colors"
        >
          <ChevronLeft size={14} className="rtl:rotate-180" />
          {isRtl ? "المشاريع" : "Projects"}
        </Link>
      </div>

      {/* Main content */}
      <div className="container mx-auto px-4 md:px-8 max-w-5xl -mt-32 relative z-10 pb-20">
        <div className="grid md:grid-cols-3 gap-8 items-start">

          {/* Left: body */}
          <div className="md:col-span-2">
            <div className="bg-card rounded-3xl border border-border shadow-lg p-8">
              {/* Badges */}
              <div className="flex flex-wrap gap-2 mb-5">
                <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold ${status.cls}`}>
                  <CheckCircle size={11} /> {isRtl ? status.ar : status.en}
                </span>
                <span className="px-3 py-1 rounded-full bg-muted text-xs text-muted-foreground">
                  {isRtl ? cat.ar : cat.en}
                </span>
                {project.is_featured && (
                  <span className="px-3 py-1 rounded-full bg-amber-100 text-amber-700 text-xs font-semibold dark:bg-amber-900/30 dark:text-amber-400">
                    ⭐ {isRtl ? "مميز" : "Featured"}
                  </span>
                )}
              </div>

              <h1 className="font-display text-2xl md:text-3xl font-black leading-tight mb-4">{title}</h1>
              <p className="text-muted-foreground leading-relaxed border-s-4 border-primary ps-4 mb-8">{desc}</p>

              {/* Full content */}
              {content ? (
                <div className="prose prose-sm max-w-none text-foreground/90 leading-loose whitespace-pre-wrap">
                  {content}
                </div>
              ) : (
                <p className="text-muted-foreground text-sm italic">
                  {isRtl ? "لا يوجد محتوى مفصّل بعد" : "No detailed content yet"}
                </p>
              )}

              {/* SDG Tags */}
              {project.sdg_tags && project.sdg_tags.length > 0 && (
                <div className="mt-8 pt-6 border-t border-border">
                  <p className="text-xs font-semibold text-muted-foreground mb-3 flex items-center gap-1">
                    <Tag size={12} /> {isRtl ? "أهداف التنمية المستدامة" : "SDG Goals"}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {project.sdg_tags.map((tag) => (
                      <span key={tag} className="px-2.5 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium">{tag}</span>
                    ))}
                  </div>
                </div>
              )}

              {/* Tags */}
              {project.tags && project.tags.length > 0 && (
                <div className="mt-4 flex flex-wrap gap-2">
                  {project.tags.map((tag) => (
                    <span key={tag} className="px-2.5 py-1 rounded-full bg-muted text-muted-foreground text-xs">{tag}</span>
                  ))}
                </div>
              )}

              {/* External link */}
              {project.external_url && (
                <a href={project.external_url} target="_blank" rel="noopener noreferrer"
                  className="mt-8 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary-dark transition-colors"
                >
                  <ExternalLink size={14} />
                  {isRtl ? "الموقع الرسمي للمشروع" : "Project Website"}
                </a>
              )}
            </div>

            {/* Photo gallery */}
            {project.gallery_paths && project.gallery_paths.length > 0 && (
              <div className="mt-6 bg-card rounded-3xl border border-border p-6">
                <h2 className="font-display font-bold mb-4 text-sm">
                  {isRtl ? "صور المشروع" : "Project Photos"}
                </h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {project.gallery_paths.map((path, i) => (
                    <button
                      key={i}
                      onClick={() => setLightbox(path)}
                      className="aspect-video rounded-xl overflow-hidden bg-muted group"
                    >
                      <img src={path} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right: stats sidebar */}
          <div className="space-y-4">
            {/* Stats card */}
            <div className="bg-card rounded-3xl border border-border p-6 space-y-4">
              <h3 className="font-semibold text-sm border-b border-border pb-3">
                {isRtl ? "معلومات المشروع" : "Project Info"}
              </h3>
              {project.start_date && (
                <div className="flex items-start gap-3 text-sm">
                  <Calendar size={15} className="text-primary mt-0.5 shrink-0" />
                  <div>
                    <p className="text-xs text-muted-foreground">{isRtl ? "تاريخ البدء" : "Start Date"}</p>
                    <p className="font-medium">{new Date(project.start_date).toLocaleDateString(isRtl ? "ar-IQ" : "en-GB")}</p>
                  </div>
                </div>
              )}
              {project.end_date && (
                <div className="flex items-start gap-3 text-sm">
                  <Calendar size={15} className="text-muted-foreground mt-0.5 shrink-0" />
                  <div>
                    <p className="text-xs text-muted-foreground">{isRtl ? "تاريخ الانتهاء" : "End Date"}</p>
                    <p className="font-medium">{new Date(project.end_date).toLocaleDateString(isRtl ? "ar-IQ" : "en-GB")}</p>
                  </div>
                </div>
              )}
              {location && (
                <div className="flex items-start gap-3 text-sm">
                  <MapPin size={15} className="text-primary mt-0.5 shrink-0" />
                  <div>
                    <p className="text-xs text-muted-foreground">{isRtl ? "الموقع" : "Location"}</p>
                    <p className="font-medium">{location}</p>
                  </div>
                </div>
              )}
              {project.beneficiaries_count && (
                <div className="flex items-start gap-3 text-sm">
                  <Users size={15} className="text-primary mt-0.5 shrink-0" />
                  <div>
                    <p className="text-xs text-muted-foreground">{isRtl ? "المستفيدون" : "Beneficiaries"}</p>
                    <p className="font-bold text-lg">{project.beneficiaries_count.toLocaleString()}</p>
                  </div>
                </div>
              )}
              {project.budget_usd && (
                <div className="flex items-start gap-3 text-sm">
                  <DollarSign size={15} className="text-primary mt-0.5 shrink-0" />
                  <div>
                    <p className="text-xs text-muted-foreground">{isRtl ? "الميزانية" : "Budget"}</p>
                    <p className="font-medium">${project.budget_usd.toLocaleString()}</p>
                  </div>
                </div>
              )}
            </div>

            {/* CTA */}
            <Link to="/join"
              className="block text-center px-5 py-3 rounded-2xl bg-primary text-primary-foreground font-semibold text-sm hover:bg-primary-dark transition-colors"
            >
              {isRtl ? "انضم إلى المؤسسة" : "Join the Foundation"}
            </Link>
          </div>
        </div>

        {/* Related projects */}
        {related.length > 0 && (
          <div className="mt-16">
            <h2 className="font-display text-xl font-bold mb-6">
              {isRtl ? "مشاريع ذات صلة" : "Related Projects"}
            </h2>
            <div className="grid sm:grid-cols-3 gap-4">
              {related.map((item) => (
                <Link key={item.id} to={`/projects/${item.slug}`}
                  className="group rounded-2xl border border-border bg-card overflow-hidden hover:border-primary/40 hover:shadow-sm transition-all"
                >
                  <div className="h-36 bg-muted overflow-hidden">
                    {item.cover_image_path ? (
                      <img src={item.cover_image_path} alt={isRtl ? item.title_ar : item.title_en}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-primary/10 to-emerald-500/10 flex items-center justify-center">
                        <FolderOpen size={24} className="text-primary/30" />
                      </div>
                    )}
                  </div>
                  <div className="p-4">
                    <p className="font-semibold text-sm line-clamp-2 mb-1">{isRtl ? item.title_ar : item.title_en}</p>
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${STATUS_CFG[item.status].cls}`}>
                        {isRtl ? STATUS_CFG[item.status].ar : STATUS_CFG[item.status].en}
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Lightbox */}
      {lightbox && (
        <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
          onClick={() => setLightbox(null)}>
          <img src={lightbox} alt="" className="max-h-[90vh] max-w-full rounded-2xl shadow-2xl object-contain" />
          <button onClick={() => setLightbox(null)}
            className="absolute top-4 end-4 p-2 rounded-full bg-white/10 text-white hover:bg-white/20">
            ✕
          </button>
        </div>
      )}
    </motion.div>
  );
}
