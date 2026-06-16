# V4.0 Build / Smoke Report

Initial local gates: PASS

Commands:
- `python3 -m py_compile scripts/build_snapshot.py scripts/smoke_check.py` → PASS
- `npm run build` → PASS
- `npm run smoke` → PASS
- local static marker smoke for `/workspace/output/webstudio-ops-dashboard-static/one-click-demo-assembly/index.html` → PASS

Static route file exists and includes required markers.
Final gate rerun after report creation/commit is still required before final status can become DEPLOYED.


Final local gate rerun before commit: PASS
- `npm run build` log: `/workspace/output/webstudio-one-click-demo-assembly-v40/npm-build-final.log`
- `npm run smoke` log: `/workspace/output/webstudio-one-click-demo-assembly-v40/npm-smoke-final.log`
- direct static route: `/workspace/output/webstudio-ops-dashboard-static/one-click-demo-assembly/index.html`
- marker smoke: PASS
- changed-line secret scan: PASS
- `git diff --check`: PASS

Note: full-file scan catches pre-existing redaction regex examples in `scripts/build_snapshot.py`; changed-line scoped scan is PASS and no secret value was printed.
