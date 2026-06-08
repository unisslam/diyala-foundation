/**
 * i18n/index.ts
 * -------------
 * Initialises react-i18next with:
 *  • Arabic (ar) – RTL, Tajawal font
 *  • English (en) – LTR, Inter font
 *
 * Language is persisted in localStorage and detected automatically
 * from the browser's navigator.language.
 */

import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";

import arCommon  from "./locales/ar/common.json";
import arNav     from "./locales/ar/nav.json";
import arHome    from "./locales/ar/home.json";
import arAbout   from "./locales/ar/about.json";
import arProjects from "./locales/ar/projects.json";
import arNews    from "./locales/ar/news.json";
import arContact from "./locales/ar/contact.json";
import arJoin    from "./locales/ar/join.json";

import enCommon  from "./locales/en/common.json";
import enNav     from "./locales/en/nav.json";
import enHome    from "./locales/en/home.json";
import enAbout   from "./locales/en/about.json";
import enProjects from "./locales/en/projects.json";
import enNews    from "./locales/en/news.json";
import enContact from "./locales/en/contact.json";
import enJoin    from "./locales/en/join.json";

export const SUPPORTED_LANGUAGES = ["ar", "en"] as const;
export type SupportedLanguage = (typeof SUPPORTED_LANGUAGES)[number];

export const LANGUAGE_META: Record<SupportedLanguage, { label: string; dir: "rtl" | "ltr"; flag: string }> = {
  ar: { label: "العربية", dir: "rtl", flag: "🇮🇶" },
  en: { label: "English", dir: "ltr", flag: "🌐" },
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      ar: {
        common:   arCommon,
        nav:      arNav,
        home:     arHome,
        about:    arAbout,
        projects: arProjects,
        news:     arNews,
        contact:  arContact,
        join:     arJoin,
      },
      en: {
        common:   enCommon,
        nav:      enNav,
        home:     enHome,
        about:    enAbout,
        projects: enProjects,
        news:     enNews,
        contact:  enContact,
        join:     enJoin,
      },
    },
    defaultNS: "common",
    fallbackLng: "ar",
    supportedLngs: SUPPORTED_LANGUAGES,
    detection: {
      order: ["localStorage", "navigator"],
      caches: ["localStorage"],
      lookupLocalStorage: "diyala_lang",
    },
    interpolation: {
      escapeValue: false, // React already escapes
    },
  });

/**
 * Applies the correct `dir` and `lang` attributes to <html>
 * and switches the body font-family token.
 */
export function applyLanguageDirection(lang: SupportedLanguage): void {
  const { dir } = LANGUAGE_META[lang];
  document.documentElement.setAttribute("dir",  dir);
  document.documentElement.setAttribute("lang", lang);
}

export default i18n;
