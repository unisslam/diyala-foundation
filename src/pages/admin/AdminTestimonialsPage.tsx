/**
 * AdminTestimonialsPage.tsx
 * --------------------------
 * Management of public testimonials and feedback.
 * Features:
 *  • Status filter tabs (All, Pending, Approved, Rejected) with counters
 *  • Mobile-friendly card layout with full-touch action buttons
 *  • Search by author name or testimonial text
 *  • Non-blocking delete confirmation modal
 */

import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/lib/supabaseClient";
import type { TestimonialRow } from "@/types/database.types";
import {
  CheckCircle, XCircle, RefreshCw, Trash2, Star, Search,
  MessageSquareQuote, AlertTriangle
} from "lucide-react";

const STATUS_CFG: Record<"pending" | "approved" | "rejected", { label: string; cls: string }> = {
  pending:  { label: "قيد المراجعة", cls: "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300" },
  approved: { label: "معتمدة",        cls: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300" },
  rejected: { label: "مرفوضة",        cls: "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300" },
};

export default function AdminTestimonialsPage(): React.ReactElement {
  const [items, setItems]       = useState<TestimonialRow[]>([]);
  const [loading, setLoading]   = useState(true);
  const [statusFilter, setStatusFilter] = useState<"all" | "pending" | "approved" | "rejected">("all");
  const [search, setSearch]     = useState("");
  const [deleteTarget, setDeleteTarget] = useState<TestimonialRow | null>(null);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase.from("testimonials").select("*").order("created_at", { ascending: false });
    setItems((data ?? []) as TestimonialRow[]);
    setLoading(false);
  }, []);

  useEffect(() => { void load(); }, [load]);

  async function updateStatus(id: string, status: "approved" | "rejected"): Promise<void> {
    await supabase.from("testimonials").update({ status }).eq("id", id);
    setItems(prev => prev.map(item => item.id === id ? { ...item, status } : item));
  }

  async function confirmDelete(): Promise<void> {
    if (!deleteTarget) return;
    setDeleting(true);
    await supabase.from("testimonials").delete().eq("id", deleteTarget.id);
    setItems(prev => prev.filter(item => item.id !== deleteTarget.id));
    setDeleting(false);
    setDeleteTarget(null);
  }

  const filtered = items.filter((item) => {
    if (statusFilter !== "all" && item.status !== statusFilter) return false;
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      item.author_name_ar.toLowerCase().includes(q) ||
      (item.body_ar && item.body_ar.toLowerCase().includes(q)) ||
      (item.role_ar && item.role_ar.toLowerCase().includes(q))
    );
  });

  const pendingCount = items.filter(i => i.status === "pending").length;
  const approvedCount = items.filter(i => i.status === "approved").length;
  const rejectedCount = items.filter(i => i.status === "rejected").length;

  return (
    <div dir="rtl" className="space-y-6">
      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {deleteTarget && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4" dir="rtl">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-card rounded-3xl border border-border w-full max-w-md p-6 shadow-2xl space-y-4"
            >
              <div className="w-12 h-12 rounded-2xl bg-destructive/10 text-destructive flex items-center justify-center mx-auto">
                <AlertTriangle size={24} />
              </div>
              <div className="text-center space-y-1">
                <h3 className="font-display font-bold text-lg">تأكيد حذف الرأي أو الشهادة</h3>
                <p className="text-sm text-muted-foreground">
                  هل أنت متأكد من حذف شهادة <strong className="text-foreground">"{deleteTarget.author_name_ar}"</strong>؟
                </p>
              </div>
              <div className="flex items-center gap-3 pt-2">
                <button
                  onClick={() => setDeleteTarget(null)}
                  disabled={deleting}
                  className="flex-1 py-2.5 rounded-xl border border-border text-sm font-semibold hover:bg-muted"
                >
                  إلغاء
                </button>
                <button
                  onClick={() => void confirmDelete()}
                  disabled={deleting}
                  className="flex-1 py-2.5 rounded-xl bg-destructive text-destructive-foreground text-sm font-semibold hover:bg-destructive/90 disabled:opacity-60"
                >
                  {deleting ? "جاري الحذف..." : "نعم، احذف"}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-xl sm:text-2xl font-black text-foreground flex items-center gap-2">
            <MessageSquareQuote className="text-primary" size={24} />
            الشهادات وآراء المستفيدين
          </h1>
          <p className="text-muted-foreground text-xs sm:text-sm mt-0.5">
            {items.length} شهادة مسجلة · <span className="text-amber-600 font-bold">{pendingCount} بانتظار الاعتماد</span>
          </p>
        </div>

        <button
          onClick={load}
          className="p-2.5 rounded-xl border border-border hover:bg-muted text-muted-foreground transition-colors self-start sm:self-auto"
          title="تحديث القائمة"
        >
          <RefreshCw size={16} />
        </button>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Status filter chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          <button
            onClick={() => setStatusFilter("all")}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors min-h-[36px] ${
              statusFilter === "all"
                ? "bg-primary text-primary-foreground shadow-xs"
                : "bg-muted/70 text-muted-foreground hover:bg-muted"
            }`}
          >
            الكل ({items.length})
          </button>
          <button
            onClick={() => setStatusFilter("pending")}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors min-h-[36px] ${
              statusFilter === "pending"
                ? "bg-amber-500 text-white shadow-xs"
                : "bg-muted/70 text-muted-foreground hover:bg-muted"
            }`}
          >
            قيد المراجعة ({pendingCount})
          </button>
          <button
            onClick={() => setStatusFilter("approved")}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors min-h-[36px] ${
              statusFilter === "approved"
                ? "bg-emerald-600 text-white shadow-xs"
                : "bg-muted/70 text-muted-foreground hover:bg-muted"
            }`}
          >
            معتمدة ({approvedCount})
          </button>
          <button
            onClick={() => setStatusFilter("rejected")}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors min-h-[36px] ${
              statusFilter === "rejected"
                ? "bg-destructive text-white shadow-xs"
                : "bg-muted/70 text-muted-foreground hover:bg-muted"
            }`}
          >
            مرفوضة ({rejectedCount})
          </button>
        </div>

        {/* Search */}
        <div className="relative w-full sm:max-w-xs">
          <Search size={14} className="absolute top-1/2 -translate-y-1/2 start-3.5 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="بحث في الشهادات..."
            className="w-full ps-9 pe-4 py-2 rounded-xl border border-border bg-card text-sm focus:outline-none focus:ring-2 focus:ring-primary shadow-2xs"
          />
        </div>
      </div>

      {/* Cards List */}
      <div className="space-y-3">
        {loading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-32 shimmer rounded-3xl border border-border/50" />
          ))
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 bg-card rounded-3xl border border-border text-muted-foreground text-sm">
            لا توجد شهادات مطابقة للفلتر الحالي
          </div>
        ) : (
          filtered.map((item) => {
            const cfg = STATUS_CFG[item.status] ?? STATUS_CFG.pending;
            return (
              <div
                key={item.id}
                className="p-5 rounded-3xl border border-border bg-card shadow-xs space-y-3 transition-all hover:border-primary/20"
              >
                {/* Card Header: Author, Rating, Status */}
                <div className="flex items-start justify-between flex-wrap gap-2">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-bold text-foreground text-sm sm:text-base">{item.author_name_ar}</h3>
                      {item.rating && (
                        <div className="flex items-center text-amber-500 gap-0.5">
                          {Array.from({ length: item.rating }).map((_, idx) => (
                            <Star key={idx} size={12} className="fill-amber-500" />
                          ))}
                        </div>
                      )}
                    </div>
                    {item.role_ar && (
                      <p className="text-xs text-muted-foreground mt-0.5 font-medium">{item.role_ar}</p>
                    )}
                  </div>

                  <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-semibold ${cfg.cls}`}>
                    {cfg.label}
                  </span>
                </div>

                {/* Body Quote */}
                <div className="bg-muted/30 p-3.5 rounded-2xl border border-border/40">
                  <p className="text-sm text-foreground leading-relaxed italic">
                    "{item.body_ar}"
                  </p>
                </div>

                {/* Footer Actions */}
                <div className="flex items-center justify-between pt-2 border-t border-border/60 flex-wrap gap-2">
                  <span className="text-[11px] text-muted-foreground">
                    {new Date(item.created_at).toLocaleDateString("ar-IQ")}
                  </span>

                  <div className="flex items-center gap-2 flex-wrap">
                    {item.status !== "approved" && (
                      <button
                        onClick={() => void updateStatus(item.id, "approved")}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 text-xs font-semibold hover:bg-emerald-200 transition-colors min-h-[36px]"
                      >
                        <CheckCircle size={14} />
                        قبول واعتماد
                      </button>
                    )}

                    {item.status !== "rejected" && (
                      <button
                        onClick={() => void updateStatus(item.id, "rejected")}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-300 text-xs font-semibold hover:bg-red-200 transition-colors min-h-[36px]"
                      >
                        <XCircle size={14} />
                        رفض
                      </button>
                    )}

                    <button
                      onClick={() => setDeleteTarget(item)}
                      className="p-2 rounded-xl text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors min-h-[36px] min-w-[36px] flex items-center justify-center"
                      title="حذف الشهادة"
                    >
                      <Trash2 size={16} />
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
