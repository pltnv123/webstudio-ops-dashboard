# Rollback Plan

- Disable webhook route.
- Pause CRM/Sheets writer.
- Pause Supabase writer.
- Keep retry queue immutable until reviewed.
- Export local/static intake JSON.
- Reconcile duplicates by idempotency key before re-enable.
- Rotate any secret if exposure is suspected.
