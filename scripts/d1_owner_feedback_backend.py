#!/usr/bin/env python3
"""File-backed D1 owner admin test feedback inbox backend.

Durable local service layer for owner feedback captured during D1 admin testing.
It stores normalized feedback items and owner decision records as JSONL files,
keeps an idempotency index, validates routing/state invariants, and prepares
Kanban card payloads without mutating Kanban or marking anything Done.
"""
from __future__ import annotations

import argparse
import contextlib
import fcntl
import hashlib
import json
import os
import tempfile
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

WORKSPACE = Path(os.environ.get("WORKSPACE", "/workspace"))
DEFAULT_STORE_PATH = WORKSPACE / "data" / "webstudio" / "d1" / "owner-feedback-inbox.jsonl"
DEFAULT_DECISION_STORE_PATH = WORKSPACE / "data" / "webstudio" / "d1" / "owner-feedback-decisions.jsonl"
DEFAULT_INDEX_PATH = WORKSPACE / "data" / "webstudio" / "d1" / "owner-feedback-index.json"
DEFAULT_LOG_PATH = WORKSPACE / "runtime" / "webstudio-d1-owner-feedback.log"

SCHEMA_VERSION = "2026-05-21.d1-owner-feedback-inbox.v1"
DECISION_SCHEMA_VERSION = "2026-05-21.d1-owner-decision-queue.v1"
AUTOMATION_KEY = "webstudio:D1:owner-feedback"
TENANT = "webstudio-production"
PRODUCT_LINE = "D1"
PRODUCTION_STAGE = "owner_admin_test_feedback"
DEFAULT_APP_UNDER_TEST_URL = "http://127.0.0.1:9120/"
DEFAULT_SOURCE = "telegram_owner"
DEFAULT_SOURCE_OWNER = "Антон"

VALID_SOURCES = {"telegram_owner", "manual_owner", "api", "unknown"}
VALID_FEEDBACK_TYPES = {"bug", "ux_issue", "copy_change", "feature_request", "qa_observation", "ops_issue", "question", "unknown"}
VALID_LANES = {"D1", "D2", "D3", "owner_decision_required"}
DELIVERY_LANES = {"D1", "D2", "D3"}
VALID_SEVERITIES = {"critical", "high", "medium", "low", "trivial"}
TRIAGE_STATES = {
    "raw", "triage_in_progress", "needs_clarification", "owner_decision_pending",
    "ready_for_scoping", "scoped_to_kanban", "in_delivery", "qa_verification_pending",
    "owner_acceptance_pending", "closed", "duplicate", "rejected", "obsolete", "merged",
}
NON_TERMINAL_STATES = {"raw", "triage_in_progress", "needs_clarification", "owner_decision_pending"}
TERMINAL_STATES = {"closed", "duplicate", "rejected", "obsolete", "merged"}
VALID_CLOSE_REASONS = {"converted_to_cards", "duplicate", "rejected_by_owner", "obsolete", "merged_into_other_item"}
VALID_DECISION_STATES = {"queued", "sent_to_owner", "answered", "applied", "rejected", "expired"}
NON_TERMINAL_CARD_STATUSES = {"todo", "ready", "running", "blocked", "review-required", "review", "scheduled", "triage"}

D2_KEYWORDS = [
    "telegram", "webhook", "bot", "телеграм-бот", "интеграц", "integration", "deployment", "deploy",
    "secret", "secrets", "config", "production", "prod", "intake", "raw requirements", "вебхук",
]
D3_KEYWORDS = [
    "workflow", "process", "policy", "offer", "продукт", "lifecycle", "acceptance criteria",
    "roadmap", "spec", "requirements", "client lifecycle", "business rule", "воронк", "правил",
]
AMBIGUOUS_KEYWORDS = [
    "make it better", "fix this", "не нравится", "плохо", "как-то", "unclear", "непонятно",
    "что-то", "лучше", "реши", "подумай",
]


def utc_now() -> str:
    return datetime.now(timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z")


def parse_iso(value: str | None) -> datetime | None:
    if not value:
        return None
    try:
        return datetime.fromisoformat(str(value).replace("Z", "+00:00"))
    except Exception:
        return None


def stable_json(value: Any) -> str:
    return json.dumps(value, ensure_ascii=False, sort_keys=True, separators=(",", ":"))


def sha256_text(value: str) -> str:
    return hashlib.sha256(value.encode("utf-8")).hexdigest()


def clean_string(value: Any, default: str = "unknown") -> str:
    if value is None:
        return default
    text = str(value).strip()
    return text if text else default


def as_list(value: Any) -> list[Any]:
    return value if isinstance(value, list) else []


def as_int(value: Any, default: int = 50) -> int:
    try:
        return int(value)
    except Exception:
        return default


def summarize(text: str, limit: int = 160) -> str:
    clean = " ".join(str(text or "").split())
    if not clean:
        return "Owner feedback pending triage"
    return clean[:limit] + ("…" if len(clean) > limit else "")


def slug_title(text: str, limit: int = 80) -> str:
    title = summarize(text, limit)
    return title if title != "Owner feedback pending triage" else "Owner feedback item"


def redact_error(message: str) -> str:
    text = str(message)
    for marker in ["password", "token", "secret", "api_key", "raw_text", "authorization"]:
        text = text.replace(marker, f"{marker[:3]}…")
    return text[:500]


def normalize_source(source_in: dict[str, Any]) -> dict[str, Any]:
    source = clean_string(source_in.get("source") or source_in.get("type"), DEFAULT_SOURCE).lower()
    if source not in VALID_SOURCES:
        source = "unknown"
    source_message_id = clean_string(
        source_in.get("source_message_id")
        or source_in.get("external_message_id")
        or source_in.get("telegram_message_id"),
        "",
    ) or None
    chat_id = clean_string(source_in.get("chat_id"), "") or None
    topic_id = clean_string(source_in.get("topic_id") or source_in.get("thread_id"), "") or None
    if not source_message_id and chat_id and topic_id and source_in.get("message_id"):
        source_message_id = f"{chat_id}:{topic_id}:{source_in.get('message_id')}"
    return {
        "source": source,
        "source_owner": clean_string(source_in.get("source_owner") or source_in.get("owner"), DEFAULT_SOURCE_OWNER),
        "source_message_id": source_message_id,
        "chat_id": chat_id,
        "topic_id": topic_id,
        "captured_by": clean_string(source_in.get("captured_by"), "trusted_ingestion"),
    }


def infer_lane(raw_text: str, supplied_lane: str | None = None) -> tuple[str, str]:
    lane = clean_string(supplied_lane, "").upper()
    if lane in DELIVERY_LANES:
        return lane, f"supplied lane {lane} accepted"
    if clean_string(supplied_lane, "") == "owner_decision_required":
        return "owner_decision_required", "supplied owner decision lane accepted"
    blob = raw_text.lower()
    if any(k in blob for k in AMBIGUOUS_KEYWORDS):
        return "owner_decision_required", "feedback is ambiguous and requires owner decision before scoping"
    if any(k in blob for k in D2_KEYWORDS):
        return "D2", "feedback touches Telegram/intake/integration/deployment wiring"
    if any(k in blob for k in D3_KEYWORDS):
        return "D3", "feedback changes workflow/product/specification rules"
    return "D1", "default owner admin test feedback lane"


def make_content_hash(raw_text: str, source: dict[str, Any], evidence: list[Any]) -> str:
    payload = {
        "raw_text": raw_text,
        "source": {"source": source.get("source"), "source_message_id": source.get("source_message_id")},
        "evidence": evidence,
    }
    return sha256_text(stable_json(payload))


def make_fingerprint(source: dict[str, Any], content_hash: str) -> str:
    if source.get("source_message_id"):
        return f"{AUTOMATION_KEY}:{source.get('source')}:{source.get('source_message_id')}"
    return f"{AUTOMATION_KEY}:content:{content_hash}"


def make_feedback_id(fingerprint: str) -> str:
    return "fbk_" + sha256_text(fingerprint)[:20]


def make_decision_id(feedback_id: str, question: str) -> str:
    return "dec_" + sha256_text(f"{AUTOMATION_KEY}:decision:{feedback_id}:{question}")[:20]


def normalize_feedback_payload(payload: dict[str, Any]) -> tuple[dict[str, Any] | None, list[str]]:
    errors: list[str] = []
    now = utc_now()
    source_in = payload.get("source") if isinstance(payload.get("source"), dict) else {}
    triage_in = payload.get("triage") if isinstance(payload.get("triage"), dict) else {}
    feedback_in = payload.get("feedback") if isinstance(payload.get("feedback"), dict) else {}
    audit_in = payload.get("audit") if isinstance(payload.get("audit"), dict) else {}

    raw_text = str(feedback_in.get("raw_text") if "raw_text" in feedback_in else payload.get("raw_text", ""))
    if not raw_text.strip():
        errors.append("feedback.raw_text is required")
    source = normalize_source(source_in)
    if source["source"] == "telegram_owner" and not source.get("source_message_id"):
        errors.append("source.source_message_id is required for telegram_owner feedback dedupe")

    evidence = as_list(feedback_in.get("evidence") or payload.get("evidence"))
    content_hash = make_content_hash(raw_text, source, evidence)
    fingerprint = make_fingerprint(source, content_hash)
    feedback_id = clean_string(payload.get("id"), "") or make_feedback_id(fingerprint)
    received_at = clean_string(audit_in.get("received_at") or payload.get("received_at"), now)
    if not parse_iso(received_at):
        errors.append("received_at must be ISO-8601 UTC")

    supplied_lane = triage_in.get("delivery_lane") or payload.get("delivery_lane")
    lane, lane_reason = infer_lane(raw_text, supplied_lane)
    routing_reason = clean_string(triage_in.get("routing_reason"), lane_reason)
    feedback_type = clean_string(triage_in.get("feedback_type"), "unknown")
    if feedback_type not in VALID_FEEDBACK_TYPES:
        feedback_type = "unknown"
    severity = clean_string(triage_in.get("severity"), "medium")
    if severity not in VALID_SEVERITIES:
        severity = "medium"
    priority = max(0, min(100, as_int(triage_in.get("priority"), 50)))
    requested_state = clean_string(triage_in.get("triage_state"), "raw")
    if requested_state not in TRIAGE_STATES:
        errors.append("triage.triage_state is invalid")
        requested_state = "raw"
    if lane == "owner_decision_required" and requested_state in {"raw", "triage_in_progress"}:
        requested_state = "owner_decision_pending"

    record = {
        "id": feedback_id,
        "schema_version": SCHEMA_VERSION,
        "automation_key": AUTOMATION_KEY,
        "tenant": TENANT,
        "product_line": clean_string(payload.get("product_line"), PRODUCT_LINE),
        "production_stage": clean_string(payload.get("production_stage"), PRODUCTION_STAGE),
        "app_under_test_url": clean_string(payload.get("app_under_test_url"), DEFAULT_APP_UNDER_TEST_URL),
        "source": source["source"],
        "source_owner": source["source_owner"],
        "source_message_id": source["source_message_id"],
        "submitted_by": clean_string(payload.get("submitted_by") or feedback_in.get("submitted_by"), source["source_owner"]),
        "received_at": received_at,
        "raw_text": raw_text,
        "normalized_title": clean_string(feedback_in.get("normalized_title"), slug_title(raw_text)),
        "normalized_summary": clean_string(feedback_in.get("normalized_summary"), summarize(raw_text, 260)),
        "feedback_type": feedback_type,
        "evidence": evidence,
        "affected_area": clean_string(feedback_in.get("affected_area"), "unknown"),
        "delivery_lane": lane,
        "routing_reason": routing_reason,
        "severity": severity,
        "priority": priority,
        "triage_state": requested_state,
        "decision_state": "queued" if lane == "owner_decision_required" else None,
        "acceptance_criteria": as_list(feedback_in.get("acceptance_criteria")),
        "reproduction_steps": as_list(feedback_in.get("reproduction_steps")),
        "not_reproducible_yet": bool(feedback_in.get("not_reproducible_yet", False)),
        "expected_behavior": feedback_in.get("expected_behavior"),
        "actual_behavior": feedback_in.get("actual_behavior"),
        "scope_notes": clean_string(feedback_in.get("scope_notes"), ""),
        "blocked_by": as_list(feedback_in.get("blocked_by")),
        "linked_kanban_task_ids": as_list(payload.get("linked_kanban_task_ids")),
        "implementation_task_id": payload.get("implementation_task_id"),
        "qa_task_id": payload.get("qa_task_id"),
        "owner_decision_task_id": payload.get("owner_decision_task_id"),
        "generated_card_references": as_list(payload.get("generated_card_references")),
        "duplicate_of": payload.get("duplicate_of"),
        "superseded_by": payload.get("superseded_by"),
        "created_by": clean_string(audit_in.get("created_by"), source["captured_by"]),
        "updated_by": clean_string(audit_in.get("updated_by"), source["captured_by"]),
        "created_at": now,
        "updated_at": now,
        "closed_at": None,
        "close_reason": None,
        "idempotency": {
            "key": AUTOMATION_KEY,
            "fingerprint": fingerprint,
            "content_sha256": content_hash,
            "duplicate_policy": "return_existing_without_done_or_card_creation",
        },
        "audit": {
            "events": [{"at": now, "kind": "feedback_created", "state": requested_state, "lane": lane}],
            "source_identity": source,
            "raw_payload_preserved": True,
        },
        "raw_payload": payload,
    }
    if errors:
        return None, errors
    return record, []


@contextlib.contextmanager
def locked_store(store_path: Path):
    store_path.parent.mkdir(parents=True, exist_ok=True)
    lock_path = store_path.with_suffix(store_path.suffix + ".lock")
    with lock_path.open("a+") as lock_file:
        fcntl.flock(lock_file.fileno(), fcntl.LOCK_EX)
        try:
            yield
        finally:
            fcntl.flock(lock_file.fileno(), fcntl.LOCK_UN)


def load_jsonl(path: Path) -> list[dict[str, Any]]:
    if not path.exists():
        return []
    records: list[dict[str, Any]] = []
    for line in path.read_text(errors="replace").splitlines():
        if not line.strip():
            continue
        with contextlib.suppress(Exception):
            obj = json.loads(line)
            if isinstance(obj, dict):
                records.append(obj)
    return records


def rewrite_jsonl(path: Path, records: list[dict[str, Any]]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    tmp_fd, tmp_name = tempfile.mkstemp(prefix=path.name + ".", dir=str(path.parent))
    try:
        with os.fdopen(tmp_fd, "w") as f:
            for record in records:
                f.write(json.dumps(record, ensure_ascii=False, sort_keys=True) + "\n")
        os.replace(tmp_name, path)
    finally:
        with contextlib.suppress(FileNotFoundError):
            os.unlink(tmp_name)


def append_jsonl(path: Path, record: dict[str, Any]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("a") as f:
        f.write(json.dumps(record, ensure_ascii=False, sort_keys=True) + "\n")


def log_event(log_path: Path, event: dict[str, Any]) -> None:
    log_path.parent.mkdir(parents=True, exist_ok=True)
    safe = {k: v for k, v in event.items() if k not in {"raw_text", "payload", "raw_payload"}}
    with log_path.open("a") as f:
        f.write(json.dumps({"at": utc_now(), **safe}, ensure_ascii=False, sort_keys=True) + "\n")


def write_index(index_path: Path, records: list[dict[str, Any]], decisions: list[dict[str, Any]]) -> None:
    index_path.parent.mkdir(parents=True, exist_ok=True)
    by_fingerprint: dict[str, str] = {}
    by_source_message_id: dict[str, str] = {}
    by_state: dict[str, int] = {}
    by_lane: dict[str, int] = {}
    for r in records:
        idem = r.get("idempotency") if isinstance(r.get("idempotency"), dict) else {}
        if idem.get("fingerprint"):
            by_fingerprint[str(idem["fingerprint"])] = str(r.get("id"))
        if r.get("source_message_id"):
            by_source_message_id[str(r["source_message_id"])] = str(r.get("id"))
        st = str(r.get("triage_state") or "unknown")
        lane = str(r.get("delivery_lane") or "unknown")
        by_state[st] = by_state.get(st, 0) + 1
        by_lane[lane] = by_lane.get(lane, 0) + 1
    payload = {
        "schema_version": SCHEMA_VERSION,
        "automation_key": AUTOMATION_KEY,
        "updated_at": utc_now(),
        "feedback_count": len(records),
        "decision_count": len(decisions),
        "by_fingerprint": by_fingerprint,
        "by_source_message_id": by_source_message_id,
        "by_state": by_state,
        "by_lane": by_lane,
        "safety": {"kanban_mutation_performed": False, "done_initialization_allowed": False, "production_db_write": False},
    }
    tmp_fd, tmp_name = tempfile.mkstemp(prefix=index_path.name + ".", dir=str(index_path.parent))
    try:
        with os.fdopen(tmp_fd, "w") as f:
            json.dump(payload, f, ensure_ascii=False, indent=2)
            f.write("\n")
        os.replace(tmp_name, index_path)
    finally:
        with contextlib.suppress(FileNotFoundError):
            os.unlink(tmp_name)


def find_feedback(records: list[dict[str, Any]], feedback_id: str) -> dict[str, Any] | None:
    return next((r for r in records if r.get("id") == feedback_id), None)


def create_feedback(
    payload: dict[str, Any],
    store_path: Path = DEFAULT_STORE_PATH,
    decision_store_path: Path = DEFAULT_DECISION_STORE_PATH,
    index_path: Path = DEFAULT_INDEX_PATH,
    log_path: Path = DEFAULT_LOG_PATH,
) -> dict[str, Any]:
    record, errors = normalize_feedback_payload(payload)
    if errors or record is None:
        log_event(log_path, {"event": "feedback_invalid", "status": "invalid", "errors": [redact_error(e) for e in errors]})
        return {"ok": False, "status": "invalid", "errors": [redact_error(e) for e in errors]}
    with locked_store(store_path):
        records = load_jsonl(store_path)
        decisions = load_jsonl(decision_store_path)
        by_fp = {r.get("idempotency", {}).get("fingerprint"): r for r in records if isinstance(r.get("idempotency"), dict)}
        existing = by_fp.get(record["idempotency"]["fingerprint"])
        if existing:
            now = utc_now()
            audit = existing.setdefault("audit", {})
            audit["duplicate_seen_count"] = int(audit.get("duplicate_seen_count") or 0) + 1
            audit["last_duplicate_at"] = now
            audit.setdefault("events", []).append({"at": now, "kind": "duplicate_submission", "status": "duplicate"})
            rewrite_jsonl(store_path, records)
            write_index(index_path, records, decisions)
            log_event(log_path, {"event": "feedback_duplicate", "status": "duplicate", "feedback_id": existing.get("id")})
            return {"ok": True, "status": "duplicate", "feedback_id": existing.get("id"), "record": existing}
        append_jsonl(store_path, record)
        records.append(record)
        write_index(index_path, records, decisions)
        log_event(log_path, {"event": "feedback_created", "status": "created", "feedback_id": record["id"], "lane": record["delivery_lane"], "state": record["triage_state"]})
        return {"ok": True, "status": "created", "feedback_id": record["id"], "record": record}


def list_feedback(
    filters: dict[str, Any] | None = None,
    store_path: Path = DEFAULT_STORE_PATH,
    limit: int = 100,
) -> list[dict[str, Any]]:
    filters = filters or {}
    records = load_jsonl(store_path)
    def match(r: dict[str, Any]) -> bool:
        for key in ["triage_state", "delivery_lane", "severity", "decision_state", "source_message_id"]:
            if filters.get(key) not in (None, "") and str(r.get(key)) != str(filters[key]):
                return False
        if filters.get("linked_task"):
            linked = set(str(x) for x in as_list(r.get("linked_kanban_task_ids")))
            if str(filters["linked_task"]) not in linked:
                return False
        return True
    out = [r for r in records if match(r)]
    out.sort(key=lambda r: str(r.get("updated_at") or r.get("created_at") or ""), reverse=True)
    return out[:limit]


def validate_update(current: dict[str, Any], updates: dict[str, Any]) -> list[str]:
    errors: list[str] = []
    new_state = clean_string(updates.get("triage_state"), current.get("triage_state"))
    old_state = clean_string(current.get("triage_state"), "raw")
    lane = clean_string(updates.get("delivery_lane"), current.get("delivery_lane"))
    if new_state not in TRIAGE_STATES:
        errors.append("triage_state is invalid")
    if lane not in VALID_LANES:
        errors.append("delivery_lane is invalid")
    if old_state == "raw" and new_state == "closed":
        errors.append("raw feedback cannot transition directly to closed")
    if new_state == "closed":
        close_reason = clean_string(updates.get("close_reason"), current.get("close_reason") or "")
        if close_reason not in VALID_CLOSE_REASONS:
            errors.append("close_reason is required for closed feedback")
        linked_statuses = updates.get("linked_card_statuses") or current.get("linked_card_statuses") or {}
        if isinstance(linked_statuses, dict):
            nonterminal = {k: v for k, v in linked_statuses.items() if str(v) in NON_TERMINAL_CARD_STATUSES}
            if nonterminal:
                errors.append("cannot close while linked implementation/QA/decision cards are non-terminal")
        elif current.get("linked_kanban_task_ids") and close_reason == "converted_to_cards":
            errors.append("linked_card_statuses are required before converted_to_cards close")
    if lane == "owner_decision_required" and new_state not in {"needs_clarification", "owner_decision_pending", "rejected", "obsolete"}:
        errors.append("owner_decision_required lane must stay in clarification/decision state until answered")
    return errors


def update_feedback(
    feedback_id: str,
    updates: dict[str, Any],
    actor: str = "backend_service",
    store_path: Path = DEFAULT_STORE_PATH,
    decision_store_path: Path = DEFAULT_DECISION_STORE_PATH,
    index_path: Path = DEFAULT_INDEX_PATH,
    log_path: Path = DEFAULT_LOG_PATH,
) -> dict[str, Any]:
    with locked_store(store_path):
        records = load_jsonl(store_path)
        decisions = load_jsonl(decision_store_path)
        record = find_feedback(records, feedback_id)
        if not record:
            return {"ok": False, "status": "not_found", "feedback_id": feedback_id}
        errors = validate_update(record, updates)
        if errors:
            return {"ok": False, "status": "invalid_transition", "errors": [redact_error(e) for e in errors], "feedback_id": feedback_id}
        now = utc_now()
        allowed = {
            "delivery_lane", "routing_reason", "severity", "priority", "triage_state", "decision_state",
            "feedback_type", "normalized_title", "normalized_summary", "affected_area", "acceptance_criteria",
            "reproduction_steps", "not_reproducible_yet", "expected_behavior", "actual_behavior", "scope_notes",
            "blocked_by", "linked_kanban_task_ids", "implementation_task_id", "qa_task_id", "owner_decision_task_id",
            "generated_card_references", "duplicate_of", "superseded_by", "linked_card_statuses", "close_reason",
        }
        before = {k: record.get(k) for k in ["triage_state", "delivery_lane", "decision_state", "close_reason"]}
        for key in allowed:
            if key in updates:
                record[key] = updates[key]
        record["updated_at"] = now
        record["updated_by"] = actor
        if record.get("triage_state") == "closed" and not record.get("closed_at"):
            record["closed_at"] = now
        record.setdefault("audit", {}).setdefault("events", []).append({"at": now, "kind": "feedback_updated", "actor": actor, "before": before, "after": {k: record.get(k) for k in before}})
        rewrite_jsonl(store_path, records)
        write_index(index_path, records, decisions)
        log_event(log_path, {"event": "feedback_updated", "status": "updated", "feedback_id": feedback_id, "actor": actor})
        return {"ok": True, "status": "updated", "feedback_id": feedback_id, "record": record}


def default_decision_options() -> list[dict[str, str]]:
    return [
        {"option": "A", "label": "Route to D1", "consequence": "Create scoped owner-admin implementation/QA cards."},
        {"option": "B", "label": "Route to D2", "consequence": "Treat as intake/integration/deployment wiring work."},
        {"option": "C", "label": "Route to D3", "consequence": "Treat as workflow/product/specification work."},
        {"option": "D", "label": "Reject or park", "consequence": "Do not create implementation cards now."},
    ]


def create_owner_decision(
    feedback_id: str,
    question: str,
    options: list[dict[str, Any]] | None = None,
    recommended_option: str | None = None,
    blocking: bool = True,
    actor: str = "backend_service",
    store_path: Path = DEFAULT_STORE_PATH,
    decision_store_path: Path = DEFAULT_DECISION_STORE_PATH,
    index_path: Path = DEFAULT_INDEX_PATH,
    log_path: Path = DEFAULT_LOG_PATH,
) -> dict[str, Any]:
    with locked_store(store_path):
        records = load_jsonl(store_path)
        decisions = load_jsonl(decision_store_path)
        record = find_feedback(records, feedback_id)
        if not record:
            return {"ok": False, "status": "not_found", "feedback_id": feedback_id}
        q = clean_string(question, "Which D1/D2/D3 lane and scope should this feedback use?")
        decision_id = make_decision_id(feedback_id, q)
        existing = next((d for d in decisions if d.get("decision_id") == decision_id), None)
        if existing:
            return {"ok": True, "status": "duplicate", "decision_id": decision_id, "decision": existing}
        now = utc_now()
        decision = {
            "decision_id": decision_id,
            "schema_version": DECISION_SCHEMA_VERSION,
            "automation_key": AUTOMATION_KEY,
            "feedback_id": feedback_id,
            "question": q,
            "options": options if options else default_decision_options(),
            "recommended_option": recommended_option,
            "blocking": bool(blocking),
            "decision_state": "queued",
            "owner_answer_raw": None,
            "owner_answer_normalized": None,
            "applied_to_feedback_at": None,
            "created_by": actor,
            "updated_by": actor,
            "created_at": now,
            "updated_at": now,
            "audit": {"events": [{"at": now, "kind": "owner_decision_created", "actor": actor}]},
        }
        append_jsonl(decision_store_path, decision)
        decisions.append(decision)
        record["delivery_lane"] = "owner_decision_required"
        record["triage_state"] = "owner_decision_pending"
        record["decision_state"] = "queued"
        record["owner_decision_task_id"] = decision_id
        record["updated_at"] = now
        record["updated_by"] = actor
        record.setdefault("blocked_by", [])
        if decision_id not in record["blocked_by"]:
            record["blocked_by"].append(decision_id)
        record.setdefault("audit", {}).setdefault("events", []).append({"at": now, "kind": "owner_decision_linked", "decision_id": decision_id, "actor": actor})
        rewrite_jsonl(store_path, records)
        write_index(index_path, records, decisions)
        log_event(log_path, {"event": "owner_decision_created", "status": "queued", "feedback_id": feedback_id, "decision_id": decision_id})
        return {"ok": True, "status": "queued", "decision_id": decision_id, "decision": decision, "feedback": record}


def apply_owner_decision(
    decision_id: str,
    owner_answer_raw: str,
    owner_answer_normalized: str,
    target_lane: str | None = None,
    actor: str = "owner",
    store_path: Path = DEFAULT_STORE_PATH,
    decision_store_path: Path = DEFAULT_DECISION_STORE_PATH,
    index_path: Path = DEFAULT_INDEX_PATH,
    log_path: Path = DEFAULT_LOG_PATH,
) -> dict[str, Any]:
    target = clean_string(target_lane, "").upper()
    if target and target not in DELIVERY_LANES and target != "REJECTED":
        return {"ok": False, "status": "invalid", "errors": ["target_lane must be D1, D2, D3, or REJECTED"]}
    with locked_store(store_path):
        records = load_jsonl(store_path)
        decisions = load_jsonl(decision_store_path)
        decision = next((d for d in decisions if d.get("decision_id") == decision_id), None)
        if not decision:
            return {"ok": False, "status": "not_found", "decision_id": decision_id}
        feedback_id = str(decision.get("feedback_id"))
        record = find_feedback(records, feedback_id)
        if not record:
            return {"ok": False, "status": "feedback_not_found", "decision_id": decision_id, "feedback_id": feedback_id}
        now = utc_now()
        decision["owner_answer_raw"] = owner_answer_raw
        decision["owner_answer_normalized"] = owner_answer_normalized
        decision["decision_state"] = "rejected" if target == "REJECTED" else "applied"
        decision["applied_to_feedback_at"] = now
        decision["updated_by"] = actor
        decision["updated_at"] = now
        decision.setdefault("audit", {}).setdefault("events", []).append({"at": now, "kind": "owner_decision_applied", "actor": actor, "target_lane": target})
        if target == "REJECTED":
            record["triage_state"] = "rejected"
            record["decision_state"] = "rejected"
            record["close_reason"] = "rejected_by_owner"
        else:
            record["delivery_lane"] = target or "D1"
            record["triage_state"] = "ready_for_scoping"
            record["decision_state"] = "applied"
            record["routing_reason"] = f"owner decision {decision_id} applied: {owner_answer_normalized}"
        record["updated_at"] = now
        record["updated_by"] = actor
        record.setdefault("audit", {}).setdefault("events", []).append({"at": now, "kind": "owner_decision_applied", "decision_id": decision_id, "actor": actor})
        rewrite_jsonl(decision_store_path, decisions)
        rewrite_jsonl(store_path, records)
        write_index(index_path, records, decisions)
        log_event(log_path, {"event": "owner_decision_applied", "status": decision["decision_state"], "feedback_id": feedback_id, "decision_id": decision_id})
        return {"ok": True, "status": decision["decision_state"], "decision": decision, "feedback": record}


def validate_scope_ready(record: dict[str, Any]) -> list[str]:
    errors: list[str] = []
    if record.get("triage_state") not in {"ready_for_scoping", "scoped_to_kanban"}:
        errors.append("feedback must be ready_for_scoping or scoped_to_kanban before implementation/QA card payload generation")
    if record.get("delivery_lane") not in DELIVERY_LANES:
        errors.append("feedback must map to D1, D2, or D3 before card payload generation")
    if not as_list(record.get("acceptance_criteria")):
        errors.append("acceptance_criteria are required before implementation card payload generation")
    if record.get("feedback_type") == "bug" and not as_list(record.get("reproduction_steps")) and not record.get("not_reproducible_yet"):
        errors.append("bug feedback requires reproduction_steps or not_reproducible_yet before implementation card payload generation")
    return errors


def generate_scoped_card_payloads(feedback_id: str, store_path: Path = DEFAULT_STORE_PATH) -> dict[str, Any]:
    records = load_jsonl(store_path)
    record = find_feedback(records, feedback_id)
    if not record:
        return {"ok": False, "status": "not_found", "feedback_id": feedback_id}
    errors = validate_scope_ready(record)
    if errors:
        return {"ok": False, "status": "not_ready", "errors": errors, "feedback_id": feedback_id}
    lane = record["delivery_lane"]
    title = record["normalized_title"]
    body_common = (
        f"Feedback id: {record['id']}\n"
        f"Owner source: {record['source']} / {record['source_owner']}\n"
        f"Source message id: {record.get('source_message_id')}\n"
        f"Lane: {lane}\n"
        f"App under test: {record.get('app_under_test_url')}\n"
        f"Summary: {record.get('normalized_summary')}\n"
        f"Raw feedback: {record.get('raw_text')}\n"
        f"Acceptance criteria:\n" + "\n".join(f"- {x}" for x in as_list(record.get("acceptance_criteria"))) + "\n"
        f"Reproduction steps:\n" + "\n".join(f"- {x}" for x in as_list(record.get("reproduction_steps"))) + "\n"
        f"Scope notes: {record.get('scope_notes') or 'none'}\n"
        f"Exclusions: do not mark feedback as Done; do not close inbox item until QA/owner acceptance rules pass.\n"
    )
    impl = {
        "create": True,
        "type": "implementation",
        "title": f"[{lane}][owner-feedback] {title}",
        "assignee": "default",
        "tenant": TENANT,
        "priority": int(record.get("priority") or 50),
        "initial_status": "todo",
        "idempotency_key": f"{AUTOMATION_KEY}:{feedback_id}:implementation",
        "body": body_common,
        "metadata": {"feedback_id": feedback_id, "lane": lane, "source_message_id": record.get("source_message_id"), "do_not_place_in_done": True},
    }
    qa_required = record.get("feedback_type") in {"bug", "ux_issue", "qa_observation"} or lane == "D1"
    qa = {
        "create": qa_required,
        "type": "qa",
        "title": f"[QA][{lane}][owner-feedback] Verify {title}",
        "assignee": "default",
        "tenant": TENANT,
        "priority": int(record.get("priority") or 50),
        "initial_status": "todo",
        "depends_on": "implementation_task_id",
        "idempotency_key": f"{AUTOMATION_KEY}:{feedback_id}:qa",
        "body": body_common + "QA verification: verify acceptance criteria, regression impact, and owner-visible behavior.\n",
        "metadata": {"feedback_id": feedback_id, "lane": lane, "source_message_id": record.get("source_message_id"), "do_not_place_in_done": True},
    }
    return {"ok": True, "status": "payloads_generated", "feedback_id": feedback_id, "card_payloads": {"implementation": impl, "qa": qa}, "kanban_mutation_performed": False}


def persist_generated_card_references(
    feedback_id: str,
    card_payloads: dict[str, Any],
    actor: str = "backend_service",
    store_path: Path = DEFAULT_STORE_PATH,
    decision_store_path: Path = DEFAULT_DECISION_STORE_PATH,
    index_path: Path = DEFAULT_INDEX_PATH,
    log_path: Path = DEFAULT_LOG_PATH,
) -> dict[str, Any]:
    refs = []
    for key, payload in card_payloads.items():
        if isinstance(payload, dict) and payload.get("create"):
            refs.append({"type": key, "idempotency_key": payload.get("idempotency_key"), "title": payload.get("title"), "initial_status": payload.get("initial_status", "todo")})
    return update_feedback(
        feedback_id,
        {"generated_card_references": refs, "triage_state": "scoped_to_kanban"},
        actor=actor,
        store_path=store_path,
        decision_store_path=decision_store_path,
        index_path=index_path,
        log_path=log_path,
    )


def build_owner_feedback_state(
    store_path: Path = DEFAULT_STORE_PATH,
    decision_store_path: Path = DEFAULT_DECISION_STORE_PATH,
    log_path: Path = DEFAULT_LOG_PATH,
    limit: int = 80,
) -> dict[str, Any]:
    records = load_jsonl(store_path)
    decisions = load_jsonl(decision_store_path)
    records.sort(key=lambda r: str(r.get("updated_at") or r.get("created_at") or ""), reverse=True)
    by_state: dict[str, int] = {}
    by_lane: dict[str, int] = {}
    by_severity: dict[str, int] = {}
    for r in records:
        by_state[str(r.get("triage_state") or "unknown")] = by_state.get(str(r.get("triage_state") or "unknown"), 0) + 1
        by_lane[str(r.get("delivery_lane") or "unknown")] = by_lane.get(str(r.get("delivery_lane") or "unknown"), 0) + 1
        by_severity[str(r.get("severity") or "unknown")] = by_severity.get(str(r.get("severity") or "unknown"), 0) + 1
    open_decisions = [d for d in decisions if d.get("decision_state") in {"queued", "sent_to_owner", "answered"}]
    return {
        "available": True,
        "schema_version": SCHEMA_VERSION,
        "automation_key": AUTOMATION_KEY,
        "source_of_truth": str(store_path),
        "decision_source_of_truth": str(decision_store_path),
        "tenant": TENANT,
        "product_line": PRODUCT_LINE,
        "production_stage": PRODUCTION_STAGE,
        "app_under_test_url": DEFAULT_APP_UNDER_TEST_URL,
        "feedback_count": len(records),
        "decision_count": len(decisions),
        "open_decision_count": len(open_decisions),
        "counts": {"by_state": by_state, "by_lane": by_lane, "by_severity": by_severity},
        "latest_feedback": records[:limit],
        "owner_decision_queue": open_decisions[:limit],
        "store": {"path": str(store_path), "exists": store_path.exists(), "size": store_path.stat().st_size if store_path.exists() else 0},
        "decision_store": {"path": str(decision_store_path), "exists": decision_store_path.exists(), "size": decision_store_path.stat().st_size if decision_store_path.exists() else 0},
        "log": {"path": str(log_path), "exists": log_path.exists(), "size": log_path.stat().st_size if log_path.exists() else 0},
        "safety": {
            "kanban_mutation_performed": False,
            "done_initialization_allowed": False,
            "raw_to_closed_allowed": False,
            "close_label": "Closed/Duplicate/Rejected/Obsolete/Merged, never Done",
        },
    }


def main() -> int:
    parser = argparse.ArgumentParser(description="D1 owner feedback inbox backend service CLI")
    parser.add_argument("--input-json", help="Path to JSON payload, or '-' for stdin")
    parser.add_argument("--raw-text", help="Raw feedback text for quick capture")
    parser.add_argument("--source-message-id")
    parser.add_argument("--lane", choices=sorted(VALID_LANES))
    parser.add_argument("--state", action="store_true", help="Print owner feedback inbox state")
    parser.add_argument("--list", action="store_true", help="List feedback records")
    parser.add_argument("--filter-state")
    parser.add_argument("--filter-lane")
    parser.add_argument("--scope-feedback-id", help="Generate implementation/QA card payloads for a feedback item")
    parser.add_argument("--store-path", default=str(DEFAULT_STORE_PATH))
    parser.add_argument("--decision-store-path", default=str(DEFAULT_DECISION_STORE_PATH))
    parser.add_argument("--index-path", default=str(DEFAULT_INDEX_PATH))
    parser.add_argument("--log-path", default=str(DEFAULT_LOG_PATH))
    args = parser.parse_args()

    store = Path(args.store_path)
    decisions = Path(args.decision_store_path)
    index = Path(args.index_path)
    log = Path(args.log_path)
    if args.state:
        print(json.dumps(build_owner_feedback_state(store, decisions, log), ensure_ascii=False, indent=2))
        return 0
    if args.list:
        print(json.dumps(list_feedback({"triage_state": args.filter_state, "delivery_lane": args.filter_lane}, store), ensure_ascii=False, indent=2))
        return 0
    if args.scope_feedback_id:
        result = generate_scoped_card_payloads(args.scope_feedback_id, store)
        print(json.dumps(result, ensure_ascii=False, indent=2))
        return 0 if result.get("ok") else 2
    if args.input_json:
        text = os.sys.stdin.read() if args.input_json == "-" else Path(args.input_json).read_text()
        payload = json.loads(text)
    else:
        payload = {
            "source": {"source": DEFAULT_SOURCE, "source_message_id": args.source_message_id, "captured_by": "cli"},
            "raw_text": args.raw_text or "",
            "delivery_lane": args.lane,
        }
    result = create_feedback(payload, store, decisions, index, log)
    print(json.dumps(result, ensure_ascii=False, indent=2))
    return 0 if result.get("ok") else 2


if __name__ == "__main__":
    raise SystemExit(main())
