# WebStudio V6.7 — CRM / Telegram Integration Plan

Status: READY_FOR_REVIEW / PLAN_ONLY / OWNER_APPROVAL_REQUIRED.

Scope: static sanitized architecture for Telegram intake, CRM/Sheets sync, Supabase backend writes, approval gates, secrets names without values, rollout and rollback.

Hard stops: no live Telegram token use, no CRM/Sheets/email writes, no Supabase live data writes except optional non-sensitive ops/status row, no secrets, no .env/auth/hosts/token printing, no browser-side service keys, no destructive Supabase changes.

## Architecture
1. Telegram intake receives approved client answers.
2. Sanitizer validates source and strips private/sensitive content from logs.
3. Owner approval queue blocks all downstream live writes.
4. CRM/Sheets writer prepares dry-run rows with idempotency.
5. Supabase writer remains backend-only and migration-gated.
6. Audit trail records non-sensitive status and rollback markers.
