# V3.5 Supabase Status Update

Status: PASS_PARTIAL_ROWS_WRITTEN

Rows written and verified:
- `webstudio_ops_status`: `44010623-8937-41f9-9b90-0d87fd364212` — `webstudio-generated-demo-website` v3.5 `PARTIAL`
- `webstudio_jobs`: `4705f868-3bd1-4552-b6ba-46da620e20e4` — `webstudio-generated-demo-website-v35` `PARTIAL`
- `webstudio_artifacts`: `74acfef5-d81e-491c-8489-ff0740a75145` — demo route/report artifact `PARTIAL`
- `webstudio_memory_index`: `ea079876-3e56-4c20-8045-875997dd4f25` — sanitized summary indexed

Reason for PARTIAL: local implementation/build/smoke passed, but Docker GitHub push was blocked by missing GitHub CLI/auth for HTTPS push, so public Pages deploy is not verified.
