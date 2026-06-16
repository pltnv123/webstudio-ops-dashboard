# WebStudio Error Taxonomy v37.1

Generated: `2026-05-26T16:25:17.609853Z`

## Status
**PASS** — все повторявшиеся ошибки переведены в классы с recovery path.

## Owner action policy
Owner action required только для live approvals:
- production secrets
- live Telegram token
- live CRM/Sheets writes
- Supabase write migrations
- deploy/release to public production
- payment/live external actions
- private client data approval
- legal/medical public launch approval

Owner action NOT required for GitHub Auto-Push recovery, Host Runner retry, qmd update, hfinalize, browser QA retry, deploy asset path repair, safe local dry-run, product artifacts, DESIGN.md/skills/visual sourcing.

## Error classes
### Provider errors — no response 300s
- State: `DEGRADED_SAFE`
- Detection: Detect via agent/tool timeout log or gateway no response after 300s.
- Automatic recovery: Switch to fallback route; checkpoint current task; continue safe artifact work if context is preserved.
- Owner action required: NO

### Provider errors — fallback failure
- State: `DEGRADED_SAFE`
- Detection: Detect via fallback chain exhausted / custom unhealthy.
- Automatic recovery: Isolate failing fallback, use primary/next healthy lane, create provider-watch note.
- Owner action required: NO

### Provider errors — encrypted content unsupported
- State: `DEGRADED_SAFE`
- Detection: Detect exact unsupported encrypted content error.
- Automatic recovery: Remove unsupported encrypted block from prompt, use artifact pointers/checkpoints.
- Owner action required: NO

### Provider errors — quota exceeded
- State: `DEGRADED_SAFE`
- Detection: Detect 429/insufficient_quota/weekly usage limit.
- Automatic recovery: Mark lane unhealthy with reset timing, switch to free/available fallback.
- Owner action required: NO

### Provider errors — context too large
- State: `RECOVERING`
- Detection: Detect context_length_exceeded or compaction failure.
- Automatic recovery: Write checkpoint/report, shrink prompt to active task and artifact paths.
- Owner action required: NO

### Provider errors — compression failure
- State: `DEGRADED_SAFE`
- Detection: Detect summary/compression error in gateway logs.
- Automatic recovery: Continue from files/checkpoints, avoid relying on hidden summary.
- Owner action required: NO

### GitHub errors — sandbox gh unavailable
- State: `RECOVERING`
- Detection: Detect gh wrapper missing binary / exit 127.
- Automatic recovery: Create host runner github/autopush job; continue local checks.
- Owner action required: NO

### GitHub errors — HTTPS auth unavailable
- State: `RECOVERING`
- Detection: Detect fatal could not read Username / auth prompt unavailable.
- Automatic recovery: Use host-side Auto-Push with host credentials; never ask owner manual push.
- Owner action required: NO

### GitHub errors — wrapper points to missing binary
- State: `RECOVERING`
- Detection: Detect gh wrapper message.
- Automatic recovery: Record as known recoverable class; queue host job and create wrapper repair issue if persistent.
- Owner action required: NO

### GitHub errors — PR verification blocked
- State: `WATCH`
- Detection: Detect private repo 404/gh auth fail/stale PR head.
- Automatic recovery: Write commit-aware status JSON, use host pr-verify job.
- Owner action required: NO

### GitHub errors — Auto-Push blocked in Docker
- State: `RECOVERING`
- Detection: Detect push failure in Docker.
- Automatic recovery: Queue github/autopush job; result path updated; owner manual action = no.
- Owner action required: NO

### Host Runner errors — job queued not processed
- State: `WATCH`
- Detection: Detect job remains in .hermes-host-jobs root and latest.json not advanced.
- Automatic recovery: Document pending; do not duplicate job unless stale >2 ticks.
- Owner action required: NO

### Host Runner errors — wrong job directory
- State: `RECOVERING`
- Detection: Detect job created under non-scanned directory.
- Automatic recovery: Move/copy to scanned .hermes-host-jobs root with required marker.
- Owner action required: NO

### Host Runner errors — allowlist mismatch
- State: `BLOCKED_SYSTEM`
- Detection: Detect result/log allowlist denied.
- Automatic recovery: Create corrected job with accepted marker/name; update playbook.
- Owner action required: NO

### Host Runner errors — missing latest.json
- State: `WATCH`
- Detection: Detect absent /workspace/output/host-job-runner/latest.json.
- Automatic recovery: Use job movement/log/result artifacts; request snapshot/runner status via hfinalize.
- Owner action required: NO

### Host Runner errors — system job not scanned
- State: `BLOCKED_SYSTEM`
- Detection: Detect system job remains pending and no host log.
- Automatic recovery: Use correct system/... marker or known scanned root.
- Owner action required: NO

### Deploy errors — asset path broken
- State: `RECOVERING`
- Detection: Detect missing assets/404/link check failure.
- Automatic recovery: Copy assets into deploy dir or change references to relative; gate unavailable motion.
- Owner action required: NO

### Deploy errors — source/output assets not copied
- State: `RECOVERING`
- Detection: Detect source contains assets but deployed path lacks them.
- Automatic recovery: Copy source assets, rebuild static manifest, rerun verification.
- Owner action required: NO

### Deploy errors — production deploy missing files
- State: `BLOCKED_SYSTEM`
- Detection: Detect index.html/styles.css/app.js missing.
- Automatic recovery: Re-run production deploy from verified artifact.
- Owner action required: NO

### Deploy errors — local-only paths
- State: `RECOVERING`
- Detection: Detect file://,/workspace,/home/hermes in production HTML/CSS/JS visible to client.
- Automatic recovery: Replace with relative paths or owner-safe copy labels; do not expose internals client-facing.
- Owner action required: NO

### Deploy errors — file:// or /workspace paths in production
- State: `RECOVERING`
- Detection: Detect grep for file:// or /workspace in deployed client surface.
- Automatic recovery: Rewrite client-facing links to relative/demo labels; move technical paths into owner packet only.
- Owner action required: NO

### QMD errors — pending embeddings
- State: `WATCH`
- Detection: Detect qmd status pending >0.
- Automatic recovery: Run qmd update/search only; do not run unbounded embed.
- Owner action required: NO

### QMD errors — unbounded embed unsafe
- State: `DEGRADED_SAFE`
- Detection: Detect request/temptation to run qmd embed without approval or memory headroom.
- Automatic recovery: Skip embed; use keyword search; document deferred maintenance.
- Owner action required: NO

### QMD errors — qmd-auto-embed degraded
- State: `WATCH`
- Detection: Detect qmd-auto-embed fail/OOM/degraded.
- Automatic recovery: Continue qmd update/search smoke.
- Owner action required: NO

### QMD errors — qmd command unavailable in degraded sandbox
- State: `RECOVERING`
- Detection: Detect command not found/Node mismatch.
- Automatic recovery: Use /workspace/bin and /workspace/.hermes/node/bin wrapper env; patch wrapper if needed.
- Owner action required: NO

### hfinalize / snapshot — snapshot pending
- State: `WATCH`
- Detection: Detect hfinalize created flag but not processed yet.
- Automatic recovery: Report async pending, verify last-auto-snapshot exists.
- Owner action required: NO

### hfinalize / snapshot — processor backlog
- State: `WATCH`
- Detection: Detect pending flags count > threshold.
- Automatic recovery: Create one status report, do not spam requests; let processor catch up.
- Owner action required: NO

### hfinalize / snapshot — stale last-auto-snapshot
- State: `BLOCKED_SYSTEM`
- Detection: Detect last-auto-snapshot older than expected and flags pending.
- Automatic recovery: Create host snapshot request/recovery packet; continue product if not snapshot-critical.
- Owner action required: NO

### Kanban / Work Factory — silent finish
- State: `RECOVERING`
- Detection: Detect rc=0 without kanban_complete/kanban_block.
- Automatic recovery: Reopen/retry with lifecycle contract; update Ops panel and card comments.
- Owner action required: NO

### Kanban / Work Factory — repeated_crashes
- State: `WATCH`
- Detection: Detect repeated crash indicators.
- Automatic recovery: Classify historical/test/active; isolate ops-lane; keep product on default/known-good.
- Owner action required: NO

### Kanban / Work Factory — stale running/dead PID
- State: `RECOVERING`
- Detection: Detect running task with dead PID/stale >2h.
- Automatic recovery: Block/archive stale noise; keep active production count separate.
- Owner action required: NO

### Kanban / Work Factory — ops-lane isolated
- State: `DEGRADED_SAFE`
- Detection: Detect ops profile route/model failure while default lane passes.
- Automatic recovery: Route product work through default/known-good; keep ops repair separate.
- Owner action required: NO

### Kanban / Work Factory — dispatcher re-promotes after gave_up
- State: `RECOVERING`
- Detection: Detect gave_up cards promoted again.
- Automatic recovery: Mark terminal/blocked with retry budget; add dedupe guard in backlog manager.
- Owner action required: NO

### UI / Browser QA — horizontal scroll
- State: `RECOVERING`
- Detection: Detect scrollWidth > clientWidth.
- Automatic recovery: Patch CSS overflow/grid/tab wrap; rerun browser QA.
- Owner action required: NO

### UI / Browser QA — missing assets
- State: `RECOVERING`
- Detection: Detect network/file missing assets.
- Automatic recovery: Copy/rewrite references or gate missing media.
- Owner action required: NO

### UI / Browser QA — console errors
- State: `RECOVERING`
- Detection: Detect browser console error count >0.
- Automatic recovery: Fix route/data/script errors; rebuild.
- Owner action required: NO

### UI / Browser QA — raw/debug visible
- State: `RECOVERING`
- Detection: Detect raw JSON/paths/stage/debug in main UI.
- Automatic recovery: Move to details drawer/collapsible; owner-facing RU summary in main.
- Owner action required: NO

### UI / Browser QA — mobile layout broken
- State: `RECOVERING`
- Detection: Detect overflow, unreadable cards, hidden CTA on 390px.
- Automatic recovery: Patch responsive CSS/cards/tabs.
- Owner action required: NO

### UI / Browser QA — broken preview links
- State: `RECOVERING`
- Detection: Detect broken internal file/artifact path.
- Automatic recovery: Update artifact path, copy file to output, or mark unavailable.
- Owner action required: NO
