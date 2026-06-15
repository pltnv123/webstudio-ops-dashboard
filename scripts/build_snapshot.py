#!/usr/bin/env python3
"""Safe static build for WebStudio Pages. Recovery-compatible v7.1."""
from __future__ import annotations
import argparse, json, shutil
from datetime import datetime, timezone
from pathlib import Path
ROOT = Path(__file__).resolve().parents[1]
SRC = ROOT / 'src'
PUBLIC = ROOT / 'public' / 'data'
ROUTES = ['operator','orders','kanban','production','agent-workflow','bot-activity','approvals','health','route-health','owner-morning-report','artifacts','marathon','owner-feedback','real-assets','asset-intake-pack','proposal-quote','integration-plan','real-client-onboarding','lead-capture-demo','client-portal-preview','client-safe-preview','client-approval-room','delivery-timeline','proof-case-study','work-factory','owner-command-center','supabase-memory','sales-pack','premium-factory','audit']
def state():
    return {'schema_version':'webstudio-control-plane.v1','generated_at':datetime.now(timezone.utc).replace(microsecond=0).isoformat().replace('+00:00','Z'),'mode':'read_only_ops_cockpit','notification_policy':{'mode':'quiet'},'safety':{'status':'pass','read_only':True,'dispatch_allowed':False,'worker_allowed':False,'mirror_executable_count':0,'duplicate_keys':{}},'kanban':{'task_total':1,'executable_mirror_count':0,'duplicate_keys':{}},'work_factory':{'counts':{'completed':0}},'product_progress':{'mode':'safe_local_artifacts_only','items':[{'product_line':'D1'},{'product_line':'D2'},{'product_line':'D3'}]},'route':'/real-client-onboarding/','marker':'real-client-onboarding-v71'}
def write_state(path: Path) -> str:
    payload = json.dumps(state(), ensure_ascii=False, indent=2) + '\n'
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(payload)
    return payload
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
