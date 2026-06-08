/**
 * AdminTestimonialsPage.tsx + AdminGalleryPage.tsx combined stubs
 * that handle their respective tables with approve/reject actions.
 */

import React, { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabaseClient";
import type { TestimonialRow } from "@/types/database.types";
import { CheckCircle, XCircle, RefreshCw, Trash2 } from "lucide-react";

const STATUS_CFG = {
  pending:  { label: "قيد المراجعة", cls: "bg-amber-100 text-amber-700" },
  approved: { label: "معتمدة",        cls: "bg-emerald-100 text-emerald-700" },
  rejected: { label: "مرفوضة",        cls: "bg-red-100 text-red-700" },
};

export default function AdminTestimonialsPage(): React.ReactElement {
  const [items, setItems]   = useState<TestimonialRow[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase.from("testimonials").select("*").order("created_at", { ascending: false });
    setItems((data ?? []) as TestimonialRow[]);
    setLoading(false);
  }, []);

  useEffect(() => { void load(); }, [load]);

  async function updateStatus(id: string, status: "approved" | "rejected"): Promise<void> {
    await supabase.from("testimonials").update({ status }).eq("id", id);
    void load();
  }

  async function deleteItem(id: string, name: string): Promise<void> {
    if (!confirm(`حذف شهادة "${name}"؟`)) return;
    await supabase.from("testimonials").delete().eq("id", id);
    void load();
  }

  return (
    <div dir="rtl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-xl font-bold">الشهادات والآراء</h1>
          <p className="text-muted-foreground text-sm">{items.length} شهادة</p>
        </div>
        <button onClick={load} className="p-2.5 rounded-xl border border-border hover:bg-muted text-muted-foreground"><RefreshCw size={15} /></button>
      </div>
      <div className="space-y-3">
        {loading ? Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-28 shimmer rounded-2xl" />) :
          items.map((item) => {
            const cfg = STATUS_CFG[item.status];
            return (
              <div key={item.id} className="p-5 rounded-2xl border border-border bg-card flex items-start gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <p className="font-semibold text-sm">{item.author_name_ar}</p>
                    <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-semibold ${cfg.cls}`}>{cfg.label}</span>
                    {item.rating && <span className="text-xs text-amber-500">{"★".repeat(item.rating)}</span>}
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed line-clamp-2">{item.body_ar}</p>
                  {item.role_ar && <p className="text-xs text-muted-foreground mt-1">{item.role_ar}</p>}
                </div>
                <div className="flex flex-col gap-1.5 shrink-0">
                  <button onClick={() => updateStatus(item.id, "approved")} disabled={item.status === "approved"}
                    className="p-2 rounded-xl hover:bg-muted disabled:opacity-40 text-emerald-600" title="قبول">
                    <CheckCircle size={16} />
                  </button>
                  <button onClick={() => updateStatus(item.id, "rejected")} disabled={item.status === "rejected"}
                    className="p-2 rounded-xl hover:bg-muted disabled:opacity-40 text-red-500" title="رفض">
                    <XCircle size={16} />
                  </button>
                  <button onClick={() => deleteItem(item.id, item.author_name_ar)}
                    className="p-2 rounded-xl hover:bg-muted text-muted-foreground hover:text-destructive" title="حذف">
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            );
          })}
        {!loading && items.length === 0 && (
          <div className="text-center py-16 text-muted-foreground text-sm">لا توجد شهادات بعد</div>
        )}
      </div>
    </div>
  );
}
