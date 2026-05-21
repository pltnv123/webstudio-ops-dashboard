#!/usr/bin/env bash
set -Eeuo pipefail

# WebStudio Hardening v2: host-side GitHub repair + branch + PR packet.
# Run on the HOST, not inside the Docker sandbox:
#   bash /home/hermes/.hermes/cache/documents/github-host-repair-and-pr-v2.sh
# or if /workspace is mounted on host:
#   bash /workspace/output/github-host-repair-and-pr-v2.sh

BRANCH="webstudio/hardening-v2-ops-cockpit-kanban"
ACCOUNT="pltnv123"
SRC_DIR="${SRC_DIR:-/home/hermes/workspace/projects/webstudio-ops-dashboard}"
SANDBOX_SRC_DIR="${SANDBOX_SRC_DIR:-/home/hermes/.hermes/cache/documents/webstudio-ops-dashboard-src}"
REPO_URL="${REPO_URL:-}"
REPO_DIR="${REPO_DIR:-/home/hermes/workspace/webstudio-ops-dashboard-repo}"
COMMIT_MSG="WebStudio Hardening v2: Ops Cockpit Kanban and worker health"

redact() {
  sed -E 's/(gho_|ghp_|github_pat_)[A-Za-z0-9_]+/[REDACTED_TOKEN]/g; s#(https://)[^/@]+@#\1[REDACTED]@#g; s/(token|secret|password|credential)=([^[:space:]]+)/\1=[REDACTED]/Ig'
}

log(){ printf '\n== %s ==\n' "$*"; }
fail(){ echo "FAIL: $*" >&2; exit 1; }

log "Locate gh"
if ! command -v gh >/dev/null 2>&1; then
  echo "gh not found. Trying non-interactive install options where available."
  if command -v apt-get >/dev/null 2>&1; then
    echo "Need sudo/root to install gh if missing. Suggested command:"
    echo "  sudo apt-get update && sudo apt-get install -y gh"
  fi
  fail "Install GitHub CLI on host or put gh on PATH, then rerun."
fi
command -v gh

log "Verify git + gh auth"
command -v git >/dev/null 2>&1 || fail "git missing"
gh auth status 2>&1 | redact || fail "gh auth status failed. Run: gh auth login"

log "Find or set repo"
if [[ -z "$REPO_URL" ]]; then
  echo "Repos for $ACCOUNT:" >&2
  gh repo list "$ACCOUNT" --limit 30 2>&1 | redact >&2 || true
  cat >&2 <<'MSG'
Set REPO_URL to the correct repository before rerun if auto-detection cannot choose safely, for example:
  REPO_URL=https://github.com/pltnv123/<repo>.git bash github-host-repair-and-pr-v2.sh
MSG
  fail "REPO_URL is required to avoid committing to the wrong repo."
fi

log "Clone/update repo"
mkdir -p "$(dirname "$REPO_DIR")"
if [[ ! -d "$REPO_DIR/.git" ]]; then
  git clone "$REPO_URL" "$REPO_DIR" 2>&1 | redact
fi
cd "$REPO_DIR"
git fetch origin 2>&1 | redact
BASE="origin/main"
git rev-parse --verify origin/main >/dev/null 2>&1 || BASE="origin/master"
git switch -C "$BRANCH" "$BASE"

log "Copy files"
if [[ -d "$SRC_DIR" ]]; then
  FROM="$SRC_DIR"
elif [[ -d "$SANDBOX_SRC_DIR" ]]; then
  FROM="$SANDBOX_SRC_DIR"
else
  fail "Source dashboard dir not found. Copy sandbox /workspace/projects/webstudio-ops-dashboard to host first or set SRC_DIR."
fi
mkdir -p projects/webstudio-ops-dashboard/src projects/webstudio-ops-dashboard/scripts
cp "$FROM/src/index.html" projects/webstudio-ops-dashboard/src/index.html
cp "$FROM/src/app.js" projects/webstudio-ops-dashboard/src/app.js
cp "$FROM/src/styles.css" projects/webstudio-ops-dashboard/src/styles.css
cp "$FROM/scripts/build_snapshot.py" projects/webstudio-ops-dashboard/scripts/build_snapshot.py

log "Verify diff"
git status --short
git diff --stat
if git diff --quiet; then
  echo "No diff to commit."
else
  git add projects/webstudio-ops-dashboard/src/index.html projects/webstudio-ops-dashboard/src/app.js projects/webstudio-ops-dashboard/src/styles.css projects/webstudio-ops-dashboard/scripts/build_snapshot.py
  git commit -m "$COMMIT_MSG"
fi

log "Push + PR"
git push -u origin "$BRANCH" 2>&1 | redact
PR_BODY=$(cat <<'MSG'
WebStudio Hardening v2 for Ops Cockpit/Kanban:
- Compact production/physical Kanban visibility.
- Worker Health and repeated-crashes detector cards.
- GitHub repair status and packet links.
- Native-vs-logical Kanban semantics status.
- Snapshot/QMD/system hardening fields in static control-plane snapshot.

Safety: dashboard/static snapshot changes only; no secrets, no production DB writes, no deploy.
MSG
)
gh pr create --fill --title "$COMMIT_MSG" --body "$PR_BODY" 2>&1 | redact || gh pr view --web
