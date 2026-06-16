# UI Implementation — V7.4

Changed files:
- `src/index.html`: added Portal Readiness nav link, hidden V7.4 static markers, and safe direct renderer for `/client-portal-readiness/`.
- `scripts/build_snapshot.py`: added direct static route generation for `/client-portal-readiness/`, `/webstudio-showcase/`, `/pricing-packages/`.
- `scripts/smoke_check.py`: added V7.4 markers and direct route checks.
- `ops/reports/webstudio-client-portal-readiness-audit-v74/*`: required audit, validation, link, safety, deploy, Supabase, and continuation reports.

No live writes, no real client data, no secrets, no CRM/email/Telegram/payment integrations.
