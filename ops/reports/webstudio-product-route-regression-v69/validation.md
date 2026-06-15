# V6.9 validation

- checked_at: 2026-06-15T04:40:54Z
- recovery_reason: GitHub Actions run 27522552287 failed on clean CI smoke because the V6.8 `route-health-v68` marker was not preserved in the V6.9 route-health view.
- recovery_fix: `src/app.js` now keeps both `route-health-v68` and `route-health-v69` data-testid markers while retaining `product-route-regression-v69` route regression copy.
- `python3 scripts/build_snapshot.py --dist /workspace/output/webstudio-product-route-regression-v69/static`: PASS
- `WEBSTUDIO_CI=1 python3 scripts/smoke_check.py`: PASS
- clean CI reproduction before fix: FAIL (`missing JS symbol route-health-v68`)
- clean CI reproduction after commit: pending after recovery commit
- local threaded HTTP smoke: PASS (24 routes, previous evidence)
- marker check: PASS (`product-route-regression-v69`, `PRODUCT_ROUTE_REGRESSION_PASS`, `NO_BROWSER_SERVICE_KEYS`, `NO_CLIENT_SEND`, `DB_SOURCE_PENDING`)
- changed-file secret scan: pending before recovery commit/push
- GitHub push/deploy: pending recovery host bridge
- Supabase row: SUPABASE_PENDING
