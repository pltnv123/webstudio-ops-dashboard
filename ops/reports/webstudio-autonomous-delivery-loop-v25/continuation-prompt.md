# Continuation prompt — WebStudio V2.5

Current baseline: autonomous delivery loop policy installed.

Next safe action:
- Use this V2.5 loop for the next WebStudio production change from durable default branch `webstudio/product-build-v31`.
- For code changes, run build/smoke/secret scan before deploy acceptance.
- For every important step, write `/output` evidence, push sanitized `ops/reports/...`, and write a Supabase status row.

Safety constraints remain:
- no force push;
- no branch deletion;
- no destructive Supabase changes;
- no secret exposure;
- no officebot;
- no gateway/systemd restart without explicit approval.
