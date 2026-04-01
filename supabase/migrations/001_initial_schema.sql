-- Steelvow: Initial Schema
-- All tables use RLS with company_id isolation

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ============================================================
-- COMPANIES
-- ============================================================
create table companies (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  ein text,
  address text,
  state text,
  employee_count integer not null default 0,
  plan_tier text not null default 'starter' check (plan_tier in ('starter', 'pro', 'business')),
  stripe_customer_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table companies enable row level security;

create policy "Users can view own company"
  on companies for select
  using (id = (select raw_app_meta_data->>'company_id' from auth.users where id = auth.uid())::uuid);

create policy "Admins can update own company"
  on companies for update
  using (id = (select raw_app_meta_data->>'company_id' from auth.users where id = auth.uid())::uuid)
  with check (id = (select raw_app_meta_data->>'company_id' from auth.users where id = auth.uid())::uuid);

-- ============================================================
-- WORKERS
-- ============================================================
create table workers (
  id uuid primary key default uuid_generate_v4(),
  company_id uuid not null references companies(id) on delete cascade,
  name text not null,
  role text not null default 'worker',
  phone text,
  email text,
  language_pref text not null default 'en' check (language_pref in ('en', 'es')),
  osha_10_cert_date date,
  osha_30_cert_date date,
  fall_protection_cert_date date,
  forklift_cert_date date,
  first_aid_cert_date date,
  custom_certs jsonb default '{}',
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

alter table workers enable row level security;

create policy "Company members can view workers"
  on workers for select
  using (company_id = (select raw_app_meta_data->>'company_id' from auth.users where id = auth.uid())::uuid);

create policy "Admins can manage workers"
  on workers for all
  using (company_id = (select raw_app_meta_data->>'company_id' from auth.users where id = auth.uid())::uuid)
  with check (company_id = (select raw_app_meta_data->>'company_id' from auth.users where id = auth.uid())::uuid);

-- ============================================================
-- PROJECTS
-- ============================================================
create table projects (
  id uuid primary key default uuid_generate_v4(),
  company_id uuid not null references companies(id) on delete cascade,
  name text not null,
  address text,
  lat double precision,
  lng double precision,
  start_date date,
  end_date date,
  project_type text,
  status text not null default 'active' check (status in ('active', 'completed', 'paused')),
  created_at timestamptz not null default now()
);

alter table projects enable row level security;

create policy "Company members can view projects"
  on projects for select
  using (company_id = (select raw_app_meta_data->>'company_id' from auth.users where id = auth.uid())::uuid);

create policy "Admins can manage projects"
  on projects for all
  using (company_id = (select raw_app_meta_data->>'company_id' from auth.users where id = auth.uid())::uuid)
  with check (company_id = (select raw_app_meta_data->>'company_id' from auth.users where id = auth.uid())::uuid);

-- ============================================================
-- INSPECTIONS
-- ============================================================
create table inspections (
  id uuid primary key default uuid_generate_v4(),
  project_id uuid not null references projects(id) on delete cascade,
  company_id uuid not null references companies(id) on delete cascade,
  worker_id uuid not null references workers(id),
  checklist_type text not null check (checklist_type in ('general', 'fall_protection', 'scaffolding', 'excavation', 'electrical', 'ppe')),
  status text not null default 'draft' check (status in ('draft', 'completed', 'synced')),
  score integer,
  findings jsonb default '[]',
  completed_at timestamptz,
  synced_at timestamptz,
  offline_id uuid not null unique,
  created_at timestamptz not null default now()
);

alter table inspections enable row level security;

create policy "Company members can view inspections"
  on inspections for select
  using (company_id = (select raw_app_meta_data->>'company_id' from auth.users where id = auth.uid())::uuid);

create policy "Company members can create inspections"
  on inspections for insert
  with check (company_id = (select raw_app_meta_data->>'company_id' from auth.users where id = auth.uid())::uuid);

create policy "Company members can update inspections"
  on inspections for update
  using (company_id = (select raw_app_meta_data->>'company_id' from auth.users where id = auth.uid())::uuid);

-- ============================================================
-- INCIDENTS
-- ============================================================
create table incidents (
  id uuid primary key default uuid_generate_v4(),
  project_id uuid not null references projects(id) on delete cascade,
  company_id uuid not null references companies(id) on delete cascade,
  reported_by uuid not null references workers(id),
  incident_type text not null check (incident_type in ('injury', 'near_miss', 'property_damage')),
  severity text not null check (severity in ('minor', 'serious', 'fatal')),
  description text not null,
  location_description text,
  lat double precision,
  lng double precision,
  occurred_at timestamptz not null,
  osha_reportable boolean not null default false,
  root_cause text,
  corrective_actions jsonb default '[]',
  status text not null default 'open' check (status in ('open', 'investigating', 'closed')),
  photos text[] default '{}',
  offline_id uuid not null unique,
  created_at timestamptz not null default now()
);

alter table incidents enable row level security;

create policy "Company members can view incidents"
  on incidents for select
  using (company_id = (select raw_app_meta_data->>'company_id' from auth.users where id = auth.uid())::uuid);

create policy "Company members can create incidents"
  on incidents for insert
  with check (company_id = (select raw_app_meta_data->>'company_id' from auth.users where id = auth.uid())::uuid);

create policy "Company members can update incidents"
  on incidents for update
  using (company_id = (select raw_app_meta_data->>'company_id' from auth.users where id = auth.uid())::uuid);

-- ============================================================
-- TOOLBOX TALKS
-- ============================================================
create table toolbox_talks (
  id uuid primary key default uuid_generate_v4(),
  project_id uuid not null references projects(id) on delete cascade,
  company_id uuid not null references companies(id) on delete cascade,
  led_by uuid not null references workers(id),
  topic text not null,
  duration_minutes integer not null,
  attendees uuid[] default '{}',
  signatures jsonb default '{}',
  notes text,
  offline_id uuid not null unique,
  created_at timestamptz not null default now()
);

alter table toolbox_talks enable row level security;

create policy "Company members can view toolbox talks"
  on toolbox_talks for select
  using (company_id = (select raw_app_meta_data->>'company_id' from auth.users where id = auth.uid())::uuid);

create policy "Company members can create toolbox talks"
  on toolbox_talks for insert
  with check (company_id = (select raw_app_meta_data->>'company_id' from auth.users where id = auth.uid())::uuid);

-- ============================================================
-- PHOTOS
-- ============================================================
create table photos (
  id uuid primary key default uuid_generate_v4(),
  company_id uuid not null references companies(id) on delete cascade,
  project_id uuid not null references projects(id) on delete cascade,
  inspection_id uuid references inspections(id) on delete set null,
  incident_id uuid references incidents(id) on delete set null,
  storage_path text not null,
  lat double precision,
  lng double precision,
  captured_at timestamptz not null,
  captured_by uuid not null references workers(id),
  caption text,
  offline_id uuid not null unique,
  created_at timestamptz not null default now()
);

alter table photos enable row level security;

create policy "Company members can view photos"
  on photos for select
  using (company_id = (select raw_app_meta_data->>'company_id' from auth.users where id = auth.uid())::uuid);

create policy "Company members can upload photos"
  on photos for insert
  with check (company_id = (select raw_app_meta_data->>'company_id' from auth.users where id = auth.uid())::uuid);

-- ============================================================
-- OSHA 300 ENTRIES
-- ============================================================
create table osha_300_entries (
  id uuid primary key default uuid_generate_v4(),
  company_id uuid not null references companies(id) on delete cascade,
  incident_id uuid not null references incidents(id) on delete cascade,
  case_number text not null,
  employee_name text not null,
  job_title text not null,
  date_of_injury date not null,
  description text not null,
  classification text not null,
  days_away integer not null default 0,
  days_restricted integer not null default 0,
  death boolean not null default false,
  year integer not null,
  created_at timestamptz not null default now()
);

alter table osha_300_entries enable row level security;

create policy "Company members can view osha 300"
  on osha_300_entries for select
  using (company_id = (select raw_app_meta_data->>'company_id' from auth.users where id = auth.uid())::uuid);

create policy "Company members can manage osha 300"
  on osha_300_entries for all
  using (company_id = (select raw_app_meta_data->>'company_id' from auth.users where id = auth.uid())::uuid);

-- ============================================================
-- SAFETY PROGRAMS
-- ============================================================
create table safety_programs (
  id uuid primary key default uuid_generate_v4(),
  company_id uuid not null references companies(id) on delete cascade,
  program_type text not null check (program_type in ('fall_protection', 'hazcom', 'respiratory', 'loto', 'heat')),
  content text not null,
  language text not null default 'en' check (language in ('en', 'es')),
  version integer not null default 1,
  generated_by text not null default 'manual' check (generated_by in ('ai', 'manual')),
  last_reviewed_at timestamptz,
  created_at timestamptz not null default now()
);

alter table safety_programs enable row level security;

create policy "Company members can view safety programs"
  on safety_programs for select
  using (company_id = (select raw_app_meta_data->>'company_id' from auth.users where id = auth.uid())::uuid);

create policy "Company members can manage safety programs"
  on safety_programs for all
  using (company_id = (select raw_app_meta_data->>'company_id' from auth.users where id = auth.uid())::uuid);

-- ============================================================
-- INDEXES
-- ============================================================
create index idx_workers_company on workers(company_id);
create index idx_projects_company on projects(company_id);
create index idx_inspections_company on inspections(company_id);
create index idx_inspections_project on inspections(project_id);
create index idx_inspections_offline on inspections(offline_id);
create index idx_incidents_company on incidents(company_id);
create index idx_incidents_project on incidents(project_id);
create index idx_incidents_offline on incidents(offline_id);
create index idx_toolbox_talks_company on toolbox_talks(company_id);
create index idx_toolbox_talks_offline on toolbox_talks(offline_id);
create index idx_photos_company on photos(company_id);
create index idx_photos_inspection on photos(inspection_id);
create index idx_photos_incident on photos(incident_id);
create index idx_osha_300_company_year on osha_300_entries(company_id, year);
create index idx_safety_programs_company on safety_programs(company_id);

-- ============================================================
-- UPDATED_AT TRIGGER (for companies)
-- ============================================================
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger companies_updated_at
  before update on companies
  for each row execute function update_updated_at();
