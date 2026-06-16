# Activity Feed Design — WebStudio V2.7

Status: PASS

## Goal

Expose a visible live-ish bot activity feed in the static WebStudio dashboard without browser-side secret access.

## UX model

- Route: `/bot-activity/` and hash `#bot-activity`.
- Main feed: normalized chronological activity rows from Supabase heartbeat rows, Supabase job rows, GitHub Pages runs, and recent Git commits.
- Status chips: PASS, PARTIAL, BLOCKED, DEPLOYED, RUNNING, QUEUED.
- Blockers panel: sanitized blockers list with an empty state when no blockers exist.
- Next safe action panel: owner/operator-safe continuation hint.
- Links: Supabase Memory route, GitHub repository, latest Pages run.

## Data safety

The browser reads only generated static JSON. No Supabase keys, GitHub tokens, service-role secrets, env values, raw memory, or private payload bodies are embedded.
