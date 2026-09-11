/**
 * AdminGuard.tsx
 * ---------------
 * Protects /admin/* routes.
 * Redirects unauthenticated users to /admin/login.
 */

import React from "react";
import { Navigate, Outlet, useLocation, Link } from "react-router-dom";
import { ShieldAlert, Home } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import type { AdminPermissions } from "@/types/database.types";

const ROUTE_PERM_MAP: Record<string, keyof AdminPermissions> = {
  "/admin/memberships":  "can_manage_memberships",
  "/admin/team":         "can_manage_team",
  "/admin/projects":     "can_manage_projects",
  "/admin/news":         "can_manage_news",
  "/admin/contacts":     "can_manage_messages",
  "/admin/gallery":      "can_manage_gallery",
  "/admin/testimonials": "can_manage_news",
  "/admin/users":        "can_manage_admins",
};

export default function AdminGuard(): React.ReactElement {
  const { user, profile, loading, hasPermission, isSuperAdmin } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background" dir="rtl">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 rounded-full border-4 border-primary border-t-transparent animate-spin" />
          <p className="text-sm text-muted-foreground">جاري التحقق من الهوية والصلاحيات...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <Navigate
        to="/admin/login"
        state={{ from: location.pathname }}
        replace
      />
    );
  }

  // Check if account is deactivated
  if (profile && !profile.is_active) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background p-4" dir="rtl">
        <div className="bg-card rounded-3xl border border-border p-8 max-w-md w-full text-center space-y-4 shadow-xl">
          <div className="w-16 h-16 rounded-2xl bg-destructive/10 text-destructive mx-auto flex items-center justify-center">
            <ShieldAlert size={36} />
          </div>
          <h2 className="font-display font-bold text-lg text-foreground">الحساب معطل مؤقتاً</h2>
          <p className="text-xs text-muted-foreground leading-relaxed">
            تم تعطيل صلاحيات هذا الحساب الإداري من قبل إدارة المؤسسة. يرجى مراجعة المسؤول العام لإعادة التفعيل.
          </p>
          <Link
            to="/admin/login"
            className="inline-flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-primary text-primary-foreground text-xs font-bold"
          >
            تسجيل الدخول بحساب آخر
          </Link>
        </div>
      </div>
    );
  }

  // Check specific route permissions
  const requiredPerm = ROUTE_PERM_MAP[location.pathname];
  if (requiredPerm && !isSuperAdmin && !hasPermission(requiredPerm)) {
    return (
      <div className="flex items-center justify-center min-h-[70vh] p-4" dir="rtl">
        <div className="bg-card rounded-3xl border border-border p-8 max-w-md w-full text-center space-y-4 shadow-xl">
          <div className="w-14 h-14 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 mx-auto flex items-center justify-center">
            <ShieldAlert size={30} />
          </div>
          <h2 className="font-display font-bold text-lg text-foreground">عفواً، لا تمتلك صلاحية الوصول</h2>
          <p className="text-xs text-muted-foreground leading-relaxed">
            حسابك الإداري الحالي مخصص لمهام محددة ولا يملك تصريحاً لاستعراض هذه الصفحة.
          </p>
          <div className="pt-2 flex gap-2">
            <Link
              to="/admin"
              className="flex-1 py-2.5 rounded-xl bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center gap-1.5"
            >
              <Home size={14} /> العودة للرئيسية
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return <Outlet />;
}
