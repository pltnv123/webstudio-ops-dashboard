# WebStudio V3.7 — Supabase Status Update

Status: PASS

## Row written
- table: `public.webstudio_ops_status`
- row id: `ac5a2004-d0c4-447a-b9df-43466c880d61`
- component: `webstudio-lead-to-order-handoff`
- version: `v3.7`
- status: `DEPLOYED`
- git_commit: `9e8d47e405debaf169aff692162ff54db948cc84`
- deployment_target: https://pltnv123.github.io/webstudio-ops-dashboard/lead-to-order-handoff/
- notes: Lead to Order Handoff deployed; GitHub Actions success; route HTTP 200; safe static sanitized handoff; no live external writes.

## Verification
Select by row id/component/version/status/commit returned the inserted row.

## Safety
No migration, no destructive SQL, no real client data, no browser-side service key, no CRM/Telegram/email writes.
