# Build / Smoke Report — WebStudio V2.6

## Commands

- `python3 -m py_compile scripts/build_snapshot.py scripts/smoke_check.py`: PASS
- `npm run build`: PASS
- `npm run smoke`: PASS
- local static smoke root: HTTP 200
- local static smoke `/supabase-memory/`: HTTP 200
- local static state JSON: HTTP 200
- changed-files secret scan: PASS
- changed-path allowlist: PASS
- `git diff --check`: PASS

## Evidence

- build log: `/workspace/output/webstudio-supabase-memory-ui-v26/npm-build-after-varfix.log`
- smoke log: `/workspace/output/webstudio-supabase-memory-ui-v26/npm-smoke-after-varfix.log`
- static smoke log: `/workspace/output/webstudio-supabase-memory-ui-v26/static-smoke.log`
- secret scan log: `/workspace/output/webstudio-supabase-memory-ui-v26/secret-scan.log`
