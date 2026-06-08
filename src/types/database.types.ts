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
export type TeamRole = "board" | "management" | "advisor" | "staff" | "member";
export type TestimonialStatus = "pending" | "approved" | "rejected";
export type MembershipType = "regular" | "founding" | "honorary" | "student";
export type MembershipStatus = "pending" | "under_review" | "approved" | "rejected" | "waitlisted";
export type EducationLevel = "high_school" | "diploma" | "bachelor" | "master" | "phd" | "other";

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
  is_published: boolean;
  views_count: number;              // incremented on detail page visit
  sdg_tags: string[] | null;
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
  membership_application_id: string | null;
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

export interface MembershipApplicationRow {
  id: string;
  created_at: string;
  updated_at: string;
  application_number: string | null;   // auto: DRF-2024-0001
  // Personal
  full_name_ar: string;
  full_name_en: string;
  date_of_birth: string;               // date ISO
  nationality: string;
  national_id: string | null;
  gender: "male" | "female" | null;
  // Contact
  email: string;
  phone_primary: string;
  phone_secondary: string | null;
  governorate: string;
  city: string;
  address_detail: string | null;
  // Education & Career
  education_level: EducationLevel;
  education_field: string | null;
  institution: string | null;
  graduation_year: number | null;
  current_employer: string | null;
  current_position: string | null;
  years_of_experience: number | null;
  // Skills
  skills: string[] | null;
  languages: string[] | null;
  areas_of_interest: string[] | null;
  expertise_description: string | null;
  // Availability
  available_days_per_week: number | null;
  available_hours_per_day: number | null;
  // Motivation
  motivation_statement: string;
  previous_volunteering: string | null;
  how_heard_about_us: string | null;
  // References
  reference_1_name: string | null;
  reference_1_phone: string | null;
  reference_1_relation: string | null;
  reference_2_name: string | null;
  reference_2_phone: string | null;
  reference_2_relation: string | null;
  // Emergency
  emergency_contact_name: string | null;
  emergency_contact_phone: string | null;
  emergency_contact_relation: string | null;
  // Membership
  membership_type: MembershipType;
  status: MembershipStatus;
  reviewer_notes: string | null;
  reviewed_at: string | null;
  // Agreement
  agrees_to_terms: boolean;
  agrees_to_code_of_conduct: boolean;
  signature_date: string | null;
}

export interface AppSettingRow {
  id: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  value: any;
  created_at: string;
  updated_at: string;
}

// ── Database generic wrapper (matches Supabase gen types pattern) ───

export interface Database {
  public: {
    Tables: {
      app_settings: {
        Row: AppSettingRow;
        Insert: Omit<AppSettingRow, "created_at" | "updated_at"> & { created_at?: string; updated_at?: string };
        Update: Partial<AppSettingRow>;
        Relationships: any[];
      };
      projects: {
        Row: ProjectRow;
        Insert: Omit<ProjectRow, "id" | "created_at" | "updated_at" | "views_count"> & { id?: string };
        Update: Partial<ProjectRow>;
        Relationships: any[];
      };
      news: {
        Row: NewsRow;
        Insert: Omit<NewsRow, "id" | "created_at" | "updated_at" | "views_count"> & { id?: string };
        Update: Partial<NewsRow>;
        Relationships: any[];
      };
      team_members: {
        Row: TeamMemberRow;
        Insert: Omit<TeamMemberRow, "id" | "created_at" | "updated_at"> & { id?: string };
        Update: Partial<TeamMemberRow>;
        Relationships: any[];
      };
      contact_messages: {
        Row: ContactMessageRow;
        Insert: Omit<ContactMessageRow, "id" | "created_at" | "status"> & { id?: string };
        Update: Partial<ContactMessageRow>;
        Relationships: any[];
      };
      volunteer_applications: {
        Row: VolunteerApplicationRow;
        Insert: Omit<VolunteerApplicationRow, "id" | "created_at" | "status"> & { id?: string };
        Update: Partial<VolunteerApplicationRow>;
        Relationships: any[];
      };
      impact_stats: {
        Row: ImpactStatRow;
        Insert: Omit<ImpactStatRow, "id" | "updated_at"> & { id?: string };
        Update: Partial<ImpactStatRow>;
        Relationships: any[];
      };
      testimonials: {
        Row: TestimonialRow;
        Insert: Omit<TestimonialRow, "id" | "created_at" | "updated_at"> & { id?: string };
        Update: Partial<TestimonialRow>;
        Relationships: any[];
      };
      gallery_items: {
        Row: GalleryItemRow;
        Insert: Omit<GalleryItemRow, "id" | "created_at" | "updated_at"> & { id?: string };
        Update: Partial<GalleryItemRow>;
        Relationships: any[];
      };
      membership_applications: {
        Row: MembershipApplicationRow;
        Insert: Omit<MembershipApplicationRow, "id" | "created_at" | "updated_at" | "application_number" | "status" | "reviewer_notes" | "reviewed_at"> & { id?: string };
        Update: Partial<MembershipApplicationRow>;
        Relationships: any[];
      };
    };
    Views: { [_ in never]: never };
    Functions: { [_ in never]: never };
    Enums: {
      project_status:     ProjectStatus;
      project_category:   ProjectCategory;
      news_category:      NewsCategory;
      contact_status:     ContactStatus;
      volunteer_status:   VolunteerStatus;
      team_role:          TeamRole;
      testimonial_status: TestimonialStatus;
      membership_type:    MembershipType;
      membership_status:  MembershipStatus;
      education_level:    EducationLevel;
    };
    CompositeTypes: { [_ in never]: never };
  };
}
