# Build/smoke report

- `python3 -m py_compile scripts/build_snapshot.py scripts/smoke_check.py`: PASS
- `npm run build`: PASS, dist files=349
- `npm run smoke`: PASS, route list includes `client-portal-preview`
- `git diff --check`: PASS
- credential-shaped changed diff scan: PASS
