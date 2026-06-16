# WebStudio V3.7 — Lead Capture to Order Builder Handoff Design

Status: implemented locally

## Goal
Connect the V3.6 Lead Capture Demo to Order Builder through a safe static/sanitized handoff path:

`demo lead request → qualification preview → structured order payload → order-builder preview → next production action`

## Route
- `/lead-to-order-handoff/`
- marker: `lead-to-order-handoff-v37`

## UI sections
1. Hero / safety contract
2. Demo lead payload
3. Qualification preview
4. Recommended product line: `D1 website + D2 AI-intake bot + D3 automation`
5. Order-builder handoff payload
6. Missing production inputs
7. Next safe action
8. Links to `/order-builder/` and `/work-factory/`

## Safety constraints
- Sanitized static snapshot only.
- No real private client data.
- No live submission.
- No browser-side Supabase service key.
- No CRM/Telegram/email/payment writes.
- Supabase only receives a non-sensitive ops/status row after deploy verification.
