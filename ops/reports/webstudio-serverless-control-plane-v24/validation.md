# Validation

Generated: `2026-06-01T02:02:32.890418+00:00`

Checks run:
- GitHub Pages HTTP probe: `200`.
- GitHub repo view: repo public, default branch `main`, viewer permission `ADMIN`.
- GitHub Actions run list: latest deploy workflow run `26717721916` completed with `success`.
- GitHub deployment statuses: deployment `4881091057` final state `success`.
- PR #5 view: state `MERGED`, merge commit `3336f2e73799a8d77c9fff2b10f372fff102bbb7`, base `webstudio/product-build-v31`, head `webstudio/product-build-v32-premium-generator`.
- Git compare: `3336f2e...main` status `diverged`; merge commit not ancestor of default `main`.
- Supabase table listing: all four required operational tables exist and RLS is enabled.
- Supabase write: inserted V2.4 status row `b5316f1b-1148-491a-ab0d-698166ea3116` with status `PARTIAL`.

Validation result: **PARTIAL**

Pass:
- Pages live and reachable.
- Latest deploy run/deployment successful.
- Supabase operational tables verified.
- Supabase status row written.
- Serverless architecture and migration/rollback plans produced.

Blocker:
- Default branch `main` does not contain PR #5 merge commit; PR #5 base branch is not default `main`.
