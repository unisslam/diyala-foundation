/**
 * Footer.tsx
 * ----------
 * Site-wide footer with brand, quick links, contact info, and social icons.
 */

import React from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  Heart,
  ChevronRight,
  MapPin,
  Mail,
  Phone,
} from "lucide-react";

const FacebookIcon = ({ size = 24, className = "" }: { size?: number, className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
  </svg>
);

const InstagramIcon = ({ size = 24, className = "" }: { size?: number, className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
    <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
  </svg>
);

export function Footer(): React.ReactElement {
  const { t, i18n } = useTranslation(["common", "nav"]);
  const isRtl = i18n.dir() === "rtl";

  const quickLinks = [
    { to: "/", label: t("nav:home") },
    { to: "/about", label: t("nav:about") },
    { to: "/projects", label: t("nav:projects") },
    { to: "/news", label: t("nav:news") },
    { to: "/gallery", label: t("nav:gallery") },
    { to: "/contact", label: t("nav:contact") },
    { to: "/join", label: t("nav:join") },
  ];

  const socials: Array<{ Icon: React.ElementType; href: string; label: string; title: string }> = [
    { Icon: FacebookIcon, href: "https://www.facebook.com/profile.php?id=61576828824706", label: "Facebook Foundation", title: "مؤسسة نهر ديالى - Facebook" },
    { Icon: InstagramIcon, href: "https://www.instagram.com/diyala.river/", label: "Instagram Foundation", title: "مؤسسة نهر ديالى - Instagram" },
  ];

  return (
    <footer
      className="bg-foreground text-background"
      dir={isRtl ? "rtl" : "ltr"}
    >
      {/* Wave top divider */}
      <div
        style={{
          height: "3rem",
          background:
            "linear-gradient(to bottom, var(--color-background) 0%, transparent 100%)",
          clipPath: "ellipse(60% 100% at 50% 0%)",
        }}
      />

      <div className="container mx-auto px-4 md:px-8 pb-12 pt-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">

          {/* Brand column */}
          <div className="lg:col-span-2">
            <div className="flex items-center gap-3 mb-4">
              <img
                src="/logo.png"
                alt="Diyala Foundation"
                className="w-12 h-12 object-contain"
                style={{ filter: "brightness(0) invert(1)" }}
              />
              <span className="font-display font-bold text-lg text-background leading-tight max-w-[230px]">
                {t("common:foundation.name")}
              </span>
            </div>
            <p className="text-background/70 text-sm leading-relaxed mb-6 max-w-xs">
              {t("common:foundation.tagline")}
            </p>

            {/* Social links */}
            <div className="flex items-center gap-3 flex-wrap">
              {socials.map(({ Icon, href, label, title }) => (
                <a
                  key={label}
                  href={href}
                  title={title}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={label}
                  className="w-9 h-9 flex items-center justify-center rounded-full bg-background/10 hover:bg-primary hover:text-background transition-all duration-200"
                >
                  <Icon size={16} />
                </a>
              ))}
            </div>
          </div>

          {/* Quick links */}
          <div>
            <h3 className="font-display font-semibold text-background mb-4 text-sm uppercase tracking-wider">
              {t("common:footer.quickLinks")}
            </h3>
            <ul className="space-y-2" style={{ listStyle: "none", padding: 0, margin: 0 }}>
              {quickLinks.map((link) => (
                <li key={link.to}>
                  <Link
                    to={link.to}
                    className="text-background/70 hover:text-primary text-sm transition-colors duration-200 flex items-center gap-2"
                  >
                    <ChevronRight size={12} className="text-primary shrink-0" aria-hidden="true" />
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact info */}
          <div>
            <h3 className="font-display font-semibold text-background mb-4 text-sm uppercase tracking-wider">
              {t("common:footer.followUs")}
            </h3>
            <ul className="space-y-3 text-sm text-background/70" style={{ listStyle: "none", padding: 0, margin: 0 }}>
              <li className="flex items-start gap-2">
                <MapPin size={14} className="text-primary mt-0.5 shrink-0" />
                <span>{t("common:footer.addressValue")}</span>
              </li>
              <li className="flex items-start gap-2">
                <Mail size={14} className="text-primary mt-0.5 shrink-0" />
                <a
                  href="mailto:info@diyalariver.org"
                  className="hover:text-primary transition-colors"
                >
                  info@diyalariver.org
                </a>
              </li>
              <li className="flex items-start gap-2">
                <Phone size={14} className="text-primary mt-0.5 shrink-0" />
                <a
                  href="tel:+9647730300804"
                  className="hover:text-primary transition-colors"
                  dir="ltr"
                >
                  +9647730300804
                </a>
              </li>
            </ul>
          </div>

        </div>

        {/* Bottom bar */}
        <div className="mt-12 pt-6 border-t border-background/10 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-background/50">
          <p>{t("common:footer.rights", { year: new Date().getFullYear() })}</p>
          <p className="flex items-center gap-1">
            {t("common:footer.madeWith")}
            <Heart size={12} className="text-accent mx-1" style={{ fill: "currentColor" }} />
            {t("common:footer.forIraq")}
          </p>
        </div>
      </div>
    </footer>
  );
}
