# WebStudio GitHub Reporting Policy

Created at: `2026-05-30T20:22:11Z`

## Permanent production baseline

Every important WebStudio production step must create sanitized evidence and publish it through GitHub after validation.

## Required artifacts per important step

Each important step must create or update:
- report: human-readable summary of what happened;
- state: machine-readable JSON state;
- events: JSONL execution/event ledger;
- validation: commands/checks run and results.

## Commit and push rule

Every important WebStudio step gets committed and pushed after a secret scan passes.

Failed or partial steps may push checkpoint reports, but must not mark production `PASS`. Use `PARTIAL`, `BLOCKED`, or equivalent checkpoint status until gates pass.

## Code and deploy gates

- Code changes push only after build/smoke passes, or as an explicit checkpoint clearly marked non-production-PASS.
- Deploy changes push only after local gates pass.
- Supabase migrations must be committed with matching rollback SQL.

## Supabase operational state

When Supabase is available, every important WebStudio step should update operational state/job rows with sanitized metadata only.

## Hard exclusions

Never commit or publish:
- secrets, raw tokens, cookies, private keys, passwords;
- `.env`;
- `auth.json`;
- service role keys;
- raw credential files;
- raw private project dumps.
