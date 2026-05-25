# Worker Lifecycle Contract Hardening v2

## Verdict
PARTIAL/PASS by lane: the `default` worker canary completed cleanly through Kanban; the `ops` worker canary reproduced the old failure. Production worker routing should avoid `ops` until host profile/tooling is repaired.

## Contract
Every dispatched Kanban worker must terminate with exactly one lifecycle action:
- `kanban_complete` / `hermes kanban complete` on success.
- `kanban_block` / `hermes kanban block` on real blocker.

Normal process exit with `rc=0` and no terminator is a protocol violation and is counted as crash.

## Canary results
- Failing canary: `t_a3e592d9`, assignee `ops`
  - crashed runs: `6`
  - completed/recovered runs: `1`
  - artifact: `/workspace/output/webstudio-worker-canary-v2-artifact.md`
- Passing canary: `t_8c2ba4ef`, assignee `default`
  - crashed runs: `0`
  - completed runs: `1`
  - run summary: `Created canary artifact at /workspace/output/webstudio-worker-canary-default-v2-artifact.md and verified it is non-empty (114 bytes, sha256 f3388fd827793c097bac528d3014528e60cd54cc54bc4bb44ab2605b79cc9d58).`

## Current stale active state
- WEBSTUDIO running cards: `0`
- Running IDs: `[]`

## Root cause
Workers were able to finish or exit without calling lifecycle terminators. Dispatcher correctly recorded: `worker exited cleanly (rc=0) without calling kanban_complete or kanban_block — protocol violation`.

## Hardening done
- Updated 12h Work Factory templates to explicitly require real D1/D2/D3 artifacts and lifecycle terminators when dispatched.
- Ops Cockpit now exposes Worker Health, stale card counts, repeated crash indicators, canary/report links.
- Passing default-lane canary proves lifecycle terminator path works when worker profile/tooling is correct.

## Remaining fix
Repair `ops` profile/lane on host so it has Kanban tools/guidance and obeys lifecycle contract, or keep production dispatch on `default`/known-good profiles.
