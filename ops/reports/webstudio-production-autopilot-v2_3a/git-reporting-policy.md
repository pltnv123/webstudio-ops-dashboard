# Git Reporting Policy

- Secret values, tokens, `.env`, private keys, and credential internals are never printed.
- Branch sync must record branch/upstream/ahead/behind before write operations.
- If behind and fast-forward is possible, use `git pull --ff-only`.
- If diverged or conflicts appear, stop with PARTIAL.
- Commit scope for this task is limited to `ops/reports/webstudio-production-autopilot-v2_3a/`.
- No force push.
