# V3.5 Component Map

## Source files
- `src/index.html`: navigation link for `#generated-demo-site-v35`.
- `src/app.js`: route registration, `generatedDemoSiteV35()` page renderer, links from Premium Factory v34 / Order Builder / Owner Command Center.
- `src/styles.css`: generated demo page visual system and responsive rules.
- `scripts/build_snapshot.py`: `generated_demo_site_v35` sanitized state builder + static route copy.
- `scripts/smoke_check.py`: route/state/marker smoke assertions.

## Route wiring
- Hash route: `#generated-demo-site-v35`.
- Direct route: `/generated-demo-site-v35/` via `copy_static()`.
- Public target: `https://pltnv123.github.io/webstudio-ops-dashboard/generated-demo-site-v35/`.

## V3.4 artifact extraction
- Client order: `phase-1-demo-client-order/client-order.json`
- Production brief: `phase-1-demo-client-order/production-brief.md`
- Sitemap: `phase-2-premium-factory-package/sitemap.md`
- Copy outline: `phase-2-premium-factory-package/page-by-page-copy-outline.md`
- Design system: `phase-2-premium-factory-package/design-system.md`
- Component plan: `phase-2-premium-factory-package/component-plan.md`
- QA checklist: `phase-2-premium-factory-package/qa-checklist.md`
