-- =================================================================
-- Diyala River Foundation for Sustainable Development
-- Supabase / PostgreSQL Database Schema
-- =================================================================
-- Run this script in the Supabase SQL Editor (in order).
-- Each section is idempotent (safe to re-run).
-- =================================================================


-- ─── 0. Extensions ────────────────────────────────────────────────
create extension if not exists "uuid-ossp";
create extension if not exists "pg_trgm";   -- fast LIKE / full-text search


-- ─── 1. Enumerations ──────────────────────────────────────────────

do $$ begin
  create type project_status   as enum ('planned','active','completed','on_hold');
exception when duplicate_object then null; end $$;

do $$ begin
  create type project_category as enum (
    'water_management','environmental','community',
    'research','education','health'
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create type news_category    as enum (
    'news','announcement','report','event','press_release'
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create type contact_status   as enum ('new','read','replied','archived');
exception when duplicate_object then null; end $$;

do $$ begin
  create type volunteer_status as enum ('pending','approved','rejected');
exception when duplicate_object then null; end $$;

do $$ begin
  create type team_role        as enum ('board','management','advisor','staff');
exception when duplicate_object then null; end $$;

do $$ begin
  create type testimonial_status as enum ('pending','approved','rejected');
exception when duplicate_object then null; end $$;


-- ─── 2. Helper function – updated_at trigger ──────────────────────

create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;


-- ─── 3. Table: team_members ────────────────────────────────────────

create table if not exists public.team_members (
  id               uuid primary key default uuid_generate_v4(),
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  full_name_ar     text        not null,
  full_name_en     text        not null,
  role             team_role   not null,
  title_ar         text        not null,
  title_en         text        not null,
  bio_ar           text,
  bio_en           text,
  avatar_path      text,                -- Supabase Storage path
  email            text,
  linkedin_url     text,
  display_order    int         not null default 0,
  is_active        boolean     not null default true
);

drop trigger if exists team_members_updated_at on public.team_members;
create trigger team_members_updated_at
  before update on public.team_members
  for each row execute function public.set_updated_at();

comment on table public.team_members is
  'Foundation board, management, advisors and staff directory.';


-- ─── 4. Table: projects ───────────────────────────────────────────

create table if not exists public.projects (
  id                  uuid             primary key default uuid_generate_v4(),
  created_at          timestamptz      not null default now(),
  updated_at          timestamptz      not null default now(),
  title_ar            text             not null,
  title_en            text             not null,
  slug                text             not null unique,
  description_ar      text             not null,
  description_en      text             not null,
  content_ar          text,
  content_en          text,
  status              project_status   not null default 'planned',
  category            project_category not null,
  cover_image_path    text,
  gallery_paths       text[],
  start_date          date,
  end_date            date,
  location_ar         text,
  location_en         text,
  beneficiaries_count integer          check (beneficiaries_count >= 0),
  budget_usd          numeric(14, 2)   check (budget_usd >= 0),
  is_featured         boolean          not null default false,
  tags                text[],
  external_url        text
);

-- Full-text search index (Arabic & English titles)
create index if not exists idx_projects_slug        on public.projects (slug);
create index if not exists idx_projects_status      on public.projects (status);
create index if not exists idx_projects_category    on public.projects (category);
create index if not exists idx_projects_is_featured on public.projects (is_featured);
create index if not exists idx_projects_title_trgm
  on public.projects using gin (title_ar gin_trgm_ops, title_en gin_trgm_ops);

drop trigger if exists projects_updated_at on public.projects;
create trigger projects_updated_at
  before update on public.projects
  for each row execute function public.set_updated_at();

comment on table public.projects is
  'All foundation projects – planned, active, and completed.';


-- ─── 5. Table: news ───────────────────────────────────────────────

create table if not exists public.news (
  id               uuid          primary key default uuid_generate_v4(),
  created_at       timestamptz   not null default now(),
  updated_at       timestamptz   not null default now(),
  title_ar         text          not null,
  title_en         text          not null,
  slug             text          not null unique,
  excerpt_ar       text          not null,
  excerpt_en       text          not null,
  body_ar          text,
  body_en          text,
  category         news_category not null default 'news',
  cover_image_path text,
  published_at     timestamptz,
  is_published     boolean       not null default false,
  is_featured      boolean       not null default false,
  author_id        uuid          references public.team_members (id) on delete set null,
  tags             text[],
  views_count      integer       not null default 0 check (views_count >= 0)
);

create index if not exists idx_news_slug         on public.news (slug);
create index if not exists idx_news_is_published on public.news (is_published);
create index if not exists idx_news_published_at on public.news (published_at desc);
create index if not exists idx_news_category     on public.news (category);
create index if not exists idx_news_title_trgm
  on public.news using gin (title_ar gin_trgm_ops, title_en gin_trgm_ops);

drop trigger if exists news_updated_at on public.news;
create trigger news_updated_at
  before update on public.news
  for each row execute function public.set_updated_at();

comment on table public.news is
  'News articles, announcements, and press releases.';


-- ─── 6. Table: contact_messages ───────────────────────────────────

create table if not exists public.contact_messages (
  id          uuid           primary key default uuid_generate_v4(),
  created_at  timestamptz    not null default now(),
  full_name   text           not null,
  email       text           not null,
  phone       text,
  subject     text           not null,
  message     text           not null,
  status      contact_status not null default 'new',
  ip_address  inet,
  user_agent  text
);

create index if not exists idx_contact_messages_status
  on public.contact_messages (status);

comment on table public.contact_messages is
  'Inbound contact form submissions. Sensitive – restricted to admins.';


-- ─── 7. Table: volunteer_applications ─────────────────────────────

create table if not exists public.volunteer_applications (
  id            uuid             primary key default uuid_generate_v4(),
  created_at    timestamptz      not null default now(),
  full_name     text             not null,
  email         text             not null,
  phone         text             not null,
  city          text             not null,
  age           integer          check (age between 16 and 100),
  skills        text,
  availability  text,
  motivation    text             not null,
  status        volunteer_status not null default 'pending'
);

comment on table public.volunteer_applications is
  'Volunteer sign-up forms. Restricted to admins.';


-- ─── 8. Table: testimonials ───────────────────────────────────────

create table if not exists public.testimonials (
  id            uuid               primary key default uuid_generate_v4(),
  created_at    timestamptz        not null default now(),
  updated_at    timestamptz        not null default now(),
  author_name_ar text              not null,
  author_name_en text              not null,
  role_ar       text               not null,
  role_en       text               not null,
  body_ar       text               not null,
  body_en       text               not null,
  rating        integer            not null check (rating between 1 and 5),
  status        testimonial_status not null default 'pending',
  source        text,
  avatar_path   text
);

drop trigger if exists testimonials_updated_at on public.testimonials;
create trigger testimonials_updated_at
  before update on public.testimonials
  for each row execute function public.set_updated_at();

create index if not exists idx_testimonials_status on public.testimonials (status);

comment on table public.testimonials is
  'Testimonials from partners, beneficiaries, and stakeholders.';


-- ─── 9. Table: gallery_items ──────────────────────────────────────

create table if not exists public.gallery_items (
  id            uuid        primary key default uuid_generate_v4(),
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  title_ar      text,
  title_en      text,
  image_path    text        not null,
  display_order int         not null default 0,
  is_active     boolean     not null default true
);

drop trigger if exists gallery_items_updated_at on public.gallery_items;
create trigger gallery_items_updated_at
  before update on public.gallery_items
  for each row execute function public.set_updated_at();

comment on table public.gallery_items is
  'Images for the main media gallery.';


-- ─── 10. Table: impact_stats ──────────────────────────────────────

create table if not exists public.impact_stats (
  id             uuid        primary key default uuid_generate_v4(),
  updated_at     timestamptz not null default now(),
  stat_key       text        not null unique,  -- e.g. "beneficiaries_total"
  value_number   numeric     not null,
  label_ar       text        not null,
  label_en       text        not null,
  icon_name      text        not null,          -- Lucide React icon name
  display_order  int         not null default 0
);

-- Seed default stats
insert into public.impact_stats (stat_key, value_number, label_ar, label_en, icon_name, display_order)
values
  ('beneficiaries_total', 25000, 'إجمالي المستفيدين',     'Total Beneficiaries',    'Users',        1),
  ('projects_completed',  47,    'مشاريع منجزة',           'Completed Projects',     'CheckCircle',  2),
  ('years_active',        8,     'سنوات من العمل',          'Years of Impact',        'Calendar',     3),
  ('partnerships',        15,    'شراكات استراتيجية',       'Strategic Partnerships', 'Globe2',       4)
on conflict (stat_key) do nothing;


-- ═════════════════════════════════════════════════════════════════
--  ROW LEVEL SECURITY (RLS) POLICIES
-- ═════════════════════════════════════════════════════════════════
-- Strategy:
--   • Public (anonymous) users  → SELECT only on public content
--   • Authenticated admins      → Full CRUD via service_role key
--     (Edge Functions use the service_role secret, never exposed)
-- ─────────────────────────────────────────────────────────────────

-- Enable RLS on every table
alter table public.team_members           enable row level security;
alter table public.projects               enable row level security;
alter table public.news                   enable row level security;
alter table public.contact_messages       enable row level security;
alter table public.volunteer_applications enable row level security;
alter table public.testimonials           enable row level security;
alter table public.gallery_items          enable row level security;
alter table public.impact_stats           enable row level security;


-- ── team_members ──────────────────────────────────────────────────
drop policy if exists "team_members: public read active" on public.team_members;
create policy "team_members: public read active"
  on public.team_members for select
  using (is_active = true);

drop policy if exists "team_members: admin full access" on public.team_members;
create policy "team_members: admin full access"
  on public.team_members for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');


-- ── projects ──────────────────────────────────────────────────────
drop policy if exists "projects: public read all" on public.projects;
create policy "projects: public read all"
  on public.projects for select
  using (true);

drop policy if exists "projects: admin full access" on public.projects;
create policy "projects: admin full access"
  on public.projects for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');


-- ── news ──────────────────────────────────────────────────────────
drop policy if exists "news: public read published" on public.news;
create policy "news: public read published"
  on public.news for select
  using (is_published = true and published_at <= now());

drop policy if exists "news: admin full access" on public.news;
create policy "news: admin full access"
  on public.news for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');


-- ── contact_messages ──────────────────────────────────────────────
-- Public: INSERT only (submit form)
drop policy if exists "contact_messages: public insert" on public.contact_messages;
create policy "contact_messages: public insert"
  on public.contact_messages for insert
  with check (true);

-- Admin: full access
drop policy if exists "contact_messages: admin full access" on public.contact_messages;
create policy "contact_messages: admin full access"
  on public.contact_messages for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');


-- ── volunteer_applications ────────────────────────────────────────
drop policy if exists "volunteer_applications: public insert" on public.volunteer_applications;
create policy "volunteer_applications: public insert"
  on public.volunteer_applications for insert
  with check (true);

drop policy if exists "volunteer_applications: admin full access" on public.volunteer_applications;
create policy "volunteer_applications: admin full access"
  on public.volunteer_applications for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');


-- ── testimonials ──────────────────────────────────────────────────
-- Public: read approved, insert pending
drop policy if exists "testimonials: public read approved" on public.testimonials;
create policy "testimonials: public read approved"
  on public.testimonials for select
  using (status = 'approved');

drop policy if exists "testimonials: public insert" on public.testimonials;
create policy "testimonials: public insert"
  on public.testimonials for insert
  with check (true);

drop policy if exists "testimonials: admin full access" on public.testimonials;
create policy "testimonials: admin full access"
  on public.testimonials for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');


-- ── gallery_items ─────────────────────────────────────────────────
drop policy if exists "gallery_items: public read active" on public.gallery_items;
create policy "gallery_items: public read active"
  on public.gallery_items for select
  using (is_active = true);

drop policy if exists "gallery_items: admin full access" on public.gallery_items;
create policy "gallery_items: admin full access"
  on public.gallery_items for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');


-- ── impact_stats ──────────────────────────────────────────────────
drop policy if exists "impact_stats: public read" on public.impact_stats;
create policy "impact_stats: public read"
  on public.impact_stats for select
  using (true);

drop policy if exists "impact_stats: admin full access" on public.impact_stats;
create policy "impact_stats: admin full access"
  on public.impact_stats for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');


-- ═════════════════════════════════════════════════════════════════
--  STORAGE BUCKETS  (run via Supabase Dashboard > Storage, or CLI)
-- ═════════════════════════════════════════════════════════════════
-- insert into storage.buckets (id, name, public)
-- values
--   ('projects', 'projects', true),
--   ('news',     'news',     true),
--   ('gallery',  'gallery',  true),
--   ('team',     'team',     true)
-- on conflict (id) do nothing;
--
-- -- Storage RLS: allow public read, admin write
-- create policy "projects bucket: public read"
--   on storage.objects for select
--   using (bucket_id = 'projects');
-- -- (repeat for news, gallery, team)
-- =================================================================
