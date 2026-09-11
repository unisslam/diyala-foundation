/**
 * DeleteApplicationModal.tsx
 * --------------------------
 * Safe double-confirmation dialog for deleting membership applications.
 * Handles cascading actions if the applicant is already approved in /admin/team.
 */

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Trash2, AlertTriangle, X, ShieldAlert } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import type { MembershipApplicationRow } from "@/types/database.types";

interface DeleteApplicationModalProps {
  app: MembershipApplicationRow;
  onClose: () => void;
  onDeleted: (appId: string) => void;
}

export default function DeleteApplicationModal({
  app,
  onClose,
  onDeleted,
}: DeleteApplicationModalProps): React.ReactElement {
  const [isLinkedToTeam, setIsLinkedToTeam] = useState(false);
  const [teamMemberName, setTeamMemberName] = useState<string | null>(null);
  const [deleteOption, setDeleteOption] = useState<"app_only" | "both">("app_only");
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    async function checkLink() {
      setLoading(true);
      const { data } = await supabase
        .from("team_members")
        .select("id, full_name_ar")
        .eq("membership_application_id", app.id)
        .maybeSingle();

      if (data) {
        setIsLinkedToTeam(true);
        setTeamMemberName(data.full_name_ar);
      }
      setLoading(false);
    }
    void checkLink();
  }, [app.id]);

  async function handleDelete() {
    setDeleting(true);
    setErrorMsg(null);

    try {
      if (isLinkedToTeam && deleteOption === "both") {
        // Delete associated team member as well
        await supabase.from("team_members").delete().eq("membership_application_id", app.id);
      }

      // Delete application
      const { error } = await supabase.from("membership_applications").delete().eq("id", app.id);

      if (error) {
        setErrorMsg(`فشل حذف الطلب: ${error.message}`);
        setDeleting(false);
        return;
      }

      onDeleted(app.id);
      onClose();
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : "حدث خطأ غير متوقع أثناء الحذف.");
      setDeleting(false);
    }
  }

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
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-card rounded-3xl border border-border w-full max-w-md p-6 shadow-2xl overflow-hidden"
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-destructive/10 text-destructive flex items-center justify-center">
              <Trash2 size={20} />
            </div>
            <div>
              <h3 className="font-display font-bold text-base text-foreground">حذف طلب العضوية</h3>
              <p className="text-xs text-muted-foreground font-mono" dir="ltr">{app.application_number ?? "—"}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-muted text-muted-foreground transition-colors">
            <X size={16} />
          </button>
        </div>

        {errorMsg && (
          <div className="mb-4 p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-xs flex items-center gap-2">
            <AlertTriangle size={14} className="shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <div className="space-y-4">
          <div className="p-3.5 bg-muted/40 rounded-2xl border border-border/50">
            <p className="text-xs text-muted-foreground mb-1">المتقدم بالطلب:</p>
            <p className="font-bold text-sm text-foreground">{app.full_name_ar}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{app.email} · {app.phone_primary}</p>
          </div>

          {loading ? (
            <div className="py-4 text-center text-xs text-muted-foreground animate-pulse">
              جاري فحص السجلات المرتبطة...
            </div>
          ) : isLinkedToTeam ? (
            <div className="space-y-3">
              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-400 text-xs flex items-start gap-2">
                <ShieldAlert size={16} className="shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold mb-0.5">تنبيه: هذا العضو مسجل في فريق العمل!</p>
                  <p>تمت الموافقة على هذا الطلب مسبقاً وتوجد بطاقة للعضو باسم <strong>"{teamMemberName}"</strong> في صفحة الفريق.</p>
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-xs font-semibold text-foreground">حدد الإجراء المطلوب:</p>
                
                <label className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                  deleteOption === "app_only" ? "border-primary bg-primary/5" : "border-border hover:bg-muted/40"
                }`}>
                  <input
                    type="radio"
                    name="del_opt"
                    checked={deleteOption === "app_only"}
                    onChange={() => setDeleteOption("app_only")}
                    className="mt-0.5 text-primary focus:ring-primary"
                  />
                  <div>
                    <p className="text-xs font-bold text-foreground">حذف طلب العضوية فقط</p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      يتم حذف استمارة الطلب، مع الإبقاء على سجل العضو في صفحة الفريق كعضو مستقل.
                    </p>
                  </div>
                </label>

                <label className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                  deleteOption === "both" ? "border-destructive bg-destructive/5" : "border-border hover:bg-muted/40"
                }`}>
                  <input
                    type="radio"
                    name="del_opt"
                    checked={deleteOption === "both"}
                    onChange={() => setDeleteOption("both")}
                    className="mt-0.5 text-destructive focus:ring-destructive"
                  />
                  <div>
                    <p className="text-xs font-bold text-destructive">حذف الطلب وسجل العضو من الفريق معاً</p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      إزالة استمارة الطلب وحذف بطاقة العضو من قائمة فريق العمل نهائياً.
                    </p>
                  </div>
                </label>
              </div>
            </div>
          ) : (
            <p className="text-xs text-muted-foreground leading-relaxed">
              هل أنت متأكد من رغبتك في حذف هذا الطلب نهائياً؟ لن يمكن استرجاع بيانات هذه الاستمارة بعد الحذف.
            </p>
          )}

          {/* Action Buttons */}
          <div className="flex items-center gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={deleting}
              className="flex-1 py-2.5 rounded-xl border border-border text-sm hover:bg-muted font-medium transition-colors"
            >
              إلغاء
            </button>
            <button
              type="button"
              onClick={handleDelete}
              disabled={deleting}
              className="flex-1 py-2.5 rounded-xl bg-destructive text-destructive-foreground text-sm font-bold hover:bg-destructive/90 transition-all flex items-center justify-center gap-2 shadow-sm"
            >
              {deleting ? (
                <span>جاري الحذف...</span>
              ) : (
                <>
                  <Trash2 size={14} /> تأكيد الحذف
                </>
              )}
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
