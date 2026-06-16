# Current State Report
2026-06-04T23:14:46Z
## Git
webstudio/product-build-v31
99c9a5bb0aeb1f98316f718fe219f2635bdbea0e
99c9a5bb0aeb1f98316f718fe219f2635bdbea0e
0
## package scripts
{
  "snapshot": "python3 scripts/build_snapshot.py",
  "build": "python3 scripts/build_snapshot.py --dist /workspace/output/webstudio-ops-dashboard-static",
  "smoke": "python3 scripts/smoke_check.py",
  "serve:src": "python3 -m http.server 4173 -d src",
  "serve:dist": "python3 -m http.server 4173 -d /workspace/output/webstudio-ops-dashboard-static",
  "preview:file": "python3 scripts/build_snapshot.py --dist /workspace/output/webstudio-ops-dashboard-static && python3 scripts/smoke_check.py"
}
