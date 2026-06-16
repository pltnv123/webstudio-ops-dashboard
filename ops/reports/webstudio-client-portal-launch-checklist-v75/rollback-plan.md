# Rollback Plan — V7.5

Rollback triggers:
- owner chooses HOLD/ROLLBACK
- missing real assets
- proof/compliance rejection
- failed dry-run
- route health regression

Rollback actions:
- keep `/client-data-room/` and `/client-portal-readiness/` as fallback routes
- hide/disable pilot CTA
- keep static safe mode
- do not enable live writes
- record last good commit and route health status
