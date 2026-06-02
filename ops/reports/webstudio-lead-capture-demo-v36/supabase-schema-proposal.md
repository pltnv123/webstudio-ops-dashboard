# WebStudio V3.6 Supabase Schema Proposal — Future Real Lead Capture

Status: PROPOSAL_ONLY_NOT_APPLIED

## Reason
Future real lead capture needs backend-only persistence, qualification history, and safe dashboard visibility. V3.6 does not apply this migration.

## Affected objects
- proposed table: `public.webstudio_lead_requests`
- proposed table: `public.webstudio_lead_qualification_events`
- proposed RLS policies: service-role/backend insert/update, owner dashboard read through approved backend only

## Security model
- Service role is backend-only; never browser-side.
- Browser receives only anon-safe submit endpoint in future backend, not direct table writes.
- Real PII requires explicit approval, retention policy, redaction, and owner-facing privacy copy.

## Migration proposal — not executed
```sql
-- PROPOSAL ONLY. Do not run without explicit owner approval.
create table if not exists public.webstudio_lead_requests (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  source text not null default 'webstudio_lead_capture',
  status text not null default 'new',
  business_type text not null,
  project_goal text not null,
  website_or_service_needed text not null,
  budget_range text,
  timeline text,
  current_website text,
  required_pages text[] not null default '{}',
  content_assets_readiness text,
  preferred_contact_method text,
  notes_sanitized text,
  safety_flags jsonb not null default '{"pii_review_required":true,"external_writes":false}'::jsonb
);

alter table public.webstudio_lead_requests enable row level security;
revoke all on public.webstudio_lead_requests from anon, authenticated;

create table if not exists public.webstudio_lead_qualification_events (
  id uuid primary key default gen_random_uuid(),
  lead_request_id uuid not null references public.webstudio_lead_requests(id) on delete cascade,
  created_at timestamptz not null default now(),
  score integer not null check (score between 0 and 100),
  routes text[] not null default '{}',
  next_safe_action text not null,
  evaluator_version text not null
);

alter table public.webstudio_lead_qualification_events enable row level security;
revoke all on public.webstudio_lead_qualification_events from anon, authenticated;
```

## Rollback proposal
```sql
-- PROPOSAL ONLY.
drop table if exists public.webstudio_lead_qualification_events;
drop table if exists public.webstudio_lead_requests;
```

## Verification queries
```sql
select table_name from information_schema.tables where table_schema='public' and table_name like 'webstudio_lead_%';
select schemaname, tablename, rowsecurity from pg_tables where schemaname='public' and tablename like 'webstudio_lead_%';
```

## V3.6 actual DB action
Only a non-sensitive ops/status row may be written after deploy verification.
