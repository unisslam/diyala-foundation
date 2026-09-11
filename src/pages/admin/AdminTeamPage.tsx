/**
 * AdminTeamPage.tsx
 * -----------------
 * Enterprise Member & Staff Directory — "بيت الأعضاء".
 *
 * Features:
 *  • Tabbed Filtering: All, Approved Members, Board, Staff & Management, Advisors
 *  • Digital ID Card Generator & Printer (DigitalMemberCardModal)
 *  • Member Workshops, Tasks, & Activities Log (MemberActivitiesModal)
 *  • Promote Member to Authenticated Admin User (PromoteMemberModal)
 *  • Direct inspection of the original 47-field Membership Application dossier
 *  • Full Mobile-First Responsive Design
 */

import React, { useState, useEffect, useCallback } from "react";
import {
  Plus, Edit2, Trash2, Eye, EyeOff, RefreshCw, Award,
  CreditCard, KeyRound, UserCheck, Search, Users, BookOpen
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/lib/supabaseClient";
import type { TeamMemberRow, MembershipApplicationRow } from "@/types/database.types";
import DigitalMemberCardModal from "@/components/admin/DigitalMemberCardModal";
import MemberActivitiesModal from "@/components/admin/MemberActivitiesModal";
import PromoteMemberModal from "@/components/admin/PromoteMemberModal";
import { printOfficialApplication } from "@/lib/membershipExport";

type TeamFilterTab = "all" | "approved_members" | "board" | "staff" | "advisor";

function TeamForm({
  member,
  onSave,
  onClose,
}: {
  member: Partial<TeamMemberRow> | null;
  onSave: () => void;
  onClose: () => void;
}): React.ReactElement {
  const isNew = !member?.id;
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    full_name_ar: member?.full_name_ar ?? "",
    full_name_en: member?.full_name_en ?? "",
    title_ar: member?.title_ar ?? "",
    title_en: member?.title_en ?? "",
    bio_ar: member?.bio_ar ?? "",
    bio_en: member?.bio_en ?? "",
    role: member?.role ?? "member",
    email: member?.email ?? "",
    linkedin_url: member?.linkedin_url ?? "",
    display_order: member?.display_order ?? 0,
    is_active: member?.is_active ?? true,
    membership_number: member?.membership_number ?? "",
    membership_tier: member?.membership_tier ?? "regular",
    activity_score: member?.activity_score ?? 100,
  });

  async function save(): Promise<void> {
    setSaving(true);
    const { error } = isNew
      ? await supabase.from("team_members").insert(form)
      : await supabase.from("team_members").update(form).eq("id", member!.id!);
    if (!error) {
      onSave();
      onClose();
    }
    setSaving(false);
  }

  const inputCls = "w-full px-3 py-2 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary";

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4" dir="rtl">
      <motion.div
        initial={{ opacity: 0, scale: 0.97 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-card rounded-3xl border border-border w-full max-w-xl max-h-[90vh] overflow-y-auto shadow-2xl"
      >
        <div className="sticky top-0 bg-card/95 backdrop-blur-md border-b border-border px-6 py-4 flex items-center justify-between z-10">
          <h2 className="font-display font-bold text-base">{isNew ? "إضافة عضو جديد" : "تعديل بيانات العضو"}</h2>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-muted text-muted-foreground">
            <Plus size={16} className="rotate-45" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold mb-1 block">الاسم الكامل (عربي)</label>
              <input
                value={form.full_name_ar}
                onChange={(e) => setForm((p) => ({ ...p, full_name_ar: e.target.value }))}
                className={inputCls}
                dir="rtl"
                placeholder="الاسم بالعربية"
              />
            </div>
            <div>
              <label className="text-xs font-semibold mb-1 block">Full Name (English)</label>
              <input
                value={form.full_name_en}
                onChange={(e) => setForm((p) => ({ ...p, full_name_en: e.target.value }))}
                className={inputCls}
                dir="ltr"
                placeholder="Name in English"
              />
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold mb-1 block">المسمى / الصفة (عربي)</label>
              <input
                value={form.title_ar}
                onChange={(e) => setForm((p) => ({ ...p, title_ar: e.target.value }))}
                className={inputCls}
                dir="rtl"
                placeholder="مثال: عضو الهيئة العامة"
              />
            </div>
            <div>
              <label className="text-xs font-semibold mb-1 block">Title (English)</label>
              <input
                value={form.title_en}
                onChange={(e) => setForm((p) => ({ ...p, title_en: e.target.value }))}
                className={inputCls}
                dir="ltr"
                placeholder="e.g. Member"
              />
            </div>
          </div>

          <div className="grid sm:grid-cols-3 gap-3">
            <div>
              <label className="text-xs font-semibold mb-1 block">التصنيف الإداري</label>
              <select
                value={form.role}
                onChange={(e) => setForm((p) => ({ ...p, role: e.target.value as TeamMemberRow["role"] }))}
                className={inputCls}
              >
                <option value="member">عضو مؤسسة</option>
                <option value="board">مجلس الإدارة</option>
                <option value="management">الإدارة التنفيذية</option>
                <option value="advisor">مستشار</option>
                <option value="staff">كادر وظيفي</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold mb-1 block">رقم العضوية</label>
              <input
                type="text"
                value={form.membership_number}
                onChange={(e) => setForm((p) => ({ ...p, membership_number: e.target.value }))}
                placeholder="DRF-MEM-..."
                className={inputCls}
                dir="ltr"
              />
            </div>

            <div>
              <label className="text-xs font-semibold mb-1 block">مؤشر النشاط</label>
              <input
                type="number"
                value={form.activity_score}
                onChange={(e) => setForm((p) => ({ ...p, activity_score: Number(e.target.value) }))}
                className={inputCls}
                dir="ltr"
              />
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold mb-1 block">البريد الإلكتروني</label>
              <input
                type="email"
                value={form.email ?? ""}
                onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
                className={inputCls}
                dir="ltr"
              />
            </div>
            <div>
              <label className="text-xs font-semibold mb-1 block">رابط LinkedIn</label>
              <input
                type="url"
                value={form.linkedin_url ?? ""}
                onChange={(e) => setForm((p) => ({ ...p, linkedin_url: e.target.value }))}
                className={inputCls}
                dir="ltr"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold mb-1 block">نبذة مختصرة (عربي)</label>
            <textarea
              rows={2}
              value={form.bio_ar ?? ""}
              onChange={(e) => setForm((p) => ({ ...p, bio_ar: e.target.value }))}
              className={inputCls}
              dir="rtl"
            />
          </div>

          <div className="flex items-center justify-between pt-2">
            <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold">
              <input
                type="checkbox"
                checked={form.is_active}
                onChange={(e) => setForm((p) => ({ ...p, is_active: e.target.checked }))}
                className="w-4 h-4 rounded text-primary focus:ring-primary"
              />
              <span>ظهور العضو ونشاطه على المنصة</span>
            </label>
          </div>
        </div>

        <div className="sticky bottom-0 bg-card border-t border-border px-6 py-4 flex justify-end gap-3 z-10">
          <button onClick={onClose} className="px-4 py-2 rounded-xl border border-border text-xs font-semibold hover:bg-muted">
            إلغاء
          </button>
          <button
            onClick={save}
            disabled={saving}
            className="px-5 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-bold disabled:opacity-60 shadow-sm"
          >
            {saving ? "جاري الحفظ..." : "حفظ البيانات"}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

export default function AdminTeamPage(): React.ReactElement {
  const [members, setMembers]                   = useState<TeamMemberRow[]>([]);
  const [loading, setLoading]                   = useState(true);
  const [search, setSearch]                     = useState("");
  const [tab, setTab]                           = useState<TeamFilterTab>("all");
  const [editTarget, setEditTarget]             = useState<Partial<TeamMemberRow> | null | undefined>(undefined);
  const [cardTarget, setCardTarget]             = useState<TeamMemberRow | null>(null);
  const [activitiesTarget, setActivitiesTarget] = useState<TeamMemberRow | null>(null);
  const [promoteTarget, setPromoteTarget]       = useState<TeamMemberRow | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from("team_members")
      .select("*")
      .order("display_order", { ascending: true });

    setMembers((data ?? []) as TeamMemberRow[]);
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function toggleActive(m: TeamMemberRow): Promise<void> {
    await supabase.from("team_members").update({ is_active: !m.is_active }).eq("id", m.id);
    void load();
  }

  async function deleteMember(m: TeamMemberRow): Promise<void> {
    if (!confirm(`هل أنت متأكد من حذف "${m.full_name_ar}" من فريق العمل؟`)) return;
    await supabase.from("team_members").delete().eq("id", m.id);
    void load();
  }

  async function viewDossier(appId: string): Promise<void> {
    const { data: app } = await supabase
      .from("membership_applications")
      .select("*")
      .eq("id", appId)
      .maybeSingle();

    if (app) {
      await printOfficialApplication(app as MembershipApplicationRow);
    } else {
      alert("تعذر العثور على استمارة الطلب الأصلية.");
    }
  }

  const ROLE_LABEL: Record<TeamMemberRow["role"], { label: string; color: string }> = {
    board:      { label: "مجلس الإدارة",   color: "bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300" },
    management: { label: "إدارة تنفيذية",  color: "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300" },
    advisor:    { label: "مستشار معتمد",  color: "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300" },
    staff:      { label: "كادر وظيفي",    color: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300" },
    member:     { label: "عضو مؤسسة",     color: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300" },
  };

  const filteredMembers = members.filter((m) => {
    if (tab === "approved_members" && !m.membership_application_id && m.role !== "member") return false;
    if (tab === "board" && m.role !== "board") return false;
    if (tab === "staff" && m.role !== "staff" && m.role !== "management") return false;
    if (tab === "advisor" && m.role !== "advisor") return false;

    if (search.trim()) {
      const q = search.toLowerCase();
      return (
        m.full_name_ar.toLowerCase().includes(q) ||
        (m.full_name_en || "").toLowerCase().includes(q) ||
        (m.title_ar || "").toLowerCase().includes(q) ||
        (m.email || "").toLowerCase().includes(q) ||
        (m.membership_number || "").toLowerCase().includes(q)
      );
    }
    return true;
  });

  const memberCount = members.filter((m) => m.role === "member" || m.membership_application_id).length;
  const boardCount = members.filter((m) => m.role === "board").length;

  return (
    <div dir="rtl" className="space-y-6">
      {/* Sub-modals */}
      <AnimatePresence>
        {editTarget !== undefined && (
          <TeamForm
            member={editTarget}
            onSave={load}
            onClose={() => setEditTarget(undefined)}
          />
        )}
        {cardTarget && (
          <DigitalMemberCardModal
            member={cardTarget}
            onClose={() => setCardTarget(null)}
          />
        )}
        {activitiesTarget && (
          <MemberActivitiesModal
            member={activitiesTarget}
            onClose={() => setActivitiesTarget(null)}
            onUpdate={load}
          />
        )}
        {promoteTarget && (
          <PromoteMemberModal
            member={promoteTarget}
            onClose={() => setPromoteTarget(null)}
            onSuccess={load}
          />
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="font-display text-xl sm:text-2xl font-black text-foreground">بيت الأعضاء وفريق العمل</h1>
          <p className="text-muted-foreground text-xs sm:text-sm mt-0.5">
            {members.length} عضو مسجل · <strong className="text-emerald-600">{memberCount} أعضاء هيئة عامة</strong> · {boardCount} مجلس إدارة
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={load}
            className="p-2.5 rounded-xl border border-border hover:bg-muted text-muted-foreground transition-colors"
            title="تحديث القائمة"
          >
            <RefreshCw size={15} />
          </button>

          <button
            onClick={() => setEditTarget(null)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-primary-foreground text-xs sm:text-sm font-bold hover:bg-primary-dark transition-all shadow-sm"
          >
            <Plus size={15} /> إضافة عضو جديد
          </button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1.5 no-scrollbar">
        {[
          { key: "all",              label: "كافة الأعضاء",               count: members.length },
          { key: "approved_members", label: "أعضاء المؤسسة المعتمدين",   count: memberCount },
          { key: "board",            label: "مجلس الإدارة",               count: boardCount },
          { key: "staff",            label: "الكادر التنفيذي والإداري",  count: members.filter((m) => m.role === "staff" || m.role === "management").length },
          { key: "advisor",          label: "المستشارون",                 count: members.filter((m) => m.role === "advisor").length },
        ].map(({ key, label, count }) => (
          <button
            key={key}
            onClick={() => setTab(key as TeamFilterTab)}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 ${
              tab === key
                ? "bg-primary text-primary-foreground shadow-sm"
                : "border border-border text-muted-foreground hover:bg-muted"
            }`}
          >
            <span>{label}</span>
            <span className="opacity-75 font-mono text-[10px]">({count})</span>
          </button>
        ))}
      </div>

      {/* Search Input */}
      <div className="relative">
        <Search size={14} className="absolute top-1/2 -translate-y-1/2 start-3 text-muted-foreground" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="بحث بالاسم، الصفة، البريد، رقم العضوية..."
          className="w-full sm:max-w-md ps-9 pe-4 py-2 rounded-xl border border-border bg-card text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-primary shadow-2xs"
        />
      </div>

      {/* Members Grid */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? (
          Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-56 shimmer rounded-2xl border border-border/50" />
          ))
        ) : filteredMembers.length === 0 ? (
          <div className="sm:col-span-2 lg:col-span-3 text-center py-16 text-muted-foreground text-sm bg-card rounded-2xl border border-border">
            <Users size={32} className="mx-auto mb-2 opacity-25" />
            لا توجد سجلات مطابقة في هذا التصنيف.
          </div>
        ) : (
          filteredMembers.map((m) => {
            const roleCfg = ROLE_LABEL[m.role] ?? ROLE_LABEL.member;
            const memNum = m.membership_number || (m.membership_application_id ? "طلب معتمد" : "عضو كادر");

            return (
              <div
                key={m.id}
                className={`p-5 rounded-3xl border bg-card shadow-xs transition-all flex flex-col justify-between space-y-4 hover:border-primary/40 ${
                  m.is_active ? "border-border" : "border-dashed opacity-60 bg-muted/20"
                }`}
              >
                {/* Card Top: Avatar, Names, Role */}
                <div>
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-12 h-12 rounded-2xl bg-primary/10 border border-primary/20 text-primary font-display font-black text-lg flex items-center justify-center shrink-0 overflow-hidden shadow-inner">
                        {m.avatar_path ? (
                          <img src={m.avatar_path} alt="" className="w-full h-full object-cover" />
                        ) : (
                          (m.full_name_ar || "?").charAt(0)
                        )}
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-bold font-display text-sm text-foreground truncate">{m.full_name_ar}</h3>
                        {m.full_name_en && (
                          <p className="text-[10px] text-muted-foreground capitalize truncate">{m.full_name_en}</p>
                        )}
                        <p className="text-xs font-semibold text-primary mt-0.5 truncate">{m.title_ar || "عضو المؤسسة"}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => toggleActive(m)}
                        title={m.is_active ? "إخفاء من الموقع" : "إظهار على الموقع"}
                        className={`p-1.5 rounded-lg hover:bg-muted transition-colors ${
                          m.is_active ? "text-emerald-600" : "text-muted-foreground"
                        }`}
                      >
                        {m.is_active ? <Eye size={14} /> : <EyeOff size={14} />}
                      </button>
                      <button
                        onClick={() => setEditTarget(m)}
                        title="تعديل البيانات"
                        className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-primary transition-colors"
                      >
                        <Edit2 size={14} />
                      </button>
                      <button
                        onClick={() => deleteMember(m)}
                        title="حذف العضو"
                        className="p-1.5 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>

                  {/* Badges Row */}
                  <div className="flex flex-wrap gap-1.5 items-center mb-3">
                    <span className={`inline-flex px-2.5 py-0.5 rounded-full text-[10.5px] font-bold ${roleCfg.color}`}>
                      {roleCfg.label}
                    </span>

                    {m.membership_application_id && (
                      <button
                        onClick={() => viewDossier(m.membership_application_id!)}
                        title="استعراض استمارة الانتساب الرسمية الأصلية"
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-primary/10 text-primary hover:bg-primary/20 transition-colors border border-primary/20"
                      >
                        <UserCheck size={11} /> استمارة الطلب ↗
                      </button>
                    )}

                    <span className="ms-auto text-[10px] font-mono text-muted-foreground bg-muted/60 px-2 py-0.5 rounded-md" dir="ltr">
                      {memNum}
                    </span>
                  </div>

                  {/* Bio or Details */}
                  {m.bio_ar && (
                    <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed bg-muted/20 p-2.5 rounded-xl border border-border/40">
                      {m.bio_ar}
                    </p>
                  )}
                </div>

                {/* Card Bottom Actions */}
                <div className="pt-3 border-t border-border/60 space-y-2">
                  <div className="flex items-center justify-between text-[11px] text-muted-foreground font-medium px-1">
                    <span className="flex items-center gap-1">
                      <Award size={12} className="text-amber-500" />
                      نقاط النشاط: <strong className="text-foreground">{m.activity_score ?? 100}</strong>
                    </span>
                    {m.email && <span className="truncate max-w-[130px] font-mono text-[10px]" dir="ltr">{m.email}</span>}
                  </div>

                  <div className="grid grid-cols-3 gap-1.5 pt-1">
                    {/* 1. Digital ID Card */}
                    <button
                      onClick={() => setCardTarget(m)}
                      className="py-1.5 px-2 rounded-xl bg-muted hover:bg-primary/10 hover:text-primary text-[11px] font-bold transition-all flex items-center justify-center gap-1 border border-border/60"
                      title="عرض وطباعة بطاقة العضوية الرقمية"
                    >
                      <CreditCard size={12} /> البطاقة
                    </button>

                    {/* 2. Activities & Workshops */}
                    <button
                      onClick={() => setActivitiesTarget(m)}
                      className="py-1.5 px-2 rounded-xl bg-muted hover:bg-primary/10 hover:text-primary text-[11px] font-bold transition-all flex items-center justify-center gap-1 border border-border/60"
                      title="سجل الورش والمهام التابعة للعضو"
                    >
                      <BookOpen size={12} /> الورش
                    </button>

                    {/* 3. Promote to Admin */}
                    <button
                      onClick={() => setPromoteTarget(m)}
                      className="py-1.5 px-2 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 text-[11px] font-bold transition-all flex items-center justify-center gap-1 border border-emerald-500/20"
                      title="ترقية العضو ومنحه حساب وصلاحيات في لوحة التحكم"
                    >
                      <KeyRound size={12} /> ترقية
                    </button>
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
