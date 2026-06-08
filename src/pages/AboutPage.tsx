import React from "react";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import { Eye, Target, Users, Lightbulb, Heart, Zap } from "lucide-react";

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  show:   { opacity: 1, y: 0, transition: { duration: 0.6 } },
};

export default function AboutPage(): React.ReactElement {
  const { t, i18n } = useTranslation(["about", "common"]);
  const isRtl = i18n.dir() === "rtl";

  const values = [
    { icon: Heart,  titleKey: t("about:values.integrity.title"),    descKey: t("about:values.integrity.desc") },
    { icon: Zap,    titleKey: t("about:values.sustainability.title"), descKey: t("about:values.sustainability.desc") },
    { icon: Users,  titleKey: t("about:values.community.title"),     descKey: t("about:values.community.desc") },
    { icon: Lightbulb, titleKey: t("about:values.innovation.title"), descKey: t("about:values.innovation.desc") },
  ];

  return (
    <div dir={isRtl ? "rtl" : "ltr"}>
      {/* Hero */}
      <section className="section-padding bg-gradient-to-br from-water-50 to-background">
        <div className="container mx-auto px-4 md:px-8 text-center max-w-3xl">
          <motion.h1 initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }}
            className="font-display text-4xl md:text-5xl font-black mb-4 text-gradient-water"
          >
            {t("about:hero.title")}
          </motion.h1>
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2, duration: 0.7 }}
            className="text-muted-foreground text-lg"
          >
            {t("about:hero.subtitle")}
          </motion.p>
        </div>
      </section>

      {/* Vision & Mission */}
      <section className="section-padding bg-background">
        <div className="container mx-auto px-4 md:px-8 grid md:grid-cols-2 gap-10">
          {[
            { Icon: Eye,    title: t("about:vision.title"),  body: t("about:vision.body"),  color: "primary" },
            { Icon: Target, title: t("about:mission.title"), body: t("about:mission.body"), color: "accent"  },
          ].map(({ Icon, title, body, color }) => (
            <motion.div
              key={title}
              initial="hidden" whileInView="show" viewport={{ once: true }} variants={fadeUp}
              className={`p-8 rounded-3xl border-2 ${color === "primary" ? "border-primary/20 bg-primary/5" : "border-accent/20 bg-accent/5"}`}
            >
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-6 ${color === "primary" ? "bg-primary/15" : "bg-accent/15"}`}>
                <Icon size={26} className={color === "primary" ? "text-primary" : "text-accent"} />
              </div>
              <h2 className="font-display text-xl font-bold mb-3">{title}</h2>
              <p className="text-muted-foreground leading-relaxed">{body}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Values */}
      <section className="section-padding bg-muted/30">
        <div className="container mx-auto px-4 md:px-8">
          <motion.div className="text-center mb-12" initial="hidden" whileInView="show" viewport={{ once: true }} variants={fadeUp}>
            <h2 className="font-display text-3xl font-bold mb-3">{t("about:values.title")}</h2>
          </motion.div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {values.map(({ icon: Icon, titleKey, descKey }) => (
              <motion.div key={titleKey} initial="hidden" whileInView="show" viewport={{ once: true }} variants={fadeUp}
                className="glass-card p-6 rounded-2xl text-center hover:shadow-card-hover transition-shadow duration-300"
              >
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <Icon size={22} className="text-primary" />
                </div>
                <h3 className="font-semibold text-base mb-2">{titleKey}</h3>
                <p className="text-muted-foreground text-sm">{descKey}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
