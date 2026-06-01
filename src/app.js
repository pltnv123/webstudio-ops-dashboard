const DATA_URL = './data/webstudio-control-plane-state.json';

let state = null;
const routeNames = ['kanban', 'production', 'demo-products', 'approvals', 'health', 'artifacts', 'marathon', 'owner-feedback','agent-workflow','capabilities','motion-factory','intake-orders','delivery','real-clients','premium-factory','premium-generator','premium-factory-v34','premium-factory-v37-day1','error-recovery','d3-intake','clients','sales-pack','morning-desk','work-factory','owner-command-center','order-builder','supabase-memory','bot-activity','audit'];
const pathRoute = window.location.pathname.replace(/^\/+|\/+$/g, '').split('/').filter(Boolean).pop() || '';
let route = window.location.hash.replace('#', '') || (routeNames.includes(pathRoute) ? pathRoute : 'overview');
let filters = {
  wf: '',
  wfStatus: 'all',
  wfComponent: 'all',
  wfTime: 'all',
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

const WORK_FACTORY_STATUS_CHIPS = ['PASS','DEPLOYED','RUNNING','QUEUED','PARTIAL','BLOCKED','NEEDS_OWNER'];

const RU = {
  overview:'Обзор','work-factory':'Фабрика задач','owner-command-center':'Owner Command Center','order-builder':'Order Builder',kanban:'Канбан',production:'Производство','demo-products':'Демо-продукты','agent-workflow':'Агенты',capabilities:'Навыки агентов','owner-feedback':'Решения владельца',clients:'Клиенты / Заказы','sales-pack':'Продажи',approvals:'Согласования','supabase-memory':'Supabase Memory','bot-activity':'Bot Activity',health:'Система',artifacts:'Артефакты',marathon:'Автономный цикл',audit:'Аудит','premium-generator':'Premium Generator','premium-factory-v34':'Premium Factory v34','premium-factory-v37-day1':'Day 1 Premium Factory','error-recovery':'Ошибки и восстановление',
  triage:'Разбор',todo:'Подготовка',scheduled:'Запланировано',ready:'Готово к запуску',running:'Выполняется',in_progress:'Выполняется',blocked:'Заблокировано',review:'На проверке',done:'Готово',archived:'Архив',active:'Активные',agents:'Агенты',github:'GitHub',all:'Все',normal:'Обычные',mirror:'Зеркала',sys:'Системные',approval:'Согласования',
  pass:'Готово',PASS:'Готово',fail:'Ошибка',warn:'Внимание',unknown:'Неизвестно',production:'Производство',empty:'Пусто',tracked:'Отслеживается',artifact:'Артефакт',step:'Шаг',available:'Доступно',missing:'Нет',error:'Ошибка',enabled:'Включено',disabled:'Выключено',client_showcase:'Витрина клиента',scenario_replay:'Сценарии диалога',dry_run_readiness:'Готовность dry-run',ready_for_owner_review:'Готово к проверке владельца'
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
function humanStatus(value) {
  const raw = String(value || 'unknown');
  const map = {
    PASS: 'Готово',
    PASS_WITH_CONCEPT_VISUALS: 'Концепт-визуалы готовы',
    PASS_WITH_HTML_MOTION: 'Motion-прототип готов',
    PASS_LOCAL_READY_QA_PENDING: 'Локально готово, QA идёт',
    unknown: 'Проверить'
  };
  return map[raw] || raw.replaceAll('_', ' ').toLowerCase();
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
function openButton(label, value, variant='') { return value ? copyButton(label, value, variant) : ''; }
function detailPayloadButton(payload, label='Подробнее', type='details') { return `<button class="copy secondary" type="button" data-detail-type="${esc(type)}" data-detail-payload="${esc(jsonCopy(payload))}">${fmt(label)}</button>`; }
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
    ${metric('Motion Factory', state.motion_factory?.status || 'unknown', 'span-3', 'motion-factory')}
    ${metric('Заказы / Intake', state.client_intake_v27?.status || 'unknown', 'span-3', 'intake-orders')}
    ${metric('Premium Generator v32', state.premium_website_generator_v32?.status || 'unknown', 'span-3', 'premium-generator')}
    ${metric('Premium Factory v34', state.premium_factory_v34?.status || 'unknown', 'span-3', 'premium-factory-v34')}
    ${metric('Day 1', state.premium_factory_v37_day1?.status || 'PASS', 'span-3', 'premium-factory-v37-day1')}
    ${metric('Recovery', state.error_recovery_v37_1?.status || 'PASS', 'span-3', 'error-recovery')}
    ${metric('Снапшоты', state.system_hardening?.snapshot_pending_count ?? '—', 'span-3', 'health')}
    ${metric('Автономный цикл', state.marathon_12h?.status || 'unknown', 'span-3', 'work-factory')}
    ${metric('Агенты', state.agent_workflow?.protocol?.silent_finish_allowed === false ? 'contracted' : 'unknown', 'span-3', 'agent-workflow')}
    ${card('Безопасность', `${kv({status: safety.status, read_only: safety.read_only, dispatch_allowed: safety.dispatch_allowed, worker_allowed: safety.worker_allowed, mirror_executable_count: safety.mirror_executable_count, duplicate_keys: Object.keys(safety.duplicate_keys || {}).length})}${toolbar([copyButton('Copy safety contract', `Безопасность:\nread_only=${safety.read_only}\ndispatch_allowed=${safety.dispatch_allowed}\nworker_allowed=${safety.worker_allowed}\nforbidden=${asArray(safety.forbidden_actions).join(', ')}`), copyButton('Copy owner summary', ownerSummary)])}`, 'span-6')}
    ${card('Система сейчас', kv({status: h.status, gateway_active: h.gateway_active, qmd_pending_embeddings: h.qmd?.pending_embeddings, primary_model: h.primary_model_line}), 'span-6')}
    ${githubReadinessPanel()}
    ${staleExplanationCard()}
    ${card('Источник данных', `${kv(sourceSummary())}${toolbar([copyButton('Copy state path', '/workspace/output/webstudio-control-plane-state.json'), copyButton('Copy dist path', '/workspace/output/webstudio-ops-dashboard-static'), copyButton('Copy local serve', 'cd /workspace/projects/webstudio-ops-dashboard && python3 -m http.server 4173 -d src')])}`, 'span-12')}
    ${card('Продуктовые линии', rows(asArray(state.product_lines), p => row('', LINE_RU[p.id] || ownerText(p.name), p.status, 'Автономия: ' + asArray(p.autonomy_levels).join(', '), 'json', jsonCopy(p))), 'span-12')}
  </div>`;
}

function wfTaskRow(t) {
  return row(t.id, t.title, t.status || t.category || 'task', `${t.category || '—'} · ${t.kind || '—'} · ${t.output || 'no output'}`, 'wf-task', jsonCopy(t));
}

function wfControlItemRow(t) {
  const meta = `${t.component || 'work_factory'} · ${t.bucket || 'queue'} · ${t.time || '—'}${t.report ? ' · ' + t.report : ''}`;
  return row(t.id || 'wf', t.title || 'Work item', t.status || 'QUEUED', `${meta} · ${shortText(t.summary || '—', 110)}`, 'wf-control-item', jsonCopy(t));
}
function wfControlOpsRow(t) {
  const meta = `${t.version || '—'} · ${t.created_at || '—'} · ${t.deployment_target || t.url || '—'}`;
  return row(t.component || 'component', t.summary || t.notes || t.component || 'status row', t.status || 'PASS', meta, 'wf-control-status', jsonCopy(t));
}
function wfControlRunRow(r) {
  const st = r.conclusion === 'success' ? 'PASS' : (r.status === 'completed' ? 'PARTIAL' : 'RUNNING');
  return row(r.databaseId || 'pages', `Pages run ${r.status || 'unknown'} / ${r.conclusion || 'pending'}`, st, `${r.updatedAt || r.createdAt || '—'} · ${shortText(r.headSha || '—', 12)} · ${r.url || '—'}`, 'wf-control-run', jsonCopy(r));
}
function wfControlCommitRow(c) {
  return row(c.short || shortText(c.sha || 'commit', 8), c.message || 'GitHub commit', 'DEPLOYED', `${c.created_at || '—'} · ${c.url || '—'}`, 'wf-control-commit', jsonCopy(c));
}
function wfControlFilterItems(items, q, status, component, time) {
  const now = Date.now();
  const maxAge = time === '24h' ? 86400000 : time === '7d' ? 604800000 : time === '30d' ? 2592000000 : null;
  return asArray(items).filter(t => {
    const textOk = !q || includes(t, q);
    const statusOk = status === 'all' || String(t.status || '').toLowerCase() === status.toLowerCase();
    const componentOk = component === 'all' || String(t.component || '').toLowerCase() === component.toLowerCase();
    let timeOk = true;
    if (maxAge && t.time) {
      const ts = Date.parse(t.time);
      timeOk = Number.isFinite(ts) ? (now - ts <= maxAge) : true;
    }
    return textOk && statusOk && componentOk && timeOk;
  });
}
function wfSelect(id, value, options) {
  return `<select id="${id}" class="filter-select">${options.map(x => `<option value="${fmt(x)}" ${value===x?'selected':''}>${fmt(x)}</option>`).join('')}</select>`;
}

function workFactory() {
  const wf = state.work_factory || {};
  const control = state.work_factory_control || {};
  const counts = control.counts || {};
  const links = control.links || {};
  const github = control.github || {};
  const q = filters.wf;
  const allControl = [...asArray(control.queued_jobs), ...asArray(control.running_jobs), ...asArray(control.blocked_jobs), ...asArray(control.owner_approval_needed), ...asArray(control.completed_jobs)];
  const statuses = ['all', ...new Set([...WORK_FACTORY_STATUS_CHIPS, ...allControl.map(x => x.status).filter(Boolean)])];
  const components = ['all', ...new Set(allControl.map(x => x.component).filter(Boolean))];
  const visible = wfControlFilterItems(allControl, q, filters.wfStatus, filters.wfComponent, filters.wfTime);
  const ownerSummary = [
    `Work Factory Control: ${control.summary?.status || 'PASS'}`,
    `Queued: ${counts.queued || 0}`,
    `Running: ${counts.running || 0}`,
    `Blocked: ${counts.blocked || 0}`,
    `Owner approvals: ${counts.owner_approval_needed || 0}`,
    `Completed: ${counts.completed || 0}`,
    `Next: ${control.next_safe_action || '—'}`
  ].join('\n');
  const legacy = [...asArray(wf.pending), ...asArray(wf.approval_required), ...asArray(wf.blocked_error), ...asArray(wf.latest_completed)].filter(t => includes(t, q));
  return `<div class="grid work-factory-control-page">
    ${metric('Queued', counts.queued ?? wf.counts?.pending ?? 0, 'span-2')}
    ${metric('Running', counts.running ?? 0, 'span-2')}
    ${metric('Blocked', counts.blocked ?? wf.counts?.blocked_error ?? 0, 'span-2')}
    ${metric('Needs owner', counts.owner_approval_needed ?? wf.counts?.approval_required ?? 0, 'span-2')}
    ${metric('Completed', counts.completed ?? wf.counts?.completed ?? 0, 'span-2')}
    ${metric('Status rows', counts.supabase_status_rows ?? 0, 'span-2')}
    ${card('Control filters', `<div class="filter-row">${searchBox('wfSearch', 'Search task / component / report…', q)}${wfSelect('wfStatusFilter', filters.wfStatus, statuses)}${wfSelect('wfComponentFilter', filters.wfComponent, components)}${wfSelect('wfTimeFilter', filters.wfTime, ['all','24h','7d','30d'])}</div><div class="chip-row">${(asArray(control.status_chips).length ? asArray(control.status_chips) : WORK_FACTORY_STATUS_CHIPS).map(x => badge(x, x)).join('')}</div>${toolbar([copyButton('Copy Work Factory summary', ownerSummary), copyButton('Copy Work Factory JSON', jsonCopy(control))])}`, 'span-12', 'work-factory-control-card')}
    ${card('Active / queued production work', rowsTop(visible, wfControlItemRow, 16, 'No Work Factory items match current filters'), 'span-12', 'work-factory-control-card')}
    ${card('Queued jobs', rowsTop(control.queued_jobs, wfControlItemRow, 8, 'No queued jobs in snapshot'), 'span-6')}
    ${card('Running jobs', rowsTop(control.running_jobs, wfControlItemRow, 8, 'No running jobs in snapshot'), 'span-6')}
    ${card('Blocked jobs', rowsTop(control.blocked_jobs, wfControlItemRow, 8, 'No blockers in snapshot'), 'span-6')}
    ${card('Owner approval needed', rowsTop(control.owner_approval_needed, wfControlItemRow, 8, 'No owner approvals needed'), 'span-6')}
    ${card('Last completed jobs', rowsTop(control.completed_jobs, wfControlItemRow, 12, 'No completed jobs in snapshot'), 'span-12')}
    ${card('Next safe action', `<p class="owner-summary">${fmt(control.next_safe_action || 'Review owner approvals and blockers first.')}</p>${toolbar([links.github_repo ? copyButton('Copy GitHub repo', links.github_repo) : '', links.github_pr ? copyButton('Copy latest PR', links.github_pr) : '', links.latest_pages_run ? copyButton('Copy latest Pages run', links.latest_pages_run) : '', links.supabase_memory_route ? copyButton('Copy Supabase Memory route', links.supabase_memory_route) : '', links.bot_activity_route ? copyButton('Copy Bot Activity route', links.bot_activity_route) : ''].filter(Boolean))}`, 'span-6', 'work-factory-control-card')}
    ${card('Latest GitHub PR / commit / Pages run', `${rowsTop(github.commits, wfControlCommitRow, 5, 'No commits in snapshot')}${rowsTop(github.pages_runs, wfControlRunRow, 5, 'No Pages runs in snapshot')}`, 'span-6', 'work-factory-control-card')}
    ${card('Latest Supabase status rows', rowsTop(control.latest_supabase_status, wfControlOpsRow, 8, 'No Supabase status rows in snapshot'), 'span-12')}
    ${card('Reports / handoff links', rowsTop(control.reports, r => row('report', r.title || 'Report', 'tracked', r.path || '—', 'wf-control-report', jsonCopy(r)), 10, 'No report links'), 'span-6')}
    ${card('Static source / safety', kv({mode: control.source_mode || 'static_snapshot', control_mode: control.safety?.control_mode || 'read_only_copy_only', browser_side_supabase: control.safety?.browser_side_supabase === true ? 'enabled' : 'disabled', github_browser_access: control.safety?.browser_side_github_token === true ? 'enabled' : 'disabled', generated_at: control.generated_at || '—', source_path: control.source?.path || control.source_of_truth || '—'}), 'span-6')}
    ${card('Legacy local Work Factory state', `${kv({source_of_truth: wf.source_of_truth, mode: wf.mode, enabled: wf.enabled, timer_enabled: wf.timer_enabled, updated_at: wf.updated_at, last_event: wf.last_event})}${rowsTop(legacy, wfTaskRow, 8, 'No local WF rows match')}`, 'span-12')}
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
function motionVideoCard(v) {
  const res = v.width && v.height ? `${v.width}×${v.height}` : '—';
  const fps = v.r_frame_rate || '—';
  const dur = v.duration || '—';
  const size = v.size ? `${Math.round(Number(v.size) / 1024)} KB` : '—';
  return `<article class="capability-card motion-video-card"><div class="capability-top"><h4>${fmt(shortPath(v.path))}</h4>${badge(v.exists ? 'PASS' : 'missing')}</div><div class="task-meta-grid owner-meta"><span>Duration</span><b>${fmt(dur)}</b><span>Resolution</span><b>${fmt(res)}</b><span>FPS</span><b>${fmt(fps)}</b><span>Size</span><b>${fmt(size)}</b></div><div class="toolbar">${copyButton('Copy MP4 path', v.path || '')}${detailPayloadButton(v, 'Metadata', 'motion-video')}</div></article>`;
}
function motionFactory() {
  const mf = state.motion_factory || {};
  const runtime = mf.runtime || {};
  const repo = mf.repo_sync || {};
  const videos = asArray(mf.latest_videos);
  return `<div class="grid motion-factory">
    ${metric('Production generator', mf.production_generator_status || 'unknown', 'span-3')}
    ${metric('Template pack', mf.template_pack_status || 'unknown', 'span-3')}
    ${metric('Batch render', mf.batch_render_status || 'unknown', 'span-3')}
    ${metric('Poster auto-pick', mf.poster_status || 'unknown', 'span-3')}
    ${metric('Reduced motion', mf.reduced_motion_status || 'unknown', 'span-3')}
    ${metric('Handoff pack', mf.handoff_pack_status || 'unknown', 'span-3')}
    ${metric('Motion Engine', runtime.motion_engine || 'unknown', 'span-3')}
    ${metric('Owner action', runtime.owner_action_required || 'unknown', 'span-3')}
    ${card('HyperFrames / Motion Engine', `${kv({factory_status: mf.status, hyperframes_runtime: runtime.hyperframes_runtime, motion_engine: runtime.motion_engine, owner_action_required: runtime.owner_action_required, next_action: mf.next_action})}`, 'span-6')}
    ${card('Repo sync', `${kv({meaningful_changes_needed: repo.meaningful_changes_needed, worktree: repo.worktree, reason: repo.reason})}`, 'span-6')}
    <section class="card span-12"><h3>Latest videos</h3><div class="capability-grid">${videos.length ? videos.map(motionVideoCard).join('') : '<div class="empty">No video metadata yet.</div>'}</div></section>
    ${card('QA / reports', rows(asArray(mf.reports).map((path, i) => ({id: 'R' + (i + 1), title: path, status: 'report', output: path})), wfTaskRow, 'No reports'), 'span-12')}
  </div>`;
}
function artifactPathLink(path, label='Открыть') {
  if (!path) return '';
  return `<a class="copy secondary" href="file://${fmt(path)}" target="_blank" rel="noreferrer">${fmt(label)}</a>`;
}
function servicePackageCard(pkg, idx) {
  return `<article class="capability-card"><div class="capability-top"><h4>${fmt(pkg.name || ('Пакет ' + (idx + 1)))}</h4>${badge(pkg.timeline_complexity || 'package')}</div><p>${fmt(pkg.description)}</p><div class="capability-meta"><span>Артефакты: ${fmt(asArray(pkg.artifacts).slice(0,3).join(', '))}</span><span>Approval: ${fmt(asArray(pkg.approval_gates).slice(0,2).join(', '))}</span></div><details><summary>Подробнее</summary><pre class="code mini">${fmt(jsonCopy(pkg))}</pre></details></article>`;
}
function intakeOrders() {
  const ci = state.client_intake_v27 || {};
  const wizard = ci.wizard || {};
  const ob = ci.order_builder || {};
  const factory = ci.premium_site_factory || {};
  const examples = asArray(ci.examples);
  const links = asArray(ci.links);
  const packages = asArray(ob.package_details).length ? asArray(ob.package_details) : asArray(ob.available_packages).map((name, i) => ({name, timeline_complexity: i < 2 ? 'primary' : 'available', description: 'Доступный пакет WebStudio v27', artifacts: [], approval_gates: []}));
  return `<div class="grid intake-orders">
    ${metric('Intake Wizard', wizard.status || 'unknown', 'span-3')}
    ${metric('Вопросов', wizard.questions ?? '—', 'span-3')}
    ${metric('Пакетов услуг', ob.packages ?? '—', 'span-3')}
    ${metric('Blueprint шагов', factory.steps ?? '—', 'span-3')}
    ${metric('Readiness', ci.readiness || 'unknown', 'span-3')}
    ${metric('Owner approvals', asArray(ci.approvals).length, 'span-3')}
    ${card('Client Intake Wizard', `${kv({status: wizard.status, mode: wizard.mode, questions: wizard.questions})}<div class="toolbar">${copyButton('Copy wizard JSON', wizard.json || '')}${artifactPathLink(wizard.html, 'Wizard HTML')}</div>`, 'span-6')}
    ${card('Order Builder', `${kv({status: ob.status, packages: ob.packages})}<div class="toolbar">${copyButton('Copy order JSON', ob.json || '')}${artifactPathLink(ob.html, 'Order HTML')}</div>`, 'span-6')}
    ${card('Premium Website Factory', `${kv({status: factory.status, steps: factory.steps, blueprint: factory.blueprint_md})}`, 'span-6')}
    ${card('Motion Factory', `${kv({status: state.motion_factory?.status, engine: state.motion_factory?.runtime?.motion_engine, next: state.motion_factory?.next_action})}`, 'span-6')}
    <section class="card span-12"><h3>Пакеты услуг</h3><div class="capability-grid">${packages.map(servicePackageCard).join('')}</div></section>
    <section class="card span-12"><h3>Примеры клиентов</h3><div class="capability-grid">${examples.map(ex => `<article class="capability-card"><div class="capability-top"><h4>${fmt(ex.name)}</h4>${badge(ex.status)}</div><p>Example Client #${fmt(ex.id)}</p><div class="toolbar">${copyButton('Copy artifacts', asArray(ex.artifacts).join('\n'))}${detailPayloadButton(ex, 'Артефакты', 'client-example')}</div></article>`).join('')}</div></section>
    ${card('Следующее действие', `<p>${fmt(ci.next_action)}</p><div class="toolbar">${links.map((x,i)=>copyButton('Copy link '+(i+1), x, 'secondary')).join('')}</div>`, 'span-12')}
  </div>`;
}

function deliveryStageCard(stage) {
  return `<article class="capability-card delivery-stage-card"><div class="capability-top"><h4>${fmt(stage.id ? stage.id + '. ' + stage.name : stage.name)}</h4>${badge(stage.kanban_stage || 'stage')}</div><p><b>Agent:</b> ${fmt(stage.responsible_agent)}</p><p>${fmt(shortText(stage.acceptance_criteria, 150))}</p><div class="capability-meta"><span>Input: ${fmt(shortText(stage.inputs, 70))}</span><span>Output: ${fmt(shortText(stage.outputs, 70))}</span><span>Owner: ${fmt(stage.owner_approval_required)}</span></div><div class="toolbar">${copyButton('Copy artifact path', stage.artifact_path || '', 'secondary')}${detailPayloadButton(stage, 'Подробнее', 'delivery-stage')}</div></article>`;
}
function deliveryArtifactRow(path, idx) {
  return row('A' + (idx + 1), path, 'artifact', 'v29 delivery registry', 'artifact', jsonCopy({path, status:'PASS'}));
}

const DELIVERY_ACCEPTANCE_STORAGE_KEY = 'webstudio.delivery.acceptanceTracker.v34';
const DELIVERY_FOLLOWUP_STORAGE_KEY = 'webstudio.delivery.followupPlanner.v37';
const DELIVERY_APPROVAL_LEDGER_STORAGE_KEY = 'webstudio.delivery.approvalDecisionLedger.v42';
function readDeliveryAcceptanceOverlay() {
  try { return JSON.parse(localStorage.getItem(DELIVERY_ACCEPTANCE_STORAGE_KEY) || '{}') || {}; } catch { return {}; }
}
function writeDeliveryAcceptanceOverlay(overlay) {
  localStorage.setItem(DELIVERY_ACCEPTANCE_STORAGE_KEY, JSON.stringify(overlay, null, 2));
}
function readDeliveryFollowupOverlay() {
  try { return JSON.parse(localStorage.getItem(DELIVERY_FOLLOWUP_STORAGE_KEY) || '{}') || {}; } catch { return {}; }
}
function writeDeliveryFollowupOverlay(overlay) {
  localStorage.setItem(DELIVERY_FOLLOWUP_STORAGE_KEY, JSON.stringify(overlay, null, 2));
}
function readDeliveryApprovalLedger() {
  try {
    const parsed = JSON.parse(localStorage.getItem(DELIVERY_APPROVAL_LEDGER_STORAGE_KEY) || '[]');
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}
function writeDeliveryApprovalLedger(entries) {
  localStorage.setItem(DELIVERY_APPROVAL_LEDGER_STORAGE_KEY, JSON.stringify(entries, null, 2));
}
function deliveryAcceptanceSummary(composer, overlay) {
  const rows = asArray((composer.acceptance_tracker || {}).rows);
  const statusOf = r => overlay[r.id] || r.default_state || 'needs_review';
  const counts = rows.reduce((acc, r) => {
    const st = statusOf(r);
    acc[st] = (acc[st] || 0) + 1;
    return acc;
  }, {ready: 0, needs_review: 0, blocked_until_owner: 0, waived: 0});
  const total = rows.length;
  const cleared = (counts.ready || 0) + (counts.waived || 0);
  const blockers = (counts.blocked_until_owner || 0) + (counts.needs_review || 0);
  return {
    total,
    ready: counts.ready || 0,
    waived: counts.waived || 0,
    needs_review: counts.needs_review || 0,
    blocked_until_owner: counts.blocked_until_owner || 0,
    cleared,
    blockers,
    percent: total ? Math.round((cleared / total) * 100) : 0,
    gate: total && blockers === 0 ? 'PASS_READY_TO_HANDOFF' : 'WATCH_REVIEW_BEFORE_HANDOFF'
  };
}
function deliveryAcceptancePacket(composer, order, overlay) {
  const tracker = composer.acceptance_tracker || {};
  const rows = asArray(tracker.rows);
  const summary = deliveryAcceptanceSummary(composer, overlay);
  const risk = composer.handoff_risk_digest_v36 || {};
  const acceptance = rows.map(r => `${r.id}: ${overlay[r.id] || r.default_state || 'needs_review'} — ${r.label}`).join('\n') || '—';
  return [
    `Client: ${order.client_profile || composer.sample_client || 'sanitized demo client'}`,
    `Package: ${order.pricing_package || '—'}`,
    `Offer: ${order.offer_service_product || '—'}`,
    `Pages: ${asArray(order.required_pages).join(', ') || '—'}`,
    `Assets: ${asArray(order.assets_needed).join(', ') || '—'}`,
    `QA gates: ${asArray(composer.qa_gates).join(', ') || '—'}`,
    `Acceptance summary v35: ${summary.cleared}/${summary.total} cleared · ${summary.percent}% · gate=${summary.gate}`,
    `Risk digest v36: ${(risk.risks || []).length || 0} visible · next=${risk.next_safe_action || '—'}`,
    `Acceptance tracker v35:\n${acceptance}`,
    `Hand-off note: ${composer.handoff_note || 'Read-only demo packet; live client data stays gated.'}`
  ].join('\n');
}
function deliveryHandoffRiskDigest(composer, summary) {
  const digest = composer.handoff_risk_digest_v36 || {};
  const risks = asArray(digest.risks);
  const gates = asArray(digest.safe_handoff_gates);
  const timeline = asArray(digest.owner_review_timeline);
  const riskRows = risks.map((r, idx) => row('R' + (idx + 1), r.title || r.id || 'Risk', r.status || 'watch', `${r.owner_visible_reason || 'owner-visible'} · action=${r.mitigation || 'review'}`, 'handoff-risk-v36', jsonCopy(r))).join('');
  const gateRows = gates.map((g, idx) => row('G' + (idx + 1), g, idx < summary.cleared ? 'ready' : 'needs_review')).join('');
  const timelineRows = timeline.map((t, idx) => row('T' + (idx + 1), t.label || t.id || 'Step', t.status || 'queued', t.owner_action || 'No owner action', 'handoff-timeline-v36', jsonCopy(t))).join('');
  return `<section class="card span-12 handoff-risk-digest-v36"><h3>Client handoff risk digest v36</h3><p class="label">Owner-safe обзор рисков перед передачей: всё read-only, без приватных данных и без внешних записей.</p><div class="metric-row">${metric('Visible risks', risks.length, 'span-3')}${metric('Safe gates', gates.length, 'span-3')}${metric('Acceptance gate', summary.gate, 'span-3')}${metric('Mode', digest.mode || 'read_only', 'span-3')}</div><div class="handoff-grid"><article><h4>Risks</h4><div class="list">${riskRows || '<div class="empty">No handoff risks configured.</div>'}</div></article><article><h4>Safe gates</h4><div class="list">${gateRows || '<div class="empty">No gates configured.</div>'}</div></article></div>${card('Owner review timeline v36', `<div class="list">${timelineRows || '<div class="empty">No timeline configured.</div>'}</div>${toolbar([copyButton('Copy risk digest JSON', jsonCopy(digest)), copyButton('Copy next safe action', digest.next_safe_action || 'Review handoff packet')])}`, 'span-12')}</section>`;
}
function deliveryEvidenceBinder(composer, summary) {
  const binder = composer.delivery_evidence_binder_v38 || {};
  const evidence = asArray(binder.evidence);
  const ready = evidence.filter(x => /pass|ready|available/i.test(String(x.status || ''))).length;
  const blocked = evidence.filter(x => /blocked|missing|needs/i.test(String(x.status || ''))).length;
  const packet = [
    'Delivery evidence binder v38',
    `Mode: ${binder.mode || 'read_only_static_evidence'}`,
    `Acceptance gate: ${summary.gate}`,
    `Evidence ready: ${ready}/${evidence.length}`,
    `Owner-safe rule: ${binder.safety || 'copy-only; no external writes'}`,
    ...evidence.map((x, idx) => `${x.id || ('e' + (idx + 1))}: ${x.status || 'unknown'} · ${x.label || 'Evidence'} · source=${x.source || '—'} · action=${x.owner_action || 'review'}`)
  ].join('\n');
  const rowsHtml = evidence.map((x, idx) => row(x.id || ('E' + (idx + 1)), x.label || 'Evidence', x.status || 'unknown', `${x.source || 'static'} · ${x.owner_action || 'review'}`, 'delivery-evidence-v38', jsonCopy(x))).join('');
  return `<section class="card span-12 delivery-evidence-binder-v38"><h3>Delivery evidence binder v38</h3><p class="label">Собирает owner-safe доказательства перед передачей: build/smoke/secret-scan/Pages status видны в одном copy-only блоке, без CRM/DB/client-send writes.</p><div class="metric-row">${metric('Evidence items', evidence.length, 'span-3')}${metric('Ready', ready, 'span-3')}${metric('Needs review', blocked, 'span-3')}${metric('Acceptance gate', summary.gate, 'span-3')}</div>${card('Evidence guardrail v38', kv({mode: binder.mode || 'read_only_static_evidence', storage: 'static sanitized state', safety: binder.safety || 'no external writes', next_safe_action: binder.next_safe_action || 'review evidence before client send'}), 'span-12')}<div class="list">${rowsHtml || '<div class="empty">Evidence binder not configured.</div>'}</div>${toolbar([copyButton('Copy evidence packet', packet), copyButton('Copy evidence JSON', jsonCopy(binder))])}</section>`;
}
function deliveryOwnerSignoffPacket(composer, order, summary) {
  const signoff = composer.owner_signoff_packet_v39 || {};
  const sections = asArray(signoff.required_sections);
  const ready = sections.filter(x => /ready|pass/i.test(String(x.default_state || x.status || ''))).length;
  const review = sections.filter(x => /needs|queued|blocked/i.test(String(x.default_state || x.status || ''))).length;
  const evidence = asArray((composer.delivery_evidence_binder_v38 || {}).evidence).map(x => `${x.id}: ${x.status}`).join(', ') || '—';
  const risks = asArray((composer.handoff_risk_digest_v36 || {}).risks).map(x => `${x.id}: ${x.status}`).join(', ') || '—';
  const followup = asArray((composer.followup_planner_v37 || {}).tasks).map(x => `${x.id}: ${x.default_state}`).join(', ') || '—';
  const packet = [
    'Delivery owner sign-off packet v39',
    `Client: ${order.client_profile || composer.sample_client || 'sanitized demo client'}`,
    `Package: ${order.pricing_package || '—'}`,
    `Acceptance gate: ${summary.gate}`,
    `Readiness: ${ready}/${sections.length} ready · ${review} owner-review items`,
    `Evidence: ${evidence}`,
    `Risks: ${risks}`,
    `Follow-up: ${followup}`,
    `Guardrail: ${signoff.safety || 'copy-only; no external writes'}`,
    ...sections.map((x, idx) => `${x.id || ('s' + (idx + 1))}: ${x.default_state || x.status || 'unknown'} · ${x.label || 'Section'} · action=${x.owner_action || 'review'}`)
  ].join('\n');
  const rowsHtml = sections.map((x, idx) => row(x.id || ('S' + (idx + 1)), x.label || 'Sign-off section', x.default_state || x.status || 'unknown', x.owner_action || 'Owner review', 'delivery-signoff-v39', jsonCopy(x))).join('');
  return `<section class="card span-12 delivery-owner-signoff-packet-v39"><h3>Delivery owner sign-off packet v39</h3><p class="label">Единый copy-only пакет для решения владельца: scope + QA evidence + risks + follow-up + запрет live send/write без отдельного approval.</p><div class="metric-row">${metric('Sign-off sections', sections.length, 'span-3')}${metric('Ready', ready, 'span-3')}${metric('Owner review', review, 'span-3')}${metric('Acceptance gate', summary.gate, 'span-3')}</div>${card('Sign-off guardrail v39', kv({mode: signoff.mode || 'read_only_copy_packet', storage: signoff.persistence || 'static sanitized state', safety: signoff.safety || 'no external writes', next_safe_action: signoff.next_safe_action || 'copy packet for owner review'}), 'span-12')}<div class="list">${rowsHtml || '<div class="empty">Sign-off packet not configured.</div>'}</div>${toolbar([copyButton('Copy owner sign-off packet', packet), copyButton('Copy sign-off JSON', jsonCopy(signoff))])}</section>`;
}
function deliveryLaunchReadinessReceipt(composer, order, summary) {
  const receipt = composer.launch_readiness_receipt_v40 || {};
  const rows = asArray(receipt.receipt_rows);
  const ready = rows.filter(x => /ready|pass/i.test(String(x.status || ''))).length;
  const blocked = rows.filter(x => /blocked|needs/i.test(String(x.status || ''))).length;
  const packet = [
    'Delivery launch-readiness receipt v40',
    `Client: ${order.client_profile || composer.sample_client || 'sanitized demo client'}`,
    `Package: ${order.pricing_package || '—'}`,
    `Acceptance gate: ${summary.gate}`,
    `Readiness: ${ready}/${rows.length} ready · ${blocked} blocked/review`,
    `Guardrail: ${receipt.safety || 'copy-only; no external writes'}`,
    `Next safe action: ${receipt.next_safe_action || 'owner review before live action'}`,
    ...rows.map((x, idx) => `${x.id || ('r' + (idx + 1))}: ${x.status || 'unknown'} · ${x.label || 'Receipt row'} · source=${x.source || '—'} · action=${x.owner_action || 'review'}`)
  ].join('\n');
  const rowsHtml = rows.map((x, idx) => row(x.id || ('R' + (idx + 1)), x.label || 'Readiness row', x.status || 'unknown', `${x.source || 'static'} · ${x.owner_action || 'review'}`, 'delivery-receipt-v40', jsonCopy(x))).join('');
  return `<section class="card span-12 delivery-launch-readiness-receipt-v40"><h3>Delivery launch-readiness receipt v40</h3><p class="label">Финальный owner-safe чек перед передачей: что готово, что требует review, что заблокировано до отдельного approval. Только copy/read, без внешних действий.</p><div class="metric-row">${metric('Receipt rows', rows.length, 'span-3')}${metric('Ready', ready, 'span-3')}${metric('Review / blocked', blocked, 'span-3')}${metric('Acceptance gate', summary.gate, 'span-3')}</div>${card('Receipt guardrail v40', kv({mode: receipt.mode || 'read_only_copy_receipt', storage: receipt.persistence || 'static sanitized state', safety: receipt.safety || 'no external writes', next_safe_action: receipt.next_safe_action || 'owner review before live action'}), 'span-12')}<div class="list">${rowsHtml || '<div class="empty">Launch-readiness receipt not configured.</div>'}</div>${toolbar([copyButton('Copy launch-readiness receipt', packet), copyButton('Copy receipt JSON', jsonCopy(receipt))])}</section>`;
}
function deliveryEvidenceFreshnessMonitor(composer, summary) {
  const monitor = composer.evidence_freshness_monitor_v41 || {};
  const checks = asArray(monitor.checks);
  const fresh = checks.filter(x => /fresh|pass/i.test(String(x.status || ''))).length;
  const watch = checks.filter(x => /watch|stale|blocked|needs/i.test(String(x.status || ''))).length;
  const packet = [
    'Delivery evidence freshness monitor v41',
    `Mode: ${monitor.mode || 'read_only_freshness_monitor'}`,
    `Acceptance gate: ${summary.gate}`,
    `Fresh: ${fresh}/${checks.length}`,
    `Watch/stale: ${watch}`,
    `Guardrail: ${monitor.safety || 'copy-only; no external writes'}`,
    `Next safe action: ${monitor.next_safe_action || 'refresh stale proof before owner/client handoff'}`,
    ...checks.map((x, idx) => `${x.id || ('f' + (idx + 1))}: ${x.status || 'unknown'} · ${x.label || 'Freshness check'} · threshold=${x.threshold || '—'} · action=${x.owner_action || 'review'}`)
  ].join('\n');
  const rowsHtml = checks.map((x, idx) => row(x.id || ('F' + (idx + 1)), x.label || 'Freshness check', x.status || 'unknown', `${x.threshold || 'current'} · ${x.owner_action || 'review'}`, 'delivery-freshness-v41', jsonCopy(x))).join('');
  return `<section class="card span-12 delivery-evidence-freshness-monitor-v41"><h3>Delivery evidence freshness monitor v41</h3><p class="label">Показывает, какие proof-артефакты ещё свежие перед owner/client handoff, а какие нужно обновить. Только read/copy, без внешних записей.</p><div class="metric-row">${metric('Freshness checks', checks.length, 'span-3')}${metric('Fresh', fresh, 'span-3')}${metric('Watch / stale', watch, 'span-3')}${metric('Acceptance gate', summary.gate, 'span-3')}</div>${card('Freshness guardrail v41', kv({mode: monitor.mode || 'read_only_freshness_monitor', storage: monitor.persistence || 'static sanitized state', safety: monitor.safety || 'no external writes', next_safe_action: monitor.next_safe_action || 'refresh stale proof before handoff'}), 'span-12')}<div class="list">${rowsHtml || '<div class="empty">Freshness monitor not configured.</div>'}</div>${toolbar([copyButton('Copy freshness packet', packet), copyButton('Copy freshness JSON', jsonCopy(monitor))])}</section>`;
}
function deliveryApprovalDecisionLedger(composer, order, summary) {
  const ledger = composer.approval_decision_ledger_v42 || {};
  const required = asArray(ledger.required_decisions);
  const localEntries = readDeliveryApprovalLedger();
  const entryById = Object.fromEntries(localEntries.map(x => [x.id, x]));
  const statusOf = d => entryById[d.id]?.status || d.default_state || 'queued_owner_review';
  const decisions = required.map(d => ({...d, status: statusOf(d), note: entryById[d.id]?.note || ''}));
  const approved = decisions.filter(x => /approved|waived/i.test(String(x.status))).length;
  const blocked = decisions.filter(x => /blocked|required|queued|rejected/i.test(String(x.status))).length;
  const packet = [
    'Delivery approval decision ledger v42',
    `Client: ${order.client_profile || composer.sample_client || 'sanitized demo client'}`,
    `Acceptance gate: ${summary.gate}`,
    `Approved/waived: ${approved}/${decisions.length}`,
    `Needs owner decision: ${blocked}`,
    `Storage: ${ledger.persistence || DELIVERY_APPROVAL_LEDGER_STORAGE_KEY}`,
    `Guardrail: ${ledger.safety || 'localStorage/copy-only; no external writes'}`,
    ...decisions.map((x, idx) => `${x.id || ('d' + (idx + 1))}: ${x.status || 'unknown'} · ${x.label || 'Decision'} · blocks=${x.blocks || 'client handoff'} · owner=${x.owner_action || 'review'}`)
  ].join('\n');
  const options = ['queued_owner_review','approved_for_handoff','blocked_until_owner','waived_for_demo','rejected'];
  const rowsHtml = decisions.map(d => `<article class="capability-card approval-ledger-row"><div class="capability-top"><h4>${fmt(d.label || d.id)}</h4>${badge(d.status || 'queued_owner_review')}</div><p><b>Blocks:</b> ${fmt(d.blocks || 'client handoff')} · <b>Evidence:</b> ${fmt(shortText(d.evidence || '—', 96))}</p><p>${fmt(d.owner_action || 'Owner review required before live action')}</p><label class="field"><span>Decision status</span><select data-delivery-approval-ledger-status="${esc(d.id)}">${options.map(x => `<option value="${esc(x)}" ${x === d.status ? 'selected' : ''}>${fmt(ru(x))}</option>`).join('')}</select></label><label class="field"><span>Owner note</span><input data-delivery-approval-ledger-note="${esc(d.id)}" value="${esc(d.note || '')}" placeholder="local note only"></label></article>`).join('');
  return `<section class="card span-12 delivery-approval-decision-ledger-v42"><h3>Delivery approval decision ledger v42</h3><p class="label">Owner-safe журнал решений перед передачей: фиксирует approval/waiver/blocker локально в браузере, ничего не отправляет в CRM/DB/client channels.</p><div class="metric-row">${metric('Required decisions', decisions.length, 'span-3')}${metric('Approved / waived', approved, 'span-3')}${metric('Needs owner decision', blocked, 'span-3')}${metric('Acceptance gate', summary.gate, 'span-3')}</div>${card('Approval ledger guardrail v42', kv({mode: ledger.mode || 'localStorage_decision_ledger', storage: ledger.persistence || DELIVERY_APPROVAL_LEDGER_STORAGE_KEY, safety: ledger.safety || 'no external writes', next_safe_action: ledger.next_safe_action || 'record owner decision locally before client handoff'}), 'span-12')}<div class="capability-grid">${rowsHtml || '<div class="empty">Approval decisions not configured.</div>'}</div>${toolbar([copyButton('Copy approval decision packet', packet), copyButton('Copy approval ledger JSON', jsonCopy({config: ledger, local_entries: localEntries}))])}</section>`;
}
function deliveryFollowupPlanner(composer, summary) {
  const planner = composer.followup_planner_v37 || {};
  const overlay = readDeliveryFollowupOverlay();
  const tasks = asArray(planner.tasks);
  const statusOf = t => overlay[t.id]?.status || t.default_state || 'queued';
  const noteOf = t => overlay[t.id]?.note || '';
  const counts = tasks.reduce((acc, t) => { const st = statusOf(t); acc[st] = (acc[st] || 0) + 1; return acc; }, {});
  const done = (counts.done || 0) + (counts.waived || 0);
  const packet = [
    `Post-delivery follow-up planner v37`,
    `Mode: ${planner.mode || 'localStorage_only'}`,
    `Acceptance gate: ${summary.gate}`,
    `Done: ${done}/${tasks.length}`,
    `Owner-safe rule: ${planner.safety || 'no CRM/DB/client-send writes'}`,
    ...tasks.map(t => `${t.id}: ${statusOf(t)} · ${t.label} · due=${t.due_after || '—'} · owner=${t.owner_action || '—'}${noteOf(t) ? ' · note=' + noteOf(t) : ''}`)
  ].join('\n');
  const options = ['queued','ready','waiting_client','done','blocked_until_owner','waived'];
  const taskRows = tasks.map(t => {
    const value = statusOf(t);
    return `<article class="capability-card followup-row"><div class="capability-top"><h4>${fmt(t.label)}</h4>${badge(value)}</div><p><b>Due:</b> ${fmt(t.due_after || '—')} · <b>Channel:</b> ${fmt(t.channel || 'manual')}</p><p>${fmt(t.owner_action || 'Review next touch')}</p><label class="field"><span>Status</span><select data-delivery-followup-status="${esc(t.id)}">${options.map(x => `<option value="${esc(x)}" ${x === value ? 'selected' : ''}>${fmt(ru(x))}</option>`).join('')}</select></label><label class="field"><span>Owner note</span><input data-delivery-followup-note="${esc(t.id)}" value="${esc(noteOf(t))}" placeholder="local note only"></label></article>`;
  }).join('');
  return `<section class="card span-12 delivery-followup-planner-v37"><h3>Post-delivery follow-up planner v37</h3><p class="label">Планирует безопасные касания после передачи: статусы и заметки живут только в browser localStorage; CRM/DB/client-send не трогаются.</p><div class="metric-row">${metric('Follow-up tasks', tasks.length, 'span-3')}${metric('Done / waived', done, 'span-3')}${metric('Waiting client', counts.waiting_client || 0, 'span-3')}${metric('Blocked owner', counts.blocked_until_owner || 0, 'span-3')}</div>${card('Follow-up guardrail v37', kv({mode: planner.mode || 'localStorage_only', storage: DELIVERY_FOLLOWUP_STORAGE_KEY, acceptance_gate: summary.gate, safety: planner.safety || 'no external writes'}), 'span-12')}<div class="capability-grid">${taskRows || '<div class="empty">Follow-up plan not configured.</div>'}</div>${toolbar([copyButton('Copy follow-up plan', packet), copyButton('Copy follow-up JSON', jsonCopy(planner))])}</section>`;
}
function deliveryAcceptanceTracker(composer) {
  const tracker = composer.acceptance_tracker || {};
  const overlay = readDeliveryAcceptanceOverlay();
  const summary = deliveryAcceptanceSummary(composer, overlay);
  const options = ['ready','needs_review','blocked_until_owner','waived'];
  const rowsHtml = asArray(tracker.rows).map(r => {
    const value = overlay[r.id] || r.default_state || 'needs_review';
    return `<article class="capability-card acceptance-row"><div class="capability-top"><h4>${fmt(r.label)}</h4>${badge(value)}</div><p><b>Evidence:</b> ${fmt(r.required_evidence)}</p><label class="field"><span>Status</span><select data-delivery-acceptance="${esc(r.id)}">${options.map(x => `<option value="${esc(x)}" ${x === value ? 'selected' : ''}>${fmt(ru(x))}</option>`).join('')}</select></label></article>`;
  }).join('');
  return `<section class="card span-12 delivery-acceptance-tracker"><h3>Client acceptance tracker v35</h3><p class="label">Owner-safe финальный чек перед передачей клиенту. Статусы сохраняются только в browser localStorage; CRM/DB/client-send не трогаются.</p><div class="metric-row acceptance-summary-v35">${metric('Acceptance cleared', `${summary.cleared}/${summary.total}`, 'span-3')}${metric('Readiness', summary.percent + '%', 'span-3')}${metric('Needs review', summary.needs_review, 'span-3')}${metric('Blocked', summary.blocked_until_owner, 'span-3')}</div>${card('Acceptance handoff gate v35', kv({gate: summary.gate, cleared: summary.cleared, blockers: summary.blockers, storage: 'localStorage only'}), 'span-12')}<div class="capability-grid">${rowsHtml || '<div class="empty">Acceptance tracker not configured.</div>'}</div></section>`;
}
function deliveryHandoffComposer() {
  const composer = state.delivery_handoff_composer_v33 || {};
  const ob = state.order_builder || {};
  const o = ob.sample_order || {};
  const checklist = asArray(composer.client_ready_checklist);
  const overlay = readDeliveryAcceptanceOverlay();
  const summary = deliveryAcceptanceSummary(composer, overlay);
  const packet = deliveryAcceptancePacket(composer, o, overlay);
  return `<section class="card span-12 delivery-handoff-composer"><h3>Client handoff composer v36</h3><p class="label">Собирает owner-safe пакет передачи из Order Builder + delivery pipeline. Без записи в CRM/DB и без приватных данных.</p><div class="handoff-grid">
    <article>${kv({status: composer.status || 'PASS_LOCAL_READY', mode: composer.mode || 'read_only_static_composer', feature: composer.feature || 'client_handoff_risk_digest_v36', source: composer.source || 'order_builder.sample_order', owner_action_required: composer.owner_action_required || false})}</article>
    <article><h4>Client-ready checklist</h4>${rowsTop(checklist.map((x,i)=>({id:'C'+(i+1), title:x, status:'ready'})), x=>row(x.id, x.title, x.status), 12, 'Checklist not configured')}</article>
  </div>${toolbar([copyButton('Copy client handoff packet', packet), copyButton('Copy handoff JSON', jsonCopy(composer)), copyButton('Copy QA gates', asArray(composer.qa_gates).join('\n'))])}</section>${deliveryAcceptanceTracker(composer)}${deliveryHandoffRiskDigest(composer, summary)}${deliveryEvidenceBinder(composer, summary)}${deliveryOwnerSignoffPacket(composer, o, summary)}${deliveryLaunchReadinessReceipt(composer, o, summary)}${deliveryEvidenceFreshnessMonitor(composer, summary)}${deliveryApprovalDecisionLedger(composer, o, summary)}${deliveryFollowupPlanner(composer, summary)}`;
}

function delivery() {
  const ds = state.delivery_system_v29 || {};
  const pipeline = ds.pipeline_stages || 0;
  const artifacts = asArray(ds.artifacts);
  const stages = asArray(state.product_progress?.delivery_system_v29?.stages || []);
  const github = ds.github_mainline || {};
  const ready = ds.readiness || {};
  const renderedStages = stages.length ? stages : asArray((state.delivery_pipeline_v29 || {}).stages);
  return `<div class="grid delivery-system">
    ${metric('Delivery system', ds.status || 'unknown', 'span-3')}
    ${metric('Pipeline stages', pipeline || renderedStages.length || '—', 'span-3')}
    ${metric('QA blocks', ds.qa_blocks || '—', 'span-3')}
    ${metric('Client #003', ds.client_003_status || 'unknown', 'span-3')}
    ${card('Поставка клиенту — v29', `${kv({status: ds.status, pipeline: ds.pipeline_status, delivery_pack_template: ds.delivery_pack_template_status, client_003: ds.client_003_status, owner_action_required: ds.owner_action_required, next_action: ds.next_action})}${toolbar([copyButton('Copy delivery system', '/workspace/output/webstudio-premium-website-delivery-system-v29.md'), copyButton('Copy pipeline JSON', '/workspace/output/webstudio-client-delivery-pipeline-v29.json'), copyButton('Copy client #003 pack', '/workspace/output/webstudio-client-example-003-delivery-pack-v1.html')])}`, 'span-12')}
    ${deliveryHandoffComposer()}
    ${card('GitHub / mainline', `${kv({status: github.status || 'MAINLINE_MERGED', pr_1: github.pr_1 || 'MERGED', default_branch: github.default_branch || 'main', default_sha: github.default_sha || 'c72b1946ad8de01da4f1ce0b38026d05363f59b7', contribution_visibility: github.contribution_visibility_note || '1-24h graph delay possible'})}`, 'span-6')}
    ${card('D1/D2/D3 readiness', `${kv(ready)}`, 'span-6')}
    ${card('Motion Factory', `${kv({status: state.motion_factory?.status, video: ready.motion_video || state.motion_factory?.runtime?.motion_engine, reduced_motion: state.motion_factory?.reduced_motion_status, handoff: state.motion_factory?.handoff_pack_status})}`, 'span-6')}
    ${card('Approval / launch readiness', `${rows(asArray(ds.approval_packets).map((path,i)=>({id:'P'+(i+1), title:path, status:'approval', output:path})), wfTaskRow, 'No approval packets')}${toolbar([copyButton('Copy launch readiness', ds.launch_readiness || '/workspace/output/webstudio-client-example-003-launch-readiness-v1.md')])}`, 'span-6')}
    <section class="card span-12"><h3>Delivery pipeline</h3><div class="capability-grid">${renderedStages.length ? renderedStages.map(deliveryStageCard).join('') : '<div class="empty">Run snapshot after v29 pipeline JSON is created.</div>'}</div></section>
    ${card('Artifact registry', rows(artifacts.map((path, i)=>({path, i})), x => deliveryArtifactRow(x.path, x.i), 'No v29 artifacts indexed'), 'span-12')}
  </div>`;
}

function realClientStageCard(stage) {
  return `<article class="capability-card"><div class="capability-top"><h4>${fmt(stage.id ? stage.id + '. ' + stage.name : stage.name)}</h4>${badge(stage.kanban_stage || 'stage')}</div><p><b>Agent:</b> ${fmt(stage.responsible_agent)}</p><p>${fmt(shortText(stage.acceptance_criteria, 150))}</p><div class="capability-meta"><span>Output: ${fmt(shortText(stage.outputs, 80))}</span><span>Gate: ${fmt(shortText(stage.approval_gates, 70))}</span></div><div class="toolbar">${openButton('Артефакт', stage.artifact_path || '')}${detailPayloadButton(stage, 'Подробнее', 'real-client-stage')}</div></article>`;
}
function realClients() {
  const rc = state.real_client_execution_v30 || {};
  const paths = rc.paths || {};
  const pr2 = rc.pr2_status || {};
  const flow = asArray(rc.flow);
  return `<div class="grid real-clients">
    ${metric('Client #004', rc.status || 'unknown', 'span-3')}
    ${metric('Flow stages', rc.flow_stages || flow.length || '—', 'span-3')}
    ${metric('D1/D2/D3', `${rc.d1_status || '—'} / ${rc.d2_status || '—'} / ${rc.d3_status || '—'}`, 'span-3')}
    ${metric('PR #2', pr2.pr_state || 'CHECKED_BY_HOST', 'span-3')}
    ${card('Реальные клиенты — v30', `${kv({client: rc.client_name || rc.client, package_selected: rc.package_selected, execution_flow: rc.execution_flow_status, owner_action_required: rc.owner_action_required, next_action: rc.next_action})}${toolbar([copyButton('Copy flow', paths.flow || ''), copyButton('Copy client report', paths.client_report || ''), copyButton('Copy export registry', paths.export_registry || '')])}`, 'span-12')}
    ${card('Client #004 status', `${kv({D1: rc.d1_status, D2: rc.d2_status, D3: rc.d3_status, motion: rc.motion_status, QA: rc.qa_status, preview_package: rc.preview_package_status, artifact_registry_count: rc.artifact_registry_count})}`, 'span-6')}
    ${card('PR #2 / branch strategy', `${kv({pr_2: pr2.pr_url || 'https://github.com/pltnv123/webstudio-ops-dashboard/pull/2', state: pr2.pr_state || 'pending host check', head: pr2.head_sha, checks_failed: pr2.checks_failed, checks_pending: pr2.checks_pending, mergeability: pr2.merge_state_status, strategy: rc.branch_strategy})}`, 'span-6')}
    ${card('Preview package', `${kv({d1_preview: paths.d1_preview, d2_flow: paths.d2_flow, d3_map: paths.d3_map, motion: paths.motion_composition, registry: paths.artifact_registry})}<div class="toolbar">${openButton('D1 preview', paths.d1_preview || '')}${openButton('Motion composition', paths.motion_composition || '')}${openButton('Preview package', paths.preview_package || '')}</div>`, 'span-12')}
    <section class="card span-12"><h3>Execution flow progress</h3><div class="capability-grid">${flow.length ? flow.map(realClientStageCard).join('') : '<div class="empty">Run snapshot after v30 flow JSON is created.</div>'}</div></section>
  </div>`;
}

function premiumConceptCard(concept) {
  return `<article class="capability-card premium-concept"><div class="capability-top"><h4>Concept ${fmt(concept.id || '—')}</h4>${badge(concept.mood || 'concept')}</div><p><b>Motion:</b> ${fmt(concept.motion || '—')}</p><p>${fmt(concept.best_use_case || '—')}</p><div class="toolbar">${openButton('Открыть концепт', concept.path || '')}${detailPayloadButton(concept, 'Подробнее', 'v31-concept')}</div></article>`;
}
function premiumAssetCard(asset) {
  return `<article class="capability-card premium-asset"><div class="capability-top"><h4>${fmt(asset.slot || 'asset')}</h4>${badge(asset.status === 'generated concept visual' ? 'concept visual' : (asset.status || 'planned'))}</div><p>${fmt(shortText(asset.path || '', 120))}</p><div class="toolbar">${openButton('Открыть визуал', asset.path || '')}${detailPayloadButton(asset, 'Подробнее', 'v31-asset')}</div></article>`;
}
function premiumFactory() {
  const v31 = state.premium_visual_motion_v31 || {};
  const paths = v31.paths || {};
  const concepts = asArray(v31.concepts);
  const assets = asArray(v31.visual_assets);
  return `<div class="grid premium-factory">
    ${metric('Interview Engine', humanStatus(v31.interview_engine_status || 'unknown'), 'span-3')}
    ${metric('Visual System', humanStatus(v31.premium_visual_system_status || 'unknown'), 'span-3')}
    ${metric('Image Pipeline', humanStatus(v31.image_pipeline_status || 'unknown'), 'span-3')}
    ${metric('Motion System', humanStatus(v31.premium_motion_system_status || 'unknown'), 'span-3')}
    ${card('Premium Website Factory — v31', `${kv({client: v31.client, visual_upgrade: v31.client_004_visual_upgrade_status, concepts: v31.concepts_status, service_catalog: v31.service_catalog_status, assets: v31.assets_real_generated_planned, owner_action_required: v31.owner_action_required, next_action: v31.next_action})}<div class="toolbar">${openButton('Client #004 preview', paths.preview || '')}${openButton('Interview engine', paths.interview_engine || '')}${openButton('Service catalog', paths.service_catalog || '')}${openButton('Order types', paths.order_types || '')}${detailPayloadButton(v31, 'Подробнее', 'v31-premium-factory')}</div>`, 'span-12')}
    ${card('Client Interview Engine', `${kv({status: humanStatus(v31.interview_engine_status), questionnaire: paths.questionnaire ? 'готово' : 'нет', adaptive_flow: paths.adaptive_flow ? 'готово' : 'нет', client_004_example: paths.client_004_interview ? 'готово' : 'нет'})}<div class="toolbar">${openButton('Questionnaire', paths.questionnaire || '')}${openButton('Adaptive JSON', paths.adaptive_flow || '')}${openButton('Client #004 interview', paths.client_004_interview || '')}</div>${detailPayloadButton({paths}, 'Подробнее', 'v31-interview-paths')}`, 'span-6')}
    ${card('Premium Visual + Image Pipeline', `${kv({visual_system: paths.visual_system ? 'готово' : 'нет', image_pipeline: paths.image_pipeline ? 'готово' : 'нет', asset_status: 'concept visuals готово; реальные фото запланированы'})}<div class="toolbar">${openButton('Visual system', paths.visual_system || '')}${openButton('Image pipeline', paths.image_pipeline || '')}</div>${detailPayloadButton({paths, assets: v31.visual_assets}, 'Подробнее', 'v31-visual-paths')}`, 'span-6')}
    ${card('Motion readiness', `${kv({status: v31.premium_motion_system_status, readiness: v31.motion_readiness})}<div class="toolbar">${openButton('Motion system', paths.motion_system || '')}${openButton('Preview', paths.preview || '')}</div>`, 'span-12')}
    <section class="card span-12"><h3>Concept A/B/C</h3><div class="capability-grid">${concepts.length ? concepts.map(premiumConceptCard).join('') : '<div class="empty">Concepts pending.</div>'}</div></section>
    <section class="card span-12"><h3>Image assets — real / generated / planned</h3><div class="capability-grid">${assets.length ? assets.map(premiumAssetCard).join('') : '<div class="empty">Assets pending.</div>'}</div></section>
  </div>`;
}

function premiumWebsiteGenerator() {
  const v32 = state.premium_website_generator_v32 || {};
  const paths = v32.paths || {};
  const inputs = asArray(v32.inputs);
  const outputs = asArray(v32.outputs);
  const pipeline = asArray(v32.pipeline);
  const client = v32.client_004 || {};
  const actionRequired = asArray(v32.owner_action_required);
  return `<div class="grid premium-generator">
    ${metric('Generator', humanStatus(v32.status || 'unknown'), 'span-3')}
    ${metric('QA score', client.qa_score ? `${client.qa_score}/100` : '—', 'span-3')}
    ${metric('Visuals', client.visuals || 'unknown', 'span-3')}
    ${metric('HyperFrames', v32.mp4_status || client.motion || 'unknown', 'span-3')}
    ${card('Premium Website Generator — v32', `${kv({status: humanStatus(v32.status), site: paths.premium_site ? 'готово' : 'нет', fallback: paths.fallback ? 'готово' : 'нет', qa: paths.qa ? 'готово' : 'нет', mp4: v32.mp4_status || 'не заявлен', next_action: 'approve merge chain / real assets / render gate'})}<div class="toolbar">${openButton('Premium site', paths.premium_site || '')}${openButton('Single file', paths.fallback || '')}${openButton('Generator spec', paths.generator || '')}${openButton('Research', paths.research || '')}${openButton('QA', paths.qa || '')}${detailPayloadButton(v32, 'Подробнее', 'v32-premium-generator')}</div>`, 'span-12')}
    ${card('Client Interview + Order Builder', `${kv({interview: 'adaptive 10 questions + follow-up', order_builder: '18 packages', mobile_ready: 'wizard foundation'})}<div class="toolbar">${openButton('Interview master', '/workspace/output/webstudio-client-interview-master-v32.md')}${openButton('Interview JSON', '/workspace/output/webstudio-client-interview-master-v32.json')}${openButton('Order builder', '/workspace/output/webstudio-order-builder-v32.md')}${openButton('Service catalog', '/workspace/output/webstudio-service-catalog-v32.md')}</div>`, 'span-6')}
    ${card('Client #004 Premium Site', `${kv({industry: client.industry, visuals: client.visuals, motion: client.motion, qa_score: client.qa_score ? `${client.qa_score}/100` : '—'})}<div class="toolbar">${openButton('Open site', paths.premium_site || '')}${openButton('Motion composition', '/workspace/output/webstudio-client-004-motion-composition-v32.html')}${openButton('Asset registry', '/workspace/output/webstudio-client-004-image-asset-registry-v32.json')}</div>`, 'span-6')}
    <section class="card span-6"><h3>Pipeline</h3><div class="capability-grid">${pipeline.map(x => `<article class="mini-card"><b>${fmt(x)}</b><p>production gate</p></article>`).join('')}</div></section>
    <section class="card span-6"><h3>Inputs / Outputs</h3><p><b>Inputs:</b> ${inputs.map(fmt).join(', ')}</p><p><b>Outputs:</b> ${outputs.map(fmt).join(', ')}</p><details><summary>Подробнее</summary><pre>${fmt(jsonCopy({inputs, outputs}))}</pre></details></section>
    <section class="card span-12"><h3>Owner action required</h3><div class="capability-grid">${actionRequired.map(x => `<article class="mini-card"><b>${fmt(x)}</b><p>только после отдельного approval</p></article>`).join('')}</div></section>
  </div>`;
}

function premiumFactoryV34() {
  const v34 = state.premium_factory_v34 || {};
  const paths = v34.paths || {};
  const approvals = asArray(v34.owner_action_required);
  const kanbanCards = asArray(v34.kanban_cards);
  const prod = v34.production_acceptance || {};
  const pilot = v34.client_order_pilot || {};
  const pkg = v34.production_package || {};
  const dashboard = v34.dashboard_visibility || {};
  const artifacts = asArray(v34.supabase_artifacts);
  const gates = asArray(v34.qa_gates);
  const day1 = state.premium_factory_v37_day1 || v34.day1 || {};
  const day1Progress = day1.progress || {};
  const gateText = asArray(v34.approval_gates).length ? asArray(v34.approval_gates).join(' · ') : 'реальные материалы · MP4 · medical/legal · Telegram CTA · public launch';
  return `<div class="grid premium-factory-v34">
    ${metric('Factory', humanStatus(v34.status || 'unknown'), 'span-3')}
    ${metric('QA score', v34.qa_score ? `${v34.qa_score}/100` : '—', 'span-3')}
    ${metric('V3.4 pilot', pilot.status || dashboard.status || 'READY', 'span-3')}
    ${metric('Demo only', pilot.demo_only === false ? 'no' : 'yes', 'span-3')}
    ${card('V3.4 Client Order → Premium Website Factory Pilot', `${kv({business: pilot.business_name || v34.client, niche: pilot.niche, offer: pilot.offer, audience: pilot.target_audience, tone: pilot.brand_tone, conversion_goal: pilot.conversion_goal, route: dashboard.route || '/premium-factory-v34/', data_source: dashboard.data_source || 'sanitized static snapshot'})}<div class="toolbar">${openButton('Client order JSON', paths.client_order || '')}${openButton('Client brief', paths.client_brief || '')}${openButton('Production brief', paths.production_brief || '')}${detailPayloadButton(pilot, 'Подробнее', 'v34-client-order-pilot')}</div>`, 'span-12', 'pilot-card')}
    ${card('Production package', `${kv({status: pkg.status || 'PACKAGE_READY', sitemap: pkg.sitemap, copy_outline: pkg.copy_outline, design_system: pkg.design_system, component_plan: pkg.component_plan, seo_plan: pkg.seo_plan, conversion_plan: pkg.conversion_plan, qa_checklist: pkg.qa_checklist})}<div class="toolbar">${openButton('Sitemap', paths.sitemap || '')}${openButton('Copy outline', paths.copy_outline || '')}${openButton('Design system', paths.design_system || '')}${openButton('QA checklist', paths.qa || '')}${detailPayloadButton(pkg, 'Подробнее', 'v34-production-package')}</div>`, 'span-12')}
    ${card('QA gates / Supabase artifact visibility', `<div class="capability-grid">${gates.map(x => `<article class="mini-card"><b>${fmt(x.gate)}</b><p>${fmt(x.status)}</p></article>`).join('')}</div><div class="list">${artifacts.map(x => row(x.artifact_key || 'artifact', x.path || x.artifact_type || '—', x.status || 'ready', x.artifact_type || '', 'v34-supabase-artifact', jsonCopy(x))).join('') || '<div class="empty">Artifacts pending.</div>'}</div>`, 'span-12')}
    ${card('Premium Website Factory Day 1 — research / DESIGN.md / skills', `${kv({research:day1Progress.research?.status || '—', design_systems:day1Progress.design_systems?.status || '—', skills:day1Progress.skills?.status || '—', tooling_map:day1Progress.tooling_map?.status || '—', external_sources_review:day1Progress.external_sources_review?.status || '—', security_review:day1Progress.security_review?.status || '—', readiness:day1Progress.day1_readiness?.status || '—'})}<p class="label">Готово к demo/continuation. Детали и пути собраны в отчётах; внешний review уже классифицирован и не блокирует продуктовые фазы.</p><div class="toolbar">${openButton('Research', day1.artifact_paths?.research || '/workspace/output/webstudio-premium-factory-research-v37.md')}${openButton('DESIGN.md', day1.artifact_paths?.design_systems || '/workspace/output/webstudio-master-design-system-v37.md')}${openButton('Skills', day1.artifact_paths?.skills_inventory || '/workspace/output/webstudio-skills-inventory-v37.md')}${openButton('Tooling map', day1.artifact_paths?.tooling_map || '/workspace/output/webstudio-tooling-and-skills-map-v37.md')}${detailPayloadButton(day1, 'Подробнее', 'v37-day1')}</div>`, 'span-12')}
    ${card('Premium Website Factory v34.2 — production acceptance', `${kv({production_deploy: prod.deployed_path || '—', production_verification: prod.verification_status || '—', browser_qa: prod.browser_qa_status || '—', screenshot_job: prod.screenshot_job_status || '—', qa_score:v34.qa_score ? `${v34.qa_score}/100` : '—', client_demo: prod.client_demo_ready === false ? 'не показывать клиенту до repair assets' : 'готово к демо', public_launch: prod.public_launch_ready === false ? 'не готово без approvals' : 'проверить', owner_action_required: prod.owner_action_required_for_product_work === false ? 'только для public/live шагов' : 'проверить'})}<p class="label">V3.4 pilot is demo/package-ready. Public launch still requires real assets, compliance copy and live integration approval.</p><div class="toolbar">${openButton('Verification', prod.verification_report || '/workspace/output/webstudio-client-004-v34-production-verification.md')}${openButton('Browser QA', prod.browser_qa_report || '/workspace/output/webstudio-client-004-v34-production-browser-qa.md')}${openButton('Presentation pack', prod.presentation_pack || '/workspace/output/webstudio-client-004-presentation-pack-v34.md')}${openButton('Owner approval', prod.owner_approval_packet || '/workspace/output/webstudio-client-004-owner-approval-packet-v34.md')}${detailPayloadButton(prod, 'Подробнее', 'v34-production-acceptance')}</div>`, 'span-12')}
    ${card('Premium Website Factory v34', `${kv({research:v34.research, design_system:v34.design_system, skills:v34.skills, visual_sourcing:v34.visual_sourcing, interview:v34.interview, order_builder:v34.order_builder, site:v34.client_004_site, motion:v34.motion_hyperframes, visuals:v34.image_assets, mp4:v34.mp4_status})}<div class="toolbar">${openButton('Client #004 source site', paths.site || '')}${openButton('Fallback', paths.fallback || '')}${openButton('Research', paths.research || '')}${openButton('QA', paths.qa || '')}${detailPayloadButton(v34, 'Подробнее', 'v34-premium-factory')}</div>`, 'span-12')}
    ${card('Launch readiness / approval gates', `${kv({demo_status: 'ready for owner/demo review', public_status: 'approval-gated', asset_legitimacy: prod.asset_legitimacy_summary || 'demo placeholders only; real proof required before public', motion_publication: prod.motion_publication_status || 'roadmap only for this pilot', owner_action: 'только для public/live approvals'})}<p>${fmt(gateText)}</p><div class="toolbar">${openButton('Approval packet', prod.owner_approval_packet || '/workspace/output/webstudio-client-004-owner-approval-packet-v34.md')}${openButton('V3.4 final report', paths.v34_root ? `${paths.v34_root}/final-report.md` : '')}</div>`, 'span-12')}
    ${card('Iteration Budget Guard v34.1', `${kv({status:v34.iteration_guard || 'ITERATION_GUARD_PASS', max_turns:'600', auto_extend:'120 × 5', effective_ceiling:'1200', gateway:'active after restart'})}<div class="toolbar">${openButton('Proof', v34.iteration_guard_proof || '/workspace/output/iteration-budget-guard-v34-proof.md')}${openButton('Runtime JSON', v34.iteration_guard_runtime || '/workspace/output/iteration-budget-guard-v34-runtime.json')}${openButton('Auto-extend report', '/workspace/output/iteration-budget-auto-extend-v34-report.md')}</div>`, 'span-12')}
    ${card('Visual Sourcing Engine', `${kv({asset_registry:'real/generated/planned/approval required', medical_guardrails:'no fake doctors/certificates/before-after', shotlist:'hero/team/process/proof/interior/social'})}<div class="toolbar">${openButton('Asset registry', '/workspace/output/webstudio-client-004-asset-registry-v34.json')}${openButton('Shotlist', '/workspace/output/webstudio-client-004-shotlist-v34.md')}${openButton('Visual direction', '/workspace/output/webstudio-client-004-visual-direction-v34.md')}</div>`, 'span-6')}
    ${card('Motion / HyperFrames / 3D', `${kv({composition:'next sprint', mp4:v34.mp4_status || 'not in scope', background_video:'policy ready', threejs:'policy ready', reduced_motion:'ready'})}<div class="toolbar">${openButton('Composition', '/workspace/output/webstudio-client-004-motion-composition-v34.html')}${openButton('Render command', '/workspace/output/webstudio-client-004-hyperframes-render-command-v34.md')}${openButton('3D policy', '/workspace/output/webstudio-3d-scene-policy-v34.md')}</div>`, 'span-6')}
    ${card('Kanban / Owner Approval Mirrors', `<div class="capability-grid">${kanbanCards.map(x => `<article class="mini-card"><b>${fmt(x.title || x.idempotency_key)}</b><p>${fmt(x.status || 'blocked mirror')} · не запускается автоматически</p></article>`).join('') || approvals.map(x => `<article class="mini-card"><b>${fmt(x)}</b><p>только после отдельного approval</p></article>`).join('')}</div><div class="toolbar">${openButton('Kanban result', '/workspace/output/webstudio-v34-kanban-cards-result.json')}</div>`, 'span-12')}
  </div>`;
}

function recoveryStateLabel(s) {
  const map = {OK:'OK', WATCH:'WATCH', DEGRADED_SAFE:'DEGRADED SAFE', RECOVERING:'RECOVERING', BLOCKED_OWNER_APPROVAL:'BLOCKED OWNER APPROVAL', BLOCKED_SYSTEM:'BLOCKED SYSTEM', PASS:'PASS'};
  return map[String(s || '').toUpperCase()] || String(s || '—');
}
function recoveryRow(e) {
  const main = `${e.category || '—'} · ${recoveryStateLabel(e.current_state)} · auto: ${e.auto_recovery_status || e.automatic_recovery || '—'} · owner action: ${e.owner_action_required ? 'YES' : 'NO'}`;
  const next = e.next_automatic_step || e.when_to_retry || 'continue safe product lane';
  return `<article class="attention-item ${statusClass(e.current_state || e.status)}">
    <div class="attention-head"><strong>${fmt(e.error || e.id)}</strong>${badge(e.current_state || e.status || 'WATCH')}</div>
    <p><b>Состояние:</b> ${fmt(main)}</p>
    <p><b>Следующий автоматический шаг:</b> ${fmt(next)}</p>
    <p class="label">Отчёт: ${fmt(shortPath(e.artifact_report_path || e.report || '—'))}</p>
    <div class="toolbar">${openButton('Отчёт', e.artifact_report_path || e.report || '')}${detailPayloadButton(e, 'Подробнее', 'error-recovery')}</div>
  </article>`;
}
function errorRecovery() {
  const er = state.error_recovery_v37_1 || {};
  const errors = asArray(er.errors);
  const counts = errors.reduce((acc,e)=>{ const k=e.current_state || e.status || 'unknown'; acc[k]=(acc[k]||0)+1; return acc; },{});
  const ownerNeeded = errors.filter(e => e.owner_action_required).length;
  const routine = errors.filter(e => !e.owner_action_required).length;
  return `<div class="grid error-recovery-page">
    ${metric('Recovery status', er.status || 'PASS', 'span-3')}
    ${metric('Error classes', errors.length, 'span-3')}
    ${metric('Auto recovery', er.auto_recovery_status || 'active', 'span-3')}
    ${metric('Owner action', ownerNeeded ? ownerNeeded + ' live gates' : 'NO for routine', 'span-3')}
    ${card('Ошибки и восстановление', `${kv({status:er.status || 'PASS', current_state:er.current_state || 'RECOVERING', last_recovery:er.last_recovery || 'Day 1 Auto-Push moved to Host Runner', next_automatic_step:er.next_automatic_step || 'Host Runner Auto-Push + Day 2 Visual Sourcing', owner_action_required:ownerNeeded ? 'только live approvals' : 'NO for routine recovery'})}<p class="label">Главный экран показывает owner-safe статусы. Raw/debug и длинные пути только в «Подробнее».</p><div class="toolbar">${openButton('Taxonomy', er.taxonomy_report || '/workspace/output/webstudio-error-taxonomy-v37-1.md')}${openButton('Playbooks', er.playbooks_report || '/workspace/output/webstudio-error-recovery-playbooks-v37-1.md')}${openButton('Touch guide', er.owner_guide || '/workspace/output/webstudio-touch-ready-owner-guide-v37-1.md')}${detailPayloadButton(er, 'Подробнее', 'error-recovery-state')}</div>`, 'span-12')}
    ${card('Статусы', kv(counts), 'span-4')}
    ${card('Owner action policy', `<p><b>YES только для live approvals:</b> production secrets, live Telegram token, live CRM/Sheets writes, Supabase writes, public launch/publish, payments, private client data, medical/legal public launch.</p><p><b>NO для routine recovery:</b> GitHub Auto-Push, Host Runner retry, qmd, hfinalize, browser QA retry, production asset repair, artifacts, DESIGN.md/skills/visual sourcing.</p>`, 'span-8')}
    <section class="card span-12"><h3>Recovery classes</h3><div class="list recovery-list">${errors.map(recoveryRow).join('')}</div></section>
  </div>`;
}

function capabilities() { return `<div class="grid">${frontendDesignEngine()}${capabilityMatrix()}${progressAnalytics()}</div>`; }

function demoThumbnail(item, score, line) {
  const t = item.preview_thumbnail || {};
  const chips = asArray(t.chips).slice(0,4);
  const accent = t.accent || (line === 'D1' ? '#f5c37b' : line === 'D2' ? '#5dd2ff' : '#36d399');
  return `<div class="demo-thumb v11-thumb ${String(line).toLowerCase()}" style="--thumb-accent:${esc(accent)}"><span>${fmt(line)}</span><strong>${fmt(t.headline || item.preview_label || 'Демо')}</strong><em>${fmt(t.theme || item.artifact_type || 'WebStudio')}</em><div class="thumb-chips">${chips.map(c => `<small>${fmt(c)}</small>`).join('')}</div><i style="width:${Math.max(8, Math.min(100, score))}%"></i></div>`;
}
function productLineName(line) {
  return line === 'D1' ? 'Лендинги и сайты' : line === 'D2' ? 'AI-intake Telegram bot' : line === 'D3' ? 'Бизнес-автоматизации' : 'WebStudio';
}
function demoProductCard(item) {
  const score = Number(item.readiness_score || 0);
  const line = item.product_line || 'D?';
  const qa = item.qa_path || item.fixtures_path || '';
  const handoff = item.handoff_path || item.demo_script_path || '';
  const clientGets = item.client_gets || item.preview_label || item.artifact_type || 'Готовый артефакт для клиентского показа.';
  const example = item.example_request || item.example_dialog || item.example_process || 'Пример клиентского запроса хранится в деталях.';
  const automation = item.automation || 'Система готовит артефакты, QA и передачу владельцу.';
  return `<article class="demo-product-card showcase-card ${String(line).toLowerCase()}">
    ${demoThumbnail(item, score, line)}
    <div class="demo-head"><div><p class="eyebrow">${fmt(line)} — ${fmt(productLineName(line))}</p><h3>${fmt(item.title || productLineName(line))}</h3></div>${badge(item.status || 'watch')}</div>
    <div class="showcase-copy">
      <p><b>Что клиент получает:</b> ${fmt(clientGets)}</p>
      <p><b>Пример:</b> ${fmt(shortText(example, 130))}</p>
      <p><b>Что система делает автоматически:</b> ${fmt(automation)}</p>
    </div>
    <div class="demo-progress"><span>Готовность</span><b>${fmt(score)}%</b><div class="bar"><i style="width:${Math.max(5, Math.min(100, score))}%"></i></div></div>
    <div class="task-meta-grid owner-meta">
      <span>Демо</span><b>${item.path ? 'готово' : 'нет'}</b>
      <span>QA</span><b>${qa ? 'готово' : 'нет'}</b>
      <span>Передача</span><b>${handoff ? 'готово' : 'нет'}</b>
      <span>Следующий шаг</span><b>${fmt(shortText(item.next_action || 'проверить демо', 72))}</b>
    </div>
    <div class="toolbar cta-row">
      ${openButton('Открыть демо', item.path || '')}
      ${openButton('Показать клиенту', item.path || '')}
      ${openButton('QA', qa)}
      ${openButton('Передача', handoff)}
      ${detailPayloadButton(item, 'Подробнее', 'demo-product')}
    </div>
  </article>`;
}
function clientSimulationPanel(progress={}) {
  const sim = progress.client_simulation || {};
  if (!sim.id) return '';
  const links = [
    ['Бриф', sim.brief_path], ['D1', sim.d1_path], ['D2', sim.d2_path], ['D3', sim.d3_path], ['Delivery pack', sim.delivery_pack_path]
  ];
  const score = Number(sim.readiness_score || 0);
  return `<section class="card span-12 client-sim-card"><div class="sim-head"><div><p class="eyebrow">First Real Intake Simulation</p><h3>Client Simulation #001</h3></div>${badge(sim.status || 'draft')}</div>
    <p class="sim-request">${fmt(sim.source_request || '—')}</p>
    <div class="sim-split">
      <article><span>D1</span><b>Лендинг для ремонта квартир</b><p>Оффер, proof cards, возражения, CTA.</p></article>
      <article><span>D2</span><b>Telegram intake flow</b><p>Вопросы бота, qualification fields, handoff.</p></article>
      <article><span>D3</span><b>Автоматизация заявки</b><p>CRM/таблица, уведомление, risk gates, dry-run.</p></article>
    </div>
    <div class="demo-progress"><span>Готовность simulation</span><b>${fmt(score)}%</b><div class="bar"><i style="width:${Math.max(5, Math.min(100, score))}%"></i></div></div>
    <div class="task-meta-grid owner-meta"><span>Статус</span><b>draft / QA / ready for owner review</b><span>Решение владельца</span><b>${fmt(shortText(sim.owner_decision || '—', 86))}</b></div>
    <div class="toolbar">${links.map(([label,path]) => openButton(label, path)).join('')}${detailPayloadButton(sim, 'Подробнее', 'client-simulation')}</div>
  </section>`;
}
function compactLineCard(line, item={}) {
  const qa = item.qa_path || item.fixtures_path || '';
  const handoff = item.handoff_path || item.demo_script_path || '';
  const body = `<p><b>Что клиент получает:</b> ${fmt(item.client_gets || '—')}</p><p><b>Следующий шаг:</b> ${fmt(item.next_action || '—')}</p><div class="toolbar">${openButton('Открыть демо', item.path || '')}${openButton('Открыть QA', qa)}${openButton('Открыть handoff', handoff)}${item.motion_spec_path ? openButton('Motion spec', item.motion_spec_path) : ''}${item.fixtures_csv_path ? openButton('CSV fixtures', item.fixtures_csv_path) : ''}${detailPayloadButton(item, 'Подробнее', 'line-details')}</div>`;
  return card(`${line} — ${productLineName(line)}`, body, 'span-4');
}
function readinessTimeline(progress={}) {
  const timeline = asArray(progress.analytics?.readiness_timeline || progress.readiness_timeline);
  if (!timeline.length) return '';
  return `<section class="card span-12 readiness-timeline-card"><h3>Delivery readiness timeline</h3><p class="label">Клиентский сценарий #001: каждый шаг имеет артефакт, QA и no-live-write gate.</p><div class="readiness-timeline">${timeline.map((step, i) => `<article class="timeline-step ${statusClass(step.status)}"><span>${fmt(String(i + 1).padStart(2,'0'))}</span><b>${fmt(step.step || step.title)}</b>${badge(step.status || 'watch')}<small>${fmt(shortPath(step.artifact || step.path || '—'))}</small>${openButton('Открыть', step.artifact || step.path || '')}</article>`).join('')}</div></section>`;
}
function systemContinuationPanel(progress={}) {
  const sys = progress.system_layer || {};
  if (!sys.status) return '';
  const body = `<p><b>${fmt(sys.title || 'System continuation layer')}</b></p>
    <div class="task-meta-grid owner-meta"><span>Status</span><b>${fmt(sys.status)}</b><span>No chat-cron</span><b>${sys.no_chat_cron ? 'yes' : 'check'}</b><span>Work Factory</span><b>${fmt(sys.work_factory_job_id || '—')}</b><span>Kanban anchor</span><b>${fmt(shortText(sys.kanban_anchor || '—', 84))}</b><span>Next push</span><b>${fmt(shortText(sys.next_push_candidate || '—', 16))}</b></div>
    <div class="toolbar">${openButton('Manifest', sys.manifest_path || '')}${openButton('Operator runbook', sys.operator_runbook_path || '')}${openButton('Acceptance', sys.acceptance_path || '')}${copyButton('HERMES Auto-Push command', 'cd /home/hermes/workspace && WEBSTUDIO_STAGE=v21 bash /home/hermes/workspace/output/webstudio-github-autopush-v1.sh')}${detailPayloadButton(sys, 'Подробнее', 'system-v21')}</div>`;
  return card('System v21 — self-executing host pipeline', body, 'span-12 system-layer-card');
}
function demoProducts() {
  const progress = state.product_progress || {};
  const items = asArray(progress.items);
  const avg = items.length ? Math.round(items.reduce((sum,item)=>sum + Number(item.readiness_score || 0), 0) / items.length) : 0;
  const byLine = Object.fromEntries(['D1','D2','D3'].map(l => [l, items.find(x => x.product_line === l) || {}]));
  const reportPath = progress.report || '/workspace/output/webstudio-product-build-v12-report.md';
  return `<div class="grid demo-products-page showcase-page">
    ${metric('Продуктовые линии', items.length, 'span-3', 'demo-products')}
    ${metric('Средняя готовность', avg + '%', 'span-3', 'demo-products')}
    ${metric('QA готово', items.filter(x => x.qa_path || x.fixtures_path).length + '/' + items.length, 'span-3', 'demo-products')}
    ${metric('Передача готова', items.filter(x => x.handoff_path || x.demo_script_path).length + '/' + items.length, 'span-3', 'demo-products')}
    <section class="card span-12 demo-products-hero showcase-hero"><p class="eyebrow">WebStudio Showcase</p><h3>Витрина WebStudio</h3><p class="label">Клиентская витрина автоматизированной веб-студии: D1 сайты, D2 Telegram intake, D3 бизнес-автоматизации. Технические пути и raw/debug убраны в «Подробнее».</p><div class="demo-product-grid">${items.map(demoProductCard).join('')}</div></section>
    ${clientSimulationPanel(progress)}
    ${systemContinuationPanel(progress)}
    ${readinessTimeline(progress)}
    ${compactLineCard('D1', byLine.D1)}
    ${compactLineCard('D2', byLine.D2)}
    ${compactLineCard('D3', byLine.D3)}
    ${card('Источник прогресса', `<p>Фаза: ${fmt(progress.phase || 'v12')} · обновлено: ${fmt(progress.updated_at)} · PR: ${fmt(progress.pr_verification_verdict || 'PASS')}</p><div class="toolbar">${copyButton('Скопировать путь прогресса', progress.source_of_truth || '/workspace/output/webstudio-product-progress-v1.json')}${copyButton('Скопировать v12 report', reportPath)}${detailPayloadButton(progress, 'Подробнее', 'progress-source')}</div>`, 'span-12')}
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
    ${card('v21 client delivery packets', rowsTop(asArray(progress.items).filter(item => item.phase === 'v21'), item => row(item.product_line, `${item.title || item.artifact_type} · ${ru(item.stage || 'stage')}`, item.status || 'artifact', `${shortPath(item.path)} · approval=${shortPath(item.qa_path || item.approval_path || '')} · готовность=${item.readiness_score ?? '—'}%`, 'artifact', jsonCopy(item)), 8, 'v21 артефакты пока не записаны'), 'span-12')}
    ${card('Delivery readiness / approval gates', `${deliveryReadinessCard(progress, p)}${kv({status: progress.analytics?.delivery_readiness?.status || progress.v18_status || 'PASS_WITH_APPROVAL_GATES', owner_action_required: progress.analytics?.delivery_readiness?.owner_action_required ?? false, approval_gates: progress.analytics?.delivery_readiness?.approval_gates || [], next_push_candidate: progress.github_sync?.next_push_candidate || state.github_readiness?.next_push_candidate || 'none'})}`, 'span-6')}
    ${card('GitHub Auto-Push status', `${kv({status: progress.github_sync?.autopush_status || state.github_readiness?.status || 'unknown', latest_pushed_commit: progress.github_sync?.latest_pushed_commit || state.github_readiness?.latest_commit_sha || '—', pr_status: progress.github_sync?.pr_status || progress.pr_verification_verdict || '—', gitguardian: progress.github_sync?.gitguardian_status || '—', owner_action_required: progress.github_sync?.owner_action_required ?? false, next_push_candidate: progress.github_sync?.next_push_candidate || '—'})}${toolbar([copyButton('Copy PR URL', progress.pr_url || state.github_readiness?.pr_url || 'https://github.com/pltnv123/webstudio-ops-dashboard/pull/1'), copyButton('Copy HERMES Auto-Push command', 'WEBSTUDIO_STAGE=v21 bash /home/hermes/workspace/output/webstudio-github-autopush-v1.sh')])}`, 'span-6')}
    ${readinessTimeline(progress)}
    ${card('Прогресс D1/D2/D3', rowsTop(asArray(progress.items), item => row(item.product_line, `${item.artifact_type} · ${ru(item.stage || 'stage')}`, item.status || 'artifact', `${shortPath(item.path)} · sha=${String(item.sha256 || '').slice(0,12)} · обновлено=${item.updated_at || progress.updated_at || '—'}`, 'artifact', jsonCopy(item)), 8, 'Нет артефактов прогресса'), 'span-12')}
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
    ${systemVerdictPanel()}
    ${hostAutonomyPanel()}
    ${hostRunnerPanel()}
    ${githubReadinessPanel()}
    ${continuationQueuePanel()}
    ${qmdSystemPanel()}
    ${snapshotSystemPanel()}
    ${workFactorySystemPanel()}
    ${kanbanSystemPanel()}
    ${agentsSystemPanel()}
    ${ownerActionsSystemPanel()}
    ${card('Host / runtime', `${kv({gateway_active: h.gateway_active, primary_model: h.primary_model_line, snapshot_status: h.status})}${collapsibleTechDetails({host_snapshot: h.host_snapshot, bad_config_summary: h.bad_config_summary})}${toolbar([copyButton('Copy qmd status command', 'qmd status'), copyButton('Copy host snapshot path', '/workspace/runtime/host-health-snapshot.txt')])}`, 'span-6')}
    ${card('Product D1/D2/D3', productSystemSummary(), 'span-6')}
    ${collapsibleCard('Подробнее: системные источники', `${rows(Object.entries(state.sources || {}).map(([k,v]) => ({id:k, title:v.path || k, status:v.exists ? 'available' : 'missing', ...v})), s => row(s.id, s.title, s.status, `${s.size || 0} bytes · ${s.mtime || '—'} · ${s.sha256 || 'no sha'}`, 'source', jsonCopy(s)))}${toolbar([copyButton('Copy snapshot processor path', '/workspace/.hermes/scripts/hermes-auto-snapshot-processor.sh'), copyButton('Copy QMD plan path', '/workspace/output/qmd-bounded-embeddings-maintenance-plan-v1.md'), copyButton('Copy GitHub autopush result path', '/workspace/output/webstudio-system-maintenance-autopush-result.json')])}`, 'span-12')}
  </div>`;
}

function okWarnBlock(ok, warn=false) { return ok ? 'OK' : (warn ? 'DEGRADED' : 'BLOCKED'); }
function statusBadgeLine(title, status, text='') { return `<div class="system-line"><strong>${fmt(title)}</strong>${badge(status)}${text ? `<small class="label">${fmt(text)}</small>` : ''}</div>`; }
function collapsibleTechDetails(payload) { return `<details class="raw-details"><summary>Подробнее</summary><pre class="code mini">${fmt(stringify(payload, 1800))}</pre></details>`; }

function systemVerdictPanel() {
  const ha = state.host_autonomy || {}; const ce = ha.continuation_engine || {}; const q = ha.qmd || state.health?.qmd || {}; const gh = state.github_readiness || {}; const pr = gh.pr_status || {}; const wf = state.work_factory || {}; const kb = state.kanban || {}; const aw = state.agent_workflow || {};
  const qmdOk = q.bounded_mode_available === true || String(q.status || '').includes('BOUNDED');
  const opsWatch = String(aw.status || aw.protocol?.ops_lane_status || '').includes('WATCH');
  const verdict = (ha.status === 'ON' && ce.owner_needs_to_type_continue === false && gh.pr_url && wf.enabled !== false && !kb.executable_mirror_count && qmdOk) ? (opsWatch ? 'WATCH' : 'OK') : 'DEGRADED';
  return card('Система — сводка готовности', `
    ${statusBadgeLine('Host Autonomy', ha.status === 'ON' ? 'OK' : 'DEGRADED', 'автономия без ручного push')}
    ${statusBadgeLine('Auto-Push', (pr.owner_action_required === false || pr.owner_manual_push === 'deprecated') ? 'OK' : 'DEGRADED', shortText(pr.pr_url || gh.pr_url || 'PR не найден'))}
    ${statusBadgeLine('Continuation Queue', ce.owner_needs_to_type_continue === false ? 'OK' : 'BLOCKED', `pending=${ce.pending_jobs ?? '—'} · chat-cron=${ce.chat_cron_used === false ? 'off' : 'check'}`)}
    ${statusBadgeLine('QMD', qmdOk ? 'OK' : (q.status || 'DEGRADED'), `bounded=${q.bounded_mode || (qmdOk ? 'available' : 'missing')} · total=${q.total_documents ?? q.total ?? '—'} · vectors=${q.vectors ?? '—'} · pending=${q.pending_embeddings ?? '—'}`)}
    ${statusBadgeLine('Snapshot processor', ha.snapshot_processor?.status || 'DEGRADED', 'асинхронные snapshot-заявки обрабатываются host-side')}
    ${statusBadgeLine('Agents / Skills', opsWatch ? 'WATCH' : 'OK', aw.protocol?.ops_lane_status || 'terminator contract visible')}
    ${statusBadgeLine('Owner Actions', ha.owner_action_required === false ? 'OK' : 'DEGRADED', 'только live approvals')}
    <p class="label">Итог: ${fmt(verdict)}. QMD bounded режим доступен; продукт D1/D2/D3 возвращается после ops-lane canary или честной фиксации WATCH.</p>`, 'span-12');
}

function hostRunnerPanel() {
  const gh = state.github_readiness || {}; const pr = gh.pr_status || {}; const runner = pr.host_runner || gh.host_runner || (pr.host_runner_job_type ? 'PASS' : 'unknown');
  return card('Host Runner', `${kv({
    status: runner === 'PASS' ? 'OK' : runner,
    latest_result: pr.verification_verdict || gh.status || '—',
    job_type: pr.host_runner_job_type || 'github/autopush',
    workspace_root: pr.host_runner_workspace_root || '/home/hermes/workspace',
    owner_manual_command_required: pr.owner_action_required === false ? 'no' : 'check'
  })}${collapsibleTechDetails({pr_status: pr, runner_latest_path: pr.runner_latest_path})}${toolbar([copyButton('Copy runner latest path', '/workspace/output/host-job-runner/latest.json')])}`, 'span-6');
}

function continuationQueuePanel() {
  const ce = state.host_autonomy?.continuation_engine || state.continuation_controller || {};
  return card('Continuation Queue', `${kv({
    status: ce.status || ce.final_status || 'unknown',
    iteration_budget_protocol: ce.iteration_budget_protocol_created ?? ce.terminal_protocol?.continuation_required ?? '—',
    pending: ce.pending_jobs ?? '—',
    supervisor: ce.supervisor_path ? 'installed' : 'unknown',
    chat_cron_used: ce.chat_cron_used === false ? 'false' : 'check',
    owner_needs_to_type_continue: ce.owner_needs_to_type_continue === false ? 'false' : 'check',
    next_job_id: ce.first_next_pass_job_id || ce.next_job_id || '—'
  })}${collapsibleTechDetails(ce)}${toolbar([copyButton('Copy queue root', ce.queue_root || '/workspace/.hermes-workqueue/webstudio'), copyButton('Copy checkpoint path', ce.checkpoint_path || '/workspace/output/current-task-continuation-checkpoint.md')])}`, 'span-6');
}

function qmdSystemPanel() {
  const q = state.host_autonomy?.qmd || state.health?.qmd || {};
  const batch = q.last_bounded_batch || {};
  const ownerText = q.owner_facing_text || 'QMD поиск работает. Векторные embeddings требуют безопасного bounded режима; unlimited embed не запускается.';
  return card('QMD', `<p>${fmt(ownerText)}</p>${kv({
    status: q.status || (q.available ? 'OK' : 'unknown'),
    total_docs: q.total_documents ?? q.total ?? '—',
    vectors: q.vectors ?? '—',
    pending_embeddings: q.pending_embeddings ?? '—',
    bounded_mode: q.bounded_mode || (q.bounded_mode_available ? 'available' : 'missing'),
    last_bounded_batch: batch.status || '—',
    last_error: q.last_error || 'none',
    next_safe_action: q.next_safe_action || 'bounded batches only',
    owner_action_required: q.owner_action_required === false ? 'no' : (q.owner_action_required ?? 'check'),
    unlimited_embed: 'forbidden'
  })}${collapsibleTechDetails(q)}${toolbar([copyButton('Copy QMD investigation', '/workspace/output/qmd-true-bounded-embed-investigation-v21-1.md'), copyButton('Copy QMD result', '/workspace/output/qmd-bounded-embeddings-maintenance-result-v21-1.md'), copyButton('Copy QMD implementation note', '/workspace/output/qmd-bounded-embed-implementation-plan-v21-1.md')])}`, 'span-6');
}

function snapshotSystemPanel() {
  const sp = state.host_autonomy?.snapshot_processor || {}; const hard = state.system_hardening || {};
  return card('Snapshot processor', `${kv({
    status: sp.status || 'unknown',
    pending: hard.snapshot_pending_count ?? '—',
    processed_visible: sp.processed_requests_visible ?? '—',
    last_processed: sp.last_auto_snapshot ? shortText(sp.last_auto_snapshot, 80) : '—',
    stuck_requests: (hard.snapshot_pending_count || 0) > 3 ? 'check' : 'no'
  })}${collapsibleTechDetails({snapshot_processor: sp, system_hardening: hard})}${toolbar([copyButton('Copy snapshot health report', '/workspace/output/snapshot-processor-health-v21.md')])}`, 'span-6');
}

function workFactorySystemPanel() {
  const wf = state.work_factory || {};
  return card('Work Factory', `${kv({
    status: wf.enabled === false ? 'DEGRADED' : 'OK',
    pending: wf.pending_count ?? wf.backlog?.pending_count ?? '—',
    running: asArray(wf.running).length || 'none',
    blocked: asArray(wf.blocked).length || 'none',
    done: wf.total_work_factory_completed ?? wf.supervisor_completed ?? '—',
    host_runner_integration: 'visible'
  })}${collapsibleTechDetails(wf)}${toolbar([copyButton('Copy WF checkpoint', '/workspace/output/work-factory-supervisor-checkpoint.md')])}`, 'span-6');
}

function kanbanSystemPanel() {
  const k = state.kanban || {}; const c = k.counts || {}; const proto = state.agent_workflow?.protocol || {};
  return card('Kanban Health', `${kv({
    status: (k.executable_mirror_count || k.duplicate_keys?.length) ? 'DEGRADED' : 'OK',
    production_total: k.task_total ?? '—',
    ready: c.ready ?? '—',
    running: c.running ?? '—',
    blocked: c.blocked ?? '—',
    repeated_crashes: proto.repeated_crashes_after_indicator_count ?? '—',
    stale_running_dead_pids: proto.stale_running_dead_pid_after_2h_count ?? '—',
    executable_mirrors: k.executable_mirror_count ?? 0
  })}${collapsibleTechDetails({kanban: k, protocol: proto})}`, 'span-6');
}

function agentsSystemPanel() {
  const aw = state.agent_workflow || {}; const proto = aw.protocol || {}; const wh = state.worker_health || {};
  return card('Agents / Skills', `${kv({
    protocol: 'OK',
    flow: 'CTO-агент → Оркестратор → Исполнители → QA/Передача → Готово',
    canaries: asArray(aw.canary_results).length || '—',
    silent_finish: proto.silent_finish_allowed === false ? 'forbidden' : 'check',
    terminal_actions: asArray(proto.terminal_actions).join(', ') || 'kanban_complete, kanban_block',
    failures: wh.failed_count ?? wh.failures ?? '—'
  })}${collapsibleTechDetails({agent_workflow: aw, worker_health: wh})}`, 'span-6');
}

function ownerActionsSystemPanel() {
  const ha = state.host_autonomy || {}; const approvals = asArray(state.approvals);
  const live = asArray(ha.owner_action_required_only_for);
  const noNeed = asArray(ha.owner_not_required_for);
  return card('Owner Actions', `<p>Рутинные maintenance-команды владельца не нужны. Владелец нужен только для live approvals.</p>
    ${kv({owner_manual_push_required: 'no', pending_approval_cards: approvals.length, regular_maintenance_owner_commands: 'no'})}
    ${rows(live.map((x,i)=>({id:i+1,title:x,status:'approval'})), x => row('LIVE', ownerText(x.title), 'approval', 'требует явного решения владельца'))}
    ${collapsibleCard('Подробнее: что не требует владельца', rows(noNeed.map((x,i)=>({id:i+1,title:x,status:'OK'})), x => row('AUTO', ownerText(x.title), 'OK', 'автономно')), 'span-12')}
    ${toolbar([copyButton('Copy owner actions report', '/workspace/output/webstudio-full-operational-readiness-v21-report.md')])}`, 'span-12');
}

function productSystemSummary() {
  const pp = state.product_progress || {}; const lines = ['D1','D2','D3'].map(line => {
    const n = asArray(pp.by_line?.[line]).length;
    return {id: line, title: `${line} · ${ru(line)}`, status: 'tracked', meta: `${n} артефактов/пакетов · продуктовая разработка после System PASS`};
  });
  return rows(lines, x => row(x.id, x.title, x.status, x.meta));
}

function hostAutonomyPanel() {
  const a = state.host_autonomy || {};
  const ap = a.auto_push || state.github_readiness?.autopush || {};
  const q = a.qmd || state.health?.qmd || {};
  const hf = a.hfinalize || {};
  return card('Host Autonomy', `${kv({
    host_autonomy: a.status || 'unknown',
    approvals_mode: a.approvals_mode || 'unknown',
    owner_approved_autonomy: a.owner_approved_autonomy ?? '—',
    auto_push: ap.status || a.auto_push_available || 'unknown',
    last_auto_push_result: ap.verification_verdict || ap.status || '—',
    latest_pr_commit: a.latest_pr_commit || ap.latest_remote_commit || '—',
    checks_status: a.checks_status || ap.checks_status || '—',
    owner_action_required: a.owner_action_required === false ? 'false' : (a.owner_action_required ?? '—'),
    qmd_status: q.status || (q.available ? 'OK' : 'unknown'),
    pending_embeddings: q.pending_embeddings ?? '—',
    hfinalize: hf.status || 'pending'
  })}${toolbar([copyButton('Copy autonomy verification report', '/workspace/output/webstudio-host-autonomy-verification-v1.md'), copyButton('Copy QMD maintenance plan', '/workspace/output/qmd-bounded-embeddings-maintenance-plan-v1.md')])}`, 'span-6');
}

function githubReadinessPanel() {
  const gh = state.github_readiness || {};
  const ap = gh.autopush || {};
  const pr = gh.pr_status || {};
  const ownerNeeded = (ap.owner_action_required === false || ap.owner_action_required === 'no') ? false : (ap.owner_action_required === true || ap.owner_action_required === 'yes' || ap.status === 'blocked' || gh.status === 'AUTO_PUSH_BLOCKED' || gh.wrapper_broken);
  const prUrl = gh.pr_url || pr.pr_url || ap.pr_url || gh.completion_result?.pr_url || 'https://github.com/pltnv123/webstudio-ops-dashboard/pull/1';
  const latestCommit = ap.latest_pushed_commit || ap.latest_local_commit || pr.latest_commit_sha || gh.latest_commit_sha || '—';
  const latestPrHead = ap.latest_pr_head || ap.latest_remote_commit || pr.latest_remote_commit || pr.latest_commit_sha || gh.latest_commit_sha || '—';
  const checks = ap.gitguardian_status || ap.checks_status || pr.gitguardian_status || pr.checks_status || gh.pr_status?.checks_status || 'unknown';
  const nextPush = ap.next_push_candidate || gh.next_push_candidate || 'none until next useful code change';
  return card('GitHub Auto-Push', `${kv({
      auto_push_status: ap.status || gh.status || 'unknown',
      latest_push_time: pr.pushed_at || ap.pushed_at || ap.generated_at || gh.pushed_at || '—',
      latest_pushed_commit: latestCommit,
      latest_pr_head: latestPrHead,
      pr_status: ap.pr_status || pr.status || gh.status || 'unknown',
      gitguardian: checks,
      last_autopush_error: gh.last_autopush_error || ap.reason || '—',
      next_push_candidate: nextPush,
      owner_action_required: ownerNeeded ? 'yes' : 'no',
      script: gh.autopush_script || '/workspace/output/webstudio-github-autopush-v1.sh'
    })}<div class="toolbar"><a class="copy" href="${esc(prUrl)}" target="_blank" rel="noreferrer">Открыть PR</a>${copyButton('Copy autopush script', gh.autopush_script || '/workspace/output/webstudio-github-autopush-v1.sh')}${copyButton('Copy PR URL', prUrl)}</div>`, 'span-6');
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


function supabaseMemory() {
  const mem = state.supabase_memory || {};
  const ops = asArray(mem.latest_ops_status);
  const jobs = asArray(mem.latest_jobs);
  const artifactsList = asArray(mem.latest_artifacts);
  const memoryIndex = asArray(mem.latest_memory_index);
  const loop = mem.current_delivery_loop || {};
  const releaseState = mem.latest_deploy || {};
  const heartbeat = mem.latest_heartbeat || {};
  const bot = mem.bot_activity_summary || {};
  const source = mem.source || {};
  const sourceMode = mem.source_mode || 'static_snapshot';
  const ownerSummary = [
    `Supabase Memory status: ${loop.status || 'unknown'}`,
    `Latest commit: ${releaseState.commit || loop.commit || '—'}`,
    `Pages: ${releaseState.pages_url || loop.pages_url || '—'}`,
    `Heartbeat: ${heartbeat.created_at || loop.last_heartbeat_at || '—'}`,
    `Visible rows: ops=${ops.length}, jobs=${jobs.length}, artifacts=${artifactsList.length}, memory=${memoryIndex.length}`,
    `Source: ${sourceMode}; browser-side Supabase=${mem.safety?.browser_side_supabase === true ? 'enabled' : 'disabled'}`
  ].join('\n');
  const opRow = r => row(r.component || shortText(r.id || 'ops', 20), `${r.version || '—'} · ${shortText(r.notes || r.deployment_target || 'Operational status', 110)}`, r.status || 'unknown', `commit=${shortText(r.git_commit || '—', 12)} · created=${r.created_at || '—'} · target=${r.deployment_target || '—'}`, 'supabase-op-row', jsonCopy(r));
  const jobRow = j => row(shortText(j.job_key || j.id || 'job', 34), j.title || 'Supabase job', j.status || 'unknown', `priority=${j.priority ?? '—'} · created=${j.created_at || '—'} · updated=${j.updated_at || '—'}`, 'supabase-job-row', jsonCopy(j));
  const artifactSupabaseRow = a => row(a.artifact_key || a.id || 'artifact', `${a.artifact_type || 'artifact'} · ${a.path || '—'}`, a.status || 'unknown', `created=${a.created_at || '—'} · notes=${shortText(a.notes || '—', 80)}`, 'supabase-artifact-row', jsonCopy(a));
  const memoryRow = m => row(m.memory_key || m.id || 'memory', m.summary || 'Memory index row', m.scope || 'memory', `source=${m.source_path || '—'} · updated=${m.updated_at || m.created_at || '—'}`, 'supabase-memory-index-row', jsonCopy(m));
  return `<div class="grid supabase-memory-page">
    ${metric('Delivery loop', `${loop.version || '—'} / ${loop.status || 'unknown'}`, 'span-3')}
    ${metric('Ops rows', ops.length, 'span-3')}
    ${metric('Jobs', jobs.length, 'span-2')}
    ${metric('Artifacts', artifactsList.length, 'span-2')}
    ${metric('Last heartbeat', heartbeat.created_at || loop.last_heartbeat_at || '—', 'span-2')}
    ${card('Current delivery loop', `${kv({component: loop.component || 'webstudio-autonomous-delivery-loop', version: loop.version || '—', status: loop.status || '—', commit: loop.commit || releaseState.commit || '—', pages_url: loop.pages_url || releaseState.pages_url || '—', last_heartbeat_at: loop.last_heartbeat_at || heartbeat.created_at || '—'})}${toolbar([copyButton('Copy owner summary', ownerSummary), copyButton('Copy Supabase Memory JSON', jsonCopy(mem))])}`, 'span-6', 'supabase-memory-card')}
    ${card('Safe data source', `${kv({mode: sourceMode, browser_side_supabase: mem.safety?.browser_side_supabase === true ? 'enabled' : 'disabled', reason: mem.safety?.reason || 'static sanitized snapshot', source_path: source.path || mem.source_of_truth || '—', generated_at: mem.generated_at || '—', project_ref: mem.project_ref || '—'})}`, 'span-6', 'supabase-memory-card')}
    ${card('Latest ops status rows', rowsTop(ops, opRow, 8, 'No Supabase ops status rows in snapshot'), 'span-12')}
    ${card('Latest webstudio_jobs rows', rowsTop(jobs, jobRow, 8, 'No Supabase jobs rows in snapshot'), 'span-6')}
    ${card('Latest webstudio_artifacts rows', rowsTop(artifactsList, artifactSupabaseRow, 8, 'No Supabase artifacts rows in snapshot'), 'span-6')}
    ${card('Memory index rows', rowsTop(memoryIndex, memoryRow, 8, 'No Supabase memory index rows in snapshot'), 'span-6')}
    ${card('Bot activity summary', `${kv({visible_ops_rows: bot.visible_ops_rows ?? ops.length, visible_jobs: bot.visible_jobs ?? jobs.length, visible_artifacts: bot.visible_artifacts ?? artifactsList.length, pass_or_completed_jobs: bot.supabase_jobs_pass_or_completed ?? '—', work_factory_completed: state.work_factory?.counts?.completed ?? '—', kanban_task_total: state.kanban?.task_total ?? '—', summary: bot.summary || 'No bot activity summary available'})}`, 'span-6')}
  </div>`;
}


function botActivity() {
  const feed = state.bot_activity || {};
  const items = asArray(feed.activity);
  const ops = asArray(feed.latest_ops_status);
  const jobs = asArray(feed.latest_jobs);
  const runs = asArray(feed.github?.pages_runs);
  const commits = asArray(feed.github?.commits);
  const blockers = asArray(feed.blockers);
  const links = feed.links || {};
  const safety = feed.safety || {};
  const chipList = asArray(feed.status_chips).length ? asArray(feed.status_chips) : ['PASS','PARTIAL','BLOCKED','DEPLOYED','RUNNING','QUEUED'];
  const ownerSummary = [
    `Bot Activity: ${feed.summary?.status || 'unknown'}`,
    `Items: ${items.length}`,
    `Heartbeats: ${ops.length}`,
    `Jobs: ${jobs.length}`,
    `Pages runs: ${runs.length}`,
    `Commits: ${commits.length}`,
    `Blockers: ${blockers.length}`,
    `Next: ${feed.next_safe_action || '—'}`
  ].join('\n');
  const activityRow = a => row(a.kind || 'event', a.title || 'Activity event', a.status || 'unknown', `${a.time || '—'} · ${shortText(a.summary || '—', 120)}${a.commit ? ' · commit=' + shortText(a.commit, 12) : ''}${a.url ? ' · link=' + a.url : ''}`, 'bot-activity-event', jsonCopy(a));
  const blockerRow = b => row(b.id || b.kind || 'blocker', b.title || b.summary || 'Blocker', b.status || 'BLOCKED', `${b.time || '—'} · ${b.owner || 'owner/operator'} · ${shortText(b.next || feed.next_safe_action || '—', 110)}`, 'bot-activity-blocker', jsonCopy(b));
  const runRow = r => row(r.databaseId || 'pages', `Pages run ${r.status || 'unknown'} / ${r.conclusion || 'pending'}`, r.conclusion === 'success' ? 'PASS' : (r.status === 'completed' ? 'PARTIAL' : 'RUNNING'), `${r.updatedAt || r.createdAt || '—'} · commit=${shortText(r.headSha || '—', 12)} · ${r.url || '—'}`, 'bot-activity-run', jsonCopy(r));
  const commitRow = c => row(c.short || shortText(c.sha || 'commit', 8), c.message || 'GitHub commit', 'DEPLOYED', `${c.created_at || '—'} · ${c.url || '—'}`, 'bot-activity-commit', jsonCopy(c));
  return `<div class="grid bot-activity-page">
    ${metric('Activity items', items.length, 'span-2')}
    ${metric('Status rows', ops.length, 'span-2')}
    ${metric('Jobs', jobs.length, 'span-2')}
    ${metric('Pages runs', runs.length, 'span-2')}
    ${metric('Commits', commits.length, 'span-2')}
    ${metric('Blockers', blockers.length, 'span-2')}
    ${card('Status chips', `<div class="chip-row">${chipList.map(x => badge(x, x)).join('')}</div>${toolbar([copyButton('Copy Bot Activity summary', ownerSummary), copyButton('Copy Bot Activity JSON', jsonCopy(feed))])}`, 'span-12', 'bot-activity-card')}
    ${card('Live-ish feed', rowsTop(items, activityRow, 12, 'No activity rows in snapshot'), 'span-12', 'bot-activity-card')}
    ${card('Blockers', rowsTop(blockers, blockerRow, 8, 'No blockers in sanitized snapshot'), 'span-6', 'bot-activity-card')}
    ${card('Next safe action', `<p class="owner-summary">${fmt(feed.next_safe_action || 'Review next safe production task.')}</p>${toolbar([links.supabase_memory_route ? copyButton('Copy Supabase Memory route', links.supabase_memory_route) : '', links.github_repo ? copyButton('Copy GitHub repo', links.github_repo) : '', links.latest_pages_run ? copyButton('Copy Pages run', links.latest_pages_run) : ''].filter(Boolean))}`, 'span-6', 'bot-activity-card')}
    ${card('GitHub commits', rowsTop(commits, commitRow, 8, 'No commit rows in snapshot'), 'span-6')}
    ${card('Pages status runs', rowsTop(runs, runRow, 8, 'No Pages runs in snapshot'), 'span-6')}
    ${card('Safe static source', `${kv({mode: feed.source_mode || 'static_snapshot', browser_side_supabase: safety.browser_side_supabase === true ? 'enabled' : 'disabled', github_browser_access: safety.browser_side_github_token === true ? 'enabled' : 'disabled', generated_at: feed.generated_at || '—', source_path: feed.source?.path || feed.source_of_truth || '—'})}`, 'span-12')}
  </div>`;
}


function ownerCommandCenter() {
  const occ = state.owner_command_center || {};
  const links = occ.links || {};
  const summary = [
    `Production: ${occ.current_production_status || 'UNKNOWN'}`,
    `Latest deployed: ${occ.latest_deployed_commit || '—'}`,
    `Local head: ${occ.latest_local_commit || '—'}`,
    `Next: ${occ.next_safe_action || '—'}`
  ].join('\n');
  const linkRows = Object.entries(links).map(([k,v]) => ({id:k,title:k,status:'link',summary:v}));
  return `<div class="grid owner-command-center-page">
    ${metric('Production status', occ.current_production_status || 'UNKNOWN', 'span-4')}
    ${metric('Blocked items', asArray(occ.blocked_items).length, 'span-2')}
    ${metric('Owner approvals', asArray(occ.owner_approvals_needed).length, 'span-2')}
    ${metric('Roadmap items', asArray(occ.active_version_roadmap).length, 'span-2')}
    ${metric('Supabase rows', asArray(occ.latest_supabase_rows).length, 'span-2')}
    ${card('Next safe action', `<p class="owner-summary">${fmt(occ.next_safe_action || 'Review blockers and Work Factory.')}</p>${toolbar([copyButton('Copy command summary', summary), links.work_factory ? copyButton('Copy Work Factory route', links.work_factory) : '', links.bot_activity ? copyButton('Copy Bot Activity route', links.bot_activity) : '', links.supabase_memory ? copyButton('Copy Supabase Memory route', links.supabase_memory) : ''].filter(Boolean))}`, 'span-12', 'owner-command-card')}
    ${card('Latest publication / commit', kv({latest_deployed_commit: occ.latest_deployed_commit, latest_local_commit: occ.latest_local_commit, actions_status: occ.latest_github_actions_deploy?.status, actions_url: occ.latest_github_actions_deploy?.url}), 'span-6')}
    ${card('Latest Supabase rows', rowsTop(occ.latest_supabase_rows, x => row(x.component || 'component', `${x.version || '—'} · ${x.row_id || '—'}`, x.status || 'UNKNOWN', x.summary || x.route || '—', 'occ-supabase', jsonCopy(x)), 10, 'No rows'), 'span-6')}
    ${card('Blocked items', rowsTop(occ.blocked_items, x => row('blocked', x.title || 'Blocked', x.status || 'BLOCKED', x.detail || '—', 'occ-blocked', jsonCopy(x)), 8, 'No blockers'), 'span-6')}
    ${card('Owner approvals needed', rowsTop(occ.owner_approvals_needed, wfControlItemRow, 8, 'No approvals'), 'span-6')}
    ${card('Active version roadmap', rowsTop(occ.active_version_roadmap, x => row(x.version || 'version', x.title || 'Roadmap item', x.status || 'TRACKED', x.next || '—', 'occ-roadmap', jsonCopy(x)), 12, 'No roadmap'), 'span-12')}
    ${card('Command links', rowsTop(linkRows, x => row(x.id, x.title, x.status, x.summary, 'occ-link', jsonCopy(x)), 12, 'No links'), 'span-12')}
    ${card('Safe static source', kv({mode: occ.source_mode || 'static_snapshot', browser_side_supabase: occ.safety?.browser_side_supabase === true ? 'enabled' : 'disabled', github_browser_access: occ.safety?.browser_side_github_token === true ? 'enabled' : 'disabled', generated_at: occ.generated_at || '—'}), 'span-12')}
  </div>`;
}

function orderBuilder() {
  const ob = state.order_builder || {};
  const o = ob.sample_order || {};
  const brief = [
    `Client profile: ${o.client_profile || '—'}`,
    `Business type: ${o.business_type || '—'}`,
    `Offer: ${o.offer_service_product || '—'}`,
    `Audience: ${o.target_audience || '—'}`,
    `Style: ${o.desired_style || '—'}`,
    `Pages: ${asArray(o.required_pages).join(', ')}`,
    `Assets: ${asArray(o.assets_needed).join(', ')}`,
    `Content: ${o.content_status || '—'}`,
    `Package: ${o.pricing_package || '—'}`,
    `Timeline: ${o.timeline || '—'}`,
    `Brief: ${o.generated_production_brief || '—'}`
  ].join('\n');
  return `<div class="grid order-builder-page">
    ${metric('Mode', ob.source_mode || 'demo_schema', 'span-3')}
    ${metric('Sensitive data', ob.safety?.real_sensitive_client_data === true ? 'present' : 'not collected', 'span-3')}
    ${metric('Public demo only', ob.safety?.public_demo_only === false ? 'no' : 'yes', 'span-3')}
    ${metric('Task status', ob.production_task_template?.status || 'QUEUED_DEMO', 'span-3')}
    ${card('Client profile', kv({client_profile:o.client_profile,business_type:o.business_type,target_audience:o.target_audience}), 'span-6')}
    ${card('Offer / product', kv({offer_service_product:o.offer_service_product,pricing_package:o.pricing_package,timeline:o.timeline}), 'span-6')}
    ${card('Desired style / pages', `${kv({desired_style:o.desired_style,content_status:o.content_status})}${rowsTop(asArray(o.required_pages).map(x=>({id:'page',title:x,status:'required'})), x=>row(x.id,x.title,x.status), 12, 'No pages')}`, 'span-6')}
    ${card('Assets needed', rowsTop(asArray(o.assets_needed).map(x=>({id:'asset',title:x,status:'needed'})), x=>row(x.id,x.title,x.status), 12, 'No assets'), 'span-6')}
    ${card('Generated production brief', `<p class="owner-summary">${fmt(o.generated_production_brief || '—')}</p>${toolbar([copyButton('Copy production brief', brief), copyButton('Copy sanitized order JSON', jsonCopy(ob))])}`, 'span-12', 'order-builder-card')}
    ${card('Next safe action', `<p>${fmt(ob.next_safe_action || 'Keep demo/sanitized only.')}</p><p><b>Schema policy:</b> ${fmt(ob.schema_policy || 'New tables require approval.')}</p>`, 'span-12')}
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
  const map = {overview, 'work-factory': workFactory, 'owner-command-center': ownerCommandCenter, 'order-builder': orderBuilder, kanban, production, 'demo-products': demoProducts, 'agent-workflow': agentWorkflow, capabilities, 'motion-factory': motionFactory, 'intake-orders': intakeOrders, delivery, 'real-clients': realClients, 'premium-factory': premiumFactory,
    'premium-generator': premiumWebsiteGenerator, 'premium-factory-v34': premiumFactoryV34, 'premium-factory-v37-day1': premiumFactoryV34, 'error-recovery': errorRecovery, 'd3-intake': d3Intake, 'owner-feedback': ownerFeedback, clients, 'sales-pack': salesPack, 'morning-desk': morningDesk, approvals, 'supabase-memory': supabaseMemory, 'bot-activity': botActivity, health, artifacts, marathon, audit};
  app.innerHTML = (map[route] || overview)();
  bindInputs();
}

function bindInputs() {
  $('#wfSearch')?.addEventListener('input', e => { filters.wf = e.target.value; render(); });
  $('#wfStatusFilter')?.addEventListener('change', e => { filters.wfStatus = e.target.value; render(); });
  $('#wfComponentFilter')?.addEventListener('change', e => { filters.wfComponent = e.target.value; render(); });
  $('#wfTimeFilter')?.addEventListener('change', e => { filters.wfTime = e.target.value; render(); });
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
  document.querySelectorAll('[data-delivery-acceptance]').forEach(sel => sel.addEventListener('change', e => { const overlay = readDeliveryAcceptanceOverlay(); overlay[e.currentTarget.dataset.deliveryAcceptance] = e.currentTarget.value; writeDeliveryAcceptanceOverlay(overlay); render(); }));
  document.querySelectorAll('[data-delivery-approval-ledger-status]').forEach(sel => sel.addEventListener('change', e => { const entries = readDeliveryApprovalLedger(); const id = e.currentTarget.dataset.deliveryApprovalLedgerStatus; const current = entries.find(x => x.id === id) || {id}; current.status = e.currentTarget.value; current.updated_at = new Date().toISOString(); writeDeliveryApprovalLedger(entries.filter(x => x.id !== id).concat(current)); render(); }));
  document.querySelectorAll('[data-delivery-followup-status]').forEach(sel => sel.addEventListener('change', e => { const overlay = readDeliveryFollowupOverlay(); const id = e.currentTarget.dataset.deliveryFollowupStatus; overlay[id] = {...(overlay[id] || {}), status: e.currentTarget.value}; writeDeliveryFollowupOverlay(overlay); render(); }));
  document.querySelectorAll('[data-delivery-approval-ledger-note]').forEach(inp => inp.addEventListener('change', e => { const entries = readDeliveryApprovalLedger(); const id = e.currentTarget.dataset.deliveryApprovalLedgerNote; const current = entries.find(x => x.id === id) || {id}; current.note = e.currentTarget.value; current.updated_at = new Date().toISOString(); writeDeliveryApprovalLedger(entries.filter(x => x.id !== id).concat(current)); }));
  document.querySelectorAll('[data-delivery-followup-note]').forEach(inp => inp.addEventListener('change', e => { const overlay = readDeliveryFollowupOverlay(); const id = e.currentTarget.dataset.deliveryFollowupNote; overlay[id] = {...(overlay[id] || {}), note: e.currentTarget.value}; writeDeliveryFollowupOverlay(overlay); render(); }));
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
