# WebStudio Real Client Execution Flow v30

- generated_at: 2026-05-25T13:59:36Z
- status: PASS_LOCAL_READY
- purpose: repeatable real-client production flow from intake to support

## Flow
### 1. Client intake
- responsible agent: Sales/Client Agent
- inputs: raw request, contacts, clinic context
- outputs: sanitized intake note
- artifact path: `/workspace/output/webstudio-client-004-intake-v30.md`
- Kanban stage: Разбор
- acceptance criteria: facts captured; medical-promise boundary stated
- approval gates: no
- terminal protocol: write intake artifact, no live messages

### 2. Client qualification
- responsible agent: Qualification Agent
- inputs: intake, service lines, proof assets
- outputs: qualified/not-qualified decision + risks
- artifact path: `/workspace/output/webstudio-client-004-qualification-v30.md`
- Kanban stage: Разбор
- acceptance criteria: ICP, budget band, compliance risks, decision-maker known
- approval gates: owner if rejecting/accepting commercial promise
- terminal protocol: no external claims

### 3. Package selection
- responsible agent: Strategy/Sales Agent
- inputs: qualification, D1/D2/D3 fit
- outputs: selected package and assumptions
- artifact path: `/workspace/output/webstudio-client-004-package-selection-v30.md`
- Kanban stage: Подготовка
- acceptance criteria: D1+D2+D3 scope selected with exclusions
- approval gates: yes for pricing/scope sent to client
- terminal protocol: proposal draft only

### 4. Strategy brief
- responsible agent: Strategy Agent
- inputs: client context, competitors, proof inventory
- outputs: positioning and content map
- artifact path: `/workspace/output/webstudio-client-004-strategy-brief-v30.md`
- Kanban stage: Подготовка
- acceptance criteria: safe proof-led positioning; no diagnosis/guarantees
- approval gates: no
- terminal protocol: artifact only

### 5. Design direction
- responsible agent: Design Agent
- inputs: brand mood, premium references
- outputs: visual system for clinic
- artifact path: `/workspace/output/webstudio-client-004-d1-design-direction-v30.md`
- Kanban stage: Запланировано
- acceptance criteria: premium calm medical aesthetic, mobile-first
- approval gates: no
- terminal protocol: local static only

### 6. D1 landing/site production
- responsible agent: Frontend Agent
- inputs: strategy + design + copy
- outputs: landing outline + HTML preview
- artifact path: `/workspace/output/webstudio-client-004-d1-preview-v30.html`
- Kanban stage: Выполняется
- acceptance criteria: responsive preview, CTA to consultation/Telegram, safe copy
- approval gates: owner before public deploy
- terminal protocol: build/smoke/browser QA

### 7. D2 Telegram AI-intake production
- responsible agent: Automation Agent
- inputs: booking questions, lead types
- outputs: flow, fixtures, demo script
- artifact path: `/workspace/output/webstudio-client-004-d2-telegram-intake-flow-v30.md`
- Kanban stage: Выполняется
- acceptance criteria: 5 scenarios, handoff to manager, no diagnosis
- approval gates: owner before live bot/token
- terminal protocol: offline fixtures only

### 8. D3 automation readiness
- responsible agent: Automation/CRM Agent
- inputs: lead routing, CRM fields
- outputs: dry-run CRM readiness map
- artifact path: `/workspace/output/webstudio-client-004-d3-crm-readiness-v30.md`
- Kanban stage: Выполняется
- acceptance criteria: no live writes, privacy/rollback gates
- approval gates: yes before CRM credentials
- terminal protocol: dry-run only

### 9. Motion/HyperFrames assets
- responsible agent: Motion Agent
- inputs: hero story, D1 sections
- outputs: motion plan + composition
- artifact path: `/workspace/output/webstudio-client-004-motion-composition-v30.html`
- Kanban stage: Выполняется
- acceptance criteria: reduced motion fallback and render command
- approval gates: owner before public media use
- terminal protocol: optional render

### 10. QA
- responsible agent: QA Agent
- inputs: D1/D2/D3/motion artifacts
- outputs: QA/readiness issues
- artifact path: `/workspace/output/webstudio-client-004-report-v30.md`
- Kanban stage: На проверке
- acceptance criteria: visual/responsive/copy/safety/secrets passed
- approval gates: no
- terminal protocol: build/smoke/browser/scan

### 11. Preview package
- responsible agent: Delivery Agent
- inputs: all local artifacts
- outputs: preview package + export registry
- artifact path: `/workspace/output/webstudio-client-004-preview-package-v30.md`
- Kanban stage: На проверке
- acceptance criteria: all links, status, next steps present
- approval gates: no
- terminal protocol: registry JSON valid

### 12. Owner approval gates
- responsible agent: Owner/CTO Agent
- inputs: QA and package
- outputs: approval packet
- artifact path: `/workspace/output/webstudio-client-004-artifact-registry-v30.json`
- Kanban stage: Согласования
- acceptance criteria: live deploy/integrations/client-send gates explicit
- approval gates: yes for external actions
- terminal protocol: stop if unclear

### 13. Client delivery pack
- responsible agent: Delivery Agent
- inputs: approved preview package
- outputs: client-ready handoff
- artifact path: `/workspace/output/webstudio-client-004-preview-package-v30.md`
- Kanban stage: Передача клиенту
- acceptance criteria: clear what done/needed/launchable
- approval gates: yes before send
- terminal protocol: no raw/debug

### 14. Launch readiness
- responsible agent: QA/Release Agent
- inputs: approval, QA, hosting target
- outputs: go/no-go checklist
- artifact path: `/workspace/output/webstudio-client-004-delivery-plan-v30.md`
- Kanban stage: Готово к запуску
- acceptance criteria: deployment target, rollback, smoke checklist ready
- approval gates: yes before deploy
- terminal protocol: no direct main/public deploy

### 15. Post-delivery support
- responsible agent: Support Agent
- inputs: client feedback, analytics plan
- outputs: support cadence and change request flow
- artifact path: `/workspace/output/webstudio-real-client-execution-flow-v30.md`
- Kanban stage: Поддержка
- acceptance criteria: support SLA and intake channel known
- approval gates: owner for scope changes
- terminal protocol: report-only
