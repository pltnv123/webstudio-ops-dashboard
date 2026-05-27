#!/usr/bin/env python3
from __future__ import annotations

import json
import tempfile
from pathlib import Path

from d1_owner_feedback_backend import (
    AUTOMATION_KEY,
    DEFAULT_APP_UNDER_TEST_URL,
    PRODUCT_LINE,
    PRODUCTION_STAGE,
    TENANT,
    apply_owner_decision,
    build_owner_feedback_state,
    create_feedback,
    create_owner_decision,
    generate_scoped_card_payloads,
    list_feedback,
    persist_generated_card_references,
    update_feedback,
)


def assert_true(condition: bool, message: str) -> None:
    if not condition:
        raise AssertionError(message)


def owner_payload(message_id: str = "tg-owner-001", raw_text: str = "Кнопка сохранить на owner admin dashboard не работает после изменения статуса.") -> dict:
    return {
        "source": {
            "source": "telegram_owner",
            "source_owner": "Антон",
            "source_message_id": message_id,
            "chat_id": "-1003836304725",
            "topic_id": "1",
            "captured_by": "telegram-ingestion-test",
        },
        "submitted_by": "Антон",
        "raw_text": raw_text,
        "feedback": {
            "raw_text": raw_text,
            "feedback_type": "bug",
            "affected_area": "admin/dashboard",
        },
    }


def main() -> int:
    with tempfile.TemporaryDirectory() as td:
        base = Path(td)
        store = base / "owner-feedback.jsonl"
        decisions = base / "owner-decisions.jsonl"
        index = base / "owner-index.json"
        log = base / "owner-feedback.log"

        first = create_feedback(owner_payload(), store, decisions, index, log)
        assert_true(first["ok"] is True, "first feedback capture ok")
        assert_true(first["status"] == "created", "first capture status")
        record = first["record"]
        feedback_id = first["feedback_id"]
        assert_true(record["automation_key"] == AUTOMATION_KEY, "automation key persisted")
        assert_true(record["tenant"] == TENANT, "tenant persisted")
        assert_true(record["product_line"] == PRODUCT_LINE, "product line persisted")
        assert_true(record["production_stage"] == PRODUCTION_STAGE, "production stage persisted")
        assert_true(record["app_under_test_url"] == DEFAULT_APP_UNDER_TEST_URL, "app URL default persisted")
        assert_true(record["delivery_lane"] == "D1", "default owner admin feedback routes to D1")
        assert_true(record["triage_state"] == "raw", "new non-ambiguous feedback starts raw")
        assert_true(record["source_message_id"] == "tg-owner-001", "source message id persisted")
        assert_true(store.read_text().count("\n") == 1, "one canonical feedback record")

        duplicate = create_feedback(owner_payload(), store, decisions, index, log)
        assert_true(duplicate["status"] == "duplicate", "duplicate status")
        assert_true(duplicate["feedback_id"] == feedback_id, "duplicate returns same feedback id")
        assert_true(store.read_text().count("\n") == 1, "duplicate does not append")
        assert_true(json.loads(store.read_text().splitlines()[0])["audit"]["duplicate_seen_count"] == 1, "duplicate audit persisted")

        d2 = create_feedback(owner_payload("tg-d2", "Telegram webhook не пишет raw requirements inbox после деплоя."), store, decisions, index, log)
        assert_true(d2["record"]["delivery_lane"] == "D2", "Telegram/deployment feedback routes to D2")
        d3 = create_feedback(owner_payload("tg-d3", "Нужно поменять workflow client lifecycle и acceptance criteria."), store, decisions, index, log)
        assert_true(d3["record"]["delivery_lane"] == "D3", "workflow/spec feedback routes to D3")
        ambiguous = create_feedback(owner_payload("tg-amb", "Не нравится, сделай лучше."), store, decisions, index, log)
        assert_true(ambiguous["record"]["delivery_lane"] == "owner_decision_required", "ambiguous feedback enters decision lane")
        assert_true(ambiguous["record"]["triage_state"] == "owner_decision_pending", "ambiguous feedback enters owner_decision_pending")

        raw_close = update_feedback(feedback_id, {"triage_state": "closed", "close_reason": "converted_to_cards"}, store_path=store, decision_store_path=decisions, index_path=index, log_path=log)
        assert_true(raw_close["ok"] is False and raw_close["status"] == "invalid_transition", "raw-to-closed is rejected")

        not_ready = generate_scoped_card_payloads(feedback_id, store)
        assert_true(not_ready["ok"] is False and not_ready["status"] == "not_ready", "card payloads require scoping state and acceptance criteria")

        scoped = update_feedback(
            feedback_id,
            {
                "triage_state": "ready_for_scoping",
                "feedback_type": "bug",
                "acceptance_criteria": ["Saving status persists and shows success state", "No console/API error is emitted"],
                "reproduction_steps": ["Open owner admin dashboard", "Change status", "Click save"],
                "expected_behavior": "Status is saved",
                "actual_behavior": "Save action fails",
            },
            store_path=store,
            decision_store_path=decisions,
            index_path=index,
            log_path=log,
        )
        assert_true(scoped["ok"] is True, "triage update ok")
        payloads = generate_scoped_card_payloads(feedback_id, store)
        assert_true(payloads["ok"] is True, "card payloads generated")
        impl = payloads["card_payloads"]["implementation"]
        qa = payloads["card_payloads"]["qa"]
        assert_true(impl["title"].startswith("[D1][owner-feedback]"), "implementation title format")
        assert_true(qa["title"].startswith("[QA][D1][owner-feedback]"), "QA title format")
        assert_true(impl["initial_status"] == "todo" and qa["initial_status"] == "todo", "payloads never initialize Done")
        assert_true("Feedback id:" in impl["body"] and "Acceptance criteria:" in impl["body"], "implementation payload has required context")
        refs = persist_generated_card_references(feedback_id, payloads["card_payloads"], store_path=store, decision_store_path=decisions, index_path=index, log_path=log)
        assert_true(refs["record"]["triage_state"] == "scoped_to_kanban", "generated refs move item to scoped_to_kanban, not Done")
        assert_true(refs["record"]["generated_card_references"][0]["initial_status"] == "todo", "generated refs preserve todo initial status")

        bad_close = update_feedback(
            feedback_id,
            {"triage_state": "closed", "close_reason": "converted_to_cards", "linked_card_statuses": {"impl": "running", "qa": "todo"}},
            store_path=store,
            decision_store_path=decisions,
            index_path=index,
            log_path=log,
        )
        assert_true(bad_close["ok"] is False, "close with non-terminal linked cards rejected")

        dec = create_owner_decision(ambiguous["feedback_id"], "Куда маршрутизировать эту обратную связь?", actor="triage-test", store_path=store, decision_store_path=decisions, index_path=index, log_path=log)
        assert_true(dec["ok"] is True and dec["status"] == "queued", "owner decision queued")
        applied = apply_owner_decision(dec["decision_id"], "В D1", "Route to D1", target_lane="D1", store_path=store, decision_store_path=decisions, index_path=index, log_path=log)
        assert_true(applied["ok"] is True and applied["feedback"]["delivery_lane"] == "D1", "owner decision reroutes feedback")
        assert_true(applied["feedback"]["triage_state"] == "ready_for_scoping", "owner answer makes item ready_for_scoping")

        listed = list_feedback({"delivery_lane": "D1"}, store)
        assert_true(any(x["id"] == feedback_id for x in listed), "list/filter by lane returns D1 feedback")
        state = build_owner_feedback_state(store, decisions, log)
        assert_true(state["available"] is True, "state available")
        assert_true(state["feedback_count"] == 4, "state feedback count")
        assert_true(state["decision_count"] == 1, "state decision count")
        assert_true(state["safety"]["done_initialization_allowed"] is False, "state exposes Done pollution guard")
        idx = json.loads(index.read_text())
        assert_true(idx["feedback_count"] == 4, "index feedback count")
        assert_true(idx["safety"]["kanban_mutation_performed"] is False, "index says no Kanban mutation")

    print("D1 OWNER FEEDBACK BACKEND TEST PASS")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
