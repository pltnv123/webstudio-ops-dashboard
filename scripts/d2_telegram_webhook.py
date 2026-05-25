#!/usr/bin/env python3
"""Telegram webhook capture backend for WebStudio D2 intake.

Receives Telegram Bot API webhook updates, validates them, normalizes inbound
messages into raw intake events, and persists them to a local append-only JSONL
store with an idempotency index. This module does not call Telegram, create
Kanban tasks, or write production databases.
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
from http import HTTPStatus
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from typing import Any
from urllib.parse import urlparse

WORKSPACE = Path(os.environ.get("WORKSPACE", "/workspace"))
DEFAULT_STORE_PATH = WORKSPACE / "data" / "webstudio" / "d2" / "telegram-intake-events.jsonl"
DEFAULT_INDEX_PATH = WORKSPACE / "data" / "webstudio" / "d2" / "telegram-intake-index.json"
DEFAULT_LOG_PATH = WORKSPACE / "runtime" / "webstudio-d2-telegram-webhook.log"

SCHEMA_VERSION = "2026-05-21.d2-telegram-intake-webhook.v1"
RECORD_TYPE = "raw_intake_event"
PRODUCT_LINE = "D2"
STAGE = "intake"
SOURCE = "telegram"
TENANT = "webstudio-production"
IDEMPOTENCY_KEY = "webstudio:D2:intake"
CAPTURED_BY = "ai-intake-bot"
WEBHOOK_PATH = "/webhooks/telegram/d2-intake"
MAX_BODY_BYTES = 1024 * 1024

MESSAGE_FIELDS = (
    "message",
    "edited_message",
    "channel_post",
    "edited_channel_post",
    "business_message",
    "edited_business_message",
)
MEDIA_FIELDS = (
    "photo",
    "document",
    "voice",
    "audio",
    "video",
    "video_note",
    "animation",
    "sticker",
)


def utc_now() -> str:
    return datetime.now(timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z")


def from_unix_utc(value: Any) -> str | None:
    try:
        return datetime.fromtimestamp(int(value), tz=timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z")
    except Exception:
        return None


def sha256_text(value: str) -> str:
    return hashlib.sha256(value.encode("utf-8")).hexdigest()


def stable_json(value: Any) -> str:
    return json.dumps(value, ensure_ascii=False, sort_keys=True, separators=(",", ":"))


def clean_string(value: Any, default: str = "") -> str:
    if value is None:
        return default
    text = str(value).strip()
    return text if text else default


def hash_identifier(value: Any) -> str | None:
    text = clean_string(value)
    if not text:
        return None
    return "sha256:" + sha256_text(text)[:16]


def safe_error(message: str) -> str:
    text = str(message)
    for marker in ["token", "secret", "api_key", "raw_text", "text", "caption"]:
        text = text.replace(marker, f"{marker[:3]}…")
    return text[:500]


def pick_message(update: dict[str, Any]) -> tuple[str | None, dict[str, Any] | None, dict[str, Any] | None]:
    for field in MESSAGE_FIELDS:
        message = update.get(field)
        if isinstance(message, dict):
            return field, message, None
    callback = update.get("callback_query")
    if isinstance(callback, dict):
        message = callback.get("message") if isinstance(callback.get("message"), dict) else {}
        return "callback_query", message, callback
    return None, None, None


def normalize_user(user: dict[str, Any] | None) -> dict[str, Any]:
    user = user if isinstance(user, dict) else {}
    return {
        "id": clean_string(user.get("id")) or None,
        "is_bot": bool(user.get("is_bot", False)),
        "username": clean_string(user.get("username")) or None,
        "first_name": clean_string(user.get("first_name")) or None,
        "last_name": clean_string(user.get("last_name")) or None,
        "language_code": clean_string(user.get("language_code")) or None,
    }


def normalize_chat(chat: dict[str, Any] | None) -> dict[str, Any]:
    chat = chat if isinstance(chat, dict) else {}
    return {
        "id": clean_string(chat.get("id")) or None,
        "type": clean_string(chat.get("type"), "unknown"),
        "title": clean_string(chat.get("title")) or None,
        "username": clean_string(chat.get("username")) or None,
    }


def normalize_photo(items: Any) -> list[dict[str, Any]]:
    if not isinstance(items, list):
        return []
    out = []
    for item in items:
        if not isinstance(item, dict):
            continue
        out.append({
            "type": "photo",
            "file_id": clean_string(item.get("file_id")) or None,
            "file_unique_id": clean_string(item.get("file_unique_id")) or None,
            "width": int(item.get("width") or 0),
            "height": int(item.get("height") or 0),
            "file_size": int(item.get("file_size") or 0),
            "storage_status": "metadata_only_not_downloaded",
        })
    return out


def normalize_single_media(kind: str, item: Any) -> dict[str, Any] | None:
    if not isinstance(item, dict):
        return None
    normalized = {
        "type": kind,
        "file_id": clean_string(item.get("file_id")) or None,
        "file_unique_id": clean_string(item.get("file_unique_id")) or None,
        "file_name": clean_string(item.get("file_name")) or None,
        "mime_type": clean_string(item.get("mime_type")) or None,
        "file_size": int(item.get("file_size") or 0),
        "duration": int(item.get("duration") or 0),
        "width": int(item.get("width") or 0),
        "height": int(item.get("height") or 0),
        "storage_status": "metadata_only_not_downloaded",
    }
    return {k: v for k, v in normalized.items() if v not in (None, "", 0) or k in {"type", "storage_status"}}


def normalize_attachments(message: dict[str, Any]) -> list[dict[str, Any]]:
    attachments: list[dict[str, Any]] = []
    attachments.extend(normalize_photo(message.get("photo")))
    for kind in MEDIA_FIELDS:
        if kind == "photo":
            continue
        item = normalize_single_media(kind, message.get(kind))
        if item:
            attachments.append(item)
    return attachments


def extract_text(message: dict[str, Any], callback: dict[str, Any] | None) -> tuple[str, str]:
    if callback:
        data = clean_string(callback.get("data"))
        if data:
            return data, "callback_data"
    text = clean_string(message.get("text"))
    if text:
        return text, "text"
    caption = clean_string(message.get("caption"))
    if caption:
        return caption, "caption"
    return "", "none"


def normalize_summary(raw_text: str, attachments: list[dict[str, Any]], update_id: str) -> str:
    clean = " ".join(raw_text.split())
    if clean:
        return clean[:220] + ("…" if len(clean) > 220 else "")
    if attachments:
        return f"Telegram attachment-only D2 intake update {update_id} ({len(attachments)} attachment metadata item(s))"
    return f"Telegram D2 intake update {update_id} without message content"


def make_fingerprint(update_id: str | None, chat_id: str | None, thread_id: str | None, message_id: str | None, raw_text: str, attachments: list[dict[str, Any]]) -> str:
    if update_id:
        return f"{IDEMPOTENCY_KEY}:telegram:update:{update_id}"
    material = {
        "chat_id": chat_id,
        "thread_id": thread_id,
        "message_id": message_id,
        "text_prefix": " ".join(raw_text.split())[:500],
        "attachments": [{"type": a.get("type"), "file_unique_id": a.get("file_unique_id"), "file_id": a.get("file_id")} for a in attachments],
    }
    return f"{IDEMPOTENCY_KEY}:telegram:message:{sha256_text(stable_json(material))}"


def make_record_id(fingerprint: str) -> str:
    return "d2tg_" + sha256_text(fingerprint)[:20]


def normalize_telegram_update(update: dict[str, Any]) -> tuple[dict[str, Any] | None, list[str]]:
    errors: list[str] = []
    now = utc_now()
    if not isinstance(update, dict):
        return None, ["request body must be a JSON object"]

    update_id = clean_string(update.get("update_id"))
    if not update_id:
        errors.append("Telegram update_id is required")

    update_type, message, callback = pick_message(update)
    if message is None:
        errors.append("Telegram update must include message, channel_post, edited message, business_message, or callback_query.message")
        message = {}

    sender = normalize_user(callback.get("from") if callback else message.get("from"))
    chat = normalize_chat(message.get("chat"))
    message_id = clean_string(message.get("message_id")) or clean_string(callback.get("message", {}).get("message_id") if callback else "") or None
    thread_id = clean_string(message.get("message_thread_id")) or None
    raw_text, text_source = extract_text(message, callback)
    attachments = normalize_attachments(message)
    if not raw_text and not attachments:
        errors.append("Telegram message content missing: provide text, caption, callback data, or supported attachment metadata")

    message_date = from_unix_utc(message.get("date")) or now
    fingerprint = make_fingerprint(update_id or None, chat.get("id"), thread_id, message_id, raw_text, attachments)
    content_hash = sha256_text(stable_json({
        "update_id": update_id,
        "chat_id": chat.get("id"),
        "thread_id": thread_id,
        "message_id": message_id,
        "raw_text": raw_text,
        "attachments": attachments,
    }))
    record_id = make_record_id(fingerprint)

    record = {
        "id": record_id,
        "schema_version": SCHEMA_VERSION,
        "record_type": RECORD_TYPE,
        "tenant": TENANT,
        "product_line": PRODUCT_LINE,
        "stage": STAGE,
        "source": {
            "platform": SOURCE,
            "channel_or_form": chat.get("type") or "unknown",
            "update_type": update_type or "unknown",
            "telegram_update_id": update_id or None,
            "telegram_message_id": message_id,
            "telegram_thread_id": thread_id,
            "chat": chat,
            "sender": sender,
            "callback_query_id": clean_string(callback.get("id")) if callback else None,
        },
        "request": {
            "raw_text": raw_text,
            "text_source": text_source,
            "normalized_summary": normalize_summary(raw_text, attachments, update_id or "unknown"),
            "attachments": attachments,
        },
        "classification": {
            "priority": "untriaged",
            "risk_level": "unknown",
            "owner": "unassigned",
            "state": "new",
        },
        "idempotency": {
            "key": IDEMPOTENCY_KEY,
            "fingerprint": fingerprint,
            "content_sha256": content_hash,
            "duplicate_of": None,
            "duplicate_policy": "return_existing_without_second_write",
        },
        "audit": {
            "received_at": now,
            "message_at": message_date,
            "created_by": CAPTURED_BY,
            "capture_status": "captured" if not errors else "invalid",
            "errors": [safe_error(e) for e in errors],
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
    by_fingerprint: dict[str, str] = {}
    by_update_id: dict[str, str] = {}
    for record in records:
        idem = record.get("idempotency") if isinstance(record.get("idempotency"), dict) else {}
        source = record.get("source") if isinstance(record.get("source"), dict) else {}
        if idem.get("fingerprint"):
            by_fingerprint[str(idem["fingerprint"])] = str(record.get("id"))
        if source.get("telegram_update_id"):
            by_update_id[str(source["telegram_update_id"])] = str(record.get("id"))
    payload = {
        "schema_version": SCHEMA_VERSION,
        "idempotency_key": IDEMPOTENCY_KEY,
        "updated_at": utc_now(),
        "record_count": len(records),
        "by_fingerprint": by_fingerprint,
        "by_update_id": by_update_id,
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


def log_event(log_path: Path, event: dict[str, Any]) -> None:
    log_path.parent.mkdir(parents=True, exist_ok=True)
    safe = {k: v for k, v in event.items() if k not in {"payload", "raw_text", "text", "caption", "chat_id", "user_id"}}
    if "telegram_update_id" in safe:
        safe["telegram_update_id_hash"] = hash_identifier(safe.pop("telegram_update_id"))
    if "telegram_message_id" in safe:
        safe["telegram_message_id_hash"] = hash_identifier(safe.pop("telegram_message_id"))
    with log_path.open("a") as f:
        f.write(json.dumps({"at": utc_now(), **safe}, ensure_ascii=False, sort_keys=True) + "\n")


def capture_telegram_update(
    update: dict[str, Any],
    store_path: Path = DEFAULT_STORE_PATH,
    index_path: Path = DEFAULT_INDEX_PATH,
    log_path: Path = DEFAULT_LOG_PATH,
) -> dict[str, Any]:
    record, errors = normalize_telegram_update(update)
    if errors or record is None:
        log_event(log_path, {"event": "invalid", "status": "invalid", "errors": [safe_error(e) for e in errors]})
        return {"ok": False, "status": "invalid", "errors": [safe_error(e) for e in errors]}

    with locked_store(store_path):
        records = load_records(store_path)
        by_fp = {
            r.get("idempotency", {}).get("fingerprint"): r
            for r in records
            if isinstance(r.get("idempotency"), dict)
        }
        existing = by_fp.get(record["idempotency"]["fingerprint"])
        if existing:
            existing_id = existing.get("id")
            log_event(log_path, {
                "event": "duplicate",
                "status": "duplicate",
                "record_id": existing_id,
                "telegram_update_id": record["source"].get("telegram_update_id"),
                "telegram_message_id": record["source"].get("telegram_message_id"),
                "duplicate_policy": "return_existing_without_second_write",
            })
            return {
                "ok": True,
                "status": "duplicate",
                "record_id": existing_id,
                "duplicate_of": existing_id,
                "idempotency_key": IDEMPOTENCY_KEY,
                "fingerprint": record["idempotency"]["fingerprint"],
                "record": existing,
            }

        with store_path.open("a") as f:
            f.write(json.dumps(record, ensure_ascii=False, sort_keys=True) + "\n")
        records.append(record)
        write_index(index_path, records)
        log_event(log_path, {
            "event": "captured",
            "status": "captured",
            "record_id": record["id"],
            "idempotency_key": IDEMPOTENCY_KEY,
            "telegram_update_id": record["source"].get("telegram_update_id"),
            "telegram_message_id": record["source"].get("telegram_message_id"),
        })
        return {
            "ok": True,
            "status": "captured",
            "record_id": record["id"],
            "idempotency_key": IDEMPOTENCY_KEY,
            "fingerprint": record["idempotency"]["fingerprint"],
            "record": record,
        }


def webhook_response(
    body: bytes,
    store_path: Path = DEFAULT_STORE_PATH,
    index_path: Path = DEFAULT_INDEX_PATH,
    log_path: Path = DEFAULT_LOG_PATH,
) -> tuple[int, dict[str, Any]]:
    if len(body) > MAX_BODY_BYTES:
        return HTTPStatus.REQUEST_ENTITY_TOO_LARGE, {"ok": False, "status": "invalid", "errors": ["request body too large"]}
    try:
        payload = json.loads(body.decode("utf-8"))
    except Exception:
        log_event(log_path, {"event": "invalid_json", "status": "invalid"})
        return HTTPStatus.BAD_REQUEST, {"ok": False, "status": "invalid", "errors": ["request body must be valid JSON"]}
    if not isinstance(payload, dict):
        return HTTPStatus.BAD_REQUEST, {"ok": False, "status": "invalid", "errors": ["request body must be a JSON object"]}
    result = capture_telegram_update(payload, store_path=store_path, index_path=index_path, log_path=log_path)
    status = HTTPStatus.OK if result.get("ok") else HTTPStatus.BAD_REQUEST
    return status, result


class TelegramWebhookHandler(BaseHTTPRequestHandler):
    store_path = DEFAULT_STORE_PATH
    index_path = DEFAULT_INDEX_PATH
    log_path = DEFAULT_LOG_PATH

    def do_POST(self) -> None:  # noqa: N802 - stdlib handler API
        if urlparse(self.path).path != WEBHOOK_PATH:
            self._send_json(HTTPStatus.NOT_FOUND, {"ok": False, "status": "not_found", "errors": ["unknown endpoint"]})
            return
        try:
            length = int(self.headers.get("content-length") or "0")
        except ValueError:
            self._send_json(HTTPStatus.BAD_REQUEST, {"ok": False, "status": "invalid", "errors": ["invalid content-length"]})
            return
        body = self.rfile.read(min(length, MAX_BODY_BYTES + 1))
        status, payload = webhook_response(body, self.store_path, self.index_path, self.log_path)
        self._send_json(status, payload)

    def log_message(self, fmt: str, *args: Any) -> None:
        log_event(self.log_path, {"event": "http", "status": "request", "message": fmt % args})

    def _send_json(self, status: int, payload: dict[str, Any]) -> None:
        body = json.dumps(payload, ensure_ascii=False, sort_keys=True).encode("utf-8")
        self.send_response(int(status))
        self.send_header("content-type", "application/json; charset=utf-8")
        self.send_header("content-length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)


def build_intake_state(store_path: Path = DEFAULT_STORE_PATH, log_path: Path = DEFAULT_LOG_PATH, limit: int = 80) -> dict[str, Any]:
    records = load_records(store_path)
    records.sort(key=lambda r: str(r.get("audit", {}).get("received_at") or ""), reverse=True)
    return {
        "schema_version": SCHEMA_VERSION,
        "source_of_truth": str(store_path),
        "idempotency_key": IDEMPOTENCY_KEY,
        "product_line": PRODUCT_LINE,
        "stage": STAGE,
        "source": SOURCE,
        "tenant": TENANT,
        "record_count": len(records),
        "store": {"path": str(store_path), "exists": store_path.exists(), "size": store_path.stat().st_size if store_path.exists() else 0},
        "log": {"path": str(log_path), "exists": log_path.exists(), "size": log_path.stat().st_size if log_path.exists() else 0},
        "latest_records": records[:limit],
        "safety": {
            "telegram_files_downloaded": False,
            "production_db_writes": False,
            "kanban_mutation": False,
            "duplicate_second_write": False,
        },
    }


def main() -> int:
    parser = argparse.ArgumentParser(description="Capture Telegram Bot API webhook updates into the D2 raw intake event store")
    parser.add_argument("--input-json", help="Path to Telegram update JSON, or '-' for stdin")
    parser.add_argument("--store-path", default=str(DEFAULT_STORE_PATH))
    parser.add_argument("--index-path", default=str(DEFAULT_INDEX_PATH))
    parser.add_argument("--log-path", default=str(DEFAULT_LOG_PATH))
    parser.add_argument("--state", action="store_true", help="Print current D2 intake state")
    parser.add_argument("--serve", action="store_true", help=f"Run HTTP endpoint at {WEBHOOK_PATH}")
    parser.add_argument("--host", default="127.0.0.1")
    parser.add_argument("--port", type=int, default=8087)
    args = parser.parse_args()

    store_path = Path(args.store_path)
    index_path = Path(args.index_path)
    log_path = Path(args.log_path)

    if args.state:
        print(json.dumps(build_intake_state(store_path, log_path), ensure_ascii=False, indent=2))
        return 0
    if args.serve:
        handler = type("ConfiguredTelegramWebhookHandler", (TelegramWebhookHandler,), {
            "store_path": store_path,
            "index_path": index_path,
            "log_path": log_path,
        })
        server = ThreadingHTTPServer((args.host, args.port), handler)
        print(f"D2 Telegram webhook listening on http://{args.host}:{args.port}{WEBHOOK_PATH}")
        server.serve_forever()
        return 0
    if not args.input_json:
        parser.error("--input-json, --state, or --serve is required")
    text = Path(args.input_json).read_text() if args.input_json != "-" else os.sys.stdin.read()
    status, result = webhook_response(text.encode("utf-8"), store_path=store_path, index_path=index_path, log_path=log_path)
    print(json.dumps({"http_status": int(status), **result}, ensure_ascii=False, indent=2))
    return 0 if result.get("ok") else 2


if __name__ == "__main__":
    raise SystemExit(main())
