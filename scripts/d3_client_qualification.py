#!/usr/bin/env python3
"""File-backed WebStudio D3 client qualification workflow.

Production-safe local workflow for product_line=D3 and
stage=client-qualification. It validates/normalizes a lead, applies hard gates,
scoring, route selection, next-action mapping, and persists an auditable result.

Safety contract:
- no production DB writes;
- no Kanban mutation;
- no messages sent automatically;
- next action is stored as an idempotent action payload for operator review.
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
DEFAULT_RESULT_STORE = WORKSPACE / "data" / "webstudio" / "d3" / "client-qualification-results.jsonl"
DEFAULT_INDEX_PATH = WORKSPACE / "data" / "webstudio" / "d3" / "client-qualification-index.json"
DEFAULT_ACTION_QUEUE = WORKSPACE / "data" / "webstudio" / "d3" / "client-qualification-actions.jsonl"
DEFAULT_LOG_PATH = WORKSPACE / "runtime" / "webstudio-d3-client-qualification.log"

SCHEMA_VERSION = "2026-05-21.d3-client-qualification.v1"
AUTOMATION_KEY = "webstudio:D3:client-qualification"
PRODUCT_LINE = "D3"
STAGE = "client-qualification"
TENANT = "webstudio-production"
SOURCE_BOARD = "webstudio-production"
ROOT_PRODUCTION_CARD_ID = "t_02ca3315"

ROUTES = {"landing_website", "ai_intake_bot", "business_automation", "discovery_first", "decline_not_now"}
DECISIONS = {"qualified", "qualified_with_operator_review", "nurture", "needs_clarification", "disqualified"}
PRIORITIES = {"high", "medium", "low", "decline"}

HARD_GATE_KEYWORDS = [
    "illegal", "нелег", "spam", "спам", "fake proof", "фейк", "guaranteed sales", "гарант",
    "guaranteed leads", "seo ranking", "точная цена", "фиксированная цена", "точный срок",
    "без вводных", "refuses scope", "не буду описывать", "replace expert", "заменить юриста",
    "заменить врача", "невозможный срок", "без согласования", "unauthorized", "манипуляц",
]
REVIEW_DOMAINS = {"medical", "legal", "finance", "education_certification", "employment", "insurance", "other"}
READY_VALUES = {"ready", "partial"}
UNKNOWN_VALUES = {"", "unknown", "unclear", "none", "null", "n/a", "—"}


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


def lower_clean(value: Any, default: str = "unknown") -> str:
    return clean_string(value, default).lower()


def as_list(value: Any) -> list[Any]:
    return value if isinstance(value, list) else []


def is_unknown(value: Any) -> bool:
    return lower_clean(value, "") in UNKNOWN_VALUES


def boolish(value: Any) -> bool | None:
    if isinstance(value, bool):
        return value
    text = lower_clean(value, "unknown")
    if text in {"true", "yes", "y", "1", "да"}:
        return True
    if text in {"false", "no", "n", "0", "нет"}:
        return False
    return None


def summarize(text: str, limit: int = 220) -> str:
    clean = " ".join(str(text or "").split())
    return clean[:limit] + ("…" if len(clean) > limit else "") if clean else "Unknown — pending operator intake fix"


def redact_error(message: str) -> str:
    text = str(message)
    for marker in ["password", "token", "secret", "api_key", "raw_text", "contact_value"]:
        text = text.replace(marker, f"{marker[:3]}…")
    return text[:500]


def text_blob(payload: dict[str, Any]) -> str:
    safe = json.dumps(payload, ensure_ascii=False, sort_keys=True)
    return safe.lower()


def normalize_payload(payload: dict[str, Any]) -> tuple[dict[str, Any], list[str]]:
    errors: list[str] = []
    now = utc_now()
    source_in = payload.get("source") if isinstance(payload.get("source"), dict) else {}
    contact_in = payload.get("client_contact") if isinstance(payload.get("client_contact"), dict) else {}
    operator_in = payload.get("operator") if isinstance(payload.get("operator"), dict) else {}

    lead_id = clean_string(payload.get("lead_id"), "")
    source_channel = lower_clean(source_in.get("channel"), "")
    source_ref = clean_string(source_in.get("source_ref"), "")
    original_summary = clean_string(source_in.get("original_request_summary") or payload.get("original_request_summary"), "")
    received_at = clean_string(payload.get("received_at"), now)
    if received_at != now and not parse_iso(received_at):
        errors.append("received_at must be ISO-8601 UTC")
    if payload.get("automation_key") not in (None, "", AUTOMATION_KEY):
        errors.append(f"automation_key must be {AUTOMATION_KEY}")
    if payload.get("product_line") not in (None, "", PRODUCT_LINE):
        errors.append(f"product_line must be {PRODUCT_LINE}")
    if payload.get("stage") not in (None, "", STAGE):
        errors.append(f"stage must be {STAGE}")

    if not lead_id:
        lead_id = "lead_" + sha256_text(stable_json({
            "source_channel": source_channel,
            "source_ref": source_ref,
            "contact": contact_in.get("contact_value"),
            "summary": summarize(original_summary, 120),
        }))[:16]

    normalized = {
        "automation_key": AUTOMATION_KEY,
        "schema_version": SCHEMA_VERSION,
        "tenant": TENANT,
        "product_line": PRODUCT_LINE,
        "stage": STAGE,
        "lead_id": lead_id,
        "received_at": received_at,
        "source": {
            "channel": source_channel or "unknown",
            "source_ref": source_ref or "unknown",
            "original_request_summary": summarize(original_summary),
        },
        "client_contact": {
            "name": clean_string(contact_in.get("name"), "Unknown — pending contact name"),
            "company_or_brand": clean_string(contact_in.get("company_or_brand"), "Unknown — pending company/brand"),
            "contact_channel": clean_string(contact_in.get("contact_channel"), "unknown"),
            "contact_value": clean_string(contact_in.get("contact_value"), "Unknown — pending contact value"),
            "language": lower_clean(contact_in.get("language"), "ru"),
            "notes": clean_string(contact_in.get("notes"), ""),
        },
        "operator": {
            "intake_owner": clean_string(operator_in.get("intake_owner"), "operator"),
            "followup_owner": clean_string(operator_in.get("followup_owner"), "operator"),
        },
        "business_context": payload.get("business_context") if isinstance(payload.get("business_context"), dict) else {},
        "business_goal": payload.get("business_goal") if isinstance(payload.get("business_goal"), dict) else {},
        "requested_scope": payload.get("requested_scope") if isinstance(payload.get("requested_scope"), dict) else {},
        "materials_readiness": payload.get("materials_readiness") if isinstance(payload.get("materials_readiness"), dict) else {},
        "budget_and_expectations": payload.get("budget_and_expectations") if isinstance(payload.get("budget_and_expectations"), dict) else {},
        "timeline": payload.get("timeline") if isinstance(payload.get("timeline"), dict) else {},
        "decision_and_ownership": payload.get("decision_and_ownership") if isinstance(payload.get("decision_and_ownership"), dict) else {},
        "risk_and_constraints": payload.get("risk_and_constraints") if isinstance(payload.get("risk_and_constraints"), dict) else {},
        "enrichment": payload.get("enrichment") if isinstance(payload.get("enrichment"), dict) else {},
    }
    return normalized, errors


def identity_missing(record: dict[str, Any]) -> list[str]:
    missing = []
    if is_unknown(record.get("lead_id")):
        missing.append("lead_id")
    if is_unknown(record.get("source", {}).get("channel")):
        missing.append("source.channel")
    if is_unknown(record.get("source", {}).get("original_request_summary")) or record.get("source", {}).get("original_request_summary", "").startswith("Unknown"):
        missing.append("source.original_request_summary")
    return missing


def critical_unknowns(record: dict[str, Any]) -> list[str]:
    out = []
    goal = record["business_goal"]
    budget = record["budget_and_expectations"]
    decision = record["decision_and_ownership"]
    timeline = record["timeline"]
    scope = record["requested_scope"]
    risk = record["risk_and_constraints"]
    if is_unknown(goal.get("primary_pain")) and is_unknown(goal.get("desired_result")):
        out.append("primary pain / desired result")
    if is_unknown(budget.get("budget_range")) and boolish(budget.get("accepts_estimate_after_scope")) is None:
        out.append("budget expectations")
    if is_unknown(decision.get("decision_maker_name_role")) and boolish(decision.get("is_decision_maker_involved")) is None and is_unknown(decision.get("feedback_owner")):
        out.append("decision maker / approval owner")
    if is_unknown(timeline.get("target_date")) and is_unknown(timeline.get("flexibility")) and boolish(timeline.get("ready_to_start_this_week")) is None:
        out.append("timeline readiness")
    if is_unknown(scope.get("requested_format")) and not as_list(scope.get("first_version_must_have")):
        out.append("first-version scope")
    if is_unknown(risk.get("regulated_domain")) and is_unknown(risk.get("personal_or_sensitive_data")) and boolish(risk.get("production_system_changes")) is None:
        out.append("risk / sensitive data constraints")
    return out


def hard_gate_triggers(record: dict[str, Any]) -> list[str]:
    blob = text_blob(record)
    flags = []
    if any(k in blob for k in HARD_GATE_KEYWORDS):
        flags.append("unsafe guarantee / illegal / fixed-scope-pressure keyword detected")
    budget = record["budget_and_expectations"]
    timeline = record["timeline"]
    decision = record["decision_and_ownership"]
    risk = record["risk_and_constraints"]
    if lower_clean(budget.get("price_sensitivity")) == "cheapest_only" and boolish(budget.get("accepts_estimate_after_scope")) is False:
        flags.append("cheapest-only buyer refuses scoped estimate")
    if lower_clean(timeline.get("flexibility")) == "impossible":
        flags.append("impossible deadline")
    if boolish(decision.get("is_decision_maker_involved")) is False and "refus" in blob:
        flags.append("no decision/approval owner and refusal signal")
    sensitive = lower_clean(risk.get("personal_or_sensitive_data")) == "sensitive"
    payments = boolish(risk.get("payments_or_accounts")) is True
    production = boolish(risk.get("production_system_changes")) is True
    owner_missing = is_unknown(decision.get("feedback_owner")) and is_unknown(decision.get("decision_maker_name_role"))
    if (sensitive or payments or production) and owner_missing:
        flags.append("sensitive/payment/production handling without responsible owner")
    return flags


def escalation_triggers(record: dict[str, Any]) -> list[str]:
    flags = []
    risk = record["risk_and_constraints"]
    scope = record["requested_scope"]
    decision = record["decision_and_ownership"]
    timeline = record["timeline"]
    domain = lower_clean(risk.get("regulated_domain"))
    if domain in REVIEW_DOMAINS and domain != "none":
        flags.append(f"regulated or approval-sensitive domain: {domain}")
    if lower_clean(risk.get("personal_or_sensitive_data")) == "sensitive":
        flags.append("sensitive personal data in scope")
    if boolish(risk.get("payments_or_accounts")) is True:
        flags.append("payments/accounts in scope")
    if boolish(risk.get("production_system_changes")) is True:
        flags.append("production system changes in scope")
    if as_list(decision.get("additional_approvers")) or "multiple" in lower_clean(decision.get("approval_process"), ""):
        flags.append("multiple or unclear approvers")
    if lower_clean(timeline.get("deadline_driver")) == "event" and lower_clean(timeline.get("flexibility")) != "flexible":
        flags.append("hard external deadline")
    fmt = lower_clean(scope.get("requested_format"))
    must = " ".join(str(x).lower() for x in as_list(scope.get("first_version_must_have")))
    mixed_terms = sum(1 for x in ["website", "site", "сайт", "bot", "бот", "crm", "integration", "automation", "автомат"] if x in (fmt + " " + must))
    if fmt == "mixed" or mixed_terms >= 3:
        flags.append("mixed website/bot/automation/integration scope")
    return flags


def select_route(record: dict[str, Any], hard_gates: list[str], escalations: list[str], unknowns: list[str]) -> str:
    if hard_gates:
        return "decline_not_now"
    goal = record["business_goal"]
    scope = record["requested_scope"]
    pain = lower_clean(goal.get("primary_pain"))
    action = lower_clean(goal.get("main_user_action"))
    fmt = lower_clean(scope.get("requested_format"))
    joined = " ".join([pain, action, fmt, text_blob(scope), text_blob(goal)])
    if escalations or fmt == "mixed" or len(unknowns) >= 2:
        # Keep a very clear single-route lead on its likely route when only unknowns exist;
        # otherwise discovery is safer than guessing.
        if len(unknowns) >= 2:
            return "discovery_first"
        return "discovery_first"
    if any(x in joined for x in ["manual_process", "automation", "integration", "receive_status", "status", "handoff", "ручн", "автомат", "статус"]):
        return "business_automation"
    if any(x in joined for x in ["low_quality_leads", "ai_intake_bot", "answer_brief", "brief", "telegram", "заявк", "бриф", "бот"]):
        return "ai_intake_bot"
    if any(x in joined for x in ["presentation_trust", "landing", "website", "redesign", "submit_request", "book_call", "сайт", "лендинг", "довер"]):
        return "landing_website"
    return "discovery_first"


def score_record(record: dict[str, Any], hard_gates: list[str], escalations: list[str], unknowns: list[str], route: str) -> tuple[dict[str, int], list[str], list[str]]:
    positive: list[str] = []
    risk_flags: list[str] = []
    goal = record["business_goal"]
    scope = record["requested_scope"]
    materials = record["materials_readiness"]
    budget = record["budget_and_expectations"]
    timeline = record["timeline"]
    decision = record["decision_and_ownership"]
    risk = record["risk_and_constraints"]

    if hard_gates:
        return {k: 0 for k in ["business_pain_clarity", "offer_fit", "decision_readiness", "materials_readiness", "budget_expectation_fit", "timeline_readiness", "risk_level"]}, positive, hard_gates[:]

    bp = 0
    if not is_unknown(goal.get("primary_pain")) and not is_unknown(goal.get("desired_result")):
        bp = 3; positive.append("clear business pain and desired result")
    elif not is_unknown(goal.get("primary_pain")) or not is_unknown(goal.get("desired_result")):
        bp = 2; positive.append("business pain is partially clear")
    elif record["source"]["original_request_summary"] and not record["source"]["original_request_summary"].startswith("Unknown"):
        bp = 1

    offer = 3 if route in {"landing_website", "ai_intake_bot", "business_automation"} and not escalations else 2 if route != "decline_not_now" else 0
    if offer >= 2:
        positive.append(f"route candidate: {route}")

    involved = boolish(decision.get("is_decision_maker_involved"))
    if involved is True and not is_unknown(decision.get("feedback_owner")):
        dr = 3; positive.append("decision maker and feedback owner are known")
    elif involved is True or not is_unknown(decision.get("decision_maker_name_role")) or not is_unknown(decision.get("feedback_owner")):
        dr = 2; positive.append("decision path is partially known")
    elif involved is False:
        dr = 0; risk_flags.append("decision maker not involved")
    else:
        dr = 1

    ready_count = sum(1 for k in ["copy", "brand_assets", "media", "cases_reviews_proof", "current_process_or_scripts"] if lower_clean(materials.get(k)) in READY_VALUES)
    if ready_count >= 3 or (route == "business_automation" and lower_clean(materials.get("current_process_or_scripts")) in READY_VALUES and not is_unknown(materials.get("access_owner"))):
        mr = 3; positive.append("core materials/process details are available")
    elif ready_count >= 1 or as_list(scope.get("first_version_must_have")):
        mr = 2
    elif not is_unknown(materials.get("access_owner")):
        mr = 1
    else:
        mr = 0

    accepts = boolish(budget.get("accepts_estimate_after_scope"))
    sensitivity = lower_clean(budget.get("price_sensitivity"))
    if sensitivity == "cheapest_only" or accepts is False:
        bf = 0; risk_flags.append("budget/process expectations may be misaligned")
    elif sensitivity in {"premium_fit", "flexible"} and (not is_unknown(budget.get("budget_range")) or accepts is True):
        bf = 3; positive.append("budget/process expectations compatible with scoped work")
    elif accepts is True:
        bf = 2
    else:
        bf = 1

    flex = lower_clean(timeline.get("flexibility"))
    if flex == "impossible":
        tr = 0; risk_flags.append("timeline appears impossible")
    elif flex == "fixed_but_realistic" and not is_unknown(timeline.get("target_date")):
        tr = 3; positive.append("timeline has a realistic target")
    elif flex == "flexible" or boolish(timeline.get("ready_to_start_this_week")) is not None:
        tr = 2
    elif not is_unknown(timeline.get("target_date")):
        tr = 1
    else:
        tr = 1

    if escalations:
        rl = 2; risk_flags.extend(escalations)
    elif lower_clean(risk.get("regulated_domain")) in {"none", "unknown"} and lower_clean(risk.get("personal_or_sensitive_data")) in {"none", "basic_contact", "unknown"} and boolish(risk.get("production_system_changes")) is not True:
        rl = 3; positive.append("no high-risk data/production blocker identified")
    else:
        rl = 2

    return {
        "business_pain_clarity": bp,
        "offer_fit": offer,
        "decision_readiness": dr,
        "materials_readiness": mr,
        "budget_expectation_fit": bf,
        "timeline_readiness": tr,
        "risk_level": rl,
    }, positive, risk_flags


def classify(score_total: int, hard_gates: list[str], escalations: list[str], unknowns: list[str]) -> tuple[str, str, bool]:
    if hard_gates or score_total <= 5:
        return "decline", "disqualified", False
    if escalations:
        priority = "high" if score_total >= 17 else "medium" if score_total >= 11 else "low"
        return priority, "qualified_with_operator_review" if score_total >= 17 else "needs_clarification", True
    if len(unknowns) >= 2 or score_total <= 10:
        return "low", "needs_clarification", False
    if score_total >= 17:
        return "high", "qualified", False
    return "medium", "nurture", False


def confidence(score_total: int, unknowns: list[str], escalations: list[str], hard_gates: list[str]) -> str:
    if hard_gates:
        return "high"
    if len(unknowns) >= 3:
        return "low"
    if escalations or len(unknowns) >= 1 or score_total < 11:
        return "medium"
    return "high"


def followup_questions(missing: list[str], route: str, review: bool) -> list[dict[str, str]]:
    bank = {
        "primary pain / desired result": ("Какой результат нужен в первую очередь: лучше представить компанию, получать более качественные заявки или сократить ручную работу?", "route"),
        "budget expectations": ("Готовы определить оценку после состава первой версии и вводных, а не фиксировать цену до разбора зависимостей?", "budget"),
        "decision maker / approval owner": ("Кто принимает решение по старту и кто будет согласовывать результат?", "decision"),
        "timeline readiness": ("Есть ли желаемый срок и чем он обусловлен: событием, кампанией, внутренним дедлайном или гибким планом?", "timeline"),
        "first-version scope": ("Что обязательно должно войти в первую версию, а что можно оставить на потом?", "scope"),
        "risk / sensitive data constraints": ("Есть ли ограничения по персональным данным, платежам, доступам, публичным обещаниям или рабочим системам?", "risk"),
    }
    out = [{"question": bank[m][0], "why_it_matters": bank[m][1]} for m in missing if m in bank]
    if route == "business_automation" and not any(q["why_it_matters"] == "scope" for q in out):
        out.append({"question": "Какой один процесс сейчас дает больше всего ручной работы или потерь: вход, шаги, ответственные, статусы и место поломки?", "why_it_matters": "scope"})
    if review:
        out.append({"question": "Кто будет владельцем данных/доступов и кто утверждает безопасные границы первой версии?", "why_it_matters": "risk"})
    return out[:6]


def next_action(priority: str, decision: str, route: str, review: bool, missing: list[str]) -> dict[str, str]:
    if decision == "disqualified":
        return {"type": "pause_decline", "owner": "operator", "due": "none", "summary": "Do not create proposal/implementation work; use safe pause or decline note."}
    if review:
        return {"type": "propose_discovery", "owner": "operator", "due": "before proposal", "summary": "Operator risk/discovery review before proposal; verify data owner, approval path, test path, rollback/stop conditions."}
    if decision == "qualified":
        return {"type": "create_child_task", "owner": "operator", "due": "next operator cycle", "summary": f"Create bounded discovery or offer-adaptation child for route={route}; no implementation yet."}
    if decision == "nurture":
        return {"type": "ask_followup_questions", "owner": "operator", "due": "before proposal", "summary": "Ask targeted follow-up questions or propose short discovery before preparing offer."}
    return {"type": "ask_followup_questions", "owner": "operator", "due": "before proposal", "summary": "Send short questionnaire; keep lead in intake/triage until critical facts are known."}


def child_type_for_action(action_type: str, decision: str, route: str, review: bool) -> str | None:
    if decision == "disqualified":
        return None
    if review:
        return "risk-review"
    if action_type == "create_child_task":
        return "proposal" if route in {"landing_website", "ai_intake_bot", "business_automation"} else "discovery"
    if action_type == "ask_followup_questions":
        return "followup"
    if action_type == "propose_discovery":
        return "discovery"
    return None


def build_child_payload(record: dict[str, Any], result: dict[str, Any]) -> dict[str, Any]:
    action_type = result["recommended_next_action"]["type"]
    child_type = child_type_for_action(action_type, result["classification"]["decision"], result["classification"]["route"], result["classification"]["requires_operator_review"])
    if not child_type:
        return {"create": False, "reason": "no child action for decline/manual fix"}
    lead_id = result["lead_id"]
    idem = f"{AUTOMATION_KEY}:{lead_id}:{child_type}"
    title_map = {
        "followup": f"[WEBSTUDIO][D3][FOLLOWUP] Qualify missing facts for {lead_id}",
        "discovery": f"[WEBSTUDIO][D3][DISCOVERY] Bound first phase for {lead_id}",
        "proposal": f"[WEBSTUDIO][D3][PROPOSAL] Adapt offer for {lead_id}",
        "risk-review": f"[WEBSTUDIO][D3][RISK] Review constraints for {lead_id}",
    }
    body = (
        f"product_line=D3\nstage={child_type}\n"
        f"idempotency_key={idem}\n"
        f"parent_automation_key={AUTOMATION_KEY}\nlead_id={lead_id}\n"
        f"route={result['classification']['route']}\npriority={result['classification']['priority']}\n"
        f"decision={result['classification']['decision']}\nscore={result['classification']['score_total']}/21\n\n"
        f"Known summary: {record['source']['original_request_summary']}\n\n"
        f"Missing critical facts: {', '.join(result['reasons']['missing_critical_facts']) or 'none'}\n"
        f"Risk flags: {', '.join(result['reasons']['risk_flags']) or 'none'}\n\n"
        "Acceptance: update qualification decision, preserve no-production-write boundary, and do not start implementation until owner approves exact scope."
    )
    return {"create": True, "title": title_map[child_type], "assignee": "default", "body": body, "idempotency_key": idem, "type": child_type}


def fingerprint_for(record: dict[str, Any]) -> str:
    source = record["source"]
    date_bucket = (parse_iso(record.get("received_at")) or datetime.now(timezone.utc)).date().isoformat()
    stable = {
        "automation_key": AUTOMATION_KEY,
        "lead_id": record["lead_id"],
        "source_channel": source.get("channel"),
        "source_ref": source.get("source_ref"),
        "contact_value": record.get("client_contact", {}).get("contact_value"),
        "summary_hash": sha256_text(source.get("original_request_summary", "")),
        "date_bucket": date_bucket if source.get("source_ref") in {"", "unknown", None} else None,
    }
    return f"{AUTOMATION_KEY}:" + sha256_text(stable_json(stable))


def input_version_hash(record: dict[str, Any]) -> str:
    material = {k: record.get(k) for k in ["source", "client_contact", "business_context", "business_goal", "requested_scope", "materials_readiness", "budget_and_expectations", "timeline", "decision_and_ownership", "risk_and_constraints", "enrichment"]}
    return sha256_text(stable_json(material))


def build_result(payload: dict[str, Any]) -> dict[str, Any]:
    record, validation_errors = normalize_payload(payload)
    fp = fingerprint_for(record)
    version = input_version_hash(record)
    processed_at = utc_now()
    missing_identity = identity_missing(record)
    hard = hard_gate_triggers(record)
    escalations = escalation_triggers(record)
    unknowns = critical_unknowns(record)

    if missing_identity or validation_errors:
        route = "discovery_first"
        scores = {k: 0 for k in ["business_pain_clarity", "offer_fit", "decision_readiness", "materials_readiness", "budget_expectation_fit", "timeline_readiness", "risk_level"]}
        priority, decision, review = "low", "needs_clarification", False
        status = "needs_manual_intake_fix"
        positive: list[str] = []
        risk_flags = [*validation_errors]
    else:
        route = select_route(record, hard, escalations, unknowns)
        scores, positive, risk_flags = score_record(record, hard, escalations, unknowns, route)
        priority, decision, review = classify(sum(scores.values()), hard, escalations, unknowns)
        status = "processed"
    next_act = next_action(priority, decision, route, review, unknowns)
    questions = followup_questions(unknowns, route, review)
    result: dict[str, Any] = {
        "schema_version": SCHEMA_VERSION,
        "automation_key": AUTOMATION_KEY,
        "tenant": TENANT,
        "product_line": PRODUCT_LINE,
        "stage": STAGE,
        "source_board": SOURCE_BOARD,
        "root_production_card_id": ROOT_PRODUCTION_CARD_ID,
        "lead_id": record["lead_id"],
        "idempotency_fingerprint": fp,
        "input_version_hash": version,
        "processed_at": processed_at,
        "status": status,
        "classification": {
            "priority": priority,
            "decision": decision,
            "route": route,
            "score_total": sum(scores.values()),
            "score_max": 21,
            "score_breakdown": scores,
            "confidence": confidence(sum(scores.values()), unknowns, escalations, hard),
            "requires_operator_review": review,
        },
        "reasons": {
            "positive_signals": positive,
            "missing_critical_facts": [*missing_identity, *unknowns],
            "risk_flags": risk_flags,
            "hard_rejection_triggers": hard,
            "escalation_triggers": escalations,
        },
        "recommended_next_action": next_act,
        "followup_questions": questions,
        "operator_summary": operator_summary(priority, decision, route, sum(scores.values()), positive, risk_flags, [*missing_identity, *unknowns], next_act["summary"]),
        "client_safe_followup_prompt": client_safe_prompt(decision, questions, review),
        "source": record["source"],
        "audit": {
            "processed_by": "d3_client_qualification.py",
            "no_production_db_write": True,
            "kanban_mutation_performed": False,
            "automatic_message_sent": False,
            "obsolete_cards_preserved": True,
            "events": [{"at": processed_at, "kind": "qualified", "status": status}],
        },
    }
    result["child_card_payload"] = build_child_payload(record, result)
    return result


def operator_summary(priority: str, decision: str, route: str, score: int, positives: list[str], risks: list[str], missing: list[str], next_summary: str) -> str:
    return "\n".join([
        f"Priority: {priority}",
        f"Recommended route: {route}",
        f"Decision: {decision}",
        f"Score: {score} / 21",
        "Why:",
        *(f"- {x}" for x in (positives or ["No strong positive signal recorded yet."])),
        "Risks:",
        *(f"- {x}" for x in (risks or ["No confirmed high-risk blocker."])),
        "Missing info:",
        *(f"- {x}" for x in (missing or ["No critical missing fact."])),
        "Next step:",
        f"- {next_summary}",
    ])


def client_safe_prompt(decision: str, questions: list[dict[str, str]], review: bool) -> str:
    if decision == "qualified":
        return "По вводным видно, что первая версия может быть хорошо ограничена. Следующий шаг — коротко зафиксировать состав первой версии, материалы, зависимости и формат результата; после этого можно подготовить реалистичное предложение без преждевременных обещаний по цене и срокам."
    if decision == "disqualified":
        return "Сейчас не стоит переходить к предложению или реализации: сначала нужно убрать небезопасные ожидания, ограничения или неподтвержденные обещания. Если цель рабочая, можно начать с отдельного разбора границ и рисков."
    prefix = "Здесь есть ограничения, которые лучше разобрать до предложения." if review else "Чтобы понять, какой формат первой версии подходит, уточню несколько вещей:"
    qs = questions or [
        {"question": "Какой результат нужен в первую очередь: лучше представить компанию, получать более качественные заявки или сократить ручную работу?", "why_it_matters": "route"},
        {"question": "Кто принимает решение по старту и кто будет согласовывать результат?", "why_it_matters": "decision"},
        {"question": "Что обязательно должно войти в первую версию, а что можно оставить на потом?", "why_it_matters": "scope"},
    ]
    return prefix + "\n" + "\n".join(f"{i+1}. {q['question']}" for i, q in enumerate(qs[:6]))


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
    out = []
    for line in path.read_text(errors="replace").splitlines():
        if not line.strip():
            continue
        try:
            item = json.loads(line)
            if isinstance(item, dict):
                out.append(item)
        except Exception:
            continue
    return out


def append_jsonl(path: Path, item: dict[str, Any]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("a") as f:
        f.write(json.dumps(item, ensure_ascii=False, sort_keys=True) + "\n")


def atomic_write_json(path: Path, payload: dict[str, Any]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    tmp_fd, tmp_name = tempfile.mkstemp(prefix=path.name + ".", dir=str(path.parent))
    try:
        with os.fdopen(tmp_fd, "w") as f:
            json.dump(payload, f, ensure_ascii=False, indent=2, sort_keys=True)
            f.write("\n")
        os.replace(tmp_name, path)
    finally:
        with contextlib.suppress(FileNotFoundError):
            os.unlink(tmp_name)


def log_event(log_path: Path, event: dict[str, Any]) -> None:
    safe = {k: v for k, v in event.items() if k not in {"payload", "client_contact", "contact_value"}}
    append_jsonl(log_path, {"at": utc_now(), **safe})


def rebuild_index(index_path: Path, records: list[dict[str, Any]], actions: list[dict[str, Any]]) -> None:
    latest_by_fingerprint: dict[str, str] = {}
    latest_by_lead_id: dict[str, str] = {}
    version_by_fingerprint: dict[str, str] = {}
    for r in records:
        fp = r.get("idempotency_fingerprint")
        lead_id = r.get("lead_id")
        if fp:
            latest_by_fingerprint[fp] = r.get("result_id", "")
            version_by_fingerprint[fp] = r.get("input_version_hash", "")
        if lead_id:
            latest_by_lead_id[lead_id] = r.get("result_id", "")
    action_keys = sorted({a.get("idempotency_key") for a in actions if a.get("idempotency_key")})
    atomic_write_json(index_path, {
        "schema_version": SCHEMA_VERSION,
        "automation_key": AUTOMATION_KEY,
        "updated_at": utc_now(),
        "record_count": len(records),
        "action_count": len(actions),
        "latest_by_fingerprint": latest_by_fingerprint,
        "latest_by_lead_id": latest_by_lead_id,
        "version_by_fingerprint": version_by_fingerprint,
        "action_idempotency_keys": action_keys,
        "safety": {"kanban_mutation_performed": False, "production_db_write": False, "automatic_message_sent": False},
    })


def persist_qualification(
    payload: dict[str, Any],
    store_path: Path = DEFAULT_RESULT_STORE,
    index_path: Path = DEFAULT_INDEX_PATH,
    action_queue: Path = DEFAULT_ACTION_QUEUE,
    log_path: Path = DEFAULT_LOG_PATH,
) -> dict[str, Any]:
    result = build_result(payload)
    result["result_id"] = "d3qual_" + sha256_text(result["idempotency_fingerprint"] + ":" + result["input_version_hash"])[:20]
    with locked_store(store_path):
        records = load_jsonl(store_path)
        actions = load_jsonl(action_queue)
        existing_by_fp = {r.get("idempotency_fingerprint"): r for r in records}
        existing = existing_by_fp.get(result["idempotency_fingerprint"])
        if existing and existing.get("input_version_hash") == result["input_version_hash"]:
            existing_copy = dict(existing)
            existing_copy["status"] = "duplicate_ignored"
            log_event(log_path, {"event": "duplicate_ignored", "lead_id": result["lead_id"], "result_id": existing.get("result_id")})
            return {"ok": True, "status": "duplicate_ignored", "result_id": existing.get("result_id"), "idempotency_key": AUTOMATION_KEY, "fingerprint": result["idempotency_fingerprint"], "result": existing_copy}
        if existing:
            result["status"] = "updated"
            result["audit"]["events"].append({"at": utc_now(), "kind": "updated_previous_result", "previous_result_id": existing.get("result_id")})
        append_jsonl(store_path, result)
        action_payload = result.get("child_card_payload") if isinstance(result.get("child_card_payload"), dict) else {}
        action_key = action_payload.get("idempotency_key")
        existing_action_keys = {a.get("idempotency_key") for a in actions}
        action_written = False
        if action_payload.get("create") and action_key and action_key not in existing_action_keys:
            action_record = {
                "schema_version": SCHEMA_VERSION,
                "automation_key": AUTOMATION_KEY,
                "lead_id": result["lead_id"],
                "result_id": result["result_id"],
                "created_at": utc_now(),
                "status": "queued_for_operator_review",
                **action_payload,
                "safety": {"kanban_created": False, "requires_operator_or_configured_worker": True},
            }
            append_jsonl(action_queue, action_record)
            actions.append(action_record)
            action_written = True
        records.append(result)
        rebuild_index(index_path, records, actions)
        log_event(log_path, {"event": result["status"], "lead_id": result["lead_id"], "result_id": result["result_id"], "action_written": action_written})
        return {"ok": True, "status": result["status"], "result_id": result["result_id"], "idempotency_key": AUTOMATION_KEY, "fingerprint": result["idempotency_fingerprint"], "action_written": action_written, "result": result}


def build_qualification_state(store_path: Path = DEFAULT_RESULT_STORE, action_queue: Path = DEFAULT_ACTION_QUEUE, log_path: Path = DEFAULT_LOG_PATH, limit: int = 80) -> dict[str, Any]:
    records = load_jsonl(store_path)
    actions = load_jsonl(action_queue)
    records.sort(key=lambda r: str(r.get("processed_at") or ""), reverse=True)
    counts: dict[str, int] = {}
    by_decision: dict[str, int] = {}
    by_route: dict[str, int] = {}
    for r in records:
        counts[str(r.get("status") or "unknown")] = counts.get(str(r.get("status") or "unknown"), 0) + 1
        cls = r.get("classification") if isinstance(r.get("classification"), dict) else {}
        by_decision[str(cls.get("decision") or "unknown")] = by_decision.get(str(cls.get("decision") or "unknown"), 0) + 1
        by_route[str(cls.get("route") or "unknown")] = by_route.get(str(cls.get("route") or "unknown"), 0) + 1
    return {
        "available": True,
        "schema_version": SCHEMA_VERSION,
        "automation_key": AUTOMATION_KEY,
        "product_line": PRODUCT_LINE,
        "stage": STAGE,
        "tenant": TENANT,
        "source_of_truth": str(store_path),
        "action_queue": str(action_queue),
        "record_count": len(records),
        "action_count": len(actions),
        "counts": counts,
        "by_decision": by_decision,
        "by_route": by_route,
        "latest_results": records[:limit],
        "latest_actions": sorted(actions, key=lambda a: str(a.get("created_at") or ""), reverse=True)[:limit],
        "store": {"path": str(store_path), "exists": store_path.exists(), "size": store_path.stat().st_size if store_path.exists() else 0},
        "log": {"path": str(log_path), "exists": log_path.exists(), "size": log_path.stat().st_size if log_path.exists() else 0},
        "safety": {
            "production_db_write": False,
            "kanban_mutation_performed": False,
            "automatic_message_sent": False,
            "obsolete_cards_preserved": True,
            "duplicate_actions_prevented": True,
        },
    }


def load_payload_from_args(args: argparse.Namespace) -> dict[str, Any]:
    if args.input_json:
        text = Path(args.input_json).read_text() if args.input_json != "-" else os.sys.stdin.read()
        return json.loads(text)
    return {
        "automation_key": AUTOMATION_KEY,
        "lead_id": args.lead_id or "",
        "received_at": args.received_at or utc_now(),
        "source": {"channel": args.channel, "source_ref": args.source_ref or "manual", "original_request_summary": args.summary or ""},
        "client_contact": {"name": args.client_name or "", "company_or_brand": args.company or "", "contact_channel": args.contact_channel or "unknown", "contact_value": args.contact_value or ""},
        "operator": {"intake_owner": args.owner or "operator", "followup_owner": args.owner or "operator"},
        "business_goal": {"primary_pain": args.primary_pain or "unclear", "desired_result": args.desired_result or "", "main_user_action": args.main_user_action or "unclear"},
        "requested_scope": {"requested_format": args.requested_format or "unclear", "first_version_must_have": args.must_have or []},
        "budget_and_expectations": {"budget_range": args.budget_range or "", "accepts_estimate_after_scope": args.accepts_estimate_after_scope},
        "timeline": {"target_date": args.target_date or "", "flexibility": args.timeline_flexibility or "unknown"},
        "decision_and_ownership": {"decision_maker_name_role": args.decision_maker or "", "is_decision_maker_involved": args.decision_maker_involved, "feedback_owner": args.feedback_owner or ""},
        "materials_readiness": {"current_process_or_scripts": args.process_readiness or "unknown", "access_owner": args.access_owner or ""},
        "risk_and_constraints": {"regulated_domain": args.regulated_domain or "unknown", "personal_or_sensitive_data": args.personal_data or "unknown", "payments_or_accounts": args.payments_or_accounts, "production_system_changes": args.production_system_changes},
    }


def main() -> int:
    ap = argparse.ArgumentParser(description="Run D3 client qualification safely and idempotently")
    ap.add_argument("--input-json", help="Path to structured JSON payload, or '-' for stdin")
    ap.add_argument("--state", action="store_true", help="Print stored qualification state")
    ap.add_argument("--dry-run", action="store_true", help="Classify and print result without persisting")
    ap.add_argument("--store-path", default=str(DEFAULT_RESULT_STORE))
    ap.add_argument("--index-path", default=str(DEFAULT_INDEX_PATH))
    ap.add_argument("--action-queue", default=str(DEFAULT_ACTION_QUEUE))
    ap.add_argument("--log-path", default=str(DEFAULT_LOG_PATH))
    ap.add_argument("--lead-id")
    ap.add_argument("--received-at")
    ap.add_argument("--channel", default="manual")
    ap.add_argument("--source-ref")
    ap.add_argument("--summary")
    ap.add_argument("--client-name")
    ap.add_argument("--company")
    ap.add_argument("--contact-channel")
    ap.add_argument("--contact-value")
    ap.add_argument("--owner")
    ap.add_argument("--primary-pain")
    ap.add_argument("--desired-result")
    ap.add_argument("--main-user-action")
    ap.add_argument("--requested-format")
    ap.add_argument("--must-have", action="append")
    ap.add_argument("--budget-range")
    ap.add_argument("--accepts-estimate-after-scope")
    ap.add_argument("--target-date")
    ap.add_argument("--timeline-flexibility")
    ap.add_argument("--decision-maker")
    ap.add_argument("--decision-maker-involved")
    ap.add_argument("--feedback-owner")
    ap.add_argument("--process-readiness")
    ap.add_argument("--access-owner")
    ap.add_argument("--regulated-domain")
    ap.add_argument("--personal-data")
    ap.add_argument("--payments-or-accounts")
    ap.add_argument("--production-system-changes")
    args = ap.parse_args()

    store = Path(args.store_path)
    index = Path(args.index_path)
    action_queue = Path(args.action_queue)
    log_path = Path(args.log_path)
    if args.state:
        print(json.dumps(build_qualification_state(store, action_queue, log_path), ensure_ascii=False, indent=2))
        return 0
    payload = load_payload_from_args(args)
    if args.dry_run:
        print(json.dumps(build_result(payload), ensure_ascii=False, indent=2))
        return 0
    outcome = persist_qualification(payload, store, index, action_queue, log_path)
    print(json.dumps(outcome, ensure_ascii=False, indent=2))
    return 0 if outcome.get("ok") else 2


if __name__ == "__main__":
    raise SystemExit(main())
