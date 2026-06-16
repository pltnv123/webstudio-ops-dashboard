# Cleanup Plan v3.2 — Report Only

No deletion performed.

Safe candidates for owner-approved cleanup after review:

1. Old `/workspace/output/*` phase reports that are already pushed or superseded.
2. Old `/workspace/tmp/*` clones not used by active branches.
3. Old host-job logs under `/workspace/output/host-job-runner/` after preserving latest proof.
4. Old build dist directories under `/workspace/output/webstudio-ops-dashboard-static*` if regenerated.

Owner approval command pattern, after reviewing exact paths:

```bash
# example only — replace with reviewed exact paths
rm -rf /workspace/output/<reviewed-old-output-dir>
```

Do not delete protected dirs or Supabase data.
