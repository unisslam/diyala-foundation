/**
 * AdminUsersPage.tsx
 * ------------------
 * Super Admin interface for managing administrative users, roles, and granular RBAC permissions.
 */

import React, { useState, useEffect, useCallback } from "react";
import {
  Shield, UserCheck, ShieldCheck, ShieldAlert, Newspaper, FolderOpen, Users,
  MessageSquare, Image, RefreshCw
} from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import type { AdminProfileRow, AdminPermissions, AdminRole } from "@/types/database.types";
import { useAuth } from "@/hooks/useAuth";

const PERM_METAS: { key: keyof AdminPermissions; label: string; icon: React.ElementType }[] = [
  { key: "can_manage_memberships", label: "طلبات العضوية",  icon: UserCheck },
  { key: "can_manage_team",         label: "فريق العمل",     icon: Users },
  { key: "can_manage_news",         label: "الأخبار والمقالات", icon: Newspaper },
  { key: "can_manage_projects",     label: "المشاريع والأثر", icon: FolderOpen },
  { key: "can_manage_messages",     label: "الرسائل والتطوع", icon: MessageSquare },
  { key: "can_manage_gallery",      label: "معرض الصور",     icon: Image },
  { key: "can_manage_admins",       label: "إدارة المشرفين", icon: Shield },
];

export default function AdminUsersPage(): React.ReactElement {
  const { isSuperAdmin, user: currentAuthUser } = useAuth();
  const [profiles, setProfiles] = useState<AdminProfileRow[]>([]);
  const [loading, setLoading]   = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);

  const loadProfiles = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from("admin_profiles")
      .select("*")
      .order("created_at", { ascending: true });

    setProfiles((data ?? []) as AdminProfileRow[]);
    setLoading(false);
  }, []);

  useEffect(() => {
    void loadProfiles();
  }, [loadProfiles]);

  async function handleTogglePermission(profile: AdminProfileRow, permKey: keyof AdminPermissions) {
    if (profile.role === "super_admin") return; // Super admin has all permissions
    setSavingId(profile.id);

    const updatedPermissions = {
      ...profile.permissions,
      [permKey]: !profile.permissions?.[permKey],
    };

    const { error } = await supabase
      .from("admin_profiles")
      .update({ permissions: updatedPermissions, updated_at: new Date().toISOString() })
      .eq("id", profile.id);

    if (!error) {
      setProfiles((prev) =>
        prev.map((p) => (p.id === profile.id ? { ...p, permissions: updatedPermissions } : p))
      );
    }
    setSavingId(null);
  }

  async function handleToggleActive(profile: AdminProfileRow) {
    if (profile.id === currentAuthUser?.id) {
      alert("لا يمكنك تعطيل حسابك الشخصي الحالي.");
      return;
    }

    setSavingId(profile.id);
    const newStatus = !profile.is_active;

    const { error } = await supabase
      .from("admin_profiles")
      .update({ is_active: newStatus, updated_at: new Date().toISOString() })
      .eq("id", profile.id);

    if (!error) {
      setProfiles((prev) =>
        prev.map((p) => (p.id === profile.id ? { ...p, is_active: newStatus } : p))
      );
    }
    setSavingId(null);
  }

  async function handleRoleChange(profile: AdminProfileRow, newRole: AdminRole) {
    setSavingId(profile.id);

    const { error } = await supabase
      .from("admin_profiles")
      .update({ role: newRole, updated_at: new Date().toISOString() })
      .eq("id", profile.id);

    if (!error) {
      setProfiles((prev) =>
        prev.map((p) => (p.id === profile.id ? { ...p, role: newRole } : p))
      );
    }
    setSavingId(null);
  }

  if (!isSuperAdmin) {
    return (
      <div className="text-center py-20 bg-card rounded-3xl border border-border p-8" dir="rtl">
        <ShieldAlert size={48} className="mx-auto mb-4 text-amber-500 opacity-60" />
        <h2 className="font-display font-bold text-lg mb-1">غير مصرح بالوصول</h2>
        <p className="text-xs text-muted-foreground max-w-sm mx-auto">
          صفحة إدارة المشرفين والصلاحيات مخصصة لمدير النظام الشامل (Super Admin) فقط.
        </p>
      </div>
    );
  }

  return (
    <div dir="rtl" className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="font-display text-xl sm:text-2xl font-black text-foreground flex items-center gap-2">
            <ShieldCheck className="text-primary" size={24} />
            إدارة المشرفين والصلاحيات (RBAC)
          </h1>
          <p className="text-muted-foreground text-xs sm:text-sm mt-0.5">
            التحكم في أدوار وصلاحيات الوصول إلى أقسام لوحة تحكم مؤسسة نهر ديالى
          </p>
        </div>

        <button
          onClick={loadProfiles}
          className="p-2.5 rounded-xl border border-border hover:bg-muted text-muted-foreground transition-colors"
          title="تحديث القائمة"
        >
          <RefreshCw size={16} />
        </button>
      </div>

      {/* Admin Profiles List */}
      <div className="space-y-4">
        {loading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-36 shimmer rounded-2xl border border-border/50" />
          ))
        ) : profiles.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground text-sm bg-card rounded-2xl border border-border">
            لا يوجد مشرفين مسجلين في النظام بعد.
          </div>
        ) : (
          profiles.map((p) => {
            const isSelf = p.id === currentAuthUser?.id;
            const isSuper = p.role === "super_admin";

            return (
              <div
                key={p.id}
                className={`p-5 rounded-3xl border bg-card shadow-xs transition-all space-y-4 ${
                  savingId === p.id ? "opacity-60 pointer-events-none" : ""
                } ${
                  p.is_active ? "border-border" : "border-dashed opacity-60 bg-muted/20"
                }`}
              >
                {/* Profile Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/50 pb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary font-display font-black text-lg flex items-center justify-center shrink-0 border border-primary/20">
                      {p.full_name.charAt(0)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-bold font-display text-base text-foreground">{p.full_name}</h3>
                        {isSelf && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                            حسابك الحالي
                          </span>
                        )}
                        {!p.is_active && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-destructive/10 text-destructive">
                            معطل
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5 font-mono" dir="ltr">{p.id}</p>
                    </div>
                  </div>

                  <div className="w-full sm:w-auto flex flex-col sm:flex-row items-stretch sm:items-center gap-2 pt-1 sm:pt-0">
                    {/* Role selector */}
                    <select
                      value={p.role}
                      disabled={isSelf}
                      onChange={(e) => void handleRoleChange(p, e.target.value as AdminRole)}
                      className="px-3 py-2 rounded-xl border border-border bg-background text-xs font-bold focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-60 min-h-[40px]"
                    >
                      <option value="super_admin">مدير نظام شامل (Super Admin)</option>
                      <option value="membership_officer">مسؤول شؤون الأعضاء</option>
                      <option value="editor">محرر الأخبار والإعلام</option>
                      <option value="comms_manager">مسؤول التواصل</option>
                      <option value="custom">صلاحيات مخصصة (Custom)</option>
                    </select>

                    {!isSelf && (
                      <button
                        onClick={() => void handleToggleActive(p)}
                        className={`px-3 py-2 rounded-xl text-xs font-bold border transition-colors min-h-[40px] ${
                          p.is_active
                            ? "border-destructive/30 text-destructive hover:bg-destructive/10"
                            : "border-emerald-500/30 text-emerald-600 hover:bg-emerald-500/10"
                        }`}
                      >
                        {p.is_active ? "تعطيل الحساب" : "تفعيل الحساب"}
                      </button>
                    )}
                  </div>
                </div>

                {/* Permissions Grid */}
                <div>
                  <p className="text-xs font-bold text-muted-foreground mb-2">مصفوفة الصلاحيات الممنوحة:</p>
                  <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
                    {PERM_METAS.map(({ key, label, icon: Icon }) => {
                      const hasPerm = isSuper || Boolean(p.permissions?.[key]);
                      const disabled = isSuper || !p.is_active;

                      return (
                        <button
                          key={key}
                          type="button"
                          disabled={disabled}
                          onClick={() => void handleTogglePermission(p, key)}
                          className={`p-3 rounded-2xl border text-center flex flex-col items-center justify-center gap-1.5 transition-all text-xs font-bold min-h-[68px] ${
                            hasPerm
                              ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-300 shadow-2xs"
                              : "bg-muted/40 border-border text-muted-foreground hover:bg-muted"
                          } ${disabled ? "cursor-default" : "cursor-pointer active:scale-95"}`}
                        >
                          <Icon size={16} className={hasPerm ? "text-emerald-600 dark:text-emerald-400" : "opacity-40"} />
                          <span className="text-[11px] leading-tight line-clamp-1">{label}</span>
                          <span className={`text-[9px] px-1.5 py-0.2 rounded-full font-bold ${hasPerm ? "bg-emerald-500 text-white" : "bg-muted text-muted-foreground"}`}>
                            {hasPerm ? "مفعل" : "معطل"}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
