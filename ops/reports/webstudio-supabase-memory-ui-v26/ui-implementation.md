# UI Implementation — WebStudio V2.6 Supabase Memory

## Implemented

- Added navigation route `#supabase-memory` / `/supabase-memory/`.
- Added dashboard page title: `Supabase Memory`.
- Added cards for current delivery loop, latest ops rows, jobs, artifacts, memory index, latest commit/deploy/Supabase heartbeat, and bot activity summary.
- Added static-safe Supabase snapshot under `public/data/webstudio-supabase-memory-snapshot.json`.
- Added `supabase_memory` projection to generated control-plane state.
- Added smoke assertions for route, state key, browser-side Supabase disabled, and visible ops rows.

## Data-source decision

Browser-side Supabase access is intentionally disabled for V2.6 because no publishable-key/RLS proof is committed in this static dashboard. The safe source is a sanitized build-time snapshot from Supabase MCP operational reads.

## Files changed

- `src/index.html`
- `src/app.js`
- `src/styles.css`
- `scripts/build_snapshot.py`
- `scripts/smoke_check.py`
- `public/data/webstudio-supabase-memory-snapshot.json`
