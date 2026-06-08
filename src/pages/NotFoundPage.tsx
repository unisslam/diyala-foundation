import React from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import { Home } from "lucide-react";

export default function NotFoundPage(): React.ReactElement {
  const { t } = useTranslation("common");

  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center text-center px-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, type: "spring" }}
        className="max-w-md"
      >
        <img src="/logo.png" alt="Logo" className="w-24 h-24 object-contain animate-water-flow mx-auto mb-8" />
        <h1 className="font-display text-7xl font-black text-primary mb-4">404</h1>
        <h2 className="font-display text-2xl font-bold mb-3">{t("errors.notFound")}</h2>
        <p className="text-muted-foreground mb-8">{t("errors.notFoundDesc")}</p>
        <Link
          to="/"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-primary text-primary-foreground font-semibold hover:bg-primary-dark transition-colors"
        >
          <Home size={18} />
          العودة للرئيسية
        </Link>
      </motion.div>
    </div>
  );
}
