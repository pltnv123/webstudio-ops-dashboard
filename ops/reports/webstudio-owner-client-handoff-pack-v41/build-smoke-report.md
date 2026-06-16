# Build / Smoke Report

Status: PASS_LOCAL

Commands:
- `python3 -m py_compile scripts/build_snapshot.py scripts/smoke_check.py`
- `npm run build`
- `npm run smoke`

Results:
- build: PASS
- smoke: PASS
- static dist route included: `/client-handoff-pack/`
