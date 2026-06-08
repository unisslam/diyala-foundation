/**
 * sdg.ts
 * ------
 * TypeScript interfaces for the UN Sustainable Development Goals (SDGs).
 * Used by sdgsData.ts config and the SDGsGrid component.
 */

import type { ComponentType, CSSProperties } from "react";

/** A single UN SDG entry as used by the Foundation's platform. */
export interface SDGItem {
  /** Official UN SDG number (1–17) */
  id: number;
  /** Zero-padded number string for display e.g. "04", "07" */
  number: string;
  /** i18n translation key for the SDG title (resolves in both AR/EN) */
  titleKey: string;
  /** i18n translation key for the Foundation's specific focus description */
  descriptionKey: string;
  /** Official UN hex color for this SDG */
  color: string;
  /** Contrast-safe text color (white or dark) for use on `color` background */
  textColor: "#FFFFFF" | "#1A1A1A";
  /** Lucide icon component reference */
  icon: ComponentType<{ size?: number; className?: string; style?: CSSProperties; "aria-hidden"?: boolean | "true" | "false" }>;
}

/** Subset of SDGs actively targeted by the Foundation */
export type FoundationSDGId = 4 | 7 | 8 | 11 | 13 | 17;
