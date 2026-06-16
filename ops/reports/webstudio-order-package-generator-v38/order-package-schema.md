# WebStudio V3.8 — Order Package Schema

Status: implemented as static snapshot

## Top-level state key
`order_package_generator_v38`

## Fields
- `schema_version`: `webstudio.order-package-generator.v38`
- `status`: local/deployed state
- `route`: `/order-package-generator/`
- `public_url`: deployed route URL
- `markers`: public smoke markers
- `safety`: static/demo/write-disabled contract
- `source_order`: sanitized order-builder payload from V3.7 handoff
- `generated_sitemap`: generated URL path list
- `page_briefs`: page name, goal, section list
- `section_copy_outlines`: copy outline rows
- `design_direction`: style, typography, visual rules
- `seo_checklist`: SEO gates
- `asset_checklist`: content/asset gates
- `qa_checklist`: QA gates
- `delivery_checklist`: handoff gates
- `next_safe_action`: owner-safe next production step
- `links`: relevant static routes

## Not included
- real client identity
- private contact data
- live CRM/email/Telegram destinations
- service-role credentials
- destructive DB/migration SQL
- real form submission endpoint
