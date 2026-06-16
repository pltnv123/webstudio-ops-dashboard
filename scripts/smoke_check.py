#!/usr/bin/env python3
from pathlib import Path
root=Path(__file__).resolve().parents[1]
html=(root/'src'/'index.html').read_text(errors='replace')
app=(root/'src'/'app.js').read_text(errors='replace') if (root/'src'/'app.js').exists() else ''
markers=['real-client-onboarding-v71','client-safe intake','proof/compliance review','LIVE_INTEGRATION_APPROVAL_REQUIRED','READY_FOR_SAFE_ONBOARDING','no private data','client-data-room-v73','Start here','Review preview','Confirm assets','Approve proposal','Track timeline','Review proof policy','Understand live-integration gates','OWNER_REVIEW','CLIENT_ASSETS','PROPOSAL_REVIEW','PREVIEW_APPROVAL','LIVE_INTEGRATION_BLOCKED','SAFE_FOR_REVIEW','demo/static only','no live writes','no fake proof','proposal/quote','delivery timeline','client-portal-readiness-v74','READY_FOR_DEMO','BLOCKED_FOR_LIVE','route matrix','warning coverage','link check']
for m in markers:
    assert m in html or m in app, f'missing marker {m}'
for r in ['#real-client-onboarding','#client-data-room','#client-portal-readiness','#proposal-quote','#integration-plan','#real-assets']:
    assert r in html, f'missing route link {r}'
for direct in ['/client-data-room/','/client-portal-readiness/','/real-client-onboarding/','/client-portal-preview/','/client-safe-preview/','/proposal-quote/','/delivery-timeline/','/proof-case-study/','/integration-plan/','/route-health/']:
    assert direct in html or direct in app, f'missing direct route link {direct}'
print('SMOKE PASS')
print('routes=real-client-onboarding,client-data-room,client-portal-readiness,client-portal-preview,client-safe-preview,proposal-quote,delivery-timeline,proof-case-study,integration-plan,route-health')
