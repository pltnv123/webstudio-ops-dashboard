#!/usr/bin/env python3
from pathlib import Path
root=Path(__file__).resolve().parents[1]
html=(root/'src'/'index.html').read_text(errors='replace')
app=(root/'src'/'app.js').read_text(errors='replace') if (root/'src'/'app.js').exists() else ''
for m in ['real-client-onboarding-v71','client-safe intake','proof/compliance review','LIVE_INTEGRATION_APPROVAL_REQUIRED','READY_FOR_SAFE_ONBOARDING','no private data']:
    assert m in html or m in app, f'missing marker {m}'
for r in ['#real-client-onboarding','#proposal-quote','#integration-plan','#real-assets']:
    assert r in html, f'missing route link {r}'
print('SMOKE PASS')
print('routes=real-client-onboarding,proposal-quote,integration-plan,real-assets')
