#!/usr/bin/env python3
from pathlib import Path
root=Path(__file__).resolve().parents[1]
html=(root/'src'/'index.html').read_text(errors='replace')
app=(root/'src'/'app.js').read_text(errors='replace') if (root/'src'/'app.js').exists() else ''
build=(root/'scripts'/'build_snapshot.py').read_text(errors='replace')
built=Path('/workspace/output/webstudio-ops-dashboard-static/client-portal-launch-checklist/index.html')
built_text=built.read_text(errors='replace') if built.exists() else ''
markers=['real-client-onboarding-v71','client-safe intake','proof/compliance review','LIVE_INTEGRATION_APPROVAL_REQUIRED','READY_FOR_SAFE_ONBOARDING','no private data','client-data-room-v73','Start here','Review preview','Confirm assets','Approve proposal','Track timeline','Review proof policy','Understand live-integration gates','OWNER_REVIEW','CLIENT_ASSETS','PROPOSAL_REVIEW','PREVIEW_APPROVAL','LIVE_INTEGRATION_BLOCKED','SAFE_FOR_REVIEW','demo/static only','no live writes','no fake proof','proposal/quote','delivery timeline','client-portal-readiness-v74','READY_FOR_DEMO','BLOCKED_FOR_LIVE','route matrix','warning coverage','link check','client-portal-launch-checklist-v75','SAFE_FOR_PILOT_REVIEW','DO_NOT_ENABLE_LIVE_WRITES','owner go/no-go','rollback plan','controlled pilot','NEEDS_REAL_ASSETS','NEEDS_OWNER_APPROVAL']
for m in markers:
    assert m in html or m in app or m in build or m in built_text, f'missing marker {m}'
for r in ['#real-client-onboarding','#client-data-room','#client-portal-readiness','#proposal-quote','#integration-plan','#real-assets']:
    assert r in html, f'missing route link {r}'
for direct in ['/client-data-room/','/client-portal-readiness/','/client-portal-launch-checklist/','/real-client-onboarding/','/asset-intake-pack/','/proposal-quote/','/proof-case-study/','/integration-plan/','/route-health/']:
    assert direct in html or direct in app or direct in build or direct in built_text, f'missing direct route link {direct}'
print('SMOKE PASS')
print('routes=real-client-onboarding,client-data-room,client-portal-readiness,client-portal-launch-checklist,asset-intake-pack,proposal-quote,proof-case-study,integration-plan,route-health')
