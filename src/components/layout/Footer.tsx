/**
 * Footer.tsx
 * ----------
 * Site-wide footer with brand, quick links, contact info, and social icons.
 */

import React from "react";
import { Link }           from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  Heart,
  ChevronRight,
  MapPin,
  Mail,
  Phone,
  Share2,
  Send,
  Globe,
  Play,
  Link2,
} from "lucide-react";

export function Footer(): React.ReactElement {
  const { t, i18n } = useTranslation(["common", "nav"]);
  const isRtl = i18n.dir() === "rtl";

  const quickLinks = [
    { to: "/",         label: t("nav:home")       },
    { to: "/about",    label: t("nav:about")       },
    { to: "/projects", label: t("nav:projects")   },
    { to: "/news",     label: t("nav:news")        },
    { to: "/contact",  label: t("nav:contact")    },
  ];

  const socials: Array<{ Icon: React.ElementType; href: string; label: string }> = [
    { Icon: Share2, href: "#", label: "Facebook"   },
    { Icon: Send,   href: "#", label: "Twitter / X" },
    { Icon: Globe,  href: "#", label: "Instagram"  },
    { Icon: Play,   href: "#", label: "YouTube"    },
    { Icon: Link2,  href: "#", label: "LinkedIn"   },
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
              <span className="font-display font-bold text-lg text-background leading-tight max-w-[200px]">
                {t("common:foundation.nameShort")}
              </span>
            </div>
            <p className="text-background/70 text-sm leading-relaxed mb-6 max-w-xs">
              {t("common:foundation.tagline")}
            </p>

            {/* Social links */}
            <div className="flex items-center gap-3 flex-wrap">
              {socials.map(({ Icon, href, label }) => (
                <a
                  key={label}
                  href={href}
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
                <span>بغداد، جمهورية العراق</span>
              </li>
              <li className="flex items-start gap-2">
                <Mail size={14} className="text-primary mt-0.5 shrink-0" />
                <a
                  href="mailto:info@diyalafoundation.org"
                  className="hover:text-primary transition-colors"
                >
                  info@diyalafoundation.org
                </a>
              </li>
              <li className="flex items-start gap-2">
                <Phone size={14} className="text-primary mt-0.5 shrink-0" />
                <a
                  href="tel:+9647700000000"
                  className="hover:text-primary transition-colors"
                  dir="ltr"
                >
                  +964 770 000 0000
                </a>
              </li>
            </ul>
          </div>

        </div>

        {/* Bottom bar */}
        <div className="mt-12 pt-6 border-t border-background/10 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-background/50">
          <p>{t("common:footer.rights")}</p>
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
