import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import { Send, MapPin, Mail, Phone, Clock } from "lucide-react";

const fadeUp = { hidden: { opacity: 0, y: 24 }, show: { opacity: 1, y: 0, transition: { duration: 0.6 } } };

export default function ContactPage(): React.ReactElement {
  const { t, i18n } = useTranslation(["contact", "common"]);
  const isRtl = i18n.dir() === "rtl";
  const [status, setStatus] = useState<"idle" | "sending" | "success" | "error">("idle");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>): Promise<void> {
    e.preventDefault();
    setStatus("sending");
    // Phase 2: connect to Supabase Edge Function
    await new Promise((r) => setTimeout(r, 1500));
    setStatus("success");
  }

  const contactInfo = [
    { Icon: MapPin, label: t("contact:info.address"),      value: t("contact:info.addressValue") },
    { Icon: Mail,   label: t("contact:info.email"),        value: "info@diyalafoundation.org"     },
    { Icon: Phone,  label: t("contact:info.phone"),        value: "+964 770 000 0000"              },
    { Icon: Clock,  label: t("contact:info.workingHours"), value: t("contact:info.workingHoursValue") },
  ];

  return (
    <div dir={isRtl ? "rtl" : "ltr"}>
      <section className="section-padding bg-gradient-to-br from-water-50 to-background">
        <div className="container mx-auto px-4 md:px-8 max-w-5xl">
          <motion.div className="text-center mb-14" initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }}>
            <h1 className="font-display text-4xl md:text-5xl font-black mb-4 text-gradient-water">{t("contact:hero.title")}</h1>
            <p className="text-muted-foreground text-lg">{t("contact:hero.subtitle")}</p>
          </motion.div>

          <div className="grid lg:grid-cols-5 gap-10">
            {/* Contact form */}
            <motion.div className="lg:col-span-3" initial="hidden" whileInView="show" viewport={{ once: true }} variants={fadeUp}>
              <div className="glass-card rounded-3xl p-8 border border-border shadow-glass">
                <h2 className="font-display text-xl font-bold mb-6">{t("contact:form.title")}</h2>

                {status === "success" ? (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
                      <Send size={28} className="text-green-600" />
                    </div>
                    <h3 className="font-semibold text-lg mb-2">{t("contact:form.successTitle")}</h3>
                    <p className="text-muted-foreground">{t("contact:form.successBody")}</p>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-5">
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div>
                        <label htmlFor="full-name" className="block text-sm font-medium mb-1.5">{t("contact:form.name")}</label>
                        <input id="full-name" type="text" required placeholder={t("contact:form.namePlaceholder")}
                          className="w-full px-4 py-2.5 rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary text-sm" />
                      </div>
                      <div>
                        <label htmlFor="email" className="block text-sm font-medium mb-1.5">{t("contact:form.email")}</label>
                        <input id="email" type="email" required placeholder={t("contact:form.emailPlaceholder")}
                          className="w-full px-4 py-2.5 rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary text-sm" dir="ltr" />
                      </div>
                    </div>
                    <div>
                      <label htmlFor="phone" className="block text-sm font-medium mb-1.5">{t("contact:form.phone")}</label>
                      <input id="phone" type="tel" placeholder={t("contact:form.phonePlaceholder")}
                        className="w-full px-4 py-2.5 rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary text-sm" dir="ltr" />
                    </div>
                    <div>
                      <label htmlFor="subject" className="block text-sm font-medium mb-1.5">{t("contact:form.subject")}</label>
                      <input id="subject" type="text" required placeholder={t("contact:form.subjectPlaceholder")}
                        className="w-full px-4 py-2.5 rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary text-sm" />
                    </div>
                    <div>
                      <label htmlFor="message" className="block text-sm font-medium mb-1.5">{t("contact:form.message")}</label>
                      <textarea id="message" required rows={5} placeholder={t("contact:form.messagePlaceholder")}
                        className="w-full px-4 py-2.5 rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary text-sm resize-none" />
                    </div>
                    <button
                      type="submit"
                      disabled={status === "sending"}
                      className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-primary text-primary-foreground font-semibold hover:bg-primary-dark disabled:opacity-60 transition-all duration-200"
                    >
                      <Send size={16} />
                      {status === "sending" ? t("contact:form.sending") : t("contact:form.submit")}
                    </button>
                  </form>
                )}
              </div>
            </motion.div>

            {/* Contact info sidebar */}
            <motion.div className="lg:col-span-2" initial="hidden" whileInView="show" viewport={{ once: true }} variants={fadeUp}>
              <div className="space-y-5">
                <h2 className="font-display text-xl font-bold">{t("contact:info.title")}</h2>
                {contactInfo.map(({ Icon, label, value }) => (
                  <div key={label} className="flex items-start gap-4">
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
            </motion.div>
          </div>
        </div>
      </section>
    </div>
  );
}
