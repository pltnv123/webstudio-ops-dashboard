#!/usr/bin/env bash
set -euo pipefail
# Host-side GitHub repair + optional PR helper for WebStudio Ops Dashboard.
# Run on host as hermes user, NOT inside Docker, because Docker currently has only /workspace/bin/gh wrapper and no /usr/bin/gh binary.
# Safety: does not print tokens; does not push unless RUN_PR=1 and repo is explicitly selected.

WORKSPACE=${WORKSPACE:-/home/hermes/workspace}
DASH="$WORKSPACE/projects/webstudio-ops-dashboard"
export HOME=${HOME:-/home/hermes}
export GH_CONFIG_DIR=${GH_CONFIG_DIR:-$HOME/.config/gh}

redact() {
  sed -E 's/(Token:).*/\1 REDACTED/I; s/(Token scopes:).*/\1 REDACTED/I; s#(/[A-Za-z0-9._/-]*hosts.yml)#REDACTED_HOSTS_YML#g; s/(gho_|ghp_|github_pat_)[A-Za-z0-9_]+/REDACTED_TOKEN/g'
}

printf '## GitHub binary\n'
if ! command -v gh >/dev/null 2>&1; then
  echo 'BLOCKED: gh is not installed on host PATH. Install GitHub CLI package or expose real binary at /usr/bin/gh.'
  exit 2
fi
command -v gh

printf '\n## GitHub auth redacted\n'
gh auth status 2>&1 | redact || true

printf '\n## Candidate repos\n'
gh repo list pltnv123 --limit 50 2>&1 | redact || true

if [[ ! -d "$DASH" ]]; then
  echo "BLOCKED: dashboard path missing: $DASH"
  exit 3
fi

cd "$DASH"
printf '\n## Local dashboard status\n'
git status --porcelain=v1 -uall || true

if [[ "${RUN_PR:-0}" != "1" ]]; then
  cat <<'MSG'
DRY RUN COMPLETE.
To create a docs/dashboard branch+PR after reviewing repo remote and diff:
  RUN_PR=1 REPO=<owner/repo> bash /workspace/output/github-host-repair-and-pr-v3.sh
MSG
  exit 0
fi

: "${REPO:?Set REPO=owner/repo for the target dashboard repository}"
BRANCH=${BRANCH:-webstudio-production-kanban-v3}

printf '\n## Remote / branch\n'
git remote -v || true
if ! git remote get-url origin >/dev/null 2>&1; then
  git remote add origin "https://github.com/${REPO}.git"
fi
git fetch origin main --quiet || git fetch origin master --quiet
BASE=$(git symbolic-ref --quiet --short refs/remotes/origin/HEAD 2>/dev/null | sed 's#origin/##' || true)
BASE=${BASE:-main}
git checkout -B "$BRANCH" "origin/$BASE"

# Copy current workspace dashboard files if script is run from a checkout that has them staged externally.
git add src scripts package.json README.md 2>/dev/null || git add .
if git diff --cached --quiet; then
  echo 'No dashboard changes to commit.'
  exit 0
fi
git commit -m 'feat: harden WebStudio production Kanban dashboard v3'
git push -u origin "$BRANCH"
gh pr create --repo "$REPO" --base "$BASE" --head "$BRANCH" --title 'WebStudio Production Kanban Board v3' --body 'Production Kanban/Ops Cockpit hardening v3. Safety: no secrets, no production DB writes, dashboard is read-only projection.'
