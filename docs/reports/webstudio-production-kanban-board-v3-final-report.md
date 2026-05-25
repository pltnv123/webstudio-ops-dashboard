# WebStudio Production Kanban Board v3 — final engineering report

generated_at: 2026-05-21T15:35:23Z

## Verdict
- Production Kanban logical board: **PASS** — non-empty owner-facing lanes across triage/todo/scheduled/ready/in_progress/blocked/review/done/archived.
- Ops Cockpit snapshot/build/smoke: **PASS**.
- Snapshot processor: **PASS** — stale request backlog drained, recurring processor scheduled.
- GitHub PR: **BLOCKED in Docker** — `/workspace/bin/gh` points to missing `/usr/bin/gh`; host repair/PR packet created.
- Ops worker lane canary: **FAIL / no false PASS** — ops worker still exits without `kanban_complete`/`kanban_block`; canary archived after operator recovery.
- QMD: **PARTIAL** — `qmd update/search` work; `qmd embed` remains degraded due Bun crash/timeout on VPS.

## Root cause
The physical Hermes Kanban backend is optimized for worker lifecycle states (`ready/running/blocked/done/archived`) and completed/test cards accumulated in `done`. Earlier canary/test work was correctly closed, but no stable owner-facing production projection separated live product stages from worker execution status. Result: default board looked like a Done archive. v3 keeps the physical board intact and adds a stable WebStudio Production logical view based on `[WEBSTUDIO]`, D1/D2/D3 taxonomy, and `production_stage` metadata.

## Source of truth
- Physical board: Hermes Kanban SQLite via `hermes kanban list --json`.
- Production board/view: `WebStudio Production` logical projection in `/workspace/output/webstudio-control-plane-state.json`.
- Owner UI: `http://127.0.0.1:9120/` / `http://127.0.0.1:9120/kanban` tunnel; static artifact mirror `/workspace/output/webstudio-ops-dashboard-static/index.html`.

## Lane counts
### Physical Kanban
- done: 370
- blocked: 13
- ready: 3
- scheduled: 5
- todo: 13

### WebStudio Production logical lanes
- triage: 14
- todo: 2
- scheduled: 5
- ready: 1
- in_progress: 1
- blocked: 2
- review: 1
- done: 34
- archived: 167

## Example cards by logical lane
### triage
- `t_4cb91211` Implement raw request capture backend — physical=blocked stage=intake
- `t_0a485284` Implement Telegram webhook request capture — physical=blocked stage=intake
- `t_355465a7` Verify end-to-end Telegram intake behavior — physical=todo stage=intake
### todo
- `t_02ca3315` Implement D3 client qualification workflow — physical=blocked stage=client-qualification
- `t_6f27e548` [WEBSTUDIO][D3][TODO] Business automations: Qualify client fit, budget, timeline and decision maker — physical=todo stage=client-qualification
### scheduled
- `t_a0b9a27d` [WEBSTUDIO][D3][SCHEDULED] Business automations: Prepare estimate/pricing on next owner pricing window — physical=scheduled stage=estimate-pricing
- `t_45fc8ada` [WEBSTUDIO][D2][SCHEDULED] AI-intake Telegram bot: Post-delivery support follow-up on next scheduled tick — physical=scheduled stage=post-delivery-support
- `t_acdf8280` [WEBSTUDIO][D2][SCHEDULED] AI-intake Telegram bot: Prepare estimate/pricing on next owner pricing window — physical=scheduled stage=estimate-pricing
### ready
- `t_708c5ae5` [WEBSTUDIO][D1][PLAN] Landing architecture execution packet v3 — physical=ready stage=architecture-plan
### in_progress
- `t_2e98979c` [WEBSTUDIO][OPS][IMPLEMENTATION] Ops Cockpit v3 productization follow-through — physical=ready stage=implementation
### blocked
- `t_ac536bac` [WEBSTUDIO][D1][BLOCKED] Landing/pages websites: Owner approval gate for live launch/integration/write actions — physical=blocked stage=approval
- `t_d37c7eb2` [WEBSTUDIO][D2][BLOCKED] Telegram bot production token/access decision — physical=blocked stage=approval
### review
- `t_45e7f100` [WEBSTUDIO][D1][REVIEW] Landing/pages websites: QA checklist and proof bundle review queue — physical=blocked stage=qa
### done
- `t_8c2ba4ef` [WEBSTUDIO][OPS][CANARY] Default worker lifecycle canary v2 — physical=done stage=unspecified
- `t_d1344369` [WEBSTUDIO][D3][REVIEW] Business automation blueprint QA matrix v2 — physical=done stage=qa
- `t_88f8753b` [WEBSTUDIO][D2][REVIEW] AI-intake lead scoring handoff schema v2 — physical=done stage=qa
### archived
- `t_61552534` [WF LIVE] Next Planned Work — physical=done stage=archived-noise
- `t_7e335dfa` [WF LIVE] Supervisor Status — physical=done stage=archived-noise
- `t_aee9a67d` [WF LIVE] System Overview — physical=done stage=archived-noise

## D1/D2/D3 workstreams
- D1: 19 cards; stages={'architecture-plan': 3, 'qa': 2, 'brief': 4, 'delivery-handoff': 1, 'implementation': 1, 'design-content': 1, 'client-qualification': 1, 'intake': 3, 'post-delivery-support': 1, 'approval': 1, 'estimate-pricing': 1}
- D2: 22 cards; stages={'qa': 2, 'intake': 12, 'delivery-handoff': 1, 'implementation': 1, 'brief': 1, 'design-content': 1, 'architecture-plan': 1, 'post-delivery-support': 1, 'estimate-pricing': 1, 'approval': 1}
- D3: 17 cards; stages={'implementation': 1, 'qa': 2, 'intake': 8, 'brief': 3, 'client-qualification': 2, 'estimate-pricing': 1}

## Agents/subagents/workers used
- Hermes Kanban dispatcher: used for ops canary; result FAIL due lifecycle protocol violation.
- Browser QA: used on static Ops Cockpit file artifact; screenshot evidence captured.
- Cron/control-plane: snapshot processor job created; work-factory-supervisor-12h verified scheduled/heartbeat.
- session_search/lossless: queried prior session context; no matching stored sessions returned in current DB.

## Real work completed
- Created/kept production cards for live logical `ready` and `in_progress` lanes: `t_708c5ae5`, `t_2e98979c`.
- Created bounded snapshot processor: `/workspace/.hermes/scripts/hermes-auto-snapshot-processor.sh`.
- Drained snapshot backlog to zero and created recurring cron job `hermes-auto-snapshot-processor-v3` every 5m.
- Created GitHub host repair/PR packet: `/workspace/output/github-host-repair-and-pr-v3.sh`.
- Created bounded QMD auto-embed script: `/workspace/.hermes/scripts/qmd-auto-embed.sh`.
- Updated Ops Cockpit snapshot builder + UI Health tab with v3 hardening state.
- Rebuilt static Ops Cockpit and canonical JSON state.

## Backlog intentionally preserved
- Triage/Todo/Scheduled/Ready/Review remain populated as production backlog; not all cards were closed into Done.
- Blocked contains real blockers: GitHub host binary visibility, ops worker lifecycle repair, and owner/live action approvals.

## Ready for review
- Ops Cockpit production board visual/UI proof.
- Snapshot processor v3 script and cron scheduling.
- GitHub host repair packet and ops worker failure evidence.

## Exact owner actions
- GitHub: on host, run `bash /workspace/output/github-host-repair-and-pr-v3.sh`; for PR: `RUN_PR=1 REPO=<owner/repo> bash /workspace/output/github-host-repair-and-pr-v3.sh`.
- Ops worker: repair host profile/dispatcher lifecycle so workers may call `kanban_complete`/`kanban_block`; rerun canary before declaring PASS.
- QMD vector search: approve deeper Bun/QMD embed remediation if vector search is required; keyword QMD remains safe.

## Ops Cockpit / UI test
- Browser: `file:///workspace/output/webstudio-ops-dashboard-static/index.html#kanban` loaded successfully.
- Screenshot: `/home/hermes/.hermes/cache/screenshots/browser_screenshot_87176b5dbde64f1e89f1907a6cd4de17.png`.
- QA observation: Kanban/Ops Cockpit visible; production lane counts visible; multi-column board visible.

## Build/check results
```
snapshot=/workspace/projects/webstudio-ops-dashboard/public/data/webstudio-control-plane-state.json size=1494184 sha256=2a5424a2e5f35a223c46f9bc740a8eed5140fe48ca5d039f540fba84965ee35e
canonical=/workspace/output/webstudio-control-plane-state.json size=1494184 sha256=2a5424a2e5f35a223c46f9bc740a8eed5140fe48ca5d039f540fba84965ee35e
safety=pass mirror_executable_count=0 duplicate_keys=0
dist=/workspace/output/webstudio-ops-dashboard-static files=5

```
```
SMOKE PASS
generated_at=2026-05-21T15:32:00Z
kanban_task_total=402
wf_completed=144
routes=overview,work-factory,kanban,production,d3-intake,clients,sales-pack,approvals,health,artifacts,marathon,audit
executable_mirror_count=0

```
- `npm test`: not available (`Missing script: test`) — smoke_check.py is the project check.

## GitHub status
- status: blocked_wrapper_missing_binary
- repair_packet: /workspace/output/github-host-repair-and-pr-v3.sh
- report: /workspace/output/github-and-ops-worker-v3-status.md

## 12h marathon status
- status: verified_live_cron_heartbeat
- schedule: cron job work-factory-supervisor-12h every 15m; bounded ticks select safe production Kanban/work-factory work and emit heartbeat artifacts
- index: {'path': '/workspace/output/webstudio-12h-marathon-index.md', 'exists': True, 'size': 20841, 'mtime': '2026-05-21T12:03:27Z', 'sha256': '1bccec38a8ee49f695709c0e7a60deb81ca585ba8e18ecaab13afbeff206b3ad'}

## Rollback
- Remove snapshot cron: `hermes cron remove 1722d46cc746` if owner wants to disable v3 processor.
- Restore dashboard files from backup/git if repository checkout is available; current changes are local files under `/workspace/projects/webstudio-ops-dashboard`.
- Archive production cards if needed: `hermes kanban archive t_708c5ae5 t_2e98979c`.

## Artifact hashes
- `/workspace/output/webstudio-control-plane-state.json` size=1494184 sha256=2a5424a2e5f35a223c46f9bc740a8eed5140fe48ca5d039f540fba84965ee35e
- `/workspace/output/github-host-repair-and-pr-v3.sh` size=2654 sha256=0827380f930fc3710b60925fb03b6dd590125ca0b8d5262857f367b35fd0c2e1
- `/workspace/output/github-and-ops-worker-v3-status.md` size=10454 sha256=0f8d8053fad29a93f0265d6127ddf23c80b03b11dcd081784eef4200f71462d1
- `/workspace/.hermes/scripts/hermes-auto-snapshot-processor.sh` size=3089 sha256=b19140fd5071051222935617935eeed452f1e9fec144af1e39a4341d24d003fd
- `/workspace/.hermes/scripts/qmd-auto-embed.sh` size=1223 sha256=de495ed7666bc29e0a52b824c85750e767e9b1afe37b325976478db836d44d2a
