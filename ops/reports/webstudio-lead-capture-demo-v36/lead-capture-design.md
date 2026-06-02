# WebStudio V3.6 Lead Capture Demo Design

Status: DESIGN_READY

## Goal
Safe demo/MVP flow: demo visitor request → structured lead snapshot → qualification preview → Order Builder handoff → dashboard visibility.

## Safety contract
- Demo only — no live data is submitted.
- No real private client data: no real phone, email, address, payment, credentials, legal/medical details, or private company secrets.
- No Telegram/CRM/email/Sheets writes.
- No browser-side Supabase service keys or live Supabase writes.
- All fields are sanitized static demo values and browser local preview state only.

## Safe fields
- business_type
- project_goal
- website_or_service_needed
- budget_range
- timeline
- current_website
- required_pages
- content_assets_readiness
- preferred_contact_method_demo_placeholder
- notes_sanitized_demo_text

## UI flow
1. Visitor sees safety banner.
2. Demo form is prefilled with sanitized fixture values.
3. Button “Generate request preview” creates local client-side preview only.
4. Preview shows structured request summary and qualification score.
5. Handoff block links to `/order-builder/`, `/work-factory/`, `/bot-activity/`, `/supabase-memory/`.

## Markers
- `lead-capture-demo-v36`
- `Demo only`
- `D1 website`
- `D2 AI-intake bot`
- `D3 automation`
