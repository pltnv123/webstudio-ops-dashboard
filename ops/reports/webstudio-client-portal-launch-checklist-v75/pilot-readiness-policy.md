# Pilot Readiness Policy — V7.5

Pilot review is allowed only in static/sanitized mode.

Hard blocks:
- no real client data
- no live writes
- no CRM/email/Telegram/payment writes
- no secrets
- no destructive Supabase changes
- no live integration claim without owner approval

Pilot can proceed only after owner approval, real asset replacement, proof/compliance approval, and optional dry-run verification.
