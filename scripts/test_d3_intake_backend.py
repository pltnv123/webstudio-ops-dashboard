#!/usr/bin/env python3
from __future__ import annotations

import json
import tempfile
from pathlib import Path

from d3_intake_backend import (
    IDEMPOTENCY_KEY,
    PRODUCT_LINE,
    ROOT_PRODUCTION_CARD_ID,
    STAGE,
    TENANT,
    build_inbox_state,
    capture_inbound_request,
)


def assert_true(condition: bool, message: str) -> None:
    if not condition:
        raise AssertionError(message)


def sample_payload() -> dict:
    return {
        "source": {
            "platform": "telegram",
            "channel_or_form": "ops-topic-17",
            "external_message_id": "tg-9001",
            "external_thread_id": "17",
            "captured_by": "bot",
        },
        "client_or_submitter": {
            "name": "ACME Ops",
            "contact_channel": "telegram",
            "contact_handle": "@acme_ops",
            "decision_owner_known": "unknown",
        },
        "request": {
            "raw_text": "Нужно автоматизировать заявки из Telegram в таблицу и статусы менеджерам.",
            "systems_involved": ["Telegram", "Google Sheets"],
            "business_area": "operations",
        },
        "classification": {
            "recommended_route": "business_automation",
            "priority": "untriaged",
            "risk_level": "unknown",
            "next_action": "manual_triage",
        },
    }


def main() -> int:
    with tempfile.TemporaryDirectory() as td:
        base = Path(td)
        store = base / "inbox.jsonl"
        index = base / "index.json"
        log = base / "capture.log"

        first = capture_inbound_request(sample_payload(), store, index, log)
        assert_true(first["ok"] is True, "first capture must be ok")
        assert_true(first["status"] == "captured", "first capture status")
        record = first["record"]
        assert_true(record["product_line"] == PRODUCT_LINE, "product line enforced")
        assert_true(record["stage"] == STAGE, "stage enforced")
        assert_true(record["tenant"] == TENANT, "tenant enforced")
        assert_true(record["idempotency"]["key"] == IDEMPOTENCY_KEY, "idempotency key enforced")
        assert_true(record["source"]["board"] == "webstudio-production", "source board persisted")
        assert_true(record["source"]["view"] == "raw_requirements_inbox", "source view persisted")
        assert_true(record["root_production_card_id"] == ROOT_PRODUCTION_CARD_ID, "root production card referenced")
        assert_true(record["request"]["raw_text"] == sample_payload()["request"]["raw_text"], "raw text preserved exactly")
        assert_true(record["raw_payload"] == sample_payload(), "raw source payload preserved exactly")
        assert_true(store.read_text().count("\n") == 1, "one canonical record after first capture")

        duplicate = capture_inbound_request(sample_payload(), store, index, log)
        assert_true(duplicate["ok"] is True, "duplicate returns success")
        assert_true(duplicate["status"] == "duplicate", "duplicate status")
        assert_true(duplicate["record_id"] == first["record_id"], "duplicate returns existing record id")
        assert_true(store.read_text().count("\n") == 1, "duplicate did not append canonical record")
        assert_true("duplicate" in log.read_text(), "duplicate logged")
        updated_record = json.loads(store.read_text().splitlines()[0])
        assert_true(updated_record["audit"]["duplicate_seen_count"] == 1, "duplicate count persisted on canonical record")
        assert_true(updated_record["audit"]["last_duplicate_at"], "duplicate timestamp persisted on canonical record")
        assert_true(updated_record["audit"]["events"][-1]["kind"] == "duplicate_submission", "duplicate audit event appended")

        qualified = sample_payload()
        qualified["source"]["external_message_id"] = "tg-9001-qualified"
        qualified["classification"]["raw_inbox_status"] = "qualified"
        qualified_result = capture_inbound_request(qualified, store, index, log)
        assert_true(qualified_result["record"]["classification"]["raw_inbox_status"] == "qualified", "valid supplied inbox status is preserved")

        blocked = sample_payload()
        blocked["source"]["external_message_id"] = "tg-9001-blocked"
        blocked["privacy_and_risk"] = {"production_access_requested": "yes", "secrets_or_credentials_present": "yes"}
        blocked_result = capture_inbound_request(blocked, store, index, log)
        assert_true(blocked_result["record"]["classification"]["raw_inbox_status"] == "blocked_owner", "owner-gated access/secrets are blocked_owner")

        attachment_only = sample_payload()
        attachment_only["source"]["external_message_id"] = "tg-9002"
        attachment_only["request"]["raw_text"] = ""
        attachment_only["attachments"] = [{"type": "link", "source_file_ref": "https://example.invalid/workflow", "storage_status": "not_stored"}]
        attached = capture_inbound_request(attachment_only, store, index, log)
        assert_true(attached["ok"] is True and attached["status"] == "captured", "attachment-only request captured")

        bad = capture_inbound_request({"request": {"raw_text": ""}}, store, index, log)
        assert_true(bad["ok"] is False, "invalid request rejected")
        assert_true(bad["status"] == "invalid", "invalid status")

        state = build_inbox_state(store, log)
        assert_true(state["record_count"] == 4, "state sees four canonical records")
        assert_true(state["counts"]["qualified"] == 1, "state exposes qualified inbox status")
        assert_true(state["counts"]["blocked_owner"] == 1, "state exposes blocked_owner inbox status")
        assert_true(state["safety"]["production_card_preserved"] is True, "production card preserved flag")
        assert_true(state["safety"]["child_task_creation_on_duplicate"] is False, "no duplicate child tasks flag")
        assert_true(index.exists(), "idempotency index written")
        idx = json.loads(index.read_text())
        assert_true(idx["record_count"] == 4, "index record count")

    print("D3 INTAKE BACKEND TEST PASS")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
