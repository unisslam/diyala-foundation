/**
 * sdgsData.ts
 * -----------
 * Strongly-typed configuration of the UN Sustainable Development Goals (SDGs)
 * targeted by the Diyala River Foundation for Sustainable Development.
 *
 * Only the SDGs within the Foundation's active operational mandate are included.
 * Official UN colors sourced from: https://www.un.org/sustainabledevelopment/news/communications-material/
 *
 * DO NOT add water/river thematic colors. Use only official UN SDG hex values.
 */


import {
  GraduationCap,
  Zap,
  Briefcase,
  Building2,
  Leaf,
  Handshake,
} from "lucide-react";
import type { SDGItem } from "@/types/sdg";

/**
 * The Foundation's active SDG portfolio.
 * Each entry maps directly to an official UN Sustainable Development Goal.
 */
export const FOUNDATION_SDGS: SDGItem[] = [
  {
    id: 4,
    number: "04",
    titleKey: "home:sdgsGrid.sdg4.title",
    descriptionKey: "home:sdgsGrid.sdg4.description",
    color: "#C5192D",
    textColor: "#FFFFFF",
    icon: GraduationCap,
  },
  {
    id: 7,
    number: "07",
    titleKey: "home:sdgsGrid.sdg7.title",
    descriptionKey: "home:sdgsGrid.sdg7.description",
    color: "#FCC30B",
    textColor: "#1A1A1A",
    icon: Zap,
  },
  {
    id: 8,
    number: "08",
    titleKey: "home:sdgsGrid.sdg8.title",
    descriptionKey: "home:sdgsGrid.sdg8.description",
    color: "#A21942",
    textColor: "#FFFFFF",
    icon: Briefcase,
  },
  {
    id: 11,
    number: "11",
    titleKey: "home:sdgsGrid.sdg11.title",
    descriptionKey: "home:sdgsGrid.sdg11.description",
    color: "#FD9D24",
    textColor: "#1A1A1A",
    icon: Building2,
  },
  {
    id: 13,
    number: "13",
    titleKey: "home:sdgsGrid.sdg13.title",
    descriptionKey: "home:sdgsGrid.sdg13.description",
    color: "#3F7E44",
    textColor: "#FFFFFF",
    icon: Leaf,
  },
  {
    id: 17,
    number: "17",
    titleKey: "home:sdgsGrid.sdg17.title",
    descriptionKey: "home:sdgsGrid.sdg17.description",
    color: "#19486A",
    textColor: "#FFFFFF",
    icon: Handshake,
  },
];

/** Map of SDG id → SDGItem for O(1) lookup */
export const SDG_MAP: Readonly<Record<number, SDGItem>> = Object.fromEntries(
  FOUNDATION_SDGS.map((sdg) => [sdg.id, sdg])
);
