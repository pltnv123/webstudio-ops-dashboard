# WebStudio V3.7 — Lead-to-Order Schema

Status: implemented as static snapshot

## Top-level state key
`lead_to_order_handoff_v37`

## Fields
- `schema_version`: `webstudio.lead-to-order-handoff.v37`
- `status`: local/deployed state
- `route`: `/lead-to-order-handoff/`
- `public_url`: deployed route URL
- `markers`: route smoke markers
- `safety`: static/demo/write-disabled contract
- `demo_lead_payload`: sanitized V3.6 lead snapshot
- `qualification_result`: score, routes, recommended product line, rationale
- `order_builder_payload`: fields imported into Order Builder preview
- `missing_inputs`: owner/client inputs required before production use
- `next_safe_action`: next owner-safe production action
- `handoff_links`: `/lead-capture-demo/`, `/order-builder/`, `/work-factory/`

## Order-builder payload mapping
- `business_type` → sample order business type
- `project_goal` → generated production brief context
- `required_pages` → page list
- `content_assets_readiness` → content status
- `website_or_service_needed` → pricing package/product line preview
- `timeline` → timeline
- safety notes → approval-gated production constraints

## Not included
- real client identity
- phone/email/address/payment info
- live CRM/Telegram/email destination
- service-role credentials
- destructive DB/migration SQL
