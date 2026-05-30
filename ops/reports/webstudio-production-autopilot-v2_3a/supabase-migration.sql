-- WebStudio Production Autopilot V2.3A operational memory/state tables
-- Scope: public.webstudio_ops_status, public.webstudio_jobs, public.webstudio_artifacts, public.webstudio_memory_index
-- Approved by owner for WebStudio operational memory/state writes.

create table if not exists public.webstudio_ops_status (
  id uuid primary key default gen_random_uuid(),
  component text not null,
  status text not null,
  version text not null,
  repo_path text not null,
  git_commit text not null,
  deployment_target text not null,
  qmd_status text not null,
  host_health text not null,
  notes text,
  created_at timestamptz not null default now()
);

create index if not exists webstudio_ops_status_component_created_at_idx
  on public.webstudio_ops_status (component, created_at desc);

alter table public.webstudio_ops_status enable row level security;

comment on table public.webstudio_ops_status is
  'WebStudio operational heartbeat/current-state rows. Backend/service-role only; no public RLS policies.';

create table if not exists public.webstudio_jobs (
  id uuid primary key default gen_random_uuid(),
  job_key text not null unique,
  title text not null,
  status text not null default 'pending',
  priority integer not null default 100,
  payload jsonb not null default '{}'::jsonb,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists webstudio_jobs_status_priority_idx
  on public.webstudio_jobs (status, priority, created_at desc);

alter table public.webstudio_jobs enable row level security;

comment on table public.webstudio_jobs is
  'WebStudio operational job metadata. Backend/service-role only; payload must contain non-sensitive metadata only.';

create table if not exists public.webstudio_artifacts (
  id uuid primary key default gen_random_uuid(),
  artifact_key text not null unique,
  artifact_type text not null,
  path text not null,
  status text not null default 'available',
  metadata jsonb not null default '{}'::jsonb,
  notes text,
  created_at timestamptz not null default now()
);

create index if not exists webstudio_artifacts_type_created_at_idx
  on public.webstudio_artifacts (artifact_type, created_at desc);

alter table public.webstudio_artifacts enable row level security;

comment on table public.webstudio_artifacts is
  'WebStudio artifact index. Store paths and non-sensitive metadata, not raw secrets/logs.';

create table if not exists public.webstudio_memory_index (
  id uuid primary key default gen_random_uuid(),
  memory_key text not null unique,
  scope text not null,
  summary text not null,
  source_path text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists webstudio_memory_index_scope_created_at_idx
  on public.webstudio_memory_index (scope, created_at desc);

alter table public.webstudio_memory_index enable row level security;

comment on table public.webstudio_memory_index is
  'WebStudio operational memory index. Summaries and non-sensitive pointers only.';
