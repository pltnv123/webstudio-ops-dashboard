#!/usr/bin/env python3
"""D3 integration readiness dry-run. Reads fixtures and writes no live CRM/table data."""
from __future__ import annotations
import json, datetime
from pathlib import Path
fixture=Path('/workspace/output/webstudio-client-sim-001-d3-fixtures-v13.json')
data=json.loads(fixture.read_text())
outputs=[]
for lead in data['leads']:
    risks=list(lead.get('risk_flags') or [])
    if not lead.get('contact'): risks.append('missing_contact')
    if not lead.get('area_m2'): risks.append('needs_clarification')
    decision='owner_approval_required' if risks else 'ready_for_manual_owner_handoff'
    outputs.append({'lead_id':lead['id'],'decision':decision,'risk_gates':risks,'would_write':False,'target':'none_dry_run'})
payload={'schema_version':'webstudio.d3.integration-dry-run.v13','generated_at':datetime.datetime.now(datetime.timezone.utc).replace(microsecond=0).isoformat().replace('+00:00','Z'),'mode':'dry_run_no_live_writes','fixture':str(fixture),'outputs':outputs,'pass':all(not x['would_write'] for x in outputs)}
print(json.dumps(payload, ensure_ascii=False, indent=2))
