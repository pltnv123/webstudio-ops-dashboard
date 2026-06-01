# Owner Command Center v2.9 Design

- Route: `/owner-command-center/`
- Purpose: one screen for production status, next safe action, commits, latest Actions state, Supabase rows, blocked items, approvals, and roadmap.
- Data source: `public/data/webstudio-owner-command-center-snapshot.json` included in static build snapshot.
- Safety: static sanitized only; no browser-side Supabase or GitHub tokens.
