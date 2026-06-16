# WebStudio Error Recovery Playbooks v37.1

Generated: `2026-05-26T16:25:17.609853Z`

## Global rule
Owner action is required only for live approvals. Routine system recovery is automatic and must not become owner manual work.

## provider_no_response_300s — no response 300s
- Detection: Detect via agent/tool timeout log or gateway no response after 300s.
- Severity: `recoverable` / state `DEGRADED_SAFE`
- Owner-visible message: API/model lane timeout
- Automatic recovery: Switch to fallback route; checkpoint current task; continue safe artifact work if context is preserved.
- When to retry: Retry once on alternate provider after 60-120s; do not retry same dead lane more than once.
- When to block: Block only if all fallback routes fail and no local artifact work remains.
- When to continue: Continue product lane when owner_action_required=false and safe artifacts/checks can proceed.
- Artifact/report path: `/workspace/output/errors/provider_no_response_300s.md`
- Owner action required: NO

## provider_fallback_failure — fallback failure
- Detection: Detect via fallback chain exhausted / custom unhealthy.
- Severity: `recoverable` / state `DEGRADED_SAFE`
- Owner-visible message: Fallback lane failed
- Automatic recovery: Isolate failing fallback, use primary/next healthy lane, create provider-watch note.
- When to retry: Retry after cooldown or after host health snapshot refresh.
- When to block: Block system-only if no provider can answer.
- When to continue: Continue product lane when owner_action_required=false and safe artifacts/checks can proceed.
- Artifact/report path: `/workspace/output/errors/provider_fallback_failure.md`
- Owner action required: NO

## provider_encrypted_content_unsupported — encrypted content unsupported
- Detection: Detect exact unsupported encrypted content error.
- Severity: `recoverable` / state `DEGRADED_SAFE`
- Owner-visible message: Model cannot process encrypted payload
- Automatic recovery: Remove unsupported encrypted block from prompt, use artifact pointers/checkpoints.
- When to retry: Retry immediately with redacted/plain context.
- When to block: Block if needed data is only encrypted and cannot be re-provided safely.
- When to continue: Continue product lane when owner_action_required=false and safe artifacts/checks can proceed.
- Artifact/report path: `/workspace/output/errors/provider_encrypted_content_unsupported.md`
- Owner action required: NO

## provider_quota_exceeded — quota exceeded
- Detection: Detect 429/insufficient_quota/weekly usage limit.
- Severity: `recoverable` / state `DEGRADED_SAFE`
- Owner-visible message: Quota reached on one lane
- Automatic recovery: Mark lane unhealthy with reset timing, switch to free/available fallback.
- When to retry: Retry after reset timing from limits snapshot.
- When to block: Block only if every approved lane is exhausted.
- When to continue: Continue product lane when owner_action_required=false and safe artifacts/checks can proceed.
- Artifact/report path: `/workspace/output/errors/provider_quota_exceeded.md`
- Owner action required: NO

## provider_context_too_large — context too large
- Detection: Detect context_length_exceeded or compaction failure.
- Severity: `recoverable` / state `RECOVERING`
- Owner-visible message: Context window too large
- Automatic recovery: Write checkpoint/report, shrink prompt to active task and artifact paths.
- When to retry: Retry immediately with compact checkpoint-first prompt.
- When to block: Block only if required context cannot be safely reconstructed.
- When to continue: Continue product lane when owner_action_required=false and safe artifacts/checks can proceed.
- Artifact/report path: `/workspace/output/errors/provider_context_too_large.md`
- Owner action required: NO

## provider_compression_failure — compression failure
- Detection: Detect summary/compression error in gateway logs.
- Severity: `recoverable` / state `DEGRADED_SAFE`
- Owner-visible message: Automatic compression failed
- Automatic recovery: Continue from files/checkpoints, avoid relying on hidden summary.
- When to retry: Retry after reducing context or switching summary provider.
- When to block: Block only if no checkpoint exists and task facts are unrecoverable.
- When to continue: Continue product lane when owner_action_required=false and safe artifacts/checks can proceed.
- Artifact/report path: `/workspace/output/errors/provider_compression_failure.md`
- Owner action required: NO

## github_sandbox_gh_unavailable — sandbox gh unavailable
- Detection: Detect gh wrapper missing binary / exit 127.
- Severity: `recoverable` / state `RECOVERING`
- Owner-visible message: GitHub CLI is unavailable in sandbox; host recovery queued
- Automatic recovery: Create host runner github/autopush job; continue local checks.
- When to retry: Host runner tick; then PR verify.
- When to block: Block only if host runner also fails repeatedly.
- When to continue: Continue product lane when owner_action_required=false and safe artifacts/checks can proceed.
- Artifact/report path: `/workspace/output/errors/github_sandbox_gh_unavailable.md`
- Owner action required: NO

## github_https_auth_unavailable — HTTPS auth unavailable
- Detection: Detect fatal could not read Username / auth prompt unavailable.
- Severity: `recoverable` / state `RECOVERING`
- Owner-visible message: Sandbox cannot push with HTTPS auth; host recovery queued
- Automatic recovery: Use host-side Auto-Push with host credentials; never ask owner manual push.
- When to retry: Host runner tick then gh PR verify.
- When to block: Block only if write approval/scope missing or host credentials fail.
- When to continue: Continue product lane when owner_action_required=false and safe artifacts/checks can proceed.
- Artifact/report path: `/workspace/output/errors/github_https_auth_unavailable.md`
- Owner action required: NO

## github_wrapper_missing_binary — wrapper points to missing binary
- Detection: Detect gh wrapper message.
- Severity: `recoverable` / state `RECOVERING`
- Owner-visible message: GitHub wrapper points to missing binary
- Automatic recovery: Record as known recoverable class; queue host job and create wrapper repair issue if persistent.
- When to retry: Retry through host, not sandbox.
- When to block: Block system if host job runner missing.
- When to continue: Continue product lane when owner_action_required=false and safe artifacts/checks can proceed.
- Artifact/report path: `/workspace/output/errors/github_wrapper_missing_binary.md`
- Owner action required: NO

## github_pr_verify_blocked — PR verification blocked
- Detection: Detect private repo 404/gh auth fail/stale PR head.
- Severity: `watch` / state `WATCH`
- Owner-visible message: PR verification delayed or private auth blocked
- Automatic recovery: Write commit-aware status JSON, use host pr-verify job.
- When to retry: Retry after host runner or remote propagation.
- When to block: Block only if PR state cannot be proven after host job.
- When to continue: Continue product lane when owner_action_required=false and safe artifacts/checks can proceed.
- Artifact/report path: `/workspace/output/errors/github_pr_verify_blocked.md`
- Owner action required: NO

## github_autopush_blocked_docker — Auto-Push blocked in Docker
- Detection: Detect push failure in Docker.
- Severity: `recoverable` / state `RECOVERING`
- Owner-visible message: Auto-Push moved to host runner
- Automatic recovery: Queue github/autopush job; result path updated; owner manual action = no.
- When to retry: Host runner tick; verify head SHA.
- When to block: Block only if host runner FAIL with durable JSON.
- When to continue: Continue product lane when owner_action_required=false and safe artifacts/checks can proceed.
- Artifact/report path: `/workspace/output/errors/github_autopush_blocked_docker.md`
- Owner action required: NO

## host_job_queued_not_processed — job queued not processed
- Detection: Detect job remains in .hermes-host-jobs root and latest.json not advanced.
- Severity: `watch` / state `WATCH`
- Owner-visible message: Host job is queued; waiting for runner
- Automatic recovery: Document pending; do not duplicate job unless stale >2 ticks.
- When to retry: Retry/requeue after 2 host ticks if no movement.
- When to block: Block system if runner not installed/scheduled.
- When to continue: Continue product lane when owner_action_required=false and safe artifacts/checks can proceed.
- Artifact/report path: `/workspace/output/errors/host_job_queued_not_processed.md`
- Owner action required: NO

## host_wrong_job_directory — wrong job directory
- Detection: Detect job created under non-scanned directory.
- Severity: `recoverable` / state `RECOVERING`
- Owner-visible message: Host job path corrected
- Automatic recovery: Move/copy to scanned .hermes-host-jobs root with required marker.
- When to retry: Retry next tick.
- When to block: Block if allowlist rejects corrected job.
- When to continue: Continue product lane when owner_action_required=false and safe artifacts/checks can proceed.
- Artifact/report path: `/workspace/output/errors/host_wrong_job_directory.md`
- Owner action required: NO

## host_allowlist_mismatch — allowlist mismatch
- Detection: Detect result/log allowlist denied.
- Severity: `owner-visible` / state `BLOCKED_SYSTEM`
- Owner-visible message: Host runner rejected job allowlist
- Automatic recovery: Create corrected job with accepted marker/name; update playbook.
- When to retry: Retry after corrected marker.
- When to block: Block system if allowlist needs host runner code change.
- When to continue: Continue product lane when owner_action_required=false and safe artifacts/checks can proceed.
- Artifact/report path: `/workspace/output/errors/host_allowlist_mismatch.md`
- Owner action required: NO

## host_missing_latest_json — missing latest.json
- Detection: Detect absent /workspace/output/host-job-runner/latest.json.
- Severity: `watch` / state `WATCH`
- Owner-visible message: Runner latest status not visible yet
- Automatic recovery: Use job movement/log/result artifacts; request snapshot/runner status via hfinalize.
- When to retry: Retry status check next tick.
- When to block: Block only if no evidence of runner after expected interval.
- When to continue: Continue product lane when owner_action_required=false and safe artifacts/checks can proceed.
- Artifact/report path: `/workspace/output/errors/host_missing_latest_json.md`
- Owner action required: NO

## host_system_job_not_scanned — system job not scanned
- Detection: Detect system job remains pending and no host log.
- Severity: `owner-visible` / state `BLOCKED_SYSTEM`
- Owner-visible message: System job queue not scanned
- Automatic recovery: Use correct system/... marker or known scanned root.
- When to retry: Retry after path/marker correction.
- When to block: Block if host scheduler absent.
- When to continue: Continue product lane when owner_action_required=false and safe artifacts/checks can proceed.
- Artifact/report path: `/workspace/output/errors/host_system_job_not_scanned.md`
- Owner action required: NO

## deploy_asset_path_broken — asset path broken
- Detection: Detect missing assets/404/link check failure.
- Severity: `recoverable` / state `RECOVERING`
- Owner-visible message: Production asset path repaired or gated
- Automatic recovery: Copy assets into deploy dir or change references to relative; gate unavailable motion.
- When to retry: Retry deploy verification/browser QA.
- When to block: Block only if required production asset absent and cannot be regenerated.
- When to continue: Continue product lane when owner_action_required=false and safe artifacts/checks can proceed.
- Artifact/report path: `/workspace/output/errors/deploy_asset_path_broken.md`
- Owner action required: NO

## deploy_assets_not_copied — source/output assets not copied
- Detection: Detect source contains assets but deployed path lacks them.
- Severity: `recoverable` / state `RECOVERING`
- Owner-visible message: Deploy asset copy repaired
- Automatic recovery: Copy source assets, rebuild static manifest, rerun verification.
- When to retry: Retry immediately after copy.
- When to block: Block only on missing source asset.
- When to continue: Continue product lane when owner_action_required=false and safe artifacts/checks can proceed.
- Artifact/report path: `/workspace/output/errors/deploy_assets_not_copied.md`
- Owner action required: NO

## deploy_missing_files — production deploy missing files
- Detection: Detect index.html/styles.css/app.js missing.
- Severity: `owner-visible` / state `BLOCKED_SYSTEM`
- Owner-visible message: Production deploy missing required files
- Automatic recovery: Re-run production deploy from verified artifact.
- When to retry: Retry after deploy.
- When to block: Block if deploy bridge is unavailable.
- When to continue: Continue product lane when owner_action_required=false and safe artifacts/checks can proceed.
- Artifact/report path: `/workspace/output/errors/deploy_missing_files.md`
- Owner action required: NO

## deploy_local_only_paths — local-only paths
- Detection: Detect file://,/workspace,/home/hermes in production HTML/CSS/JS visible to client.
- Severity: `recoverable` / state `RECOVERING`
- Owner-visible message: Local-only paths removed/gated
- Automatic recovery: Replace with relative paths or owner-safe copy labels; do not expose internals client-facing.
- When to retry: Retry static scan.
- When to block: Block only if production requires secret/private path.
- When to continue: Continue product lane when owner_action_required=false and safe artifacts/checks can proceed.
- Artifact/report path: `/workspace/output/errors/deploy_local_only_paths.md`
- Owner action required: NO

## deploy_file_workspace_paths — file:// or /workspace paths in production
- Detection: Detect grep for file:// or /workspace in deployed client surface.
- Severity: `recoverable` / state `RECOVERING`
- Owner-visible message: Production paths sanitized
- Automatic recovery: Rewrite client-facing links to relative/demo labels; move technical paths into owner packet only.
- When to retry: Retry verification.
- When to block: Block only if path is needed for owner-only artifact and not public demo.
- When to continue: Continue product lane when owner_action_required=false and safe artifacts/checks can proceed.
- Artifact/report path: `/workspace/output/errors/deploy_file_workspace_paths.md`
- Owner action required: NO

## qmd_pending_embeddings — pending embeddings
- Detection: Detect qmd status pending >0.
- Severity: `watch` / state `WATCH`
- Owner-visible message: QMD has pending embeddings; safe keyword mode continues
- Automatic recovery: Run qmd update/search only; do not run unbounded embed.
- When to retry: Retry update; defer embed to host maintenance if needed.
- When to block: Block only if qmd update/search fails.
- When to continue: Continue product lane when owner_action_required=false and safe artifacts/checks can proceed.
- Artifact/report path: `/workspace/output/errors/qmd_pending_embeddings.md`
- Owner action required: NO

## qmd_unbounded_embed_unsafe — unbounded embed unsafe
- Detection: Detect request/temptation to run qmd embed without approval or memory headroom.
- Severity: `recoverable` / state `DEGRADED_SAFE`
- Owner-visible message: Vector embed skipped safely
- Automatic recovery: Skip embed; use keyword search; document deferred maintenance.
- When to retry: Retry only with explicit approval and bounded batch.
- When to block: Block never for product lane.
- When to continue: Continue product lane when owner_action_required=false and safe artifacts/checks can proceed.
- Artifact/report path: `/workspace/output/errors/qmd_unbounded_embed_unsafe.md`
- Owner action required: NO

## qmd_auto_embed_degraded — qmd-auto-embed degraded
- Detection: Detect qmd-auto-embed fail/OOM/degraded.
- Severity: `watch` / state `WATCH`
- Owner-visible message: Auto-embed degraded; keyword QMD still usable
- Automatic recovery: Continue qmd update/search smoke.
- When to retry: Retry in host window or bounded batch.
- When to block: Block only if safe update/search fail.
- When to continue: Continue product lane when owner_action_required=false and safe artifacts/checks can proceed.
- Artifact/report path: `/workspace/output/errors/qmd_auto_embed_degraded.md`
- Owner action required: NO

## qmd_command_unavailable — qmd command unavailable in degraded sandbox
- Detection: Detect command not found/Node mismatch.
- Severity: `recoverable` / state `RECOVERING`
- Owner-visible message: QMD wrapper/path repaired
- Automatic recovery: Use /workspace/bin and /workspace/.hermes/node/bin wrapper env; patch wrapper if needed.
- When to retry: Retry qmd --version/status/update.
- When to block: Block if wrapper missing and cannot be restored.
- When to continue: Continue product lane when owner_action_required=false and safe artifacts/checks can proceed.
- Artifact/report path: `/workspace/output/errors/qmd_command_unavailable.md`
- Owner action required: NO

## hfinalize_snapshot_pending — snapshot pending
- Detection: Detect hfinalize created flag but not processed yet.
- Severity: `watch` / state `WATCH`
- Owner-visible message: Snapshot request queued
- Automatic recovery: Report async pending, verify last-auto-snapshot exists.
- When to retry: Retry snapshot status after host processor tick.
- When to block: Block only if backlog grows/stale beyond SLA.
- When to continue: Continue product lane when owner_action_required=false and safe artifacts/checks can proceed.
- Artifact/report path: `/workspace/output/errors/hfinalize_snapshot_pending.md`
- Owner action required: NO

## snapshot_processor_backlog — processor backlog
- Detection: Detect pending flags count > threshold.
- Severity: `watch` / state `WATCH`
- Owner-visible message: Snapshot processor backlog visible
- Automatic recovery: Create one status report, do not spam requests; let processor catch up.
- When to retry: Retry after processor interval.
- When to block: Block system if stale >45m or >5 pending.
- When to continue: Continue product lane when owner_action_required=false and safe artifacts/checks can proceed.
- Artifact/report path: `/workspace/output/errors/snapshot_processor_backlog.md`
- Owner action required: NO

## snapshot_stale_last_auto_snapshot — stale last-auto-snapshot
- Detection: Detect last-auto-snapshot older than expected and flags pending.
- Severity: `owner-visible` / state `BLOCKED_SYSTEM`
- Owner-visible message: Snapshot processor appears stale
- Automatic recovery: Create host snapshot request/recovery packet; continue product if not snapshot-critical.
- When to retry: Retry after host processor run.
- When to block: Block only final FULL PASS, not product artifacts.
- When to continue: Continue product lane when owner_action_required=false and safe artifacts/checks can proceed.
- Artifact/report path: `/workspace/output/errors/snapshot_stale_last_auto_snapshot.md`
- Owner action required: NO

## kanban_silent_finish — silent finish
- Detection: Detect rc=0 without kanban_complete/kanban_block.
- Severity: `recoverable` / state `RECOVERING`
- Owner-visible message: Worker lifecycle terminal action required
- Automatic recovery: Reopen/retry with lifecycle contract; update Ops panel and card comments.
- When to retry: Retry once with explicit terminal contract.
- When to block: Block task if repeated.
- When to continue: Continue product lane when owner_action_required=false and safe artifacts/checks can proceed.
- Artifact/report path: `/workspace/output/errors/kanban_silent_finish.md`
- Owner action required: NO

## kanban_repeated_crashes — repeated_crashes
- Detection: Detect repeated crash indicators.
- Severity: `watch` / state `WATCH`
- Owner-visible message: Crashes isolated; default lane continues
- Automatic recovery: Classify historical/test/active; isolate ops-lane; keep product on default/known-good.
- When to retry: Retry only after root cause or lane switch.
- When to block: Block only active production card if same card crashes repeatedly.
- When to continue: Continue product lane when owner_action_required=false and safe artifacts/checks can proceed.
- Artifact/report path: `/workspace/output/errors/kanban_repeated_crashes.md`
- Owner action required: NO

## kanban_stale_running_dead_pid — stale running/dead PID
- Detection: Detect running task with dead PID/stale >2h.
- Severity: `recoverable` / state `RECOVERING`
- Owner-visible message: Dead PID tasks repaired/archived
- Automatic recovery: Block/archive stale noise; keep active production count separate.
- When to retry: Retry health after cleanup.
- When to block: Block only if active product task cannot be reclaimed.
- When to continue: Continue product lane when owner_action_required=false and safe artifacts/checks can proceed.
- Artifact/report path: `/workspace/output/errors/kanban_stale_running_dead_pid.md`
- Owner action required: NO

## kanban_ops_lane_isolated — ops-lane isolated
- Detection: Detect ops profile route/model failure while default lane passes.
- Severity: `recoverable` / state `DEGRADED_SAFE`
- Owner-visible message: Ops lane isolated; product lane continues
- Automatic recovery: Route product work through default/known-good; keep ops repair separate.
- When to retry: Retry ops canary after route fix.
- When to block: Block FULL SYSTEM PASS only.
- When to continue: Continue product lane when owner_action_required=false and safe artifacts/checks can proceed.
- Artifact/report path: `/workspace/output/errors/kanban_ops_lane_isolated.md`
- Owner action required: NO

## kanban_dispatcher_repromotes_gave_up — dispatcher re-promotes after gave_up
- Detection: Detect gave_up cards promoted again.
- Severity: `recoverable` / state `RECOVERING`
- Owner-visible message: Dispatcher loop guarded
- Automatic recovery: Mark terminal/blocked with retry budget; add dedupe guard in backlog manager.
- When to retry: Retry after guard.
- When to block: Block system if loop persists.
- When to continue: Continue product lane when owner_action_required=false and safe artifacts/checks can proceed.
- Artifact/report path: `/workspace/output/errors/kanban_dispatcher_repromotes_gave_up.md`
- Owner action required: NO

## ui_horizontal_scroll — horizontal scroll
- Detection: Detect scrollWidth > clientWidth.
- Severity: `recoverable` / state `RECOVERING`
- Owner-visible message: Layout fixed for viewport
- Automatic recovery: Patch CSS overflow/grid/tab wrap; rerun browser QA.
- When to retry: Retry same viewport after patch.
- When to block: Block demo-ready if still present.
- When to continue: Continue product lane when owner_action_required=false and safe artifacts/checks can proceed.
- Artifact/report path: `/workspace/output/errors/ui_horizontal_scroll.md`
- Owner action required: NO

## ui_missing_assets — missing assets
- Detection: Detect network/file missing assets.
- Severity: `recoverable` / state `RECOVERING`
- Owner-visible message: Missing assets copied or gated
- Automatic recovery: Copy/rewrite references or gate missing media.
- When to retry: Retry browser QA.
- When to block: Block client demo if visible asset missing.
- When to continue: Continue product lane when owner_action_required=false and safe artifacts/checks can proceed.
- Artifact/report path: `/workspace/output/errors/ui_missing_assets.md`
- Owner action required: NO

## ui_console_errors — console errors
- Detection: Detect browser console error count >0.
- Severity: `recoverable` / state `RECOVERING`
- Owner-visible message: Console errors fixed before demo
- Automatic recovery: Fix route/data/script errors; rebuild.
- When to retry: Retry browser QA.
- When to block: Block demo-ready if error remains.
- When to continue: Continue product lane when owner_action_required=false and safe artifacts/checks can proceed.
- Artifact/report path: `/workspace/output/errors/ui_console_errors.md`
- Owner action required: NO

## ui_raw_debug_visible — raw/debug visible
- Detection: Detect raw JSON/paths/stage/debug in main UI.
- Severity: `recoverable` / state `RECOVERING`
- Owner-visible message: Raw debug moved under Подробнее
- Automatic recovery: Move to details drawer/collapsible; owner-facing RU summary in main.
- When to retry: Retry browser text scan.
- When to block: Block owner-touch if raw debug remains in main view.
- When to continue: Continue product lane when owner_action_required=false and safe artifacts/checks can proceed.
- Artifact/report path: `/workspace/output/errors/ui_raw_debug_visible.md`
- Owner action required: NO

## ui_mobile_layout_broken — mobile layout broken
- Detection: Detect overflow, unreadable cards, hidden CTA on 390px.
- Severity: `recoverable` / state `RECOVERING`
- Owner-visible message: Mobile layout patched
- Automatic recovery: Patch responsive CSS/cards/tabs.
- When to retry: Retry mobile QA.
- When to block: Block owner-touch if core panels unusable.
- When to continue: Continue product lane when owner_action_required=false and safe artifacts/checks can proceed.
- Artifact/report path: `/workspace/output/errors/ui_mobile_layout_broken.md`
- Owner action required: NO

## ui_broken_preview_links — broken preview links
- Detection: Detect broken internal file/artifact path.
- Severity: `recoverable` / state `RECOVERING`
- Owner-visible message: Preview links repaired or gated
- Automatic recovery: Update artifact path, copy file to output, or mark unavailable.
- When to retry: Retry link inventory.
- When to block: Block only affected demo link.
- When to continue: Continue product lane when owner_action_required=false and safe artifacts/checks can proceed.
- Artifact/report path: `/workspace/output/errors/ui_broken_preview_links.md`
- Owner action required: NO
