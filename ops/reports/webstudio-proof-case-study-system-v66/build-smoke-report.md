# V6.6 build/smoke report

- checked_at: 2026-06-08T23:20:20.266769+00:00
- npm run build: PASS
- npm run smoke: PASS
- local static smoke `/proof-case-study/`: PASS
- secret scan changed files: PASS
- git diff --check: PASS
- node --check src/app.js: PASS

## Local route markers

```json
{
  "proof-case-study-v66": true,
  "case study outline": true,
  "allowed proof checklist": true,
  "no fake proof": true,
  "testimonial approval policy": true,
  "ready_for_case_study": true
}
```

## Secret scan files

19 changed/untracked files scanned; findings=0.

```text
## npm run build

> webstudio-ops-dashboard@0.1.0 build
> python3 scripts/build_snapshot.py --dist /workspace/output/webstudio-ops-dashboard-static

snapshot=/workspace/projects/webstudio-ops-dashboard.gitcheck/public/data/webstudio-control-plane-state.json size=3660957 sha256=a0e3a2d1471f481a8b324b4a155bd5eb6bf0f918323645ed45b79156a9f378e0
canonical=/workspace/output/webstudio-control-plane-state.json size=3660957 sha256=a0e3a2d1471f481a8b324b4a155bd5eb6bf0f918323645ed45b79156a9f378e0
snapshot_publish=FALLBACK warning=Live snapshot rejected; published last valid snapshot fallback instead. fallback_source=/workspace/output/webstudio-control-plane-state.json
candidate_errors=["kanban.task_total is zero while a last valid snapshot exists"]
safety=pass mirror_executable_count=0 duplicate_keys=0
dist=/workspace/output/webstudio-ops-dashboard-static files=101
npm notice
npm notice New major version of npm available! 10.8.2 -> 11.16.0
npm notice Changelog: https://github.com/npm/cli/releases/tag/v11.16.0
npm notice To update run: npm install -g npm@11.16.0
npm notice
## npm run smoke

> webstudio-ops-dashboard@0.1.0 smoke
> python3 scripts/smoke_check.py

SMOKE PASS
generated_at=2026-06-08T23:20:16Z
kanban_task_total=852
wf_completed=144
routes=overview,work-factory,premium-factory,kanban,production,d3-intake,owner-feedback,clients,sales-pack,real-assets,proposal-quote,delivery-timeline,proof-case-study,approvals,health,artifacts,marathon,audit
executable_mirror_count=0
npm notice
npm notice New major version of npm available! 10.8.2 -> 11.16.0
npm notice Changelog: https://github.com/npm/cli/releases/tag/v11.16.0
npm notice To update run: npm install -g npm@11.16.0
npm notice
## local static route smoke
{
  "checked_at": "2026-06-08T23:20:19.888299+00:00",
  "route_dir": "/workspace/output/webstudio-ops-dashboard-static/proof-case-study",
  "index_exists": true,
  "app_exists": true,
  "markers": {
    "proof-case-study-v66": true,
    "case study outline": true,
    "allowed proof checklist": true,
    "no fake proof": true,
    "testimonial approval policy": true,
    "ready_for_case_study": true
  },
  "sha256_app": "add613fd2fb1af245169f054b9c44c8af5d002329b17f840bb7aefb7061c8a13",
  "pass": true
}
## secret scan changed files
{
  "checked_at": "2026-06-08T23:20:20.083015+00:00",
  "files": [
    "ops/reports/webstudio-proof-case-study-system-v66/build-smoke-report.md",
    "ops/reports/webstudio-proof-case-study-system-v66/case-study-schema.md",
    "ops/reports/webstudio-proof-case-study-system-v66/continuation-prompt.md",
    "ops/reports/webstudio-proof-case-study-system-v66/deploy-report.md",
    "ops/reports/webstudio-proof-case-study-system-v66/events.jsonl",
    "ops/reports/webstudio-proof-case-study-system-v66/final-report.md",
    "ops/reports/webstudio-proof-case-study-system-v66/github-push-report.md",
    "ops/reports/webstudio-proof-case-study-system-v66/proof-policy.md",
    "ops/reports/webstudio-proof-case-study-system-v66/proof-system-design.md",
    "ops/reports/webstudio-proof-case-study-system-v66/route-smoke-report.md",
    "ops/reports/webstudio-proof-case-study-system-v66/state.json",
    "ops/reports/webstudio-proof-case-study-system-v66/supabase-status-update.md",
    "ops/reports/webstudio-proof-case-study-system-v66/testimonial-policy.md",
    "ops/reports/webstudio-proof-case-study-system-v66/ui-implementation.md",
    "ops/reports/webstudio-proof-case-study-system-v66/validation.md",
    "scripts/build_snapshot.py",
    "scripts/smoke_check.py",
    "src/app.js",
    "src/index.html"
  ],
  "findings": [],
  "pass": true
}
## git diff --check
## node --check

```
