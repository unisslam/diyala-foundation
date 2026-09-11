/**
 * AdminDashboardPage.tsx
 * ----------------------
 * Overview dashboard with live stats, recent items, and quick actions.
 */

import React from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  FolderOpen, Newspaper, MessageSquare, UserCheck,
  TrendingUp, Eye, Clock, ArrowRight, Plus, Star, Users, Shield
} from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import { useState, useEffect } from "react";

const stagger = { hidden: {}, show: { transition: { staggerChildren: 0.07 } } };
const fadeUp  = { hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0, transition: { duration: 0.4 } } };

interface Stats {
  projects: number;
  news: number;
  contacts: number;
  memberships: number;
  pendingMemberships: number;
  newContacts: number;
  teamMembers: number;
}

function StatCard({ icon: Icon, label, value, sub, color, to }: {
  icon: React.ElementType; label: string; value: number | string;
  sub?: string; color: string; to: string;
}): React.ReactElement {
  return (
    <motion.div variants={fadeUp}>
      <Link to={to} className="flex items-center gap-4 p-5 rounded-2xl bg-card border border-border hover:border-primary/30 hover:shadow-sm transition-all duration-200 group">
        <div className={`w-12 h-12 rounded-2xl ${color} flex items-center justify-center shrink-0`}>
          <Icon size={20} className="text-white" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-2xl font-display font-black">{value}</p>
          <p className="text-sm text-muted-foreground truncate">{label}</p>
          {sub && <p className="text-xs text-amber-600 dark:text-amber-400 font-medium mt-0.5">{sub}</p>}
        </div>
        <ArrowRight size={15} className="text-muted-foreground group-hover:text-primary rtl:rotate-180 transition-colors shrink-0" />
      </Link>
    </motion.div>
  );
}

function QuickAction({ icon: Icon, label, to, color }: {
  icon: React.ElementType; label: string; to: string; color: string;
}): React.ReactElement {
  return (
    <Link to={to}
      className="flex flex-col items-center gap-2 p-4 rounded-2xl border border-border bg-card hover:border-primary/30 hover:bg-primary/5 transition-all duration-200 text-center"
    >
      <div className={`w-10 h-10 rounded-xl ${color} flex items-center justify-center`}>
        <Icon size={18} className="text-white" />
      </div>
      <span className="text-xs font-medium leading-tight">{label}</span>
    </Link>
  );
}

export default function AdminDashboardPage(): React.ReactElement {
  const [stats, setStats] = useState<Stats>({
    projects: 0,
    news: 0,
    contacts: 0,
    memberships: 0,
    pendingMemberships: 0,
    newContacts: 0,
    teamMembers: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load(): Promise<void> {
      const [
        { count: projects },
        { count: news },
        { count: contacts },
        { count: memberships },
        { count: pendingMemberships },
        { count: newContacts },
        { count: teamMembers },
      ] = await Promise.all([
        supabase.from("projects").select("*", { count: "exact", head: true }),
        supabase.from("news").select("*", { count: "exact", head: true }).eq("is_published", true),
        supabase.from("contact_messages").select("*", { count: "exact", head: true }),
        supabase.from("membership_applications").select("*", { count: "exact", head: true }),
        supabase.from("membership_applications").select("*", { count: "exact", head: true }).eq("status", "pending"),
        supabase.from("contact_messages").select("*", { count: "exact", head: true }).eq("status", "new"),
        supabase.from("team_members").select("*", { count: "exact", head: true }),
      ]);
      setStats({
        projects: projects ?? 0,
        news: news ?? 0,
        contacts: contacts ?? 0,
        memberships: memberships ?? 0,
        pendingMemberships: pendingMemberships ?? 0,
        newContacts: newContacts ?? 0,
        teamMembers: teamMembers ?? 0,
      });
      setLoading(false);
    }
    void load();
  }, []);

  const statCards = [
    { icon: FolderOpen,    label: "المشاريع المنشورة",    value: stats.projects,    color: "bg-blue-500",    to: "/admin/projects" },
    { icon: Newspaper,     label: "الأخبار والمقالات",      value: stats.news,        color: "bg-violet-500",  to: "/admin/news" },
    { icon: Users,         label: "أعضاء فريق العمل",     value: stats.teamMembers, color: "bg-indigo-500",  to: "/admin/team" },
    { icon: UserCheck,     label: "طلبات العضوية",          value: stats.memberships, color: "bg-amber-500",   to: "/admin/memberships", sub: stats.pendingMemberships > 0 ? `${stats.pendingMemberships} بانتظار المراجعة` : undefined },
    { icon: MessageSquare, label: "رسائل التواصل",          value: stats.contacts,    color: "bg-emerald-500", to: "/admin/contacts",   sub: stats.newContacts > 0 ? `${stats.newContacts} جديدة` : undefined },
  ];

  const quickActions = [
    { icon: Plus,      label: "مشروع جديد",       to: "/admin/projects",     color: "bg-blue-500" },
    { icon: Plus,      label: "خبر جديد",          to: "/admin/news",         color: "bg-violet-500" },
    { icon: UserCheck, label: "طلبات العضوية",      to: "/admin/memberships",  color: "bg-amber-500" },
    { icon: Users,     label: "بيت الأعضاء",       to: "/admin/team",         color: "bg-indigo-500" },
    { icon: Eye,       label: "معرض الصور",        to: "/admin/gallery",      color: "bg-pink-500" },
    { icon: Star,      label: "الشهادات والآراء",   to: "/admin/testimonials", color: "bg-emerald-500" },
    { icon: TrendingUp, label: "إحصاءات التأثير",  to: "/admin/stats",        color: "bg-teal-500" },
    { icon: Shield,    label: "إدارة المشرفين",    to: "/admin/users",        color: "bg-cyan-600" },
  ];

  return (
    <div className="space-y-6 sm:space-y-8" dir="rtl">
      <div>
        <h1 className="font-display text-xl sm:text-2xl font-black mb-1">مرحباً بك! 👋</h1>
        <p className="text-muted-foreground text-xs sm:text-sm">إليك ملخص نشاط منصة مؤسسة نهر ديالى اليوم</p>
      </div>

      {/* Stats Cards */}
      <motion.div
        variants={stagger} initial="hidden" animate="show"
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3 sm:gap-4"
      >
        {loading
          ? Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-24 rounded-3xl shimmer" />
            ))
          : statCards.map((card) => <StatCard key={card.to} {...card} />)
        }
      </motion.div>

      {/* Quick Actions (2 cols on small phone, 4 on tablet/desktop) */}
      <motion.div
        initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="space-y-3"
      >
        <h2 className="font-bold text-xs sm:text-sm text-muted-foreground flex items-center gap-2">
          <Clock size={15} />
          إجراءات سريعة ومباشرة
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-4 gap-2.5 sm:gap-3.5">
          {quickActions.map((a) => <QuickAction key={a.label} {...a} />)}
        </div>
      </motion.div>

      {/* Footer note */}
      <div className="text-center py-4 border-t border-border/40">
        <p className="text-xs text-muted-foreground">
          مؤسسة نهر ديالى للتنمية المستدامة — لوحة تحكم المشرفين © {new Date().getFullYear()}
        </p>
      </div>
    </div>
  );
}
