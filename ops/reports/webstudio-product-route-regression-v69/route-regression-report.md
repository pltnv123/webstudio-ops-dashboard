# WebStudio V6.9 Product Route Regression Report

- status: LOCAL_PASS_PUSH_PENDING
- checked_at: 2026-06-15T03:29:57Z
- base_head_before_commit: ccd52ee1719b7c4035efd971a692e82424915853
- branch: webstudio/product-build-v31
- scope: public/product route regression matrix, navigation/safety copy markers, direct-path static generation
- routes_checked: 24
- local_http_smoke: PASS
- supabase_rows: SUPABASE_PENDING (MCP mutation/list surface unavailable in this cron tick)
- public_deploy: pending host bridge push + GitHub Pages Actions verification

## Routes
- `/` — HTTP shell PASS locally
- `/operator/` — HTTP shell PASS locally
- `/orders/` — HTTP shell PASS locally
- `/kanban/` — HTTP shell PASS locally
- `/work-factory/` — HTTP shell PASS locally
- `/owner-command-center/` — HTTP shell PASS locally
- `/sales-pack/` — HTTP shell PASS locally
- `/premium-factory/` — HTTP shell PASS locally
- `/real-assets/` — HTTP shell PASS locally
- `/proposal-quote/` — HTTP shell PASS locally
- `/integration-plan/` — HTTP shell PASS locally
- `/lead-capture-demo/` — HTTP shell PASS locally
- `/client-portal-preview/` — HTTP shell PASS locally
- `/delivery-timeline/` — HTTP shell PASS locally
- `/supabase-memory/` — HTTP shell PASS locally
- `/bot-activity/` — HTTP shell PASS locally
- `/route-health/` — HTTP shell PASS locally
- `/approvals/` — HTTP shell PASS locally
- `/health/` — HTTP shell PASS locally
- `/artifacts/` — HTTP shell PASS locally
- `/marathon/` — HTTP shell PASS locally
- `/owner-feedback/` — HTTP shell PASS locally
- `/agent-workflow/` — HTTP shell PASS locally
- `/audit/` — HTTP shell PASS locally

## Safety assertions
- No live CRM/email/Telegram/payment/booking/client-send writes were performed.
- No browser-side service keys were added.
- Route health now exposes `product-route-regression-v69` and `PRODUCT_ROUTE_REGRESSION_PASS` markers.
- Direct-path static generation now includes operator/orders/sales-pack/premium-factory/audit product routes in addition to previous routes.

## Evidence
- local threaded smoke: /workspace/output/webstudio-product-route-regression-v69/local-threaded-http-smoke.md
- build log: /workspace/output/webstudio-product-route-regression-v69-build.log
- smoke log: /workspace/output/webstudio-product-route-regression-v69-smoke.log
