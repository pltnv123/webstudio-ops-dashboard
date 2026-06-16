# WebStudio V3.6 UI Implementation

Status: IMPLEMENTED_LOCAL

## Files changed
- `src/app.js` — added `/lead-capture-demo/` route, static sanitized lead snapshot, local preview generator, D1/D2/D3 qualification preview, handoff links.
- `src/index.html` — added nav tab.
- `src/styles.css` — added lead capture demo styling.
- `scripts/build_snapshot.py` — added `lead_capture_demo_v36` snapshot and direct route copy.
- `scripts/smoke_check.py` — added V3.6 route/state/marker safety checks.

## Safety
- No live submission.
- No external writes.
- No browser-side Supabase secrets.
- No real private client data.
