import type { TestimonialRow } from "./database.types";

export type Testimonial = TestimonialRow;

export interface TestimonialInput {
  author_name_ar: string;
  author_name_en: string;
  role_ar: string;
  role_en: string;
  body_ar: string;
  body_en: string;
  rating: number;
}
