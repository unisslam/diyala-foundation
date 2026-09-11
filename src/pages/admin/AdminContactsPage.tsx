/**
 * AdminContactsPage.tsx
 * ----------------------
 * Manage contact_messages and volunteer_applications.
 * Features:
 *  • Dual-mode responsive layout (Smart Cards on mobile, DataTable on desktop)
 *  • Tabbed view (Messages vs Volunteers) with live counts
 *  • Direct one-touch action buttons (Call tel:, Email mailto:)
 *  • Mobile-friendly Message Detail sliding sheet
 *  • Toggleable volunteer application form switch
 */

import React, { useState, useEffect, useCallback } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  MessageSquare, Heart, Search, X, Eye, CheckCircle, Archive,
  RefreshCw, Settings2, Phone, Mail, Calendar, MapPin,
  Trash2
} from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import type { ContactMessageRow, ContactStatus, VolunteerApplicationRow } from "@/types/database.types";

const MSG_STATUS_CFG: Record<ContactStatus, { label: string; cls: string }> = {
  new:      { label: "جديدة",     cls: "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300" },
  read:     { label: "مقروءة",    cls: "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300" },
  replied:  { label: "تم الرد",   cls: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300" },
  archived: { label: "مؤرشفة",    cls: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400" },
};

// ── Message Detail Sheet ────────────────────────────────────────────
function MessageDetail({
  msg,
  onClose,
  onStatusChange,
  onDelete,
}: {
  msg: ContactMessageRow;
  onClose: () => void;
  onStatusChange: (id: string, s: ContactStatus) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}): React.ReactElement {
  const [confirmDelete, setConfirmDelete] = useState(false);

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-end" dir="rtl">
      <motion.div
        initial={{ opacity: 0, x: 50 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: 50 }}
        transition={{ type: "spring", damping: 25, stiffness: 200 }}
        className="h-full w-full max-w-md bg-card border-s border-border overflow-y-auto p-5 sm:p-6 space-y-5 shadow-2xl flex flex-col justify-between"
      >
        <div className="space-y-5">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-border pb-4">
            <div className="flex items-center gap-2">
              <MessageSquare size={18} className="text-primary" />
              <h2 className="font-display font-bold text-base">تفاصيل الرسالة</h2>
            </div>
            <button onClick={onClose} className="p-2 rounded-xl hover:bg-muted text-muted-foreground transition-colors">
              <X size={18} />
            </button>
          </div>

          {/* Sender Info Card */}
          <div className="bg-muted/40 rounded-2xl p-4 space-y-3 border border-border/60">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <span className="font-bold text-foreground text-sm">{msg.full_name}</span>
              <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-semibold ${MSG_STATUS_CFG[msg.status].cls}`}>
                {MSG_STATUS_CFG[msg.status].label}
              </span>
            </div>

            <div className="space-y-2 text-xs pt-1 border-t border-border/40">
              <a
                href={`mailto:${msg.email}`}
                className="flex items-center gap-2 text-primary hover:underline"
                dir="ltr"
              >
                <Mail size={13} />
                <span>{msg.email}</span>
              </a>

              {msg.phone && (
                <a
                  href={`tel:${msg.phone}`}
                  className="flex items-center gap-2 text-primary hover:underline font-mono"
                  dir="ltr"
                >
                  <Phone size={13} />
                  <span>{msg.phone}</span>
                </a>
              )}

              <div className="flex items-center gap-1.5 text-muted-foreground">
                <Calendar size={13} />
                <span>{new Date(msg.created_at).toLocaleDateString("ar-IQ", { dateStyle: "full" })}</span>
              </div>
            </div>
          </div>

          {/* Subject & Message Content */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold text-muted-foreground">الموضوع:</h4>
            <p className="font-semibold text-foreground text-sm bg-muted/20 p-3 rounded-xl border border-border/40">
              {msg.subject}
            </p>
          </div>

          <div className="space-y-2">
            <h4 className="text-xs font-bold text-muted-foreground">نص الرسالة:</h4>
            <div className="bg-muted/20 rounded-2xl p-4 border border-border/40">
              <p className="text-sm leading-relaxed whitespace-pre-wrap text-foreground">
                {msg.message}
              </p>
            </div>
          </div>

          {/* Status Change Controls */}
          <div className="space-y-2 pt-2">
            <h4 className="text-xs font-bold text-muted-foreground">تحديث حالة المعالجة:</h4>
            <div className="flex gap-2 flex-wrap">
              {(["read", "replied", "archived"] as ContactStatus[]).map((s) => (
                <button
                  key={s}
                  onClick={() => void onStatusChange(msg.id, s)}
                  disabled={msg.status === s}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border transition-all disabled:opacity-50 min-h-[38px] ${
                    MSG_STATUS_CFG[s].cls
                  } border-current/20 hover:scale-102`}
                >
                  {s === "read" ? <Eye size={13} /> : s === "replied" ? <CheckCircle size={13} /> : <Archive size={13} />}
                  {MSG_STATUS_CFG[s].label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="pt-4 border-t border-border flex items-center justify-between">
          {!confirmDelete ? (
            <button
              onClick={() => setConfirmDelete(true)}
              className="flex items-center gap-1.5 text-xs text-destructive hover:bg-destructive/10 px-3 py-2 rounded-xl transition-colors"
            >
              <Trash2 size={14} />
              حذف الرسالة
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <button
                onClick={() => void onDelete(msg.id)}
                className="px-3 py-1.5 rounded-xl bg-destructive text-destructive-foreground text-xs font-bold hover:bg-destructive/90"
              >
                تأكيد الحذف
              </button>
              <button
                onClick={() => setConfirmDelete(false)}
                className="px-3 py-1.5 rounded-xl border border-border text-xs"
              >
                إلغاء
              </button>
            </div>
          )}

          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl border border-border text-xs font-semibold hover:bg-muted"
          >
            إغلاق
          </button>
        </div>
      </motion.div>
    </div>
  );
}

// ── AdminContactsPage ───────────────────────────────────────────────
export default function AdminContactsPage(): React.ReactElement {
  const [tab, setTab]             = useState<"messages" | "volunteers">("messages");
  const [messages, setMessages]   = useState<ContactMessageRow[]>([]);
  const [volunteers, setVolunteers] = useState<VolunteerApplicationRow[]>([]);
  const [loading, setLoading]     = useState(true);
  const [search, setSearch]       = useState("");
  const [selected, setSelected]   = useState<ContactMessageRow | null>(null);
  const [isVolunteerActive, setIsVolunteerActive] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const [{ data: msgs }, { data: vols }, { data: settings }] = await Promise.all([
      supabase.from("contact_messages").select("*").order("created_at", { ascending: false }),
      supabase.from("volunteer_applications").select("*").order("created_at", { ascending: false }),
      supabase.from("app_settings").select("value").eq("id", "volunteer_form_active").maybeSingle()
    ]);
    setMessages((msgs ?? []) as ContactMessageRow[]);
    setVolunteers((vols ?? []) as VolunteerApplicationRow[]);
    if (settings) {
      setIsVolunteerActive(settings.value === true);
    }
    setLoading(false);
  }, []);

  useEffect(() => { void load(); }, [load]);

  async function updateMsgStatus(id: string, status: ContactStatus): Promise<void> {
    await supabase.from("contact_messages").update({ status }).eq("id", id);
    setSelected((p) => p?.id === id ? { ...p, status } : p);
    void load();
  }

  async function deleteMsg(id: string): Promise<void> {
    await supabase.from("contact_messages").delete().eq("id", id);
    setSelected(null);
    void load();
  }

  async function toggleVolunteerForm() {
    const newVal = !isVolunteerActive;
    setIsVolunteerActive(newVal);
    await supabase.from("app_settings").upsert({ id: "volunteer_form_active", value: newVal });
  }

  const filteredMsgs = messages.filter((m) =>
    !search.trim() ||
    m.full_name.toLowerCase().includes(search.toLowerCase()) ||
    m.email.toLowerCase().includes(search.toLowerCase()) ||
    m.subject.toLowerCase().includes(search.toLowerCase())
  );

  const filteredVols = volunteers.filter((v) =>
    !search.trim() ||
    v.full_name.toLowerCase().includes(search.toLowerCase()) ||
    v.email.toLowerCase().includes(search.toLowerCase()) ||
    (v.city && v.city.toLowerCase().includes(search.toLowerCase())) ||
    (v.skills && v.skills.toLowerCase().includes(search.toLowerCase()))
  );

  const newMessagesCount = messages.filter(m => m.status === "new").length;
  const thCls = "px-4 py-3 text-start text-xs font-semibold text-muted-foreground uppercase tracking-wide";
  const tdCls = "px-4 py-3.5 text-sm";

  return (
    <div dir="rtl" className="space-y-6">
      <AnimatePresence>
        {selected && (
          <MessageDetail
            msg={selected}
            onClose={() => setSelected(null)}
            onStatusChange={updateMsgStatus}
            onDelete={deleteMsg}
          />
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-xl sm:text-2xl font-black text-foreground flex items-center gap-2">
            <MessageSquare className="text-primary" size={24} />
            الرسائل وطلبات التطوع
          </h1>
          <p className="text-muted-foreground text-xs sm:text-sm mt-0.5">
            {messages.length} رسالة تواصل {newMessagesCount > 0 && <strong className="text-amber-600">({newMessagesCount} جديدة)</strong>} · {volunteers.length} طلب تطوع
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Volunteer Form Toggle Switch */}
          <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl border border-border bg-card shadow-2xs">
            <Settings2 size={15} className="text-muted-foreground shrink-0" />
            <span className="text-xs font-medium">استمارة التطوع:</span>
            <button
              onClick={toggleVolunteerForm}
              className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                isVolunteerActive ? "bg-emerald-500" : "bg-muted-foreground/30"
              }`}
              title={isVolunteerActive ? "تعطيل الاستمارة" : "تفعيل الاستمارة"}
            >
              <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${
                isVolunteerActive ? "translate-x-1" : "-translate-x-4"
              }`} />
            </button>
            <span className="text-xs text-muted-foreground font-semibold w-8">{isVolunteerActive ? "مفعلة" : "معطلة"}</span>
          </div>

          <button
            onClick={load}
            className="p-2.5 rounded-xl border border-border hover:bg-muted text-muted-foreground transition-colors"
            title="تحديث البيانات"
          >
            <RefreshCw size={15} />
          </button>
        </div>
      </div>

      {/* Tabs & Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Tab switch */}
        <div className="flex gap-1 p-1 rounded-2xl bg-muted/70 w-full sm:max-w-xs border border-border/40">
          <button
            onClick={() => setTab("messages")}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold transition-all min-h-[40px] ${
              tab === "messages" ? "bg-card shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <MessageSquare size={14} />
            <span>الرسائل ({messages.length})</span>
            {newMessagesCount > 0 && (
              <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0" />
            )}
          </button>

          <button
            onClick={() => setTab("volunteers")}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold transition-all min-h-[40px] ${
              tab === "volunteers" ? "bg-card shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Heart size={14} />
            <span>المتطوعون ({volunteers.length})</span>
          </button>
        </div>

        {/* Search */}
        <div className="relative w-full sm:max-w-xs">
          <Search size={14} className="absolute top-1/2 -translate-y-1/2 start-3.5 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={tab === "messages" ? "بحث في الرسائل..." : "بحث في المتطوعين..."}
            className="w-full ps-9 pe-4 py-2.5 rounded-xl border border-border bg-card text-sm focus:outline-none focus:ring-2 focus:ring-primary shadow-2xs"
          />
        </div>
      </div>

      {/* ── MESSAGES TAB ── */}
      {tab === "messages" && (
        <>
          {/* Mobile Messages Cards (< 768px) */}
          <div className="md:hidden space-y-3">
            {loading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-36 shimmer rounded-3xl border border-border/50" />
              ))
            ) : filteredMsgs.length === 0 ? (
              <div className="text-center py-12 bg-card rounded-3xl border border-border text-muted-foreground text-sm">
                لا توجد رسائل مطابقة للبحث
              </div>
            ) : (
              filteredMsgs.map((m) => {
                const cfg = MSG_STATUS_CFG[m.status];
                return (
                  <div
                    key={m.id}
                    onClick={() => setSelected(m)}
                    className="bg-card rounded-3xl border border-border p-4 shadow-xs space-y-2.5 cursor-pointer active:scale-99 transition-transform"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs">
                          {m.full_name.charAt(0)}
                        </div>
                        <h4 className="font-bold text-sm text-foreground">{m.full_name}</h4>
                      </div>
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold ${cfg.cls}`}>
                        {cfg.label}
                      </span>
                    </div>

                    <p className="font-semibold text-xs text-foreground line-clamp-1">{m.subject}</p>
                    <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">{m.message}</p>

                    <div className="flex items-center justify-between pt-2 border-t border-border/50 text-[11px] text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Calendar size={11} />
                        {new Date(m.created_at).toLocaleDateString("ar-IQ")}
                      </span>
                      <span className="text-primary font-semibold">عرض التفاصيل ←</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Desktop Messages Table (≥ 768px) */}
          <div className="hidden md:block rounded-3xl border border-border bg-card overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full">
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
                  {loading ? (
                    Array.from({ length: 4 }).map((_, i) => (
                      <tr key={i}><td colSpan={5} className="p-4"><div className="h-10 shimmer rounded-xl" /></td></tr>
                    ))
                  ) : filteredMsgs.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="text-center py-12 text-muted-foreground text-sm">
                        لا توجد رسائل مطابقة
                      </td>
                    </tr>
                  ) : (
                    filteredMsgs.map((m) => {
                      const cfg = MSG_STATUS_CFG[m.status];
                      return (
                        <tr
                          key={m.id}
                          className="hover:bg-muted/30 transition-colors cursor-pointer"
                          onClick={() => setSelected(m)}
                        >
                          <td className={tdCls}>
                            <p className="font-semibold text-foreground">{m.full_name}</p>
                            <p className="text-xs text-muted-foreground" dir="ltr">{m.email}</p>
                          </td>
                          <td className={tdCls}>
                            <p className="font-medium text-foreground max-w-xs truncate">{m.subject}</p>
                            <p className="text-xs text-muted-foreground max-w-sm truncate">{m.message}</p>
                          </td>
                          <td className={tdCls}>
                            <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-semibold ${cfg.cls}`}>
                              {cfg.label}
                            </span>
                          </td>
                          <td className={`${tdCls} text-xs text-muted-foreground whitespace-nowrap`}>
                            {new Date(m.created_at).toLocaleDateString("ar-IQ")}
                          </td>
                          <td className={tdCls}>
                            <span className="text-xs text-primary font-semibold hover:underline">
                              عرض
                            </span>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* ── VOLUNTEERS TAB ── */}
      {tab === "volunteers" && (
        <>
          {/* Mobile Volunteers Cards (< 768px) */}
          <div className="md:hidden space-y-3">
            {loading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-36 shimmer rounded-3xl border border-border/50" />
              ))
            ) : filteredVols.length === 0 ? (
              <div className="text-center py-12 bg-card rounded-3xl border border-border text-muted-foreground text-sm">
                لا توجد طلبات تطوع بعد
              </div>
            ) : (
              filteredVols.map((v) => (
                <div
                  key={v.id}
                  className="bg-card rounded-3xl border border-border p-4 shadow-xs space-y-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h4 className="font-bold text-sm text-foreground">{v.full_name}</h4>
                      {v.city && (
                        <span className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
                          <MapPin size={11} className="text-primary" />
                          {v.city}
                        </span>
                      )}
                    </div>
                    {v.availability && (
                      <span className="inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300">
                        {v.availability}
                      </span>
                    )}
                  </div>

                  {/* Skills tags */}
                  {v.skills && (
                    <div className="text-xs text-muted-foreground bg-muted/30 p-2.5 rounded-xl border border-border/50">
                      <strong className="text-foreground text-[11px] block mb-1">المهارات والاهتمامات:</strong>
                      <p className="line-clamp-2 leading-relaxed">{v.skills}</p>
                    </div>
                  )}

                  {/* Quick Contact Links */}
                  <div className="flex items-center justify-between pt-2 border-t border-border/60 text-xs">
                    <div className="flex items-center gap-2">
                      <a
                        href={`mailto:${v.email}`}
                        className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl border border-border text-foreground hover:bg-muted font-medium transition-colors"
                      >
                        <Mail size={12} className="text-primary" />
                        مراسلة
                      </a>
                      {v.phone && (
                        <a
                          href={`tel:${v.phone}`}
                          className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl border border-border text-foreground hover:bg-muted font-medium transition-colors"
                        >
                          <Phone size={12} className="text-emerald-600" />
                          اتصال
                        </a>
                      )}
                    </div>

                    <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                      <Calendar size={11} />
                      {new Date(v.created_at).toLocaleDateString("ar-IQ")}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Desktop Volunteers Table (≥ 768px) */}
          <div className="hidden md:block rounded-3xl border border-border bg-card overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b border-border bg-muted/40">
                  <tr>
                    <th className={thCls}>المتطوع</th>
                    <th className={thCls}>المدينة</th>
                    <th className={thCls}>المهارات</th>
                    <th className={thCls}>التفرغ</th>
                    <th className={thCls}>التاريخ</th>
                    <th className={thCls}>التواصل</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {loading ? (
                    Array.from({ length: 4 }).map((_, i) => (
                      <tr key={i}><td colSpan={6} className="p-4"><div className="h-10 shimmer rounded-xl" /></td></tr>
                    ))
                  ) : filteredVols.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center py-12 text-muted-foreground text-sm">
                        لا توجد طلبات تطوع
                      </td>
                    </tr>
                  ) : (
                    filteredVols.map((v) => (
                      <tr key={v.id} className="hover:bg-muted/30 transition-colors">
                        <td className={tdCls}>
                          <p className="font-semibold text-foreground">{v.full_name}</p>
                          <p className="text-xs text-muted-foreground" dir="ltr">{v.email}</p>
                        </td>
                        <td className={tdCls}>{v.city || "—"}</td>
                        <td className={tdCls}>
                          <p className="text-xs text-muted-foreground max-w-[200px] truncate">{v.skills ?? "—"}</p>
                        </td>
                        <td className={tdCls}>
                          <span className="text-xs font-medium">{v.availability ?? "—"}</span>
                        </td>
                        <td className={`${tdCls} text-xs text-muted-foreground whitespace-nowrap`}>
                          {new Date(v.created_at).toLocaleDateString("ar-IQ")}
                        </td>
                        <td className={tdCls}>
                          <div className="flex items-center gap-1.5">
                            <a
                              href={`mailto:${v.email}`}
                              className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-primary transition-colors"
                              title="إرسال بريد"
                            >
                              <Mail size={15} />
                            </a>
                            {v.phone && (
                              <a
                                href={`tel:${v.phone}`}
                                className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-emerald-600 transition-colors"
                                title="اتصال هاتفي"
                              >
                                <Phone size={15} />
                              </a>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
