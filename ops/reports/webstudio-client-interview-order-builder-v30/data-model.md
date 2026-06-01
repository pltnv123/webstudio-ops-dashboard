# Data Model v3.0

Safe MVP shape can be stored as a sanitized artifact/job payload in existing ops tables, e.g. `webstudio_artifacts` or `webstudio_jobs`, with no client secrets.

Suggested payload keys: `client_profile_label`, `business_type`, `offer`, `audience`, `style`, `required_pages`, `assets_needed`, `content_status`, `package_label`, `timeline_label`, `generated_brief`, `next_safe_action`.

No new table created. If dedicated client/order tables are needed, stop for owner approval with migration + rollback.
