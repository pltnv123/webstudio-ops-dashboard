import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
const statePath = process.argv[2] || 'public/data/webstudio-control-plane-state.json';
const outPath = process.argv[3] || 'public/data/webstudio-control-plane-history.json';
const state = JSON.parse(readFileSync(statePath, 'utf8'));
const counts = state.production_pipeline?.logical_counts || {};
const snap = {
  at: new Date().toISOString(),
  total: state.production_pipeline?.counts?.total || 0,
  active: state.production_pipeline?.counts?.active || 0,
  review: counts.review || 0,
  blocked: counts.blocked || 0,
  completed: counts.done || state.work_factory?.counts?.completed || 0,
  archived: counts.archived || 0
};
let history = {schema_version:'webstudio-control-plane-history.v1', snapshots:[]};
try { history = JSON.parse(readFileSync(outPath, 'utf8')); } catch {}
history.snapshots = [...(history.snapshots || []), snap].slice(-48);
mkdirSync(dirname(outPath), {recursive:true});
writeFileSync(outPath, JSON.stringify(history, null, 2) + '\n');
console.log(`history snapshots=${history.snapshots.length} out=${outPath}`);
