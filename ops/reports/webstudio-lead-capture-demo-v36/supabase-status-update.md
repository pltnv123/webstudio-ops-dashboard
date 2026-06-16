# WebStudio V3.6 Supabase Status Update

Status: BLOCKED_TOOLING

## Intended non-sensitive row
- table: `public.webstudio_ops_status`
- component: `webstudio-lead-capture-demo`
- version: `v3.6`
- status: `DEPLOYED`
- route: `https://pltnv123.github.io/webstudio-ops-dashboard/lead-capture-demo/`
- commit: `5230adcbe4a84afe25572d56610e0fdff172b7a4`
- notes: safe static demo; no live submission; no browser-side secrets; no real private data.

## Result
Supabase row was **not written** in this run because the Supabase MCP server returned:

```text
MCP server 'supabase' is not connected
```

No fallback credential was available in the Docker environment, and no secrets were printed or guessed. Schema work remains proposal-only in `supabase-schema-proposal.md`.
