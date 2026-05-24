# GitHub Contribution Visibility Audit v28

- generated_at: 2026-05-24T22:08:50Z
- repo: `pltnv123/webstudio-ops-dashboard`
- local_repo: `/workspace/tmp/webstudio-ops-dashboard-pr`
- current_branch: `webstudio/hardening-v3-host-completion`
- latest_local_commit: `f63d1d1a6e3e2559f9d07ec6615a658247b0dda5`
- remote_url: `https://github.com/pltnv123/webstudio-ops-dashboard.git`
- prior_host_autopush_status: `UPDATED_REMOTE_VERIFIED`
- prior_remote_branch_commit: `f63d1d1a6e3e2559f9d07ec6615a658247b0dda5`
- prior_pr_head_commit: `f63d1d1a6e3e2559f9d07ec6615a658247b0dda5`
- prior_checks_status: `NO_CHECKS_CONFIGURED`
- prior_owner_action_required: `False`
- workflows_present_in_repo: `False`

## Diagnosis

Owner-visible contribution graph is likely not updating for two independent reasons:

1. **Branch/mainline:** latest verified work is in PR branch `webstudio/hardening-v3-host-completion`; it is not locally/host-auth verified as merged into default branch yet.
2. **Author attribution:** previous host PR evidence shows commits authored by GitHub login `hermes-agent`. If owner watches `pltnv123` profile, commits attributed to another login/email will not appear on that profile even after merge.
3. **Private repo setting / GitHub delay:** repository is not readable unauthenticated from Docker (`404` via public API), so if it is private, owner profile must have private contributions enabled; GitHub graph can also lag after merge.

## Contribution criteria checklist

- Standalone repo: yes, repository slug is `pltnv123/webstudio-ops-dashboard`.
- Commit author email associated with the target owner account: **not confirmed from Docker**. Prior GitHub PR evidence attributes commits to `hermes-agent`.
- Author name/email in this report: redacted.
- Author date vs commit date: see sanitized latest commit below.
- Default branch visibility: **not confirmed merged**; latest work is PR branch by current evidence.
- Private contributions enabled on owner profile: **not safely checkable from Docker**; requires owner profile setting or host-auth UI/API evidence.

## Latest commit, sanitized

```text
commit f63d1d1a6e3e2559f9d07ec6615a658247b0dda5
Author:     Hermes Agent <***@users.noreply.github.com>
AuthorDate: 2026-05-24T21:45:46Z
Commit:     Hermes Agent <***@users.noreply.github.com>
CommitDate: 2026-05-24T21:47:58Z

    feat: add WebStudio client intake and order builder v27
```

## Last 5 commits, sanitized

```text
commit f63d1d1a6e3e2559f9d07ec6615a658247b0dda5
Author:     Hermes Agent <***@users.noreply.github.com>
AuthorDate: 2026-05-24T21:45:46Z
Commit:     Hermes Agent <***@users.noreply.github.com>
CommitDate: 2026-05-24T21:47:58Z

    feat: add WebStudio client intake and order builder v27

commit dc806425cf5de0aec6e7981968e234821de90979
Author:     Hermes Agent <***@users.noreply.github.com>
AuthorDate: 2026-05-24T21:08:39Z
Commit:     Hermes Agent <***@users.noreply.github.com>
CommitDate: 2026-05-24T21:08:39Z

    feat: add Premium Motion Factory v25/v26

commit b10acae6bd6130e60b3fccea3ddbe7878c288398
Author:     Hermes Agent <***@users.noreply.github.com>
AuthorDate: 2026-05-24T12:30:30Z
Commit:     Hermes Agent <***@users.noreply.github.com>
CommitDate: 2026-05-24T12:30:30Z

    fix: add bounded QMD maintenance and system green pass

commit d1f247d78fa294e0841926fdc7131c4a6f82539b
Author:     Hermes Agent <***@users.noreply.github.com>
AuthorDate: 2026-05-24T11:36:20Z
Commit:     Hermes Agent <***@users.noreply.github.com>
CommitDate: 2026-05-24T11:36:20Z

    feat: add WebStudio full operational readiness v21

commit ec55fbad3d8f38a1af319ae27b1c34edeebc0d9a
Author:     Hermes Agent <***@users.noreply.github.com>
AuthorDate: 2026-05-24T11:10:17Z
Commit:     Hermes Agent <***@users.noreply.github.com>
CommitDate: 2026-05-24T11:10:17Z

    chore: surface host runner maintenance status
```

## Local git identity, sanitized

- user.name: `Hermes Agent`
- user.email: `***@users.noreply.github.com`

## Required host-auth checks queued/needed

A host job should verify without printing raw emails:

- `gh repo view pltnv123/webstudio-ops-dashboard --json defaultBranchRef,isPrivate,viewerPermission`
- `gh pr view 1 --json headRefOid,baseRefOid,mergeStateStatus,mergeable,statusCheckRollup,commits`
- `gh api user` login matches target profile yes/no
- `gh api user/emails` contains current commit email yes/no, redacted only
- default branch head after safe merge or approval packet

## Current conclusion

**Root cause is not “GitHub graph did not update”.** Current evidence points to: PR branch not in default branch + commit author/login mismatch for the owner profile.
