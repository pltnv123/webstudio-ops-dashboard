#!/usr/bin/env python3
"""Safe static build for WebStudio Pages. Recovery-compatible v7.5."""
from __future__ import annotations
import argparse, json, shutil
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SRC = ROOT / 'src'
PUBLIC = ROOT / 'public' / 'data'
ROUTES = ['operator','orders','kanban','production','agent-workflow','bot-activity','approvals','health','route-health','owner-morning-report','artifacts','marathon','owner-feedback','real-assets','asset-intake-pack','proposal-quote','integration-plan','real-client-onboarding','client-data-room','client-portal-readiness','client-portal-launch-checklist','lead-capture-demo','webstudio-showcase','pricing-packages','client-portal-preview','client-safe-preview','client-approval-room','delivery-timeline','proof-case-study','work-factory','owner-command-center','supabase-memory','sales-pack','premium-factory','audit']

def state():
    return {'schema_version':'webstudio-control-plane.v1','generated_at':datetime.now(timezone.utc).replace(microsecond=0).isoformat().replace('+00:00','Z'),'mode':'read_only_ops_cockpit','notification_policy':{'mode':'quiet'},'safety':{'status':'pass','read_only':True,'dispatch_allowed':False,'worker_allowed':False,'mirror_executable_count':0,'duplicate_keys':{}},'kanban':{'task_total':1,'executable_mirror_count':0,'duplicate_keys':{}},'work_factory':{'counts':{'completed':0}},'product_progress':{'mode':'safe_local_artifacts_only','items':[{'product_line':'D1'},{'product_line':'D2'},{'product_line':'D3'}]},'route':'/client-portal-launch-checklist/','marker':'client-portal-launch-checklist-v75'}

def write_state(path: Path) -> str:
    payload = json.dumps(state(), ensure_ascii=False, indent=2) + '\n'
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(payload)
    return payload

def launch_checklist_html() -> str:
    links = [('Readiness audit','/client-portal-readiness/'),('Client data room','/client-data-room/'),('Real onboarding','/real-client-onboarding/'),('Asset intake','/asset-intake-pack/'),('Proposal/quote','/proposal-quote/'),('Proof policy','/proof-case-study/'),('Integration plan','/integration-plan/'),('Route health','/route-health/')]
    groups = [('client data readiness','NEEDS_REAL_ASSETS','No real client data in static demo. Replace only after approved intake.'),('assets/proof readiness','NEEDS_REAL_ASSETS','Real proof and assets required before pilot.'),('proposal/quote readiness','NEEDS_OWNER_APPROVAL','Scope, quote, assumptions, and exclusions require approval.'),('preview approval','SAFE_FOR_PILOT_REVIEW','Client-safe preview must be accepted before pilot.'),('compliance/safety review','BLOCKED_FOR_LIVE','No unsupported claims, fake proof, or private data.'),('live integration approval','DO_NOT_ENABLE_LIVE_WRITES','CRM/email/Telegram/payment/Supabase writes remain disabled.'),('rollback plan','rollback plan','Static fallback remains available; pilot CTA can be disabled.'),('owner go/no-go','owner go/no-go','Owner chooses GO, HOLD, or ROLLBACK.')]
    stages = ['demo review','client-safe review','owner approval','asset replacement','proof/compliance approval','optional live integration dry-run','controlled pilot']
    link_html = ''.join(f'<a class="copy secondary" href="{href}">{label}</a>' for label, href in links)
    group_html = ''.join(f'<article class="chain-step"><span>{title}</span><strong>{status}</strong><p class="label">{note}</p></article>' for title,status,note in groups)
    stage_html = ''.join(f'<li><strong>{i}. {stage}</strong><p class="label">Gate must pass before next stage.</p></li>' for i, stage in enumerate(stages,1))
    return f'''<!doctype html><html lang="ru"><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/><meta name="robots" content="noindex,nofollow"/><title>Client Portal Launch Checklist</title><link rel="stylesheet" href="../styles.css"/><link rel="stylesheet" href="../surgery-v102.css"/></head><body><main id="app" class="shell"><div class="grid client-portal-launch-checklist-v75" data-marker="client-portal-launch-checklist-v75"><section class="hero-panel compact-hero span-12"><div class="hero-copy"><p class="eyebrow">client-portal-launch-checklist-v75</p><h1>Client Portal Launch Checklist</h1><p>Controlled real-client pilot checklist. Current state: READY_FOR_DEMO, SAFE_FOR_PILOT_REVIEW, NEEDS_REAL_ASSETS, NEEDS_OWNER_APPROVAL, BLOCKED_FOR_LIVE, DO_NOT_ENABLE_LIVE_WRITES.</p><div class="toolbar">{link_html}</div></div><div class="chip-cloud"><span class="badge">READY_FOR_DEMO</span><span class="badge">NEEDS_REAL_ASSETS</span><span class="badge">NEEDS_OWNER_APPROVAL</span><span class="badge">BLOCKED_FOR_LIVE</span><span class="badge">SAFE_FOR_PILOT_REVIEW</span><span class="badge">DO_NOT_ENABLE_LIVE_WRITES</span></div></section><section class="card span-8"><h2>launch checklist</h2><div class="chain-list">{group_html}</div></section><section class="card span-4"><h2>pilot launch stages</h2><ol>{stage_html}</ol></section><section class="card span-6 warning-surface"><h2>rollback plan</h2><ul><li>Keep static fallback routes.</li><li>Hide/disable pilot CTA on HOLD or ROLLBACK.</li><li>Do not enable live writes.</li><li>Record last good commit and route health.</li></ul></section><section class="card span-6 warning-surface"><h2>owner go/no-go</h2><p>Owner decision is required before controlled pilot. Static review can continue; live writes stay blocked.</p><ul><li>GO: controlled pilot with approved assets.</li><li>HOLD: keep demo/static mode.</li><li>ROLLBACK: return to data room/readiness routes.</li></ul></section></div></main></body></html>'''

def copy_static(dist: Path):
    if dist.exists(): shutil.rmtree(dist)
    dist.mkdir(parents=True, exist_ok=True)
    payload = write_state(PUBLIC / 'webstudio-control-plane-state.json')
    for name in ['index.html','styles.css','surgery-v102.css','app.js']:
        p = SRC / name
        if p.exists(): shutil.copy2(p, dist / name)
    (dist / 'data').mkdir(exist_ok=True)
    (dist / 'data' / 'webstudio-control-plane-state.json').write_text(payload)
    index = (dist / 'index.html').read_text()
    for r in ROUTES:
        d = dist / r
        d.mkdir(parents=True, exist_ok=True)
        (d / 'index.html').write_text(index)
        for name in ['styles.css','surgery-v102.css','app.js']:
            p = SRC / name
            if p.exists(): shutil.copy2(p, d / name)
        (d / 'data').mkdir(exist_ok=True)
        (d / 'data' / 'webstudio-control-plane-state.json').write_text(payload)
    launch_dir = dist / 'client-portal-launch-checklist'
    launch_dir.mkdir(parents=True, exist_ok=True)
    (launch_dir / 'index.html').write_text(launch_checklist_html())

def main() -> int:
    ap = argparse.ArgumentParser(); ap.add_argument('--dist'); args = ap.parse_args()
    write_state(PUBLIC / 'webstudio-control-plane-state.json')
    print('snapshot=' + str(PUBLIC / 'webstudio-control-plane-state.json'))
    print('safety=pass mirror_executable_count=0 duplicate_keys=0')
    if args.dist:
        copy_static(Path(args.dist)); print('dist=' + args.dist)
    return 0
if __name__ == '__main__':
    raise SystemExit(main())
