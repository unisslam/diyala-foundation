/**
 * database.types.ts
 * -----------------
 * TypeScript interfaces that mirror the Supabase PostgreSQL schema.
 * Run `npx supabase gen types typescript --linked` to auto-regenerate
 * this file once you have linked your project with the Supabase CLI.
 *
 * Manual definitions are kept here as the source of truth until
 * auto-generation is set up.
 */

// ── Enumerations ────────────────────────────────────────────────────

export type ProjectStatus = "planned" | "active" | "completed" | "on_hold";
export type ProjectCategory =
  | "water_management"
  | "environmental"
  | "community"
  | "research"
  | "education"
  | "health";

export type NewsCategory =
  | "news"
  | "announcement"
  | "report"
  | "event"
  | "press_release";

export type ContactStatus = "new" | "read" | "replied" | "archived";
export type VolunteerStatus = "pending" | "approved" | "rejected";
export type TeamRole = "board" | "management" | "advisor" | "staff";
export type TestimonialStatus = "pending" | "approved" | "rejected";

// ── Row types ───────────────────────────────────────────────────────

export interface ProjectRow {
  id: string;                       // uuid
  created_at: string;               // timestamptz
  updated_at: string;
  title_ar: string;
  title_en: string;
  slug: string;                     // unique, URL-safe
  description_ar: string;
  description_en: string;
  content_ar: string | null;        // rich text / markdown
  content_en: string | null;
  status: ProjectStatus;
  category: ProjectCategory;
  cover_image_path: string | null;  // Supabase Storage path
  gallery_paths: string[] | null;   // array of storage paths
  start_date: string | null;        // date
  end_date: string | null;
  location_ar: string | null;
  location_en: string | null;
  beneficiaries_count: number | null;
  budget_usd: number | null;
  is_featured: boolean;
  tags: string[] | null;
  external_url: string | null;
}

export interface NewsRow {
  id: string;
  created_at: string;
  updated_at: string;
  title_ar: string;
  title_en: string;
  slug: string;
  excerpt_ar: string;
  excerpt_en: string;
  body_ar: string | null;
  body_en: string | null;
  category: NewsCategory;
  cover_image_path: string | null;
  published_at: string | null;
  is_published: boolean;
  is_featured: boolean;
  author_id: string | null;          // FK → team_members.id
  tags: string[] | null;
  views_count: number;
}

export interface TeamMemberRow {
  id: string;
  created_at: string;
  updated_at: string;
  full_name_ar: string;
  full_name_en: string;
  role: TeamRole;
  title_ar: string;
  title_en: string;
  bio_ar: string | null;
  bio_en: string | null;
  avatar_path: string | null;
  email: string | null;
  linkedin_url: string | null;
  display_order: number;
  is_active: boolean;
}

export interface ContactMessageRow {
  id: string;
  created_at: string;
  full_name: string;
  email: string;
  phone: string | null;
  subject: string;
  message: string;
  status: ContactStatus;
  ip_address: string | null;
  user_agent: string | null;
}

export interface VolunteerApplicationRow {
  id: string;
  created_at: string;
  full_name: string;
  email: string;
  phone: string;
  city: string;
  age: number | null;
  skills: string | null;
  availability: string | null;
  motivation: string;
  status: VolunteerStatus;
}

export interface ImpactStatRow {
  id: string;
  updated_at: string;
  stat_key: string;                  // e.g. "beneficiaries_total"
  value_number: number;
  label_ar: string;
  label_en: string;
  icon_name: string;                 // Lucide icon name
  display_order: number;
}

export interface TestimonialRow {
  id: string;
  created_at: string;
  updated_at: string;
  author_name_ar: string;
  author_name_en: string;
  role_ar: string;
  role_en: string;
  body_ar: string;
  body_en: string;
  rating: number;
  status: TestimonialStatus;
  source: string | null;
  avatar_path: string | null;
}

export interface GalleryItemRow {
  id: string;
  created_at: string;
  updated_at: string;
  title_ar: string | null;
  title_en: string | null;
  image_path: string;
  display_order: number;
  is_active: boolean;
}

// ── Database generic wrapper (matches Supabase gen types pattern) ───

export interface Database {
  public: {
    Tables: {
      projects: {
        Row: ProjectRow;
        Insert: Omit<ProjectRow, "id" | "created_at" | "updated_at" | "views_count"> & { id?: string };
        Update: Partial<ProjectRow>;
      };
      news: {
        Row: NewsRow;
        Insert: Omit<NewsRow, "id" | "created_at" | "updated_at" | "views_count"> & { id?: string };
        Update: Partial<NewsRow>;
      };
      team_members: {
        Row: TeamMemberRow;
        Insert: Omit<TeamMemberRow, "id" | "created_at" | "updated_at"> & { id?: string };
        Update: Partial<TeamMemberRow>;
      };
      contact_messages: {
        Row: ContactMessageRow;
        Insert: Omit<ContactMessageRow, "id" | "created_at" | "status"> & { id?: string };
        Update: Partial<ContactMessageRow>;
      };
      volunteer_applications: {
        Row: VolunteerApplicationRow;
        Insert: Omit<VolunteerApplicationRow, "id" | "created_at" | "status"> & { id?: string };
        Update: Partial<VolunteerApplicationRow>;
      };
      impact_stats: {
        Row: ImpactStatRow;
        Insert: Omit<ImpactStatRow, "id" | "updated_at"> & { id?: string };
        Update: Partial<ImpactStatRow>;
      };
      testimonials: {
        Row: TestimonialRow;
        Insert: Omit<TestimonialRow, "id" | "created_at" | "updated_at"> & { id?: string };
        Update: Partial<TestimonialRow>;
      };
      gallery_items: {
        Row: GalleryItemRow;
        Insert: Omit<GalleryItemRow, "id" | "created_at" | "updated_at"> & { id?: string };
        Update: Partial<GalleryItemRow>;
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: {
      project_status:  ProjectStatus;
      project_category: ProjectCategory;
      news_category:   NewsCategory;
      contact_status:  ContactStatus;
      volunteer_status: VolunteerStatus;
      team_role:       TeamRole;
      testimonial_status: TestimonialStatus;
    };
  };
}
