# webstudio-public-showcase v4.4

Status: DEPLOYED

Route: https://pltnv123.github.io/webstudio-ops-dashboard/webstudio-showcase/
Commit: `09942866566ab9a4e6aedd22c168eadb252c4d8e`
GitHub Actions: https://github.com/pltnv123/webstudio-ops-dashboard/actions/runs/26916607506
Supabase ops row: `1994a9b2-1b1c-49dc-9e92-9247f1da3ec7`
Supabase artifact row: `fe0d7536-9aaa-4938-8903-afc279e420b1`

## Gates
- python compile: PASS
- npm run build: PASS
- npm run smoke: PASS
- changed-line secret scan: PASS
- git diff --check: PASS
- host bridge push: PASS
- remote SHA verification: PASS
- GitHub Actions: success
- public route HTTP/marker smoke: PASS

## Safety
Static sanitized demo/productization layer only. No browser-side secrets, no private client data, no live CRM/email/Telegram/payment/booking writes.
