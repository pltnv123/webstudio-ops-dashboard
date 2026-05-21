# Kanban Native Review/Triage Investigation v2

## Verdict
Stable owner-facing semantics are implemented through `production_stage` + logical lanes. Native `review` as arbitrary PATCH status is not supported in the currently reachable backend/API. Physical `triage` is a creation/specifier flow, not reliable as a long-lived production lane through PATCH.

## Evidence
- Previous API test: `PATCH status=review` returned `400 unknown status: review`.
- CLI help supports `create --triage`, `specify`, `complete`, `block`, `unblock`, `archive`, `dispatch`.
- Official Hermes docs describe worker lifecycle as `ready -> running -> blocked/done/archived`; review is conventionally represented by `kanban_block(reason="review-required: ...")` or dashboard logical lanes.
- WebStudio Ops Cockpit uses stable logical lanes: `triage, todo, scheduled, ready, in_progress, blocked, review, done, archived`.

## Physical vs logical contract
- `physical_status`: current Hermes Kanban state from SQLite/CLI.
- `production_stage`: WebStudio business stage (`intake`, `qa`, `delivery-handoff`, etc.).
- `logical_lane`: owner-facing stable column.

## Review handling
Use logical `production_stage=qa` or `production_stage=delivery-handoff` -> `logical_lane=review`. For native worker review-required handoff, use `kanban_block(reason="review-required: ...")`.

## Triage handling
Use `hermes kanban create --triage` only for raw/specifier flow. For production dashboard stability use `production_stage=intake` -> `logical_lane=triage`.

## Recommendation
Do not add native `review` unless host Hermes source/repo is available and a full enum/schema/CLI/API/dispatcher migration can be tested. Current stable production solution is logical semantics.
