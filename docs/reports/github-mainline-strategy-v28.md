# GitHub Mainline Strategy v28

- generated_at: 2026-05-24T22:08:50Z
- repo: `pltnv123/webstudio-ops-dashboard`
- PR: https://github.com/pltnv123/webstudio-ops-dashboard/pull/1
- PR branch: `webstudio/hardening-v3-host-completion`
- latest local SHA: `f63d1d1a6e3e2559f9d07ec6615a658247b0dda5`

## Case selected

**Case 1: PR branch contains latest work, default branch/mainline is behind or not verified current.**

Evidence:
- Previous Host Runner Auto-Push: `UPDATED_REMOTE_VERIFIED`.
- Previous PR head: `f63d1d1a6e3e2559f9d07ec6615a658247b0dda5`.
- Local HEAD: `f63d1d1a6e3e2559f9d07ec6615a658247b0dda5`.
- No local `.github/workflows` directory found, so no repo-local GitHub Actions/deploy workflow is visible in this checkout.

## Merge policy decision

A merge to default branch is safe to attempt only if host-authenticated checks confirm all of this:

1. PR #1 head equals expected latest SHA after v28 push.
2. Working tree is clean.
3. Build/smoke/secret scan pass.
4. GitHub checks are absent or non-failing.
5. Mergeable state is not blocked/conflicting.
6. No `.github/workflows` / deploy hook exists in repo checkout.
7. PR diff has no secrets and no destructive deletes.

If any item is uncertain, host job must create `/workspace/output/github-mainline-merge-approval-packet-v28.md` and continue product work without merge.

## Contribution visibility fix ladder

1. **Mainline:** merge PR into default branch if host checks are safe.
2. **Author identity:** if target profile is `pltnv123`, future commits must use an email associated with `pltnv123`. Current evidence says commits are attributed to `hermes-agent`.
3. **Private graph:** if repo is private, owner must enable private contributions on GitHub profile for squares to show publicly.
4. **Delay:** after merge + correct author, allow GitHub graph propagation lag.

## Host job action

A host-side v28 job will be queued to:
- run build/smoke/secret scan;
- push new v28 commit to PR branch;
- verify PR head/checks;
- if safe, merge PR #1 to default branch using squash;
- verify default branch SHA;
- write sanitized result JSON/report.

