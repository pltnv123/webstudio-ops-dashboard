#!/usr/bin/env python3
from __future__ import annotations

import json
import tempfile
from pathlib import Path

from d2_telegram_webhook import (
    IDEMPOTENCY_KEY,
    PRODUCT_LINE,
    SOURCE,
    STAGE,
    build_intake_state,
    capture_telegram_update,
    webhook_response,
)


def assert_true(condition: bool, message: str) -> None:
    if not condition:
        raise AssertionError(message)


def sample_text_update() -> dict:
    return {
        "update_id": 700001,
        "message": {
            "message_id": 42,
            "message_thread_id": 17,
            "date": 1779364000,
            "from": {
                "id": 123456789,
                "is_bot": False,
                "username": "client_ops",
                "first_name": "Client",
                "language_code": "ru",
            },
            "chat": {
                "id": -1003836304725,
                "type": "supergroup",
                "title": "WebStudio",
            },
            "text": "Нужен Telegram intake бот: принять заявку, задать вопросы, сохранить бриф.",
        },
    }


def sample_photo_update() -> dict:
    return {
        "update_id": 700002,
        "message": {
            "message_id": 43,
            "date": 1779364100,
            "from": {"id": 123456789, "is_bot": False, "username": "client_ops"},
            "chat": {"id": -1003836304725, "type": "supergroup"},
            "caption": "Вот текущий бриф и скрин процесса",
            "photo": [
                {"file_id": "photo-small", "file_unique_id": "p1", "width": 90, "height": 90, "file_size": 1000},
                {"file_id": "photo-large", "file_unique_id": "p2", "width": 1280, "height": 720, "file_size": 120000},
            ],
            "document": {
                "file_id": "doc-1",
                "file_unique_id": "d1",
                "file_name": "brief.pdf",
                "mime_type": "application/pdf",
                "file_size": 5555,
            },
        },
    }


def sample_callback_update() -> dict:
    return {
        "update_id": 700003,
        "callback_query": {
            "id": "cb-1",
            "from": {"id": 123456789, "is_bot": False, "username": "client_ops"},
            "data": "/brief",
            "message": {
                "message_id": 44,
                "date": 1779364200,
                "chat": {"id": -1003836304725, "type": "supergroup"},
            },
        },
    }


def main() -> int:
    with tempfile.TemporaryDirectory() as td:
        base = Path(td)
        store = base / "telegram-events.jsonl"
        index = base / "telegram-index.json"
        log = base / "telegram.log"

        first = capture_telegram_update(sample_text_update(), store, index, log)
        assert_true(first["ok"] is True, "valid text update accepted")
        assert_true(first["status"] == "captured", "first status captured")
        record = first["record"]
        assert_true(record["product_line"] == PRODUCT_LINE, "product_line D2 enforced")
        assert_true(record["stage"] == STAGE, "stage intake enforced")
        assert_true(record["source"]["platform"] == SOURCE, "source telegram enforced")
        assert_true(record["source"]["telegram_update_id"] == "700001", "telegram update id captured")
        assert_true(record["source"]["telegram_message_id"] == "42", "telegram message id captured")
        assert_true(record["source"]["telegram_thread_id"] == "17", "telegram thread id captured")
        assert_true(record["source"]["chat"]["id"] == "-1003836304725", "chat id captured internally")
        assert_true(record["source"]["sender"]["id"] == "123456789", "sender id captured internally")
        assert_true(record["request"]["raw_text"].startswith("Нужен Telegram intake"), "raw text preserved")
        assert_true(record["idempotency"]["key"] == IDEMPOTENCY_KEY, "idempotency key enforced")
        assert_true(store.read_text().count("\n") == 1, "one canonical record after first capture")

        duplicate = capture_telegram_update(sample_text_update(), store, index, log)
        assert_true(duplicate["ok"] is True, "duplicate accepted idempotently")
        assert_true(duplicate["status"] == "duplicate", "duplicate status")
        assert_true(duplicate["record_id"] == first["record_id"], "duplicate returns existing record")
        assert_true(store.read_text().count("\n") == 1, "duplicate does not append")

        attached = capture_telegram_update(sample_photo_update(), store, index, log)
        assert_true(attached["ok"] is True and attached["status"] == "captured", "attachment update captured")
        attachments = attached["record"]["request"]["attachments"]
        assert_true(len(attachments) == 3, "photo variants plus document metadata captured")
        assert_true(any(a["type"] == "document" and a["file_name"] == "brief.pdf" for a in attachments), "document metadata captured")
        assert_true(all(a["storage_status"] == "metadata_only_not_downloaded" for a in attachments), "attachments are metadata-only")

        callback = capture_telegram_update(sample_callback_update(), store, index, log)
        assert_true(callback["ok"] is True, "callback update captured")
        assert_true(callback["record"]["request"]["raw_text"] == "/brief", "callback data normalized as text")
        assert_true(callback["record"]["request"]["text_source"] == "callback_data", "callback text source")

        bad_status, bad = webhook_response(b'{"message":{"text":"missing update id"}}', store, index, log)
        assert_true(int(bad_status) == 400, "malformed request returns HTTP 400")
        assert_true(bad["ok"] is False and bad["status"] == "invalid", "malformed request returns clear error")

        invalid_json_status, invalid_json = webhook_response(b'{not json', store, index, log)
        assert_true(int(invalid_json_status) == 400, "invalid json returns HTTP 400")
        assert_true(invalid_json["errors"] == ["request body must be valid JSON"], "invalid json error is clear")

        state = build_intake_state(store, log)
        assert_true(state["record_count"] == 3, "state sees three canonical records")
        assert_true(state["safety"]["telegram_files_downloaded"] is False, "no Telegram file downloads")
        assert_true(state["safety"]["production_db_writes"] is False, "no production DB writes")
        assert_true(index.exists(), "idempotency index written")
        idx = json.loads(index.read_text())
        assert_true(idx["record_count"] == 3, "index count")
        assert_true(idx["by_update_id"]["700001"] == first["record_id"], "index maps Telegram update id")

        log_text = log.read_text()
        assert_true("Нужен Telegram intake" not in log_text, "safe log does not include raw text")
        assert_true("-1003836304725" not in log_text, "safe log does not include raw chat id")
        assert_true("123456789" not in log_text, "safe log does not include raw sender id")

    print("D2 TELEGRAM WEBHOOK TEST PASS")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
