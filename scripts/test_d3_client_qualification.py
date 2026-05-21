#!/usr/bin/env python3
from __future__ import annotations

import json
import tempfile
from pathlib import Path

from d3_client_qualification import (
    AUTOMATION_KEY,
    PRODUCT_LINE,
    STAGE,
    TENANT,
    build_qualification_state,
    persist_qualification,
)


def assert_true(condition: bool, message: str) -> None:
    if not condition:
        raise AssertionError(message)


def qualified_payload() -> dict:
    return {
        "automation_key": AUTOMATION_KEY,
        "lead_id": "lead-acme-ops-001",
        "received_at": "2026-05-21T09:10:00Z",
        "source": {
            "channel": "telegram",
            "source_ref": "tg-qualification-001",
            "original_request_summary": "ACME wants to automate Telegram requests into statuses, responsible managers and weekly reports.",
        },
        "client_contact": {
            "name": "ACME Ops",
            "company_or_brand": "ACME",
            "contact_channel": "telegram",
            "contact_value": "@acme_ops",
            "language": "ru",
        },
        "operator": {"intake_owner": "operator", "followup_owner": "operator"},
        "business_context": {
            "niche": "B2B services",
            "what_they_sell": "implementation services",
            "target_audience": "operations teams",
        },
        "business_goal": {
            "primary_pain": "manual_process",
            "desired_result": "fewer lost requests and clear owner/status handoff",
            "main_user_action": "receive_status",
        },
        "requested_scope": {
            "requested_format": "automation",
            "first_version_must_have": ["Telegram intake", "status tracking", "manager notifications"],
            "optional_later_items": ["CRM sync"],
        },
        "materials_readiness": {
            "current_process_or_scripts": "ready",
            "copy": "partial",
            "brand_assets": "partial",
            "access_owner": "Ops lead",
        },
        "budget_and_expectations": {
            "budget_range": "premium range possible",
            "accepts_estimate_after_scope": True,
            "price_sensitivity": "flexible",
        },
        "timeline": {
            "target_date": "2026-06-20",
            "deadline_driver": "internal",
            "flexibility": "fixed_but_realistic",
            "ready_to_start_this_week": True,
        },
        "decision_and_ownership": {
            "decision_maker_name_role": "COO",
            "is_decision_maker_involved": True,
            "feedback_owner": "Ops lead",
        },
        "risk_and_constraints": {
            "regulated_domain": "none",
            "personal_or_sensitive_data": "basic_contact",
            "payments_or_accounts": False,
            "production_system_changes": False,
        },
    }


def main() -> int:
    with tempfile.TemporaryDirectory() as td:
        base = Path(td)
        store = base / "qualification.jsonl"
        index = base / "qualification-index.json"
        actions = base / "actions.jsonl"
        log = base / "qualification.log"

        first = persist_qualification(qualified_payload(), store, index, actions, log)
        assert_true(first["ok"] is True, "first run ok")
        assert_true(first["status"] == "processed", "first status processed")
        result = first["result"]
        assert_true(result["automation_key"] == AUTOMATION_KEY, "automation key persisted")
        assert_true(result["product_line"] == PRODUCT_LINE, "product line persisted")
        assert_true(result["stage"] == STAGE, "stage persisted")
        assert_true(result["tenant"] == TENANT, "tenant persisted")
        assert_true(result["classification"]["decision"] == "qualified", "qualified decision")
        assert_true(result["classification"]["route"] == "business_automation", "business automation route")
        assert_true(result["classification"]["score_total"] >= 17, "qualified score threshold")
        assert_true(result["child_card_payload"]["create"] is True, "child payload created")
        assert_true(result["child_card_payload"]["idempotency_key"].startswith(f"{AUTOMATION_KEY}:lead-acme-ops-001:"), "child idempotency derived")
        assert_true(store.read_text().count("\n") == 1, "one result stored")
        assert_true(actions.read_text().count("\n") == 1, "one action queued")

        duplicate = persist_qualification(qualified_payload(), store, index, actions, log)
        assert_true(duplicate["status"] == "duplicate_ignored", "duplicate ignored")
        assert_true(store.read_text().count("\n") == 1, "duplicate did not append result")
        assert_true(actions.read_text().count("\n") == 1, "duplicate did not append action")

        updated_payload = qualified_payload()
        updated_payload["risk_and_constraints"]["production_system_changes"] = True
        updated_payload["risk_and_constraints"]["personal_or_sensitive_data"] = "sensitive"
        updated_payload["decision_and_ownership"]["additional_approvers"] = ["Legal"]
        updated = persist_qualification(updated_payload, store, index, actions, log)
        assert_true(updated["status"] == "updated", "material new facts update result")
        assert_true(updated["result"]["classification"]["requires_operator_review"] is True, "updated requires review")
        assert_true(updated["result"]["child_card_payload"]["type"] == "risk-review", "risk review action type")
        assert_true(store.read_text().count("\n") == 2, "updated appended audit result")
        assert_true(actions.read_text().count("\n") == 2, "risk action queued once")

        missing_identity = qualified_payload()
        missing_identity["source"] = {"channel": "", "source_ref": "", "original_request_summary": ""}
        missing_identity["lead_id"] = ""
        bad = persist_qualification(missing_identity, store, index, actions, log)
        assert_true(bad["result"]["status"] == "needs_manual_intake_fix", "missing identity needs manual fix")
        assert_true(bad["result"]["child_card_payload"]["create"] is True, "manual fix asks followup action")

        hard = qualified_payload()
        hard["lead_id"] = "lead-hard-gate"
        hard["source"]["source_ref"] = "tg-hard-gate"
        hard["source"]["original_request_summary"] = "Need guaranteed sales and exact fixed price tomorrow before any inputs."
        hard["budget_and_expectations"]["price_sensitivity"] = "cheapest_only"
        hard["budget_and_expectations"]["accepts_estimate_after_scope"] = False
        hard_result = persist_qualification(hard, store, index, actions, log)
        assert_true(hard_result["result"]["classification"]["decision"] == "disqualified", "hard gate disqualified")
        assert_true(hard_result["result"]["classification"]["route"] == "decline_not_now", "hard gate decline route")
        assert_true(hard_result["result"]["child_card_payload"]["create"] is False, "no child for decline")

        state = build_qualification_state(store, actions, log)
        assert_true(state["available"] is True, "state available")
        assert_true(state["record_count"] == 4, "state record count")
        assert_true(state["action_count"] == 3, "action count excludes duplicate and decline")
        assert_true(state["safety"]["kanban_mutation_performed"] is False, "no kanban mutation")
        idx = json.loads(index.read_text())
        assert_true(idx["automation_key"] == AUTOMATION_KEY, "index automation key")
        assert_true(idx["safety"]["production_db_write"] is False, "index safety no DB write")

    print("D3 CLIENT QUALIFICATION TEST PASS")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
