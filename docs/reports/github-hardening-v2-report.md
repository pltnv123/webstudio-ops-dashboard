# GitHub Hardening v2 Report

## Verdict
PARTIAL: GitHub cannot be used from this Docker sandbox because only `/workspace/bin/gh` exists and it delegates to missing `/usr/bin/gh`. `/workspace/projects/webstudio-ops-dashboard` is not a git repository. A host-side executable repair/PR script was created.

## Evidence
```text
/workspace/bin/gh
ls: cannot access '/usr/bin/gh': No such file or directory
ls: cannot access '/usr/local/bin/gh': No such file or directory
ls: cannot access '/snap/bin/gh': No such file or directory
ls: cannot access '/home/hermes/.local/bin/gh': No such file or directory
-rwxr-xr-x 1 1005 1005 116 May  7 10:17 /workspace/bin/gh
/workspace/bin/gh: line 4: /usr/bin/gh: No such file or directory
```

## Repository state checked
- `/workspace/projects/webstudio-ops-dashboard`: not a git repository.
- `/workspace`: not a git repository.
- `/home/hermes/workspace`: missing inside sandbox.
- `/home/hermes/.hermes/hermes-agent`: missing inside sandbox.

## Deliverable
- Executable repair script: `/workspace/output/github-host-repair-and-pr-v2.sh`
- Script sha256: `23ea6850745d03e27fc65838d45020b0cd8ed4a9b939fa75efe7a799cd1d0565`

## Owner command
```bash
bash /home/hermes/.hermes/cache/documents/github-host-repair-and-pr-v2.sh
# If auto repo detection stops safely, rerun with exact repo:
REPO_URL=https://github.com/pltnv123/<repo>.git bash /home/hermes/.hermes/cache/documents/github-host-repair-and-pr-v2.sh
```

## Why no PR from sandbox
- No real `gh` binary is available in sandbox.
- No repo checkout/remotes exist for the dashboard path.
- Creating a repo or choosing a repo name without owner/repo source would risk committing to the wrong target.
