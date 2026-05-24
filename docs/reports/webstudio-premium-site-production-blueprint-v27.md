# WebStudio Premium Site Production Blueprint v27

Updated: 2026-05-24T21:26:06Z


## 1. Intake
- owner: CTO / intake agent
- artifact: `client-intake-wizard-v27.json`
- Kanban stage: Разбор
- terminal protocol: PASS/BLOCKED only; no silent partial; evidence path required
- acceptance criteria:
  - 17 questions answered/adapted
  - risks and missing assets known

## 2. Strategy brief
- owner: CTO
- artifact: `strategy brief markdown/json`
- Kanban stage: Подготовка
- terminal protocol: PASS/BLOCKED only; no silent partial; evidence path required
- acceptance criteria:
  - offer/audience/proof/CTA chosen
  - no forbidden claims

## 3. Design direction
- owner: Design Agent
- artifact: `3 design directions`
- Kanban stage: Запланировано
- terminal protocol: PASS/BLOCKED only; no silent partial; evidence path required
- acceptance criteria:
  - style tokens
  - anti-reference list
  - owner selects direction

## 4. 3 concepts
- owner: Design+Frontend Agents
- artifact: `concept-a/b/c.html`
- Kanban stage: Готово к запуску
- terminal protocol: PASS/BLOCKED only; no silent partial; evidence path required
- acceptance criteria:
  - 3 distinct concepts
  - proof-safe content
  - responsive first pass

## 5. Selected concept
- owner: Owner + CTO
- artifact: `selected concept report`
- Kanban stage: На проверке
- terminal protocol: PASS/BLOCKED only; no silent partial; evidence path required
- acceptance criteria:
  - winner rationale
  - rejected options recorded

## 6. Site prototype
- owner: Frontend Agent
- artifact: `static prototype`
- Kanban stage: Выполняется
- terminal protocol: PASS/BLOCKED only; no silent partial; evidence path required
- acceptance criteria:
  - CTA works
  - responsive layout
  - content blocks complete

## 7. Motion / HyperFrames asset
- owner: Motion Agent
- artifact: `MP4/poster/reduced-motion pack`
- Kanban stage: Выполняется
- terminal protocol: PASS/BLOCKED only; no silent partial; evidence path required
- acceptance criteria:
  - ffprobe metadata
  - poster picked
  - reduced motion fallback

## 8. Responsive QA
- owner: QA Agent
- artifact: `browser QA report`
- Kanban stage: На проверке
- terminal protocol: PASS/BLOCKED only; no silent partial; evidence path required
- acceptance criteria:
  - desktop/tablet/mobile checked
  - console errors zero

## 9. Conversion QA
- owner: CRO Agent
- artifact: `conversion QA checklist`
- Kanban stage: На проверке
- terminal protocol: PASS/BLOCKED only; no silent partial; evidence path required
- acceptance criteria:
  - hero clarity
  - objections handled
  - CTA path clear

## 10. Performance QA
- owner: QA Agent
- artifact: `performance notes`
- Kanban stage: На проверке
- terminal protocol: PASS/BLOCKED only; no silent partial; evidence path required
- acceptance criteria:
  - static safe
  - no heavy external scripts
  - media optimized

## 11. Handoff
- owner: Orchestrator
- artifact: `client handoff pack`
- Kanban stage: Готово
- terminal protocol: PASS/BLOCKED only; no silent partial; evidence path required
- acceptance criteria:
  - files listed
  - approval text ready
  - risks explicit

## 12. PR / preview
- owner: Host Runner + CTO
- artifact: `PR status + preview plan`
- Kanban stage: Готово
- terminal protocol: PASS/BLOCKED only; no silent partial; evidence path required
- acceptance criteria:
  - PR head verified
  - checks no failed
  - deploy requires explicit approval
