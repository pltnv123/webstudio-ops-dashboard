# WebStudio V3.8 — Order Package Generator Design

Status: implemented locally

## Goal
Convert a structured sanitized order/handoff into a complete production package:
- generated sitemap
- page-by-page briefs
- section copy outlines
- design direction
- SEO checklist
- asset checklist
- QA checklist
- delivery checklist
- next safe action

## Route
- `/order-package-generator/`
- marker: `order-package-generator-v38`

## Source
Uses the V3.7 static handoff/order payload as a sanitized snapshot. It does not read private client data and does not submit anything externally.

## UI structure
1. Hero and safety contract
2. Source demo lead/order
3. Generated sitemap
4. Page briefs cards
5. Section copy outlines
6. Design direction
7. SEO checklist
8. Asset checklist
9. QA checklist
10. Delivery checklist
11. Next safe action

## Links
- `/lead-to-order-handoff/`
- `/order-builder/`
- `/premium-factory-v34/`
- `/generated-demo-site-v35/`

## Safety
Static/sanitized demo only. No live form submission, no CRM/email/Telegram writes, no browser-side secrets, no destructive Supabase changes.
