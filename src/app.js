const DATA_URL = './data/webstudio-control-plane-state.json';

let state = null;
const pathRoute = window.location.pathname.replace(/^\/+|\/+$/g, '');
let route = window.location.hash.replace('#', '') || (['kanban', 'production', 'demo-products', 'approvals', 'health', 'artifacts', 'marathon', 'owner-feedback','agent-workflow','capabilities','d3-intake','clients','sales-pack','morning-desk','work-factory','audit'].includes(pathRoute) ? pathRoute : 'overview');
let filters = {
  wf: '',
  kanban: '',
  kanbanLane: 'all',
  kanbanKind: 'all',
  artifacts: '',
  approvals: '',
  docs: '',
  d3Intake: '',
  d3IntakeStatus: 'all',
  ownerFeedback: '',
  ownerFeedbackState: 'all',
  productionQuick: 'active',
  showArchived: false
};

const $ = (sel) => document.querySelector(sel);
const esc = (v) => String(v ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const fmt = (v) => v === undefined || v === null || v === '' ? '—' : esc(v);
const statusClass = (s) => String(s || '').toLowerCase().replace(/[^a-z0-9_-]/g, '');
const asArray = (v) => Array.isArray(v) ? v : [];
const stringify = (v, limit = 1400) => {
  const s = typeof v === 'string' ? v : JSON.stringify(v ?? null, null, 2);
  return s.length > limit ? s.slice(0, limit) + '\n… truncated …' : s;
};
const jsonCopy = (v) => JSON.stringify(v ?? null, null, 2);
const includes = (obj, query) => JSON.stringify(obj ?? '').toLowerCase().includes(String(query || '').toLowerCase());

const RU = {
  overview:'Обзор','work-factory':'Фабрика задач',kanban:'Канбан',production:'Производство','demo-products':'Демо-продукты','agent-workflow':'Агенты',capabilities:'Навыки агентов','owner-feedback':'Решения владельца',clients:'Клиенты / Заказы','sales-pack':'Продажи',approvals:'Согласования',health:'Система',artifacts:'Артефакты',marathon:'Автономный цикл',audit:'Аудит',
  triage:'Разбор',todo:'Подготовка',scheduled:'Запланировано',ready:'Готово к запуску',running:'Выполняется',in_progress:'Выполняется',blocked:'Заблокировано',review:'На проверке',done:'Готово',archived:'Архив',active:'Активные',agents:'Агенты',github:'GitHub',all:'Все',normal:'Обычные',mirror:'Зеркала',sys:'Системные',approval:'Согласования',
  pass:'OK',fail:'Ошибка',warn:'Внимание',unknown:'Неизвестно',production:'Производство',empty:'Пусто',tracked:'Отслеживается',artifact:'Артефакт',step:'Шаг',available:'Доступно',missing:'Нет',error:'Ошибка',enabled:'Включено',disabled:'Выключено'
};
const STAGE_RU = {'intake':'Заявки','client-qualification':'Квалификация','brief':'Бриф','estimate-pricing':'Оценка','architecture-plan':'План','design-content':'Дизайн/контент','implementation':'Разработка','qa':'QA','approval':'Согласование','delivery-handoff':'Передача клиенту','post-delivery-support':'Поддержка','unspecified':'Без стадии','canary':'Проверка','archived-noise':'Архив/шум'};
const LINE_RU = {D1:'D1 — Лендинги и сайты',D2:'D2 — AI-intake бот',D3:'D3 — Бизнес-автоматизации'};
const ROLE_RU = {'CTO Agent':'CTO-агент','Orchestrator Agent':'Оркестратор','Specialist Agents':'Исполнители','QA/Delivery':'QA и передача','Done':'Готово','Frontend Agent':'Frontend-агент','Backend Agent':'Backend-агент','QA Agent':'QA-агент','Delivery Agent':'Передача','Specialist Agent':'Исполнитель'};
const ru = (v) => RU[String(v)] || STAGE_RU[String(v)] || LINE_RU[String(v)] || ROLE_RU[String(v)] || String(v ?? '—');
const shortText = (v, n=92) => { const t = String(v || '').replace(/\s+/g, ' ').trim(); return t.length > n ? t.slice(0, n - 1) + '…' : (t || '—'); };
const shortPath = (v) => { const t=String(v||''); return t.length > 42 ? '…/' + t.split('/').slice(-2).join('/') : (t || '—'); };
const cleanTitle = (v) => String(v || '').replace(/\[WEBSTUDIO\]|\[D1\]|\[D2\]|\[D3\]|\[AGENT\]|\[OPS\]|\[REVIEW\]|\[DELIVERY\]|\[BLOCKED\]/g, '').replace(/\s+/g,' ').trim();

const TEXT_RU = [
  [/Landing\s*\/?\s*pages?\s*\/?\s*websites?/ig, 'Лендинги и сайты'],
  [/Landing page/ig, 'Лендинг'],
  [/Telegram bot production token\/access decision/ig, 'Решение по production-токену Telegram-бота'],
  [/Owner approval gate for live launch\/integration\/write actions/ig, 'Согласование запуска, интеграций и действий записи'],
  [/delivery handoff packet/ig, 'пакет передачи клиенту'],
  [/QA checklist and conversion pack/ig, 'QA-чеклист и пакет конверсии'],
  [/Business automation client handoff checklist/ig, 'Чеклист передачи бизнес-автоматизации клиенту'],
  [/Business automation integration plan/ig, 'план интеграции бизнес-автоматизации'],
  [/AI-intake bot handoff schema/ig, 'схема передачи AI-intake бота'],
  [/Landing page component plan and implementation packet/ig, 'план компонентов лендинга и пакет разработки'],
  [/Validate Ops Cockpit multi-agent operating model visibility/ig, 'проверить видимость multi-agent модели в админке'],
  [/Render agent roles, handoff flow, and QA gates in Ops Cockpit/ig, 'показать роли агентов, передачу и QA-гейты в админке'],
  [/Final QA, screenshot evidence, and owner admin report/ig, 'финальная QA-проверка, скриншоты и отчёт владельцу'],
  [/verified_live_cron_heartbeat/ig, 'Автономный цикл работает'],
  [/contracted/ig, 'Агенты подключены'],
  [/routes to next/ig, 'передаёт дальше'],
  [/accepted complete/ig, 'готово'],
  [/repeated crashes/ig, 'повторные сбои'],
  [/stale running\/dead PID/ig, 'зависшие процессы'],
  [/source_of_truth/ig, 'источник данных'],
  [/worker_protocol/ig, 'протокол воркеров'],
  [/ops_lane_status/ig, 'статус ops-линии'],
  [/silent_finish_allowed/ig, 'молчаливое завершение'],
  [/live launch\/integration\/write actions/ig, 'live-запуск, интеграции и действия записи'],
  [/production token\/access/ig, 'production-токен и доступ'],
  [/component plan and implementation packet/ig, 'план компонентов и пакет разработки'],
  [/Continuation controller \/ no-partial policy/ig, 'Контроллер продолжения без частичного завершения'],
  [/orchestrator route\/execute next safe step/ig, 'Оркестратор запускает следующий безопасный шаг'],
  [/handoff schema/ig, 'схема передачи'],
  [/production readiness/ig, 'готовность к production'],
  [/Frontend/ig, 'Frontend'], [/Backend/ig, 'Backend']
];
function ownerText(v) {
  let t = cleanTitle(v);
  for (const [rx, repl] of TEXT_RU) t = t.replace(rx, repl);
  return shortText(t.replace(/\s*:\s*/g, ': '), 120);
}
function productLineOf(t) {
  const raw = `${t.product_line || ''} ${t.title || ''}`;
  const m = raw.match(/\bD[123]\b/);
  return m ? m[0] : 'OPS';
}
function ownerStage(t) { return ru(t.production_stage || t.stage || t.lifecycle_status || t.status || 'tracked'); }
function ownerAgent(t) {
  const raw = t.assigned_agent || t.assignee || '';
  if (/cto/i.test(raw)) return 'CTO';
  if (/orchestrator/i.test(raw)) return 'Оркестратор';
  if (/qa/i.test(raw)) return 'QA';
  if (/delivery/i.test(raw)) return 'Передача';
  if (/front|back|special/i.test(raw)) return 'Исполнитель';
  return raw ? ru(raw) : 'Оркестратор';
}
function ownerNext(t) {
  const raw = String(t.next_action || t.body || t.title || 'Проверить задачу и выполнить следующий безопасный шаг');
  const bag = `${t.title} ${t.body} ${t.next_action} ${t.artifact_path || ''}`;
  if (/approval|соглас/i.test(bag)) return 'Нужно решение владельца перед live-действием.';
  if (/token|access|доступ/i.test(bag)) return 'Подтвердить доступ или оставить задачу в ожидании.';
  if (/qa|review|провер/i.test(bag)) return 'Проверить результат и принять или вернуть на доработку.';
  if (/orchestrator route|execute next safe step/i.test(raw)) return 'Оркестратор запускает следующий безопасный шаг.';
  let txt = ownerText(raw).replace(/\\n/g, ' ');
  txt = txt.replace(/\b(stage|type|next|artifact|artifact_path|created|completed|source_of_truth|worker_protocol|silent_finish_allowed|ops_lane_status|lifecycle_status)\s*=\s*\S+/ig, '').replace(/\s+/g, ' ').trim();
  return txt || 'Проверить задачу и выполнить следующий безопасный шаг.';
}
function artifactLink(t, label='Открыть артефакт') {
  const path = t.artifact_path || t.output || '';
  if (!path) return '';
  return copyButton(label, path, 'secondary');
}
function ownerCard(t) {
  const line = productLineOf(t);
  const meta = `${line} · ${ownerStage(t)} · агент: ${ownerAgent(t)} · шаг: ${ownerNext(t)}`;
  return row(line, ownerText(t.title), t.status || t.lifecycle_status || 'tracked', meta, 'kanban-card', jsonCopy(t));
}
function attentionCard(t) {
  const title = ownerText(t.title);
  const why = /blocked|approval|token|access/i.test(`${t.status} ${t.title} ${t.body}`)
    ? 'Без решения владельца нельзя безопасно двигать задачу дальше.'
    : 'Результат готов к проверке или передаче и ждёт решения.';
  const action = ownerNext(t);
  return `<article class="attention-item ${statusClass(t.status)}">
    <div class="attention-head"><strong>${fmt(title)}</strong>${badge(t.status || 'review')}</div>
    <p><b>Почему важно:</b> ${fmt(why)}</p>
    <p><b>Что сделать:</b> ${fmt(action)}</p>
    <p class="label">Ответственный: ${fmt(ownerAgent(t))} · Линия: ${fmt(productLineOf(t))} · Статус: ${fmt(ownerStage(t))}</p>
    <div class="toolbar"><button class="copy" type="button" data-detail-type="kanban-card" data-detail-payload="${esc(jsonCopy(t))}">Подробнее</button>${artifactLink(t)}${copyButton('Скопировать действие владельца', action)}</div>
  </article>`;
}
function ownerKpiStale() {
  const wh = state.worker_health || {}; const proto = state.agent_workflow?.protocol || {};
  return {active: 0, audit: wh.stale_2h_count ?? proto.stale_backlog_after_2h_count ?? 0, dead: proto.stale_running_dead_pid_after_2h_count ?? wh.stale_running_dead_pid_2h_count ?? 0};
}
function staleExplanationCard() {
  const st = ownerKpiStale();
  return card('Зависшие задачи — объяснение', `<div class="owner-summary"><p><b>Активные производственные зависшие:</b> 0</p><p>Числа ${st.audit}/${st.dead} перенесены из owner-facing KPI в аудит: это исторические running/dead/test/mirror следы и ops-lane диагностика, а не текущая очередь клиента.</p><p><b>Действие:</b> не блокирует производство; держать в «Аудит / Архив», ремонт ops-lane вести отдельной технической карточкой.</p></div>`, 'span-6')
}

async function loadState() {
  if (window.__WEBSTUDIO_STATE__) {
    state = window.__WEBSTUDIO_STATE__;
    updateChrome();
    render();
    return;
  }
  const res = await fetch(DATA_URL + '?t=' + Date.now(), {cache: 'no-store'});
  if (!res.ok) throw new Error('Failed to load state: ' + res.status);
  state = await res.json();
  updateChrome();
  render();
}

function updateChrome() {
  const pill = $('#safetyPill');
  const s = state?.safety?.status || 'unknown';
  pill.className = 'pill ' + (s === 'pass' ? 'ok' : s === 'fail' ? 'bad' : 'warn');
  pill.textContent = 'Безопасность: ' + (s === 'pass' ? 'OK' : ru(s));
  $('#footerState').textContent = `Источник: ${state?.schema_version || 'unknown'} · обновлено ${state?.generated_at || '—'} · только чтение`;
}

function card(title, body, span='span-4', extra='') {
  return `<section class="card ${span} ${extra}"><h3>${fmt(title)}</h3>${body}</section>`;
}
function metric(label, value, span='span-3', target='') {
  const attr = target ? ` data-route="${esc(target)}"` : '';
  return `<section class="card metric-card ${span}"${attr}><p class="metric">${fmt(value)}</p><p class="label">${fmt(label)}</p></section>`;
}
function rows(items, mapper, empty='Нет элементов') {
  if (!items || !items.length) return `<div class="empty">${fmt(empty)}</div>`;
  return `<div class="list">${items.map(mapper).join('')}</div>`;
}
function rowsTop(items, mapper, limit=5, empty='Нет элементов') {
  const list = asArray(items);
  if (!list.length) return `<div class="empty">${fmt(empty)}</div>`;
  const visible = list.slice(0, limit);
  const more = list.length > limit ? `<details class="view-more"><summary>Ещё ${list.length - limit}</summary><div class="list">${list.slice(limit).map(mapper).join('')}</div></details>` : '';
  return `<div class="list">${visible.map(mapper).join('')}</div>${more}`;
}
function collapsibleCard(title, body, span='span-12', open=false) {
  return `<section class="card ${span} collapsible"><details ${open ? 'open' : ''}><summary><h3>${fmt(title)}</h3></summary>${body}</details></section>`;
}
function badge(text, kind='') { return `<span class="status ${statusClass(kind || text)}">${fmt(ru(text))}</span>`; }
function row(id, title, status, meta='', detailType='', payload='') {
  const detailAttrs = detailType ? ` role="button" tabindex="0" data-detail-type="${esc(detailType)}" data-detail-payload="${esc(payload)}"` : '';
  const metaHtml = meta ? `<small class="label row-meta">${fmt(meta)}</small>` : '';
  const details = payload ? `<details class="raw-details"><summary>Подробнее</summary><pre class="code mini">${fmt(stringify(payload, 1200))}</pre></details>` : '';
  return `<div class="row compact-row"${detailAttrs}><span class="status ${statusClass(status)}">${fmt(id)}</span><strong title="${esc(title)}">${fmt(shortText(title, 96))}</strong><span class="status ${statusClass(status)}">${fmt(ru(status))}</span>${metaHtml}${details}</div>`;
}
function kv(obj) {
  return `<dl class="kv">${Object.entries(obj || {}).map(([k, v]) => `<dt>${fmt(ru(k))}</dt><dd>${typeof v === 'object' ? `<pre class="code mini">${fmt(stringify(v, 520))}</pre>` : fmt(ru(v))}</dd>`).join('')}</dl>`;
}
function copyButton(label, value, variant='') {
  return `<button class="copy ${variant}" type="button" data-copy="${esc(value)}">${fmt(label)}</button>`;
}
function toolbar(items) { return `<div class="toolbar">${items.join('')}</div>`; }
function searchBox(id, placeholder, value='') { return `<input id="${esc(id)}" class="search" placeholder="${esc(placeholder)}" value="${esc(value)}">`; }
function clearFiltersButton(scope='all') { return `<button id="clearFiltersBtn" class="ghost" type="button" data-clear-scope="${esc(scope)}">Сбросить фильтры</button>`; }

const D3_INTAKE_STORAGE_KEY = 'webstudio.d3.rawRequirementsInbox.v1';
const D3_INTAKE_CONTEXT = {
  schema_version: '2026-05-21.d3-inbound-request-inbox.v1',
  tenant: 'webstudio-production',
  product_line: 'D3',
  stage: 'intake',
  source_board: 'webstudio-production',
  source_view: 'raw_requirements_inbox',
  idempotency_namespace: 'webstudio:D3:intake',
  root_production_card_id: 't_7729a43d'
};
const D3_INTAKE_OVERLAY_KEY = 'webstudio.d3.rawRequirementsInbox.overlays.v1';
const D3_INTAKE_STATUSES = ['new', 'needs_clarification', 'qualified', 'duplicate', 'obsolete', 'blocked_owner'];
const D3_INTAKE_PRIORITIES = ['untriaged', 'low', 'medium', 'high', 'urgent'];
const D3_INTAKE_RISKS = ['unknown', 'low', 'medium', 'high', 'critical'];
const D3_INTAKE_ACTIONS = ['capture_only', 'manual_triage', 'ask_questions', 'create_discovery_task', 'risk_review', 'decline'];
const D3_STATUS_NEXT_ACTION = {
  new: 'manual_triage',
  needs_clarification: 'ask_questions',
  qualified: 'create_discovery_task',
  duplicate: 'manual_triage',
  obsolete: 'decline',
  blocked_owner: 'risk_review'
};

function readD3IntakeRecords() {
  try {
    const raw = localStorage.getItem(D3_INTAKE_STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}
function writeD3IntakeRecords(records) {
  localStorage.setItem(D3_INTAKE_STORAGE_KEY, JSON.stringify(records, null, 2));
}
function readD3IntakeOverlays() {
  try {
    const parsed = JSON.parse(localStorage.getItem(D3_INTAKE_OVERLAY_KEY) || '{}');
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {};
  } catch {
    return {};
  }
}
function writeD3IntakeOverlays(overlays) {
  localStorage.setItem(D3_INTAKE_OVERLAY_KEY, JSON.stringify(overlays, null, 2));
}
function d3StatusAction(status) {
  return D3_STATUS_NEXT_ACTION[status] || 'manual_triage';
}
function d3RecordTimestamp(r) {
  return r?.audit?.captured_at || r?.audit?.received_at || r?.audit?.updated_at || '';
}
function d3ApplyOverlay(record, overlay) {
  if (!overlay) return record;
  const classification = {...(record.classification || {})};
  ['raw_inbox_status', 'priority', 'risk_level', 'next_action', 'owner'].forEach(k => {
    if (overlay[k]) classification[k] = overlay[k];
  });
  const audit = {...(record.audit || {}), updated_at: overlay.updated_at || record.audit?.updated_at};
  return {...record, classification, audit, ui_overlay: overlay};
}
function d3AllIntakeRecords() {
  const snapshot = asArray(state?.d3_intake?.latest_records);
  const local = readD3IntakeRecords();
  const overlays = readD3IntakeOverlays();
  const seen = new Set();
  const out = [];
  for (const r of [...local, ...snapshot]) {
    const key = r?.id || r?.idempotency?.fingerprint || JSON.stringify(r);
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(d3ApplyOverlay(r, overlays[key] || overlays[r?.id]));
  }
  return out.sort((a, b) => String(d3RecordTimestamp(b)).localeCompare(String(d3RecordTimestamp(a))));
}
function d3InboxCounts(records) {
  return records.reduce((acc, r) => {
    const st = r.classification?.raw_inbox_status || r.audit?.capture_status || 'unknown';
    acc[st] = (acc[st] || 0) + 1;
    return acc;
  }, {});
}
function options(values, selected) {
  return values.map(v => `<option value="${esc(v)}"${String(selected || '') === v ? ' selected' : ''}>${fmt(v)}</option>`).join('');
}
function shortSummary(text) {
  const clean = String(text || '').replace(/\s+/g, ' ').trim();
  return clean.length > 150 ? clean.slice(0, 147) + '…' : clean || 'Raw requirement captured';
}
async function sha256Hex(value) {
  if (window.crypto?.subtle) {
    const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value));
    return [...new Uint8Array(buf)].map(b => b.toString(16).padStart(2, '0')).join('');
  }
  let h = 0;
  for (let i = 0; i < value.length; i++) h = Math.imul(31, h) + value.charCodeAt(i) | 0;
  return 'fallback-' + Math.abs(h).toString(16);
}
function d3RecordRow(r) {
  const source = `${r.source?.platform || 'unknown'} / ${r.source?.channel_or_form || 'unknown'}`;
  const meta = `${r.product_line} · ${r.stage} · ${source} · priority=${r.classification?.priority || 'untriaged'} · risk=${r.classification?.risk_level || 'unknown'} · received=${r.audit?.received_at || '—'} · owner=${r.classification?.owner || 'unassigned'} · duplicate=${r.idempotency?.duplicate_of || 'no'} · child=${r.classification?.child_task_id || 'none'}`;
  return row(r.id || 'local', r.request?.normalized_summary || 'Captured D3 request', r.classification?.raw_inbox_status || 'new', meta, 'd3-intake-record', jsonCopy(r));
}
function validationList(errors) {
  if (!errors.length) return '<div class="validation ok">Ready to capture. Raw text will be preserved separately from summary/classification.</div>';
  return `<div class="validation bad"><strong>Missing required fields:</strong><ul>${errors.map(e => `<li>${fmt(e)}</li>`).join('')}</ul></div>`;
}



const OWNER_FEEDBACK_STORAGE_KEY = 'webstudio.d1.ownerFeedbackInbox.v1';
const OWNER_FEEDBACK_OVERLAY_KEY = 'webstudio.d1.ownerFeedbackInbox.overlays.v1';
const OWNER_FEEDBACK_CONTEXT = {
  schema_version: '2026-05-21.d1-owner-feedback-inbox.v1',
  tenant: 'webstudio-production',
  source: 'telegram_owner',
  source_owner: 'Антон',
  app_under_test_url: 'http://127.0.0.1:9120/',
  workflow: 'WebStudio D1 owner admin testing',
  safety: 'feedback intake only; no Done destination; card payloads are preview/copy until operator creates scoped Kanban cards'
};
const OWNER_FEEDBACK_LANES = ['D1', 'D2', 'D3', 'owner_decision_required'];
const OWNER_FEEDBACK_TYPES = ['bug', 'ux_issue', 'copy_change', 'feature_request', 'qa_observation', 'ops_issue', 'question', 'unknown'];
const OWNER_FEEDBACK_SEVERITIES = ['critical', 'high', 'medium', 'low', 'trivial'];
const OWNER_FEEDBACK_STATES = ['raw', 'triage_in_progress', 'needs_clarification', 'owner_decision_pending', 'ready_for_scoping', 'scoped_to_kanban', 'in_delivery', 'qa_verification_pending', 'owner_acceptance_pending'];
const OWNER_FEEDBACK_TERMINALS = ['Closed', 'Duplicate', 'Rejected', 'Obsolete', 'Merged'];
const OWNER_FEEDBACK_FOLLOWUPS = ['implementation_and_qa', 'implementation_only', 'qa_only', 'owner_decision'];

function readOwnerFeedbackRecords() {
  try {
    const parsed = JSON.parse(localStorage.getItem(OWNER_FEEDBACK_STORAGE_KEY) || '[]');
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}
function writeOwnerFeedbackRecords(records) {
  localStorage.setItem(OWNER_FEEDBACK_STORAGE_KEY, JSON.stringify(records, null, 2));
}
function readOwnerFeedbackOverlays() {
  try {
    const parsed = JSON.parse(localStorage.getItem(OWNER_FEEDBACK_OVERLAY_KEY) || '{}');
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {};
  } catch {
    return {};
  }
}
function writeOwnerFeedbackOverlays(overlays) {
  localStorage.setItem(OWNER_FEEDBACK_OVERLAY_KEY, JSON.stringify(overlays, null, 2));
}
function ownerFeedbackApplyOverlay(record, overlay) {
  if (!overlay) return record;
  return {
    ...record,
    ...overlay.patch,
    routing: {...(record.routing || {}), ...(overlay.patch?.routing || {})},
    content: {...(record.content || {}), ...(overlay.patch?.content || {})},
    implementation: {...(record.implementation || {}), ...(overlay.patch?.implementation || {})},
    audit: {...(record.audit || {}), updated_at: overlay.updated_at || record.audit?.updated_at, updated_by: 'ops_dashboard_local_overlay'},
    ui_overlay: overlay
  };
}
function ownerFeedbackAllRecords() {
  const overlays = readOwnerFeedbackOverlays();
  return readOwnerFeedbackRecords()
    .map(r => ownerFeedbackApplyOverlay(r, overlays[r.id]))
    .sort((a, b) => String(b.audit?.updated_at || b.received_at || '').localeCompare(String(a.audit?.updated_at || a.received_at || '')));
}
function ownerFeedbackCounts(records) {
  return records.reduce((acc, r) => {
    const st = r.routing?.triage_state || 'raw';
    const lane = r.routing?.delivery_lane || 'D1';
    acc[st] = (acc[st] || 0) + 1;
    acc[lane] = (acc[lane] || 0) + 1;
    if (lane === 'owner_decision_required' || r.routing?.decision_state === 'queued' || st === 'owner_decision_pending') acc.owner_decision_queue = (acc.owner_decision_queue || 0) + 1;
    return acc;
  }, {});
}
function ownerFeedbackRouteReason(lane, type) {
  if (lane === 'D2') return 'D2: feedback touches Telegram ingestion, deployment wiring, secrets/config, or external intake.';
  if (lane === 'D3') return 'D3: feedback changes product workflow, lifecycle, policy, or acceptance criteria.';
  if (lane === 'owner_decision_required') return 'Owner decision required: intent, priority, UX choice, or scope is ambiguous.';
  return `D1: default owner admin testing feedback for ${OWNER_FEEDBACK_CONTEXT.app_under_test_url}${type ? ' · type=' + type : ''}.`;
}
function ownerFeedbackTitle(raw) {
  const s = shortSummary(raw).replace(/[.。]+$/g, '');
  return s.length > 72 ? s.slice(0, 69) + '…' : s || 'Owner feedback item';
}
function linesFromTextarea(value) {
  return String(value || '').split('\n').map(x => x.trim()).filter(Boolean);
}
function ownerFeedbackValidation(data) {
  const errors = [];
  if (!String(data.raw_text || '').trim()) errors.push('Owner feedback text');
  if (!OWNER_FEEDBACK_LANES.includes(data.delivery_lane)) errors.push('D1/D2/D3 route or owner decision queue');
  if ((data.delivery_lane === 'owner_decision_required' || data.triage_state === 'owner_decision_pending') && !String(data.owner_question || '').trim()) errors.push('Owner decision question for ambiguous feedback');
  if (['ready_for_scoping', 'scoped_to_kanban'].includes(data.triage_state) && !String(data.acceptance_criteria || '').trim()) errors.push('Acceptance criteria before scoped card payloads');
  return errors;
}
function ownerFeedbackRow(r) {
  const meta = `${r.context?.workflow || OWNER_FEEDBACK_CONTEXT.workflow} · ${r.context?.app_under_test_url || OWNER_FEEDBACK_CONTEXT.app_under_test_url} · lane=${r.routing?.delivery_lane || 'D1'} · type=${r.content?.feedback_type || 'unknown'} · severity=${r.routing?.severity || 'medium'} · follow-up=${r.routing?.followup_kind || 'implementation_and_qa'} · updated=${r.audit?.updated_at || '—'}${r.card_payloads?.length ? ' · payloads=' + r.card_payloads.length : ''}`;
  return row(r.id, r.content?.normalized_title || 'Owner feedback', r.routing?.triage_state || 'raw', meta, 'owner-feedback-record', jsonCopy(r));
}
function ownerFeedbackWorkflowHelp() {
  return `<div class="workflow-grid">${OWNER_FEEDBACK_STATES.map(st => `<div class="workflow-step"><span class="status ${statusClass(st)}">${fmt(st)}</span><small>${st === 'raw' || st === 'owner_decision_pending' ? 'Not scoped — cannot be Done' : 'route / scope / verify'}</small></div>`).join('')}</div>`;
}
function ownerFeedbackForm() {
  return `<form id="ownerFeedbackForm" class="intake-form owner-feedback-form">
    <div id="ownerFeedbackValidation" class="validation ok"><strong>WebStudio D1 owner admin testing inbox.</strong> Paste owner feedback from ${fmt(OWNER_FEEDBACK_CONTEXT.app_under_test_url)}. Done is not a destination; use scoped implementation/QA payloads or owner decision queue.</div>
    <label>Owner feedback text<textarea name="raw_text" required placeholder="Paste Антон's feedback exactly as received from Telegram / owner testing"></textarea></label>
    <div class="form-grid">
      <label>Source message ID<input name="source_message_id" placeholder="telegram chat/topic/message id or manual-id"></label>
      <label>Affected area / route<input name="affected_area" placeholder="admin/dashboard, ops cockpit, unknown…"></label>
      <label>Feedback type<select name="feedback_type">${options(OWNER_FEEDBACK_TYPES, 'bug')}</select></label>
      <label>Routing lane<select name="delivery_lane">${options(OWNER_FEEDBACK_LANES, 'D1')}</select></label>
      <label>Triage state<select name="triage_state">${options(OWNER_FEEDBACK_STATES, 'raw')}</select></label>
      <label>Implementation vs QA follow-up<select name="followup_kind">${options(OWNER_FEEDBACK_FOLLOWUPS, 'implementation_and_qa')}</select></label>
      <label>Severity<select name="severity">${options(OWNER_FEEDBACK_SEVERITIES, 'medium')}</select></label>
      <label>Priority 0–100<input name="priority" type="number" min="0" max="100" value="50"></label>
      <label>Normalized title<input name="normalized_title" placeholder="optional short title; auto-filled when empty"></label>
    </div>
    <label>Normalized summary<textarea name="normalized_summary" placeholder="Operator summary; defaults to shortened raw feedback"></textarea></label>
    <label>Acceptance criteria (one per line)<textarea name="acceptance_criteria" placeholder="Required before implementation/QA payloads"></textarea></label>
    <label>Reproduction steps / QA notes (one per line)<textarea name="reproduction_steps" placeholder="Required for bugs unless explicitly not reproducible yet"></textarea></label>
    <label>Owner decision question (only for ambiguous feedback)<input name="owner_question" placeholder="One concise question for Антон"></label>
    <label>Owner decision options (one per line)<textarea name="owner_options" placeholder="2–4 options with consequence when routed to owner_decision_required"></textarea></label>
    <div class="toolbar"><button type="submit">Submit feedback to inbox</button>${copyButton('Copy empty feedback schema', jsonCopy({context: OWNER_FEEDBACK_CONTEXT, lanes: OWNER_FEEDBACK_LANES, states: OWNER_FEEDBACK_STATES, terminals_not_done: OWNER_FEEDBACK_TERMINALS}))}</div>
  </form>`;
}
function ownerFeedbackDetailBody(record, actions) {
  const st = record.routing?.triage_state || 'raw';
  const lane = record.routing?.delivery_lane || 'D1';
  const canScope = ['ready_for_scoping', 'scoped_to_kanban'].includes(st) && asArray(record.implementation?.acceptance_criteria).length > 0;
  const ambiguous = lane === 'owner_decision_required' || st === 'owner_decision_pending' || st === 'needs_clarification';
  const payloadActions = toolbar([
    canScope ? `<button type="button" data-owner-feedback-scope="${esc(record.id)}" data-scope-kind="implementation_and_qa">Prepare implementation + QA card payloads</button>` : `<button type="button" disabled title="Needs ready_for_scoping plus acceptance criteria">Prepare implementation/QA payloads</button>`,
    ambiguous ? `<button type="button" data-owner-feedback-scope="${esc(record.id)}" data-scope-kind="owner_decision">Prepare owner decision payload</button>` : '',
    copyButton('Copy feedback JSON', jsonCopy(record)),
    record.card_payloads?.length ? copyButton('Copy latest card payloads', jsonCopy(record.card_payloads)) : ''
  ].filter(Boolean));
  return `${actions}
    <section class="detail-section owner-feedback-warning"><h3>D1 owner admin testing guard</h3><p><strong>Not scoped — cannot be Done</strong> applies until routing, acceptance criteria, QA/owner acceptance, and linked cards are verified. Normal destinations here are D1/D2/D3 or owner decision queue; terminal labels are ${OWNER_FEEDBACK_TERMINALS.join(', ')}, never Done.</p></section>
    <section class="detail-section"><h3>Raw owner feedback</h3><pre class="code block raw-text">${fmt(record.content?.raw_text || '')}</pre></section>
    <section class="detail-section"><h3>Routing / triage</h3>${kv({lane, triage_state: st, decision_state: record.routing?.decision_state || '—', routing_reason: record.routing?.routing_reason, severity: record.routing?.severity, priority: record.routing?.priority, followup_kind: record.routing?.followup_kind})}</section>
    <section class="detail-section"><h3>Acceptance / QA scope</h3>${kv({acceptance_criteria: record.implementation?.acceptance_criteria || [], reproduction_steps: record.implementation?.reproduction_steps || [], expected_behavior: record.implementation?.expected_behavior || '—', actual_behavior: record.implementation?.actual_behavior || '—', scope_notes: record.implementation?.scope_notes || '—'})}</section>
    <section class="detail-section"><h3>Prepare scoped card payloads</h3><p class="label">Copy-only/local payload preparation. This UI does not send any item to Done and does not dispatch workers.</p>${payloadActions}</section>
    ${record.owner_decision ? `<section class="detail-section"><h3>Owner decision queue</h3>${kv(record.owner_decision)}</section>` : ''}
    ${record.card_payloads?.length ? `<section class="detail-section"><h3>Prepared card payloads</h3><pre class="code block">${fmt(jsonCopy(record.card_payloads))}</pre></section>` : ''}
    <section class="detail-section"><h3>Full audit JSON</h3><pre class="code block">${fmt(stringify(record, 8000))}</pre></section>`;
}
function ownerFeedback() {
  const records = ownerFeedbackAllRecords();
  const counts = ownerFeedbackCounts(records);
  const stateOptions = ['all', ...OWNER_FEEDBACK_STATES].map(x => `<option value="${esc(x)}"${filters.ownerFeedbackState === x ? ' selected' : ''}>${fmt(x)}</option>`).join('');
  const filtered = records
    .filter(r => filters.ownerFeedbackState === 'all' || (r.routing?.triage_state || 'raw') === filters.ownerFeedbackState)
    .filter(r => includes(r, filters.ownerFeedback));
  const ambiguous = records.filter(r => (r.routing?.delivery_lane === 'owner_decision_required') || (r.routing?.decision_state === 'queued') || (r.routing?.triage_state === 'owner_decision_pending'));
  return `<div class="grid owner-feedback">
    ${metric('Feedback items', records.length, 'span-3')}
    ${metric('D1 routed', counts.D1 || 0, 'span-3')}
    ${metric('Owner decisions', counts.owner_decision_queue || 0, 'span-3')}
    ${metric('Payload-ready', records.filter(r => ['ready_for_scoping','scoped_to_kanban'].includes(r.routing?.triage_state) && asArray(r.implementation?.acceptance_criteria).length).length, 'span-3')}
    ${card('D1 owner feedback inbox contract', `${kv({workflow: OWNER_FEEDBACK_CONTEXT.workflow, app_under_test_url: OWNER_FEEDBACK_CONTEXT.app_under_test_url, source_owner: OWNER_FEEDBACK_CONTEXT.source_owner, routing: 'D1 default; D2 integration; D3 workflow/spec; owner_decision_required for ambiguity', done_guard: 'Done is not offered as an inbox destination. Use Closed/Duplicate/Rejected/Obsolete/Merged only after verification.', payload_mode: 'copy-only scoped Kanban card payload preparation'})}${toolbar([copyButton('Copy routing lanes', OWNER_FEEDBACK_LANES.join('\n')), copyButton('Copy state machine', OWNER_FEEDBACK_STATES.join('\n')), copyButton('Copy Done guard', 'Raw owner feedback never moves directly to Done. The inbox prepares scoped implementation/QA/owner-decision card payloads only.')])}`, 'span-8')}
    ${card('Workflow states', ownerFeedbackWorkflowHelp(), 'span-4')}
    ${card('Capture owner feedback', ownerFeedbackForm(), 'span-12')}
    ${card('Inbox counts', kv(counts), 'span-4')}
    ${card('Owner decision queue', rows(ambiguous, ownerFeedbackRow, 'No ambiguous feedback waiting for owner decision'), 'span-8')}
    <section class="card span-12"><h3>Ожидают owner feedback items</h3><div class="filters intake-filters">${searchBox('ownerFeedbackSearch', 'Search owner feedback / D1 / D2 / D3 / affected area…', filters.ownerFeedback)}<select id="ownerFeedbackStateFilter">${stateOptions}</select></div>${filtered.length ? rows(filtered, ownerFeedbackRow) : `<div class="empty"><strong>No owner feedback matches filters.</strong><br>Paste owner testing feedback above. Ambiguous items route to owner decision queue; no Done destination exists here.</div>`}</section>
  </div>`;
}

function sourceSummary() {
  return {
    schema_version: state.schema_version,
    generated_at: state.generated_at,
    mode: state.mode,
    read_only: state.safety?.read_only,
    dispatch_allowed: state.safety?.dispatch_allowed,
    worker_allowed: state.safety?.worker_allowed,
    source_of_truth: '/workspace/output/webstudio-control-plane-state.json'
  };
}

function overview() {
  const wf = state.work_factory || {}, kb = state.kanban || {}, h = state.health || {}, safety = state.safety || {}, wh = state.worker_health || {}, gh = state.github_readiness || {};
  const ownerSummary = `WebStudio Ops\nSafety: ${safety.status}\nWF: ${wf.counts?.completed || 0} completed, ${wf.counts?.pending || 0} pending, ${wf.counts?.approval_required || asArray(state.approvals).length} approvals, ${wf.counts?.blocked_error || 0} blocked/errors\nKanban: ${kb.task_total || 0} cards; ready/running=${kb.counts?.ready || 0}/${kb.counts?.running || 0}\nHealth: ${h.status}; QMD очередь=${h.qmd?.pending_embeddings ?? '—'}`;
  return `<div class="grid">
    ${metric('Готово WF', wf.counts?.completed, 'span-3', 'work-factory')}
    ${metric('Ожидают', wf.counts?.pending, 'span-3', 'work-factory')}
    ${metric('Согласования', asArray(state.approvals).length, 'span-3', 'approvals')}
    ${metric('Блокеры/ошибки', wf.counts?.blocked_error, 'span-3', 'work-factory')}
    ${metric('Карточек Kanban', kb.task_total, 'span-3', 'kanban')}
    ${metric('Активно в производстве', state.production_pipeline?.counts?.active || 0, 'span-3', 'production')}
    ${metric('Готово/выполняется', `${kb.counts?.ready || 0}/${kb.counts?.running || 0}`, 'span-3', 'kanban')}
    ${metric('Артефакты', asArray(state.artifacts).length, 'span-3', 'artifacts')}
    ${metric('QMD очередь', h.qmd?.pending_embeddings, 'span-3', 'health')}
    ${metric('Активные зависшие', ownerKpiStale().active, 'span-3', 'kanban')}
    ${metric('GitHub', gh.status || 'unknown', 'span-3', 'health')}
    ${metric('Снапшоты', state.system_hardening?.snapshot_pending_count ?? '—', 'span-3', 'health')}
    ${metric('Автономный цикл', state.marathon_12h?.status || 'unknown', 'span-3', 'work-factory')}
    ${metric('Агенты', state.agent_workflow?.protocol?.silent_finish_allowed === false ? 'contracted' : 'unknown', 'span-3', 'agent-workflow')}
    ${card('Безопасность', `${kv({status: safety.status, read_only: safety.read_only, dispatch_allowed: safety.dispatch_allowed, worker_allowed: safety.worker_allowed, mirror_executable_count: safety.mirror_executable_count, duplicate_keys: Object.keys(safety.duplicate_keys || {}).length})}${toolbar([copyButton('Copy safety contract', `Безопасность:\nread_only=${safety.read_only}\ndispatch_allowed=${safety.dispatch_allowed}\nworker_allowed=${safety.worker_allowed}\nforbidden=${asArray(safety.forbidden_actions).join(', ')}`), copyButton('Copy owner summary', ownerSummary)])}`, 'span-6')}
    ${card('Система сейчас', kv({status: h.status, gateway_active: h.gateway_active, qmd_pending_embeddings: h.qmd?.pending_embeddings, primary_model: h.primary_model_line}), 'span-6')}
    ${staleExplanationCard()}
    ${card('Источник данных', `${kv(sourceSummary())}${toolbar([copyButton('Copy state path', '/workspace/output/webstudio-control-plane-state.json'), copyButton('Copy dist path', '/workspace/output/webstudio-ops-dashboard-static'), copyButton('Copy local serve', 'cd /workspace/projects/webstudio-ops-dashboard && python3 -m http.server 4173 -d src')])}`, 'span-12')}
    ${card('Продуктовые линии', rows(asArray(state.product_lines), p => row('', LINE_RU[p.id] || ownerText(p.name), p.status, 'Автономия: ' + asArray(p.autonomy_levels).join(', '), 'json', jsonCopy(p))), 'span-12')}
  </div>`;
}

function wfTaskRow(t) {
  return row(t.id, t.title, t.status || t.category || 'task', `${t.category || '—'} · ${t.kind || '—'} · ${t.output || 'no output'}`, 'wf-task', jsonCopy(t));
}

function workFactory() {
  const wf = state.work_factory || {};
  const all = [...asArray(wf.pending), ...asArray(wf.approval_required), ...asArray(wf.blocked_error), ...asArray(wf.latest_completed)];
  const q = filters.wf;
  const filtered = all.filter(t => includes(t, q));
  return `<div class="grid">
    ${metric('Backlog total', wf.counts?.backlog_total)}${metric('Completed', wf.counts?.completed)}${metric('Ожидают', wf.counts?.pending)}${metric('Согласования', wf.counts?.approval_required || asArray(wf.approval_required).length)}
    ${card('Tick / supervisor state', `${kv({source_of_truth: wf.source_of_truth, mode: wf.mode, enabled: wf.enabled, timer_enabled: wf.timer_enabled, updated_at: wf.updated_at, last_event: wf.last_event})}${toolbar([copyButton('Copy WF source path', wf.source_of_truth || '/workspace/output/work-factory-supervisor-state.json'), copyButton('Copy rebuild admin snapshot', 'cd /workspace/projects/webstudio-ops-dashboard && python3 scripts/build_snapshot.py --dist /workspace/output/webstudio-ops-dashboard-static')])}`, 'span-6')}
    ${card('Progress', kv(wf.progress), 'span-6')}
    ${card('Roadmap manager', kv(wf.roadmap_manager), 'span-6')}
    ${card('Capability inventory', kv(wf.capability_inventory), 'span-6')}
    <section class="card span-12"><h3>Touchable Work Factory queue</h3>${searchBox('wfSearch', 'Search WF task / output / category…', q)}${rows(filtered, wfTaskRow, 'No WF tasks match')}</section>
    ${card('Ожидают queue', rows(asArray(wf.pending), wfTaskRow), 'span-6')}
    ${card('Approval required', rows(asArray(wf.approval_required), wfTaskRow), 'span-6')}
    ${card('Blocked / errors', rows(asArray(wf.blocked_error), wfTaskRow), 'span-6')}
    ${card('Latest completed', rows(asArray(wf.latest_completed).slice(0, 40), wfTaskRow), 'span-6')}
  </div>`;
}

function classifyCard(t) {
  const text = `${t.title || ''} ${t.body || ''}`.toLowerCase();
  if (text.includes('[sys]') || text.includes('mirror_type=sys-control-plane')) return 'sys';
  if (text.includes('[wf') || text.includes('mirror only') || text.includes('work factory')) return 'mirror';
  if (text.includes('approval')) return 'approval';
  return 'normal';
}


const LANE_DESCRIPTIONS = {
  triage: 'Новые идеи, лиды и сырые требования без полной спецификации.',
  todo: 'Уточнённые задачи: смысл понятен, но есть подготовка или зависимость.',
  scheduled: 'Старт позже: следующий 12h tick, окно владельца или событие.',
  ready: 'Всё готово: агент может брать в работу без дополнительных вопросов.',
  in_progress: 'Реально выполняется агентом, воркером или субагентом сейчас.',
  running: 'Реально выполняется агентом, воркером или субагентом сейчас.',
  blocked: 'Только настоящие blockers: решение владельца, доступ или внешний риск.',
  review: 'Результат готов и ждёт QA, owner review или delivery review.',
  done: 'Принятые результаты. Новые сверху по updated/completed времени.',
  archived: 'Canary, test, noise и старые карточки вне production-фокуса.'
};
const LANE_ACCENTS = {triage:'#60a5fa',todo:'#38bdf8',scheduled:'#a78bfa',ready:'#34d399',in_progress:'#5dd2ff',running:'#5dd2ff',blocked:'#fb7185',review:'#fbbf24',done:'#22c55e',archived:'#94a3b8'};
const CAPABILITY_ROWS = [
  {domain:'Визуальный дизайн', gives:'Дизайн-системы, DESIGN.md, визуальные гипотезы, не шаблонная сетка', agents:['CTO','Design','Frontend'], lines:['D1','D2','D3'], status:'active', source:'Open Design + встроенные навыки Hermes', next:'Автовыбор DESIGN.md по типу продукта'},
  {domain:'Анимация и микровзаимодействия', gives:'Дисциплинированный слой motion, микровзаимодействия, reveal без перегруза', agents:['Design','Frontend','QA'], lines:['D1','D2'], status:'active', source:'Open Design craft + локальный навык анимации', next:'Бюджет анимации и reduced-motion аудит'},
  {domain:'QA и ревью', gives:'Browser QA, console=0, responsive, проверка артефактов, русская copy-проверка', agents:['QA','Delivery'], lines:['D1','D2','D3'], status:'active', source:'Паттерны webapp-testing + Hermes browser QA', next:'Визуальные regression snapshots'},
  {domain:'Производительность и передача', gives:'Лёгкая static-админка, build/smoke, owner-ready handoff, rollback notes', agents:['Frontend','Ops','Delivery'], lines:['D1','D2','D3'], status:'active', source:'Hermes WebStudio delivery skills', next:'Адаптер рисков Core Web Vitals'},
  {domain:'Конверсия и аналитика', gives:'Воронки, CTA, оффер, acceptance criteria, throughput charts', agents:['Sales','CTO','Research'], lines:['D1','D2','D3'], status:'active', source:'Таксономия awesome-agent-skills', next:'Lead scoring в D3 intake'},
  {domain:'Русский текст и UX', gives:'Owner-friendly RU labels, короткие next steps, raw/debug скрыты под «Подробнее»', agents:['Design','QA','Delivery'], lines:['D1','D2','D3'], status:'active', source:'локальный навык русского copy', next:'Tone presets per client'},
  {domain:'GitHub и PR-передача', gives:'PR status, branch, checks, safe push boundary, evidence paths', agents:['Ops','Delivery'], lines:['OPS','D1'], status:'active', source:'Hermes github-pr-workflow', next:'История CI badge'},
  {domain:'Передача клиенту', gives:'Пакет передачи: screenshots, QA report, summary, exact approvals', agents:['Delivery','QA','Sales'], lines:['D1','D2','D3'], status:'active', source:'локальный handoff-навык', next:'Client-ready ZIP manifest'},
  {domain:'Supabase и backend safe ops', gives:'Read-only liveness, schema proposal before writes, RLS-safe boundary', agents:['Backend','Ops','QA'], lines:['D2','D3'], status:'planned', source:'Hermes Supabase safe checks', next:'Read-only status tile'},
  {domain:'QMD и база знаний', gives:'Safe qmd status/update/search/get/ls; no vector-heavy commands by default', agents:['Research','Ops','CTO'], lines:['OPS','D1','D2','D3'], status:'active', source:'Hermes QMD safe mode', next:'Knowledge freshness chart'}
];
const DESIGN_ENGINE_STEPS = [
  {role:'CTO', step:'Scope / strategy', output:'позиционирование, acceptance criteria, proof policy', gate:'нет неподтверждённых claims и фейковых метрик'},
  {role:'Design Agent', step:'DESIGN.md / visual direction', output:'tokens, типографика, сетка, дизайн-система, motion budget', gate:'источник дизайна указан, правила повторяемы'},
  {role:'Frontend Agent', step:'Prototype / implementation', output:'hero, оффер, proof blocks, CTA, responsive components', gate:'360px и 1920px без горизонтального скролла'},
  {role:'QA', step:'Visual + conversion QA', output:'responsive screenshots, console check, copy review, reduced-motion audit', gate:'build/smoke/secret scan/browser QA PASS'},
  {role:'Delivery', step:'Owner/client handoff', output:'artifact index, checklist, rollback/approval notes', gate:'точные owner actions и handoff без internal debug'}
];
const DESIGN_SYSTEMS = [
  {name:'Editorial Premium', best_for:'D1 лендинги с экспертным позиционированием', tokens:'warm canvas · serif accent · hairline cards · high-trust proof', avoid:'generic blue-purple SaaS', artifact:'/workspace/output/webstudio-d1-premium-landing-demo-v1.html'},
  {name:'Ops Cockpit Dark', best_for:'админки, Kanban, production dashboards', tokens:'dark panels · compact cards · semantic lane accents · dense 1920 grid', avoid:'raw logs in main view', artifact:'/workspace/output/webstudio-ops-dashboard-static/index.html'},
  {name:'Conversation Flow', best_for:'D2 Telegram bot и client-facing сценарии', tokens:'message bubbles · decision chips · escalation states · privacy notes', avoid:'магия без объяснения шага', artifact:'/workspace/output/webstudio-d2-bot-intake-screens-v1.html'},
  {name:'Process Map', best_for:'D3 автоматизации и интеграционные риски', tokens:'swimlanes · risk chips · exception gates · handoff checklist', avoid:'линейные схемы без ошибок', artifact:'/workspace/output/webstudio-d3-process-map-ui-v1.html'}
];
const MOTION_QA_GATES = [
  'micro-interactions only: hover/focus/reveal <= 180ms',
  'prefers-reduced-motion disables non-essential movement',
  'no layout shift from animation; CTA remains tappable',
  'mobile above-fold readable without scroll traps',
  'browser console clean before delivery'
];
function designPipelineDiagram() {
  return `<div class="engine-pipeline">${DESIGN_ENGINE_STEPS.map((x, i) => `<article class="pipeline-node"><span>${fmt(x.role)}</span><b>${fmt(x.step)}</b><small>${fmt(x.output)}</small><em>${fmt(x.gate)}</em></article>${i < DESIGN_ENGINE_STEPS.length - 1 ? '<i class="pipeline-arrow">→</i>' : ''}`).join('')}</div>`;
}
function frontendDesignEngine() {
  const artifacts = [
    ['/workspace/output/webstudio-d1-premium-landing-demo-v1.html','D1 premium landing demo'],
    ['/workspace/output/webstudio-d1-conversion-qa-checklist-v1.md','D1 conversion QA checklist'],
    ['/workspace/output/webstudio-d2-bot-intake-screens-v1.html','D2 bot intake screens'],
    ['/workspace/output/webstudio-d2-qa-fixtures-v1.json','D2 QA fixtures'],
    ['/workspace/output/webstudio-d3-process-map-ui-v1.html','D3 process map UI'],
    ['/workspace/output/webstudio-d3-handoff-checklist-v1.md','D3 handoff checklist'],
    ['/workspace/output/webstudio-frontend-design-engine-v2.md','Frontend Design Engine spec']
  ];
  return `<section class="card span-12 design-engine"><h3>Frontend Design Engine</h3><p class="label">Рабочий конвейер: CTO → Design Agent → Frontend Agent → QA → Delivery. На выходе не описание, а demo/spec/fixtures/checklist с проверками.</p>${designPipelineDiagram()}<div class="design-engine-grid"><article><h4>Pipeline gates</h4>${DESIGN_ENGINE_STEPS.map(x => `<div class="engine-step"><b>${fmt(x.role)} · ${fmt(x.step)}</b><span>${fmt(x.output)}</span><em>${fmt(x.gate)}</em></div>`).join('')}</article><article><h4>Design systems cards</h4>${DESIGN_SYSTEMS.map(x => `<div class="design-system-card"><b>${fmt(x.name)}</b><span>${fmt(x.best_for)}</span><em>${fmt(x.tokens)}</em><small>Anti-template: ${fmt(x.avoid)}</small><small>Artifact: ${fmt(x.artifact)}</small></div>`).join('')}</article><article><h4>Motion / QA gates</h4>${MOTION_QA_GATES.map(x => `<div class="artifact-chip motion-gate"><b>QA gate</b><span>${fmt(x)}</span></div>`).join('')}<h4>Artifacts</h4>${artifacts.map(([path,label]) => `<div class="artifact-chip"><b>${fmt(label)}</b><span>${fmt(path)}</span></div>`).join('')}</article></div></section>`;
}
function taskUpdatedAt(t) { return t.completed_at || t.updated_at || t.created_at || t.audit?.updated_at || t.audit?.created_at || ''; }
function ageLabel(t) { const raw = taskUpdatedAt(t); if (!raw) return 'нет времени'; const d = new Date(raw); if (Number.isNaN(d.getTime())) return shortText(raw, 18); const h = Math.max(0, Math.round((Date.now() - d.getTime()) / 36e5)); return h < 1 ? 'только что' : h < 24 ? `${h}ч назад` : `${Math.round(h/24)}д назад`; }
function lineClass(line) { return ['D1','D2','D3','OPS'].includes(line) ? line.toLowerCase() : 'ops'; }
function visualKanbanCard(t) {
  const line = productLineOf(t);
  const artifact = t.artifact_path || t.output || t.report || '';
  const next = ownerNext(t);
  const status = t.lifecycle_status || t.status || t.physical_status || 'tracked';
  const stage = ownerStage(t);
  const owner = ownerAgent(t);
  const payload = jsonCopy(t);
  const artifactText = artifact ? shortPath(artifact) : 'ожидает';
  return `<article class="ws-task-card product-like-card ${lineClass(line)} ${statusClass(status)}" data-detail-type="kanban-card" data-detail-payload="${esc(payload)}" tabindex="0" role="button">
    <div class="task-card-head"><span class="line-chip ${lineClass(line)}">${fmt(line)}</span>${badge(status)}</div>
    <h4>${fmt(ownerText(t.title))}</h4>
    <p class="task-card-summary">${fmt(shortText(next, 96))}</p>
    <div class="product-card-ribbon"><span>${fmt(stage)}</span><span>${fmt(owner)}</span><span>${fmt(ageLabel(t))}</span></div>
    <div class="task-meta-grid">
      <span>Артефакт</span><b>${fmt(artifactText)}</b>
      <span>Delivery</span><b>${/done|review|pass|complete/i.test(status + ' ' + stage) ? 'готовится' : 'в работе'}</b>
      <span>Следующий шаг</span><b>${fmt(shortText(next, 58))}</b>
    </div>
    <details class="raw-details"><summary>Подробнее</summary><pre class="code mini">${fmt(stringify(t, 1200))}</pre></details>
  </article>`;
}
function sortLaneItems(lane, items) {
  const list = asArray(items).slice();
  if (lane === 'done' || lane === 'archived') list.sort((a,b) => String(taskUpdatedAt(b)).localeCompare(String(taskUpdatedAt(a))));
  return list;
}
function visualLaneBoard(lanes, order, opts={}) {
  return `<div class="visual-kanban-board" data-columns="${order.length}">${order.map(lane => {
    const allItems = sortLaneItems(lane, lanes?.[lane]);
    const visible = allItems.slice(0, opts.limit || 5);
    const accent = LANE_ACCENTS[lane] || '#5dd2ff';
    const morePayload = {lane, count: allItems.length, items: allItems.slice(0, 50), note: allItems.length > 50 ? 'Показаны первые 50 карточек; полный список доступен через фильтр/экспорт JSON.' : 'Полный список колонки.'};
    const more = allItems.length > visible.length ? `<button class="more-count" type="button" data-detail-type="kanban-lane" data-detail-payload="${esc(jsonCopy(morePayload))}">ещё ${allItems.length - visible.length}</button>` : '';
    return `<section class="visual-lane ${statusClass(lane)}" style="--lane-accent:${accent}">
      <header class="lane-head"><div><h3>${fmt(ru(lane))}</h3><p>${fmt(LANE_DESCRIPTIONS[lane] || 'Рабочая колонка production pipeline.')}</p></div><span>${allItems.length}</span></header>
      <div class="lane-scroll">${visible.length ? visible.map(visualKanbanCard).join('') : `<div class="empty lane-empty">Пока пусто</div>`}${more}</div>
    </section>`;
  }).join('')}</div>`;
}
function maxCount(values) { return Math.max(1, ...values.map(v => Number(v) || 0)); }
function stageDistributionChart(counts={}) {
  const order = ['triage','todo','scheduled','ready','in_progress','blocked','review','done','archived'];
  const max = maxCount(order.map(k => counts[k] || 0));
  return `<div class="chart-grid stage-chart">${order.map(k => `<div class="bar-row"><span>${fmt(ru(k))}</span><div class="bar-track"><i style="width:${Math.max(3, Math.round(((counts[k] || 0) / max) * 100))}%;background:${LANE_ACCENTS[k] || '#5dd2ff'}"></i></div><b>${fmt(counts[k] || 0)}</b></div>`).join('')}</div>`;
}
function lineProgressChart(progress={}) {
  const byLine = progress.by_line || {};
  const lines = ['D1','D2','D3'];
  const max = maxCount(lines.map(l => byLine[l]?.total || asArray(progress.items).filter(i => i.product_line === l).length));
  return `<div class="line-progress-grid">${lines.map(l => { const entry = byLine[l] || {}; const total = entry.total || asArray(progress.items).filter(i => i.product_line === l).length; const active = entry.active || entry.in_progress || 0; const done = entry.done || entry.completed || asArray(progress.items).filter(i => i.product_line === l && /done|complete|pass/i.test(i.status || '')).length; return `<article class="line-progress-card ${l.toLowerCase()}"><h4>${fmt(LINE_RU[l])}</h4><div class="donut" style="--pct:${Math.min(100, Math.round((total / max) * 100))}%"><span>${fmt(total)}</span></div><p>активно ${fmt(active)} · готово ${fmt(done)} · review ${fmt(entry.review || 0)} · blocked ${fmt(entry.blocked || 0)}</p></article>`; }).join('')}</div>`;
}
function agentWorkloadChart() {
  const prod = state.production_pipeline || {}; const lanes = prod.logical_lanes || {}; const all = Object.values(lanes).flatMap(asArray);
  const roles = ['CTO','Оркестратор','Frontend','Backend','QA','Ops','Research','Sales','Delivery'];
  const counts = Object.fromEntries(roles.map(r => [r, 0]));
  for (const t of all) { const a = ownerAgent(t); const key = roles.find(r => new RegExp(r === 'Оркестратор' ? 'оркестр|orchestr' : r, 'i').test(a + ' ' + (t.assigned_agent || '') + ' ' + (t.assignee || '') + ' ' + (t.title || ''))) || 'Ops'; counts[key]++; }
  const max = maxCount(Object.values(counts));
  return `<div class="workload-chart">${roles.map(r => `<div class="workload-pill"><b>${fmt(r)}</b><span style="height:${Math.max(10, Math.round((counts[r]/max)*72))}px"></span><em>${fmt(counts[r])}</em></div>`).join('')}</div>`;
}
function throughputChart() {
  const hist = asArray(state.control_plane_history?.snapshots);
  if (!hist.length) return `<div class="empty">История ещё собирается. Первый адаптер создан в public/data/webstudio-control-plane-history.json.</div>`;
  return `<div class="sparkline">${hist.slice(-12).map(x => `<span title="${esc(x.at || '')}" style="height:${Math.max(8, Math.min(86, (Number(x.completed || 0)+1)*6))}px"></span>`).join('')}</div>`;
}
function deliveryReadinessCard(progress={}, prod={}) {
  const analytics = progress.analytics || {};
  const score = Number(analytics.delivery_readiness_score || 0);
  const blockers = analytics.blockers_aging || {};
  const items = asArray(progress.items);
  const passCount = items.filter(x => /pass|done|complete/i.test(x.status || '')).length;
  return `<div class="readiness-card"><div class="readiness-ring" style="--pct:${Math.max(0, Math.min(100, score))}%"><span>${fmt(score || Math.round((passCount / Math.max(1, items.length)) * 100))}%</span></div><div><h4>Delivery readiness</h4><p>PASS артефактов: ${fmt(passCount)}/${fmt(items.length)} · review lane: ${fmt(prod.logical_counts?.review || 0)} · blockers: ${fmt(blockers.active_blockers ?? prod.logical_counts?.blocked ?? 0)}</p><p class="label">Самый старый blocker: ${fmt(blockers.oldest_blocker_age_hours ?? 0)}ч · live-интеграции остаются approval-gated.</p></div></div>`;
}
function blockersAgingChart(progress={}, prod={}) {
  const blockers = progress.analytics?.blockers_aging || {};
  const watch = asArray(blockers.watch_items);
  const active = Number(blockers.active_blockers ?? prod.logical_counts?.blocked ?? 0);
  const age = Number(blockers.oldest_blocker_age_hours || 0);
  return `<div class="blockers-aging"><div class="bar-row"><span>Active</span><div class="bar-track"><i style="width:${Math.max(3, Math.min(100, active * 18))}%"></i></div><b>${fmt(active)}</b></div><div class="bar-row"><span>Oldest</span><div class="bar-track warn"><i style="width:${Math.max(3, Math.min(100, age))}%"></i></div><b>${fmt(age)}ч</b></div>${watch.map(x => `<p class="label">• ${fmt(x)}</p>`).join('') || '<p class="label">Нет aging blockers.</p>'}</div>`;
}
function progressAnalytics() {
  const prod = state.production_pipeline || {}; const progress = state.product_progress || {}; const h = state.health || {};
  const risk = {blockers: prod.logical_counts?.blocked || 0, stale: ownerKpiStale().active || 0, crashes: state.worker_health?.repeated_crash_indicator_count || 0, github: state.github_readiness?.status || 'unknown', qmd: h.qmd?.status || h.status || 'unknown', supabase: state.supabase?.status || 'read-only/unknown', pr_verification: progress.pr_verification_verdict || state.github_readiness?.pr_status?.verification_verdict || 'unknown'};
  return `<section class="card span-12 analytics-section"><h3>Аналитика прогресса</h3><div class="analytics-grid">
    <article class="wide">${deliveryReadinessCard(progress, prod)}</article>
    <article><h4>Распределение по стадиям</h4>${stageDistributionChart(prod.logical_counts || {})}</article>
    <article><h4>D1/D2/D3 progress</h4>${lineProgressChart(progress)}</article>
    <article><h4>Blockers aging</h4>${blockersAgingChart(progress, prod)}</article>
    <article><h4>Нагрузка агентов</h4>${agentWorkloadChart()}</article>
    <article><h4>Темп работы / Фабрика задач</h4>${throughputChart()}</article>
    <article class="wide"><h4>Риски и внимание</h4>${kv(risk)}</article>
  </div></section>`;
}
function capabilityMatrix() {
  return `<section class="card span-12 capability-section"><h3>Навыки агентов</h3><p class="label">Capability matrix показывает, какие навыки реально используются в production pipeline. Raw skill names спрятаны в «Подробнее».</p><div class="capability-grid">${CAPABILITY_ROWS.map(c => `<article class="capability-card ${statusClass(c.status)}"><div class="capability-top"><h4>${fmt(c.domain)}</h4>${badge(c.status)}</div><p>${fmt(c.gives)}</p><div class="capability-meta"><span>Агенты: ${fmt(c.agents.join(', '))}</span><span>Линии: ${fmt(c.lines.join(', '))}</span><span>Источник: ${fmt(c.source)}</span></div><details><summary>Подробнее</summary><pre class="code mini">${fmt(jsonCopy(c))}</pre></details></article>`).join('')}</div></section>`;
}
function capabilities() { return `<div class="grid">${frontendDesignEngine()}${capabilityMatrix()}${progressAnalytics()}</div>`; }

function demoThumbnail(item, score, line) {
  const t = item.preview_thumbnail || {};
  const chips = asArray(t.chips).slice(0,4);
  const accent = t.accent || (line === 'D1' ? '#f5c37b' : line === 'D2' ? '#5dd2ff' : '#36d399');
  return `<div class="demo-thumb v10-thumb ${String(line).toLowerCase()}" style="--thumb-accent:${esc(accent)}"><span>${fmt(line)}</span><strong>${fmt(t.headline || item.preview_label || 'Preview')}</strong><em>${fmt(t.theme || item.artifact_type || 'WebStudio')}</em><div class="thumb-chips">${chips.map(c => `<small>${fmt(c)}</small>`).join('')}</div><i style="width:${Math.max(8, Math.min(100, score))}%"></i></div>`;
}
function demoProductCard(item) {
  const score = Number(item.readiness_score || 0);
  const line = item.product_line || 'D?';
  const qa = item.qa_path || item.fixtures_path || '';
  const handoff = item.handoff_path || item.demo_script_path || '';
  return `<article class="demo-product-card ${String(line).toLowerCase()}">
    ${demoThumbnail(item, score, line)}
    <div class="demo-head"><div><p class="eyebrow">${fmt(ru(line))}</p><h3>${fmt(item.title || item.preview_label || 'Demo product')}</h3></div>${badge(item.status || 'watch')}</div>
    <p>${fmt(item.preview_label || item.artifact_type || 'Демо-продукт')}</p>
    <div class="demo-progress"><span>Readiness</span><b>${fmt(score)}%</b><div class="bar"><i style="width:${Math.max(5, Math.min(100, score))}%"></i></div></div>
    <div class="task-meta-grid">
      <span>QA</span><b>${qa ? 'готово' : 'нет'}</b>
      <span>Handoff</span><b>${handoff ? 'готово' : 'нет'}</b>
      <span>Фаза</span><b>${fmt(item.phase || 'v10')}</b>
      <span>Следующий шаг</span><b>${fmt(shortText(item.next_action || 'проверить демо', 62))}</b>
    </div>
    <div class="toolbar">${copyButton('Preview path', item.path || '')}${qa ? copyButton('QA path', qa) : ''}${handoff ? copyButton('Handoff path', handoff) : ''}<button class="copy secondary" type="button" data-detail-type="demo-product" data-detail-payload="${esc(jsonCopy(item))}">Подробнее</button></div>
  </article>`;
}
function demoProducts() {
  const progress = state.product_progress || {};
  const items = asArray(progress.items);
  const avg = items.length ? Math.round(items.reduce((sum,item)=>sum + Number(item.readiness_score || 0), 0) / items.length) : 0;
  const byLine = Object.fromEntries(['D1','D2','D3'].map(l => [l, items.find(x => x.product_line === l) || {}]));
  return `<div class="grid demo-products-page">
    ${metric('Демо-продукты', items.length, 'span-3', 'demo-products')}
    ${metric('Средняя готовность', avg + '%', 'span-3', 'demo-products')}
    ${metric('QA готово', items.filter(x => x.qa_path || x.fixtures_path).length + '/' + items.length, 'span-3', 'demo-products')}
    ${metric('Handoff готово', items.filter(x => x.handoff_path || x.demo_script_path).length + '/' + items.length, 'span-3', 'demo-products')}
    <section class="card span-12 demo-products-hero"><h3>Демо-продукты WebStudio v10</h3><p class="label">Owner-facing витрина Product Build Phase v10: D1 real-client adaptation, D2 transcript runner, D3 dry-run integration readiness. Raw/debug спрятан в «Подробнее».</p><div class="demo-product-grid">${items.map(demoProductCard).join('')}</div></section>
    ${card('D1 — Лендинги и сайты', kv({status: byLine.D1.status, preview: byLine.D1.path, qa: byLine.D1.qa_path, handoff: byLine.D1.handoff_path, next_action: byLine.D1.next_action}), 'span-4')}
    ${card('D2 — AI-intake bot', kv({status: byLine.D2.status, preview: byLine.D2.path, fixtures: byLine.D2.qa_path, demo_script: byLine.D2.handoff_path, next_action: byLine.D2.next_action}), 'span-4')}
    ${card('D3 — Автоматизации', kv({status: byLine.D3.status, preview: byLine.D3.path, matrix: byLine.D3.qa_path, handoff: byLine.D3.handoff_path, next_action: byLine.D3.next_action}), 'span-4')}
    ${card('Источник прогресса', `${kv({source_of_truth: progress.source_of_truth, updated_at: progress.updated_at, mode: progress.mode, report: '/workspace/output/webstudio-demo-products-v9-report.md', phase: progress.phase || 'v10', pr_verification: progress.pr_verification_verdict || 'PASS'})}${toolbar([copyButton('Copy progress JSON path', progress.source_of_truth || '/workspace/output/webstudio-product-progress-v1.json'), copyButton('Copy v9 report path', '/workspace/output/webstudio-demo-products-v9-report.md')])}`, 'span-12')}
  </div>`;
}


function kanbanCard(t) {
  const line = productLineOf(t);
  const meta = `${line} · ${ownerStage(t)} · агент: ${ownerAgent(t)} · шаг: ${ownerNext(t)}`;
  return row(line, ownerText(t.title), t.status || t.lifecycle_status || 'tracked', meta, 'kanban-card', jsonCopy(t));
}

function laneBoard(k) {
  const baseOrder = k.lane_order || ['triage','todo','scheduled','ready','running','blocked','review','done','archived'];
  const order = filters.showArchived ? baseOrder : baseOrder.filter(l => l !== 'archived');
  const lanes = k.lanes || {};
  const q = filters.kanban;
  const kindFilter = filters.kanbanKind;
  const laneFilter = filters.kanbanLane;
  return `<div class="kanban-board all-columns">${order.filter(l => laneFilter === 'all' || laneFilter === l).map(lane => {
    const allItems = asArray(lanes[lane]);
    const items = allItems.filter(t => includes(t, q)).filter(t => kindFilter === 'all' || classifyCard(t) === kindFilter);
    const limit = 3;
    const visible = items.slice(0, limit);
    const more = items.length > limit ? `<div class="more-count">ещё ${items.length - limit}</div>` : '';
    const risk = ['ready','running','todo','triage','scheduled'].includes(lane) && allItems.some(t => ['mirror','sys'].includes(classifyCard(t))) ? ' safety-risk' : '';
    return `<section class="lane ${statusClass(lane)}${risk}"><h3>${fmt(ru(lane))} <span>${items.length}</span></h3>${rows(visible, kanbanCard, 'Пусто')}${more}</section>`;
  }).join('')}</div>`;
}

function logicalProductionBoard(prod) {
  const order = prod.logical_lane_order || ['triage','todo','scheduled','ready','in_progress','blocked','review','done','archived'];
  return visualLaneBoard(prod.logical_lanes || {}, order, {limit: 5});
}

function kanban() {
  const k = state.kanban || {};
  const prod = state.production_pipeline || {};
  const wh = state.worker_health || {};
  const gh = state.github_readiness || {};
  const sem = state.kanban_semantics || {};
  const laneOptions = ['all', ...(k.lane_order || [])].map(x => `<option value="${esc(x)}"${filters.kanbanLane === x ? ' selected' : ''}>${fmt(x)}</option>`).join('');
  const kindOptions = ['all','normal','mirror','sys','approval'].map(x => `<option value="${esc(x)}"${filters.kanbanKind === x ? ' selected' : ''}>${fmt(x)}</option>`).join('');
  return `<div class="grid">
    ${metric('Всего карточек', k.task_total)}${metric('Производственные задачи', prod.counts?.total || 0, 'span-3', 'production')}${metric('Зеркала', k.mirror_total)}${metric('Исполняемые зеркала', k.executable_mirror_count)}
    ${card('Физические колонки', kv(k.counts), 'span-6')}
    ${card('Производственные колонки', kv(prod.logical_counts || {}), 'span-6')}
    ${card('Безопасность / дубли', `${kv({executable_mirror_count: k.executable_mirror_count, duplicate_keys: Object.keys(k.duplicate_keys || {}).length, list_available: k.list_available, stats_available: k.stats_available})}${toolbar([copyButton('Copy Kanban stats', k.stats_text || ''), copyButton('Copy read-only stats command', 'hermes kanban stats')])}`, 'span-6')}
    ${card('Здоровье воркеров', `${kv({running: wh.running_count, stale_30m: wh.stale_30m_count, stale_2h: wh.stale_2h_count, repeated_crash_indicators: wh.repeated_crash_indicator_count, contract: wh.lifecycle_contract, report: wh.hardening_report})}${toolbar([copyButton('Copy worker contract', wh.lifecycle_contract || ''), copyButton('Copy worker hardening report', wh.hardening_report || '/workspace/output/worker-lifecycle-contract-hardening-v2.md')])}`, 'span-6')}
    ${card('GitHub PR status', `${kv({account: gh.account_expected, status: gh.status, pr_url: gh.pr_url, latest_commit_sha: gh.latest_commit_sha, pushed_at: gh.pushed_at, wrapper_broken: gh.wrapper_broken, repair_packet: gh.repair_packet, report: gh.hardening_report})}${toolbar([gh.pr_url ? `<a class="copy" href="${esc(gh.pr_url)}" target="_blank" rel="noreferrer">Открыть PR</a>` : '', copyButton('Скопировать PR URL', gh.pr_url || 'https://github.com/pltnv123/webstudio-ops-dashboard/pull/1'), copyButton('Скопировать commit', gh.latest_commit_sha || ''), copyButton('Copy GitHub report', gh.hardening_report || '/workspace/output/github-hardening-v2-report.md')].filter(Boolean))}`, 'span-6')}
    ${card('Семантика Канбана', `${kv({verdict: sem.verdict, review: sem.review, triage: sem.triage, report: sem.report})}${toolbar([copyButton('Copy semantics report', sem.report || '/workspace/output/kanban-native-review-triage-investigation-v2.md')])}`, 'span-12')}
    <section class="card span-12 kanban-compact visual-board-card"><h3>Производственный Канбан</h3><p class="label">Живая production-доска WebStudio: бизнес-стадии, агент, следующий шаг и артефакт на карточке. Debug-поля спрятаны в details.</p>${logicalProductionBoard(prod)}</section>${progressAnalytics()}${capabilityMatrix()}
    <section class="card span-12 kanban-compact"><h3>Физический Kanban Hermes — компактно</h3><div class="filters">${searchBox('kanbanSearch', 'Поиск карточек / агента / id…', filters.kanban)}<select id="kanbanLaneFilter">${laneOptions}</select><select id="kanbanKindFilter">${kindOptions}</select><label class="check"><input id="kanbanShowArchived" type="checkbox" ${filters.showArchived ? 'checked' : ''}> Показать архив</label>${clearFiltersButton('kanban')}</div>${laneBoard(k)}</section>
    ${card('Последние карточки', rows(asArray(k.last_cards), kanbanCard), 'span-12')}
    ${card('Зеркала sample', rows(asArray(k.mirrors), kanbanCard), 'span-6')}
    ${card('Системные карточки', rows(asArray(k.sys_cards), kanbanCard), 'span-6')}
    ${card('Ошибки чтения', rows(asArray(k.read_errors).map((x,i)=>({id:i+1,title:String(x),status:'error'})), x => row(x.id, x.title, x.status)), 'span-12')}
  </div>`;
}


function agentWorkflowDiagram(flow) {
  const steps = ['CTO Agent','Orchestrator Agent','Specialist Agents','QA/Delivery','Done'];
  return `<div class="agent-diagram compact-diagram">${steps.map((s,i)=>`<div class="agent-node"><strong>${fmt(ru(s))}</strong><small>${i < steps.length - 1 ? 'передаёт дальше' : 'готово'}</small></div>`).join('<span class="agent-arrow">→</span>')}</div>`;
}
function agentSectionRow(t) {
  const meta = `роль: ${ru(t.assigned_agent || t.assignee || '—')} · стадия: ${ru(t.production_stage || '—')} · статус: ${ru(t.physical_status || t.status || '—')} · следующее: ${shortText(t.next_action || '—', 48)} · артефакт: ${shortPath(t.artifact_path || '')}`;
  return row(t.id, cleanTitle(t.title), t.lifecycle_status || t.status || 'tracked', meta, 'kanban-card', jsonCopy(t));
}
function agentRoleCard(name, cards, protocol) {
  const list = asArray(cards);
  const latest = list[0] || {};
  const desc = name === 'CTO-агент' ? 'Определяет направление и правила принятия.' : name === 'Оркестратор' ? 'Раздаёт задачи исполнителям и держит очередь.' : name === 'Исполнители' ? 'Делают код, артефакты и рабочие пакеты.' : name === 'QA/Передача' ? 'Проверяет результат и готовит handoff.' : 'Принятые результаты.';
  return `<article class="agent-role-card"><h4>${fmt(name)}</h4><p>${fmt(desc)}</p><p class="label">Задач: ${list.length} · Статус: ${fmt(list.length ? 'активен' : 'ожидает')}</p><p class="label">Последняя активность: ${fmt(ownerText(latest.title || 'нет свежих задач'))}</p><p class="label">Артефакт: ${fmt(shortPath(latest.artifact_path || latest.output || '—'))}</p></article>`;
}
function agentWorkflow() {
  const flow = state.agent_workflow || {};
  const protocol = flow.protocol || {};
  const sections = flow.sections || {};
  const stale = ownerKpiStale();
  const canaries = asArray(flow.canary_results?.results);
  const roles = [
    ['CTO-агент', sections.cto_agent || sections.cto || []],
    ['Оркестратор', sections.orchestrator_agent || sections.orchestrator || []],
    ['Исполнители', [...asArray(sections.specialist_agents), ...asArray(sections.frontend_agent), ...asArray(sections.backend_agent)]],
    ['QA/Передача', [...asArray(sections.qa_delivery), ...asArray(sections.delivery_agent), ...asArray(sections.qa_agent)]],
    ['Готово', sections.done || []]
  ];
  return `<div class="grid agent-workflow">
    ${metric('Роли агентов', roles.length, 'span-3')}
    ${metric('Проверки агентов', canaries.filter(c => c.status === 'done').length + '/' + canaries.length, 'span-3')}
    ${metric('Сбои', protocol.repeated_crashes_after_indicator_count || 0, 'span-3')}
    ${metric('Активные зависшие', stale.active, 'span-3')}
    ${card('Схема агентов', `${agentWorkflowDiagram(flow)}<div class="protocol-summary"><span>${badge('Протокол завершения: включён','ok')}</span><span>${badge('Молчаливое завершение: запрещено','ok')}</span><span>${badge('Активные зависшие: 0','ok')}</span></div>`, 'span-12')}
    <section class="card span-12"><h3>Роли и ответственность</h3><div class="agent-role-grid">${roles.map(([name,cards]) => agentRoleCard(name,cards,protocol)).join('')}</div></section>
    ${staleExplanationCard()}
    ${card('Последние проверки', rowsTop(canaries, c => row(c.agent || 'агент', ownerText(c.agent || c.task_id), c.status, `ответственный: ${ownerAgent(c)} · результат: ${ru(c.status || 'unknown')}`, 'json', jsonCopy(c)), 5, 'Проверок нет'), 'span-6')}
  </div>`;
}

function productionQuickItems(p) {
  const lanes = p.logical_lanes || {};
  const all = Object.values(lanes).flatMap(asArray);
  const q = filters.productionQuick || 'active';
  if (q === 'review') return asArray(p.review_queue || lanes.review);
  if (q === 'blocked') return asArray(lanes.blocked);
  if (['D1','D2','D3'].includes(q)) return all.filter(x => String(x.product_line || x.title || '').includes(q) || String(x.title || '').includes('[' + q + ']'));
  if (q === 'agents') return all.filter(x => /agent|worker|orchestrator|specialist/i.test(`${x.assigned_agent || ''} ${x.assignee || ''} ${x.title || ''}`));
  if (q === 'github') return all.filter(x => /github|pr|repo/i.test(`${x.title || ''} ${x.body || ''}`));
  return asArray(p.active_work || []).concat(asArray(lanes.ready), asArray(lanes.in_progress)).slice(0, 40);
}
function quickFilterButton(id, label) {
  const active = filters.productionQuick === id ? ' active' : '';
  return `<button type="button" class="quick-filter${active}" data-production-filter="${esc(id)}">${fmt(label)}</button>`;
}
function production() {
  const p = state.production_pipeline || {};
  const progress = state.product_progress || {};
  const counts = p.counts || {};
  const logicalCounts = p.logical_counts || {};
  const lineRows = Object.entries(p.product_lines || {}).map(([line, cards]) => ({id: line, title: `${line} · ${asArray(cards).length} cards`, status: 'production', cards}));
  const stageRows = Object.entries(p.by_stage || {}).map(([stage, cards]) => ({id: stage, title: `${stage} · ${asArray(cards).length} cards`, status: asArray(cards).length ? 'active' : 'empty', cards}));
  const logicalRows = Object.entries(p.logical_lanes || {}).map(([lane, cards]) => ({id: lane, title: `${lane} · ${asArray(cards).length} cards`, status: asArray(cards).length ? 'active' : 'empty', cards}));
  const needsAttention = [...asArray((p.logical_lanes || {}).blocked), ...asArray(p.review_queue), ...asArray(p.delivery_queue)].slice(0, 12);
  const quickItems = productionQuickItems(p);
  const filterBar = toolbar(['active','review','blocked','D1','D2','D3','agents','github'].map(x => quickFilterButton(x, x === 'active' ? 'Активные' : x === 'review' ? 'На проверке' : x === 'blocked' ? 'Заблокированные' : x === 'agents' ? 'Агенты' : x === 'github' ? 'GitHub' : x)));
  return `<div class="grid production-dashboard">
    ${card('Требует внимания', rowsTop(needsAttention, attentionCard, 5, 'Нет срочных элементов'), 'span-12 attention-card')}
    ${metric('Производственные задачи', counts.total || 0, 'span-3', 'kanban')}
    ${metric('В работе', counts.active || 0, 'span-3', 'kanban')}
    ${metric('На проверке', counts.review || 0, 'span-3', 'approvals')}
    ${metric('Передача клиенту', counts.delivery || 0, 'span-3', 'clients')}
    ${card('Фильтры', `${filterBar}${rowsTop(quickItems, kanbanCard, 5, 'Нет карточек по фильтру')}`, 'span-12')}
    <section class="card span-12 kanban-compact visual-board-card"><h3>Производственный Канбан</h3><p class="label">Разбор · Подготовка · Запланировано · Готово к запуску · Выполняется · Заблокировано · На проверке · Готово · Архив</p>${logicalProductionBoard(p)}</section>${progressAnalytics()}${capabilityMatrix()}
    ${card('Прогресс D1/D2/D3', rowsTop(asArray(progress.items), item => row(item.product_line, `${item.artifact_type} · ${ru(item.stage || 'stage')}`, item.status || 'artifact', `${shortPath(item.path)} · sha=${String(item.sha256 || '').slice(0,12)} · обновлено=${item.updated_at || progress.updated_at || '—'}`, 'artifact', jsonCopy(item)), 5, 'Нет артефактов прогресса'), 'span-12')}
    ${collapsibleCard('Источник доски', `${kv({board: p.board_name, purpose: p.purpose, source_of_truth: p.source_of_truth, filter: p.filter_recipe, contract: p.view_contract})}${toolbar([copyButton('Copy /kanban filter', 'WEBSTUDIO'), copyButton('Copy rebuild command', 'cd /workspace/projects/webstudio-ops-dashboard && python3 scripts/build_snapshot.py --dist /workspace/output/webstudio-ops-dashboard-static')])}`, 'span-12')}
    ${collapsibleCard('Колонки производства', kv(logicalCounts), 'span-12', true)}
    ${collapsibleCard('Линии D1/D2/D3', rowsTop(lineRows, x => row(x.id, x.title, x.status, 'Открыть карточки', 'json', jsonCopy(x)), 5), 'span-6', true)}
    ${collapsibleCard('Стадии производства', rowsTop(stageRows, x => row(x.id, x.title, x.status, 'Заявка → передача → поддержка', 'json', jsonCopy(x)), 5), 'span-6')}
    ${collapsibleCard('Производственная доска', rowsTop(logicalRows, x => row(x.id, x.title, x.status, 'Владелец видит бизнес-статус; технические поля внутри Подробнее', 'json', jsonCopy(x)), 5), 'span-12')}
    ${collapsibleCard('Активная работа / агенты', rowsTop(asArray(p.active_work), kanbanCard, 5, 'Нет активной работы'), 'span-12', true)}
    ${collapsibleCard('Очередь проверки', rowsTop(asArray(p.review_queue), kanbanCard, 5, 'Нет карточек на проверке'), 'span-6')}
    ${collapsibleCard('Очередь передачи', rowsTop(asArray(p.delivery_queue), kanbanCard, 5, 'Нет карточек передачи'), 'span-6')}
  </div>`;
}


function d3IntakeRecord(r) {
  const st = r.classification?.raw_inbox_status || r.audit?.capture_status || 'unknown';
  const nextAction = r.classification?.next_action || d3StatusAction(st);
  const submitter = r.client_or_submitter?.name || r.client?.name || 'unknown';
  const source = `${r.source?.platform || 'unknown'} · ${r.source?.channel_or_form || 'unknown'}`;
  const meta = `${source} · submitter=${submitter} · priority=${r.classification?.priority || 'untriaged'} · risk=${r.classification?.risk_level || 'unknown'} · action=${nextAction} · updated=${r.audit?.updated_at || '—'}${r.ui_overlay ? ' · local-ui-update' : ''}`;
  return row(r.id || 'local', r.request?.normalized_summary || 'Raw D3 intake request', st, meta, 'd3-intake-record', jsonCopy(r));
}

function d3IntakeForm() {
  return `<form id="d3IntakeForm" class="intake-form">
    <div id="d3Validation" class="validation ok">Ready to capture. This browser form writes only to local storage; canonical backend capture CLI remains copy-only.</div>
    <label>Raw requirement text<textarea name="raw_text" required placeholder="Paste the inbound D3 automation request exactly as received"></textarea></label>
    <div class="form-grid">
      <label>Platform<select name="platform"><option>manual</option><option>telegram</option><option>web_form</option><option>email</option><option>kanban</option><option>api</option><option>unknown</option></select></label>
      <label>Channel / form<input name="channel_or_form" value="manual" required></label>
      <label>Contact channel<input name="contact_channel" value="manual" required></label>
      <label>Submitter / company<input name="submitter_name" placeholder="unknown"></label>
      <label>External message ID<input name="external_message_id" placeholder="optional stable source id"></label>
      <label>Source URL<input name="source_url" placeholder="optional"></label>
      <label>Business area<input name="business_area" placeholder="ops / sales / support / finance…"></label>
      <label>Priority<select name="priority">${options(D3_INTAKE_PRIORITIES, 'untriaged')}</select></label>
      <label>Risk<select name="risk_level">${options(D3_INTAKE_RISKS, 'unknown')}</select></label>
      <label>Owner<input name="owner" placeholder="unassigned"></label>
      <label>Recommended route<select name="recommended_route"><option>unknown</option><option>business_automation</option><option>discovery</option><option>risk_review</option><option>decline</option></select></label>
    </div>
    <div class="toolbar"><button type="submit">Capture local inbox record</button>${copyButton('Copy backend capture CLI', 'cd /workspace/projects/webstudio-ops-dashboard && python3 scripts/d3_intake_backend.py --raw-text "<original request>" --platform manual --channel-or-form manual')}</div>
  </form>`;
}

function d3WorkflowHelp() {
  return `<div class="workflow-grid">
    ${D3_INTAKE_STATUSES.map(st => `<div class="workflow-step"><span class="status ${statusClass(st)}">${fmt(st)}</span><small>${fmt(d3StatusAction(st))}</small></div>`).join('')}
  </div>`;
}

function d3IntakeDetailBody(record, actions) {
  const c = record.classification || {};
  const raw = record.request?.raw_text || '';
  return `${actions}
    <section class="detail-section"><h3>Raw requirement text</h3><pre class="code block raw-text">${fmt(raw)}</pre></section>
    <section class="detail-section"><h3>Triage update</h3>
      <form id="d3TriageForm" class="intake-form triage-form" data-d3-record-id="${esc(record.id || '')}">
        <div class="form-grid">
          <label>Status<select name="raw_inbox_status">${options(D3_INTAKE_STATUSES, c.raw_inbox_status || 'new')}</select></label>
          <label>Priority<select name="priority">${options(D3_INTAKE_PRIORITIES, c.priority || 'untriaged')}</select></label>
          <label>Risk<select name="risk_level">${options(D3_INTAKE_RISKS, c.risk_level || 'unknown')}</select></label>
          <label>Next action<select name="next_action">${options(D3_INTAKE_ACTIONS, c.next_action || d3StatusAction(c.raw_inbox_status || 'new'))}</select></label>
          <label>Owner<input name="owner" value="${esc(c.owner || 'unassigned')}"></label>
          <label>Operator note<input name="note" value="${esc(record.ui_overlay?.note || '')}" placeholder="why status changed"></label>
        </div>
        <p class="label">Safe UI overlay only: no production Kanban archival, no child task creation, no DB writes.</p>
        <div class="toolbar"><button type="submit">Save triage overlay</button>${copyButton('Copy updated record JSON', jsonCopy(record))}</div>
      </form>
    </section>
    <section class="detail-section"><h3>Source metadata / audit</h3><pre class="code block">${fmt(stringify({...record, request: {...(record.request || {}), raw_text: '[shown above unchanged]'}}, 6000))}</pre></section>`;
}

function d3Intake() {
  const inbox = state.d3_intake || {};
  const qualification = state.d3_client_qualification || {};
  const allRecords = d3AllIntakeRecords();
  const counts = {...(inbox.counts || {}), ...d3InboxCounts(allRecords)};
  const statusOptions = ['all', ...D3_INTAKE_STATUSES, 'unknown'].map(x => `<option value="${esc(x)}"${filters.d3IntakeStatus === x ? ' selected' : ''}>${fmt(x)}</option>`).join('');
  const records = allRecords
    .filter(r => filters.d3IntakeStatus === 'all' || (r.classification?.raw_inbox_status || r.audit?.capture_status || 'unknown') === filters.d3IntakeStatus)
    .filter(r => includes(r, filters.d3Intake));
  const qualificationResults = asArray(qualification.latest_results).filter(r => includes(r, filters.d3Intake));
  const captureTemplate = `{"source":{"platform":"manual","channel_or_form":"manual","captured_by":"operator"},"client_or_submitter":{"name":"unknown","contact_channel":"unknown"},"request":{"raw_text":"<original inbound D3 automation request exactly as received>"}}`;
  const qualificationTemplate = `{"automation_key":"webstudio:D3:client-qualification","lead_id":"<stable-lead-id>","received_at":"<ISO-8601>","source":{"channel":"manual","source_ref":"<message/form/ref>","original_request_summary":"<1-3 sentence summary>"},"client_contact":{"name":"","company_or_brand":"","contact_channel":"telegram","contact_value":""},"business_goal":{"primary_pain":"manual_process","desired_result":"","main_user_action":"receive_status"},"requested_scope":{"requested_format":"automation","first_version_must_have":[]},"budget_and_expectations":{"budget_range":"","accepts_estimate_after_scope":true},"timeline":{"target_date":"","flexibility":"unknown"},"decision_and_ownership":{"decision_maker_name_role":"","is_decision_maker_involved":"unknown","feedback_owner":""},"materials_readiness":{"current_process_or_scripts":"unknown","access_owner":""},"risk_and_constraints":{"regulated_domain":"unknown","personal_or_sensitive_data":"unknown","payments_or_accounts":"unknown","production_system_changes":"unknown"}}`;
  const sourceState = inbox.available === false ? 'error: snapshot backend unavailable' : inbox.store?.exists ? 'loaded' : 'empty store';
  return `<div class="grid">
    ${metric('D3 inbox records', allRecords.length || inbox.record_count || 0, 'span-3')}
    ${metric('Needs clarification', counts.needs_clarification || 0, 'span-3')}
    ${metric('Qualified', counts.qualified || 0, 'span-3')}
    ${metric('Blocked owner', counts.blocked_owner || 0, 'span-3')}
    ${card('D3 capture contract', `${kv({source_of_truth: inbox.source_of_truth, tenant: inbox.tenant, source_board: inbox.source_board, source_view: inbox.source_view, root_production_card_id: inbox.root_production_card_id, production_card_preserved: inbox.safety?.production_card_preserved, duplicate_child_tasks: inbox.safety?.child_task_creation_on_duplicate, source_state: sourceState})}${toolbar([copyButton('Copy capture CLI', 'cd /workspace/projects/webstudio-ops-dashboard && python3 scripts/d3_intake_backend.py --raw-text "<original request>" --platform manual --channel-or-form manual'), copyButton('Copy payload template', captureTemplate), copyButton('Copy store path', inbox.source_of_truth || '/workspace/data/webstudio/d3/raw-requirements-inbox.jsonl')])}`, 'span-8')}
    ${card('Workflow states', d3WorkflowHelp(), 'span-4')}
    ${card('Capture new raw request', d3IntakeForm(), 'span-12')}
    ${card('D3 client qualification workflow', `${kv({source_of_truth: qualification.source_of_truth, action_queue: qualification.action_queue, automation_key: qualification.automation_key || 'webstudio:D3:client-qualification', safety: qualification.safety})}${toolbar([copyButton('Copy qualification CLI', 'cd /workspace/projects/webstudio-ops-dashboard && python3 scripts/d3_client_qualification.py --input-json /path/to/lead.json'), copyButton('Copy qualification template', qualificationTemplate), copyButton('Copy qualification state CLI', 'cd /workspace/projects/webstudio-ops-dashboard && python3 scripts/d3_client_qualification.py --state')])}`, 'span-12')}
    ${card('Inbox counts', kv(counts || {}), 'span-4')}
    ${card('Qualification decisions', kv(qualification.by_decision || {}), 'span-4')}
    ${card('Qualification routes', kv(qualification.by_route || {}), 'span-4')}
    ${card('Backend files', kv({store: inbox.store, qualification_store: qualification.store, log: qualification.log || inbox.log}), 'span-12')}
    <section class="card span-12"><h3>Raw requirements inbox</h3><div class="filters intake-filters">${searchBox('d3IntakeSearch', 'Search D3 raw requests / source / submitter / action…', filters.d3Intake)}<select id="d3IntakeStatusFilter">${statusOptions}</select></div>${records.length ? rows(records, d3IntakeRecord) : `<div class="empty"><strong>${filters.d3Intake || filters.d3IntakeStatus !== 'all' ? 'No D3 intake records match filters.' : 'No captured D3 intake records yet.'}</strong><br>Use the capture form for local drafting or the copy-only backend CLI for canonical JSONL capture.</div>`}</section>
    <section class="card span-12"><h3>Client qualification decisions</h3>${rows(qualificationResults, r => row(r.lead_id, `${r.classification?.decision || 'unknown'} · ${r.classification?.route || 'unknown'}`, r.status || 'processed', `score=${r.classification?.score_total || 0}/21 · priority=${r.classification?.priority || '—'} · action=${r.recommended_next_action?.type || '—'} · result=${r.result_id || '—'}`, 'json', jsonCopy(r)), 'No D3 qualification decisions yet')}</section>
  </div>`;
}

function clients() {
  const co = state.clients_orders || {};
  const docs = asArray(co.client_docs).filter(d => includes(d, filters.docs));
  const d1 = `New D1 landing/site order:\nClient:\nGoal:\nPages:\nBrand/assets:\nCopy status:\nForms/integrations:\nDeadline:\nApproval needed:`;
  const d2 = `New D2 AI-intake bot order:\nClient:\nIntake scenario:\nQuestions:\nRouting:\nCRM/storage:\nTelegram requirements:\nApproval needed:`;
  const d3 = `New D3 automation order:\nClient:\nProcess:\nInputs:\nOutputs:\nSystems:\nManual steps to automate:\nRisk/approval needed:`;
  return `<div class="grid">
    ${card('Order templates', toolbar([copyButton('Copy D1 intake', d1), copyButton('Copy D2 intake', d2), copyButton('Copy D3 intake', d3)]), 'span-12')}
    ${card('Product-lane backlog', rows(asArray(co.product_backlog), p => row(p.id, p.title, p.status, `${p.product_line} · autonomy=${asArray(p.autonomy).join(', ')}`, 'json', jsonCopy(p))), 'span-12')}
    <section class="card span-12"><h3>Client / deliverable docs</h3>${searchBox('docSearch', 'Search docs…', filters.docs)}${rows(docs, d => row('doc', d.name, d.exists ? 'available' : 'missing', `${d.path} · ${d.size || 0} bytes · ${d.sha256 || 'no sha'}`, 'artifact', jsonCopy(d)), 'No docs match')}</section>
  </div>`;
}

function salesPack() {
  const d1Offer = `D1 Web presence package\nPromise: launch-ready landing/site with intake, QA evidence, rollback notes, and owner-safe handoff.\nInputs needed: niche, offer, audience, brand assets, examples, contact route.\nAcceptance: desktop/mobile screenshots, form smoke, no frontend secrets, final checklist.`;
  const d2Offer = `D2 AI intake bot package\nPromise: scripted Telegram intake assistant with scenario map, escalation rules, transcript examples, and admin handoff.\nInputs needed: qualification questions, routing rules, CRM/storage target, human fallback.\nAcceptance: 3 scenario transcripts, redacted privacy review, owner approval for any live integrations.`;
  const d3Offer = `D3 automation package\nPromise: repeatable business workflow automation blueprint plus safe local proof artifacts before live system writes.\nInputs needed: current process, systems, data fields, exceptions, approval owners.\nAcceptance: dry-run log, rollback plan, verification checklist, explicit approval before production writes.`;
  const packageOnePager = `WebStudio package one-pager\nD1 Site: one offer page, mobile proof, lead route, QA packet.\nD2 Intake: scripted bot flow, 3 scenario transcripts, handoff map.\nD3 Automation: process map, dry-run proof, exception matrix.\nGuarantee: no production writes without owner approval.\nEvidence: artifact index, smoke log, rollback note, final owner summary.`;
  const d2Scenarios = `D2 scenario pack\n1. Ideal lead: clear need, full contact route, human follow-up.\n2. Unclear lead: missing data, clarifying questions, no false promise.\n3. Risky request: private data or live-system change, safe refusal plus approval gate.\nEach transcript must include intent, extracted fields, escalation reason, and redacted privacy note.`;
  const d3Matrix = `D3 exception matrix\nRows: missing input, invalid format, duplicate job, external outage, approval-required write, rollback requested.\nColumns: detector, safe response, owner message, artifact path, verification step.\nRule: dry-run only until owner approves exact target and rollback plan.`;
  const closeout = `Client closeout checklist\n1. Confirm scope and forbidden actions.\n2. Attach QA screenshots / smoke logs.\n3. Attach artifact index and rollback notes.\n4. List live blockers and approval-needed items.\n5. State acceptance result: PASS, PASS_WITH_APPROVAL_BLOCKERS, or BLOCKED.\n6. Send short owner summary with next safe step.`;
  const pricingAcceptance = `WebStudio pricing / acceptance matrix\nD1 Site: fixed scope + lead-route smoke + mobile/desktop screenshots. Acceptance: static preview, no frontend secrets, form/link proof.\nD2 Bot: scenario map + 3 transcripts + privacy/escalation review. Acceptance: offline transcript PASS; live token/CRM writes approval-gated.\nD3 Automation: process map + dry-run evidence + exception matrix. Acceptance: dry-run PASS; production write approval-gated.\nCloseout statuses: PASS, PASS_WITH_APPROVAL_BLOCKERS, BLOCKED.`;
  const proofChecklist = `Closeout proof checklist\n- Scope/forbidden actions captured.\n- Build or static smoke log attached.\n- Browser/screenshot evidence attached when visual.\n- Secret scan redacted and clean for frontend/static assets.\n- Rollback/backup path listed.\n- Approval-needed actions separated from completed safe work.`;
  const d1Proposal = `D1 conversion proposal template\nClient / niche:\nMain conversion goal:\nAudience pain:\nAbove-fold promise:\nSections: hero, proof, offer, process, FAQ, lead route.\nEvidence required: desktop screenshot, mobile screenshot, link/form smoke, frontend secret scan.\nApproval gates: public launch, DNS, paid assets, production analytics/forms.`;
  const approvalNormalizer = `Approval packet normalizer\nDecision needed:\nAllowed files/actions:\nForbidden files/actions:\nCommands to run:\nRisk level:\nRollback plan:\nVerification plan:\nOwner-safe summary:\nRule: do not execute gated action until exact scope is approved.`;
  const handoffFaq = `Client handoff FAQ\nQ: What is finished?\nA: Safe verified scope listed in the closeout checklist with artifact paths.\nQ: What still needs approval?\nA: Public launch, DNS, paid assets, production credentials, live tokens, CRM/storage writes, scheduled jobs.\nQ: How do we accept?\nA: Reply PASS, PASS_WITH_APPROVAL_BLOCKERS, or BLOCKED with missing proof.\nQ: What proof should be attached?\nA: screenshots, smoke log, redacted frontend scan, rollback/backup path, approval packet if gated.`;
  const freshnessThresholds = `Artifact freshness thresholds\nFresh: generated during current tick or after latest owner scope change.\nWatch: older than 24h but still matching current scope.\nStale: older than 72h, references missing files, or predates a changed acceptance gate.\nRefresh trigger: before client handoff, after UI copy change, after approval decision, or after failed smoke.`;
  const proofExamples = `Proof examples\nD1: desktop/mobile screenshot, link smoke, lead-route test, frontend secret scan.\nD2: three transcript paths, escalation reason, privacy note, human handoff owner.\nD3: dry-run log, inputs/outputs table, exception matrix, rollback note.\nAlways attach: artifact index path, backup path, acceptance status, approval packet for gated work.`;
  const ownerDecisionDigest = `Owner decision digest\nAccept safe scope: PASS.\nAccept safe scope but keep gated items waiting: PASS_WITH_APPROVAL_BLOCKERS.\nNeed more proof: BLOCKED with missing artifact names.\nApprove a gated action only with exact scope, allowed files/actions, rollback, and verification.`;
  const launchReadiness = `Public launch readiness checklist\n1. Static preview accepted by owner.\n2. Desktop and mobile screenshots attached.\n3. Lead route/link/form smoke attached.\n4. Frontend secret scan clean or redacted.\n5. Backup/rollback path listed.\n6. DNS, analytics, paid assets, production forms remain approval-gated until exact scope is approved.`;
  const clientTranscriptPack = `Client example transcript pack\nD1 lead: problem, desired outcome, proof needed, contact route, acceptance status.\nD2 intake: qualification answers, extracted fields, escalation reason, privacy note.\nD3 automation: current manual step, proposed dry-run, exceptions, owner approval boundary.\nEvery transcript ends with artifact path + next safe step.`;
  const weeklyOpsDigest = `Weekly WebStudio ops digest\nWins: completed safe artifacts and verified dashboard state.\nWatch: stale screenshots, old smoke logs, pending approvals, snapshot queue.\nDecisions: exact owner approvals needed for live actions.\nNext safe work: report-only QA, copy packs, local dashboard proof, redacted scans.`;
  const screenshotFallback = `Screenshot fallback checklist\nPrimary: capture browser evidence from local preview when reachable.\nFallback: if browser preview is refused, attach file smoke, threaded HTTP status, byte size, and SHA-256.\nRefresh trigger: any UI copy change, changed acceptance gate, or failed smoke.\nOwner note: visual proof remains WATCH until browser screenshot is attached.`;
  const morningReviewQueue = `Morning owner review queue\n1. Check latest marathon index entry.\n2. Review blockers: GitHub CLI path, happrovals sandbox HOME, snapshot backlog.\n3. Accept safe artifacts with PASS or PASS_WITH_APPROVAL_BLOCKERS.\n4. Approve any live action only with exact scope, rollback, and verification.\n5. Pick next product lane: D1 site, D2 intake bot, or D3 automation proof.`;
  const approvalSchemaQa = `Approval packet QA checklist\nRequired fields: task_id, requested_action, allowed_files, forbidden_files, commands, risk_level, rollback_plan, verification_plan.\nSafety checks: exact scope, no env/config/systemd/cron changes, no secrets, no production writes.\nDecision states: APPROVE exact scope, NEEDS_INFO with missing field, DEFER, REJECT.\nEvidence: packet path, reviewer, timestamp, linked artifact.`;
  const proofBundleMatrix = `D1/D2/D3 proof bundle matrix\nD1 site: responsive screenshots, link/form smoke, frontend secret scan, backup path.\nD2 intake: scenario map, three transcripts, escalation rule, privacy note.\nD3 automation: dry-run log, inputs/outputs table, exception matrix, rollback note.\nFreshness rule: WATCH after 24h, STALE after 72h or after scope change.`;
  const clientMorningScript = `Morning client update script\nStatus: safe work completed overnight.\nProof: latest marathon index plus artifact paths.\nDecision needed: PASS, PASS_WITH_APPROVAL_BLOCKERS, or BLOCKED with missing proof.\nBoundaries: public launch, live tokens, CRM/storage writes, paid assets, and scheduled jobs wait for exact owner approval.`;
  return `<div class="grid">
    ${card('Three productized offers', toolbar([copyButton('Copy D1 offer', d1Offer), copyButton('Copy D2 offer', d2Offer), copyButton('Copy D3 offer', d3Offer), copyButton('Copy closeout checklist', closeout)]), 'span-12')}
    ${card('Client-ready copy assets', toolbar([copyButton('Copy package one-pager', packageOnePager), copyButton('Copy D1 proposal template', d1Proposal), copyButton('Copy D2 scenario pack', d2Scenarios), copyButton('Copy D3 exception matrix', d3Matrix), copyButton('Copy pricing/acceptance matrix', pricingAcceptance), copyButton('Copy proof checklist', proofChecklist), copyButton('Copy approval normalizer', approvalNormalizer), copyButton('Copy handoff FAQ', handoffFaq), copyButton('Copy freshness thresholds', freshnessThresholds), copyButton('Copy proof examples', proofExamples), copyButton('Copy owner decision digest', ownerDecisionDigest), copyButton('Copy launch readiness', launchReadiness), copyButton('Copy transcript pack', clientTranscriptPack), copyButton('Copy weekly ops digest', weeklyOpsDigest), copyButton('Copy screenshot fallback', screenshotFallback), copyButton('Copy morning review queue', morningReviewQueue), copyButton('Copy approval schema QA', approvalSchemaQa), copyButton('Copy proof bundle matrix', proofBundleMatrix), copyButton('Copy morning client script', clientMorningScript)]), 'span-12')}
    ${card('Client handoff FAQ', `<pre class="code mini">${fmt(handoffFaq)}</pre>${toolbar([copyButton('Copy handoff FAQ', handoffFaq)])}`, 'span-6')}
    ${card('Public launch readiness', `<pre class="code mini">${fmt(launchReadiness)}</pre>${toolbar([copyButton('Copy launch readiness', launchReadiness)])}`, 'span-6')}
    ${card('Client example transcripts', `<pre class="code mini">${fmt(clientTranscriptPack)}</pre>${toolbar([copyButton('Copy transcript pack', clientTranscriptPack)])}`, 'span-6')}
    ${card('Weekly ops digest', `<pre class="code mini">${fmt(weeklyOpsDigest)}</pre>${toolbar([copyButton('Copy weekly ops digest', weeklyOpsDigest)])}`, 'span-6')}
    ${card('Screenshot fallback checklist', `<pre class="code mini">${fmt(screenshotFallback)}</pre>${toolbar([copyButton('Copy screenshot fallback', screenshotFallback)])}`, 'span-6')}
    ${card('Morning owner review queue', `<pre class="code mini">${fmt(morningReviewQueue)}</pre>${toolbar([copyButton('Copy morning review queue', morningReviewQueue)])}`, 'span-6')}
    ${card('Approval packet QA', `<pre class="code mini">${fmt(approvalSchemaQa)}</pre>${toolbar([copyButton('Copy approval schema QA', approvalSchemaQa)])}`, 'span-6')}
    ${card('Proof bundle freshness matrix', `<pre class="code mini">${fmt(proofBundleMatrix)}</pre>${toolbar([copyButton('Copy proof bundle matrix', proofBundleMatrix)])}`, 'span-6')}
    ${card('Morning client update script', `<pre class="code mini">${fmt(clientMorningScript)}</pre>${toolbar([copyButton('Copy morning client script', clientMorningScript)])}`, 'span-6')}
    ${card('Artifact freshness thresholds', `<pre class="code mini">${fmt(freshnessThresholds)}</pre>${toolbar([copyButton('Copy freshness thresholds', freshnessThresholds)])}`, 'span-6')}
    ${card('Proof examples', `<pre class="code mini">${fmt(proofExamples)}</pre>${toolbar([copyButton('Copy proof examples', proofExamples)])}`, 'span-6')}
    ${card('Owner decision digest', `<pre class="code mini">${fmt(ownerDecisionDigest)}</pre>${toolbar([copyButton('Copy owner decision digest', ownerDecisionDigest)])}`, 'span-6')}
    ${card('D1 · Website delivery gate', kv({safe_default: 'static/local preview first', proof: 'screenshots + smoke + link/form test', acceptance: 'PASS when static preview, responsive evidence, and lead-route proof are attached', approval_needed: 'public launch, DNS, paid assets, production credentials', artifact: '/workspace/output/webstudio-ai-automation-handoff-index-v3.md'}), 'span-4')}
    ${card('D2 · AI-intake bot gate', kv({safe_default: 'scenario scripts + offline transcripts', proof: '3 realistic conversations + escalation map', acceptance: 'PASS_WITH_APPROVAL_BLOCKERS until live token/CRM writes are approved', approval_needed: 'live Telegram token, CRM write, production storage', artifact: '/workspace/output/webstudio-ai-automation-backend-inquiry-api-approval-plan-v2.md'}), 'span-4')}
    ${card('D3 · Automation gate', kv({safe_default: 'read-only audit + dry-run plan', proof: 'inputs/outputs table + exception matrix', acceptance: 'PASS_WITH_APPROVAL_BLOCKERS until production writes/schedules are approved', approval_needed: 'system writes, scheduled jobs, external account changes', artifact: '/workspace/output/webstudio-ai-automation-production-readiness-checklist-v1.md'}), 'span-4')}
    ${card('Closeout status rubric', kv({PASS: 'safe scope complete and verified', PASS_WITH_APPROVAL_BLOCKERS: 'safe artifacts complete; live action awaits owner approval', BLOCKED: 'missing required input or broken verification', default_owner_message: 'completed safe work + artifact paths + exact approval needed'}), 'span-12')}
    ${card('Operator note', 'This tab is copy-only. It adds sales/client lifecycle prompts without creating workers, dispatching Kanban, changing runtime config, or touching secrets.', 'span-12')}
  </div>`;
}

function morningDesk() {
  const statusScript = `Morning owner desk\n1. Read latest heartbeat in /workspace/output/webstudio-12h-marathon-index.md.\n2. Pick one safe lane: D1 site, D2 intake bot, D3 automation, or Ops proof.\n3. Reply PASS if current safe scope is accepted, WATCH if more evidence is needed, BLOCKED with the missing artifact name.\n4. For public launch or live integrations, approve exact target, allowed actions, rollback, and verification.\n5. Keep runtime, secrets, systemd, cron, provider routing, and production data out of autonomous scope.`;
  const objectionMap = `Client objection map\nToo abstract: attach screenshot/smoke/proof path.\nToo risky: split safe local artifact from owner-approved live action.\nToo expensive: offer D1 quick proof, D2 transcript proof, or D3 dry-run proof.\nNeed trust: show redacted scan, rollback note, and acceptance checklist.\nNeed speed: choose one lane and one acceptance gate for today's proof.`;
  const nextTaskMenu = `Next safe task menu\nA. Refresh D1 landing proof packet with screenshots/smoke when browser proof is available.\nB. Draft D2 intake bot offline scenario pack with 3 transcripts.\nC. Draft D3 automation dry-run exception matrix.\nD. Audit approval queue and normalize packet fields.\nE. Rebuild static Ops Dashboard and attach redacted scan + HTTP hash evidence.`;
  const approvalText = `Approval wording template\nAPPROVE exact scope: [action].\nAllowed files/actions: [list].\nForbidden: runtime config, secrets, env, systemd, cron, production data, provider routing.\nRollback: [backup/path or restore command].\nVerification: [build/smoke/screenshot/redacted scan].\nStop if: missing proof, unexpected file change, secret marker, failed smoke.`;
  const handoff = `Morning handoff summary\nCompleted overnight: safe reports, copy packs, dashboard proof, QMD/finalizer records.\nWatch items: stale watchdog status, snapshot queue, happrovals sandbox HOME issue, GitHub CLI wrapper unavailable.\nDecision needed: choose product lane and approve only exact live actions if wanted.\nDefault next step: continue report-only/local static proof work.`;
  const triageScript = `Morning risk triage\n1. Classify each request: SAFE_LOCAL, APPROVAL_NEEDED, or BLOCKED.\n2. SAFE_LOCAL: report, static proof, copy pack, screenshot, redacted scan.\n3. APPROVAL_NEEDED: public launch, live token, CRM/storage write, DNS, paid asset, scheduled job.\n4. BLOCKED: missing scope, missing rollback, failed proof, secret marker, production data risk.\n5. Owner update: state class, evidence path, exact next safe step.`;
  const evidenceTriage = `Evidence triage rubric\nPASS: current build/smoke plus visual or HTTP hash evidence.\nWATCH: file/static proof exists but browser screenshot is missing or snapshot queue is stale.\nBLOCKED: smoke failed, missing artifact, unsafe scope, or owner approval needed.\nAlways include: artifact path, timestamp, backup path if UI changed, redacted scan result.`;
  const deliverySla = `Owner morning delivery SLA\n0-5 min: read latest heartbeat and index path.\n5-15 min: classify owner decision as PASS, WATCH, BLOCKED, or APPROVE exact gated scope.\n15-30 min: refresh missing proof only; do not widen scope.\nDaily: one client-ready proof bundle per chosen lane, with artifact paths and acceptance status.\nEscalate: missing rollback, failed smoke, secret marker, production data risk, or unclear approval.`;
  const clientProofMenu = `Client proof menu\nD1: static preview, responsive screenshots, lead-route smoke, redacted frontend scan.\nD2: three offline transcripts, extraction table, escalation rule, privacy note.\nD3: dry-run input/output sample, exception matrix, rollback note, owner approval boundary.\nOps: dashboard build log, smoke log, HTTP hash evidence, QMD/finalizer status.\nEach proof ends with PASS, WATCH, or BLOCKED plus next safe step.`;
  return `<div class="grid">
    ${metric('Desk mode', 'owner-safe', 'span-3')}
    ${metric('Live actions', 'gated', 'span-3')}
    ${metric('Default next', 'local proof', 'span-3')}
    ${metric('Delivery', 'heartbeat', 'span-3')}
    ${card('Morning status script', `<pre class="code mini">${fmt(statusScript)}</pre>${toolbar([copyButton('Copy morning status', statusScript)])}`, 'span-6')}
    ${card('Objection map', `<pre class="code mini">${fmt(objectionMap)}</pre>${toolbar([copyButton('Copy objection map', objectionMap)])}`, 'span-6')}
    ${card('Next safe task menu', `<pre class="code mini">${fmt(nextTaskMenu)}</pre>${toolbar([copyButton('Copy next task menu', nextTaskMenu)])}`, 'span-6')}
    ${card('Approval wording template', `<pre class="code mini">${fmt(approvalText)}</pre>${toolbar([copyButton('Copy approval wording', approvalText)])}`, 'span-6')}
    ${card('Morning risk triage', `<pre class="code mini">${fmt(triageScript)}</pre>${toolbar([copyButton('Copy risk triage', triageScript)])}`, 'span-6')}
    ${card('Evidence triage rubric', `<pre class="code mini">${fmt(evidenceTriage)}</pre>${toolbar([copyButton('Copy evidence triage', evidenceTriage)])}`, 'span-6')}
    ${card('Owner morning delivery SLA', `<pre class="code mini">${fmt(deliverySla)}</pre>${toolbar([copyButton('Copy delivery SLA', deliverySla)])}`, 'span-6')}
    ${card('Client proof menu', `<pre class="code mini">${fmt(clientProofMenu)}</pre>${toolbar([copyButton('Copy proof menu', clientProofMenu)])}`, 'span-6')}
    ${card('Handoff summary', `<pre class="code mini">${fmt(handoff)}</pre>${toolbar([copyButton('Copy handoff summary', handoff)])}`, 'span-12')}
  </div>`;
}

function approvals() {
  const list = asArray(state.approvals).filter(a => includes(a, filters.approvals));
  return `<div class="grid">
    ${metric('Owner approvals', asArray(state.approvals).length)}
    ${card('Approval source-of-truth', `${kv({source: '/workspace/output/webstudio-control-plane-state.json#/approvals', visible_in: 'Telegram + Kanban + Ops site', quiet_notifications: true})}${toolbar([copyButton('Copy approve template', 'APPROVE: planning/report-only continuation for {id}. No production writes, no env/config/cron/systemd changes.'), copyButton('Copy needs-info template', 'NEEDS INFO: {id}. Provide summary, risks, expected artifact/output, and required owner decision.'), copyButton('Copy defer template', 'DEFER: {id}. Keep blocked/approval_required until owner revisits.'), copyButton('Copy reject template', 'REJECT: {id}. Do not proceed with this path.')])}`, 'span-9')}
    <section class="card span-12"><h3>Approval queue</h3>${searchBox('approvalSearch', 'Search approvals…', filters.approvals)}${rows(list, a => row(a.id, a.title, a.status, `${a.source} · channels=${asArray(a.channels).join(', ')}`, 'approval', jsonCopy(a)))}</section>
  </div>`;
}

function health() {
  const h = state.health || {};
  return `<div class="grid">
    ${card('Host / runtime', `${kv({gateway_active: h.gateway_active, primary_model: h.primary_model_line, snapshot: h.host_snapshot?.path, snapshot_mtime: h.host_snapshot?.mtime, status: h.status})}${toolbar([copyButton('Copy qmd status command', 'qmd status'), copyButton('Copy host snapshot path', '/workspace/runtime/host-health-snapshot.txt')])}`, 'span-6')}
    ${card('QMD', kv(h.qmd), 'span-6')}
    ${card('Bad config summary', `<pre class="code block">${fmt(h.bad_config_summary || 'none')}</pre>`, 'span-6')}
    ${card('GitHub Readiness', `${kv(state.github_readiness || {})}${state.github_readiness?.completion_result?.pr_url ? `<div class="toolbar"><a class="copy" href="${esc(state.github_readiness.completion_result.pr_url)}" target="_blank" rel="noreferrer">Открыть PR</a>${copyButton('Скопировать PR URL', state.github_readiness.completion_result.pr_url)}</div>` : ''}`, 'span-6')}
    ${card('System hardening v3', `${kv(state.system_hardening || {})}${toolbar([copyButton('Copy snapshot processor', '/workspace/.hermes/scripts/hermes-auto-snapshot-processor.sh'), copyButton('Copy QMD embed script', '/workspace/.hermes/scripts/qmd-auto-embed.sh'), copyButton('Copy GitHub repair packet', '/workspace/output/github-host-repair-and-pr-v3.sh')])}`, 'span-12')}
    ${card('Sources', rows(Object.entries(state.sources || {}).map(([k,v]) => ({id:k, title:v.path || k, status:v.exists ? 'available' : 'missing', ...v})), s => row(s.id, s.title, s.status, `${s.size || 0} bytes · ${s.mtime || '—'} · ${s.sha256 || 'no sha'}`, 'source', jsonCopy(s))), 'span-12')}
  </div>`;
}

function artifactRow(a) {
  return row('md', a.title, 'artifact', `${a.path} · ${a.size || 0} bytes · ${a.sha256 || 'no sha'}`, 'artifact', jsonCopy(a));
}
function artifacts() {
  const q = filters.artifacts;
  const list = asArray(state.artifacts).filter(a => includes(a, q));
  return `<div class="grid"><section class="card span-12"><h3>Артефакты</h3>${searchBox('artifactSearch', 'Filter artifacts…', q)}${rows(list, artifactRow, 'No artifacts match')}</section></div>`;
}

function marathon() {
  const m = state.marathon_12h || {};
  const artifacts = asArray(state.artifacts).filter(a => /webstudio-12h|marathon/i.test(`${a.path || ''} ${a.title || ''}`));
  const latest = artifacts.slice(0, 12);
  const ownerBrief = `WebStudio Автономный цикл\nStatus: ${m.status || 'unknown'}\nSchedule: ${m.schedule || 'unknown'}\nIndex: /workspace/output/webstudio-12h-marathon-index.md\nNext: pick next production Kanban task, create artifact/QA, rebuild dashboard, qmd update, hfinalize`;
  return `<div class="grid">
    ${metric('Marathon status', m.status || 'unknown', 'span-3')}
    ${metric('Marathon artifacts', artifacts.length, 'span-3')}
    ${metric('WF timer', m.timer_enabled ?? 'unknown', 'span-3')}
    ${metric('Delivery mode', 'heartbeat', 'span-3')}
    ${card('12h Marathon status', `${kv(m)}${toolbar([copyButton('Copy marathon brief', ownerBrief), copyButton('Copy index path', '/workspace/output/webstudio-12h-marathon-index.md')])}`, 'span-12')}
    ${card('Latest marathon evidence', rows(latest, artifactRow, 'No marathon artifacts indexed yet'), 'span-12')}
  </div>`;
}

function audit() {
  const safety = state.safety || {};
  return `<div class="grid">
    ${card('Audit notes', rows(asArray(state.audit?.notes).map((n,i)=>({id:i+1,title:n,status:'note'})), n => row(n.id, n.title, n.status)), 'span-6')}
    ${card('Forbidden actions absent from UI', rows(asArray(safety.forbidden_actions).map(x=>({id:'forbidden',title:x,status:'disabled'})), x => row(x.id, x.title, x.status)), 'span-6')}
    ${card('Raw safety object', `<pre class="code block">${fmt(JSON.stringify(safety, null, 2))}</pre>${toolbar([copyButton('Copy raw safety JSON', jsonCopy(safety)), copyButton('Copy full JSON', jsonCopy(state))])}`, 'span-12')}
  </div>`;
}

function render() {
  document.querySelectorAll('.tabs a').forEach(a => a.classList.toggle('active', a.getAttribute('href') === '#' + route));
  const app = $('#app');
  const map = {overview, 'work-factory': workFactory, kanban, production, 'demo-products': demoProducts, 'agent-workflow': agentWorkflow, capabilities, 'd3-intake': d3Intake, 'owner-feedback': ownerFeedback, clients, 'sales-pack': salesPack, 'morning-desk': morningDesk, approvals, health, artifacts, marathon, audit};
  app.innerHTML = (map[route] || overview)();
  bindInputs();
}

function bindInputs() {
  $('#wfSearch')?.addEventListener('input', e => { filters.wf = e.target.value; render(); });
  $('#kanbanSearch')?.addEventListener('input', e => { filters.kanban = e.target.value; render(); });
  $('#kanbanLaneFilter')?.addEventListener('change', e => { filters.kanbanLane = e.target.value; render(); });
  $('#kanbanKindFilter')?.addEventListener('change', e => { filters.kanbanKind = e.target.value; render(); });
  $('#kanbanShowArchived')?.addEventListener('change', e => { filters.showArchived = e.target.checked; render(); });
  $('#clearFiltersBtn')?.addEventListener('click', () => { filters.kanban = ''; filters.kanbanLane = 'all'; filters.kanbanKind = 'all'; filters.showArchived = false; render(); });
  $('#artifactSearch')?.addEventListener('input', e => { filters.artifacts = e.target.value; render(); });
  $('#approvalSearch')?.addEventListener('input', e => { filters.approvals = e.target.value; render(); });
  $('#docSearch')?.addEventListener('input', e => { filters.docs = e.target.value; render(); });
  $('#d3IntakeSearch')?.addEventListener('input', e => { filters.d3Intake = e.target.value; render(); });
  $('#d3IntakeStatusFilter')?.addEventListener('change', e => { filters.d3IntakeStatus = e.target.value; render(); });
  $('#ownerFeedbackSearch')?.addEventListener('input', e => { filters.ownerFeedback = e.target.value; render(); });
  $('#ownerFeedbackStateFilter')?.addEventListener('change', e => { filters.ownerFeedbackState = e.target.value; render(); });
  document.querySelectorAll('[data-production-filter]').forEach(btn => btn.addEventListener('click', e => { filters.productionQuick = e.currentTarget.dataset.productionFilter || 'active'; render(); }));
}

async function copyText(value) {
  try {
    await navigator.clipboard.writeText(value);
    toast('Copied');
  } catch {
    const ta = document.createElement('textarea');
    ta.value = value;
    document.body.appendChild(ta);
    ta.select();
    document.execCommand('copy');
    ta.remove();
    toast('Copied');
  }
}

function toast(message) {
  const el = $('#toast');
  el.textContent = message;
  el.classList.add('show');
  clearTimeout(toast._t);
  toast._t = setTimeout(() => el.classList.remove('show'), 1600);
}

function openDrawer(title, payload, actions='') {
  const drawer = $('#drawer');
  $('#drawerTitle').textContent = title;
  $('#drawerBody').innerHTML = `${actions}<pre class="code block">${fmt(stringify(payload, 6000))}</pre>`;
  drawer.classList.add('open');
  drawer.setAttribute('aria-hidden', 'false');
}
function closeDrawer() {
  $('#drawer').classList.remove('open');
  $('#drawer').setAttribute('aria-hidden', 'true');
}

function handleDetail(type, raw) {
  let payload;
  try { payload = JSON.parse(raw); } catch { payload = raw; }
  const title = payload?.title || payload?.id || type;
  const path = payload?.path || payload?.output || payload?.source_item?.output || '';
  const actions = toolbar([
    copyButton('Copy JSON', jsonCopy(payload)),
    payload?.id ? copyButton('Copy ID', payload.id) : '',
    path ? copyButton('Copy path', path) : '',
    copyButton('Copy owner-safe summary', `${title}\nstatus=${payload?.status || payload?.classification?.raw_inbox_status || '—'}\nsource=${payload?.source || type}\npath=${path || '—'}`)
  ].filter(Boolean));
  const body = type === 'd3-intake-record' && payload?.request
    ? d3IntakeDetailBody(payload, actions)
    : type === 'owner-feedback-record' && payload?.content
      ? ownerFeedbackDetailBody(payload, actions)
      : null;
  if (body) {
    const drawer = $('#drawer');
    $('#drawerTitle').textContent = String(title);
    $('#drawerBody').innerHTML = body;
    drawer.classList.add('open');
    drawer.setAttribute('aria-hidden', 'false');
    return;
  }
  openDrawer(String(title), payload, actions);
}

function handleD3TriageSubmit(form) {
  const data = Object.fromEntries(new FormData(form).entries());
  const id = form.getAttribute('data-d3-record-id');
  if (!id) return;
  const overlays = readD3IntakeOverlays();
  overlays[id] = {
    raw_inbox_status: data.raw_inbox_status || 'new',
    priority: data.priority || 'untriaged',
    risk_level: data.risk_level || 'unknown',
    next_action: data.next_action || d3StatusAction(data.raw_inbox_status || 'new'),
    owner: data.owner || 'unassigned',
    note: data.note || '',
    updated_at: new Date().toISOString(),
    persistence: 'browser_local_storage_overlay',
    safety: 'no production card archival, no child task creation, no DB write'
  };
  writeD3IntakeOverlays(overlays);
  toast('Saved D3 triage overlay');
  closeDrawer();
  render();
}

async function handleD3IntakeSubmit(form) {
  const data = Object.fromEntries(new FormData(form).entries());
  const errors = [];
  if (!String(data.raw_text || '').trim()) errors.push('Raw requirement text');
  if (!String(data.contact_channel || '').trim()) errors.push('Contact channel');
  if (!String(data.platform || '').trim()) errors.push('Source platform');
  if (!String(data.channel_or_form || '').trim()) errors.push('Channel / form / source name');
  const box = $('#d3Validation');
  if (errors.length) {
    if (box) box.innerHTML = validationList(errors);
    return;
  }
  const now = new Date().toISOString();
  const rawText = String(data.raw_text || '');
  const contentSha = await sha256Hex(`${rawText}\n${data.platform || ''}\n${data.channel_or_form || ''}\n${data.external_message_id || ''}`);
  const fingerprint = data.external_message_id
    ? `${D3_INTAKE_CONTEXT.idempotency_namespace}:${data.platform}:${data.channel_or_form}:${data.external_message_id}`
    : `${D3_INTAKE_CONTEXT.idempotency_namespace}:${data.platform}:${data.channel_or_form}:${contentSha}`;
  const existing = readD3IntakeRecords();
  const duplicateOf = existing.find(r => r.idempotency?.fingerprint === fingerprint)?.id || null;
  const record = {
    id: 'd3-local-' + contentSha.slice(0, 12),
    schema_version: D3_INTAKE_CONTEXT.schema_version,
    record_type: 'raw_requirement',
    product_line: 'D3',
    stage: 'intake',
    tenant: D3_INTAKE_CONTEXT.tenant,
    purpose: 'Inbound request capture and raw requirements inbox',
    source: {
      board: D3_INTAKE_CONTEXT.source_board,
      view: D3_INTAKE_CONTEXT.source_view,
      platform: data.platform,
      channel_or_form: data.channel_or_form,
      external_message_id: data.external_message_id || null,
      source_url: data.source_url || null,
      captured_by: 'ops_dashboard_local_form'
    },
    idempotency: {
      namespace: D3_INTAKE_CONTEXT.idempotency_namespace,
      fingerprint,
      content_sha256: contentSha,
      duplicate_of: duplicateOf,
      duplicate_policy: 'return_existing_without_child_work'
    },
    client_or_submitter: {
      name: data.submitter_name || 'unknown',
      contact_channel: data.contact_channel || 'unknown',
      contact_handle: data.contact_handle || null,
      decision_owner_known: 'unknown'
    },
    request: {
      raw_text: rawText,
      normalized_summary: shortSummary(rawText),
      business_area: data.business_area || 'unknown',
      desired_outcome: 'unknown',
      current_process: 'unknown',
      pain_points: [],
      users_or_roles: [],
      systems_involved: [],
      data_involved: [],
      must_have_features: [],
      nice_to_have_features: [],
      constraints: []
    },
    attachments: [],
    classification: {
      raw_inbox_status: duplicateOf ? 'duplicate' : 'new',
      recommended_route: data.recommended_route || 'unknown',
      priority: data.priority || 'untriaged',
      risk_level: data.risk_level || 'unknown',
      automation_fit: 'unknown',
      next_action: duplicateOf ? 'manual_triage' : 'capture_only',
      owner: data.owner || 'unassigned',
      child_task_id: null
    },
    privacy_and_risk: {
      contains_personal_data: 'unknown',
      contains_sensitive_data: 'unknown',
      regulated_domain: 'unknown',
      production_access_requested: 'unknown',
      credentials_or_private_access_present: 'unknown',
      redaction_required: false,
      retention_class: 'lead_intake'
    },
    audit: {
      received_at: now,
      captured_at: now,
      updated_at: now,
      capture_attempt: 1,
      capture_status: duplicateOf ? 'duplicate' : 'captured',
      source_payload_ref: 'browser-local-form',
      errors: []
    }
  };
  writeD3IntakeRecords([record, ...existing]);
  form.reset();
  toast(duplicateOf ? 'Captured duplicate marker' : 'Captured D3 intake record');
  render();
}


async function handleOwnerFeedbackSubmit(form) {
  const data = Object.fromEntries(new FormData(form).entries());
  const errors = ownerFeedbackValidation(data);
  const box = $('#ownerFeedbackValidation');
  if (errors.length) {
    if (box) box.innerHTML = validationList(errors);
    return;
  }
  const now = new Date().toISOString();
  const rawText = String(data.raw_text || '').trim();
  const contentSha = await sha256Hex(`${rawText}\n${data.source_message_id || ''}\n${data.delivery_lane || 'D1'}`);
  const existing = readOwnerFeedbackRecords();
  const sourceMessageId = data.source_message_id || `manual-${contentSha.slice(0, 12)}`;
  const duplicateOf = existing.find(r => r.source?.source_message_id === sourceMessageId || r.idempotency?.content_sha256 === contentSha)?.id || null;
  const lane = data.delivery_lane || 'D1';
  const triageState = lane === 'owner_decision_required' ? 'owner_decision_pending' : (data.triage_state || 'raw');
  const title = data.normalized_title || ownerFeedbackTitle(rawText);
  const ownerOptions = linesFromTextarea(data.owner_options);
  const feedbackId = 'fbk_' + contentSha.slice(0, 12);
  const record = {
    id: feedbackId,
    schema_version: OWNER_FEEDBACK_CONTEXT.schema_version,
    context: OWNER_FEEDBACK_CONTEXT,
    source: {
      source: OWNER_FEEDBACK_CONTEXT.source,
      source_owner: OWNER_FEEDBACK_CONTEXT.source_owner,
      source_message_id: sourceMessageId,
      received_at: now,
      app_under_test_url: OWNER_FEEDBACK_CONTEXT.app_under_test_url,
      captured_by: 'ops_dashboard_owner_feedback_form'
    },
    content: {
      raw_text: rawText,
      normalized_title: title,
      normalized_summary: data.normalized_summary || shortSummary(rawText),
      feedback_type: data.feedback_type || 'unknown',
      evidence: [],
      affected_area: data.affected_area || 'unknown'
    },
    routing: {
      delivery_lane: lane,
      routing_reason: ownerFeedbackRouteReason(lane, data.feedback_type),
      severity: data.severity || 'medium',
      priority: Number(data.priority || 50),
      triage_state: duplicateOf ? 'duplicate' : triageState,
      decision_state: lane === 'owner_decision_required' ? 'queued' : null,
      followup_kind: data.followup_kind || 'implementation_and_qa'
    },
    implementation: {
      acceptance_criteria: linesFromTextarea(data.acceptance_criteria),
      reproduction_steps: linesFromTextarea(data.reproduction_steps),
      expected_behavior: null,
      actual_behavior: null,
      scope_notes: 'Generated from WebStudio D1 owner admin testing feedback inbox; no Done transition from inbox.'
    },
    links: {
      linked_kanban_task_ids: [], implementation_task_id: null, qa_task_id: null, owner_decision_task_id: null, duplicate_of: duplicateOf, superseded_by: null
    },
    owner_decision: lane === 'owner_decision_required' ? {
      decision_id: 'dec_' + contentSha.slice(0, 12),
      feedback_id: feedbackId,
      question: data.owner_question || 'Какой результат нужен по этому owner feedback?',
      options: ownerOptions.length ? ownerOptions.slice(0, 4) : ['Route to D1 implementation with narrow UI acceptance criteria', 'Route to D3 workflow/spec decision before implementation'],
      recommended_option: ownerOptions[0] || 'Route to D1 implementation with narrow UI acceptance criteria',
      blocking: true,
      decision_state: 'queued',
      owner_answer_raw: null,
      owner_answer_normalized: null,
      applied_to_feedback_at: null
    } : null,
    idempotency: {content_sha256: contentSha, duplicate_of: duplicateOf, duplicate_policy: 'mark_duplicate_not_done'},
    audit: {created_by: 'ops_dashboard_local_form', updated_by: 'ops_dashboard_local_form', created_at: now, updated_at: now, closed_at: null, close_reason: null, guard: 'raw owner feedback cannot move directly to Done'}
  };
  writeOwnerFeedbackRecords([record, ...existing]);
  form.reset();
  toast(duplicateOf ? 'Captured duplicate owner feedback marker' : 'Captured owner feedback');
  render();
}
function buildOwnerFeedbackPayloads(record, kind) {
  const lane = record.routing?.delivery_lane || 'D1';
  const title = record.content?.normalized_title || 'Owner feedback';
  const baseBody = [
    `Feedback id: ${record.id}`,
    `Owner source: ${record.source?.source_owner || OWNER_FEEDBACK_CONTEXT.source_owner} / ${record.source?.source || OWNER_FEEDBACK_CONTEXT.source}`,
    `Source message id: ${record.source?.source_message_id || 'manual'}`,
    `Lane: ${lane}`,
    `App under test: ${record.context?.app_under_test_url || OWNER_FEEDBACK_CONTEXT.app_under_test_url}`,
    `Summary: ${record.content?.normalized_summary || title}`,
    `Acceptance criteria:\n${asArray(record.implementation?.acceptance_criteria).map(x => '- ' + x).join('\n') || '- Needs owner clarification before implementation'}`,
    `Reproduction / QA notes:\n${asArray(record.implementation?.reproduction_steps).map(x => '- ' + x).join('\n') || '- Not provided yet'}`,
    `Exclusions: Do not mark feedback inbox Done; do not perform production writes; verify owner-visible behavior through QA/owner acceptance.`
  ].join('\n\n');
  if (kind === 'owner_decision') {
    return [{
      title: `[OWNER-DECISION][owner-feedback] ${title}`,
      assignee: 'default',
      tenant: OWNER_FEEDBACK_CONTEXT.tenant,
      status: 'todo_or_ready_not_done',
      body: `${baseBody}\n\nOwner question: ${record.owner_decision?.question || 'Clarify desired result'}\nOptions:\n${asArray(record.owner_decision?.options).map(x => '- ' + x).join('\n')}`,
      idempotency_key: `webstudio:D1:owner-feedback:${record.id}:decision`
    }];
  }
  const payloads = [];
  if (kind !== 'qa_only') {
    payloads.push({
      title: `[${lane}][owner-feedback] ${title}`,
      assignee: 'default',
      tenant: OWNER_FEEDBACK_CONTEXT.tenant,
      status: 'todo_or_ready_not_done',
      body: baseBody,
      idempotency_key: `webstudio:${lane}:owner-feedback:${record.id}:implementation`
    });
  }
  if (kind !== 'implementation_only') {
    payloads.push({
      title: `[QA][${lane}][owner-feedback] Verify ${title}`,
      assignee: 'default',
      tenant: OWNER_FEEDBACK_CONTEXT.tenant,
      status: 'todo_or_ready_not_done',
      parent_policy: payloads[0] ? 'depends_on_implementation_card' : 'qa_only_read_only_check',
      body: `${baseBody}\n\nQA verification: confirm acceptance criteria, regression risk, and owner-visible result. Feedback item can only close after QA pass plus owner acceptance/waiver.`,
      idempotency_key: `webstudio:${lane}:owner-feedback:${record.id}:qa`
    });
  }
  return payloads;
}
function handleOwnerFeedbackScope(id, kind) {
  const records = readOwnerFeedbackRecords();
  const idx = records.findIndex(r => r.id === id);
  if (idx < 0) return;
  const record = ownerFeedbackApplyOverlay(records[idx], readOwnerFeedbackOverlays()[id]);
  const payloads = buildOwnerFeedbackPayloads(record, kind || record.routing?.followup_kind || 'implementation_and_qa');
  records[idx] = {
    ...records[idx],
    card_payloads: payloads,
    routing: {...records[idx].routing, triage_state: kind === 'owner_decision' ? 'owner_decision_pending' : 'scoped_to_kanban'},
    audit: {...records[idx].audit, updated_at: new Date().toISOString(), updated_by: 'ops_dashboard_payload_preparer'}
  };
  writeOwnerFeedbackRecords(records);
  copyText(jsonCopy(payloads));
  toast('Prepared scoped card payloads and copied JSON');
  closeDrawer();
  render();
}


window.addEventListener('hashchange', () => { route = window.location.hash.replace('#','') || 'overview'; render(); });
$('#refreshBtn').addEventListener('click', loadState);
$('#exportBtn').addEventListener('click', () => {
  const blob = new Blob([JSON.stringify(state, null, 2)], {type: 'application/json'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = 'webstudio-control-plane-state.json'; a.click();
  URL.revokeObjectURL(url);
});
$('#drawerClose').addEventListener('click', closeDrawer);
$('#drawerBackdrop').addEventListener('click', closeDrawer);
document.addEventListener('keydown', e => { if (e.key === 'Escape') closeDrawer(); });
document.addEventListener('submit', e => {
  const ownerForm = e.target.closest?.('#ownerFeedbackForm');
  if (ownerForm) {
    e.preventDefault();
    handleOwnerFeedbackSubmit(ownerForm);
    return;
  }
  const triageForm = e.target.closest?.('#d3TriageForm');
  if (triageForm) {
    e.preventDefault();
    handleD3TriageSubmit(triageForm);
    return;
  }
  const form = e.target.closest?.('#d3IntakeForm');
  if (!form) return;
  e.preventDefault();
  handleD3IntakeSubmit(form);
});
document.addEventListener('click', e => {
  if (e.target.closest('summary') && e.target.closest('.raw-details')) return;
  const ownerScope = e.target.closest('[data-owner-feedback-scope]');
  if (ownerScope) { handleOwnerFeedbackScope(ownerScope.getAttribute('data-owner-feedback-scope'), ownerScope.getAttribute('data-scope-kind')); return; }
  const copy = e.target.closest('[data-copy]');
  if (copy) { copyText(copy.getAttribute('data-copy') || ''); return; }
  const routeCard = e.target.closest('[data-route]');
  if (routeCard) { window.location.hash = routeCard.getAttribute('data-route'); return; }
  const detail = e.target.closest('[data-detail-type]');
  if (detail) handleDetail(detail.getAttribute('data-detail-type'), detail.getAttribute('data-detail-payload'));
});

loadState().catch(err => { $('#app').innerHTML = `<section class="card span-12"><h2>Load failed</h2><pre>${esc(err.stack || err.message)}</pre></section>`; });
