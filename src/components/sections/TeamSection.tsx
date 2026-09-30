import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslation } from "react-i18next";
import { ChevronDown, ExternalLink, Mail, Shield } from "lucide-react";
import { useTeamMembers } from "@/hooks/useTeamMembers";
import type { Database } from "@/types/database.types";

type TeamMember = Database["public"]["Tables"]["team_members"]["Row"];

/* ── Skeleton card shown while loading ───────────────────────────── */
const MemberSkeleton: React.FC = () => (
  <div className="rounded-3xl border bg-card p-7 flex flex-col gap-5 animate-pulse">
    <div className="flex items-start gap-4">
      <div className="w-16 h-16 rounded-2xl bg-muted flex-shrink-0" />
      <div className="flex-1 space-y-2 pt-1">
        <div className="h-4 bg-muted rounded w-3/4" />
        <div className="h-3 bg-muted rounded w-1/2" />
      </div>
    </div>
    <div className="space-y-2">
      <div className="h-3 bg-muted rounded" />
      <div className="h-3 bg-muted rounded w-5/6" />
    </div>
  </div>
);

const roleColorMap: Record<string, string> = {
  board: "from-sdg-16/20 to-sdg-17/10 border-sdg-16/30",
  management: "from-sdg-8/20  to-sdg-10/10  border-sdg-8/30",
  advisor: "from-sdg-4/20  to-sdg-5/10   border-sdg-4/30",
  staff: "from-sdg-13/20 to-sdg-15/10  border-sdg-13/30",
  member: "from-primary/20 to-primary/10  border-primary/30",
};

const roleBadgeMap: Record<string, string> = {
  board: "bg-sdg-16/15 text-sdg-16",
  management: "bg-sdg-8/15  text-sdg-8",
  advisor: "bg-sdg-4/15  text-sdg-4",
  staff: "bg-sdg-13/15 text-sdg-13",
  member: "bg-primary/15 text-primary",
};

const MemberCard: React.FC<{ member: TeamMember; isRtl: boolean; index: number }> = ({
  member,
  isRtl,
  index,
}) => {
  const { t } = useTranslation("about");
  const [bioOpen, setBioOpen] = useState(false);

  const name = (isRtl ? member.full_name_ar : member.full_name_en) || "";
  const title = isRtl ? member.title_ar : member.title_en;
  const bio = isRtl ? member.bio_ar : member.bio_en;
  const initials = name.trim().split(" ").slice(0, 2).map((w) => w[0] || "").join("");

  return (
    <motion.article
      initial={{ opacity: 0, y: 32 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.55, delay: index * 0.1 }}
      dir={isRtl ? "rtl" : "ltr"}
      className={`relative rounded-3xl border bg-gradient-to-br ${roleColorMap[member.role] ?? roleColorMap.staff} p-7 flex flex-col gap-4 transition-shadow duration-300 hover:shadow-card-hover`}
    >
      {/* Top row */}
      <div className="flex items-start gap-4">
        {/* Avatar */}
        <div className="w-16 h-16 rounded-2xl flex-shrink-0 overflow-hidden bg-primary/15 flex items-center justify-center text-primary font-bold text-xl shadow-inner">
          {member.avatar_path ? (
            <img src={member.avatar_path} alt={name} className="w-full h-full object-cover" />
          ) : (
            initials
          )}
        </div>

        {/* Name + title */}
        <div className="flex-1 min-w-0">
          <h3 className="font-display text-lg font-bold leading-tight mb-1 truncate">{name}</h3>
          <span
            className={`inline-block text-xs px-2.5 py-0.5 rounded-full font-medium ${roleBadgeMap[member.role] ?? roleBadgeMap.staff}`}
          >
            {title}
          </span>
        </div>

        {/* Shield icon for board */}
        {member.role === "board" && (
          <Shield size={18} className="text-sdg-16 opacity-40 flex-shrink-0 mt-1" />
        )}
      </div>

      {/* Bio toggle — shown only when bio exists */}
      {bio && (
        <>
          <button
            onClick={() => setBioOpen((prev) => !prev)}
            className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors w-fit"
            aria-expanded={bioOpen}
            aria-label={bioOpen ? t("team.hideBio", "إخفاء النبذة") : t("team.showBio", "عرض النبذة")}
          >
            <motion.span animate={{ rotate: bioOpen ? 180 : 0 }} transition={{ duration: 0.25 }}>
              <ChevronDown size={14} />
            </motion.span>
            {bioOpen ? t("team.hideBio", "إخفاء النبذة") : t("team.showBio", "عرض النبذة")}
          </button>

          <AnimatePresence initial={false}>
            {bioOpen && (
              <motion.p
                key="bio"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3, ease: "easeInOut" }}
                className="overflow-hidden text-sm text-foreground/70 leading-relaxed"
              >
                {bio}
              </motion.p>
            )}
          </AnimatePresence>
        </>
      )}

      {/* Links */}
      {(member.email || member.linkedin_url) && (
        <div className="flex gap-3 mt-auto pt-2 border-t border-border/40">
          {member.email && (
            <a
              href={`mailto:${member.email}`}
              className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors"
              aria-label={`Email ${name}`}
            >
              <Mail size={13} />
              {member.email}
            </a>
          )}
          {member.linkedin_url && (
            <a
              href={member.linkedin_url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors"
              aria-label={`LinkedIn ${name}`}
            >
              <ExternalLink size={13} />
              LinkedIn
            </a>
          )}
        </div>
      )}
    </motion.article>
  );
};

/* ── Main Section ─────────────────────────────────────────────────── */
const TeamSection: React.FC = () => {
  const { t, i18n } = useTranslation("about");
  const isRtl = i18n.dir() === "rtl";
  const { teamMembers: members, loading } = useTeamMembers();

  return (
    <section
      id="team"
      dir={isRtl ? "rtl" : "ltr"}
      className="py-24 bg-background"
      aria-label="Team Section"
    >
      <div className="container mx-auto px-4 md:px-8">
        <motion.div
          className="text-center mb-14"
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="font-display text-3xl md:text-4xl font-bold mb-3">
            {t("team.title")}
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto">{t("team.description")}</p>
        </motion.div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 items-start">
          {loading
            ? Array.from({ length: 3 }).map((_, i) => <MemberSkeleton key={i} />)
            : members.map((member, idx) => (
                <MemberCard key={member.id} member={member} isRtl={isRtl} index={idx} />
              ))
          }
        </div>
      </div>
    </section>
  );
};

export default TeamSection;
