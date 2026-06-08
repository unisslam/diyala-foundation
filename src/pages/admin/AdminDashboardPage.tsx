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
  TrendingUp, Eye, Clock, ArrowRight, Plus, Star,
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
  const [stats, setStats] = useState<Stats>({ projects: 0, news: 0, contacts: 0, memberships: 0, pendingMemberships: 0, newContacts: 0 });
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
      ] = await Promise.all([
        supabase.from("projects").select("*", { count: "exact", head: true }),
        supabase.from("news").select("*", { count: "exact", head: true }).eq("is_published", true),
        supabase.from("contact_messages").select("*", { count: "exact", head: true }),
        supabase.from("membership_applications").select("*", { count: "exact", head: true }),
        supabase.from("membership_applications").select("*", { count: "exact", head: true }).eq("status", "pending"),
        supabase.from("contact_messages").select("*", { count: "exact", head: true }).eq("status", "new"),
      ]);
      setStats({
        projects: projects ?? 0,
        news: news ?? 0,
        contacts: contacts ?? 0,
        memberships: memberships ?? 0,
        pendingMemberships: pendingMemberships ?? 0,
        newContacts: newContacts ?? 0,
      });
      setLoading(false);
    }
    void load();
  }, []);

  const statCards = [
    { icon: FolderOpen,    label: "المشاريع المنشورة",    value: stats.projects,    color: "bg-blue-500",    to: "/admin/projects" },
    { icon: Newspaper,     label: "الأخبار المنشورة",      value: stats.news,        color: "bg-violet-500",  to: "/admin/news" },
    { icon: MessageSquare, label: "رسائل التواصل",          value: stats.contacts,    color: "bg-emerald-500", to: "/admin/contacts",   sub: stats.newContacts > 0 ? `${stats.newContacts} جديدة` : undefined },
    { icon: UserCheck,     label: "طلبات العضوية",          value: stats.memberships, color: "bg-amber-500",   to: "/admin/memberships", sub: stats.pendingMemberships > 0 ? `${stats.pendingMemberships} بانتظار المراجعة` : undefined },
  ];

  const quickActions = [
    { icon: Plus,      label: "مشروع جديد",    to: "/admin/projects",     color: "bg-blue-500" },
    { icon: Plus,      label: "خبر جديد",       to: "/admin/news",         color: "bg-violet-500" },
    { icon: Star,      label: "الشهادات",        to: "/admin/testimonials", color: "bg-amber-500" },
    { icon: UserCheck, label: "طلبات العضوية",   to: "/admin/memberships",  color: "bg-emerald-500" },
    { icon: Eye,       label: "معرض الصور",       to: "/admin/gallery",      color: "bg-pink-500" },
    { icon: TrendingUp, label: "الإحصاءات",       to: "/admin/stats",        color: "bg-teal-500" },
  ];

  return (
    <div>
      <div className="mb-8">
        <h1 className="font-display text-2xl font-bold mb-1">مرحباً! 👋</h1>
        <p className="text-muted-foreground text-sm">إليك ملخص نشاط المنصة اليوم</p>
      </div>

      {/* Stats */}
      <motion.div
        variants={stagger} initial="hidden" animate="show"
        className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8"
      >
        {loading
          ? Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-24 rounded-2xl shimmer" />
            ))
          : statCards.map((card) => <StatCard key={card.to} {...card} />)
        }
      </motion.div>

      {/* Quick Actions */}
      <motion.div
        initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="mb-8"
      >
        <h2 className="font-semibold text-sm mb-4 text-muted-foreground flex items-center gap-2">
          <Clock size={14} />
          إجراءات سريعة
        </h2>
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
          {quickActions.map((a) => <QuickAction key={a.to} {...a} />)}
        </div>
      </motion.div>

      {/* Footer note */}
      <div className="text-center py-4">
        <p className="text-xs text-muted-foreground">
          مؤسسة نهر ديالى للتنمية المستدامة — لوحة تحكم المشرفين
        </p>
      </div>
    </div>
  );
}
