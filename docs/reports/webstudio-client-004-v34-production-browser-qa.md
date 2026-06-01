# Client #004 v34.2 — Production Browser QA

Generated: 2026-05-26T07:34:22Z

**Status:** BLOCKED_FOR_CLIENT_DEMO

## Production URL

`file:///home/hermes/.hermes/host-bridge/deploy/production/webstudio-client-004-premium-site-v34/index.html`

## Results

- Console errors: PASS — 0 errors.
- Horizontal scroll: PASS — none detected at 1920, 1440, 1366, 390.
- CTA: PASS — Telegram/header or hero CTA visible across viewports.
- Telegram path: PASS — `https://t.me/webstudio_demo?start=client004` present.
- Trust path: PASS — doctors/documents/interior/cases/consultation trust path present.
- Doctors/certificates/cases labels: PASS — generated/planned/approval/publication-gated labels visible.
- MP4/poster: PASS_AS_GATE — no video tag in page; MP4 assets remain publication-gated.
- Reduced motion: PASS in source CSS/JS.
- Premium feel: PARTIAL — premium typography/palette/layout are strong, but production broken images make it unfit as client demo.

## Viewport evidence

- 1920×1200: PASS layout / FAIL assets — `/home/hermes/.hermes/cache/screenshots/browser_screenshot_833779914fcf45c8bece1f8534e3f7fb.png`
- 1440×1000: PASS layout / FAIL assets — `/home/hermes/.hermes/cache/screenshots/browser_screenshot_1d975408f53e44eb8b8ed80781105add.png`
- 1366×900: PASS layout / FAIL assets — `/home/hermes/.hermes/cache/screenshots/browser_screenshot_18b41c5a2bb94977866615c32826e586.png`
- 390×900: PASS layout / FAIL assets — `/home/hermes/.hermes/cache/screenshots/browser_screenshot_ab65120128c54aec863ed532114b5646.png`

## Blocker

Browser resource tree reports six failed production SVG image resources. Until the deployed `assets/` folder is repaired, v34 production should not be presented as a client-facing demo.
