# WebStudio Ops Cockpit

Durable GitHub home for the Hermes WebStudio production control plane.

This repository preserves the Ops Cockpit dashboard source, static preview, and hardening reports used to operate an automated web studio with a production Kanban board instead of a Done-only archive.

## Purpose

- Show the current WebStudio production pipeline.
- Surface active work, review queue, delivery queue, approvals, worker/agent health, GitHub readiness, snapshot/QMD state, and 12h marathon status.
- Keep dashboard and control-plane artifacts reviewable through GitHub PRs.

## Production pipeline

The production board uses logical WebStudio stages projected from Hermes control-plane state:

- Triage
- Todo
- Scheduled
- Ready
- In Progress
- Blocked
- Review
- Done
- Archived

Product lines:

- D1 — Landing pages / sites
- D2 — AI-intake Telegram bot
- D3 — Business automations

## Local build / smoke

From a workspace checkout with the same layout as the Hermes host:

```bash
npm run build
npm run smoke
```

The current dashboard build script emits a static preview to:

```text
/workspace/output/webstudio-ops-dashboard-static
```

A committed static preview may also exist under:

```text
docs/static-preview/
```

## Reports

Hardening and production-board reports are stored in:

```text
docs/reports/
```

## Notes

This repo is for dashboard/control-plane source and evidence artifacts. Runtime secrets, `.env` files, credentials, host-private logs, and tokens must never be committed.
