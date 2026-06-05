#!/usr/bin/env python3
from __future__ import annotations

import json
import os
import re
from pathlib import Path

root = Path(__file__).resolve().parents[1]
ci_mode = os.environ.get('WEBSTUDIO_CI') == '1' or os.environ.get('GITHUB_ACTIONS') == 'true'
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
required_routes = ['overview', 'work-factory', 'owner-command-center', 'order-builder', 'kanban', 'production', 'demo-products', 'agent-workflow', 'capabilities', 'motion-factory', 'intake-orders', 'delivery', 'real-clients', 'premium-factory', 'premium-generator', 'premium-factory-v34', 'generated-demo-site-v35', 'lead-capture-demo', 'lead-to-order-handoff', 'order-package-generator', 'website-page-builder', 'one-click-demo-assembly', 'client-handoff-pack', 'handoff-review-matrix', 'revision-request-demo', 'webstudio-showcase', 'pricing-packages', 'route-health', 'asset-intake-pack', 'client-safe-preview', 'client-approval-room', 'revision-workflow', 'real-client-readiness', 'sales-funnel', 'offer-detail', 'ops-memory-consistency', 'owner-executive-report', 'phase-proof-matrix', 'client-portal-preview', 'delivery-lifecycle', 'morning-summary', 'd3-intake', 'owner-feedback', 'clients', 'sales-pack', 'morning-desk', 'approvals', 'supabase-memory', 'bot-activity', 'health', 'artifacts', 'marathon', 'audit']
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
    'kanban',
    'production',
    'demoProducts',
    'demoProductCard',
    'd3Intake',
    'clients',
    'salesPack',
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
    'capabilities',
    'capabilityMatrix',
    'motionFactory',
    'intakeOrders',
    'delivery',
    'Поставка клиенту',
    'Delivery pipeline',
    'realClients',
    'Реальные клиенты',
    'Client #004',
    'Execution flow progress',
    'Заказы / Intake',
    'Production generator',
    'progressAnalytics',
    'visualLaneBoard',
    'control_plane_history',
    'Host Runner',
    'Continuation Queue',
    'Snapshot processor',
    'Owner Actions',
    'chat_cron_used',
    'owner_needs_to_type_continue',
    'supabaseMemory',
    'Supabase Memory',
    'botActivity',
    'Bot Activity',
    'work_factory_control',
    'ownerCommandCenter',
    'Owner Command Center',
    'orderBuilder',
    'Order Builder',
    'Work Factory summary',
    'NEEDS_OWNER',
    'routeNames',
    "split('/').filter(Boolean).pop()",
    'deliveryHandoffComposer',
    'Client handoff composer v36',
    'deliveryAcceptanceTracker',
    'Client acceptance tracker v35',
    'deliveryAcceptanceSummary',
    'Acceptance handoff gate v35',
    'deliveryHandoffRiskDigest',
    'Client handoff risk digest v36',
    'handoff_risk_digest_v36',
    'deliveryOwnerSignoffPacket',
    'Delivery owner sign-off packet v39',
    'owner_signoff_packet_v39',
    'deliveryLaunchReadinessReceipt',
    'Delivery launch-readiness receipt v40',
    'launch_readiness_receipt_v40',
    'deliveryEvidenceFreshnessMonitor',
    'Delivery evidence freshness monitor v41',
    'evidence_freshness_monitor_v41',
    'deliveryApprovalDecisionLedger',
    'Delivery approval decision ledger v42',
    'approval_decision_ledger_v42',
    'DELIVERY_APPROVAL_LEDGER_STORAGE_KEY',
    'DELIVERY_ACCEPTANCE_STORAGE_KEY',
    'deliveryHandoffManifest',
    'Delivery handoff manifest v43',
    'handoff_manifest_v43',
    'deliveryRehearsalChecklist',
    'Delivery rehearsal checklist v44',
    'handoff_rehearsal_checklist_v44',
    'deliveryGoNoGoMatrix',
    'Delivery go/no-go matrix v45',
    'handoff_go_no_go_matrix_v45',
    'deliveryClientAcceptanceReceipt',
    'Delivery client acceptance receipt v46',
    'client_acceptance_receipt_v46',
]
for symbol in required_js_symbols:
    assert symbol in js, f'missing JS symbol {symbol}'

# Guard against duplicate input binding regressions that cause double renders
# and confusing operator UX in the static dashboard.
assert js.count("$('#d3IntakeSearch')?.addEventListener('input'") == 1, 'duplicate D3 intake search binding'

# Source-of-truth must include the data needed by the dashboard.
for key in ['work_factory', 'kanban', 'artifacts', 'health', 'safety', 'd3_intake', 'continuation_controller', 'product_progress', 'motion_factory', 'client_intake_v27', 'delivery_system_v29', 'delivery_pipeline_v29', 'real_client_execution_v30', 'premium_visual_motion_v31', 'premium_website_generator_v32', 'premium_factory_v34', 'generated_demo_site_v35', 'lead_capture_demo_v36', 'lead_to_order_handoff_v37', 'order_package_generator_v38', 'website_page_builder_v39', 'one_click_demo_assembly_v40', 'client_handoff_pack_v41', 'handoff_review_matrix_v42', 'revision_request_demo_v43', 'webstudio_showcase_v44', 'pricing_package_catalog_v45', 'route_health_dashboard_v46', 'morning_summary_v47', 'real_asset_intake_pack_v50', 'client_safe_preview_v51', 'client_approval_room_v52', 'revision_workflow_board_v53', 'real_client_readiness_pack_v54', 'productized_sales_funnel_v55', 'offer_detail_layer_v58', 'ops_memory_consistency_v59', 'owner_executive_report_v60', 'phase_proof_matrix_v61', 'control_plane_history', 'host_autonomy', 'github_readiness', 'system_hardening', 'supabase_memory', 'bot_activity', 'work_factory_control', 'owner_command_center', 'order_builder', 'delivery_handoff_composer_v33']:
    assert key in state, f'missing state key {key}'
ha = state['host_autonomy']
ce = ha['continuation_engine']
assert ce['chat_cron_used'] is False
assert ce['owner_needs_to_type_continue'] is False
assert 'snapshot_pending_count' in state['system_hardening']
assert state['github_readiness'].get('pr_url'), 'GitHub PR URL required'
assert state['supabase_memory']['safety']['browser_side_supabase'] is False
assert len(state['supabase_memory']['latest_ops_status']) >= 1
assert 'webstudio_ops_status' in state['supabase_memory']['tables']
assert state['bot_activity']['safety']['browser_side_supabase'] is False
assert state['bot_activity']['safety']['browser_side_github_token'] is False
assert state['lead_capture_demo_v36']['safety']['demo_only'] is True
assert state['lead_capture_demo_v36']['safety']['live_submission'] is False
assert state['lead_capture_demo_v36']['safety']['browser_side_supabase_secret'] is False
for marker in ['lead-capture-demo-v36', 'Demo only', 'D1 website', 'D2 AI-intake bot', 'D3 automation']:
    assert marker in js, f'missing V3.6 marker {marker}'
assert state['lead_to_order_handoff_v37']['safety']['static_snapshot'] is True
assert state['lead_to_order_handoff_v37']['safety']['external_writes'] is False
for marker in ['lead-to-order-handoff-v37', 'demo lead payload', 'qualification preview', 'order-builder handoff', 'D1 website', 'D2 AI-intake bot', 'D3 automation']:
    assert marker in js, f'missing V3.7 marker {marker}'
assert state['order_package_generator_v38']['safety']['static_snapshot'] is True
assert state['order_package_generator_v38']['safety']['external_writes'] is False
for marker in ['order-package-generator-v38', 'generated sitemap', 'page briefs', 'SEO checklist', 'QA checklist', 'delivery checklist']:
    assert marker in js, f'missing V3.8 marker {marker}'
assert state['website_page_builder_v39']['safety']['static_snapshot'] is True
assert state['website_page_builder_v39']['safety']['external_writes'] is False
assert state['website_page_builder_v39']['safety']['live_booking_writes'] is False
for marker in ['website-page-builder-v39', 'Home page', 'Services page', 'FAQ page', 'generated sections', 'QA checklist']:
    assert marker in js, f'missing V3.9 marker {marker}'

assert state['one_click_demo_assembly_v40']['safety']['static_snapshot'] is True
assert state['one_click_demo_assembly_v40']['safety']['external_writes'] is False
assert state['one_click_demo_assembly_v40']['safety']['live_booking_writes'] is False
for marker in ['one-click-demo-assembly-v40', 'full assembled landing page preview', 'hero section', 'services/packages', 'FAQ', 'demo only']:
    assert marker in js, f'missing V4.0 marker {marker}'

assert state['client_handoff_pack_v41']['safety']['static_snapshot'] is True
assert state['client_handoff_pack_v41']['safety']['external_writes'] is False
assert state['client_handoff_pack_v41']['safety']['live_booking_writes'] is False
for marker in ['client-handoff-pack-v41', 'client-facing preview', 'owner review checklist', 'QA evidence', 'revision plan', 'demo only']:
    assert marker in js, f'missing V4.1 marker {marker}'

assert state['handoff_review_matrix_v42']['safety']['static_snapshot'] is True
for marker in ['handoff-review-matrix-v42', 'owner-facing review', 'revision matrix', 'demo-only guardrails']:
    assert marker in js, f'missing V4.2 marker {marker}'
assert state['revision_request_demo_v43']['safety']['live_submit'] is False
for marker in ['revision-request-demo-v43', 'demo-only banner', 'structured revision preview', 'priority', 'severity', 'no live submit']:
    assert marker in js, f'missing V4.3 marker {marker}'
assert state['webstudio_showcase_v44']['safety']['no_fake_testimonials'] is True
for marker in ['webstudio-showcase-v44', 'Automated premium website studio', 'Lead Capture', 'Order Builder', 'Package Generator', 'Page Builder', 'Demo Assembly', 'Handoff']:
    assert marker in js, f'missing V4.4 marker {marker}'
assert state['pricing_package_catalog_v45']['safety']['pricing_draft'] is True
for marker in ['pricing-packages-v45', 'Starter Landing', 'Premium Website', 'Premium Website + Intake Bot', 'Business Automation Pack', 'demo only', 'pricing draft']:
    assert marker in js, f'missing V4.5 marker {marker}'
assert state['route_health_dashboard_v46']['safety']['read_only'] is True
for marker in ['route-health-v46', 'route table', 'HTTP status', 'marker status', 'latest published commit', 'known blockers']:
    assert marker in js, f'missing V4.6 marker {marker}'
for marker in ['morning-summary-v47', 'morning executive summary', 'completed phases', 'published routes', 'supabase updates', 'github commits']:
    assert marker in js, f'missing V4.7 marker {marker}'

assert state['offer_detail_layer_v58']['safety']['static_snapshot'] is True
assert state['offer_detail_layer_v58']['safety']['live_submission'] is False
assert state['offer_detail_layer_v58']['safety']['browser_side_secrets'] is False
for marker in ['offer-detail-v58', 'public sales pages', 'offer detail layer', 'custom quote', 'no fake testimonials', 'no guaranteed outcomes', 'no live writes']:
    assert marker in js, f'missing V5.8 marker {marker}'

assert state['ops_memory_consistency_v59']['safety']['static_snapshot'] is True
assert state['ops_memory_consistency_v59']['safety']['supabase_write'] is False
assert state['ops_memory_consistency_v59']['safety']['browser_side_secrets'] is False
for marker in ['ops-memory-consistency-v59', 'operational memory consistency', 'github actions pages', 'public route marker', 'supabase blocked', 'no browser-side secrets', 'no live writes']:
    assert marker in js, f'missing V5.9 marker {marker}'

assert state['owner_executive_report_v60']['safety']['static_snapshot'] is True
assert state['owner_executive_report_v60']['safety']['live_submission'] is False
assert state['owner_executive_report_v60']['safety']['browser_side_secrets'] is False
for marker in ['owner-executive-report-v60', 'owner executive report', 'shipped routes', 'proof gates', 'owner next actions', 'no live writes']:
    assert marker in js, f'missing V6.0 marker {marker}'

assert state['phase_proof_matrix_v61']['safety']['static_snapshot'] is True
assert state['phase_proof_matrix_v61']['safety']['live_submission'] is False
assert state['phase_proof_matrix_v61']['safety']['browser_side_secrets'] is False
for marker in ['phase-proof-matrix-v61', 'phase acceptance', 'proof matrix', 'build smoke scan', 'actions pages markers', 'no live writes']:
    assert marker in js, f'missing V6.1 marker {marker}'

assert len(state['bot_activity']['activity']) >= 3
assert 'PASS' in state['bot_activity']['status_chips']
assert 'BLOCKED' in state['bot_activity']['status_chips']
assert state['work_factory_control']['safety']['browser_side_supabase'] is False
assert state['work_factory_control']['safety']['browser_side_github_token'] is False
assert 'NEEDS_OWNER' in state['work_factory_control']['status_chips']
assert state['work_factory_control']['counts']['completed'] >= 1
assert state['owner_command_center']['safety']['browser_side_supabase'] is False
assert state['owner_command_center']['safety']['browser_side_github_token'] is False
assert state['order_builder']['safety']['public_demo_only'] is True
assert state['order_builder']['safety']['real_sensitive_client_data'] is False
assert state['delivery_handoff_composer_v33']['status'] == 'PASS_LOCAL_READY'
assert state['delivery_handoff_composer_v33']['owner_action_required'] is False
assert state['delivery_handoff_composer_v33']['schema_version'] == 'webstudio.delivery-handoff-composer.v48'
assert state['delivery_handoff_composer_v33']['feature'] == 'issue_response_playbook_v48'
assert state['delivery_handoff_composer_v33']['acceptance_tracker']['storage_key'] == 'webstudio.delivery.acceptanceTracker.v34'
assert len(state['delivery_handoff_composer_v33']['client_ready_checklist']) >= 5
assert len(state['delivery_handoff_composer_v33']['acceptance_tracker']['rows']) >= 6
assert len(state['delivery_handoff_composer_v33']['handoff_risk_digest_v36']['risks']) >= 3
assert state['delivery_handoff_composer_v33']['handoff_risk_digest_v36']['mode'] == 'read_only_owner_review'
assert state['delivery_handoff_composer_v33']['delivery_evidence_binder_v38']['schema_version'] == 'webstudio.delivery-evidence-binder.v38'
assert len(state['delivery_handoff_composer_v33']['delivery_evidence_binder_v38']['evidence']) >= 5
assert state['delivery_handoff_composer_v33']['owner_signoff_packet_v39']['schema_version'] == 'webstudio.delivery-owner-signoff-packet.v39'
assert len(state['delivery_handoff_composer_v33']['owner_signoff_packet_v39']['required_sections']) >= 5
assert state['delivery_handoff_composer_v33']['launch_readiness_receipt_v40']['schema_version'] == 'webstudio.delivery-launch-readiness-receipt.v40'
assert len(state['delivery_handoff_composer_v33']['launch_readiness_receipt_v40']['receipt_rows']) >= 4
assert state['delivery_handoff_composer_v33']['evidence_freshness_monitor_v41']['schema_version'] == 'webstudio.delivery-evidence-freshness-monitor.v41'
assert len(state['delivery_handoff_composer_v33']['evidence_freshness_monitor_v41']['checks']) >= 5
assert state['delivery_handoff_composer_v33']['approval_decision_ledger_v42']['schema_version'] == 'webstudio.delivery.approval-decision-ledger.v42'
assert state['delivery_handoff_composer_v33']['approval_decision_ledger_v42']['persistence'] == 'webstudio.delivery.approvalDecisionLedger.v42'
assert len(state['delivery_handoff_composer_v33']['approval_decision_ledger_v42']['required_decisions']) >= 4
assert state['delivery_handoff_composer_v33']['handoff_manifest_v43']['schema_version'] == 'webstudio.delivery-handoff-manifest.v43'
assert len(state['delivery_handoff_composer_v33']['handoff_manifest_v43']['evidence_requirements']) >= 5
assert len(state['delivery_handoff_composer_v33']['handoff_manifest_v43']['handoff_steps']) >= 4
assert state['delivery_handoff_composer_v33']['handoff_rehearsal_checklist_v44']['schema_version'] == 'webstudio.delivery-handoff-rehearsal-checklist.v44'
assert len(state['delivery_handoff_composer_v33']['handoff_rehearsal_checklist_v44']['checks']) >= 6
assert state['delivery_handoff_composer_v33']['handoff_go_no_go_matrix_v45']['schema_version'] == 'webstudio.delivery-handoff-go-no-go-matrix.v45'
assert len(state['delivery_handoff_composer_v33']['handoff_go_no_go_matrix_v45']['criteria']) >= 6
assert state['delivery_handoff_composer_v33']['client_acceptance_receipt_v46']['schema_version'] == 'webstudio.delivery-client-acceptance-receipt.v46'
assert len(state['delivery_handoff_composer_v33']['client_acceptance_receipt_v46']['receipt_sections']) >= 6
assert state['delivery_handoff_composer_v33']['client_acceptance_receipt_v46']['default_acceptance_status'] == 'PASS_WITH_APPROVAL_BLOCKERS'
assert state['delivery_handoff_composer_v33']['issue_response_playbook_v48']['schema_version'] == 'webstudio.delivery-issue-response-playbook.v48'
assert len(state['delivery_handoff_composer_v33']['issue_response_playbook_v48']['scenarios']) >= 5
assert state['delivery_handoff_composer_v33']['issue_response_playbook_v48']['mode'] == 'read_only_issue_response_playbook'
assert state['delivery_handoff_composer_v33']['followup_planner_v37']['storage_key'] == 'webstudio.delivery.followupPlanner.v37'
assert len(state['delivery_handoff_composer_v33']['followup_planner_v37']['tasks']) >= 5
assert 'enabled' in state['work_factory']
assert state['kanban'].get('executable_mirror_count', 0) == 0
controller = state['continuation_controller']
expected_checkpoint_path = str(Path(os.environ.get('WORKSPACE', '/workspace')) / 'output' / 'current-task-continuation-checkpoint.md')
if ci_mode:
    assert controller['checkpoint_path'] in {'/workspace/output/current-task-continuation-checkpoint.md', expected_checkpoint_path}
else:
    assert controller['checkpoint_path'] == '/workspace/output/current-task-continuation-checkpoint.md'
assert controller['terminal_protocol']['silent_exit_allowed'] is False
assert controller['terminal_protocol']['bare_partial_allowed'] is False
assert 'PARTIAL' in controller['terminal_protocol']['forbidden_final_states']
assert controller['terminal_protocol']['success_action'] == 'kanban_complete'
assert controller['terminal_protocol']['blocker_action'] == 'kanban_block'
assert controller['final_status'] in ['PASS', 'CONTINUING', 'BLOCKED']
assert state['agent_workflow']['protocol']['continuation_controller']['terminal_protocol']['silent_exit_allowed'] is False
# Host continuation checkpoint exists only on the WebStudio host. GitHub Actions
# sets WEBSTUDIO_CI=1 and validates the portable checkpoint path embedded in the
# generated state, but skips this host-only filesystem assertion.
if not ci_mode:
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
if not ci_mode:
    assert {item['product_line'] for item in progress['items']} >= {'D1', 'D2', 'D3'}
assert isinstance(state['control_plane_history'].get('snapshots', []), list), 'control plane history snapshots must be a list'



if not ci_mode:
    real_client = state['real_client_execution_v30']
    assert real_client['status'] in ['PASS_LOCAL_READY', 'PASS']
    assert real_client['flow_stages'] >= 15
    assert real_client['d1_status'] == 'PASS'
    assert real_client['d2_status'] == 'PASS'
    delivery = state['delivery_system_v29']
    assert delivery['status'] == 'PASS'
    assert delivery['pipeline_stages'] >= 14
    assert delivery['qa_blocks'] >= 14
    assert delivery['github_mainline']['status'] == 'MAINLINE_MERGED'
    assert state['delivery_pipeline_v29']['status'] in ['PASS_LOCAL_READY', 'PASS']
    client_intake = state['client_intake_v27']
    assert client_intake['status'] in ['PASS', 'IN_PROGRESS']
    assert client_intake['wizard']['questions'] >= 17
    assert client_intake['order_builder']['packages'] >= 15
    assert client_intake['premium_site_factory']['steps'] >= 12
    if state['github_readiness'].get('status') == 'UPDATED':
        assert state['github_readiness'].get('latest_commit_sha'), 'UPDATED PR needs latest commit SHA'
        assert state['github_readiness'].get('pushed_at'), 'UPDATED PR needs pushed_at'
    assert state['kanban']['task_total'] >= 100
assert 'real-clients' in html
assert 'capability-section' in css
assert 'visual-kanban-board' in css
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

assert 'premium-factory' in html

# v32/v34 premium artifact state is host-derived; keep it strict locally, while
# GitHub Actions verifies the static routes and JS bundles are present.
assert 'premiumWebsiteGenerator' in js
assert 'premium-generator' in html
assert 'premiumFactoryV34' in js
assert 'premium-factory-v34' in html
assert 'generated-demo-site-v35' in html
assert 'generatedDemoSiteV35' in js
assert 'webstudio-v34-demo-client-order' in js
if not ci_mode:
    premium = state['premium_visual_motion_v31']
    assert premium['status'] == 'PASS'
    assert premium['interview_engine_status'] == 'PASS'
    assert len(premium.get('concepts', [])) == 3
    generator = state['premium_website_generator_v32']
    assert generator['status'] == 'PASS'
    assert generator.get('paths')
    assert generator.get('client_004', {}).get('qa_score', 0) >= 90
    v34 = state['premium_factory_v34']
    assert v34['status'] == 'PASS'
    assert v34.get('qa_score', 0) >= 95


for marker in ['client-portal-preview-v62', 'PROJECT_READY', 'NEEDS_ASSETS', 'NEEDS_REVIEW', 'APPROVED_FOR_DEMO', 'BLOCKED_FOR_LIVE', 'NEXT_MILESTONE']:
    assert marker in js or marker in json.dumps(state)
assert state['client_portal_preview_v62']['safety']['read_only'] is True
assert state['client_portal_preview_v62']['safety']['browser_side_secrets'] is False
assert state['client_portal_preview_v62']['safety']['live_submission'] is False
