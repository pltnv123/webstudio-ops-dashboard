# CRM / Sheets Plan

Mode: SAFE_DRY_RUN_ONLY until owner approval.

Columns: lead_id, source_channel, source_message_ref, normalized_summary, owner_status, risk_level, assigned_owner, next_action, created_at, updated_at, idempotency_key.

Controls: upsert by idempotency key, duplicate detection, append-only audit notes, write retry queue, no private raw payload in public reports.
