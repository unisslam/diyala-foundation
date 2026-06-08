/**
 * Navbar.tsx
 * ----------
 * Sticky glassmorphism navigation bar with:
 *  - Logo (SVG inline + text)
 *  - Desktop nav links
 *  - Language switcher (AR / EN)
 *  - Mobile hamburger menu (Framer Motion drawer)
 *  - Join CTA button
 */

import React, { useState, useEffect } from "react";
import { Link, NavLink } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, Globe } from "lucide-react";
import { applyLanguageDirection, LANGUAGE_META, SUPPORTED_LANGUAGES, type SupportedLanguage } from "@/i18n";

// Logo component – inline to avoid extra network requests
function DiyalaLogo({ className = "" }: { className?: string }): React.ReactElement {
  return (
    <img
      src="/logo.png"
      alt="Diyala River Foundation Logo"
      className={className}
      width={48}
      height={48}
    />
  );
}

export function Navbar(): React.ReactElement {
  const { t, i18n } = useTranslation(["nav", "common"]);
  const [isOpen, setIsOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  const currentLang = i18n.language as SupportedLanguage;
  const dir = LANGUAGE_META[currentLang]?.dir ?? "rtl";

  // Detect scroll for glass effect
  useEffect(() => {
    const onScroll = (): void => setIsScrolled(window.scrollY > 24);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setIsOpen(false);
  }, [i18n.language]);

  function toggleLanguage(): void {
    const next: SupportedLanguage = currentLang === "ar" ? "en" : "ar";
    i18n.changeLanguage(next);
    applyLanguageDirection(next);
  }

  const navLinks = [
    { to: "/", label: t("nav:home") },
    { to: "/about", label: t("nav:about") },
    { to: "/projects", label: t("nav:projects") },
    { to: "/news", label: t("nav:news") },
    { to: "/gallery", label: t("nav:gallery") },
    { to: "/contact", label: t("nav:contact") },
  ] as const;

  const navLinkClass = ({ isActive }: { isActive: boolean }): string =>
    `relative text-sm font-medium transition-colors duration-200 hover:text-primary
     after:absolute after:bottom-[-4px] after:start-0 after:h-0.5 after:w-full
     after:origin-start after:scale-x-0 after:bg-primary after:transition-transform
     hover:after:scale-x-100
     ${isActive ? "text-primary after:scale-x-100" : "text-foreground/70"}`;

  return (
    <header
      className={`sticky top-0 z-50 w-full transition-all duration-300 ${isScrolled
        ? "glass-card shadow-glass border-b border-border/50"
        : "bg-transparent"
        }`}
    >
      <nav
        className="container mx-auto flex items-center justify-between px-4 py-3 md:px-8"
        role="navigation"
        aria-label={t("common:accessibility.menu")}
        dir={dir}
      >
        {/* Logo */}
        <Link to="/" className="flex items-center gap-3 shrink-0" aria-label={t("common:foundation.nameShort")}>
          <DiyalaLogo className="w-12 h-12 object-contain" />
          <span className="hidden sm:block font-hero font-medium text-black leading-tight max-w-[230px] text-sm">
            {t("common:foundation.name")}
          </span>
        </Link>

        {/* Desktop links */}
        <ul className="hidden lg:flex items-center gap-8 list-none">
          {navLinks.map((link) => (
            <li key={link.to}>
              <NavLink to={link.to} end={link.to === "/"} className={navLinkClass}>
                {link.label}
              </NavLink>
            </li>
          ))}
        </ul>

        {/* Right actions */}
        <div className="flex items-center gap-2">
          {/* Language toggle */}
          <button
            onClick={toggleLanguage}
            aria-label={t("common:accessibility.switchLanguage")}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border border-border hover:border-primary hover:text-primary transition-colors duration-200"
          >
            <Globe size={14} />
            <span>{currentLang === "ar" ? "EN" : "ع"}</span>
          </button>

          {/* Join CTA */}
          <Link
            to="/join"
            className="hidden sm:inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-accent text-accent-foreground text-sm font-semibold hover:bg-accent-dark transition-colors duration-200 shadow-accent-glow/30"
          >
            {t("nav:join")}
          </Link>

          {/* Mobile hamburger */}
          <button
            className="lg:hidden p-2 rounded-lg hover:bg-muted transition-colors"
            onClick={() => setIsOpen((v) => !v)}
            aria-label={isOpen ? t("common:accessibility.closeMenu") : t("common:accessibility.openMenu")}
            aria-expanded={isOpen}
          >
            {isOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </nav>

      {/* Mobile drawer */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25, ease: "easeInOut" }}
            className="lg:hidden overflow-hidden glass-card border-t border-border/50"
          >
            <ul className="flex flex-col py-4 px-6 gap-1 list-none" dir={dir}>
              {navLinks.map((link) => (
                <li key={link.to}>
                  <NavLink
                    to={link.to}
                    end={link.to === "/"}
                    className={({ isActive }) =>
                      `block py-3 px-4 rounded-xl text-sm font-medium transition-colors ${isActive
                        ? "bg-primary/10 text-primary"
                        : "text-foreground/70 hover:bg-muted hover:text-foreground"
                      }`
                    }
                    onClick={() => setIsOpen(false)}
                  >
                    {link.label}
                  </NavLink>
                </li>
              ))}
              <li className="pt-2 border-t border-border mt-2">
                <Link
                  to="/contact"
                  className="block text-center py-2.5 px-4 rounded-full bg-accent text-accent-foreground text-sm font-semibold"
                  onClick={() => setIsOpen(false)}
                >
                  {t("nav:join")}
                </Link>
              </li>
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
