/**
 * AdminStatsPage.tsx
 * -------------------
 * Manage impact_stats table — edit values displayed on HomePage.
 */

import React, { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabaseClient";
import type { ImpactStatRow } from "@/types/database.types";
import { Save, RefreshCw } from "lucide-react";

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
    setTimeout(() => setSaved(null), 2000);
  }

  function update(id: string, key: keyof ImpactStatRow, value: unknown): void {
    setStats((prev) => prev.map((s) => s.id === id ? { ...s, [key]: value } : s));
  }

  const inputCls = "w-full px-3 py-2 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary";

  return (
    <div dir="rtl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-xl font-bold">إحصاءات التأثير</h1>
          <p className="text-muted-foreground text-sm">تُعرض في الصفحة الرئيسية</p>
        </div>
        <button onClick={load} className="p-2.5 rounded-xl border border-border hover:bg-muted text-muted-foreground"><RefreshCw size={15} /></button>
      </div>

      {loading ? (
        <div className="grid sm:grid-cols-2 gap-4">
          {Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-40 shimmer rounded-2xl" />)}
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 gap-4">
          {stats.map((stat) => (
            <div key={stat.id} className="p-5 rounded-2xl border border-border bg-card space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono text-muted-foreground">{stat.stat_key}</span>
                <div className="flex items-center gap-2">
                  {saved === stat.id && <span className="text-xs text-emerald-600 font-medium">✓ محفوظ</span>}
                  <button onClick={() => saveStat(stat)} disabled={saving === stat.id}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-primary text-primary-foreground text-xs font-semibold disabled:opacity-60">
                    <Save size={12} />
                    {saving === stat.id ? "جاري..." : "حفظ"}
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
