/**
 * MemberActivitiesModal.tsx
 * -------------------------
 * Tracks workshops, training sessions, task assignments, and tenure for a team member.
 */

import React, { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import {
  X, Plus, Calendar, Award, CheckCircle, Briefcase,
  Trash2, Sparkles, BookOpen
} from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import type { TeamMemberRow, MemberActivityRow, ActivityType } from "@/types/database.types";

interface MemberActivitiesModalProps {
  member: TeamMemberRow;
  onClose: () => void;
  onUpdate: () => void;
}

const ACTIVITY_TYPE_CFG: Record<ActivityType, { label: string; icon: React.ElementType; color: string }> = {
  workshop:     { label: "ورشة تدريبية",  icon: BookOpen,   color: "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300" },
  task:         { label: "مهمة ميدانية",   icon: Briefcase,  color: "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300" },
  event:        { label: "فعالية / مؤتمر", icon: Calendar,   color: "bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300" },
  commendation: { label: "تكريم وشكر",    icon: Award,      color: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300" },
  meeting:      { label: "اجتماع تنظيمي", icon: CheckCircle,color: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300" },
};

export default function MemberActivitiesModal({
  member,
  onClose,
  onUpdate,
}: MemberActivitiesModalProps): React.ReactElement {
  const [activities, setActivities] = useState<MemberActivityRow[]>([]);
  const [loading, setLoading]       = useState(true);
  const [showAdd, setShowAdd]       = useState(false);
  const [saving, setSaving]         = useState(false);

  // New activity form state
  const [activityType, setActivityType] = useState<ActivityType>("workshop");
  const [title, setTitle]               = useState("");
  const [description, setDescription]   = useState("");
  const [activityDate, setActivityDate] = useState(new Date().toISOString().split("T")[0]);
  const [hoursSpent, setHoursSpent]     = useState(2);
  const [status, setStatus]             = useState<"completed" | "in_progress" | "planned">("completed");

  const loadActivities = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from("member_activities")
      .select("*")
      .eq("team_member_id", member.id)
      .order("activity_date", { ascending: false });

    setActivities((data ?? []) as MemberActivityRow[]);
    setLoading(false);
  }, [member.id]);

  useEffect(() => {
    void loadActivities();
  }, [loadActivities]);

  async function handleAddActivity(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;

    setSaving(true);
    const { error } = await supabase.from("member_activities").insert({
      team_member_id: member.id,
      activity_type: activityType,
      title: title.trim(),
      description: description.trim() || null,
      activity_date: activityDate,
      hours_spent: Number(hoursSpent) || 0,
      status,
    });

    if (!error) {
      // Award activity score to member
      const newScore = (member.activity_score ?? 100) + 10;
      await supabase.from("team_members").update({ activity_score: newScore }).eq("id", member.id);
      setTitle("");
      setDescription("");
      setShowAdd(false);
      void loadActivities();
      onUpdate();
    }
    setSaving(false);
  }

  async function handleDeleteActivity(id: string) {
    if (!confirm("هل أنت متأكد من حذف هذا النشاط؟")) return;
    await supabase.from("member_activities").delete().eq("id", id);
    void loadActivities();
    onUpdate();
  }

  const totalHours = activities.reduce((sum, a) => sum + (Number(a.hours_spent) || 0), 0);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4"
      dir="rtl"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-card rounded-3xl border border-border w-full max-w-xl p-6 shadow-2xl max-h-[90vh] flex flex-col justify-between"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border pb-3 mb-4 shrink-0">
          <div>
            <h3 className="font-display font-bold text-base text-foreground flex items-center gap-2">
              <Sparkles size={16} className="text-primary" />
              سجل الأنشطة، الورش والمهام — {member.full_name_ar}
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              إجمالي الساعات المسجلة: <strong className="text-primary">{totalHours} ساعة</strong> · عدد الأنشطة: <strong>{activities.length}</strong>
            </p>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-muted text-muted-foreground">
            <X size={16} />
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto space-y-4 pe-1">
          {/* Add Activity Button / Form */}
          {!showAdd ? (
            <button
              onClick={() => setShowAdd(true)}
              className="w-full py-2.5 px-4 rounded-2xl border border-dashed border-primary/40 hover:border-primary text-primary bg-primary/5 hover:bg-primary/10 text-xs font-bold transition-all flex items-center justify-center gap-2"
            >
              <Plus size={15} /> تسجيل نشاط أو ورشة جديدة للعضو
            </button>
          ) : (
            <form onSubmit={handleAddActivity} className="p-4 rounded-2xl border border-border bg-muted/30 space-y-3">
              <div className="flex items-center justify-between border-b border-border/50 pb-2">
                <span className="text-xs font-bold text-foreground">بيانات النشاط الجديد</span>
                <button
                  type="button"
                  onClick={() => setShowAdd(false)}
                  className="text-muted-foreground hover:text-foreground text-xs"
                >
                  إلغاء
                </button>
              </div>

              <div className="grid sm:grid-cols-2 gap-2.5">
                <div>
                  <label className="text-[11px] font-semibold mb-1 block">نوع النشاط</label>
                  <select
                    value={activityType}
                    onChange={(e) => setActivityType(e.target.value as ActivityType)}
                    className="w-full px-3 py-1.5 rounded-xl border border-border bg-background text-xs focus:outline-none focus:ring-2 focus:ring-primary font-medium"
                  >
                    {Object.entries(ACTIVITY_TYPE_CFG).map(([k, v]) => (
                      <option key={k} value={k}>{v.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-semibold mb-1 block">تاريخ النشاط</label>
                  <input
                    type="date"
                    value={activityDate}
                    onChange={(e) => setActivityDate(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-xl border border-border bg-background text-xs focus:outline-none focus:ring-2 focus:ring-primary"
                    dir="ltr"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-semibold mb-1 block">عنوان الورشة / المهمة</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="مثال: ورشة إدارة الموارد المائية ومكافحة الجفاف"
                  className="w-full px-3 py-1.5 rounded-xl border border-border bg-background text-xs focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div className="grid sm:grid-cols-2 gap-2.5">
                <div>
                  <label className="text-[11px] font-semibold mb-1 block">الساعات المنجزة</label>
                  <input
                    type="number"
                    min={0}
                    step={0.5}
                    value={hoursSpent}
                    onChange={(e) => setHoursSpent(Number(e.target.value))}
                    className="w-full px-3 py-1.5 rounded-xl border border-border bg-background text-xs focus:outline-none focus:ring-2 focus:ring-primary"
                    dir="ltr"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-semibold mb-1 block">حالة الإنجاز</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as "completed" | "in_progress" | "planned")}
                    className="w-full px-3 py-1.5 rounded-xl border border-border bg-background text-xs focus:outline-none focus:ring-2 focus:ring-primary font-medium"
                  >
                    <option value="completed">مكتمل بنجاح</option>
                    <option value="in_progress">قيد التنفيذ</option>
                    <option value="planned">مخطط له</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-[11px] font-semibold mb-1 block">ملاحظات أو توصيات إضافية</label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="ملاحظات حول أداء العضو وتفاعله..."
                  className="w-full px-3 py-1.5 rounded-xl border border-border bg-background text-xs resize-none focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <button
                type="submit"
                disabled={saving}
                className="w-full py-2 rounded-xl bg-primary text-primary-foreground text-xs font-bold disabled:opacity-50"
              >
                {saving ? "جاري الحفظ..." : "حفظ النشاط"}
              </button>
            </form>
          )}

          {/* Activities List */}
          {loading ? (
            <div className="space-y-2 py-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-16 shimmer rounded-xl" />
              ))}
            </div>
          ) : activities.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground text-xs">
              <Calendar size={32} className="mx-auto mb-2 opacity-25" />
              لا توجد أنشطة أو ورش مسجلة لهذا العضو بعد.
            </div>
          ) : (
            <div className="space-y-2.5">
              {activities.map((act) => {
                const cfg = ACTIVITY_TYPE_CFG[act.activity_type] ?? ACTIVITY_TYPE_CFG.workshop;
                const Icon = cfg.icon;
                return (
                  <div
                    key={act.id}
                    className="p-3 rounded-2xl border border-border bg-muted/20 hover:bg-muted/40 transition-colors flex items-start justify-between gap-3"
                  >
                    <div className="flex items-start gap-2.5 min-w-0">
                      <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${cfg.color}`}>
                        <Icon size={15} />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-bold text-xs text-foreground truncate">{act.title}</p>
                          <span className={`text-[9.5px] font-bold px-2 py-0.5 rounded-md ${cfg.color}`}>
                            {cfg.label}
                          </span>
                        </div>
                        {act.description && (
                          <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-2">{act.description}</p>
                        )}
                        <div className="flex items-center gap-3 text-[10px] text-muted-foreground mt-1 font-medium">
                          <span>📅 {new Date(act.activity_date).toLocaleDateString("ar-IQ")}</span>
                          <span>⏱ {act.hours_spent} ساعة</span>
                          <span className={act.status === "completed" ? "text-emerald-600" : "text-amber-600"}>
                            {act.status === "completed" ? "مكتمل" : "قيد التنفيذ"}
                          </span>
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => handleDeleteActivity(act.id)}
                      className="p-1 text-muted-foreground hover:text-destructive transition-colors shrink-0"
                      title="حذف النشاط"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-border pt-3 mt-3 shrink-0 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl border border-border text-xs font-semibold hover:bg-muted"
          >
            إغلاق
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
