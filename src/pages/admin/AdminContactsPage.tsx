/**
 * AdminContactsPage.tsx
 * ----------------------
 * Manage contact_messages and volunteer_applications.
 * Features: Tabbed view, status badge, detail panel, status update.
 */

import React, { useState, useEffect, useCallback } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { MessageSquare, Heart, Search, X, Eye, CheckCircle, Clock, Archive, ChevronRight, RefreshCw } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import type { ContactMessageRow, ContactStatus, VolunteerApplicationRow } from "@/types/database.types";

const MSG_STATUS_CFG: Record<ContactStatus, { label: string; cls: string }> = {
  new:      { label: "جديدة",     cls: "bg-amber-100 text-amber-700" },
  read:     { label: "مقروءة",    cls: "bg-blue-100 text-blue-700" },
  replied:  { label: "تم الرد",   cls: "bg-emerald-100 text-emerald-700" },
  archived: { label: "مؤرشفة",    cls: "bg-slate-100 text-slate-600" },
};

function MessageRow({ msg, onClick }: { msg: ContactMessageRow; onClick: () => void }): React.ReactElement {
  const cfg = MSG_STATUS_CFG[msg.status];
  return (
    <tr className="hover:bg-muted/30 transition-colors cursor-pointer" onClick={onClick}>
      <td className="px-4 py-3 text-sm">
        <p className="font-medium">{msg.full_name}</p>
        <p className="text-xs text-muted-foreground">{msg.email}</p>
      </td>
      <td className="px-4 py-3 text-sm">{msg.subject}</td>
      <td className="px-4 py-3 text-sm">
        <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-semibold ${cfg.cls}`}>{cfg.label}</span>
      </td>
      <td className="px-4 py-3 text-xs text-muted-foreground">{new Date(msg.created_at).toLocaleDateString("ar-IQ")}</td>
      <td className="px-4 py-3"><ChevronRight size={14} className="text-muted-foreground rtl:rotate-180" /></td>
    </tr>
  );
}

function MessageDetail({ msg, onClose, onStatusChange }: {
  msg: ContactMessageRow; onClose: () => void;
  onStatusChange: (id: string, s: ContactStatus) => Promise<void>;
}): React.ReactElement {
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-end" dir="rtl">
      <motion.div initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
        transition={{ type: "spring", damping: 25 }}
        className="h-full w-full max-w-md bg-card border-s border-border overflow-y-auto p-6 space-y-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display font-bold">رسالة تواصل</h2>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-muted"><X size={16} /></button>
        </div>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div><p className="text-xs text-muted-foreground">الاسم</p><p className="font-medium">{msg.full_name}</p></div>
            <div><p className="text-xs text-muted-foreground">البريد</p><p dir="ltr" className="text-xs">{msg.email}</p></div>
            <div><p className="text-xs text-muted-foreground">الهاتف</p><p dir="ltr">{msg.phone ?? "—"}</p></div>
            <div><p className="text-xs text-muted-foreground">التاريخ</p><p>{new Date(msg.created_at).toLocaleDateString("ar-IQ")}</p></div>
          </div>
          <div className="bg-muted/30 rounded-2xl p-4">
            <p className="text-xs text-muted-foreground mb-1">الموضوع: {msg.subject}</p>
            <p className="text-sm leading-relaxed">{msg.message}</p>
          </div>
          <div className="flex gap-2 flex-wrap pt-2">
            {(["read","replied","archived"] as ContactStatus[]).map((s) => (
              <button key={s} onClick={() => onStatusChange(msg.id, s)} disabled={msg.status === s}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors disabled:opacity-50 ${MSG_STATUS_CFG[s].cls} border-current`}>
                {s === "read" ? <Eye size={11} /> : s === "replied" ? <CheckCircle size={11} /> : <Archive size={11} />}
                {MSG_STATUS_CFG[s].label}
              </button>
            ))}
          </div>
        </div>
      </motion.div>
    </div>
  );
}

export default function AdminContactsPage(): React.ReactElement {
  const [tab, setTab]             = useState<"messages" | "volunteers">("messages");
  const [messages, setMessages]   = useState<ContactMessageRow[]>([]);
  const [volunteers, setVolunteers] = useState<VolunteerApplicationRow[]>([]);
  const [loading, setLoading]     = useState(true);
  const [search, setSearch]       = useState("");
  const [selected, setSelected]   = useState<ContactMessageRow | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const [{ data: msgs }, { data: vols }] = await Promise.all([
      supabase.from("contact_messages").select("*").order("created_at", { ascending: false }),
      supabase.from("volunteer_applications").select("*").order("created_at", { ascending: false }),
    ]);
    setMessages((msgs ?? []) as ContactMessageRow[]);
    setVolunteers((vols ?? []) as VolunteerApplicationRow[]);
    setLoading(false);
  }, []);

  useEffect(() => { void load(); }, [load]);

  async function updateMsgStatus(id: string, status: ContactStatus): Promise<void> {
    await supabase.from("contact_messages").update({ status }).eq("id", id);
    setSelected((p) => p?.id === id ? { ...p, status } : p);
    void load();
  }

  const filteredMsgs = messages.filter((m) =>
    !search.trim() || m.full_name.toLowerCase().includes(search.toLowerCase()) || m.email.toLowerCase().includes(search.toLowerCase())
  );

  const thCls = "px-4 py-3 text-start text-xs font-semibold text-muted-foreground uppercase tracking-wide";

  return (
    <div dir="rtl">
      <AnimatePresence>
        {selected && <MessageDetail msg={selected} onClose={() => setSelected(null)} onStatusChange={updateMsgStatus} />}
      </AnimatePresence>

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-xl font-bold">الرسائل والطلبات</h1>
          <p className="text-sm text-muted-foreground">{messages.length} رسالة | {volunteers.length} طلب تطوع</p>
        </div>
        <button onClick={load} className="p-2.5 rounded-xl border border-border hover:bg-muted text-muted-foreground" title="تحديث">
          <RefreshCw size={15} />
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 rounded-2xl bg-muted mb-5 max-w-xs">
        {(["messages","volunteers"] as const).map((t) => (
          <button key={t} onClick={() => setTab(t)}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-semibold transition-all ${
              tab === t ? "bg-card shadow-sm text-foreground" : "text-muted-foreground"
            }`}>
            {t === "messages" ? <MessageSquare size={12} /> : <Heart size={12} />}
            {t === "messages" ? "رسائل التواصل" : "طلبات التطوع"}
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="relative mb-4 max-w-xs">
        <Search size={13} className="absolute top-1/2 -translate-y-1/2 start-3 text-muted-foreground" />
        <input value={search} onChange={(e) => setSearch(e.target.value)}
          placeholder="بحث..." className="w-full ps-8 pe-4 py-2 rounded-xl border border-border bg-card text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
      </div>

      {/* Messages table */}
      {tab === "messages" && (
        <div className="rounded-2xl border border-border bg-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[600px]">
              <thead className="border-b border-border bg-muted/40">
                <tr>
                  <th className={thCls}>المرسل</th>
                  <th className={thCls}>الموضوع</th>
                  <th className={thCls}>الحالة</th>
                  <th className={thCls}>التاريخ</th>
                  <th className={thCls}></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {loading ? Array.from({ length: 4 }).map((_, i) => (
                  <tr key={i}><td colSpan={5} className="p-4"><div className="h-8 shimmer rounded-lg" /></td></tr>
                )) : filteredMsgs.map((m) => (
                  <MessageRow key={m.id} msg={m} onClick={() => setSelected(m)} />
                ))}
              </tbody>
            </table>
          </div>
          {!loading && filteredMsgs.length === 0 && (
            <div className="text-center py-12 text-muted-foreground text-sm">لا توجد رسائل مطابقة</div>
          )}
        </div>
      )}

      {/* Volunteers table */}
      {tab === "volunteers" && (
        <div className="rounded-2xl border border-border bg-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[600px]">
              <thead className="border-b border-border bg-muted/40">
                <tr>
                  <th className={thCls}>المتطوع</th>
                  <th className={thCls}>المدينة</th>
                  <th className={thCls}>المهارات</th>
                  <th className={thCls}>التفرغ</th>
                  <th className={thCls}>التاريخ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {loading ? Array.from({ length: 4 }).map((_, i) => (
                  <tr key={i}><td colSpan={5} className="p-4"><div className="h-8 shimmer rounded-lg" /></td></tr>
                )) : volunteers.filter((v) => !search.trim() || v.full_name.toLowerCase().includes(search.toLowerCase()) || v.email.toLowerCase().includes(search.toLowerCase()))
                  .map((v) => (
                  <tr key={v.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3 text-sm"><p className="font-medium">{v.full_name}</p><p className="text-xs text-muted-foreground">{v.email}</p></td>
                    <td className="px-4 py-3 text-sm">{v.city}</td>
                    <td className="px-4 py-3 text-xs text-muted-foreground max-w-[160px] truncate">{v.skills ?? "—"}</td>
                    <td className="px-4 py-3 text-xs">{v.availability ?? "—"}</td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">{new Date(v.created_at).toLocaleDateString("ar-IQ")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {!loading && volunteers.length === 0 && (
            <div className="text-center py-12 text-muted-foreground text-sm">لا توجد طلبات تطوع بعد</div>
          )}
        </div>
      )}
    </div>
  );
}
