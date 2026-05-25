# WebStudio Premium Site Generator v32 — research

## Sources inspected
- `/workspace/vendor/github/open-design`: adopted DESIGN.md, design-system first workflow, artifact-first sandbox preview, critique loop, separation of skills vs design templates.
- `/workspace/vendor/github/awesome-agent-skills`: used as discovery index only; no blind import. Relevant categories: frontend-design, design-review, animation/motion, QA, performance, CRO, testing.
- Anthropic skills references via awesome-agent-skills: adopted SKILL.md progressive disclosure shape, scripts/references/assets convention; no blind external execution.
- `/workspace/.hermes-persistent/webstudio/hyperframes` and `/workspace/vendor/github/open-design/design-templates/hyperframes`: adopted HTML/CSS/GSAP → deterministic MP4 workflow, lint/render/ffprobe gates, composition contract.

## Implemented in v32
- Premium generator contract: brief → interview → strategy → concepts → visual system → site → visuals → HyperFrames motion → QA → handoff → PR.
- DESIGN.md-style single source of visual language via generator JSON and site README.
- Concept visual assets are marked `concept/generated`, not real clinical proof.
- HyperFrames brief includes exact render command; MP4 is not claimed unless rendered.

## Not installed blindly
- Full Open Design runtime, external skills, shader-heavy VFX defaults, non-reviewed skill packs.

## Experimental
- HyperFrames MP4 render remains environment-dependent; composition is production-shaped and render command is exact.
