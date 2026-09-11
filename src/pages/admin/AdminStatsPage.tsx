/**
 * AdminStatsPage.tsx
 * -------------------
 * Manage impact_stats table — edit values displayed on HomePage.
 */

import React, { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabaseClient";
import type { ImpactStatRow } from "@/types/database.types";
import { Save, RefreshCw, TrendingUp } from "lucide-react";

export default function AdminStatsPage(): React.ReactElement {
  const [stats, setStats]   = useState<ImpactStatRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving]   = useState<string | null>(null);
  const [saved, setSaved]     = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase.from("impact_stats").select("*").order("display_order");
    setStats((data ?? []) as ImpactStatRow[]);
    setLoading(false);
  }, []);

  useEffect(() => { void load(); }, [load]);

  async function saveStat(stat: ImpactStatRow): Promise<void> {
    setSaving(stat.id);
    await supabase.from("impact_stats").update({
      value_number: stat.value_number,
      label_ar: stat.label_ar,
      label_en: stat.label_en,
      icon_name: stat.icon_name,
      display_order: stat.display_order,
    }).eq("id", stat.id);
    setSaving(null);
    setSaved(stat.id);
    setTimeout(() => setSaved(null), 2500);
  }

  function update(id: string, key: keyof ImpactStatRow, value: unknown): void {
    setStats((prev) => prev.map((s) => s.id === id ? { ...s, [key]: value } : s));
  }

  const inputCls = "w-full px-3 py-2.5 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary";

  return (
    <div dir="rtl" className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-xl sm:text-2xl font-black text-foreground flex items-center gap-2">
            <TrendingUp className="text-primary" size={24} />
            إحصاءات التأثير والإنجاز
          </h1>
          <p className="text-muted-foreground text-xs sm:text-sm mt-0.5">
            القيم الرقمية المعروضة في شريط الأثر بالصفحة الرئيسية للمنصة
          </p>
        </div>
        <button
          onClick={load}
          className="p-2.5 rounded-xl border border-border hover:bg-muted text-muted-foreground transition-colors self-start sm:self-auto"
          title="تحديث البيانات"
        >
          <RefreshCw size={16} />
        </button>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-44 shimmer rounded-3xl" />)}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {stats.map((stat) => (
            <div key={stat.id} className="p-5 rounded-3xl border border-border bg-card space-y-3.5 shadow-xs">
              <div className="flex items-center justify-between border-b border-border/50 pb-2.5">
                <span className="text-xs font-mono font-bold text-muted-foreground">{stat.stat_key}</span>
                <div className="flex items-center gap-2">
                  {saved === stat.id && <span className="text-xs text-emerald-600 font-bold">✓ تم الحفظ</span>}
                  <button
                    onClick={() => void saveStat(stat)}
                    disabled={saving === stat.id}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-semibold disabled:opacity-60 min-h-[36px] hover:bg-primary-dark transition-colors"
                  >
                    <Save size={13} />
                    {saving === stat.id ? "جاري..." : "حفظ التعديل"}
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-medium text-muted-foreground block mb-1">القيمة الرقمية</label>
                  <input type="number" value={stat.value_number}
                    onChange={(e) => update(stat.id, "value_number", Number(e.target.value))}
                    className={inputCls} dir="ltr" />
                </div>
                <div>
                  <label className="text-[11px] font-medium text-muted-foreground block mb-1">الترتيب</label>
                  <input type="number" value={stat.display_order}
                    onChange={(e) => update(stat.id, "display_order", Number(e.target.value))}
                    className={inputCls} dir="ltr" />
                </div>
              </div>
              <div>
                <label className="text-[11px] font-medium text-muted-foreground block mb-1">التسمية بالعربية</label>
                <input value={stat.label_ar} onChange={(e) => update(stat.id, "label_ar", e.target.value)} className={inputCls} dir="rtl" />
              </div>
              <div>
                <label className="text-[11px] font-medium text-muted-foreground block mb-1">Label in English</label>
                <input value={stat.label_en} onChange={(e) => update(stat.id, "label_en", e.target.value)} className={inputCls} dir="ltr" />
              </div>
              <div>
                <label className="text-[11px] font-medium text-muted-foreground block mb-1">اسم الأيقونة (Lucide)</label>
                <input value={stat.icon_name} onChange={(e) => update(stat.id, "icon_name", e.target.value)}
                  className={inputCls} dir="ltr" placeholder="users, checkCircle, globe2..." />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
