# Client-Safe Preview Design — WebStudio V5.1

Status: READY_FOR_DEMO

## Goal
Upgrade the generated demo website into a client-safe preview mode that makes demo/ready/missing states explicit before any public or client-facing use.

## Preview model
- Static sanitized snapshot only.
- The preview links back to `/one-click-demo-assembly/` and explains what is demo, what is ready, and what needs real assets.
- Each section shows placeholder labels, real asset requirements, approval gates, and safe copy boundaries.
- Owner decision panel separates approved preview from blocked public launch.

## Safety boundaries
No private client data, live upload, live submission, CRM/email/Telegram/payment writes, browser-side secrets, fake testimonials/proof, or medical/legal overclaims.
