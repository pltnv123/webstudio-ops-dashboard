# WebStudio V2.5 — Incident Response

## Gateway restart loop

Symptoms: repeated gateway shutdown warnings, interrupted tasks, unstable Work Factory runs.

Response:

1. Do not restart gateway/systemd unless explicitly authorized.
2. Read host health snapshot when available.
3. Preserve current task state in `/workspace/output/...`.
4. Avoid long uncheckpointed work.
5. Return `PARTIAL` with continuation prompt if runtime is unstable.
6. Use approved restart path only when owner approves: delayed post-turn restart procedure, not ad hoc systemd commands.

## Failed GitHub Actions

Response:

1. Inspect latest run and failed job logs.
2. Identify whether failure is build, smoke, Pages artifact, or deploy.
3. Do not deploy broken code.
4. Fix only scoped cause or revert offending change.
5. Push sanitized fix/revert.
6. Verify workflow success and Pages HTTP 200.
7. Write Supabase status/incident row.

## Supabase timeout

Response:

1. Avoid identical retry loops.
2. Save local reports and continuation prompt.
3. If row write cannot be proven, state `Supabase row written: no`.
4. Resume from saved SQL/status insert when MCP recovers.

## Pages deploy failure

Response:

1. Keep default branch stable.
2. Inspect workflow run and Pages deploy job.
3. Revert commit or workflow change if needed.
4. Verify new workflow success and URL HTTP 200.
5. Record incident and rollback evidence.

## Rollback flow

1. Choose safest revert commit.
2. Run local checks when code changes are involved.
3. Push revert without force.
4. Wait for Actions success.
5. Verify URL HTTP 200.
6. Write Supabase row.
7. Save final incident report.
