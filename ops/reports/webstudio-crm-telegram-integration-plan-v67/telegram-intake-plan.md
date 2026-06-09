# Telegram Bot Intake Plan

Mode: PLAN_ONLY.

- Bot token is required later but no value is stored here.
- Webhook must validate secret, source chat allowlist, replay window, payload size, and idempotency key.
- Intake fields: client/contact handle, business goal, current workflow, desired outcome, assets/proof availability, consent note, owner approval state.
- Bot must not send outreach, create tasks, or write CRM/Supabase until explicit owner approval.
