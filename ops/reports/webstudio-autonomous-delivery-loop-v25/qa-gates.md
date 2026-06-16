# WebStudio V2.5 — QA Gates

## Required gates for production code changes

- Project root verified: WebStudio canonical repo only.
- `git status --porcelain=v1 -uall` inspected.
- Changed paths allowlisted.
- `git diff --check` passes.
- Changed-files secret scan passes.
- Local build passes.
- Local smoke check passes.
- GitHub Actions workflow passes on durable default branch.
- Pages URL returns HTTP 200.
- Supabase status row written with final commit/status.
- `hfinalize` passes before final answer.

## Docs/report-only gates

- Changed paths under approved docs/report path.
- `git diff --check` passes.
- Changed-files secret scan passes.
- Required report files exist locally and at pushed commit.
- GitHub Actions/Pages still pass if workflow triggers.

## Failure rule

If any required gate fails, final status is `PARTIAL` or `BLOCKED`; the final report must include the exact failing command/check and next safe recovery step.
