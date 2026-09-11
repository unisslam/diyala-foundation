/**
 * PromoteMemberModal.tsx
 * ----------------------
 * Allows Admins to promote any team member to an authenticated admin/staff user
 * with granular RBAC permissions.
 */

import React, { useState } from "react";
import { motion } from "framer-motion";
import {
  X, KeyRound, Mail, CheckCircle2, AlertCircle, UserCheck,
  Newspaper, FolderOpen, Users, MessageSquare, Image, Shield
} from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import type { TeamMemberRow, AdminRole, AdminPermissions } from "@/types/database.types";

interface PromoteMemberModalProps {
  member: TeamMemberRow;
  onClose: () => void;
  onSuccess: () => void;
}

const ROLE_TEMPLATES: Record<Exclude<AdminRole, "custom">, { title: string; desc: string; perms: AdminPermissions }> = {
  super_admin: {
    title: "مدير نظام شامل (Super Admin)",
    desc: "صلاحيات كاملة على كل أقسام لوحة التحكم بما في ذلك إدارة الصلاحيات والمشرفين.",
    perms: {
      can_manage_news: true,
      can_manage_projects: true,
      can_manage_memberships: true,
      can_manage_team: true,
      can_manage_messages: true,
      can_manage_gallery: true,
      can_manage_admins: true,
    },
  },
  membership_officer: {
    title: "مسؤول شؤون الأعضاء (Membership Officer)",
    desc: "مراجعة واعتماد طلبات العضوية، تصدير السجلات الرسمية، وإدارة فريق الأعضاء.",
    perms: {
      can_manage_news: false,
      can_manage_projects: false,
      can_manage_memberships: true,
      can_manage_team: true,
      can_manage_messages: false,
      can_manage_gallery: false,
      can_manage_admins: false,
    },
  },
  editor: {
    title: "محرر الأخبار والإعلام (Content Editor)",
    desc: "نشر وتعديل الأخبار، التقارير الصحفية، وإدارة ألبومات معرض الصور.",
    perms: {
      can_manage_news: true,
      can_manage_projects: false,
      can_manage_memberships: false,
      can_manage_team: false,
      can_manage_messages: false,
      can_manage_gallery: true,
      can_manage_admins: false,
    },
  },
  comms_manager: {
    title: "مسؤول العلاقات والتواصل (Communications)",
    desc: "استعراض والرد على رسائل التواصل الواردة، واستمارات التطوع، والمجلة.",
    perms: {
      can_manage_news: false,
      can_manage_projects: false,
      can_manage_memberships: false,
      can_manage_team: false,
      can_manage_messages: true,
      can_manage_gallery: false,
      can_manage_admins: false,
    },
  },
};

export default function PromoteMemberModal({ member, onClose, onSuccess }: PromoteMemberModalProps): React.ReactElement {
  const [email, setEmail]       = useState(member.email || "");
  const [password, setPassword] = useState("");
  const [selectedRole, setSelectedRole] = useState<AdminRole>("membership_officer");
  const [permissions, setPermissions] = useState<AdminPermissions>({
    ...ROLE_TEMPLATES.membership_officer.perms,
  });
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [success, setSuccess]   = useState(false);

  const handleRoleChange = (role: AdminRole) => {
    setSelectedRole(role);
    if (role !== "custom") {
      setPermissions({ ...ROLE_TEMPLATES[role].perms });
    }
  };

  const handlePermissionToggle = (key: keyof AdminPermissions) => {
    setSelectedRole("custom");
    setPermissions((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  async function handlePromote(e: React.FormEvent): Promise<void> {
    e.preventDefault();
    if (!email) {
      setErrorMsg("يرجى إدخال البريد الإلكتروني للحساب.");
      return;
    }
    if (!password || password.length < 6) {
      setErrorMsg("يرجى تحديد كلمة مرور مؤقتة لا تقل عن 6 أحرف.");
      return;
    }

    setSaving(true);
    setErrorMsg(null);

    try {
      // 1. Try to sign up or check if user exists
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: member.full_name_ar,
          },
        },
      });

      let userId = authData.user?.id;

      if (authError) {
        // If user already registered, we try to locate their user id or update profile
        if (authError.message.toLowerCase().includes("already registered") || authError.status === 422) {
          // Check if admin_profiles already has this user or fetch via email
          const { data: existingProfiles } = await supabase
            .from("admin_profiles")
            .select("id")
            .eq("team_member_id", member.id)
            .maybeSingle();

          if (existingProfiles?.id) {
            userId = existingProfiles.id;
          } else {
            setErrorMsg("المستخدم مسجل مسبقاً في النظام. يمكنك تعديل صلاحياته من صفحة المشرفين.");
            setSaving(false);
            return;
          }
        } else {
          setErrorMsg(authError.message);
          setSaving(false);
          return;
        }
      }

      if (!userId) {
        setErrorMsg("تعذر إنشاء حساب المصادقة. يرجى التأكد من صلاحية البريد الإلكتروني.");
        setSaving(false);
        return;
      }

      // 2. Insert or update admin_profiles
      const { error: profileError } = await supabase.from("admin_profiles").upsert({
        id: userId,
        team_member_id: member.id,
        full_name: member.full_name_ar,
        role: selectedRole,
        permissions,
        is_active: true,
        updated_at: new Date().toISOString(),
      });

      if (profileError) {
        setErrorMsg(`فشل حفظ الصلاحيات: ${profileError.message}`);
        setSaving(false);
        return;
      }

      // 3. Update team_member email if changed
      if (member.email !== email) {
        await supabase.from("team_members").update({ email }).eq("id", member.id);
      }

      setSuccess(true);
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 1500);
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : "حدث خطأ غير متوقع.");
    } finally {
      setSaving(false);
    }
  }

  const permItems: { key: keyof AdminPermissions; label: string; icon: React.ElementType }[] = [
    { key: "can_manage_memberships", label: "مراجعة وإدارة طلبات العضوية",  icon: UserCheck },
    { key: "can_manage_team",         label: "إدارة فريق العمل والأعضاء",      icon: Users },
    { key: "can_manage_news",         label: "نشر وإدارة الأخبار والمقالات",   icon: Newspaper },
    { key: "can_manage_projects",     label: "إدارة المشاريع وإحصاءات الأثر", icon: FolderOpen },
    { key: "can_manage_messages",     label: "مراجعة رسائل التواصل والتطوع",  icon: MessageSquare },
    { key: "can_manage_gallery",      label: "إدارة ألبومات معرض الصور",      icon: Image },
    { key: "can_manage_admins",       label: "إدارة المشرفين والصلاحيات",      icon: Shield },
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      dir="rtl"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-card rounded-3xl border border-border w-full max-w-lg p-6 shadow-2xl max-h-[92vh] overflow-y-auto"
      >
        <div className="flex items-center justify-between mb-5 border-b border-border pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
              <KeyRound size={18} />
            </div>
            <div>
              <h3 className="font-display font-bold text-base">ترقية العضو إلى مستخدم نظام</h3>
              <p className="text-xs text-muted-foreground">منح صلاحيات إدارية للمستخدم في لوحة التحكم</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-muted text-muted-foreground">
            <X size={16} />
          </button>
        </div>

        {success ? (
          <div className="text-center py-8 space-y-3">
            <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400 mx-auto flex items-center justify-center">
              <CheckCircle2 size={32} />
            </div>
            <h4 className="font-bold text-lg">تمت الترقية ومنح الصلاحيات بنجاح!</h4>
            <p className="text-xs text-muted-foreground max-w-xs mx-auto">
              يمكن للعضو الآن تسجيل الدخول إلى لوحة التحكم بالبريد وكلمة المرور المحددين.
            </p>
          </div>
        ) : (
          <form onSubmit={handlePromote} className="space-y-4">
            {errorMsg && (
              <div className="p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-xs flex items-center gap-2">
                <AlertCircle size={14} className="shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Member Profile Summary */}
            <div className="bg-muted/40 rounded-2xl p-3.5 border border-border/50 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary font-bold flex items-center justify-center shrink-0">
                {member.full_name_ar.charAt(0)}
              </div>
              <div className="min-w-0">
                <p className="font-bold text-sm leading-tight">{member.full_name_ar}</p>
                <p className="text-xs text-muted-foreground">{member.title_ar || "عضو معتمد"}</p>
              </div>
            </div>

            {/* Account Credentials */}
            <div className="grid sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold mb-1 block flex items-center gap-1">
                  <Mail size={12} className="text-primary" /> البريد الإلكتروني
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@diyalariver.org"
                  className="w-full px-3 py-2 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  dir="ltr"
                />
              </div>

              <div>
                <label className="text-xs font-semibold mb-1 block flex items-center gap-1">
                  <KeyRound size={12} className="text-primary" /> كلمة المرور الأولية
                </label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-3 py-2 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  dir="ltr"
                />
              </div>
            </div>

            {/* Role Templates Selector */}
            <div>
              <label className="text-xs font-semibold mb-2 block">نموذج الدور الإداري</label>
              <div className="grid grid-cols-2 gap-2">
                {(Object.keys(ROLE_TEMPLATES) as (keyof typeof ROLE_TEMPLATES)[]).map((r) => {
                  const t = ROLE_TEMPLATES[r];
                  const isSelected = selectedRole === r;
                  return (
                    <button
                      key={r}
                      type="button"
                      onClick={() => handleRoleChange(r)}
                      className={`p-2.5 rounded-xl border text-start transition-all ${
                        isSelected
                          ? "border-primary bg-primary/10 text-primary shadow-sm"
                          : "border-border hover:bg-muted/50 text-foreground"
                      }`}
                    >
                      <p className="font-bold text-xs">{t.title.split("(")[0].trim()}</p>
                      <p className="text-[10px] text-muted-foreground line-clamp-1 mt-0.5">{t.desc}</p>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Granular Permissions Checkboxes */}
            <div className="border border-border/70 rounded-2xl p-3.5 bg-muted/20">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-bold text-foreground">الصلاحيات المحددة (Custom Permissions)</p>
                {selectedRole === "custom" && (
                  <span className="text-[10px] font-semibold text-amber-600 bg-amber-100 dark:bg-amber-950 px-2 py-0.5 rounded-full">
                    مخصصة
                  </span>
                )}
              </div>

              <div className="space-y-2">
                {permItems.map(({ key, label, icon: Icon }) => (
                  <label
                    key={key}
                    className="flex items-center justify-between p-2 rounded-xl hover:bg-muted/60 cursor-pointer transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <Icon size={14} className={permissions[key] ? "text-primary" : "text-muted-foreground"} />
                      <span className="text-xs font-medium">{label}</span>
                    </div>
                    <input
                      type="checkbox"
                      checked={Boolean(permissions[key])}
                      onChange={() => handlePermissionToggle(key)}
                      className="w-4 h-4 rounded text-primary focus:ring-primary border-border"
                    />
                  </label>
                ))}
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-2.5 rounded-xl border border-border text-sm hover:bg-muted font-medium transition-colors"
              >
                إلغاء
              </button>
              <button
                type="submit"
                disabled={saving}
                className="flex-1 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-bold disabled:opacity-60 flex items-center justify-center gap-2 transition-all shadow-sm"
              >
                {saving ? "جاري الحفظ..." : "تأكيد الترقية ومنح الحساب"}
              </button>
            </div>
          </form>
        )}
      </motion.div>
    </motion.div>
  );
}
