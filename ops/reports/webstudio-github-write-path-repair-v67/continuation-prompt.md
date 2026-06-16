WEBSTUDIO V6.7 FINALIZE CONTINUATION ONLY

Do not start V6.8.

Verified:
- V6.7 implementation commit reached webstudio/product-build-v31: 1c96cc9e261f13387fcd177e9cb5a58868377a59
- GitHub Actions deploy succeeded: https://github.com/pltnv123/webstudio-ops-dashboard/actions/runs/27515761793
- Public route is HTTP 200 with all required markers: https://pltnv123.github.io/webstudio-ops-dashboard/integration-plan/

Remaining blocker:
- Supabase MCP execute_sql timed out/backoff; row was not verified as DEPLOYED_PASS.

Next safe action:
- After Supabase MCP recovers, update component=webstudio-crm-telegram-integration-plan version=v6.7 to DEPLOYED_PASS with verified commit and deployment target, then SELECT verify.
