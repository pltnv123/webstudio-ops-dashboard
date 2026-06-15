# Safety Gates v7.1

Required gates shown in UI:

- no private data in public demo
- no fake testimonials/proof
- no live CRM/Telegram/email/payment writes without approval
- no medical/legal claims without review

Implementation boundary:
- static/sanitized only
- no live form submission
- no external writes
- no secrets
- no destructive Supabase changes
- no gateway/systemd restart
