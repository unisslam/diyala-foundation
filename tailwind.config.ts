/**
 * tailwind.config.ts
 * ------------------
 * Tailwind CSS v4 — config is minimal.
 * All design tokens (colours, radii, fonts, animations) are
 * declared in src/index.css inside @theme {} — that is the
 * v4 CSS-first approach. This file only sets darkMode strategy
 * and the content paths for the class scanner.
 */
import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./index.html",
    "./src/**/*.{ts,tsx,js,jsx}",
  ],
};

export default config;
