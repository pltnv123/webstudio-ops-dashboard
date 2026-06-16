# WebStudio Client #004 v34.2 — Production Verification

Generated: 2026-05-26T07:34:22Z

## Verdict

**Status:** BLOCKED_FOR_CLIENT_DEMO

Production page opens from the deployed host path and renders the v34 prototype shell, but browser resource evidence shows all six deployed SVG concept visuals fail to load from the production path. This is not a v34 redesign issue: the source `/workspace/output/webstudio-client-004-premium-site-v34/assets/` contains the SVG assets, but the deployed production path served to the browser does not provide them correctly.

## Production path

`/home/hermes/.hermes/host-bridge/deploy/production/webstudio-client-004-premium-site-v34`

Browser URL: `file:///home/hermes/.hermes/host-bridge/deploy/production/webstudio-client-004-premium-site-v34/index.html`

## Required checks

- `index.html`: PASS — browser loaded title `Vita Prime Dental — premium prototype v34`.
- `styles.css`: PASS — linked stylesheet rendered page.
- `app.js`: PASS — CDP resource tree shows script content size 649 bytes.
- `assets`: **FAIL in production browser** — 6 SVG image resources failed.
- MP4/motion: GATED — no video tag on page; v34 MP4 artifacts exist as approval-gated motion assets.
- Broken local-only paths: PASS — DOM scan found no `/workspace`, `localhost`, `127.0.0.1`, `tmp/` links.
- Raw debug: PASS — DOM/console scan found no raw debug markers or console errors.
- Fake medical proof: PASS — generated/planned/approval states are visible; no fake medical proof is claimed as real.
- Asset state: PASS — generated/demo/planned/publication-gated labels visible.
- Reduced motion fallback: PASS in source — `prefers-reduced-motion` CSS and `matchMedia` JS present.
- Desktop/mobile layout: PASS structurally, with no horizontal scroll in checked viewports; blocked only by failed production asset resources.

## Failed production resources

- `/home/hermes/.hermes/host-bridge/deploy/production/webstudio-client-004-premium-site-v34/assets/webstudio-client-004-visual-consultation-v34.svg`
- `/home/hermes/.hermes/host-bridge/deploy/production/webstudio-client-004-premium-site-v34/assets/webstudio-client-004-visual-certificates-v34.svg`
- `/home/hermes/.hermes/host-bridge/deploy/production/webstudio-client-004-premium-site-v34/assets/webstudio-client-004-visual-hero-v34.svg`
- `/home/hermes/.hermes/host-bridge/deploy/production/webstudio-client-004-premium-site-v34/assets/webstudio-client-004-visual-interior-v34.svg`
- `/home/hermes/.hermes/host-bridge/deploy/production/webstudio-client-004-premium-site-v34/assets/webstudio-client-004-visual-cases-v34.svg`
- `/home/hermes/.hermes/host-bridge/deploy/production/webstudio-client-004-premium-site-v34/assets/webstudio-client-004-visual-doctors-v34.svg`

## Source asset inventory

- `webstudio-client-004-visual-cases-v34.svg` — 3256 bytes — `3fb478f8a6cf8156…`
- `webstudio-client-004-visual-certificates-v34.svg` — 3238 bytes — `a0ab3a3ab236d45f…`
- `webstudio-client-004-visual-consultation-v34.svg` — 3226 bytes — `3e9ac943a8256284…`
- `webstudio-client-004-visual-doctors-v34.svg` — 3234 bytes — `7d1b9858a0677603…`
- `webstudio-client-004-visual-hero-v34.svg` — 3238 bytes — `c2f86128fdee506c…`
- `webstudio-client-004-visual-interior-v34.svg` — 3232 bytes — `0b744e0a19cef994…`

## Acceptance

- Owner/internal review: **YES_WITH_CLEAR_LIMITS**.
- Client demo: **NO until production asset copy/deploy is repaired**.
- Public launch: **NO**, still requires real medical assets, MP4 publication, medical/legal copy, Telegram route, and static hosting approvals.
