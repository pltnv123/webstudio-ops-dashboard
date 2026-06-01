# WebStudio V2.5 — Deploy Policy

## Deployment path

- Deploy target: GitHub Pages.
- Deploy mechanism: GitHub Actions workflow `pages.yml`.
- Durable branch: `webstudio/product-build-v31`.
- Public URL: `https://pltnv123.github.io/webstudio-ops-dashboard/`.

## Deploy acceptance

A deployment is accepted only when:

1. the workflow run is on `webstudio/product-build-v31`;
2. the workflow completed with conclusion `success`;
3. the run head SHA equals the intended delivery commit or an explicitly verified newer commit;
4. the Pages URL returns HTTP 200;
5. generated evidence is saved under `/workspace/output/...` and sanitized copy is pushed to `ops/reports/...` when in scope.

## Rollback

Preferred rollback order:

1. revert the bad commit or workflow change;
2. push the revert to the durable default branch;
3. wait for GitHub Actions deploy success;
4. verify Pages HTTP 200;
5. write Supabase incident/status row;
6. save incident report and validation.

No branch deletion or force push is part of normal rollback.
