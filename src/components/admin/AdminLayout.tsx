/**
 * AdminLayout.tsx
 * ---------------
 * Persistent enterprise shell for all admin pages:
 *  - Responsive Desktop Sidebar + Mobile Drawer (RTL Optimized)
 *  - Mobile Bottom Navigation Bar for rapid one-handed access
 *  - Dynamic page title header with user profile badge
 *  - Content area with safe mobile padding
 */

import React, { useState } from "react";
import { NavLink, Outlet, useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard, FolderOpen, Newspaper, Users, MessageSquare,
  Star, Image, BarChart3, LogOut, Menu, X, ChevronRight,
  UserCheck, Shield, ShieldCheck, MoreHorizontal,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import type { AdminPermissions } from "@/types/database.types";

interface NavItem {
  to: string;
  icon: React.ElementType;
  label: string;
  badge?: number;
  perm?: keyof AdminPermissions;
  superOnly?: boolean;
}

const NAV_ITEMS: NavItem[] = [
  { to: "/admin",              icon: LayoutDashboard, label: "لوحة التحكم" },
  { to: "/admin/memberships",  icon: UserCheck,       label: "طلبات العضوية",       perm: "can_manage_memberships" },
  { to: "/admin/team",         icon: Users,           label: "فريق العمل والأعضاء", perm: "can_manage_team" },
  { to: "/admin/projects",     icon: FolderOpen,      label: "المشاريع والأثر",     perm: "can_manage_projects" },
  { to: "/admin/news",         icon: Newspaper,       label: "الأخبار والمقالات",   perm: "can_manage_news" },
  { to: "/admin/contacts",     icon: MessageSquare,   label: "الرسائل والتطوع",      perm: "can_manage_messages" },
  { to: "/admin/gallery",      icon: Image,           label: "معرض الصور",           perm: "can_manage_gallery" },
  { to: "/admin/testimonials", icon: Star,            label: "الشهادات والآراء",    perm: "can_manage_news" },
  { to: "/admin/stats",        icon: BarChart3,       label: "الإحصاءات والبيانات",  perm: "can_manage_projects" },
  { to: "/admin/users",        icon: ShieldCheck,     label: "المشرفون والصلاحيات", superOnly: true },
];

const PAGE_TITLES: Record<string, string> = {
  "/admin": "لوحة التحكم والملخص",
  "/admin/memberships": "إدارة طلبات العضوية",
  "/admin/team": "بيت الأعضاء وفريق العمل",
  "/admin/projects": "إدارة المشاريع والمبادرات",
  "/admin/news": "الأخبار والبيانات الصحفية",
  "/admin/contacts": "صندوق الرسائل والتطوع",
  "/admin/gallery": "معرض صور الأنشطة",
  "/admin/testimonials": "الشهادات والآراء المعتمدة",
  "/admin/stats": "مؤشرات وإحصاءات الأثر",
  "/admin/users": "إدارة المشرفين والصلاحيات",
};

function SidebarNav({
  collapsed,
  onClose,
  hasPermission,
  isSuperAdmin,
}: {
  collapsed?: boolean;
  onClose?: () => void;
  hasPermission: (p: keyof AdminPermissions) => boolean;
  isSuperAdmin: boolean;
}): React.ReactElement {
  const visibleItems = NAV_ITEMS.filter((item) => {
    if (item.superOnly && !isSuperAdmin) return false;
    if (item.perm && !hasPermission(item.perm)) return false;
    return true;
  });

  return (
    <nav className="flex flex-col gap-1 px-3">
      {visibleItems.map(({ to, icon: Icon, label }) => (
        <NavLink
          key={to}
          to={to}
          end={to === "/admin"}
          onClick={onClose}
          className={({ isActive }) =>
            `flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-xs sm:text-sm font-semibold transition-all duration-150 group ${
              isActive
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            }`
          }
        >
          <Icon size={17} className="shrink-0" />
          {!collapsed && <span className="truncate">{label}</span>}
          {!collapsed && (
            <ChevronRight size={13} className="ms-auto opacity-0 group-hover:opacity-60 rtl:rotate-180 transition-opacity" />
          )}
        </NavLink>
      ))}
    </nav>
  );
}

export default function AdminLayout(): React.ReactElement {
  const { user, profile, signOut, hasPermission, isSuperAdmin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  async function handleSignOut(): Promise<void> {
    await signOut();
    navigate("/admin/login");
  }

  const roleTitle = isSuperAdmin
    ? "مدير عام (Super Admin)"
    : profile?.role === "membership_officer"
    ? "مسؤول عضويات"
    : profile?.role === "editor"
    ? "محرر أخبار"
    : profile?.role === "comms_manager"
    ? "مسؤول تواصل"
    : "مشرف نظام";

  const currentTitle = PAGE_TITLES[location.pathname] ?? "لوحة التحكم";

  const SidebarContent = ({ isMobile }: { isMobile?: boolean }): React.ReactElement => (
    <div className="flex flex-col h-full bg-card">
      {/* Brand Header */}
      <div className="px-5 py-4 border-b border-border flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
            <Shield size={19} className="text-primary" />
          </div>
          <div className="min-w-0">
            <p className="font-display font-black text-sm leading-tight text-foreground truncate">لوحة تحكم الإدارة</p>
            <p className="text-[10px] text-muted-foreground font-medium truncate">مؤسسة نهر ديالى للتنمية</p>
          </div>
        </div>

        {isMobile && (
          <button
            onClick={() => setMobileOpen(false)}
            className="p-2 rounded-xl hover:bg-muted text-muted-foreground transition-colors"
            title="إغلاق القائمة"
            aria-label="إغلاق القائمة"
          >
            <X size={18} />
          </button>
        )}
      </div>

      {/* Nav List */}
      <div className="flex-1 overflow-y-auto py-3 no-scrollbar">
        <SidebarNav
          onClose={() => setMobileOpen(false)}
          hasPermission={hasPermission}
          isSuperAdmin={isSuperAdmin}
        />
      </div>

      {/* User Info Card */}
      <div className="p-4 border-t border-border shrink-0 bg-muted/20">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-9 h-9 rounded-2xl bg-primary/15 text-primary font-display font-black text-sm flex items-center justify-center shrink-0 shadow-inner">
            {profile?.full_name ? profile.full_name.charAt(0) : user?.email?.[0].toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-bold text-foreground truncate">{profile?.full_name || user?.email}</p>
            <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold truncate">{roleTitle}</p>
          </div>
        </div>
        <button
          onClick={handleSignOut}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs font-bold text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors border border-border/60"
        >
          <LogOut size={14} />
          تسجيل الخروج
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-muted/30 flex" dir="rtl">
      {/* ── Desktop Sidebar ─────────────────────────────────────────── */}
      <aside className="hidden lg:flex flex-col w-64 bg-card border-e border-border shrink-0 fixed top-0 bottom-0 start-0 z-30 shadow-xs">
        <SidebarContent />
      </aside>

      {/* ── Mobile Sidebar Drawer ──────────────────────────────────── */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-xs z-40 lg:hidden"
              onClick={() => setMobileOpen(false)}
            />
            <motion.aside
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 300 }}
              className="fixed top-0 start-0 bottom-0 w-72 max-w-[85vw] bg-card border-e border-border z-50 lg:hidden shadow-2xl overflow-hidden"
            >
              <SidebarContent isMobile />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* ── Main Content Area ───────────────────────────────────────── */}
      <div className="flex-1 flex flex-col lg:ms-64 min-w-0">
        {/* Top Header */}
        <header className="sticky top-0 z-20 bg-card/95 backdrop-blur-md border-b border-border px-4 sm:px-6 py-3 flex items-center justify-between shadow-2xs">
          {/* Mobile hamburger + current page title */}
          <div className="flex items-center gap-2.5 min-w-0">
            <button
              onClick={() => setMobileOpen(true)}
              className="lg:hidden p-2 rounded-xl border border-border hover:bg-muted text-foreground transition-colors shrink-0"
              aria-label="فتح القائمة الرئيسية"
              title="القائمة"
            >
              <Menu size={18} />
            </button>
            <div className="min-w-0">
              <h2 className="font-display font-bold text-sm sm:text-base text-foreground truncate">
                {currentTitle}
              </h2>
            </div>
          </div>

          {/* Desktop & Mobile user info */}
          <div className="flex items-center gap-2.5">
            <div className="hidden sm:flex items-center gap-2 text-xs text-muted-foreground">
              <span>المشرف:</span>
              <span className="font-bold text-foreground font-mono">{user?.email}</span>
            </div>
            <div
              className="w-8 h-8 rounded-xl bg-primary/10 text-primary font-display font-black text-xs flex items-center justify-center shrink-0 border border-primary/20"
              title={user?.email}
            >
              {profile?.full_name ? profile.full_name.charAt(0) : user?.email?.[0].toUpperCase()}
            </div>
          </div>
        </header>

        {/* Page Content with safe area padding for bottom nav on mobile */}
        <main className="flex-1 p-4 sm:p-6 md:p-8 pb-24 lg:pb-8 overflow-x-hidden">
          <Outlet />
        </main>
      </div>

      {/* ── Mobile Bottom Navigation Bar (App-like UX) ──────────────── */}
      <nav className="lg:hidden fixed bottom-0 start-0 end-0 z-30 bg-card/95 backdrop-blur-xl border-t border-border px-2 py-1.5 flex items-center justify-around shadow-lg">
        {/* 1. Dashboard */}
        <NavLink
          to="/admin"
          end
          className={({ isActive }) =>
            `flex flex-col items-center gap-0.5 px-2 py-1 rounded-xl transition-all ${
              isActive ? "text-primary font-bold" : "text-muted-foreground hover:text-foreground"
            }`
          }
        >
          <LayoutDashboard size={18} />
          <span className="text-[10px]">الرئيسية</span>
        </NavLink>

        {/* 2. Memberships */}
        <NavLink
          to="/admin/memberships"
          className={({ isActive }) =>
            `flex flex-col items-center gap-0.5 px-2 py-1 rounded-xl transition-all ${
              isActive ? "text-primary font-bold" : "text-muted-foreground hover:text-foreground"
            }`
          }
        >
          <UserCheck size={18} />
          <span className="text-[10px]">الطلبات</span>
        </NavLink>

        {/* 3. Team */}
        <NavLink
          to="/admin/team"
          className={({ isActive }) =>
            `flex flex-col items-center gap-0.5 px-2 py-1 rounded-xl transition-all ${
              isActive ? "text-primary font-bold" : "text-muted-foreground hover:text-foreground"
            }`
          }
        >
          <Users size={18} />
          <span className="text-[10px]">الأعضاء</span>
        </NavLink>

        {/* 4. Projects */}
        <NavLink
          to="/admin/projects"
          className={({ isActive }) =>
            `flex flex-col items-center gap-0.5 px-2 py-1 rounded-xl transition-all ${
              isActive ? "text-primary font-bold" : "text-muted-foreground hover:text-foreground"
            }`
          }
        >
          <FolderOpen size={18} />
          <span className="text-[10px]">المشاريع</span>
        </NavLink>

        {/* 5. More menu trigger */}
        <button
          type="button"
          onClick={() => setMobileOpen(true)}
          className="flex flex-col items-center gap-0.5 px-2 py-1 rounded-xl text-muted-foreground hover:text-foreground transition-all"
        >
          <MoreHorizontal size={18} />
          <span className="text-[10px]">المزيد</span>
        </button>
      </nav>
    </div>
  );
}

