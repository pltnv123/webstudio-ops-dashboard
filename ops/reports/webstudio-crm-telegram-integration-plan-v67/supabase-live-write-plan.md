# Supabase Live Write Plan

Mode: OWNER_APPROVAL_REQUIRED.

- No migrations in V6.7.
- Future writes must be backend-only with service role stored server-side.
- Browser may only use anon key if a separate RLS-safe client-read scope is approved.
- Required before live: schema proposal, rollback SQL, RLS policy review, smoke insert/update in staging, advisor check.
