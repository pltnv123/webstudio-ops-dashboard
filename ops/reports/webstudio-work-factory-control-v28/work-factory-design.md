# Work Factory Control Design — WebStudio V2.8

Status: PASS

- Route: `/work-factory/` and hash `#work-factory`.
- Metrics: queued, running, blocked, owner approvals, completed, Supabase status rows.
- Filters: status, component, time, text search.
- Chips: PASS, DEPLOYED, RUNNING, QUEUED, PARTIAL, BLOCKED, NEEDS_OWNER.
- Safety: read-only/copy-only, no browser-side Supabase/GitHub secrets.
