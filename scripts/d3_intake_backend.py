#!/usr/bin/env python3
"""File-backed D3 inbound request capture backend.

Safe local backend path for the WebStudio D3 raw requirements inbox.
It does not write production DBs or mutate Kanban cards. It persists canonical
records as append-only JSONL plus a small index for idempotent lookups.
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
DEFAULT_STORE_PATH = WORKSPACE / "data" / "webstudio" / "d3" / "raw-requirements-inbox.jsonl"
DEFAULT_INDEX_PATH = WORKSPACE / "data" / "webstudio" / "d3" / "raw-requirements-index.json"
DEFAULT_LOG_PATH = WORKSPACE / "runtime" / "webstudio-d3-intake-capture.log"

SCHEMA_VERSION = "2026-05-21.d3-inbound-request-inbox.v1"
RECORD_TYPE = "raw_requirement"
PRODUCT_LINE = "D3"
STAGE = "intake"
TENANT = "webstudio-production"
PURPOSE = "Inbound request capture and raw requirements inbox"
SOURCE_BOARD = "webstudio-production"
SOURCE_VIEW = "raw_requirements_inbox"
IDEMPOTENCY_KEY = "webstudio:D3:intake"
ROOT_PRODUCTION_CARD_ID = "t_7729a43d"

VALID_PLATFORMS = {"telegram", "web_form", "email", "manual", "kanban", "api", "unknown"}
VALID_ROUTES = {"business_automation", "discovery", "risk_review", "decline", "unknown"}
VALID_PRIORITIES = {"untriaged", "low", "medium", "high", "urgent"}
VALID_RISKS = {"unknown", "low", "medium", "high", "critical"}
VALID_ACTIONS = {"capture_only", "manual_triage", "ask_questions", "create_discovery_task", "risk_review", "decline"}
VALID_INBOX_STATUSES = {"new", "needs_clarification", "qualified", "duplicate", "obsolete", "blocked_owner"}
OWNER_GATE_VALUES = {"yes", "true", "present", "requested", "required"}


def utc_now() -> str:
    return datetime.now(timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z")


def parse_iso(value: str | None) -> datetime | None:
    if not value:
        return None
    try:
        return datetime.fromisoformat(value.replace("Z", "+00:00"))
    except Exception:
        return None


def sha256_text(value: str) -> str:
    return hashlib.sha256(value.encode("utf-8")).hexdigest()


def stable_json(value: Any) -> str:
    return json.dumps(value, ensure_ascii=False, sort_keys=True, separators=(",", ":"))


def clean_string(value: Any, default: str = "unknown") -> str:
    if value is None:
        return default
    text = str(value).strip()
    return text if text else default


def list_value(value: Any) -> list[Any]:
    return value if isinstance(value, list) else []


def normalize_summary(raw_text: str, attachments: list[dict[str, Any]]) -> str:
    text = " ".join(raw_text.split())
    if text:
        return text[:220] + ("…" if len(text) > 220 else "")
    if attachments:
        return f"Attachment-only D3 intake request ({len(attachments)} attachment/link ref(s))"
    return "Empty D3 intake request"


def redact_error(message: str) -> str:
    """Keep diagnostics useful without echoing raw request bodies or secrets."""
    text = str(message)
    for marker in ["raw_text", "password", "token", "secret", "api_key"]:
        text = text.replace(marker, f"{marker[:3]}…")
    return text[:500]


def source_identity(source: dict[str, Any]) -> dict[str, str | None]:
    platform = clean_string(source.get("platform"), "unknown").lower()
    if platform not in VALID_PLATFORMS:
        platform = "unknown"
    return {
        "platform": platform,
        "channel_or_form": clean_string(source.get("channel_or_form"), "unknown"),
        "external_message_id": clean_string(source.get("external_message_id"), "") or None,
        "external_thread_id": clean_string(source.get("external_thread_id"), "") or None,
        "source_url": clean_string(source.get("source_url"), "") or None,
        "captured_by": clean_string(source.get("captured_by"), "api integration"),
    }


def content_sha256(raw_text: str, attachments: list[dict[str, Any]], source: dict[str, Any]) -> str:
    attachment_refs = [
        {
            "type": a.get("type"),
            "source_file_ref": a.get("source_file_ref"),
            "storage_ref": a.get("storage_ref"),
            "sha256": a.get("sha256"),
        }
        for a in attachments
        if isinstance(a, dict)
    ]
    payload = {
        "raw_text": raw_text,
        "attachments": attachment_refs,
        "source": {
            "platform": source.get("platform"),
            "channel_or_form": source.get("channel_or_form"),
            "external_message_id": source.get("external_message_id"),
            "external_thread_id": source.get("external_thread_id"),
        },
    }
    return sha256_text(stable_json(payload))


def make_fingerprint(source: dict[str, Any], received_at: str, captured_at: str, content_hash: str, submitter: dict[str, Any]) -> str:
    platform = source["platform"] or "unknown"
    channel = source["channel_or_form"] or "unknown"
    if source.get("external_message_id"):
        return f"{IDEMPOTENCY_KEY}:{platform}:{channel}:{source['external_message_id']}"
    if source.get("external_thread_id"):
        dt = parse_iso(received_at)
        epoch = int(dt.timestamp()) if dt else 0
        return f"{IDEMPOTENCY_KEY}:{platform}:{source['external_thread_id']}:{epoch}:{content_hash}"
    operator = clean_string(submitter.get("contact_handle") or submitter.get("name"), "unknown")
    date = (parse_iso(captured_at) or datetime.now(timezone.utc)).date().isoformat()
    return f"{IDEMPOTENCY_KEY}:manual:{operator}:{date}:{content_hash}"


def make_record_id(fingerprint: str) -> str:
    return "d3req_" + sha256_text(fingerprint)[:20]


def normalize_attachment(value: Any) -> dict[str, Any] | None:
    if not isinstance(value, dict):
        return None
    return {
        "type": clean_string(value.get("type"), "other"),
        "original_name": value.get("original_name"),
        "mime_type": value.get("mime_type"),
        "size_bytes": int(value.get("size_bytes") or 0),
        "source_file_ref": value.get("source_file_ref"),
        "storage_status": clean_string(value.get("storage_status"), "not_stored"),
        "storage_ref": value.get("storage_ref"),
        "sha256": value.get("sha256"),
        "note": value.get("note"),
    }


def normalize_payload(payload: dict[str, Any]) -> tuple[dict[str, Any] | None, list[str]]:
    errors: list[str] = []
    now = utc_now()
    source_in = payload.get("source") if isinstance(payload.get("source"), dict) else {}
    submitter_in = payload.get("client_or_submitter") or payload.get("submitter")
    if not isinstance(submitter_in, dict):
        submitter_in = {}
    request_in = payload.get("request") if isinstance(payload.get("request"), dict) else {}
    classification_in = payload.get("classification") if isinstance(payload.get("classification"), dict) else {}
    privacy_in = payload.get("privacy_and_risk") if isinstance(payload.get("privacy_and_risk"), dict) else {}
    audit_in = payload.get("audit") if isinstance(payload.get("audit"), dict) else {}

    raw_text = str(request_in.get("raw_text") if "raw_text" in request_in else payload.get("raw_requirement", payload.get("raw_text", "")))
    attachments = [a for a in (normalize_attachment(x) for x in list_value(payload.get("attachments"))) if a]
    if not raw_text and not attachments:
        errors.append("request content missing: provide request.raw_text or at least one attachment/link ref")

    source = source_identity(source_in)
    received_at = clean_string(audit_in.get("received_at") or payload.get("received_at"), now)
    captured_at = clean_string(audit_in.get("captured_at") or payload.get("captured_at"), now)
    if not parse_iso(received_at):
        errors.append("audit.received_at must be ISO-8601 UTC")
    if not parse_iso(captured_at):
        errors.append("audit.captured_at must be ISO-8601 UTC")

    enforced_fields = {
        "schema_version": SCHEMA_VERSION,
        "record_type": RECORD_TYPE,
        "product_line": PRODUCT_LINE,
        "stage": STAGE,
        "tenant": TENANT,
        "purpose": PURPOSE,
    }
    for key, expected in enforced_fields.items():
        supplied = payload.get(key)
        if supplied not in (None, "", expected):
            errors.append(f"{key} must be {expected}")

    idem_in = payload.get("idempotency") if isinstance(payload.get("idempotency"), dict) else {}
    supplied_key = payload.get("idempotency_key") or idem_in.get("key")
    if supplied_key not in (None, "", IDEMPOTENCY_KEY):
        errors.append(f"idempotency.key must be {IDEMPOTENCY_KEY}")

    h = content_sha256(raw_text, attachments, source)
    submitter = {
        "name": clean_string(submitter_in.get("name"), "unknown"),
        "contact_channel": clean_string(submitter_in.get("contact_channel"), "unknown"),
        "contact_handle": submitter_in.get("contact_handle"),
        "company": submitter_in.get("company"),
        "role": clean_string(submitter_in.get("role"), "unknown"),
        "decision_owner_known": clean_string(submitter_in.get("decision_owner_known"), "unknown"),
    }
    fingerprint = make_fingerprint(source, received_at, captured_at, h, submitter)
    record_id = make_record_id(fingerprint)

    route = clean_string(classification_in.get("recommended_route"), "unknown")
    if route not in VALID_ROUTES:
        route = "unknown"
    priority = clean_string(classification_in.get("priority"), "untriaged")
    if priority not in VALID_PRIORITIES:
        priority = "untriaged"
    risk = clean_string(classification_in.get("risk_level"), "unknown")
    if risk not in VALID_RISKS:
        risk = "unknown"
    next_action = clean_string(classification_in.get("next_action"), "manual_triage")
    if next_action not in VALID_ACTIONS:
        next_action = "manual_triage"
    requested_status = clean_string(classification_in.get("raw_inbox_status"), "new")
    if requested_status not in VALID_INBOX_STATUSES:
        errors.append("classification.raw_inbox_status must be one of blocked_owner, duplicate, needs_clarification, new, obsolete, qualified")
        requested_status = "needs_clarification"
    owner_gated = (
        clean_string(privacy_in.get("production_access_requested"), "unknown").lower() in OWNER_GATE_VALUES
        or clean_string(privacy_in.get("secrets_or_credentials_present"), "unknown").lower() in OWNER_GATE_VALUES
    )
    raw_inbox_status = "blocked_owner" if owner_gated else requested_status

    record = {
        "id": record_id,
        "schema_version": SCHEMA_VERSION,
        "record_type": RECORD_TYPE,
        "product_line": PRODUCT_LINE,
        "stage": STAGE,
        "tenant": TENANT,
        "purpose": PURPOSE,
        "root_production_card_id": ROOT_PRODUCTION_CARD_ID,
        "source": {
            "board": SOURCE_BOARD,
            "view": SOURCE_VIEW,
            **source,
        },
        "idempotency": {
            "key": IDEMPOTENCY_KEY,
            "fingerprint": fingerprint,
            "content_sha256": h,
            "duplicate_of": None,
            "duplicate_policy": "return_existing_without_child_work",
        },
        "client_or_submitter": submitter,
        "request": {
            "raw_text": raw_text,
            "normalized_summary": clean_string(request_in.get("normalized_summary"), normalize_summary(raw_text, attachments)),
            "business_area": clean_string(request_in.get("business_area"), "unknown"),
            "desired_outcome": request_in.get("desired_outcome"),
            "current_process": request_in.get("current_process"),
            "pain_points": list_value(request_in.get("pain_points")),
            "users_or_roles": list_value(request_in.get("users_or_roles")),
            "systems_involved": list_value(request_in.get("systems_involved")),
            "data_involved": list_value(request_in.get("data_involved")),
            "must_have_features": list_value(request_in.get("must_have_features")),
            "nice_to_have_features": list_value(request_in.get("nice_to_have_features")),
            "constraints": list_value(request_in.get("constraints")),
            "deadline_or_urgency": request_in.get("deadline_or_urgency"),
            "budget_signal": request_in.get("budget_signal"),
            "success_metric": request_in.get("success_metric"),
        },
        "raw_payload": payload,
        "attachments": attachments,
        "classification": {
            "raw_inbox_status": raw_inbox_status if not errors else "invalid",
            "recommended_route": route,
            "priority": priority,
            "risk_level": risk,
            "automation_fit": clean_string(classification_in.get("automation_fit"), "unknown"),
            "next_action": "risk_review" if owner_gated else next_action,
            "owner": clean_string(classification_in.get("owner"), "unassigned"),
            "child_task_id": classification_in.get("child_task_id"),
        },
        "privacy_and_risk": {
            "contains_personal_data": clean_string(privacy_in.get("contains_personal_data"), "unknown"),
            "contains_sensitive_data": clean_string(privacy_in.get("contains_sensitive_data"), "unknown"),
            "regulated_domain": clean_string(privacy_in.get("regulated_domain"), "unknown"),
            "production_access_requested": clean_string(privacy_in.get("production_access_requested"), "unknown"),
            "secrets_or_credentials_present": clean_string(privacy_in.get("secrets_or_credentials_present"), "unknown"),
            "redaction_required": bool(privacy_in.get("redaction_required", False)),
            "retention_class": "lead_intake",
        },
        "audit": {
            "received_at": received_at,
            "captured_at": captured_at,
            "updated_at": now,
            "capture_attempt": int(audit_in.get("capture_attempt") or 1),
            "capture_status": "captured" if not errors else "invalid",
            "source_payload_ref": audit_in.get("source_payload_ref") or f"{DEFAULT_STORE_PATH}#{record_id}",
            "errors": [redact_error(e) for e in errors],
            "events": [
                {"at": now, "kind": "capture_attempt", "status": "captured" if not errors else "invalid"}
            ],
        },
    }
    return (record if not errors else None), errors


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


def load_records(store_path: Path) -> list[dict[str, Any]]:
    if not store_path.exists():
        return []
    records: list[dict[str, Any]] = []
    for line in store_path.read_text(errors="replace").splitlines():
        if not line.strip():
            continue
        try:
            item = json.loads(line)
            if isinstance(item, dict):
                records.append(item)
        except Exception:
            continue
    return records


def write_index(index_path: Path, records: list[dict[str, Any]]) -> None:
    index_path.parent.mkdir(parents=True, exist_ok=True)
    by_fingerprint = {}
    by_content_sha256 = {}
    for r in records:
        idem = r.get("idempotency") if isinstance(r.get("idempotency"), dict) else {}
        if idem.get("fingerprint"):
            by_fingerprint[idem["fingerprint"]] = r.get("id")
        if idem.get("content_sha256"):
            by_content_sha256.setdefault(idem["content_sha256"], []).append(r.get("id"))
    payload = {
        "schema_version": SCHEMA_VERSION,
        "idempotency_key": IDEMPOTENCY_KEY,
        "updated_at": utc_now(),
        "record_count": len(records),
        "by_fingerprint": by_fingerprint,
        "by_content_sha256": by_content_sha256,
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


def rewrite_store(store_path: Path, records: list[dict[str, Any]]) -> None:
    """Atomically rewrite the JSONL store after idempotent audit updates."""
    store_path.parent.mkdir(parents=True, exist_ok=True)
    tmp_fd, tmp_name = tempfile.mkstemp(prefix=store_path.name + ".", dir=str(store_path.parent))
    try:
        with os.fdopen(tmp_fd, "w") as f:
            for record in records:
                f.write(json.dumps(record, ensure_ascii=False, sort_keys=True) + "\n")
        os.replace(tmp_name, store_path)
    finally:
        with contextlib.suppress(FileNotFoundError):
            os.unlink(tmp_name)


def log_event(log_path: Path, event: dict[str, Any]) -> None:
    log_path.parent.mkdir(parents=True, exist_ok=True)
    safe_event = {k: v for k, v in event.items() if k not in {"raw_text", "payload"}}
    with log_path.open("a") as f:
        f.write(json.dumps({"at": utc_now(), **safe_event}, ensure_ascii=False, sort_keys=True) + "\n")


def capture_inbound_request(
    payload: dict[str, Any],
    store_path: Path = DEFAULT_STORE_PATH,
    index_path: Path = DEFAULT_INDEX_PATH,
    log_path: Path = DEFAULT_LOG_PATH,
) -> dict[str, Any]:
    """Validate, normalize, persist, and idempotently return a D3 intake record."""
    record, errors = normalize_payload(payload)
    if errors or record is None:
        log_event(log_path, {"event": "invalid", "status": "invalid", "errors": [redact_error(e) for e in errors]})
        return {"ok": False, "status": "invalid", "errors": [redact_error(e) for e in errors]}

    with locked_store(store_path):
        records = load_records(store_path)
        by_fp = {
            r.get("idempotency", {}).get("fingerprint"): r
            for r in records
            if isinstance(r.get("idempotency"), dict)
        }
        existing = by_fp.get(record["idempotency"]["fingerprint"])
        if existing:
            now = utc_now()
            audit = existing.setdefault("audit", {})
            audit["duplicate_seen_count"] = int(audit.get("duplicate_seen_count") or 0) + 1
            audit["last_duplicate_at"] = now
            events = audit.setdefault("events", [])
            if isinstance(events, list):
                events.append({"at": now, "kind": "duplicate_submission", "status": "duplicate"})
            rewrite_store(store_path, records)
            write_index(index_path, records)
            log_event(log_path, {
                "event": "duplicate",
                "status": "duplicate",
                "record_id": existing.get("id"),
                "duplicate_policy": "return_existing_without_child_work",
            })
            return {
                "ok": True,
                "status": "duplicate",
                "record_id": existing.get("id"),
                "duplicate_of": existing.get("id"),
                "idempotency_key": IDEMPOTENCY_KEY,
                "fingerprint": record["idempotency"]["fingerprint"],
                "record": existing,
            }

        with store_path.open("a") as f:
            f.write(json.dumps(record, ensure_ascii=False, sort_keys=True) + "\n")
        records.append(record)
        write_index(index_path, records)
        log_event(log_path, {"event": "captured", "status": "captured", "record_id": record["id"], "idempotency_key": IDEMPOTENCY_KEY})
        return {
            "ok": True,
            "status": "captured",
            "record_id": record["id"],
            "idempotency_key": IDEMPOTENCY_KEY,
            "fingerprint": record["idempotency"]["fingerprint"],
            "record": record,
        }


def build_inbox_state(store_path: Path = DEFAULT_STORE_PATH, log_path: Path = DEFAULT_LOG_PATH, limit: int = 80) -> dict[str, Any]:
    records = load_records(store_path)
    records.sort(key=lambda r: str(r.get("audit", {}).get("captured_at") or ""), reverse=True)
    counts: dict[str, int] = {}
    for r in records:
        st = str(r.get("classification", {}).get("raw_inbox_status") or r.get("audit", {}).get("capture_status") or "unknown")
        counts[st] = counts.get(st, 0) + 1
    return {
        "schema_version": SCHEMA_VERSION,
        "source_of_truth": str(store_path),
        "idempotency_key": IDEMPOTENCY_KEY,
        "product_line": PRODUCT_LINE,
        "stage": STAGE,
        "tenant": TENANT,
        "purpose": PURPOSE,
        "source_board": SOURCE_BOARD,
        "source_view": SOURCE_VIEW,
        "root_production_card_id": ROOT_PRODUCTION_CARD_ID,
        "record_count": len(records),
        "counts": counts,
        "store": {"path": str(store_path), "exists": store_path.exists(), "size": store_path.stat().st_size if store_path.exists() else 0},
        "log": {"path": str(log_path), "exists": log_path.exists(), "size": log_path.stat().st_size if log_path.exists() else 0},
        "latest_records": records[:limit],
        "safety": {
            "production_card_archival_allowed": False,
            "production_card_preserved": True,
            "child_task_creation_on_duplicate": False,
        },
    }


def main() -> int:
    parser = argparse.ArgumentParser(description="Capture a D3 inbound request into the raw requirements inbox")
    parser.add_argument("--input-json", help="Path to JSON payload, or '-' for stdin")
    parser.add_argument("--raw-text", help="Raw inbound text for quick manual/API smoke capture")
    parser.add_argument("--platform", default="manual")
    parser.add_argument("--channel-or-form", default="manual")
    parser.add_argument("--external-message-id")
    parser.add_argument("--external-thread-id")
    parser.add_argument("--submitter-name", default="unknown")
    parser.add_argument("--contact-channel", default="unknown")
    parser.add_argument("--store-path", default=str(DEFAULT_STORE_PATH))
    parser.add_argument("--index-path", default=str(DEFAULT_INDEX_PATH))
    parser.add_argument("--log-path", default=str(DEFAULT_LOG_PATH))
    parser.add_argument("--state", action="store_true", help="Print inbox state instead of capturing")
    args = parser.parse_args()

    store_path = Path(args.store_path)
    index_path = Path(args.index_path)
    log_path = Path(args.log_path)
    if args.state:
        print(json.dumps(build_inbox_state(store_path, log_path), ensure_ascii=False, indent=2))
        return 0

    if args.input_json:
        text = Path(args.input_json).read_text() if args.input_json != "-" else os.sys.stdin.read()
        payload = json.loads(text)
    else:
        payload = {
            "source": {
                "platform": args.platform,
                "channel_or_form": args.channel_or_form,
                "external_message_id": args.external_message_id,
                "external_thread_id": args.external_thread_id,
                "captured_by": "cli",
            },
            "client_or_submitter": {"name": args.submitter_name, "contact_channel": args.contact_channel},
            "request": {"raw_text": args.raw_text or ""},
        }
    result = capture_inbound_request(payload, store_path=store_path, index_path=index_path, log_path=log_path)
    print(json.dumps(result, ensure_ascii=False, indent=2))
    return 0 if result.get("ok") else 2


if __name__ == "__main__":
    raise SystemExit(main())
