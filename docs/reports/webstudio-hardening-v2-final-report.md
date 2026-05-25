# WebStudio Hardening v2 Final Report

## Verdict
PARTIAL PASS. Core production board/dashboard hardening, real D1/D2/D3 artifacts, default worker canary, reports, and repair scripts are complete. Host-only blockers remain for GitHub PR, `ops` worker lane, stale snapshot processor, and QMD embeddings.

## Kanban counts
```text
By status:
  triage    0
  todo      13
  scheduled  5
  ready     1
  running   0
  blocked   13
  done      370

By assignee:
  backend               done=16
  default               blocked=9, done=29, todo=10
  frontend              done=6
  ops                   done=17
  orchestrator          blocked=1, done=103, todo=3
  qa                    blocked=1, done=20
  researcher            done=5

Oldest ready task age: 22021s

```

## WEBSTUDIO physical counts
`{'done': 34, 'blocked': 9, 'scheduled': 5, 'todo': 10}`

## Production logical counts
`{'triage': 14, 'todo': 2, 'scheduled': 5, 'ready': 0, 'in_progress': 0, 'blocked': 2, 'review': 1, 'done': 29, 'archived': 167}`

## Worker lifecycle
- repeated_crashes reproduced on `ops` canary: `6` crashed runs.
- clean canary on `default`: `1` completed, `0` crashed.
- stale running dead PIDs after recovery: `0` WEBSTUDIO running cards.

## GitHub
- PR from sandbox: not possible.
- Reason: missing real gh binary and no dashboard git repo checkout in sandbox.
- Repair script: `/workspace/output/github-host-repair-and-pr-v2.sh`.

## D1/D2/D3 real product progress
- D1 task `t_53ab680a`: `/workspace/output/webstudio-d1-landing-conversion-qa-pack-v2.md`
- D2 task `t_88f8753b`: `/workspace/output/webstudio-d2-ai-intake-lead-scoring-handoff-schema-v2.md`
- D3 task `t_d1344369`: `/workspace/output/webstudio-d3-business-automation-blueprint-qa-matrix-v2.md`

## Ops Cockpit changes
- Worker Health / repeated crashes detector.
- GitHub PR status with repair script/report links.
- Native vs logical Kanban semantics card.
- Stale card age fields and dashboard metrics.
- Snapshot/QMD/system hardening state in control-plane JSON.

## 12h marathon
- `work-factory-supervisor-12h` cron is active/OK per live cron inspection.
- Script patched to prioritize real WebStudio D1/D2/D3 artifact refresh tasks and require lifecycle terminators when dispatched.

## QMD / Snapshot / Health
- QMD status excerpt:
```text
QMD Status

Index: /workspace/.cache/qmd/index.sqlite
Size:  22.5 MB

Documents
  Total:    2044 files indexed
  Vectors:  270 embedded
  Pending:  1724 need embedding (run 'qmd embed')
  Updated:  6m ago

Collections
  runbooks (qmd://runbooks/)
    Pattern:  **/*.md
    Files:    20 (updated 8d ago)
    Contexts: 1
      /: Hermes Web Studio operating runbooks: intake, implementat...
  reports (qmd://reports/)
    Pattern:  **/*.md
    Files:    37 (updated 2h ago)
    Contexts: 1
      /: Generated technical reports, QA reviews, runtime audits, ...
  knowledge (qmd://knowledge/)
    Pattern:  **/*.md
    Files:    14 (updated 6d ago)
    Contexts: 1
      /: Reusable knowledge base for web studio decisions, pattern...
  clients (qmd://clients/)
    Pattern:  **/*.md
    Files:    0 (updated never)
    Contexts: 1
      /: Client-specific briefs, requirements, constraints, notes,...
  deliverables (qmd://deliverables/)
    Pattern:  **/*.md
    Files:    224 (updated 13d ago)
    Contexts: 1
      /: Final deliverables and packaged outputs prepared for clie...
  autonomy-output (qmd://autonomy-output/)
    Pattern:  **/*.md
    Files:    1749 (updated 6m ago)
    Contexts: 1
      /: Generated autonomous outputs, finalizer reports, audits, ...

Examples
  # List files in a collection
  qmd ls runbooks
  # Get a document
  qmd get qmd://runbooks/path/to/file.md
  # Search within a collection
  qmd search "query" -c runbooks

```
- Snapshot pending requests: `697`
- Snapshot processed requests: `501`
- Snapshot processor remains host-side stale/backlogged.

## Supabase safe liveness
Sandbox has no `supabase` or `psql` CLI and no Supabase env variables present. No DB writes attempted. Existing Supabase workflow remains read-only/approval-gated.

## Changed files
- `/workspace/projects/webstudio-ops-dashboard/src/app.js`
- `/workspace/projects/webstudio-ops-dashboard/src/styles.css`
- `/workspace/projects/webstudio-ops-dashboard/src/index.html`
- `/workspace/projects/webstudio-ops-dashboard/scripts/build_snapshot.py`
- `/workspace/.hermes/scripts/work-factory-supervisor-tick.py`
- `/workspace/output/github-host-repair-and-pr-v2.sh`
- `/workspace/output/webstudio-d1-landing-conversion-qa-pack-v2.md`
- `/workspace/output/webstudio-d2-ai-intake-lead-scoring-handoff-schema-v2.md`
- `/workspace/output/webstudio-d3-business-automation-blueprint-qa-matrix-v2.md`

## Owner actions
1. Run GitHub repair script on host with exact repo URL if auto-selection stops safely.
2. Repair or disable `ops` Kanban worker lane; use `default` for production worker dispatch until fixed.
3. Repair host snapshot request processor backlog.
4. Approve QMD embed remediation separately if vector backlog should be reduced.

## Rollback
```bash
# dashboard source rollback if no git repo exists: restore from previous backup/archive if available
# disable new Work Factory templates by reverting /workspace/.hermes/scripts/work-factory-supervisor-tick.py from backup
# archive canary tasks if desired:
hermes kanban archive t_a3e592d9 t_8c2ba4ef
```
