# Phase 3 Dashboard Integration

Status: PASS_LOCAL

Integrated the V3.4 client-order-to-premium-factory pilot into the existing `/premium-factory-v34/` dashboard route.

Shows:
- demo order summary;
- production brief/package links;
- sitemap/package status;
- next safe action / approval gates;
- QA gates;
- Supabase artifact status from sanitized static snapshot.

Data source: `/workspace/output/webstudio-premium-factory-v34.json`, copied into the generated control-plane state by `scripts/build_snapshot.py`.
