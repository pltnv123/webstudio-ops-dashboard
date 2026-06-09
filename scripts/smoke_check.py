#!/usr/bin/env python3
from __future__ import annotations

import json
import os
import re
from pathlib import Path

root = Path(__file__).resolve().parents[1]
state_path = root / 'public/data/webstudio-control-plane-state.json'
required = [
    root / 'src/index.html',
    root / 'src/styles.css',
    root / 'src/app.js',
    state_path,
]
missing = [str(p) for p in required if not p.exists()]
if missing:
    raise SystemExit('missing files: ' + ', '.join(missing))

state = json.loads(state_path.read_text())
html = (root / 'src/index.html').read_text()
js = (root / 'src/app.js').read_text()
css = (root / 'src/styles.css').read_text()

# Canonical safety contract.
assert state['mode'] == 'read_only_ops_cockpit'
assert state['safety']['read_only'] is True
assert state['safety']['dispatch_allowed'] is False
assert state['safety']['worker_allowed'] is False
assert state['notification_policy']['mode'] == 'quiet'

# UI must expose all operational sections used by the live cockpit.
required_routes = ['overview', 'work-factory', 'premium-factory', 'kanban', 'production', 'd3-intake', 'owner-feedback', 'clients', 'sales-pack', 'real-assets', 'proposal-quote', 'integration-plan', 'approvals', 'health', 'artifacts', 'marathon', 'audit']
for route in required_routes:
    assert f'#{route}' in html, f'missing nav route #{route}'

required_labels = [
    'Админка веб-студии',
    'только чтение',
    'без запуска задач',
    'без записи в production',
]
for label in required_labels:
    assert label in html, f'missing label {label}'

required_js_symbols = [
    'workFactory',
    'premiumFactoryView',
    'PREMIUM_FACTORY_V126',
    'kanban',
    'production',
    'd3Intake',
    'clients',
    'salesPack',
    'realAssetsWorkflow',
    'real-asset-workflow-v63',
    'proposalQuoteWorkflow',
    'proposal-quote-generator-v64',
    'integrationPlanWorkflow',
    'integration-plan-v67',
    'Telegram bot intake plan',
    'CRM / Sheets plan',
    'Supabase live write plan',
    'OWNER_APPROVAL_REQUIRED',
    'DO_NOT_RUN_LIVE',
    'READY_FOR_REVIEW',
    'approvals',
    'health',
    'artifacts',
    'marathon',
    'audit',
    'handleD3TriageSubmit',
    'd3TriageForm',
    'ownerFeedback',
    'OWNER_FEEDBACK_STATES',
    'handleOwnerFeedbackSubmit',
    'handleOwnerFeedbackScope',
    'owner_decision_pending',
    'Not scoped — cannot be Done',
    'D3_INTAKE_STATUSES',
    'needs_clarification',
    'qualified',
    'blocked_owner',
    'openDrawer',
    'copyText',
]
for symbol in required_js_symbols:
    assert symbol in js, f'missing JS symbol {symbol}'

# Guard against duplicate input binding regressions that cause double renders
# and confusing operator UX in the static dashboard.
assert js.count("$('#d3IntakeSearch')?.addEventListener('input'") == 1, 'duplicate D3 intake search binding'

# Source-of-truth must include the data needed by the dashboard.
for key in ['work_factory', 'kanban', 'artifacts', 'health', 'safety', 'd3_intake', 'continuation_controller', 'product_progress']:
    assert key in state, f'missing state key {key}'
controller = state['continuation_controller']
assert (
    controller['checkpoint_path'] == '/workspace/output/current-task-continuation-checkpoint.md'
    or controller['checkpoint_path'].endswith('/output/current-task-continuation-checkpoint.md')
)
assert controller['terminal_protocol']['silent_exit_allowed'] is False
assert controller['terminal_protocol']['bare_partial_allowed'] is False
assert 'PARTIAL' in controller['terminal_protocol']['forbidden_final_states']
assert controller['terminal_protocol']['success_action'] == 'kanban_complete'
assert controller['terminal_protocol']['blocker_action'] == 'kanban_block'
assert controller['final_status'] in ['PASS', 'CONTINUING', 'BLOCKED']
assert state['agent_workflow']['protocol']['continuation_controller']['terminal_protocol']['silent_exit_allowed'] is False
assert Path(controller['checkpoint_path']).exists(), 'continuation checkpoint must exist/refreshed for continuation handoff'
assert state['d3_intake']['idempotency_key'] == 'webstudio:D3:intake'
assert state['d3_intake']['product_line'] == 'D3'
assert state['d3_intake']['stage'] == 'intake'
assert state['d3_intake']['source_board'] == 'webstudio-production'
assert state['d3_intake']['source_view'] == 'raw_requirements_inbox'
assert 'owner-feedback' in html
assert 'ownerFeedback' in js
assert 'Done' not in re.findall(r'<select name="triage_state">(.*?)</select>', js, flags=re.S)[0]
assert state['d3_intake']['safety']['production_card_preserved'] is True
progress = state['product_progress']
assert progress['mode'] == 'safe_local_artifacts_only'
assert {item['product_line'] for item in progress['items']} >= {'D1', 'D2', 'D3'}
if state['github_readiness'].get('status') == 'UPDATED':
    assert state['github_readiness'].get('latest_commit_sha'), 'UPDATED PR needs latest commit SHA'
    assert state['github_readiness'].get('pushed_at'), 'UPDATED PR needs pushed_at'
if os.environ.get('WEBSTUDIO_CI') == '1':
    assert state['kanban']['task_total'] >= 0
else:
    assert state['kanban']['task_total'] >= 100
assert state['kanban'].get('executable_mirror_count', state['safety'].get('mirror_executable_count')) == 0
assert len(state['kanban'].get('duplicate_keys', state['safety'].get('duplicate_keys', {}))) == 0

# Static asset sanity.
assert '.drawer' in css
assert '.kanban-board' in css
assert len(js) > 10_000, 'app.js unexpectedly small'
assert len(css) > 5_000, 'styles.css unexpectedly small'

# No active executor/control verbs in UI code. Allow copy-only text for dry-run/read-only commands.
for forbidden in [
    r'kanban\s+dispatch\s+(?!.*--dry-run)',
    r'\bdaemon\b',
    r'\breclaim\b',
    r'\bunblock\b',
    r'\bdeploy\b',
    r'\brelease\b',
]:
    assert not re.search(forbidden, html.lower()), forbidden
    assert not re.search(forbidden, js.lower()), forbidden

# Cheap secret-pattern tripwire for accidental frontend leakage.
secret_patterns = [
    r'AKIA[0-9A-Z]{16}',
    r'eyJ[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{10,}',
    r'(?i)(api[_-]?key|secret|token|password)\s*[:=]\s*[A-Za-z0-9_./+=-]{16,}',
]
for text_name, text in [('html', html), ('js', js), ('state', state_path.read_text())]:
    for pat in secret_patterns:
        assert not re.search(pat, text), f'possible secret in {text_name}: {pat}'

print('SMOKE PASS')
print('generated_at=' + state['generated_at'])
print('kanban_task_total=' + str(state['kanban']['task_total']))
print('wf_completed=' + str(state['work_factory']['counts']['completed']))
print('routes=' + ','.join(required_routes))
print('executable_mirror_count=' + str(state['kanban'].get('executable_mirror_count', state['safety'].get('mirror_executable_count'))))
