# Updated Hermes Tooling Policy — WebStudio night run v6.tools

## Default tools
- Use `tool_search` and `tool_describe` for any deferred/MCP tool before first use.
- Use direct Supabase MCP for safe schema/table inspection and operational status rows.
- Use GitHub MCP for safe file pushes when it can preserve branch scope and changed-file allowlists are reviewed.
- Use browser route verification for rendered Pages evidence; use curl/static smoke for deterministic HTTP, bytes, hash, and marker checks.
- Use terminal/file tools for local build, smoke, git diff, report writes, and hfinalize.
- Use QMD safe commands only: `qmd status`, `qmd update`, `qmd search`, `qmd get`, `qmd ls`.
- Use session/memory/context tools for recovery context; do not rely on stale memory over live repo/runtime evidence.

## Caution tools
- GitHub MCP writes: only after branch/head verification, changed-file review, credential-shaped scan, and owner-approved scope. Never force push.
- Supabase MCP writes: only non-destructive operational rows; no DDL/destructive data changes without explicit approval.
- Cron continuation: finite repeats, checkpoint-first prompt, one phase per tick, no recursive cron creation.
- Browser automation: safe for public route verification; avoid credentialed/private pages.
- QMD vector/embed/query: not used unless explicitly approved due VPS cost/runtime risk.

## Disabled/unavailable
- `hermes tools --summary` from non-TTY.
- Sandbox HTTPS `git push` without credentials.
- Docker image recreate/update from sandbox.
- Destructive Git, Supabase writes, cloud resources, live client-send/CRM/payment actions.

## GitHub MCP vs host bridge
Use GitHub MCP first when:
- branch is known (`webstudio/product-build-v31`),
- remote head is verified,
- file list is small and allowlisted,
- content can be pushed as a normal commit without force.

Use host bridge when:
- preserving an exact local commit SHA is required,
- GitHub MCP cannot push safely,
- or MCP is unavailable.

## Supabase MCP vs defer
Use Supabase MCP for `list_tables`, `execute_sql` read checks, and insert/update of non-sensitive ops rows. Defer if schema is unknown, MCP disconnected, or write would be destructive/client-data-bearing.

## Browser vs curl
Use curl for status/bytes/hash/marker. Use browser when route rendering/navigation needs evidence from the app shell.

## Memory/context/session tools
Use session search / LCM / memory when recovering previous phase decisions or owner constraints. Live files, git, runtime CLI, and public route checks override stale memory.

## Stop-gate
No new product phase while the current phase has pending remote push, GitHub Actions deploy, public route smoke, Supabase row, reports, checkpoint, or hfinalize.

## Secret safety
Never print, commit, log, or expose `.env`, tokens, cookies, auth files, service-role keys, private keys, or raw credential scopes. Scans may mention only sanitized PASS/FAIL.
