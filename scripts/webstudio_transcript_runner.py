#!/usr/bin/env python3
"""Dry-run transcript runner for WebStudio Client Simulation #001. No live writes."""
from __future__ import annotations
import json, datetime
SCENARIOS = {
  "ideal": {"input":"Нужен ремонт двухкомнатной квартиры 54 м2 в Москве, бюджет до 2.5 млн, старт в июле, пишите в Telegram @client.", "expected":"qualified_handoff"},
  "unclear": {"input":"Хочу ремонт, сколько стоит?", "expected":"needs_clarification"},
  "risky": {"input":"Нужно гарантировать точную цену без осмотра и закончить за неделю.", "expected":"risk_escalation"},
  "handoff": {"input":"Нужен ремонт квартиры 42 м2, район Москва ЮЗАО, бюджет 1.8 млн, сроки август, телефон +7***, хочу созвон с прорабом.", "expected":"owner_handoff"},
}
FIELDS = ["repair_type","area_m2","district","budget","timing","contact"]
def classify(text: str):
    t=text.lower(); missing=[]
    if not any(x in t for x in ["ремонт", "квартир"]): missing.append("repair_type")
    if not any(ch.isdigit() for ch in t) or "м2" not in t: missing.append("area_m2")
    if not any(x in t for x in ["моск", "район"]): missing.append("district")
    if not any(x in t for x in ["бюдж", "млн", "₽", "руб"]): missing.append("budget")
    if not any(x in t for x in ["июл", "срок", "старт", "недел"]): missing.append("timing")
    if not any(x in t for x in ["@", "тел", "+7", "telegram"]): missing.append("contact")
    risks=[]
    if "точн" in t and "без осмотр" in t: risks.append("price_without_inspection")
    if "за неделю" in t: risks.append("unrealistic_timeline")
    if risks: status="risk_escalation"
    elif missing: status="needs_clarification"
    elif "созвон" in t or "прораб" in t: status="owner_handoff"
    else: status="qualified_handoff"
    return {"status":status,"missing_fields":missing,"risk_gates":risks,"summary":"dry-run only; no live Telegram/CRM writes"}
def main():
    results=[]
    for name, s in SCENARIOS.items():
        out=classify(s["input"]); out.update({"scenario":name,"input":s["input"],"expected":s["expected"],"pass": out["status"]==s["expected"]})
        results.append(out)
    payload={"schema_version":"webstudio.d2.transcript-runner.v13","generated_at":datetime.datetime.now(datetime.timezone.utc).replace(microsecond=0).isoformat().replace('+00:00','Z'),"mode":"dry_run_no_live_writes","client_simulation":"client-sim-001","results":results,"pass":all(x["pass"] for x in results)}
    print(json.dumps(payload, ensure_ascii=False, indent=2))
if __name__ == "__main__": main()
