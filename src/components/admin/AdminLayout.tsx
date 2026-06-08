/**
 * AdminLayout.tsx
 * ---------------
 * Persistent shell for all admin pages:
 *  - Collapsible sidebar with navigation
 *  - Top header with user info + sign out
 *  - <Outlet /> content area
 */

import React, { useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard, FolderOpen, Newspaper, Users, MessageSquare,
  Star, Image, BarChart3, LogOut, Menu, X, ChevronRight,
  UserCheck, Shield,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

interface NavItem {
  to: string;
  icon: React.ElementType;
  label: string;
  badge?: number;
}

const NAV_ITEMS: NavItem[] = [
  { to: "/admin",              icon: LayoutDashboard, label: "لوحة التحكم" },
  { to: "/admin/projects",     icon: FolderOpen,      label: "المشاريع" },
  { to: "/admin/news",         icon: Newspaper,       label: "الأخبار" },
  { to: "/admin/team",         icon: Users,           label: "الفريق" },
  { to: "/admin/testimonials", icon: Star,            label: "الشهادات" },
  { to: "/admin/gallery",      icon: Image,           label: "المعرض" },
  { to: "/admin/contacts",     icon: MessageSquare,   label: "الرسائل" },
  { to: "/admin/memberships",  icon: UserCheck,       label: "طلبات العضوية" },
  { to: "/admin/stats",        icon: BarChart3,       label: "الإحصاءات" },
];

function SidebarNav({ collapsed, onClose }: { collapsed?: boolean; onClose?: () => void }): React.ReactElement {
  return (
    <nav className="flex flex-col gap-1 px-2">
      {NAV_ITEMS.map(({ to, icon: Icon, label }) => (
        <NavLink
          key={to}
          to={to}
          end={to === "/admin"}
          onClick={onClose}
          className={({ isActive }) =>
            `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 group ${
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
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  async function handleSignOut(): Promise<void> {
    await signOut();
    navigate("/admin/login");
  }

  const SidebarContent = (): React.ReactElement => (
    <div className="flex flex-col h-full">
      {/* Brand */}
      <div className="px-5 py-5 border-b border-border shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
            <Shield size={17} className="text-primary" />
          </div>
          <div className="min-w-0">
            <p className="font-display font-bold text-sm leading-tight truncate">لوحة التحكم</p>
            <p className="text-[10px] text-muted-foreground truncate">مؤسسة نهر ديالى</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <div className="flex-1 overflow-y-auto py-3">
        <SidebarNav onClose={() => setMobileOpen(false)} />
      </div>

      {/* User info */}
      <div className="p-4 border-t border-border shrink-0">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm shrink-0">
            {user?.email?.[0].toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-medium truncate">{user?.email}</p>
            <p className="text-[10px] text-muted-foreground">مشرف</p>
          </div>
        </div>
        <button
          onClick={handleSignOut}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-sm text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
        >
          <LogOut size={15} />
          تسجيل الخروج
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-muted/30 flex" dir="rtl">
      {/* ── Desktop Sidebar ─────────────────────────────────────────── */}
      <aside className="hidden lg:flex flex-col w-60 bg-card border-e border-border shrink-0 fixed top-0 bottom-0 start-0 z-30">
        <SidebarContent />
      </aside>

      {/* ── Mobile sidebar overlay ──────────────────────────────────── */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 z-40 lg:hidden"
              onClick={() => setMobileOpen(false)}
            />
            <motion.aside
              initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25 }}
              className="fixed top-0 end-0 bottom-0 w-64 bg-card border-s border-border z-50 lg:hidden"
            >
              <div className="absolute top-3 start-3">
                <button onClick={() => setMobileOpen(false)} className="p-2 rounded-xl hover:bg-muted">
                  <X size={18} />
                </button>
              </div>
              <SidebarContent />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* ── Main content ────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col lg:ms-60">
        {/* Top header */}
        <header className="sticky top-0 z-20 bg-card/95 backdrop-blur-md border-b border-border px-5 py-3 flex items-center justify-between">
          <button
            onClick={() => setMobileOpen(true)}
            className="lg:hidden p-2 rounded-xl hover:bg-muted"
            aria-label="Open menu"
          >
            <Menu size={20} />
          </button>
          <div className="lg:hidden font-display font-bold text-sm">لوحة التحكم</div>
          <div className="hidden lg:flex items-center gap-2 text-sm text-muted-foreground">
            <span>أهلاً،</span>
            <span className="font-semibold text-foreground">{user?.email}</span>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-5 md:p-8 overflow-x-hidden">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
