# WebStudio V4.8 Commercial Polish Plan

Generated: 2026-06-04T09:45:05.851480+00:00

## Public-facing
- Root `/`: public product dashboard explaining WebStudio and its safe static demo journey.
- `/webstudio-showcase/`: public showcase for the commercial product story.
- `/pricing-packages/`: package catalog with custom-quote/demo-only wording.
- Demo journey routes: `/lead-capture-demo/`, `/order-builder/`, `/order-package-generator/`, `/website-page-builder/`, `/one-click-demo-assembly/`, `/client-handoff-pack/`.
- `/route-health/`: public route visibility and post-deploy regression index.

## Owner/internal
- `/work-factory/`, `/owner-command-center/`, `/bot-activity/`, `/supabase-memory/`, `/health/`, `/artifacts/`, `/audit/` remain owner/ops surfaces.
- They are linked for proof/operations, not marketed as client-facing flows.

## Demo-only
- Lead capture, order shaping, package generation, page builder, demo assembly, revision requests, and handoff pack are static/sanitized.
- No real private client data, no browser-side secrets, no CRM/email/Telegram/payment writes.

## Approval required before live usage
- Real client identity/content/assets.
- Production contact destination.
- Live CRM/email/Telegram/Supabase/payment writes.
- Public launch claims, final package price/timeline, legal/medical/regulatory wording.
