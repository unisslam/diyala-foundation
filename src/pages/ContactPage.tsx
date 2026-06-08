/**
 * ContactPage.tsx
 * ---------------
 * Fully connected to Supabase:
 *  - Tab 1: Contact form → INSERT INTO contact_messages
 *  - Tab 2: Volunteer form → INSERT INTO volunteer_applications
 * Includes Google Maps embed, contact info cards, validation.
 */

import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from "framer-motion";
import { Send, MapPin, Mail, Phone, Clock, CheckCircle, AlertCircle, Heart } from "lucide-react";
import PageHero from "@/components/shared/PageHero";
import { supabase } from "@/lib/supabaseClient";

type TabKey = "contact" | "volunteer";
type FormStatus = "idle" | "sending" | "success" | "error" | "rate_limited";

const fadeUp = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0, transition: { duration: 0.5 } } };

/* ── Input component ─────────────────────────────────────────────────── */
function Field({
  id, label, required, children,
}: {
  id: string;
  label: string;
  required?: boolean;
  children: React.ReactNode;
}): React.ReactElement {
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium mb-1.5">
        {label}
        {required && <span className="text-destructive ms-1">*</span>}
      </label>
      {children}
    </div>
  );
}

const inputCls =
  "w-full px-4 py-2.5 rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary text-sm transition-colors";

/* ── ContactPage ─────────────────────────────────────────────────────── */
export default function ContactPage(): React.ReactElement {
  const { t, i18n } = useTranslation(["contact", "common"]);
  const isRtl = i18n.dir() === "rtl";

  const [activeTab, setActiveTab] = useState<TabKey>("contact");
  const [contactStatus, setContactStatus] = useState<FormStatus>("idle");
  const [volunteerStatus, setVolunteerStatus] = useState<FormStatus>("idle");
  const [isVolunteerActive, setIsVolunteerActive] = useState<boolean>(true); // Default to true

  useEffect(() => {
    async function loadSettings() {
      const { data, error } = await supabase
        .from("app_settings")
        .select("value")
        .eq("id", "volunteer_form_active")
        .maybeSingle();
      if (!error && data) {
        // value is a jsonb boolean
        setIsVolunteerActive(data.value === true);
      }
    }
    void loadSettings();
  }, []);

  /* ── Contact form ─────────────────────────────────────────────────── */
  async function handleContactSubmit(e: React.FormEvent<HTMLFormElement>): Promise<void> {
    e.preventDefault();
    setContactStatus("sending");
    const form = e.currentTarget;
    const data = new FormData(form);

    // Honeypot check
    if (data.get("bot_field")) {
      // Silently accept without hitting DB
      setContactStatus("success");
      form.reset();
      return;
    }

    try {
      const { error } = await supabase.from("contact_messages").insert({
        full_name: String(data.get("full_name") ?? ""),
        email: String(data.get("email") ?? ""),
        phone: String(data.get("phone") ?? "") || null,
        subject: String(data.get("subject") ?? ""),
        message: String(data.get("message") ?? ""),
      });
      if (error) throw error;
      setContactStatus("success");
      form.reset();
    } catch (err: any) {
      if (err?.message?.includes("RATE_LIMIT_EXCEEDED")) {
        setContactStatus("rate_limited");
      } else {
        setContactStatus("error");
      }
    }
  }

  /* ── Volunteer form ───────────────────────────────────────────────── */
  async function handleVolunteerSubmit(e: React.FormEvent<HTMLFormElement>): Promise<void> {
    e.preventDefault();
    setVolunteerStatus("sending");
    const form = e.currentTarget;
    const data = new FormData(form);

    // Honeypot check
    if (data.get("bot_field")) {
      setVolunteerStatus("success");
      form.reset();
      return;
    }

    try {
      const { error } = await supabase.from("volunteer_applications").insert({
        full_name: String(data.get("full_name") ?? ""),
        email: String(data.get("email") ?? ""),
        phone: String(data.get("phone") ?? ""),
        city: String(data.get("city") ?? ""),
        age: Number(data.get("age")) || null,
        skills: String(data.get("skills") ?? "") || null,
        availability: String(data.get("availability") ?? "") || null,
        motivation: String(data.get("motivation") ?? ""),
      });
      if (error) throw error;
      setVolunteerStatus("success");
      form.reset();
    } catch (err: any) {
      if (err?.message?.includes("RATE_LIMIT_EXCEEDED")) {
        setVolunteerStatus("rate_limited");
      } else {
        setVolunteerStatus("error");
      }
    }
  }

  /* ── Contact info ─────────────────────────────────────────────────── */
  const contactInfo = [
    { Icon: MapPin, label: t("contact:info.address"), value: t("contact:info.addressValue") },
    { Icon: Mail, label: t("contact:info.email"), value: "info@diyalariver.org" },
    { Icon: Phone, label: t("contact:info.phone"), value: "+964 770 000 0000" },
    { Icon: Clock, label: t("contact:info.workingHours"), value: t("contact:info.workingHoursValue") },
  ];

  /* ── Success / Error banners ──────────────────────────────────────── */
  function SuccessBanner({ message }: { message: string }): React.ReactElement {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex flex-col items-center text-center py-14 gap-4"
      >
        <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
          <CheckCircle size={32} className="text-emerald-600 dark:text-emerald-400" />
        </div>
        <p className="text-foreground font-semibold">{message}</p>
        <button
          onClick={() => { setContactStatus("idle"); setVolunteerStatus("idle"); }}
          className="text-sm text-primary hover:underline"
        >
          {isRtl ? "إرسال رسالة أخرى" : "Send another message"}
        </button>
      </motion.div>
    );
  }

  function ErrorBanner(): React.ReactElement {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex flex-col items-center text-center py-14 gap-4"
      >
        <div className="w-16 h-16 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
          <AlertCircle size={32} className="text-red-600 dark:text-red-400" />
        </div>
        <p className="text-foreground font-semibold">
          {t("common:errors.serverError", { defaultValue: "حدث خطأ غير متوقع. الرجاء المحاولة مرة أخرى." })}
        </p>
        <button
          onClick={() => { setContactStatus("idle"); setVolunteerStatus("idle"); }}
          className="text-sm text-primary hover:underline"
        >
          {t("common:errors.tryAgain", { defaultValue: "المحاولة مجدداً" })}
        </button>
      </motion.div>
    );
  }

  function RateLimitBanner(): React.ReactElement {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex flex-col items-center text-center py-14 gap-4"
      >
        <div className="w-16 h-16 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
          <AlertCircle size={32} className="text-amber-600 dark:text-amber-400" />
        </div>
        <p className="text-foreground font-semibold">
          {t("common:errors.rateLimited", { defaultValue: "عذراً، لقد قمت بإرسال عدة طلبات مؤخراً. يرجى المحاولة بعد ساعة." })}
        </p>
      </motion.div>
    );
  }

  return (
    <div dir={isRtl ? "rtl" : "ltr"}>
      {/* ── HERO ────────────────────────────────────────────────────── */}
      <PageHero
        eyebrow={isRtl ? "تواصل معنا" : "Contact Us"}
        titleKey="contact:hero.title"
        subtitleKey="contact:hero.subtitle"
        gradient="from-emerald-500/20 via-background to-background"
      />

      <section className="section-padding bg-background">
        <div className="container mx-auto px-4 md:px-8 max-w-6xl">
          <div className="grid lg:grid-cols-5 gap-10 items-start">

            {/* ── LEFT: Form ──────────────────────────────────────── */}
            <motion.div
              className="lg:col-span-3"
              initial="hidden" whileInView="show" viewport={{ once: true }} variants={fadeUp}
            >
              <div className="glass-card rounded-3xl p-7 border border-border shadow-glass">

                {/* Tabs */}
                <div className="flex gap-1 p-1 rounded-2xl bg-muted mb-6">
                  {(["contact", "volunteer"] as TabKey[]).map((tab) => (
                    <button
                      key={tab}
                      onClick={() => setActiveTab(tab)}
                      className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 ${activeTab === tab
                          ? "bg-card shadow-sm text-foreground"
                          : "text-muted-foreground hover:text-foreground"
                        }`}
                    >
                      {tab === "contact" ? <Mail size={14} /> : <Heart size={14} />}
                      {tab === "contact"
                        ? (isRtl ? "تواصل معنا" : "Contact Us")
                        : (isRtl ? "تطوع معنا" : "Volunteer")}
                    </button>
                  ))}
                </div>

                <AnimatePresence mode="wait">

                  {/* ── CONTACT FORM ── */}
                  {activeTab === "contact" && (
                    <motion.div key="contact" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                      {contactStatus === "success" ? (
                        <SuccessBanner message={t("contact:form.successBody")} />
                      ) : (
                        <form onSubmit={handleContactSubmit} className="space-y-4">
                          {contactStatus === "error" && <ErrorBanner />}
                          {contactStatus === "rate_limited" && <RateLimitBanner />}
                          {/* Honeypot field - hidden from users */}
                          <input type="text" name="bot_field" style={{ display: "none" }} tabIndex={-1} autoComplete="off" />
                          <div className="grid sm:grid-cols-2 gap-4">
                            <Field id="full_name" label={t("contact:form.name")} required>
                              <input id="full_name" name="full_name" type="text" required
                                placeholder={t("contact:form.namePlaceholder")} className={inputCls} />
                            </Field>
                            <Field id="email" label={t("contact:form.email")} required>
                              <input id="email" name="email" type="email" required
                                placeholder={t("contact:form.emailPlaceholder")} className={inputCls} dir="ltr" />
                            </Field>
                          </div>
                          <Field id="phone" label={t("contact:form.phone")}>
                            <input id="phone" name="phone" type="tel"
                              placeholder={t("contact:form.phonePlaceholder")} className={inputCls} dir="ltr" />
                          </Field>
                          <Field id="subject" label={t("contact:form.subject")} required>
                            <input id="subject" name="subject" type="text" required
                              placeholder={t("contact:form.subjectPlaceholder")} className={inputCls} />
                          </Field>
                          <Field id="message" label={t("contact:form.message")} required>
                            <textarea id="message" name="message" rows={5} required
                              placeholder={t("contact:form.messagePlaceholder")}
                              className={`${inputCls} resize-none`} />
                          </Field>
                          <button
                            type="submit"
                            disabled={contactStatus === "sending"}
                            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-primary text-primary-foreground font-semibold hover:bg-primary-dark disabled:opacity-60 transition-all duration-200"
                          >
                            <Send size={16} />
                            {contactStatus === "sending"
                              ? (isRtl ? "جاري الإرسال..." : "Sending...")
                              : t("contact:form.submit")}
                          </button>
                        </form>
                      )}
                    </motion.div>
                  )}

                  {/* ── VOLUNTEER FORM ── */}
                  {activeTab === "volunteer" && (
                    <motion.div key="volunteer" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                      {!isVolunteerActive ? (
                        <div className="flex flex-col items-center justify-center text-center py-12 px-4 gap-3 bg-muted/20 rounded-2xl border border-border">
                          <AlertCircle size={32} className="text-muted-foreground" />
                          <p className="font-medium text-foreground">
                            {isRtl ? "نعتذر، استمارة التطوع مغلقة حالياً." : "Sorry, the volunteer application form is currently closed."}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {isRtl ? "يرجى متابعة موقعنا لمعرفة موعد فتح باب التطوع مرة أخرى." : "Please check back later for updates."}
                          </p>
                        </div>
                      ) : volunteerStatus === "success" ? (
                        <SuccessBanner message={isRtl ? "شكراً! تم استلام طلب تطوعك بنجاح. سنتواصل معك قريباً." : "Thank you! Your volunteer application has been received. We'll be in touch soon."} />
                      ) : (
                        <form onSubmit={handleVolunteerSubmit} className="space-y-4">
                          {volunteerStatus === "error" && <ErrorBanner />}
                          {volunteerStatus === "rate_limited" && <RateLimitBanner />}
                          {/* Honeypot field - hidden from users */}
                          <input type="text" name="bot_field" style={{ display: "none" }} tabIndex={-1} autoComplete="off" />
                          <p className="text-sm text-muted-foreground mb-2">
                            {isRtl
                              ? "انضم إلى فريق متطوعينا وكن جزءاً من التغيير الحقيقي في ديالى."
                              : "Join our volunteer team and be part of real change in Diyala."}
                          </p>
                          <div className="grid sm:grid-cols-2 gap-4">
                            <Field id="v_full_name" label={isRtl ? "الاسم الكامل" : "Full Name"} required>
                              <input id="v_full_name" name="full_name" type="text" required
                                placeholder={isRtl ? "أدخل اسمك الكامل" : "Enter your full name"} className={inputCls} />
                            </Field>
                            <Field id="v_email" label={isRtl ? "البريد الإلكتروني" : "Email"} required>
                              <input id="v_email" name="email" type="email" required
                                placeholder="email@example.com" className={inputCls} dir="ltr" />
                            </Field>
                          </div>
                          <div className="grid sm:grid-cols-2 gap-4">
                            <Field id="v_phone" label={isRtl ? "رقم الهاتف" : "Phone"} required>
                              <input id="v_phone" name="phone" type="tel" required
                                placeholder="+964 77X XXX XXXX" className={inputCls} dir="ltr" />
                            </Field>
                            <Field id="v_city" label={isRtl ? "المدينة" : "City"} required>
                              <input id="v_city" name="city" type="text" required
                                placeholder={isRtl ? "مثال: بعقوبة" : "e.g. Baquba"} className={inputCls} />
                            </Field>
                          </div>
                          <div className="grid sm:grid-cols-2 gap-4">
                            <Field id="v_age" label={isRtl ? "العمر" : "Age"}>
                              <input id="v_age" name="age" type="number" min={16} max={70}
                                placeholder="25" className={inputCls} dir="ltr" />
                            </Field>
                            <Field id="v_availability" label={isRtl ? "التفرغ الأسبوعي" : "Weekly Availability"}>
                              <select id="v_availability" name="availability" className={inputCls}>
                                <option value="">{isRtl ? "اختر..." : "Select..."}</option>
                                <option value="1-2">{isRtl ? "1-2 أيام/أسبوع" : "1-2 days/week"}</option>
                                <option value="3-4">{isRtl ? "3-4 أيام/أسبوع" : "3-4 days/week"}</option>
                                <option value="full">{isRtl ? "وقت كامل" : "Full time"}</option>
                                <option value="weekends">{isRtl ? "عطل نهاية الأسبوع" : "Weekends only"}</option>
                              </select>
                            </Field>
                          </div>
                          <Field id="v_skills" label={isRtl ? "المهارات والخبرات" : "Skills & Experience"}>
                            <input id="v_skills" name="skills" type="text"
                              placeholder={isRtl ? "مثال: تصميم، تدريس، إدارة..." : "e.g. design, teaching, management..."} className={inputCls} />
                          </Field>
                          <Field id="v_motivation" label={isRtl ? "لماذا تريد التطوع معنا؟" : "Why do you want to volunteer with us?"} required>
                            <textarea id="v_motivation" name="motivation" rows={4} required
                              placeholder={isRtl ? "أخبرنا عن دوافعك..." : "Tell us your motivations..."}
                              className={`${inputCls} resize-none`} />
                          </Field>
                          <button
                            type="submit"
                            disabled={volunteerStatus === "sending"}
                            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-accent text-accent-foreground font-semibold hover:bg-accent-dark disabled:opacity-60 transition-all duration-200"
                          >
                            <Heart size={16} />
                            {volunteerStatus === "sending"
                              ? (isRtl ? "جاري الإرسال..." : "Sending...")
                              : (isRtl ? "أرسل طلب التطوع" : "Submit Volunteer Application")}
                          </button>
                        </form>
                      )}
                    </motion.div>
                  )}

                </AnimatePresence>
              </div>
            </motion.div>

            {/* ── RIGHT: Info + Map ────────────────────────────────── */}
            <motion.div
              className="lg:col-span-2 space-y-6"
              initial="hidden" whileInView="show" viewport={{ once: true }} variants={fadeUp}
            >
              {/* Contact info cards */}
              <div>
                <h2 className="font-display text-lg font-bold mb-5">
                  {t("contact:info.title")}
                </h2>
                <div className="space-y-4">
                  {contactInfo.map(({ Icon, label, value }) => (
                    <div key={label} className="flex items-start gap-4 p-4 rounded-2xl bg-card border border-border hover:border-primary/40 transition-colors">
                      <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                        <Icon size={18} className="text-primary" />
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground mb-0.5">{label}</p>
                        <p className="font-medium text-sm">{value}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Google Maps embed */}
              <div className="rounded-2xl overflow-hidden border border-border shadow-sm">
                <iframe
                  title={isRtl ? "موقع المؤسسة على الخريطة" : "Foundation location on map"}
                  src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d348.67066405491465!2d44.59564263226249!3d33.757226894194154!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x15564d4ad6cfb4d9%3A0x6c815af6ab8b7e0a!2z2YPZiNmB2Yog2YjZgtin2LnYqSDYp9mE2KTZhNik2Kk!5e0!3m2!1sen!2siq!4v1780935496845!5m2!1sen!2siq" width="600" height="450" style="border:0;" allowfullscreen="" loading="lazy" referrerpolicy="no-referrer-when-downgrade"
                  width="100%"
                  height="220"
                  style={{ border: 0 }}
                  allowFullScreen
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                />
              </div>
            </motion.div>
          </div>
        </div>
      </section>
    </div>
  );
}
