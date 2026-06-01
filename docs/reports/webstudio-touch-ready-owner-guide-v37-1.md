# WebStudio Touch-ready Owner Guide v37.1

Generated: `2026-05-26T16:25:17.609853Z`

## Когда можно потрогать руками
**Сейчас.** Открывай Ops Cockpit static build и Client #004 presentation pack. Это beta для owner-review: можно смотреть, кликать, проверять логику и визуальный слой. Public launch пока approval-gated.

## Что открыть
- Ops Cockpit: `/workspace/output/webstudio-ops-dashboard-static/index.html`
- Error Recovery: `#error-recovery`
- Premium Factory v34 / Day 1: `#premium-factory-v34`
- Motion Factory: `#motion-factory`
- Intake / Order Builder: `#intake-orders`
- Client #004 presentation: `/workspace/output/webstudio-client-004-presentation-pack-v34.html`
- Production deployed directory: `/home/hermes/.hermes/host-bridge/deploy/production/webstudio-client-004-premium-site-v34`

## Как оценивать
PASS если:
- главные панели открываются без console errors;
- нет горизонтального скролла на desktop/mobile;
- owner-facing view на русском и без raw/debug в main UI;
- Client #004 показывает premium direction, CTA, trust path, generated-vs-real asset gates;
- Error Recovery показывает recovery path без owner manual action для routine ошибок.

## Что ещё в работе
- Day 2 Visual Sourcing Engine: registry/shotlist/source legitimacy.
- Расширение business-specific visual packs.
- Host Runner Auto-Push verification для sandbox-blocked commits.

## Approval gates
1. Generated concept visuals — demo only.
2. Real clinic/doctor/certificate/case assets before public launch.
3. MP4 background/social teaser approve or replace.
4. Medical/legal copy approval.
5. Telegram CTA route approval.
6. Public static hosting launch approval if external URL is needed.

## Next steps
- Сейчас: owner review/touch beta.
- 24h: inspect Day 2 visual sourcing pack.
- 72h: review sourcing engine and vertical-specific visual packs.
- 7 days: evaluate full repeatable Premium Website Factory.
