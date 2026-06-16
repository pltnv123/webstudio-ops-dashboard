# Safety Boundaries — V7.2

- Static/sanitized only.
- No real client data.
- No live form submission.
- No CRM/email/Telegram/payment writes.
- No Supabase live mutations or destructive changes from UI.
- No secrets, keys, tokens, `.env`, or private config in browser bundle.
- No gateway/systemd restart.
- No force push.
- No officebot.

The integration plan remains `BLOCKED_FOR_LIVE` until separately approved backend work, secret storage, RLS review, logging, rollback, and limited pilot are completed.
