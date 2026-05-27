#!/usr/bin/env python3
"""Build read-only WebStudio control-plane snapshot and optional static dist."""
from __future__ import annotations

import argparse
import hashlib
import json
import os
import re
import signal
import shutil
import subprocess
import time
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

try:
    from d1_owner_feedback_backend import build_owner_feedback_state as build_d1_owner_feedback_state
except Exception:  # snapshot must stay available even if optional owner feedback backend import fails
    build_d1_owner_feedback_state = None

try:
    from d3_intake_backend import build_inbox_state as build_d3_inbox_state
except Exception:  # snapshot must stay available even if optional intake backend import fails
    build_d3_inbox_state = None

try:
    from d3_client_qualification import build_qualification_state as build_d3_qualification_state
except Exception:  # snapshot must stay available even if optional qualification workflow import fails
    build_d3_qualification_state = None

WORKSPACE = Path(os.environ.get("WORKSPACE", "/workspace"))
ROOT = Path(__file__).resolve().parents[1]
SRC = ROOT / "src"
PUBLIC_DATA = ROOT / "public" / "data"
OUTPUT = WORKSPACE / "output"
RUNTIME = WORKSPACE / "runtime"
STATE_PATH = OUTPUT / "work-factory-supervisor-state.json"
CHECKPOINT_PATH = OUTPUT / "work-factory-supervisor-checkpoint.md"
LIVE_KANBAN_PATH = OUTPUT / "work-factory-live-kanban-v3-status.md"
HOST_SNAPSHOT_PATH = RUNTIME / "host-health-snapshot.txt"
CONTROL_STATE_PATH = PUBLIC_DATA / "webstudio-control-plane-state.json"
CANONICAL_OUTPUT_STATE_PATH = OUTPUT / "webstudio-control-plane-state.json"
CONTINUATION_POLICY_PATH = OUTPUT / "webstudio-continuation-policy-v1.md"
CONTINUATION_CHECKPOINT_PATH = OUTPUT / "current-task-continuation-checkpoint.md"
CONTINUATION_CARD_TITLE = "[WEBSTUDIO][OPS] Continuation controller / no-partial policy"
AGENT_WORKFLOW_SCREENSHOT_PATH = OUTPUT / "webstudio-agent-workflow-screenshot.png"
GITHUB_PR1_STATUS_PATH = OUTPUT / "webstudio-github-pr1-status.json"
PRODUCT_PROGRESS_PATH = OUTPUT / "webstudio-product-progress-v1.json"
CONTROL_HISTORY_PATH = PUBLIC_DATA / "webstudio-control-plane-history.json"

FORBIDDEN_ACTIONS = [
    "dispatch", "run", "daemon", "unblock", "reclaim", "deploy", "release",
    "systemd_write", "cron_write", "config_write", "env_write", "db_write",
]

AGENT_ROLES = [
    {"name": "CTO Agent", "profile": "default", "section": "CTO Planning Queue", "task_types": ["planning_refinement", "prd", "acceptance_criteria"]},
    {"name": "Orchestrator Agent", "profile": "orchestrator", "section": "Orchestrator Dispatch Queue", "task_types": ["routing_coordination", "task_split", "kanban_hygiene"]},
    {"name": "Frontend Agent", "profile": "frontend", "section": "Frontend Work", "task_types": ["frontend_execution", "ui", "accessibility"]},
    {"name": "Backend Agent", "profile": "backend", "section": "Backend Work", "task_types": ["backend_execution", "api", "schema"]},
    {"name": "QA Agent", "profile": "qa", "section": "QA Queue", "task_types": ["qa_validation", "smoke", "acceptance"]},
    {"name": "Ops Agent", "profile": "ops/default", "section": "Ops / Infrastructure", "task_types": ["ops_infrastructure", "qmd", "snapshot", "dashboard"]},
    {"name": "Research Agent", "profile": "researcher", "section": "Research Queue", "task_types": ["research_discovery", "docs", "source_research"]},
    {"name": "Sales/Client Agent", "profile": "default", "section": "Sales / Client Intake", "task_types": ["sales_client_intake", "qualification", "proposal"]},
    {"name": "Delivery Agent", "profile": "orchestrator", "section": "Delivery / Handoff", "task_types": ["delivery_handoff", "handoff", "support"]},
]

PRODUCT_LINES = [
    {"id": "D1", "name": "Landing pages / websites", "status": "enabled", "autonomy_levels": ["A", "B", "C", "D"]},
    {"id": "D2", "name": "AI-intake Telegram bots", "status": "enabled", "autonomy_levels": ["A", "B", "C", "D"]},
    {"id": "D3", "name": "Business automation", "status": "enabled", "autonomy_levels": ["A", "B", "C", "D"]},
]


def utc_now() -> str:
    return datetime.now(timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z")


def sha256_file(path: Path) -> str | None:
    if not path.exists() or not path.is_file():
        return None
    h = hashlib.sha256()
    with path.open("rb") as f:
        for chunk in iter(lambda: f.read(1024 * 1024), b""):
            h.update(chunk)
    return h.hexdigest()


def stat_info(path: Path) -> dict[str, Any]:
    if not path.exists():
        return {"path": str(path), "exists": False}
    st = path.stat()
    return {
        "path": str(path),
        "exists": True,
        "size": st.st_size,
        "mtime": datetime.fromtimestamp(st.st_mtime, timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z"),
        "sha256": sha256_file(path) if path.is_file() else None,
    }


def latest_file_info(pattern: str, root: Path = OUTPUT) -> dict[str, Any]:
    files = sorted(root.glob(pattern), key=lambda x: x.stat().st_mtime, reverse=True) if root.exists() else []
    return stat_info(files[0]) if files else {"path": str(root / pattern), "exists": False}


def load_json(path: Path, default: Any) -> Any:
    try:
        return json.loads(path.read_text())
    except Exception:
        return default


def read_text(path: Path, limit: int = 80_000) -> str:
    try:
        return path.read_text(errors="replace")[:limit]
    except Exception:
        return ""


def run_cmd(args: list[str], timeout: int = 20) -> dict[str, Any]:
    env = os.environ.copy()
    env["PATH"] = "/workspace/bin:/workspace/.hermes/node/bin:" + env.get("PATH", "")
    env.setdefault("HOME", "/workspace")
    command_text = " ".join(args)
    if os.environ.get("WEBSTUDIO_SKIP_HOST_CLI") == "1" and re.search(r"\b(hermes|qmd)\b", command_text):
        return {"ok": False, "returncode": None, "stdout": "", "stderr": "skipped by WEBSTUDIO_SKIP_HOST_CLI=1"}
    try:
        p = subprocess.Popen(
            args,
            text=True,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            env=env,
            start_new_session=True,
        )
        try:
            stdout, stderr = p.communicate(timeout=timeout)
        except subprocess.TimeoutExpired:
            with contextlib.suppress(ProcessLookupError):
                os.killpg(p.pid, signal.SIGKILL)
            stdout, stderr = p.communicate()
            return {"ok": False, "returncode": None, "stdout": stdout or "", "stderr": (stderr or "") + f"\ncommand timed out after {timeout}s"}
        p.stdout = stdout
        p.stderr = stderr
        return {"ok": p.returncode == 0, "returncode": p.returncode, "stdout": p.stdout, "stderr": p.stderr}
    except Exception as e:
        return {"ok": False, "returncode": None, "stdout": "", "stderr": str(e)}


def parse_markdown_counts(text: str) -> dict[str, Any]:
    out: dict[str, Any] = {}
    patterns = {
        "mirror_total": r"mirror_total\s*[:=]\s*`?([0-9]+)`?",
        "completed_count": r"completed count\s*[:=]\s*`?([0-9]+)`?",
        "pending_count": r"pending count\s*[:=]\s*`?([0-9]+)`?",
        "approval_required_count": r"approval_required count\s*[:=]\s*`?([0-9]+)`?",
        "blocked_error_count": r"blocked/error count\s*[:=]\s*`?([0-9]+)`?",
        "ready_todo_running_mirror_count": r"ready/todo/running mirror count\s*[:=]\s*`?([0-9]+)`?",
    }
    for key, rx in patterns.items():
        m = re.search(rx, text, re.I)
        if m:
            out[key] = int(m.group(1))
    for key in ["heartbeat_card_id", "status_card_id", "overview_card_id"]:
        m = re.search(key + r"\s*[:=]\s*`?([A-Za-z0-9_\-]+)`?", text, re.I)
        if m:
            out[key] = m.group(1)
    for key in ["dispatch_executed", "worker_tasks_started"]:
        m = re.search(key + r"\s*[:=]\s*`?(true|false)`?", text, re.I)
        if m:
            out[key] = m.group(1).lower() == "true"
    return out


def build_work_factory(raw: dict[str, Any]) -> dict[str, Any]:
    backlog = raw.get("backlog") if isinstance(raw.get("backlog"), list) else []
    by_status: dict[str, int] = {}
    latest_completed = []
    pending = []
    blocked = []
    approvals = []
    for item in backlog:
        if not isinstance(item, dict):
            continue
        st = str(item.get("status") or "unknown")
        by_status[st] = by_status.get(st, 0) + 1
        slim = {k: item.get(k) for k in ["id", "title", "status", "category", "kind", "output", "sha256", "completed_at", "started_at"] if k in item}
        if st == "completed":
            latest_completed.append(slim)
        elif st in {"pending", "ready", "todo"}:
            pending.append(slim)
        elif "approval" in st:
            approvals.append(slim)
        elif st in {"blocked", "failed", "failed_retryable", "failed_terminal", "error"} or "error" in st:
            blocked.append(slim)
    latest_completed.sort(key=lambda x: str(x.get("completed_at") or ""), reverse=True)
    return {
        "source_of_truth": str(STATE_PATH),
        "source": stat_info(STATE_PATH),
        "schema_version": raw.get("schema_version"),
        "mode": raw.get("mode"),
        "enabled": raw.get("enabled"),
        "timer_enabled": raw.get("timer_enabled"),
        "updated_at": raw.get("updated_at"),
        "last_event": raw.get("last_event"),
        "progress": raw.get("progress", {}),
        "queues": raw.get("queues", {}),
        "by_status": by_status,
        "counts": {
            "backlog_total": len(backlog),
            "completed": by_status.get("completed", 0),
            "pending": sum(by_status.get(x, 0) for x in ["pending", "ready", "todo"]),
            "approval_required": sum(v for k, v in by_status.items() if "approval" in k),
            "blocked_error": sum(v for k, v in by_status.items() if k in {"blocked", "failed", "failed_retryable", "failed_terminal", "error"} or "error" in k),
        },
        "latest_completed": latest_completed[:25],
        "pending": pending[:50],
        "approval_required": approvals[:50],
        "blocked_error": blocked[:50],
        "roadmap_manager": raw.get("roadmap_manager", {}),
        "capability_inventory": raw.get("capability_inventory", {}),
        "kanban_live_v3": raw.get("kanban_live_v3", {}),
        "safety": raw.get("safety", {}),
        "time_aware": raw.get("time_aware_work_factory_v4", {}),
    }


def build_kanban() -> dict[str, Any]:
    # Kanban reads can be slow on cold starts, so give the CLI enough room to
    # return a full projection instead of falling back to an empty dashboard.
    list_result = run_cmd(["hermes", "kanban", "list", "--archived", "--json"], timeout=90)
    stats_result = run_cmd(["hermes", "kanban", "stats"], timeout=60)
    tasks = []

    if list_result["ok"]:
        try:
            tasks = json.loads(list_result["stdout"])
        except Exception:
            tasks = []
    counts: dict[str, int] = {}
    assignees: dict[str, dict[str, int]] = {}
    mirrors = []
    sys_cards = []
    approvals = []
    executable_mirror_cards = []
    duplicate_key_candidates: dict[str, int] = {}
    for t in tasks if isinstance(tasks, list) else []:
        if not isinstance(t, dict):
            continue
        st = str(t.get("status") or "unknown")
        counts[st] = counts.get(st, 0) + 1
        assignee = str(t.get("assignee") or "unassigned")
        assignees.setdefault(assignee, {})[st] = assignees.setdefault(assignee, {}).get(st, 0) + 1
        title = str(t.get("title") or "")
        body = str(t.get("body") or "")
        slim = {k: t.get(k) for k in ["id", "title", "status", "assignee", "priority", "created_at", "started_at", "completed_at", "updated_at", "tenant", "idempotency_key", "metadata"]}
        slim["body"] = body[:2000]
        is_mirror = any(x in title or x in body for x in ["[WF", "MIRROR ONLY", "DO NOT DISPATCH", "dispatch_allowed=false", "worker_allowed=false"])
        is_sys = title.startswith("[SYS]") or "mirror_type=sys" in body
        if is_mirror:
            mirrors.append(slim)
            if st in {"triage", "todo", "scheduled", "ready", "running"}:
                executable_mirror_cards.append(slim)
        if is_sys:
            sys_cards.append(slim)
        if "OWNER DECISION" in title or "APPROVAL" in title or "OWNER DECISION" in body:
            approvals.append(slim)
        m = re.search(r"idempotency[_ -]?key\s*[:=]\s*([A-Za-z0-9:_\-./]+)", body, re.I)
        # Duplicate-key safety was designed for mirror/SYS cards. Specifier-created
        # WebStudio production child cards may inherit the parent body/idempotency
        # marker as context, but they are separate executable work packets.
        if m and st not in {"done", "archived"} and not str(m.group(1)).startswith("webstudio:"):
            # Archived/Done mirrors are historical evidence, not executable
            # production-board pollution. Duplicate detection is an active-lane
            # guardrail only.
            duplicate_key_candidates[m.group(1)] = duplicate_key_candidates.get(m.group(1), 0) + 1
    duplicate_keys = {k: v for k, v in duplicate_key_candidates.items() if v > 1}
    all_slim_tasks = []
    for t in tasks if isinstance(tasks, list) else []:
        if not isinstance(t, dict):
            continue
        item = {k: t.get(k) for k in ["id", "title", "status", "assignee", "priority", "created_at", "started_at", "completed_at", "updated_at", "tenant", "idempotency_key", "metadata"]}
        item["body"] = str(t.get("body") or "")[:2000]
        all_slim_tasks.append(item)
    last_cards = sorted(
        all_slim_tasks,
        key=lambda x: x.get("created_at") or 0,
        reverse=True,
    )[:25]
    lane_order = ["triage", "todo", "scheduled", "ready", "running", "blocked", "review", "done", "archived"]
    lanes: dict[str, list[dict[str, Any]]] = {lane: [] for lane in lane_order}
    for t in all_slim_tasks:
        st = str(t.get("status") or "unknown")
        lanes.setdefault(st, []).append(t)
    for lane, lane_tasks in lanes.items():
        if lane == "done":
            # Owner requirement: completed work must appear newest-first at the top of Done.
            lane_tasks.sort(key=lambda x: (x.get("completed_at") or 0, x.get("created_at") or 0), reverse=True)
        elif lane == "running":
            lane_tasks.sort(key=lambda x: (x.get("started_at") or 0, x.get("created_at") or 0), reverse=True)
        else:
            lane_tasks.sort(key=lambda x: (x.get("priority") or 0, x.get("created_at") or 0), reverse=True)
    return {
        "source_of_truth": "Hermes Kanban SQLite via `hermes kanban list --json` read-only projection",
        "list_available": list_result["ok"],
        "stats_available": stats_result["ok"],
        "stats_text": stats_result["stdout"][:5000],
        "counts": counts,
        "assignees": assignees,
        "task_total": len(tasks) if isinstance(tasks, list) else 0,
        "mirror_total": len(mirrors),
        "sys_total": len(sys_cards),
        "approvals_total": len(approvals),
        "executable_mirror_count": len(executable_mirror_cards),
        "executable_mirror_cards": executable_mirror_cards[:50],
        "duplicate_keys": duplicate_keys,
        "last_cards": last_cards,
        "lanes": lanes,
        "lane_order": lane_order,
        "mirrors": mirrors[:100],
        "sys_cards": sys_cards[:50],
        "approval_cards": approvals[:50],
        "read_errors": {"list": list_result["stderr"][:1000] if not list_result["ok"] else "", "stats": stats_result["stderr"][:1000] if not stats_result["ok"] else ""},
    }


def build_health() -> dict[str, Any]:
    text = read_text(HOST_SNAPSHOT_PATH, 120_000)
    gateway_active = bool(re.search(r"Active:\s+active \(running\)", text))
    fallback_match = re.search(r"Primary:\s+(.+)", text)
    bad_config = re.findall(r"BAD CONFIG CHECKS\n(.+?)(?:\n\n=====|\Z)", text, flags=re.S)
    qmd = run_cmd(["qmd", "status"], timeout=30)
    qmd_text = qmd["stdout"] if qmd["ok"] else qmd["stderr"]
    qmd_pending = None
    qmd_total = None
    qmd_vectors = None
    m = re.search(r"Pending:\s+([0-9]+)", qmd_text)
    if m:
        qmd_pending = int(m.group(1))
    mt = re.search(r"Total:\s+([0-9]+)", qmd_text)
    if mt:
        qmd_total = int(mt.group(1))
    mv = re.search(r"Vectors:\s+([0-9]+)", qmd_text)
    if mv:
        qmd_vectors = int(mv.group(1))
    qmd_help = run_cmd(["qmd", "--help"], timeout=30)
    qmd_help_text = qmd_help["stdout"] if qmd_help["ok"] else qmd_help["stderr"]
    bounded_available = "--limit" in qmd_help_text and "--collection" in qmd_help_text and "--max-memory-mb" in qmd_help_text
    bounded_report = OUTPUT / "qmd-bounded-embeddings-maintenance-result-v21-1.md"
    bounded_raw = OUTPUT / "qmd-bounded-embeddings-maintenance-result-v21-1.raw.log"
    auto_embed_report = OUTPUT / "qmd-auto-embed-v21-1-last-run.md"
    return {
        "source_of_truth": str(HOST_SNAPSHOT_PATH),
        "host_snapshot": stat_info(HOST_SNAPSHOT_PATH),
        "gateway_active": gateway_active,
        "primary_model_line": fallback_match.group(1).strip() if fallback_match else None,
        "bad_config_summary": bad_config[0].strip()[:2000] if bad_config else "",
        "qmd": {
            "available": qmd["ok"],
            "total_documents": qmd_total,
            "vectors": qmd_vectors,
            "pending_embeddings": qmd_pending,
            "status_excerpt": qmd_text[:3000],
            "bounded_mode": "available" if bounded_available else "missing",
            "bounded_mode_available": bounded_available,
            "last_bounded_batch": {
                "status": "PASS" if bounded_report.exists() and bounded_raw.exists() else "unknown",
                "evidence": str(bounded_raw),
                "report": str(bounded_report),
                "auto_embed_report": str(auto_embed_report),
            },
            "last_error": None if bounded_available else "bounded CLI flags missing",
            "next_safe_action": "continue tiny bounded batches only; do not run unlimited qmd embed" if bounded_available else "implement bounded CLI before embedding",
            "owner_action_required": False,
            "owner_facing_text": "QMD поиск работает. Векторные embeddings требуют безопасного bounded режима; unlimited embed не запускается.",
            "reports": {
                "investigation": str(OUTPUT / "qmd-true-bounded-embed-investigation-v21-1.md"),
                "maintenance": str(bounded_report),
                "implementation": str(OUTPUT / "qmd-bounded-embed-implementation-plan-v21-1.md"),
            },
        },
        "status": "warning" if (not gateway_active or bad_config or (qmd_pending or 0) > 0) else "ok",
    }



def _task_age_seconds(t: dict[str, Any], now: int | None = None) -> int | None:
    now = now or int(time.time())
    ts = t.get("updated_at") or t.get("started_at") or t.get("created_at")
    try:
        return max(0, now - int(ts)) if ts else None
    except Exception:
        return None


def build_worker_health(kanban: dict[str, Any]) -> dict[str, Any]:
    """Detect stale active cards and repeated crash protocol violations from read-only Kanban projection."""
    now = int(time.time())
    running = list((kanban.get("lanes") or {}).get("running") or [])
    stale_running_2h = []
    for t in running:
        age = _task_age_seconds(t, now)
        if age is not None and age > 7200:
            stale_running_2h.append({**t, "age_seconds": age, "stale_2h": True})
    active = []
    stale_30m = []
    stale_2h = []
    for lane in ["ready", "running", "todo", "scheduled"]:
        for t in (kanban.get("lanes") or {}).get(lane, []) or []:
            age = _task_age_seconds(t, now)
            item = {**t, "age_seconds": age, "stale_30m": bool(age is not None and age > 1800), "stale_2h": bool(age is not None and age > 7200)}
            active.append(item)
            if item["stale_30m"]:
                stale_30m.append(item)
            if item["stale_2h"]:
                stale_2h.append(item)
    crash_terms = ["protocol violation", "without calling kanban_complete", "without kanban_complete", "repeated_crashes", "pid not alive", "stale_lock"]
    crash_cards = []
    agent_workflow_crash_cards = []
    for lane_name, lane_items in (kanban.get("lanes") or {}).items():
        for t in lane_items or []:
            text = f"{t.get('title','')} {t.get('body','')} {t.get('metadata','')}".lower()
            if "webstudio" in text and any(term in text for term in crash_terms):
                crash_cards.append(t)
            if "webstudio" in text and "agent-workflow-v1" in text and "canary" not in text and lane_name not in {"done", "archived"} and any(term in text for term in crash_terms):
                agent_workflow_crash_cards.append(t)
    return {
        "source_of_truth": "read-only Hermes Kanban projection; deep run-history checked in hardening reports",
        "lifecycle_contract": "Every dispatched worker must end with exactly one terminal action: kanban_complete or kanban_block. rc=0 without terminator is a crash.",
        "running_count": len(running),
        "stale_30m_count": len(stale_30m),
        "stale_2h_count": len(stale_2h),
        "stale_running_dead_pid_2h_count": len(stale_running_2h),
        "repeated_crash_indicator_count": len(crash_cards),
        "agent_workflow_v1_repeated_crash_count": len(agent_workflow_crash_cards),
        "ops_canary_v3": {
            "task_id": "t_111a83b3",
            "status": "blocked_after_fresh_fail_reproduction",
            "verdict": "FAIL: fresh ops canary v3.3 reproduced rc=0/no kanban_complete_or_kanban_block and created no artifact; operator blocked the card to stop retry spam",
            "evidence": "/workspace/output/ops-worker-lane-repair-v3.md",
            "next_required_action": "host-level ops profile/tool-contract repair; default lane remains PASS, ops lane remains FAIL",
        },
        "remaining_blockers": [
            "ops lane repair: profile ops exits cleanly without terminal Kanban action",
            "QMD durability follow-up: keep bounded patch in maintained package/overlay so reinstall cannot remove CLI flags",
            "optional Supabase authenticated check remains approval/credential scoped",
        ],
        "running_cards": running[:40],
        "stale_30m_cards": stale_30m[:80],
        "stale_2h_cards": stale_2h[:80],
        "stale_running_dead_pid_2h_cards": stale_running_2h[:40],
        "active_sample": sorted(active, key=lambda x: x.get("age_seconds") or 0, reverse=True)[:80],
        "canary_artifact": "/workspace/output/ops-lane-canary-v3-artifact.md",
        "hardening_report": "/workspace/output/github-and-ops-worker-v3-status.md",
    }


def build_kanban_semantics_status() -> dict[str, Any]:
    return {
        "verdict": "logical_review_triage_stable_native_transition_gap",
        "native_core": ["triage", "todo", "ready", "running", "blocked", "done", "archived"],
        "ui_lanes": ["triage", "todo", "scheduled", "ready", "running", "blocked", "review", "done"],
        "production_logical_lanes": ["triage", "todo", "scheduled", "ready", "in_progress", "blocked", "review", "done", "archived"],
        "review": "owner-facing logical production_stage=qa|delivery-handoff; PATCH status=review rejected by native API in current runtime",
        "triage": "native creation/specifier flow exists via --triage, but long-lived production triage is stabilized as logical production_stage=intake",
        "report": "/workspace/output/kanban-native-review-triage-investigation-v2.md",
    }


def build_system_hardening_status() -> dict[str, Any]:
    snap_dir = WORKSPACE / "runtime" / "snapshot-requests"
    pending = []
    processed = []
    if snap_dir.exists():
        pending = [p for p in snap_dir.glob("*.flag")]
        processed_dir = snap_dir / "processed"
        if processed_dir.exists():
            processed = list(processed_dir.glob("*.flag"))
    last_auto = WORKSPACE / "runtime" / "last-auto-snapshot.txt"
    watchdog = WORKSPACE / "runtime" / "autonomy-watchdog-status.txt"
    last_run = WORKSPACE / "runtime" / "last-autonomy-run.txt"
    return {
        "snapshot_pending_count": len(pending),
        "snapshot_processed_count": len(processed),
        "last_auto_snapshot": stat_info(last_auto),
        "watchdog_status": stat_info(watchdog),
        "last_autonomy_run": stat_info(last_run),
        "qmd_auto_embed_script": stat_info(WORKSPACE / ".hermes" / "scripts" / "qmd-auto-embed.sh"),
        "auto_snapshot_processor_script": stat_info(WORKSPACE / ".hermes" / "scripts" / "hermes-auto-snapshot-processor.sh"),
        "snapshot_repair_verdict": "PASS" if len(pending) == 0 and last_auto.exists() else "WATCH",
        "qmd_embed_verdict": "DEGRADED: qmd update/search work, qmd embed crashes/times out under Bun on this VPS",
        "root_cause_summary": "snapshot request backlog was stale; v3 bounded processor processed pending flags and cron job hermes-auto-snapshot-processor-v3 is scheduled. qmd index updates but embeddings remain pending because `qmd embed` crashes/times out under Bun; bounded auto-embed script records degraded status instead of runaway execution.",
        "owner_actions": [
            "None for safe local/PR-branch workflow: Auto-Push, qmd update, hfinalize, build/smoke, reports and dry-runs are owner-approved autonomy.",
            "Owner action is required only for live secrets, live Telegram token, CRM/Sheets writes, Supabase write migrations, deploy/release, payments/live external actions, or private client-data approval.",
            "Do not run unlimited qmd embed; use bounded maintenance plan and stop on OOM/exit 137.",
        ],
    }

def build_artifacts() -> list[dict[str, Any]]:
    artifacts = []
    for p in sorted(OUTPUT.glob("*.md"), key=lambda x: x.stat().st_mtime, reverse=True)[:120]:
        info = stat_info(p)
        title = p.name
        try:
            first = p.read_text(errors="replace").splitlines()[0:3]
            for line in first:
                if line.strip().startswith("#"):
                    title = line.strip("# ")[:160]
                    break
        except Exception:
            pass
        artifacts.append({"title": title, "path": str(p), **info})
    return artifacts



def infer_assigned_agent(title: str, body: str, assignee: str | None = None) -> str:
    text = f"{title} {body} {assignee or ''}".lower()
    explicit = re.search(r"assigned_agent[:=]\s*([A-Za-z0-9/ -]+?)(?:\n|$)", body, re.I)
    if explicit:
        return explicit.group(1).strip()
    if "cto" in text or "prd" in text or "acceptance criteria" in text:
        return "CTO Agent"
    if "orchestrator" in text or "dispatch" in text or "route" in text:
        return "Orchestrator Agent"
    if "frontend" in text or "ui" in text or "component" in text:
        return "Frontend Agent"
    if "backend" in text or "api" in text or "schema" in text or "webhook" in text:
        return "Backend Agent"
    if "qa" in text or "smoke" in text or "test" in text:
        return "QA Agent"
    if "ops" in text or "snapshot" in text or "qmd" in text or "dashboard" in text:
        return "Ops Agent"
    if "research" in text or "docs" in text:
        return "Research Agent"
    if "sales" in text or "client" in text or "qualification" in text:
        return "Sales/Client Agent"
    if "delivery" in text or "handoff" in text:
        return "Delivery Agent"
    return "Orchestrator Agent" if assignee == "orchestrator" else "Specialist Agent"


def infer_field(body: str, field: str, default: str = "") -> str:
    m = re.search(rf"{re.escape(field)}[:=]\s*(.+?)(?:\n|$)", body, re.I)
    return m.group(1).strip() if m else default


def lifecycle_status_for_card(physical_status: str, logical_lane: str, age: int | None) -> str:
    if physical_status == "done":
        return "completed"
    if logical_lane == "blocked":
        return "blocked_true_only"
    if physical_status == "running" and age is not None and age > 7200:
        return "stale_running_watch"
    if physical_status == "running":
        return "active_worker"
    if logical_lane in {"review", "ready", "todo", "scheduled", "triage"}:
        return "live_backlog"
    return "tracked"

def infer_production_stage(title: str, body: str) -> str:
    text = f"{title} {body}".lower()
    explicit = re.search(r"production_stage[:=]\s*([a-z0-9-]+)", text) or re.search(r"stage[:=]\s*([a-z0-9-]+)", text)
    if explicit:
        return explicit.group(1)
    checks = [
        ("intake", ["[triage]", "intake", "incoming", "raw requirements", "inbound"]),
        ("client-qualification", ["qualification", "qualify client", "client fit"]),
        ("brief", ["brief", "missing-question"]),
        ("estimate-pricing", ["estimate", "pricing", "owner pricing window"]),
        ("architecture-plan", ["architecture", "plan", "execution packet"]),
        ("design-content", ["design", "content", "copy"]),
        ("implementation", ["implementation", "impl-", "service skeleton", "backend", "frontend"]),
        ("qa", ["[qa]", "qa", "proof bundle", "checklist"]),
        ("approval", ["[blocked]", "approval", "owner decision", "token/access"]),
        ("delivery-handoff", ["delivery", "handoff", "review queue"]),
        ("post-delivery-support", ["post-delivery", "support follow-up"]),
    ]
    for stage, needles in checks:
        if any(n in text for n in needles):
            return stage
    return "unspecified"


def logical_lane_for_stage(stage: str) -> str:
    return {
        "intake": "triage",
        "client-qualification": "todo",
        "brief": "todo",
        "estimate-pricing": "scheduled",
        "architecture-plan": "ready",
        "design-content": "ready",
        "implementation": "in_progress",
        "qa": "review",
        "approval": "blocked",
        "delivery-handoff": "review",
        "post-delivery-support": "scheduled",
    }.get(stage, "todo")


def build_production_pipeline(kanban: dict[str, Any]) -> dict[str, Any]:
    """Derived WebStudio production board/view over the live Hermes Kanban board.

    Hermes has one physical board and workers can quickly promote/claim cards.
    This production view therefore separates physical_status from production_stage
    and logical_lane, so the owner sees a stable operating pipeline without
    disabling the dispatcher.
    """
    stage_order = ["intake", "client-qualification", "brief", "estimate-pricing", "architecture-plan", "design-content", "implementation", "qa", "approval", "delivery-handoff", "post-delivery-support"]
    logical_lane_order = ["triage", "todo", "scheduled", "ready", "in_progress", "blocked", "review", "done", "archived"]
    product_lines = {"D1": [], "D2": [], "D3": []}
    by_stage: dict[str, list[dict[str, Any]]] = {s: [] for s in stage_order}
    by_logical_lane: dict[str, list[dict[str, Any]]] = {s: [] for s in logical_lane_order}
    by_status: dict[str, int] = {}
    by_logical_counts: dict[str, int] = {}
    all_cards = []
    for lane_items in (kanban.get("lanes") or {}).values():
        for t in lane_items or []:
            title = str(t.get("title") or "")
            body = str(t.get("body") or "")
            meta = str(t.get("metadata") or "")
            idkey = str(t.get("idempotency_key") or "")
            text = f"{title} {body} {meta} {idkey}".lower()
            is_webstudio = "[webstudio]" in title.lower() or "webstudio:" in text
            # Keep old canary/test/noise out of the production workstream, but make it
            # visible in the Archived lane so the owner can verify it is not polluting
            # active production lanes.
            is_archive_noise = any(marker in text for marker in ["canary", "temp canary", "mirror only", "[wf mirror]", "[sys]", "noise", "safe test"])
            if not is_webstudio and not is_archive_noise:
                continue
            m_line = re.search(r"\[(D[123])\]", title) or re.search(r"product_line[:=]\s*([D][123])", body + " " + meta, re.I) or re.search(r"webstudio:(D[123]):", (body + " " + meta + " " + idkey), re.I)
            line = m_line.group(1).upper() if m_line else "UNKNOWN"
            physical_status = str(t.get("status") or "unknown")
            if is_archive_noise and not is_webstudio:
                stage = "archived-noise"
                logical_lane = "archived"
                owner_visible = False
            else:
                stage = infer_production_stage(title, body + " " + meta + " " + idkey)
                logical_lane = "done" if physical_status == "done" else ("in_progress" if physical_status == "running" else logical_lane_for_stage(stage))
                owner_visible = True
            age = _task_age_seconds(t)
            assigned_agent = infer_assigned_agent(title, body + " " + meta, str(t.get("assignee") or ""))
            task_type = infer_field(body + "\n" + meta, "task_type", stage)
            next_action = infer_field(body + "\n" + meta, "next_action", "review next safe step")
            artifact_path = infer_field(body + "\n" + meta, "artifact_path", "")
            lifecycle_status = infer_field(body + "\n" + meta, "lifecycle_status", lifecycle_status_for_card(physical_status, logical_lane, age))
            card = {**t, "product_line": line, "assigned_agent": assigned_agent, "production_stage": stage, "stage": stage, "physical_status": physical_status, "task_type": task_type, "next_action": next_action, "artifact_path": artifact_path, "last_activity_at": t.get("updated_at") or t.get("started_at") or t.get("created_at"), "stale_age": age, "lifecycle_status": lifecycle_status, "logical_lane": logical_lane, "owner_visible": owner_visible, "source_of_truth": "Hermes Kanban + WebStudio Production logical view"}
            all_cards.append(card)
            if line in product_lines:
                product_lines[line].append(card)
            by_stage.setdefault(stage, []).append(card)
            by_logical_lane.setdefault(logical_lane, []).append(card)
            by_status[physical_status] = by_status.get(physical_status, 0) + 1
            by_logical_counts[logical_lane] = by_logical_counts.get(logical_lane, 0) + 1
    active = [c for c in all_cards if c.get("physical_status") in {"running", "ready", "todo"} or c.get("logical_lane") == "in_progress"]
    review_queue = [c for c in all_cards if c.get("logical_lane") == "review"]
    delivery_queue = [c for c in all_cards if c.get("production_stage") in {"delivery-handoff", "post-delivery-support"}]
    sort_key = lambda x: (x.get("updated_at") or x.get("completed_at") or x.get("started_at") or x.get("created_at") or 0)
    return {
        "source_of_truth": "Hermes Kanban physical board + stable WebStudio Production logical projection",
        "board_name": "WebStudio Production",
        "purpose": "Real operating board for D1 websites, D2 AI-intake bots, D3 business automations",
        "view_contract": {"tenant": "webstudio-production", "tags": ["[WEBSTUDIO]", "[D1]", "[D2]", "[D3]"], "physical_status": "real Hermes worker state", "production_stage": "owner-facing lifecycle stage", "logical_lane": "stable production column"},
        "stage_order": stage_order,
        "logical_lane_order": logical_lane_order,
        "counts": {"total": len(all_cards), "active": len(active), "review": len(review_queue), "delivery": len(delivery_queue), **by_status},
        "logical_counts": {lane: len(by_logical_lane.get(lane, [])) for lane in logical_lane_order},
        "product_lines": {k: sorted(v, key=sort_key, reverse=True)[:80] for k, v in product_lines.items()},
        "by_stage": {k: sorted(v, key=sort_key, reverse=True)[:80] for k, v in by_stage.items()},
        "logical_lanes": {k: sorted(v, key=sort_key, reverse=True)[:80] for k, v in by_logical_lane.items()},
        "active_work": sorted(active, key=sort_key, reverse=True)[:40],
        "review_queue": sorted(review_queue, key=sort_key, reverse=True)[:40],
        "delivery_queue": sorted(delivery_queue, key=sort_key, reverse=True)[:40],
        "filter_recipe": "Open /kanban and search WEBSTUDIO. Ops Cockpit /#production shows stable logical stages even when Hermes dispatcher promotes physical statuses.",
    }


def build_d1_owner_feedback() -> dict[str, Any]:
    if build_d1_owner_feedback_state is None:
        return {
            "available": False,
            "source_of_truth": "/workspace/data/webstudio/d1/owner-feedback-inbox.jsonl",
            "error": "d1_owner_feedback_backend import unavailable",
        }
    state = build_d1_owner_feedback_state()
    state["available"] = True
    return state


def build_d3_intake() -> dict[str, Any]:
    if build_d3_inbox_state is None:
        return {
            "available": False,
            "source_of_truth": "/workspace/data/webstudio/d3/raw-requirements-inbox.jsonl",
            "error": "d3_intake_backend import unavailable",
        }
    state = build_d3_inbox_state()
    state["available"] = True
    return state


def build_d3_client_qualification() -> dict[str, Any]:
    if build_d3_qualification_state is None:
        return {
            "available": False,
            "source_of_truth": "/workspace/data/webstudio/d3/client-qualification-results.jsonl",
            "error": "d3_client_qualification import unavailable",
        }
    state = build_d3_qualification_state()
    state["available"] = True
    return state


def build_clients_orders() -> dict[str, Any]:
    # MVP is file-backed/read-only. Supabase writes are intentionally not performed here.
    client_docs = []
    for base in [WORKSPACE / "clients", WORKSPACE / "deliverables"]:
        if base.exists():
            for p in sorted(base.rglob("*.md"), key=lambda x: x.stat().st_mtime, reverse=True)[:80]:
                client_docs.append({"path": str(p), "name": p.name, **stat_info(p)})
    product_backlog = [
        {"id": "PL-D1", "product_line": "D1", "title": "Landing / website delivery lane", "status": "ready_for_pipeline_design", "autonomy": ["A", "B", "C", "D"]},
        {"id": "PL-D2", "product_line": "D2", "title": "AI-intake Telegram bot lane", "status": "ready_for_pipeline_design", "autonomy": ["A", "B", "C", "D"]},
        {"id": "PL-D3", "product_line": "D3", "title": "Business automation lane", "status": "ready_for_pipeline_design", "autonomy": ["A", "B", "C", "D"]},
    ]
    return {"source_of_truth": "MVP file-backed client/order projection; Supabase writes disabled", "client_docs": client_docs, "product_backlog": product_backlog}


def build_approvals(wf: dict[str, Any], kanban: dict[str, Any]) -> list[dict[str, Any]]:
    approvals = []
    for item in wf.get("approval_required", []):
        approvals.append({"id": f"wf:{item.get('id')}", "title": item.get("title"), "status": "approval_required", "source": "work_factory", "source_item": item, "channels": ["telegram", "kanban", "ops_site"]})
    for c in kanban.get("approval_cards", [])[:50]:
        approvals.append({"id": f"kanban:{c.get('id')}", "title": c.get("title"), "status": c.get("status"), "source": "kanban", "source_item": c, "channels": ["telegram", "kanban", "ops_site"]})
    return approvals


def build_github_readiness() -> dict[str, Any]:
    completion_result_path = OUTPUT / "github-pr-completion-v3-3-result.json"
    completion_result = load_json(completion_result_path, {})
    pr1_status = load_json(GITHUB_PR1_STATUS_PATH, {})
    autopush_candidates = [
        OUTPUT / "webstudio-v28-github-mainline-result.json",
        OUTPUT / "webstudio-client-intake-order-builder-v27-github-pr-status.json",
        OUTPUT / "webstudio-system-maintenance-autopush-result.json",
        OUTPUT / "webstudio-continuation-autopush-result.json",
        OUTPUT / "webstudio-github-autopush-v1-result.json",
    ]
    autopush_result_path = next((x for x in autopush_candidates if x.exists()), autopush_candidates[-1])
    autopush_result = load_json(autopush_result_path, {})
    host_runner_latest_path = OUTPUT / "host-job-runner" / "latest.json"
    host_runner_latest = load_json(host_runner_latest_path, {})
    checks = {
        "command_v_gh": run_cmd(["bash", "-lc", "command -v gh || true"], timeout=10),
        "workspace_bin_gh": run_cmd(["bash", "-lc", "ls -l /workspace/bin/gh 2>&1 || true"], timeout=10),
        "usr_bin_gh": run_cmd(["bash", "-lc", "ls -l /usr/bin/gh 2>&1 || true"], timeout=10),
        "gh_auth_status": run_cmd(["bash", "-lc", "set -o pipefail; gh auth status 2>&1 | sed -E 's/(Token:).*/\\1 REDACTED/I; s/(Token scopes:).*/\\1 REDACTED/I; s#(/[A-Za-z0-9._/-]*hosts.yml)#REDACTED_HOSTS_YML#g; s/(gho_|ghp_|github_pat_)[A-Za-z0-9_]+/REDACTED_TOKEN/g'"], timeout=20),
        "repo_list_pltnv123": run_cmd(["bash", "-lc", "set -o pipefail; gh repo list pltnv123 --limit 20 2>&1 | sed -E 's/(gho_|ghp_|github_pat_)[A-Za-z0-9_]+/REDACTED_TOKEN/g'"], timeout=30),
    }
    workspace_wrapper_points_missing = "/workspace/bin/gh" in checks["workspace_bin_gh"].get("stdout", "") and "No such file" in checks["usr_bin_gh"].get("stdout", "")
    gh_not_found_or_missing = "command not found" in (checks["gh_auth_status"].get("stdout", "") + checks["gh_auth_status"].get("stderr", "")).lower() or "No such file" in (checks["gh_auth_status"].get("stdout", "") + checks["gh_auth_status"].get("stderr", ""))
    wrapper_broken = workspace_wrapper_points_missing or gh_not_found_or_missing
    status = "blocked_wrapper_missing_binary" if wrapper_broken else ("available" if checks["gh_auth_status"].get("ok") else "unknown_or_unavailable")
    if isinstance(completion_result, dict) and completion_result.get("status") == "PR_CREATED":
        status = "PR_CREATED"
    if isinstance(pr1_status, dict) and pr1_status.get("status") == "UPDATED":
        status = "UPDATED"
    if isinstance(autopush_result, dict) and autopush_result.get("status"):
        if autopush_result.get("status") in {"PASS", "pushed", "already_up_to_date", "no_changes"}:
            status = "AUTO_PUSH_PASS" if autopush_result.get("status") == "PASS" else "AUTO_PUSH_READY"
        elif autopush_result.get("status") == "blocked":
            status = "AUTO_PUSH_BLOCKED"
    return {
        "account_expected": "pltnv123",
        "repo": "pltnv123/webstudio-ops-dashboard",
        "repo_url": "https://github.com/pltnv123/webstudio-ops-dashboard",
        "branch": "webstudio/hardening-v3-host-completion",
        "status": status,
        "pr_status": pr1_status if isinstance(pr1_status, dict) else {},
        "pr_status_source": stat_info(GITHUB_PR1_STATUS_PATH),
        "latest_commit_sha": pr1_status.get("latest_commit_sha") if isinstance(pr1_status, dict) else None,
        "pushed_at": pr1_status.get("pushed_at") if isinstance(pr1_status, dict) else None,
        "pr_url": pr1_status.get("pr_url") if isinstance(pr1_status, dict) else "https://github.com/pltnv123/webstudio-ops-dashboard/pull/1",
        "wrapper_broken": wrapper_broken,
        "completion_result": completion_result if isinstance(completion_result, dict) else {},
        "completion_result_source": stat_info(completion_result_path),
        "autopush": autopush_result if isinstance(autopush_result, dict) else {},
        "autopush_source": stat_info(autopush_result_path),
        "autopush_script": "/workspace/output/webstudio-github-autopush-v1.sh",
        "next_push_candidate": (autopush_result.get("next_push_candidate") if isinstance(autopush_result, dict) else None) or (pr1_status.get("next_push_candidate") if isinstance(pr1_status, dict) else None),
        "last_autopush_error": (autopush_result.get("reason") if isinstance(autopush_result, dict) and autopush_result.get("status") == "blocked" else None),
        "checks": {k: {"ok": v.get("ok"), "returncode": v.get("returncode"), "stdout": v.get("stdout", "")[:2000], "stderr": v.get("stderr", "")[:1000]} for k, v in checks.items()},
        "repair_packet": "/workspace/output/github-clone-copy-pr-v3-3.sh" if wrapper_broken else None,
        "host_runner": host_runner_latest if isinstance(host_runner_latest, dict) else {},
        "host_runner_latest_source": stat_info(host_runner_latest_path),
        "hardening_report": "/workspace/output/github-and-ops-worker-v3-status.md",
    }


def build_host_autonomy(health: dict[str, Any], github: dict[str, Any]) -> dict[str, Any]:
    ap = github.get("autopush") if isinstance(github.get("autopush"), dict) else {}
    pr = github.get("pr_status") if isinstance(github.get("pr_status"), dict) else {}
    qmd = health.get("qmd") if isinstance(health.get("qmd"), dict) else {}
    latest_finalizer = latest_file_info("finalizer/hfinalize-*.md")
    latest_commit = pr.get("latest_commit_sha") or pr.get("headRefOid") or ap.get("latest_remote_commit") or github.get("latest_commit_sha")
    checks_status = pr.get("checks_status") or ap.get("checks_status") or "unknown"
    continuation_latest = load_json(OUTPUT / "webstudio-continuation-supervisor" / "latest.json", {})
    pending_jobs = sorted((WORKSPACE / ".hermes-workqueue" / "webstudio" / "pending").glob("*.json"))
    first_pending_job = load_json(pending_jobs[0], {}) if pending_jobs else {}
    queue_root = WORKSPACE / ".hermes-workqueue" / "webstudio"
    queue_counts = {name: len(list((queue_root / name).glob("*.json*"))) if (queue_root / name).exists() else 0 for name in ["pending", "running", "done", "failed"]}
    continuation_engine = {
        "schema_version": "webstudio.continuation-engine.v1",
        "updated_at": utc_now(),
        "status": "PASS" if continuation_latest.get("status") in {"PASS", "NOOP"} and pending_jobs else "WATCH",
        "iteration_budget_protocol_created": (OUTPUT / "webstudio-budget-exhaustion-protocol-v1.md").exists(),
        "queue_root": str(queue_root),
        "queue_counts": queue_counts,
        "supervisor_path": str(WORKSPACE / ".hermes" / "scripts" / "webstudio-continuation-supervisor.sh"),
        "work_factory_integration": "webstudio-continuation-supervisor.sh" in read_text(WORKSPACE / ".hermes" / "scripts" / "work-factory-supervisor-tick.sh", 4000),
        "chat_cron_used": False,
        "first_next_pass_job_id": first_pending_job.get("id"),
        "pending_jobs": len(pending_jobs),
        "checkpoint_path": str(CONTINUATION_CHECKPOINT_PATH),
        "latest_result": str(OUTPUT / "webstudio-continuation-supervisor" / "latest.json"),
        "latest_status": continuation_latest.get("status"),
        "owner_needs_to_type_continue": False,
    }
    qmd_status = "PASS_BOUNDED" if qmd.get("bounded_mode_available") else ("OK" if qmd.get("available") and not (qmd.get("pending_embeddings") or 0) else "DEGRADED_SAFE")
    snapshot_processor = {
        "status": "PASS" if (RUNTIME / "last-auto-snapshot.txt").exists() else "WATCH",
        "last_auto_snapshot": read_text(RUNTIME / "last-auto-snapshot.txt", 500),
        "processed_requests_visible": (RUNTIME / "snapshot-requests" / "processed").exists(),
    }
    return {
        "schema_version": "webstudio.host-autonomy.v1",
        "updated_at": utc_now(),
        "status": "ON" if health.get("gateway_active") and not github.get("wrapper_broken") else "WATCH",
        "approvals_mode": "OFF / owner-approved autonomy",
        "owner_approved_autonomy": True,
        "auto_push_available": True,
        "auto_push": ap,
        "latest_pr_commit": latest_commit,
        "checks_status": checks_status,
        "owner_action_required": False,
        "continuation_engine": continuation_engine,
        "snapshot_processor": snapshot_processor,
        "qmd": {**qmd, "status": qmd_status},
        "hfinalize": {"status": "available", "latest_report": latest_finalizer},
        "owner_action_required_only_for": [
            "live production secrets",
            "live Telegram token",
            "live CRM/Sheets writes",
            "Supabase migrations with writes",
            "deploy/release",
            "payment/live external actions",
            "private client data approval",
        ],
        "owner_not_required_for": ["git commit", "git push to PR branch", "qmd update", "hfinalize", "build/smoke", "browser QA", "docs/reports/artifacts", "safe local dry-run"],
        "reports": {"verification": "/workspace/output/webstudio-host-autonomy-verification-v1.md", "qmd_plan": "/workspace/output/qmd-bounded-embeddings-maintenance-plan-v1.md"},
    }


def build_product_progress() -> dict[str, Any]:
    data = load_json(PRODUCT_PROGRESS_PATH, {})
    if not isinstance(data, dict):
        data = {}
    items = data.get("items") if isinstance(data.get("items"), list) else []
    return {
        "source_of_truth": str(PRODUCT_PROGRESS_PATH),
        "source": stat_info(PRODUCT_PROGRESS_PATH),
        "updated_at": data.get("updated_at"),
        "mode": data.get("mode", "safe_local_artifacts_only"),
        "phase": data.get("phase"),
        "status": data.get("status"),
        "v10_status": data.get("v10_status"),
        "v11_status": data.get("v11_status"),
        "pr_verification_verdict": data.get("pr_verification_verdict"),
        "pr_url": data.get("pr_url"),
        "items": items,
        "client_simulation": data.get("client_simulation", {}),
        "system_layer": data.get("system_layer", {}),
        "analytics": data.get("analytics", {}),
        "github_sync": data.get("github_sync", {}),
        "qmd_maintenance": data.get("qmd_maintenance", {}),
        "repo_sync": data.get("repo_sync", {}),
        "v18_status": data.get("v18_status"),
        "v19_status": data.get("v19_status"),
        "v20_status": data.get("v20_status"),
        "v21_status": data.get("v21_status"),
        "premium_motion_factory_v25": data.get("premium_motion_factory_v25"),
        "premium_motion_factory_v26": data.get("premium_motion_factory_v26"),
        "production_generator": data.get("production_generator"),
        "batch_render_workflow": data.get("batch_render_workflow"),
        "poster_auto_pick": data.get("poster_auto_pick"),
        "reduced_motion_fallback": data.get("reduced_motion_fallback"),
        "client_handoff_pack": data.get("client_handoff_pack"),
        "video_metadata_path": data.get("video_metadata_path"),
        "latest_pr_commit": data.get("latest_pr_commit"),
        "report": data.get("report"),
        "by_line": {line: [x for x in items if x.get("product_line") == line] for line in ["D1", "D2", "D3"]},
        "latest_summary": [f"{x.get('product_line')}: {x.get('artifact_type')} → {x.get('path')}" for x in items[:10]],
    }


def build_motion_factory(product_progress: dict[str, Any]) -> dict[str, Any]:
    """Owner-facing HyperFrames / Premium Motion Factory production status."""
    metadata = load_json(OUTPUT / "webstudio-motion-v26-video-metadata.json", {})
    videos = metadata.get("videos") if isinstance(metadata.get("videos"), list) else []
    v28_reports = [
        "/workspace/output/webstudio-hyperframes-reusable-templates-v28.md",
        "/workspace/output/webstudio-client-example-003-motion-plan.md",
        "/workspace/output/webstudio-client-example-003-motion-composition.html",
    ]
    has_v28 = any(Path(p).exists() for p in v28_reports)
    return {
        "status": "V28_TEMPLATES_READY" if has_v28 else (product_progress.get("premium_motion_factory_v26") or product_progress.get("premium_motion_factory_v25") or "unknown"),
        "runtime": {
            "hyperframes_runtime": "PASS" if (OUTPUT / "webstudio-hyperframes-smoke-v24.mp4").exists() else "unknown",
            "motion_engine": "OPERATIONAL" if (OUTPUT / "webstudio-premium-site-example-001-motion-preview-v2.mp4").exists() else "HTML_COMPOSITION_READY" if has_v28 else "unknown",
            "owner_action_required": "no",
        },
        "production_generator_status": "READY" if has_v28 else (product_progress.get("production_generator") or "unknown"),
        "template_pack_status": "V28_READY" if has_v28 else (product_progress.get("hyperframes_template_pack") or "PASS"),
        "batch_render_status": "HTML_COMPOSITION_READY" if has_v28 else (product_progress.get("batch_render_workflow") or "unknown"),
        "poster_status": "WORKFLOW_READY" if has_v28 else (product_progress.get("poster_auto_pick") or "unknown"),
        "reduced_motion_status": "SNIPPETS_READY" if has_v28 else (product_progress.get("reduced_motion_fallback") or "unknown"),
        "handoff_pack_status": "READY" if has_v28 else (product_progress.get("client_handoff_pack") or "unknown"),
        "repo_sync": product_progress.get("repo_sync", {}),
        "latest_videos": videos,
        "reports": [
            "/workspace/output/webstudio-premium-motion-factory-v26-report.md",
            "/workspace/output/webstudio-motion-data-driven-generator-v26.md",
            "/workspace/output/webstudio-motion-batch-render-workflow-v26.md",
            "/workspace/output/webstudio-motion-poster-auto-pick-v26.md",
            "/workspace/output/webstudio-reduced-motion-fallback-snippets-v26.md",
            "/workspace/output/webstudio-motion-client-handoff-pack-v26.md",
            *[p for p in v28_reports if Path(p).exists()],
        ],
        "next_action": "Render Example #003 MP4 when HyperFrames/ffmpeg runtime is available." if has_v28 else "Host Runner Auto-Push should push dashboard/docs changes and verify PR head SHA.",
    }



def build_client_intake_v27() -> dict[str, Any]:
    """Owner-facing WebStudio Client Intake / Order Builder v27 status."""
    wizard = load_json(OUTPUT / "webstudio-client-intake-wizard-v27.json", {})
    orders = load_json(OUTPUT / "webstudio-order-builder-v27.json", {})
    blueprint = load_json(OUTPUT / "webstudio-premium-site-production-blueprint-v27.json", {})
    packages = orders.get("packages") if isinstance(orders.get("packages"), list) else []
    steps = wizard.get("steps") if isinstance(wizard.get("steps"), list) else []
    pipeline = blueprint.get("pipeline") if isinstance(blueprint.get("pipeline"), list) else []
    example_files = [
        OUTPUT / "webstudio-client-example-002-brief.md",
        OUTPUT / "webstudio-client-example-002-strategy.md",
        OUTPUT / "webstudio-client-example-002-design-directions.md",
        OUTPUT / "webstudio-client-example-002-motion-plan.md",
        OUTPUT / "webstudio-client-example-002-production-plan.md",
        OUTPUT / "webstudio-client-example-002-concept-a.html",
        OUTPUT / "webstudio-client-example-002-concept-b.html",
        OUTPUT / "webstudio-client-example-002-concept-c.html",
    ]
    example_003_files = [
        OUTPUT / "webstudio-client-example-003-brief.md",
        OUTPUT / "webstudio-client-example-003-strategy.md",
        OUTPUT / "webstudio-client-example-003-design-directions.md",
        OUTPUT / "webstudio-client-example-003-concept-a.html",
        OUTPUT / "webstudio-client-example-003-concept-b.html",
        OUTPUT / "webstudio-client-example-003-concept-c.html",
        OUTPUT / "webstudio-client-example-003-motion-plan.md",
        OUTPUT / "webstudio-client-example-003-delivery-pack.md",
    ]
    return {
        "schema": "webstudio.client_intake_order_builder.v27",
        "status": "PASS" if steps and packages and pipeline and all(p.exists() for p in example_files[:5]) else "IN_PROGRESS",
        "owner_action_required": "no",
        "wizard": {
            "status": "READY" if steps else "missing",
            "questions": len(steps),
            "mode": wizard.get("mode") or "adaptive_one_step_at_a_time",
            "md": str(OUTPUT / "webstudio-client-intake-wizard-v27.md"),
            "json": str(OUTPUT / "webstudio-client-intake-wizard-v27.json"),
            "html": str(OUTPUT / "webstudio-client-intake-wizard-v27.html"),
        },
        "order_builder": {
            "status": "READY" if packages else "missing",
            "packages": len(packages),
            "md": str(OUTPUT / "webstudio-order-builder-v27.md"),
            "json": str(OUTPUT / "webstudio-order-builder-v27.json"),
            "html": str(OUTPUT / "webstudio-order-builder-v27.html"),
            "available_packages": [p.get("name") for p in packages[:15]],
            "package_details": packages[:15],
        },
        "premium_site_factory": {
            "status": "READY" if pipeline else "missing",
            "steps": len(pipeline),
            "blueprint_md": str(OUTPUT / "webstudio-premium-site-production-blueprint-v27.md"),
            "blueprint_json": str(OUTPUT / "webstudio-premium-site-production-blueprint-v27.json"),
        },
        "examples": [
            {"id": "001", "name": "Premium renovation", "status": "PASS", "artifacts": ["/workspace/output/webstudio-premium-site-example-001-motion-preview-v2.mp4", "/workspace/output/webstudio-premium-motion-factory-v26-report.md"]},
            {"id": "002", "name": "Premium dental clinic Moscow", "status": "READY", "artifacts": [str(p) for p in example_files if p.exists()]},
            {"id": "003", "name": "Премиальный барбершоп / мужской салон Москва", "status": "READY" if all(p.exists() for p in example_003_files) else "IN_PROGRESS", "artifacts": [str(p) for p in example_003_files if p.exists()]},
        ],
        "links": [
            str(OUTPUT / "webstudio-client-intake-order-builder-v27-report.md"),
            str(OUTPUT / "webstudio-client-intake-wizard-v27.html"),
            str(OUTPUT / "webstudio-order-builder-v27.html"),
            str(OUTPUT / "webstudio-client-example-002-concept-a.html"),
            str(OUTPUT / "webstudio-client-example-002-concept-b.html"),
            str(OUTPUT / "webstudio-client-example-002-concept-c.html"),
            str(OUTPUT / "webstudio-client-example-003-concept-a.html"),
            str(OUTPUT / "webstudio-client-example-003-concept-b.html"),
            str(OUTPUT / "webstudio-client-example-003-concept-c.html"),
        ],
        "next_action": "Use adaptive wizard to qualify first real client, then route to package and production blueprint. V28: continue Example #003 selected direction and host-verified mainline visibility.",
        "approvals": ["live Telegram", "CRM/payment/analytics integrations", "medical/legal claims", "deploy/preview"],
        "readiness": "READY_FOR_CLIENT_SIMULATION",
    }


def build_marathon_status() -> dict[str, Any]:
    index = OUTPUT / "webstudio-12h-marathon-index.md"
    state = load_json(OUTPUT / "work-factory-supervisor-state.json", {})
    artifacts = [stat_info(p) for p in sorted(OUTPUT.glob("*12h*"), key=lambda x: x.stat().st_mtime, reverse=True)[:30]]
    return {
        "name": "webstudio-12h-autonomous-improvement-marathon",
        "status": "verified_live_cron_heartbeat" if index.exists() and artifacts else "not_verified",
        "schedule": "cron job work-factory-supervisor-12h every 15m; bounded ticks select safe production Kanban/work-factory work and emit heartbeat artifacts",
        "index": stat_info(index),
        "last_artifacts": artifacts,
        "work_factory_enabled": state.get("enabled") if isinstance(state, dict) else None,
        "timer_enabled": state.get("timer_enabled") if isinstance(state, dict) else None,
        "next_planned_useful_tasks": [
            "Ops lane repair: enforce kanban_complete/kanban_block terminator contract and rerun ops canary",
            "QMD maintenance: bounded pending-embedding reduction without unlimited embed",
            "D1/D2/D3 product improvements from production Kanban logical lanes",
            "PR follow-up: keep GitHub readiness panel linked to https://github.com/pltnv123/webstudio-ops-dashboard/pull/1",
            "Rebuild Ops Cockpit snapshot, run smoke, qmd update, hfinalize",
        ],
    }



def _env_int(name: str) -> int | None:
    try:
        raw = os.environ.get(name)
        return int(raw) if raw not in {None, ""} else None
    except Exception:
        return None


def detect_near_limit() -> dict[str, Any]:
    """Read optional runtime/tool-limit hints and normalize them into a single guard signal.

    The controller is intentionally env-driven: schedulers, cron wrappers, or agent
    launchers can set any of these values without coupling the dashboard builder to a
    specific LLM/runtime implementation.
    """
    thresholds = {
        "HERMES_TOOL_CALLS_REMAINING": 3,
        "HERMES_ITERATIONS_REMAINING": 1,
        "HERMES_RUNTIME_SECONDS_REMAINING": 300,
        "HERMES_CONTEXT_REMAINING_TOKENS": 8192,
    }
    signals = {name: _env_int(name) for name in thresholds}
    explicit = str(os.environ.get("HERMES_NEAR_LIMIT") or "").lower() in {"1", "true", "yes", "y"}
    tripped = [name for name, limit in thresholds.items() if signals.get(name) is not None and signals[name] <= limit]
    return {
        "near_limit": explicit or bool(tripped),
        "explicit_env": explicit,
        "signals": signals,
        "thresholds": thresholds,
        "tripped": tripped,
    }


def find_continuation_card(kanban: dict[str, Any]) -> dict[str, Any] | None:
    expected = CONTINUATION_CARD_TITLE.lower()
    for lane_items in (kanban.get("lanes") or {}).values():
        for card in lane_items or []:
            title = str(card.get("title") or "").lower()
            body = str(card.get("body") or "").lower()
            if expected in title or "continuation controller" in title or "no-partial policy" in f"{title} {body}":
                return card
    return None


def normalize_final_status(raw: str, continuation_required: bool, real_blockers: list[str]) -> str:
    status = str(raw or "").upper()
    if status == "PARTIAL":
        return "CONTINUING"
    if real_blockers:
        return "BLOCKED"
    if continuation_required:
        return "CONTINUING"
    return "PASS" if status in {"", "PASS", "OK", "SUCCESS"} else (status if status in {"CONTINUING", "BLOCKED"} else "CONTINUING")


def render_continuation_checkpoint(controller: dict[str, Any]) -> str:
    next_commands = [
        "export HOME=/workspace PATH=/workspace/bin:/workspace/.hermes/node/bin:$PATH",
        "cd /workspace/projects/webstudio-ops-dashboard",
        "python3 -m py_compile scripts/build_snapshot.py",
        "node --check src/app.js",
        "npm run smoke",
        "npm run build",
        "qmd update",
        "hfinalize",
    ]
    unfinished = controller.get("unfinished_reasons") or ["none"]
    blockers = controller.get("real_blockers") or ["none"]
    external_limitations = controller.get("external_limitations") or ["none"]
    controls = controller.get("continuation_controls") or {}
    return "\n".join([
        "# Current Task Continuation Checkpoint",
        "",
        f"Updated: {controller['updated_at']}",
        "Status target: PASS only when validation is clean; CONTINUING while unfinished; BLOCKED only for real blockers.",
        "No bare PARTIAL final answer is allowed; PARTIAL is normalized to CONTINUING.",
        "",
        "## Completed work",
        "- Continuation controller guard is active in `/workspace/projects/webstudio-ops-dashboard/scripts/build_snapshot.py`.",
        "- Guard detects near-limit runtime/tool signals and unfinished workflow states.",
        "- Guard refreshes this checkpoint before returning a CONTINUING/BLOCKED route.",
        "- Terminal protocol is explicit: success uses `kanban_complete`; real blockers use `kanban_block`; silent exit is forbidden.",
        "",
        "## Unfinished work",
        *[f"- {item}" for item in unfinished],
        "",
        "## Exact next commands",
        "```bash",
        *next_commands,
        "```",
        "",
        "## Next files",
        "- `/workspace/output/current-task-continuation-checkpoint.md`",
        "- `/workspace/output/webstudio-control-plane-state.json`",
        "- `/workspace/output/webstudio-ops-dashboard-static/`",
        "- `/workspace/output/finalizer/hfinalize-*.md`",
        "",
        "## Validation requirements",
        "- `state.continuation_controller.terminal_protocol.silent_exit_allowed == false`",
        "- `state.continuation_controller.terminal_protocol.forbidden_final_states` contains `PARTIAL`",
        "- `state.continuation_controller.final_status` is one of `PASS`, `CONTINUING`, `BLOCKED`",
        "- `kanban_complete` is used for success; `kanban_block` is used for real blockers.",
        "- `qmd_update PASS` and `hfinalize PASS` before final operator response.",
        "",
        "## Continuation controls",
        f"- Required Kanban card: `{CONTINUATION_CARD_TITLE}` / exists={controls.get('kanban_card_exists')}",
        f"- Required cron continuation: `work-factory-supervisor-12h` / expected job `5b5c924ba019` / status={controls.get('cron_continuation_status')}",
        f"- Next route: {controller.get('next_route')}",
        "",
        "## Current blockers",
        *[f"- {item}" for item in blockers],
        "",
        "## External limitations / not terminal blockers",
        *[f"- {item}" for item in external_limitations],
        "",
    ]) + "\n"


def build_continuation_controller(kanban: dict[str, Any], worker_health: dict[str, Any], github: dict[str, Any], marathon: dict[str, Any]) -> dict[str, Any]:
    near_limit = detect_near_limit()
    continuation_card = find_continuation_card(kanban)
    latest_hfinalize = latest_file_info("finalizer/hfinalize-*.md")
    screenshot = stat_info(AGENT_WORKFLOW_SCREENSHOT_PATH)
    unfinished_reasons: list[str] = []
    real_blockers: list[str] = []
    external_limitations: list[str] = []
    if worker_health.get("agent_workflow_v1_repeated_crash_count", 0) > 0:
        unfinished_reasons.append("agent-workflow repeated crash indicators remain above zero")
    if worker_health.get("stale_running_dead_pid_2h_count", 0) > 0:
        unfinished_reasons.append("stale running/dead-PID indicators remain above zero")
    if not screenshot.get("exists"):
        unfinished_reasons.append("agent-workflow screenshot evidence is missing")
    if not latest_hfinalize.get("exists"):
        unfinished_reasons.append("no hfinalize report exists yet")
    if not CONTINUATION_CHECKPOINT_PATH.exists():
        unfinished_reasons.append("continuation checkpoint is missing and must be created before safe handoff")
    if continuation_card is None:
        real_blockers.append(f"required continuation Kanban card is missing: {CONTINUATION_CARD_TITLE}")
    if github.get("wrapper_broken"):
        external_limitations.append("sandbox gh wrapper cannot push PR updates; host GitHub credentials/repair packet required")
    if str(marathon.get("status") or "") == "not_verified":
        unfinished_reasons.append("12h marathon continuation cron is not freshly verified")
    if near_limit["near_limit"]:
        unfinished_reasons.append("runtime/tool/context limit guard is tripped")
    continuation_required = bool(unfinished_reasons or near_limit["near_limit"])
    final_status = normalize_final_status("CONTINUING" if continuation_required else "PASS", continuation_required, real_blockers)
    controller = {
        "updated_at": utc_now(),
        "source_of_truth": "build_snapshot.py continuation controller + /workspace/output/current-task-continuation-checkpoint.md",
        "policy_path": str(CONTINUATION_POLICY_PATH),
        "checkpoint_path": str(CONTINUATION_CHECKPOINT_PATH),
        "checkpoint": stat_info(CONTINUATION_CHECKPOINT_PATH),
        "near_limit_detection": near_limit,
        "unfinished_detected": bool(unfinished_reasons),
        "unfinished_reasons": unfinished_reasons,
        "real_blockers": real_blockers,
        "external_limitations": external_limitations,
        "continuation_required": continuation_required,
        "final_status": final_status,
        "next_route": "kanban_block review-required if code changes need review" if real_blockers else ("refresh checkpoint and continue via next pass/cron/card" if continuation_required else "kanban_complete"),
        "continuation_controls": {
            "kanban_card_title": CONTINUATION_CARD_TITLE,
            "kanban_card_exists": continuation_card is not None,
            "kanban_card": continuation_card,
            "cron_continuation_name": "work-factory-supervisor-12h",
            "cron_continuation_job": "5b5c924ba019",
            "cron_continuation_status": marathon.get("status"),
        },
        "terminal_protocol": {
            "allowed_final_states": ["PASS", "CONTINUING", "BLOCKED"],
            "forbidden_final_states": ["PARTIAL"],
            "partial_mapping": "PARTIAL -> CONTINUING after refreshing checkpoint",
            "success_action": "kanban_complete",
            "blocker_action": "kanban_block",
            "silent_exit_allowed": False,
            "bare_partial_allowed": False,
        },
        "evidence": {
            "policy": stat_info(CONTINUATION_POLICY_PATH),
            "latest_hfinalize": latest_hfinalize,
            "agent_workflow_screenshot": screenshot,
            "github_status": github.get("status"),
        },
    }
    if continuation_required or final_status in {"CONTINUING", "BLOCKED"}:
        OUTPUT.mkdir(parents=True, exist_ok=True)
        CONTINUATION_CHECKPOINT_PATH.write_text(render_continuation_checkpoint(controller))
        controller["checkpoint"] = stat_info(CONTINUATION_CHECKPOINT_PATH)
        controller["checkpoint_refreshed"] = True
    else:
        controller["checkpoint_refreshed"] = False
    return controller


def build_agent_workflow(production_pipeline: dict[str, Any], worker_health: dict[str, Any], github: dict[str, Any]) -> dict[str, Any]:
    canary = load_json(OUTPUT / "webstudio-agent-canary-results-v1.json", {"results": []})
    lanes = production_pipeline.get("logical_lanes") or {}
    sections = {r["section"]: [] for r in AGENT_ROLES}
    for lane_items in lanes.values():
        for card in lane_items or []:
            agent = str(card.get("assigned_agent") or infer_assigned_agent(str(card.get("title") or ""), str(card.get("body") or ""), str(card.get("assignee") or "")))
            section = next((r["section"] for r in AGENT_ROLES if r["name"] == agent), "Orchestrator Dispatch Queue")
            sections.setdefault(section, []).append(card)
    for k, items in sections.items():
        items.sort(key=lambda x: x.get("last_activity_at") or x.get("updated_at") or x.get("created_at") or 0, reverse=True)
    return {
        "source_of_truth": "/workspace/output/webstudio-agent-operating-model-v1.md + Hermes Kanban production projection",
        "diagram": ["CTO Agent", "Orchestrator Agent", "Specialist Agents", "QA/Delivery", "Done"],
        "roles": AGENT_ROLES,
        "sections": {k: v[:60] for k, v in sections.items()},
        "canary_results": canary,
        "protocol": {
            "doc": "/workspace/output/webstudio-agent-worker-protocol-v1.md",
            "continuation_policy": "/workspace/output/webstudio-continuation-policy-v1.md",
            "continuation_checkpoint": "/workspace/output/current-task-continuation-checkpoint.md",
            "terminal_actions": ["kanban_complete", "kanban_block"],
            "silent_finish_allowed": False,
            "ops_lane_status": "WATCH: use default lane temporarily until host-level ops profile terminator contract is repaired",
            "repeated_crashes_after_indicator_count": worker_health.get("agent_workflow_v1_repeated_crash_count", 0),
            "stale_running_dead_pid_after_2h_count": worker_health.get("stale_running_dead_pid_2h_count", 0),
            "stale_backlog_after_2h_count": worker_health.get("stale_2h_count", 0),
        },
        "kanban_mapping": {
            "triage": "CTO Agent receives raw idea/client request and drafts/refines spec",
            "todo": "Orchestrator accepted spec but dependencies remain",
            "scheduled": "Orchestrator scheduled work for cron/timed window",
            "ready": "Orchestrator assigned task to specialist profile",
            "in_progress": "Specialist agent actively executing",
            "review": "QA/Delivery/Owner review stage; logical production_stage=qa|delivery-handoff if native review unsupported",
            "blocked": "true blockers only",
            "done": "accepted completed task with artifact/proof",
            "archived": "old canary/test/noise",
        },
        "github_pr": {
            "status": github.get("status") or "PR_CREATED",
            "repo": "pltnv123/webstudio-ops-dashboard",
            "branch": "webstudio/hardening-v3-host-completion",
            "url": github.get("pr_url") or "https://github.com/pltnv123/webstudio-ops-dashboard/pull/1",
            "latest_commit_sha": github.get("latest_commit_sha"),
            "pushed_at": github.get("pushed_at"),
            "local_cli_status": github.get("status"),
            "wrapper_broken": github.get("wrapper_broken"),
        },
        "marathon_loop": [
            "CTO Agent picks/refines next best work item",
            "Orchestrator Agent splits/routes work",
            "Specialist agent executes and terminates with kanban_complete/kanban_block",
            "QA/Delivery validates",
            "Kanban and Ops Cockpit are updated",
            "GitHub branch/PR updated when code changes and gh is available",
            "qmd update, hfinalize, short heartbeat",
        ],
    }

def build_state() -> dict[str, Any]:
    raw = load_json(STATE_PATH, {})
    wf = build_work_factory(raw if isinstance(raw, dict) else {})
    kanban = build_kanban()
    live_counts = parse_markdown_counts(read_text(LIVE_KANBAN_PATH))
    health = build_health()
    approvals = build_approvals(wf, kanban)
    production_pipeline = build_production_pipeline(kanban)
    product_progress = build_product_progress()
    motion_factory = build_motion_factory(product_progress)
    client_intake_v27 = build_client_intake_v27()
    github_readiness = build_github_readiness()
    worker_health = build_worker_health(kanban)
    marathon_status = build_marathon_status()
    continuation_controller = build_continuation_controller(kanban, worker_health, github_readiness, marathon_status)
    agent_workflow = build_agent_workflow(production_pipeline, worker_health, github_readiness)
    agent_workflow["protocol"]["continuation_controller"] = {
        "final_status": continuation_controller["final_status"],
        "checkpoint_path": continuation_controller["checkpoint_path"],
        "checkpoint_refreshed": continuation_controller["checkpoint_refreshed"],
        "near_limit_detection": continuation_controller["near_limit_detection"],
        "terminal_protocol": continuation_controller["terminal_protocol"],
    }
    safety_status = "pass"
    safety_findings = []
    if kanban.get("executable_mirror_count"):
        safety_status = "fail"
        safety_findings.append("mirror cards present in executable lanes")
    if kanban.get("duplicate_keys"):
        safety_status = "fail"
        safety_findings.append("duplicate mirror idempotency keys detected")
    control_plane_history = load_json(CONTROL_HISTORY_PATH, {"snapshots": []})
    return {
        "schema_version":"webstudio-control-plane.v1",
        "generated_at": utc_now(),
        "mode":"read_only_ops_cockpit",
        "notification_policy":{"mode":"quiet","notify_on":["owner_decision","error","blocked","material_milestone","sla_breach"]},
        "autonomy_policy":{"approved_levels":["A_report_planning_only","B_local_artifacts_only","C_branches_pr_owner_approved","D_deploy_after_explicit_approval"],"approval_required_for":["live_production_secrets","live_telegram_token","live_crm_or_sheets_writes","supabase_write_migration","deploy_or_release","payment_or_live_external_action","private_client_data_approval"]},
        "host_autonomy": build_host_autonomy(health, github_readiness),
        "product_lines": PRODUCT_LINES,
        "safety": {
            "status": safety_status,
            "findings": safety_findings,
            "read_only": True,
            "dispatch_allowed": False,
            "worker_allowed": False,
            "forbidden_actions": FORBIDDEN_ACTIONS,
            "mirror_executable_count": kanban.get("executable_mirror_count", 0),
            "duplicate_keys": kanban.get("duplicate_keys", {}),
        },
        "sources": {
            "work_factory_state": stat_info(STATE_PATH),
            "work_factory_checkpoint": stat_info(CHECKPOINT_PATH),
            "live_kanban_v3_report": stat_info(LIVE_KANBAN_PATH),
            "host_health_snapshot": stat_info(HOST_SNAPSHOT_PATH),
        },
        "work_factory": wf,
        "kanban": kanban,
        "production_pipeline": production_pipeline,
        "product_progress": product_progress,
        "motion_factory": motion_factory,
        "client_intake_v27": client_intake_v27,
        "control_plane_history": control_plane_history,
        "github_readiness": github_readiness,
        "worker_health": worker_health,
        "agent_workflow": agent_workflow,
        "continuation_controller": continuation_controller,
        "kanban_semantics": build_kanban_semantics_status(),
        "system_hardening": build_system_hardening_status(),
        "marathon_12h": marathon_status,
        "d1_owner_feedback": build_d1_owner_feedback(),
        "d3_intake": build_d3_intake(),
        "d3_client_qualification": build_d3_client_qualification(),
        "live_kanban_v3_report": {"source": stat_info(LIVE_KANBAN_PATH), "parsed": live_counts},
        "approvals": approvals,
        "clients_orders": build_clients_orders(),
        "health": health,
        "artifacts": build_artifacts(),
        "audit": {
            "source_of_truth": str(CONTROL_STATE_PATH),
            "notes": [
                "Dashboard is a derived read-only projection.",
                "Kanban remains audit/control-plane.",
                "All write/run/deploy controls are intentionally absent from UI.",
            ],
        },
    }


def copy_static(dist: Path, state: dict[str, Any] | None = None) -> None:
    if dist.exists():
        shutil.rmtree(dist)
    dist.mkdir(parents=True, exist_ok=True)
    for name in ["styles.css", "app.js"]:
        shutil.copy2(SRC / name, dist / name)
    index_html = (SRC / "index.html").read_text()
    if state is not None:
        embedded = json.dumps(state, ensure_ascii=False).replace("</", "<\\/")
        index_html = index_html.replace(
            '  <script src="./app.js"></script>',
            f'  <script>window.__WEBSTUDIO_STATE__ = {embedded};</script>\n  <script src="./app.js"></script>'
        )
    (dist / "index.html").write_text(index_html)
    # Owner tunnel supports direct paths such as /kanban. Keep static hosting
    # route-safe without requiring a hash-only URL.
    for route_name in ["kanban", "production", "demo-products", "agent-workflow", "capabilities", "motion-factory", "intake-orders", "approvals", "health", "artifacts", "marathon", "owner-feedback"]:
        route_dir = dist / route_name
        route_dir.mkdir(parents=True, exist_ok=True)
        (route_dir / "index.html").write_text(index_html)
        for name in ["styles.css", "app.js"]:
            shutil.copy2(SRC / name, route_dir / name)
        (route_dir / "data").mkdir(parents=True, exist_ok=True)
        shutil.copy2(CONTROL_STATE_PATH, route_dir / "data" / "webstudio-control-plane-state.json")
        if CONTROL_HISTORY_PATH.exists():
            shutil.copy2(CONTROL_HISTORY_PATH, route_dir / "data" / "webstudio-control-plane-history.json")
    (dist / "data").mkdir(parents=True, exist_ok=True)
    shutil.copy2(CONTROL_STATE_PATH, dist / "data" / "webstudio-control-plane-state.json")
    if CONTROL_HISTORY_PATH.exists():
        shutil.copy2(CONTROL_HISTORY_PATH, dist / "data" / "webstudio-control-plane-history.json")


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--dist", help="Optional static output dir")
    args = ap.parse_args()
    PUBLIC_DATA.mkdir(parents=True, exist_ok=True)
    state = build_state()
    payload = json.dumps(state, ensure_ascii=False, indent=2) + "\n"
    CONTROL_STATE_PATH.write_text(payload)
    CANONICAL_OUTPUT_STATE_PATH.write_text(payload)
    print(f"snapshot={CONTROL_STATE_PATH} size={CONTROL_STATE_PATH.stat().st_size} sha256={sha256_file(CONTROL_STATE_PATH)}")
    print(f"canonical={CANONICAL_OUTPUT_STATE_PATH} size={CANONICAL_OUTPUT_STATE_PATH.stat().st_size} sha256={sha256_file(CANONICAL_OUTPUT_STATE_PATH)}")
    print(f"safety={state['safety']['status']} mirror_executable_count={state['safety']['mirror_executable_count']} duplicate_keys={len(state['safety']['duplicate_keys'])}")
    if args.dist:
        dist = Path(args.dist)
        copy_static(dist, state)
        print(f"dist={dist} files={len(list(dist.rglob('*')))}")
    return 0

if __name__ == "__main__":
    raise SystemExit(main())
