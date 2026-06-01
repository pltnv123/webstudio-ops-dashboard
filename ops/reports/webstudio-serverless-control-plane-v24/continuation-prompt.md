# Continuation prompt — WebStudio V2.4

Current state: V2.4 serverless control-plane baseline reports generated.

Next safe action:
1. Resolve branch alignment: make `webstudio/product-build-v31` the durable/default deployment branch or merge it into `main` after explicit owner approval.
2. Re-run GitHub Pages workflow on the durable branch.
3. Confirm Supabase final V2.4 row points to the latest report commit.

Constraints:
- Do not delete VPS data.
- Do not delete Supabase data.
- Do not rotate secrets.
- Do not expose secrets.
- Do not use officebot.
- Do not restart gateway/systemd.
