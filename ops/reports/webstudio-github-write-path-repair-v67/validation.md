# Validation

- local_commit: 1c96cc9e261f13387fcd177e9cb5a58868377a59
- changed_files: 26
- allowlist: PASS
- changed_files_secret_scan: PASS
- node --check src/app.js: PASS
- python3 -m py_compile scripts/build_snapshot.py scripts/smoke_check.py: PASS
- npm run build: PASS
- npm run smoke: PASS
- git diff --check: PASS
- public_route_smoke: PASS
- supabase_update: BLOCKED_MCP_TIMEOUT
