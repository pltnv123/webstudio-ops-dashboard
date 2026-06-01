# WebStudio Premium Factory Research v34

Generated: 2026-05-25T18:22:58Z

## Источники и что взяли

### Open Design — `nexu-io/open-design`
- artifact-first loop: каждый результат — файл + provenance + история;
- DESIGN.md как источник visual language;
- разделение skills / design-templates / design-systems;
- critique loop: generate → preview → critique → improve → export;
- sandbox preview и daemon/worker separation для тяжёлых операций.

### Awesome Claude Design / DESIGN.md ecosystem
- DESIGN.md как единый договор для визуального языка;
- curated styles не копируются напрямую, а используются как taxonomy;
- scaffold UI должен ссылаться на design tokens, а не на случайные промпты.

### Awesome Agent Skills
- используем как discovery index, не как auto-install;
- candidates: frontend-design, design-review, animation/motion, QA, performance, CRO, analytics;
- mirror только после security/provenance review.

### Anthropic Skills
- берем SKILL.md standard, progressive disclosure, scripts/references/assets folders;
- не ставим blindly; document skills/license проверять отдельно.

### HyperFrames
- берем HTML/CSS/GSAP → deterministic MP4 workflow;
- render через isolated worker/Host Runner, не через произвольный agent shell;
- composition source + exact render command обязательны; MP4 PASS только после ffprobe/browser proof.

### React Three Fiber / GSAP
- R3F только если 3D усиливает бизнес: architecture/product/AI/beauty showcase; healthcare default = static fallback;
- GSAP: `useGSAP`, `matchMedia`, reduced-motion branches, no scroll hijack.

## Что внедрено v34
- Master DESIGN.md: `/workspace/design-systems/webstudio-premium/DESIGN.md`.
- 14 internal WebStudio skills under `/workspace/.agents/skills`.
- Visual sourcing engine + asset legitimacy model.
- Deep adaptive interview v34.
- Service/order catalog v34.
- Client #004 premium site v34 with concept visuals and motion-ready sections.
- HyperFrames composition + render command.
- Premium QA rubric with target >=95.

## Не ставим blindly
- чужие skills with bash/network/mcp/subprocess;
- design systems that mimic trademarks;
- WebGL heroes by default;
- autoplay video on healthcare pages;
- ad pixels/tracking on medical intake without compliance review.

## Production-ready vs experimental
- Production-ready: DESIGN.md, SKILL.md, artifact registry, static previews, GSAP micro-motion, HyperFrames worker path, SVG concept visuals, QA gates.
- Experimental: third-party skill marketplace, arbitrary plugin UI, R3F/Three hero in medical sites, heavy scroll-scrub, auto-installed npx tools.

## Security/performance risks
- prompt injection through external skills/design docs;
- supply-chain risk via npx/skills install;
- medical privacy/pixels risk;
- video/WebGL LCP/CPU risk;
- fake proof risk if generated visuals are not labeled.
