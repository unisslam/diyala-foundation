/**
 * AdminTeamPage.tsx
 * -----------------
 * Manage team_members table.
 */

import React, { useState, useEffect, useCallback } from "react";
import { Plus, Edit2, Trash2, Eye, EyeOff, RefreshCw } from "lucide-react";
import { motion } from "framer-motion";
import { supabase } from "@/lib/supabaseClient";
import type { TeamMemberRow } from "@/types/database.types";

function TeamForm({ member, onSave, onClose }: {
  member: Partial<TeamMemberRow> | null; onSave: () => void; onClose: () => void;
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
    role: member?.role ?? "staff",
    email: member?.email ?? "",
    linkedin_url: member?.linkedin_url ?? "",
    display_order: member?.display_order ?? 0,
    is_active: member?.is_active ?? true,
  });

  async function save(): Promise<void> {
    setSaving(true);
    const { error } = isNew
      ? await supabase.from("team_members").insert(form)
      : await supabase.from("team_members").update(form).eq("id", member!.id!);
    if (!error) { onSave(); onClose(); }
    setSaving(false);
  }

  const inputCls = "w-full px-3 py-2 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary";

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" dir="rtl">
      <motion.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }}
        className="bg-card rounded-3xl border border-border w-full max-w-xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-card border-b border-border px-6 py-4 flex items-center justify-between">
          <h2 className="font-display font-bold">{isNew ? "إضافة عضو" : "تعديل العضو"}</h2>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-muted"><Plus size={16} className="rotate-45" /></button>
        </div>
        <div className="p-6 space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <div><label className="text-xs font-medium mb-1 block">الاسم (عربي)</label>
              <input value={form.full_name_ar} onChange={(e) => setForm(p => ({...p, full_name_ar: e.target.value}))} className={inputCls} dir="rtl" /></div>
            <div><label className="text-xs font-medium mb-1 block">Name (English)</label>
              <input value={form.full_name_en} onChange={(e) => setForm(p => ({...p, full_name_en: e.target.value}))} className={inputCls} dir="ltr" /></div>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div><label className="text-xs font-medium mb-1 block">المسمى الوظيفي (عربي)</label>
              <input value={form.title_ar} onChange={(e) => setForm(p => ({...p, title_ar: e.target.value}))} className={inputCls} dir="rtl" /></div>
            <div><label className="text-xs font-medium mb-1 block">Title (English)</label>
              <input value={form.title_en} onChange={(e) => setForm(p => ({...p, title_en: e.target.value}))} className={inputCls} dir="ltr" /></div>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div><label className="text-xs font-medium mb-1 block">الدور</label>
              <select value={form.role} onChange={(e) => setForm(p => ({...p, role: e.target.value as TeamMemberRow["role"]}))} className={inputCls}>
                <option value="board">مجلس الإدارة</option>
                <option value="management">الإدارة التنفيذية</option>
                <option value="advisor">مستشار</option>
                <option value="staff">كادر</option>
                <option value="member">عضو</option>
              </select></div>
            <div><label className="text-xs font-medium mb-1 block">الترتيب</label>
              <input type="number" value={form.display_order} onChange={(e) => setForm(p => ({...p, display_order: Number(e.target.value)}))} className={inputCls} dir="ltr" /></div>
          </div>
          <div><label className="text-xs font-medium mb-1 block">البريد الإلكتروني</label>
            <input type="email" value={form.email ?? ""} onChange={(e) => setForm(p => ({...p, email: e.target.value}))} className={inputCls} dir="ltr" /></div>
          <div><label className="text-xs font-medium mb-1 block">LinkedIn URL</label>
            <input type="url" value={form.linkedin_url ?? ""} onChange={(e) => setForm(p => ({...p, linkedin_url: e.target.value}))} className={inputCls} dir="ltr" /></div>
          <label className="flex items-center gap-2 cursor-pointer text-sm">
            <input type="checkbox" checked={form.is_active} onChange={(e) => setForm(p => ({...p, is_active: e.target.checked}))} className="w-4 h-4 rounded" />
            نشط على الموقع
          </label>
        </div>
        <div className="sticky bottom-0 bg-card border-t border-border px-6 py-4 flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 rounded-xl border border-border text-sm hover:bg-muted">إلغاء</button>
          <button onClick={save} disabled={saving}
            className="px-5 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-semibold disabled:opacity-60">
            {saving ? "جاري الحفظ..." : "حفظ"}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

export default function AdminTeamPage(): React.ReactElement {
  const [members, setMembers] = useState<TeamMemberRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [editTarget, setEditTarget] = useState<Partial<TeamMemberRow> | null | undefined>(undefined);

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase.from("team_members").select("*").order("display_order");
    setMembers((data ?? []) as TeamMemberRow[]);
    setLoading(false);
  }, []);

  useEffect(() => { void load(); }, [load]);

  async function toggleActive(m: TeamMemberRow): Promise<void> {
    await supabase.from("team_members").update({ is_active: !m.is_active }).eq("id", m.id);
    void load();
  }

  async function deleteMember(m: TeamMemberRow): Promise<void> {
    if (!confirm(`حذف "${m.full_name_ar}"؟`)) return;
    await supabase.from("team_members").delete().eq("id", m.id);
    void load();
  }

  const ROLE_LABEL: Record<TeamMemberRow["role"], string> = {
    board: "مجلس الإدارة", management: "إدارة تنفيذية", advisor: "مستشار", staff: "كادر", member: "عضو"
  };

  return (
    <div dir="rtl">
      {editTarget !== undefined && <TeamForm member={editTarget} onSave={load} onClose={() => setEditTarget(undefined)} />}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-xl font-bold">فريق العمل</h1>
          <p className="text-muted-foreground text-sm">{members.length} عضو</p>
        </div>
        <div className="flex gap-2">
          <button onClick={load} className="p-2.5 rounded-xl border border-border hover:bg-muted text-muted-foreground"><RefreshCw size={15} /></button>
          <button onClick={() => setEditTarget(null)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary-dark transition-colors">
            <Plus size={15} /> إضافة عضو
          </button>
        </div>
      </div>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? Array.from({ length: 6 }).map((_, i) => <div key={i} className="h-40 shimmer rounded-2xl" />) :
          members.map((m) => (
            <div key={m.id} className={`p-5 rounded-2xl border bg-card transition-all ${m.is_active ? "border-border" : "border-dashed opacity-60"}`}>
              <div className="flex items-start justify-between mb-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary font-bold">
                  {(m.full_name_ar || "")[0] || "?"}
                </div>
                <div className="flex gap-1">
                  <button onClick={() => toggleActive(m)} className={`p-1.5 rounded-lg hover:bg-muted transition-colors ${m.is_active ? "text-emerald-600" : "text-muted-foreground"}`}>
                    {m.is_active ? <Eye size={14} /> : <EyeOff size={14} />}
                  </button>
                  <button onClick={() => setEditTarget(m)} className="p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-primary">
                    <Edit2 size={14} />
                  </button>
                  <button onClick={() => deleteMember(m)} className="p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-destructive">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
              <p className="font-semibold text-sm">{m.full_name_ar}</p>
              <p className="text-xs text-muted-foreground mb-2">{m.title_ar}</p>
              <span className="inline-flex px-2 py-0.5 rounded-full text-[10px] font-medium bg-muted text-muted-foreground">
                {ROLE_LABEL[m.role]}
              </span>
            </div>
          ))
        }
      </div>
    </div>
  );
}
