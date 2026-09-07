-- SentinelGrid database schema (PostgreSQL / Supabase-ready).
-- Mirrors src/lib/sentinel/types.ts one-to-one.
--
-- Chain: devices -> sensor_readings -> tests -> chembuddy_analyses
--        -> evidence_reports -> detection_events

create type app_role         as enum ('officer','analyst','supervisor','admin');
create type device_status    as enum ('online','offline','maintenance','syncing');
create type sensor_health    as enum ('nominal','degraded','fault');
create type substance_category as enum ('opioid','stimulant','cannabinoid','adulterant','precursor','benign','unknown');
create type risk_level       as enum ('critical','high','moderate','low');
create type test_status      as enum ('positive','negative','inconclusive','processing');
create type alert_type       as enum ('high_confidence_detection','repeated_detections','emerging_hotspot','sensor_disagreement','device_offline','unusual_pattern');
create type alert_status     as enum ('open','acknowledged','resolved');

-- Roles live in their own table (never on a profile row) to prevent escalation.
create table public.user_roles (
  id      uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  role    app_role not null,
  unique (user_id, role)
);
grant select on public.user_roles to authenticated;
grant all    on public.user_roles to service_role;
alter table public.user_roles enable row level security;

create or replace function public.has_role(_user_id uuid, _role app_role)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.user_roles where user_id = _user_id and role = _role)
$$;

create policy "Users read own roles" on public.user_roles
  for select to authenticated using (auth.uid() = user_id);

-- Authorized personnel (no PII beyond operational identity).
create table public.operators (
  id             uuid primary key references auth.users(id) on delete cascade,
  badge_id       text not null unique,
  display_name   text not null,
  unit           text not null,
  last_active_at timestamptz not null default now()
);
grant select, update on public.operators to authenticated;
grant all on public.operators to service_role;
alter table public.operators enable row level security;
create policy "Operators read directory" on public.operators for select to authenticated using (true);
create policy "Operators update self"    on public.operators for update to authenticated using (auth.uid() = id);

-- Anonymized zones; coordinates are coarsened to ~250 m before insert.
create table public.locations (
  id       uuid primary key default gen_random_uuid(),
  zone     text not null,
  district text not null,
  lat      double precision not null,
  lng      double precision not null
);
grant select on public.locations to authenticated, anon;
grant all on public.locations to service_role;
alter table public.locations enable row level security;
create policy "Locations are readable" on public.locations for select using (true);

create table public.devices (
  id               text primary key,                 -- e.g. SG-D01
  label            text not null,
  status           device_status not null default 'offline',
  battery_pct      int not null default 0 check (battery_pct between 0 and 100),
  last_sync_at     timestamptz,
  firmware_version text not null default '0.0.0',
  tests_performed  int not null default 0,
  assigned_unit    text,
  location_id      uuid references public.locations(id)
);
grant select on public.devices to authenticated;
grant all on public.devices to service_role;
alter table public.devices enable row level security;
create policy "Personnel read devices" on public.devices for select to authenticated using (true);
create policy "Admins manage devices"  on public.devices for all to authenticated
  using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));

create table public.device_sensors (
  id             uuid primary key default gen_random_uuid(),
  device_id      text not null references public.devices(id) on delete cascade,
  sensor_key     text not null,                      -- as7341 | mq3
  name           text not null,
  sensor_type    text not null,                      -- spectral | gas
  health         sensor_health not null default 'nominal',
  current_reading text,
  calibrated_at  timestamptz,
  unique (device_id, sensor_key)
);
grant select on public.device_sensors to authenticated;
grant all on public.device_sensors to service_role;
alter table public.device_sensors enable row level security;
create policy "Personnel read sensors" on public.device_sensors for select to authenticated using (true);

create table public.tests (
  id               text primary key,                 -- TST-2026-0001
  device_id        text not null references public.devices(id),
  operator_id      uuid references public.operators(id),
  location_id      uuid references public.locations(id),
  created_at       timestamptz not null default now(),
  status           test_status not null default 'processing',
  category         substance_category not null default 'unknown',
  substance_label  text,
  confidence       numeric(4,3) check (confidence between 0 and 1),
  risk_level       risk_level not null default 'low',
  sample_form      text
);
grant select, insert, update on public.tests to authenticated;
grant all on public.tests to service_role;
alter table public.tests enable row level security;
create policy "Personnel read tests" on public.tests for select to authenticated using (true);
create policy "Operators log tests"  on public.tests for insert to authenticated with check (auth.uid() = operator_id);
create index on public.tests (created_at desc);
create index on public.tests (device_id);

create table public.sensor_readings (
  id               uuid primary key default gen_random_uuid(),
  test_id          text references public.tests(id) on delete cascade,
  device_id        text not null references public.devices(id),
  captured_at      timestamptz not null default now(),
  spectral         jsonb not null,                   -- [{channel,nm,live,reference}]
  gas_ppm          numeric,
  gas_baseline_ppm numeric,
  temperature_c    numeric,
  humidity_pct     numeric
);
grant select, insert on public.sensor_readings to authenticated;
grant all on public.sensor_readings to service_role;
alter table public.sensor_readings enable row level security;
create policy "Personnel read readings" on public.sensor_readings for select to authenticated using (true);

create table public.chembuddy_analyses (
  id                uuid primary key default gen_random_uuid(),
  test_id           text not null unique references public.tests(id) on delete cascade,
  model_version     text not null,
  classification    text not null,
  category          substance_category not null,
  confidence        numeric(4,3),
  sensor_agreement  numeric(4,3),
  inconclusive      boolean not null default false,
  detected_features jsonb not null default '[]',
  reasoning         jsonb not null default '[]',
  recommendation    text,
  created_at        timestamptz not null default now()
);
grant select, insert on public.chembuddy_analyses to authenticated;
grant all on public.chembuddy_analyses to service_role;
alter table public.chembuddy_analyses enable row level security;
create policy "Personnel read analyses" on public.chembuddy_analyses for select to authenticated using (true);

create table public.evidence_reports (
  id               uuid primary key default gen_random_uuid(),
  test_id          text not null references public.tests(id) on delete cascade,
  reference_code   text not null unique,
  generated_at     timestamptz not null default now(),
  generated_by     uuid references public.operators(id),
  chain_of_custody jsonb not null default '[]',
  disclaimer       text not null
);
grant select, insert on public.evidence_reports to authenticated;
grant all on public.evidence_reports to service_role;
alter table public.evidence_reports enable row level security;
create policy "Personnel read reports" on public.evidence_reports for select to authenticated using (true);
create policy "Supervisors issue reports" on public.evidence_reports for insert to authenticated
  with check (public.has_role(auth.uid(),'supervisor') or public.has_role(auth.uid(),'admin'));

create table public.alerts (
  id              uuid primary key default gen_random_uuid(),
  alert_type      alert_type not null,
  severity        risk_level not null,
  created_at      timestamptz not null default now(),
  location_id     uuid references public.locations(id),
  reason          text not null,
  status          alert_status not null default 'open',
  related_test_id text references public.tests(id),
  device_id       text references public.devices(id)
);
grant select, update on public.alerts to authenticated;
grant all on public.alerts to service_role;
alter table public.alerts enable row level security;
create policy "Personnel read alerts"   on public.alerts for select to authenticated using (true);
create policy "Personnel triage alerts" on public.alerts for update to authenticated using (true) with check (true);

-- Anonymized, map-facing projection. Carries no operator identity.
create table public.detection_events (
  id              uuid primary key default gen_random_uuid(),
  test_id         text not null references public.tests(id) on delete cascade,
  device_id       text not null references public.devices(id),
  location_id     uuid references public.locations(id),
  occurred_at     timestamptz not null,
  category        substance_category not null,
  substance_label text,
  confidence      numeric(4,3),
  risk_level      risk_level not null,
  status          test_status not null
);
grant select on public.detection_events to authenticated, anon;
grant all on public.detection_events to service_role;
alter table public.detection_events enable row level security;
create policy "Anonymized events are readable" on public.detection_events for select using (true);
create index on public.detection_events (occurred_at desc);
