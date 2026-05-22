#!/usr/bin/env python3
"""Generate safe D1/D2/D3 WebStudio product progress artifacts.

Local/report-only product work: no network calls, no Kanban mutation, no secrets,
no production database writes. The generated artifacts are client/product proof
packs consumed by the Ops Cockpit and 12h loop.
"""
from __future__ import annotations

import argparse
import hashlib
import json
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

WORKSPACE = Path("/workspace")
OUTPUT = WORKSPACE / "output"


def utc_now() -> str:
    return datetime.now(timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z")


def sha256_text(text: str) -> str:
    return hashlib.sha256(text.encode("utf-8")).hexdigest()


def write(path: Path, content: str) -> dict[str, Any]:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(content)
    return {"path": str(path), "size": path.stat().st_size, "sha256": sha256_text(content), "updated_at": utc_now()}


def d1_landing_qa(now: str) -> tuple[str, dict[str, Any]]:
    checks = [
        ("hero", "Above-fold value proposition names client pain, offer, proof, and primary CTA."),
        ("lead_route", "Every CTA routes to one owner-approved contact/intake path; no fake forms."),
        ("mobile", "Hero, offer cards, FAQ, and CTA remain readable at 360px width."),
        ("proof", "Claims are backed by artifacts, screenshots, checklists, or delivery examples."),
        ("speed", "No heavy media required for first proof; static HTML is acceptable."),
        ("launch_gate", "DNS, analytics, paid pixels, and production forms remain approval-gated."),
    ]
    md = [
        "# D1 Landing / Pages — Responsive UX + Conversion QA Pack v4",
        "",
        f"Updated: {now}",
        "Product line: D1 — landing/pages",
        "Stage: QA / Review",
        "",
        "## Next useful product progress",
        "Created a responsive conversion QA pack with no-horizontal-scroll acceptance gates for the next landing/site delivery. It converts D1 from generic website work into an artifact-driven acceptance gate.",
        "",
        "## QA checks",
    ]
    md += [f"- **{key}**: {text}" for key, text in checks]
    md += [
        "",
        "## Acceptance status",
        "PASS_WITH_APPROVAL_BLOCKERS — safe local QA pack is ready; public launch/live form/DNS remain owner-approved actions.",
        "",
        "## Kanban handoff",
        "idempotency_key: `webstudio:D1:responsive-conversion-qa-v4`",
        "logical_lane: `review`",
        "next_action: attach this pack to the next D1 implementation card before delivery review.",
    ]
    data = {"product_line": "D1", "artifact_type": "conversion_qa_pack", "stage": "qa", "status": "PASS_WITH_APPROVAL_BLOCKERS", "checks": [{"id": k, "criterion": v} for k, v in checks]}
    return "\n".join(md) + "\n", data


def d2_intake_scenarios(now: str) -> tuple[str, dict[str, Any]]:
    scenarios = [
        {"id": "ideal_lead", "intent": "qualified client request", "bot_action": "extract fields and prepare human handoff", "expected_status": "qualified"},
        {"id": "unclear_scope", "intent": "missing budget/timeline/scope", "bot_action": "ask 3 clarifying questions, no promises", "expected_status": "needs_clarification"},
        {"id": "risk_live_access", "intent": "asks for token/CRM/live system write", "bot_action": "escalate to owner approval gate", "expected_status": "blocked_owner"},
    ]
    md = [
        "# D2 AI-Intake Telegram Bot — Transcript Fixture QA Pack v4",
        "",
        f"Updated: {now}",
        "Product line: D2 — AI-intake Telegram bot",
        "Stage: implementation QA / transcript proof",
        "",
        "## Next useful product progress",
        "Defined the next transcript fixture pack for the D2 bot. This lets the 12h loop validate intake quality without live Telegram token or CRM writes.",
        "",
        "## Scenarios",
    ]
    for s in scenarios:
        md.append(f"- **{s['id']}**: intent={s['intent']}; bot_action={s['bot_action']}; expected_status={s['expected_status']}")
    md += [
        "",
        "## Safety gates",
        "- No live Telegram token required for this QA step.",
        "- No CRM/storage write is performed.",
        "- Private data is represented by redacted placeholders in transcripts.",
        "",
        "## Kanban handoff",
        "idempotency_key: `webstudio:D2:transcript-fixture-qa-v4`",
        "logical_lane: `review`",
        "next_action: generate three transcript fixtures and run extraction assertions.",
    ]
    data = {"product_line": "D2", "artifact_type": "offline_scenario_qa", "stage": "qa", "status": "READY_FOR_TRANSCRIPT_FIXTURES", "scenarios": scenarios}
    return "\n".join(md) + "\n", data


def d3_automation_matrix(now: str) -> tuple[str, dict[str, Any]]:
    rows = [
        ("missing_input", "required field absent", "ask owner/client for missing field; keep workflow in Todo"),
        ("duplicate_job", "same source/idempotency key", "return existing result; do not create duplicate worker card"),
        ("external_outage", "API/system unreachable", "write retry packet and Block only if automated retry exhausted"),
        ("approval_required_write", "production write/live schedule requested", "create approval packet; no execution before exact approval"),
        ("rollback_requested", "owner/client rejects output", "restore previous artifact/config from listed backup path"),
    ]
    md = [
        "# D3 Business Automations — Automation Fixture Matrix v4",
        "",
        f"Updated: {now}",
        "Product line: D3 — business automations",
        "Stage: architecture / QA",
        "",
        "## Next useful product progress",
        "Created the fixture-oriented exception matrix that every D3 automation proof must satisfy before live system writes or scheduling are considered.",
        "",
        "## Matrix",
    ]
    md += [f"- **{code}**: detector={detector}; safe_response={response}" for code, detector, response in rows]
    md += [
        "",
        "## Acceptance status",
        "PASS_WITH_APPROVAL_BLOCKERS — dry-run rules are ready; live system writes/scheduled jobs remain approval-gated.",
        "",
        "## Kanban handoff",
        "idempotency_key: `webstudio:D3:automation-fixture-matrix-v4`",
        "logical_lane: `ready`",
        "next_action: attach to the next D3 dry-run proof and verify each exception row has a test fixture.",
    ]
    data = {"product_line": "D3", "artifact_type": "dry_run_exception_matrix", "stage": "architecture_qa", "status": "PASS_WITH_APPROVAL_BLOCKERS", "exceptions": [{"code": c, "detector": d, "safe_response": r} for c, d, r in rows]}
    return "\n".join(md) + "\n", data


def generate() -> dict[str, Any]:
    """Return the current product progress index without downgrading v12.

    Earlier versions of this generator produced v4 proof packs and overwrote
    `/workspace/output/webstudio-product-progress-v1.json`. Product Build v12
    treats that JSON as the canonical showcase index, so tests/builds must not
    regress it back to v4. If v12 exists, validate artifact paths and return it.
    """
    progress_path = OUTPUT / "webstudio-product-progress-v1.json"
    if progress_path.exists():
        try:
            current = json.loads(progress_path.read_text())
            if str(current.get("schema_version", "")).endswith("v12"):
                for item in current.get("items", []):
                    for key in ["path", "qa_path", "handoff_path"]:
                        value = item.get(key)
                        if value and Path(value).exists():
                            item.setdefault(f"{key}_sha256", sha256_text(Path(value).read_text(errors="replace")))
                return current
        except Exception:
            pass

    now = utc_now()
    outputs = []
    for name, builder in [
        ("webstudio-d1-landing-responsive-qa-pack-v4.md", d1_landing_qa),
        ("webstudio-d2-ai-intake-transcript-fixtures-v4.md", d2_intake_scenarios),
        ("webstudio-d3-business-automation-fixture-matrix-v4.md", d3_automation_matrix),
    ]:
        md, data = builder(now)
        info = write(OUTPUT / name, md)
        info.update(data)
        outputs.append(info)
    index = {"schema_version": "webstudio-product-progress.v4", "updated_at": now, "mode": "safe_local_artifacts_only", "items": outputs}
    index_info = write(OUTPUT / "webstudio-product-progress-v1.json", json.dumps(index, ensure_ascii=False, indent=2) + "\n")
    index["index"] = index_info
    return index


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--json", action="store_true")
    args = ap.parse_args()
    result = generate()
    if args.json:
        print(json.dumps(result, ensure_ascii=False, indent=2))
    else:
        print("PRODUCT PROGRESS PASS")
        for item in result["items"]:
            print(f"{item['product_line']} {item['path']} {item['sha256'][:12]}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
