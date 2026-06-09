# Validation

Status: PASS_LOCAL_BEFORE_PUSH

- node --check src/app.js: PASS
- python py_compile build/smoke scripts: PASS
- npm run build: PASS
- npm run smoke: PASS
- local static marker smoke `/integration-plan/`: PASS
- changed-files secret scan: PASS
- git diff --check: PASS

GitHub push/deploy verification is tracked separately in github-push-report.md and deploy-report.md.
