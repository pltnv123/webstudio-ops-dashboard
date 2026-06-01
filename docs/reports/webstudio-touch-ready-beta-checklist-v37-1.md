# WebStudio Touch-ready Beta Checklist v37.1

Generated: `2026-05-26T16:25:17.609853Z`

## 1. Что owner может открыть сейчас
- Ops Cockpit static: `/workspace/output/webstudio-ops-dashboard-static/index.html`
- Premium Factory v34: `#premium-factory-v34`
- Error Recovery panel: `#error-recovery`
- Client #004 demo artifacts: `/workspace/output/webstudio-client-004-presentation-pack-v34.html` and production deployed path below.

## 2. Где Client #004 demo
- Production deployed path: `/home/hermes/.hermes/host-bridge/deploy/production/webstudio-client-004-premium-site-v34`
- Presentation pack: `/workspace/output/webstudio-client-004-presentation-pack-v34.html`
- Public/live launch remains approval-gated.

## 3. Где Ops Cockpit
- Static build: `/workspace/output/webstudio-ops-dashboard-static/index.html`
- Repo source: `/workspace/tmp/webstudio-ops-dashboard-pr/src/index.html`

## 4. Где Premium Factory panel
- Ops Cockpit route: `#premium-factory-v34`
- Day 1 panel is included in the Premium Factory v34 route.

## 5. Где Motion Factory panel
- Ops Cockpit route: `#motion-factory`
- MP4 publication is gated: approve/replace before public use.

## 6. Где Client Intake / Order Builder
- Ops Cockpit route: `#intake-orders`
- Premium Generator route: `#premium-generator`

## 7. Какие действия можно делать руками
- Открывать демо/панели.
- Проверять визуально: premium feel, mobile layout, CTA, trust path.
- Читать presentation pack и owner approval packet.
- Копировать owner-safe next steps из Ops Cockpit.

## 8. Что пока нельзя делать без approval
- Public/static launch.
- Использование generated medical visuals как реальные доказательства.
- Публикация MP4/social teaser.
- Medical/legal copy в public.
- Live Telegram token / CRM / Sheets / Supabase writes / payments.

## 9. Known issues
- Sandbox GitHub Auto-Push не имеет auth/gh; recovery path: Host Runner Auto-Push, owner manual push не требуется.
- QMD vector embeddings не запускать без approval; keyword update/search работает.
- Host snapshot asynchronous: hfinalize creates request, host processor handles.

## 10. Что будет готово
- Сейчас: owner-touchable beta панели + Client #004 demo/presentation + error recovery panel.
- 24h: Day 2 Visual Sourcing Engine initial registry/shotlist and asset legitimacy model.
- 72h: business-specific visual sourcing packs for several verticals + QA-ready source matrix.
- 7 days: repeatable Premium Website Factory pipeline with intake → concepts → motion → QA → handoff.
