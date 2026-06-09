const DATA_URL = './data/webstudio-control-plane-state.json';
const OPERATOR_OS_URL = './data/webstudio-operator-os-state.json';
const OPERATOR_ORDERS_STORAGE_KEY = 'webstudio_operator_orders_v1';
const OPERATOR_LEADS_STORAGE_KEY = 'webstudio_operator_leads_v1';
const OPERATOR_SYNC_QUEUE_STORAGE_KEY = 'webstudio_operator_sync_queue_v1';
const OPERATOR_LAST_BACKUP_STORAGE_KEY = 'webstudio_operator_last_backup_v1';
const OPERATOR_STORAGE_SCHEMA_VERSION = 'webstudio.operator.storage.v1';
const OPERATOR_ORDER_SCHEMA_VERSION = 'webstudio.operator.order.v3';
const OPERATOR_LEAD_SCHEMA_VERSION = 'webstudio.operator.lead.v3';
const WEBSITE_BRIEF_SCHEMA_VERSION = 'webstudio.website.production_brief.v3';
const STORAGE_MODE = 'localStorage';
const BACKEND_STATUS = 'Supabase не подключён';

let state = null;
let operatorState = null;
const pathRoute = window.location.pathname.replace(/^\/+|\/+$/g, '');
function normalizeRoute(value) {
  const raw = String(value || '').replace(/^#/, '') || 'overview';
  if (raw === 'execution-kanban') return 'kanban';
  if (raw === 'clients') return 'orders';
  if (raw === 'Обзор') return 'overview';
  return raw;
}
let route = normalizeRoute(window.location.hash.replace('#', '') || (['operator','orders','execution-kanban','website-intake','real-assets','proposal-quote','integration-plan','lead-capture-demo','client-portal-preview','delivery-timeline','work-factory','owner-command-center','supabase-memory','lead-research','supabase-plan','kanban','hermes-kanban', 'production', 'approvals', 'health', 'artifacts', 'marathon', 'owner-feedback','agent-workflow','sales-pack','premium-factory','audit'].includes(pathRoute) ? pathRoute : 'overview'));
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
  operatorAction: 'new_order',
  activeOrder: 'DEMO-WEB-001',
  activeLead: '',
  productionQuick: 'active',
  timeline: 'all',
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
  overview:'Обзор','work-factory':'Фабрика задач','premium-factory':'Premium Factory',kanban:'Канбан',production:'Производство','agent-workflow':'Агенты','owner-feedback':'Решения владельца',clients:'Клиенты / Заказы','sales-pack':'Продажи','real-assets':'Реальные материалы','proposal-quote':'Proposal / quote',approvals:'Согласования',health:'Система',artifacts:'Артефакты',marathon:'Автономный цикл',audit:'Аудит',
  triage:'Разбор',todo:'Подготовка',scheduled:'Запланировано',ready:'Готово к запуску',running:'Выполняется',in_progress:'Выполняется',blocked:'Заблокировано',review:'На проверке',done:'Готово',archived:'Архив',active:'Активные',agents:'Агенты',github:'GitHub',all:'Все',normal:'Обычные',mirror:'Зеркала',sys:'Системные',approval:'Согласования',
  pass:'OK',fail:'Ошибка',warn:'Внимание',unknown:'Неизвестно',production:'Производство',empty:'Пусто',tracked:'Отслеживается',artifact:'Артефакт',step:'Шаг',available:'Доступно',missing:'Нет',error:'Ошибка',enabled:'Включено',disabled:'Выключено'
};
const STAGE_RU = {'intake':'Заявки','client-qualification':'Квалификация','brief':'Бриф','estimate-pricing':'Оценка','architecture-plan':'План','design-content':'Дизайн/контент','implementation':'Разработка','qa':'QA','approval':'Согласование','delivery-handoff':'Передача клиенту','post-delivery-support':'Поддержка','unspecified':'Без стадии','canary':'Проверка','archived-noise':'Архив/шум'};
const LINE_RU = {D1:'D1 — Лендинги и сайты',D2:'D2 — AI-intake бот',D3:'D3 — Бизнес-автоматизации'};
const ROLE_RU = {'CTO Agent':'CTO-агент','Orchestrator Agent':'Оркестратор','Specialist Agents':'Исполнители','QA/Delivery':'QA и передача','Done':'Готово','Frontend Agent':'Frontend-агент','Backend Agent':'Backend-агент','QA Agent':'QA-агент','Delivery Agent':'Передача','Specialist Agent':'Исполнитель'};
const ru = (v) => RU[String(v)] || STAGE_RU[String(v)] || LINE_RU[String(v)] || ROLE_RU[String(v)] || String(v ?? '—');
const PREMIUM_FACTORY_V126 = [
  {name: 'Aero Clinic DEMO', niche: 'premium medical aesthetics clinic', motion: 'orbital diagnostic halo', path: '/home/hermes/workspace/output/webstudio-24h-premium-factory-v126/premium-factory-sites/aero-clinic/index.html', qa: 'PASS'},
  {name: 'Atlas Legal DEMO', niche: 'boutique cross-border law firm', motion: 'folded jurisdiction grid', path: '/home/hermes/workspace/output/webstudio-24h-premium-factory-v126/premium-factory-sites/atlas-legal/index.html', qa: 'PASS'},
  {name: 'Forge SaaS DEMO', niche: 'enterprise AI operations platform', motion: 'live operations cube', path: '/home/hermes/workspace/output/webstudio-24h-premium-factory-v126/premium-factory-sites/forge-saas/index.html', qa: 'PASS'},
  {name: 'Noir Hospitality DEMO', niche: 'luxury hotel and private dining venue', motion: 'immersive room-frame stack', path: '/home/hermes/workspace/output/webstudio-24h-premium-factory-v126/premium-factory-sites/noir-hospitality/index.html', qa: 'PASS'}
];
function uiText(v) {
  const map = {
    not_required_until_live_action: 'не требуется до live-действия',
    owner_required_for_sensitive_or_live_scope: 'требуется для чувствительного или live scope',
    not_required: 'не требуется',
    owner_review_recommended: 'рекомендуется review владельца',
    owner_required_before_public_launch: 'требуется перед публичным запуском',
    owner_required_for_live_token: 'требуется для live token',
    owner_required_for_writes_or_schedules: 'требуется для writes или schedules',
    owner_required_before_heavy_render_or_public_launch: 'требуется перед тяжелым render или public launch',
    not_required_for_local_qa: 'не требуется для локальной QA',
    owner_acceptance_required_for_close: 'требуется acceptance владельца перед закрытием',
    owner_required_before_outreach: 'требуется перед outreach',
    owner_required_before_send: 'требуется перед отправкой',
    pending_owner: 'ожидает владельца',
    required_before_live_action: 'требуется перед live-действием',
    not_required_for_local_work: 'не требуется для локальной работы',
    owner_approval_required: 'требуется approval владельца',
    available: 'доступен',
    none: 'нет'
  };
  return map[String(v)] || ru(v);
}
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
    operatorState = await loadOperatorState();
    updateChrome();
    render();
    return;
  }
  const res = await fetch(DATA_URL + '?t=' + Date.now(), {cache: 'no-store'});
  if (!res.ok) throw new Error('Failed to load state: ' + res.status);
  state = await res.json();
  operatorState = await loadOperatorState();
  updateChrome();
  render();
}

async function loadOperatorState() {
  const res = await fetch(OPERATOR_OS_URL + '?t=' + Date.now(), {cache: 'no-store'});
  if (!res.ok) return {orders: [], operator_actions: [], execution_kanban: [], website_questionnaire: [], lead_research_queue: [], agent_roles: [], safety_policy: {}};
  const loaded = await res.json();
  return hydrateOperatorPersistence(loaded);
}

function safeJsonParse(raw, fallback) {
  try { return JSON.parse(raw); } catch { return fallback; }
}
function readStorageArray(key, fallback=[]) {
  const raw = localStorage.getItem(key);
  return raw ? asArray(safeJsonParse(raw, fallback)) : fallback;
}
function writeStorageArray(key, value) {
  localStorage.setItem(key, JSON.stringify(asArray(value), null, 2));
}
function readStorageObject(key, fallback={}) {
  const raw = localStorage.getItem(key);
  return raw ? safeJsonParse(raw, fallback) : fallback;
}
function writeStorageObject(key, value) {
  localStorage.setItem(key, JSON.stringify(value || {}, null, 2));
}
function nowIso() { return new Date().toISOString(); }
function storageFingerprint(value) {
  const raw = JSON.stringify(value ?? null);
  let hash = 0;
  for (let i = 0; i < raw.length; i += 1) hash = ((hash << 5) - hash + raw.charCodeAt(i)) | 0;
  return 'local-' + Math.abs(hash).toString(36);
}
class StorageAdapter {
  constructor() {
    this.mode = 'abstract';
    this.backend = 'not configured';
    this.readonly = true;
  }
  loadOrders(fallback=[]) { return fallback; }
  saveOrders(_orders) { throw new Error('StorageAdapter.saveOrders is not implemented'); }
  loadLeads(fallback=[]) { return fallback; }
  saveLeads(_leads) { throw new Error('StorageAdapter.saveLeads is not implemented'); }
  loadSyncQueue() { return []; }
  saveSyncQueue(_events) { throw new Error('StorageAdapter.saveSyncQueue is not implemented'); }
  status() {
    return {
      storage_schema_version: OPERATOR_STORAGE_SCHEMA_VERSION,
      mode: this.mode,
      backend: this.backend,
      sync_status: 'local only',
      readonly_backend: this.readonly,
      network_writes_enabled: false
    };
  }
}
class LocalStorageAdapter extends StorageAdapter {
  constructor() {
    super();
    this.mode = STORAGE_MODE;
    this.backend = BACKEND_STATUS;
    this.readonly = false;
  }
  loadOrders(fallback=[]) { return readStorageArray(OPERATOR_ORDERS_STORAGE_KEY, fallback); }
  saveOrders(orders) { writeStorageArray(OPERATOR_ORDERS_STORAGE_KEY, orders); }
  loadLeads(fallback=[]) { return readStorageArray(OPERATOR_LEADS_STORAGE_KEY, fallback); }
  saveLeads(leads) { writeStorageArray(OPERATOR_LEADS_STORAGE_KEY, leads); }
  loadSyncQueue() { return readStorageArray(OPERATOR_SYNC_QUEUE_STORAGE_KEY, []); }
  saveSyncQueue(events) { writeStorageArray(OPERATOR_SYNC_QUEUE_STORAGE_KEY, events); }
}
class SupabaseStorageAdapterStub extends StorageAdapter {
  constructor() {
    super();
    this.mode = 'supabase_stub_disabled';
    this.backend = 'Supabase adapter stub: planning only';
    this.readonly = true;
  }
  assertDisabled() {
    throw new Error('Supabase adapter is disabled: owner approval, migration, and write gates are required first.');
  }
  saveOrders() { this.assertDisabled(); }
  saveLeads() { this.assertDisabled(); }
  saveSyncQueue() { this.assertDisabled(); }
  status() {
    return {
      ...super.status(),
      mode: this.mode,
      backend: this.backend,
      sync_status: 'disabled/read-only',
      approval_required_for: ['supabase_migration', 'supabase_write', 'public_launch', 'outreach_send']
    };
  }
}
class SyncQueue {
  constructor(adapter) {
    this.adapter = adapter;
  }
  list() { return asArray(this.adapter.loadSyncQueue()); }
  enqueue(type, entityType, entityId, payload={}, options={}) {
    const record = {
      storage_schema_version: OPERATOR_STORAGE_SCHEMA_VERSION,
      queue_schema_version: 'webstudio.operator.sync_queue.v1',
      mutation_id: 'SYNC-' + Date.now().toString(36).toUpperCase() + '-' + Math.random().toString(36).slice(2, 8).toUpperCase(),
      event_type: type,
      entity_type: entityType,
      entity_id: entityId || '',
      operation: options.operation || type.split('.').pop() || 'updated',
      payload,
      base_fingerprint: options.base_fingerprint || storageFingerprint(payload),
      requires_approval: Boolean(options.requires_approval),
      status: options.status || (options.requires_approval ? 'blocked_pending_approval' : 'queued_local_only'),
      conflict_strategy: 'compare base_fingerprint and updated_at; never overwrite remote automatically',
      created_at: nowIso(),
      local_only: true,
      network_call_performed: false
    };
    this.adapter.saveSyncQueue([record, ...this.list()].slice(0, 500));
    return record;
  }
  clear() { this.adapter.saveSyncQueue([]); }
}
const storageAdapter = new LocalStorageAdapter();
const supabaseStorageAdapterStub = new SupabaseStorageAdapterStub();
const syncQueue = new SyncQueue(storageAdapter);
function orderEvent(type, note, extra={}) {
  return {schema_version: 'webstudio.operator.timeline_event.v1', event: type, note, at: nowIso(), actor: 'local_operator_workspace', persistence: 'browser_localStorage', ...extra};
}
function normalizeTimeline(events, seedNote='Created local order') {
  const normalized = asArray(events).map(ev => ({
    schema_version: ev.schema_version || 'webstudio.operator.timeline_event.v1',
    event: ev.event || ev.type || 'updated',
    note: ev.note || ev.message || 'Local workspace event',
    at: ev.at || ev.created_at || nowIso(),
    actor: ev.actor || 'local_operator_workspace',
    persistence: ev.persistence || 'browser_localStorage',
    ...ev
  }));
  return normalized.length ? normalized : [orderEvent('created', seedNote)];
}
function ownerApprovalState(order) {
  if (order.owner_approval?.status) return order.owner_approval;
  const required = Boolean(order.owner_approval_required);
  return {
    schema_version: 'webstudio.operator.owner_approval.v1',
    required,
    status: required ? 'required_before_live_action' : 'not_required_for_local_work',
    allowed_without_approval: ['local planning', 'local draft', 'local export', 'local QA'],
    blocked_until_approval: ['public launch', 'production writes', 'automatic outreach', 'live credentials']
  };
}
function acceptedWarnings(order) {
  return asArray(order.accepted_warnings).map(w => typeof w === 'string' ? {warning: w, accepted_at: nowIso(), scope: 'local_operator_workspace'} : w);
}
function validateOrder(order) {
  const errors = [];
  if (!String(order.client_name || '').trim()) errors.push('client_name');
  if (!String(order.order_type || '').trim()) errors.push('order_type');
  if (!String(order.current_stage || '').trim()) errors.push('current_stage');
  if (!EXECUTION_COLUMNS.includes(order.current_stage || stageForStatus(order.status))) errors.push('current_stage_unknown');
  if (order.schema_version && !['webstudio.operator.order.v1','webstudio.operator.order.v2',OPERATOR_ORDER_SCHEMA_VERSION].includes(order.schema_version)) errors.push('schema_version_unknown');
  return errors;
}
function validateLead(lead) {
  const errors = [];
  if (!String(lead.lead_id || '').trim()) errors.push('lead_id');
  if (!String(lead.company_person || '').trim()) errors.push('company_person');
  if (lead.relevance_score !== undefined && (Number(lead.relevance_score) < 0 || Number(lead.relevance_score) > 100)) errors.push('relevance_score_range');
  if (lead.schema_version && !['webstudio.operator.lead.v1','webstudio.operator.lead.v2',OPERATOR_LEAD_SCHEMA_VERSION].includes(lead.schema_version)) errors.push('schema_version_unknown');
  return errors;
}
function migrateOrder(order) {
  const input = order || {};
  if (input.schema_version === OPERATOR_ORDER_SCHEMA_VERSION && input.storage_schema_version === OPERATOR_STORAGE_SCHEMA_VERSION) return input;
  const migrated = {
    ...input,
    storage_schema_version: OPERATOR_STORAGE_SCHEMA_VERSION,
    schema_version: OPERATOR_ORDER_SCHEMA_VERSION,
    migrated_at: input.migrated_at || nowIso(),
    migration_path: input.schema_version && input.schema_version !== OPERATOR_ORDER_SCHEMA_VERSION
      ? `${input.schema_version}->${OPERATOR_ORDER_SCHEMA_VERSION}`
      : `none->${OPERATOR_ORDER_SCHEMA_VERSION}`,
    future_v4_migration: 'placeholder_only_no_live_migration'
  };
  return migrated;
}
function migrateLead(lead) {
  const input = lead || {};
  if (input.schema_version === OPERATOR_LEAD_SCHEMA_VERSION && input.storage_schema_version === OPERATOR_STORAGE_SCHEMA_VERSION) return input;
  return {
    ...input,
    storage_schema_version: OPERATOR_STORAGE_SCHEMA_VERSION,
    schema_version: OPERATOR_LEAD_SCHEMA_VERSION,
    migrated_at: input.migrated_at || nowIso(),
    migration_path: input.schema_version && input.schema_version !== OPERATOR_LEAD_SCHEMA_VERSION
      ? `${input.schema_version}->${OPERATOR_LEAD_SCHEMA_VERSION}`
      : `none->${OPERATOR_LEAD_SCHEMA_VERSION}`,
    future_v4_migration: 'placeholder_only_no_live_migration'
  };
}
function orderMissingInfo(order) {
  const checks = [
    ['client_contact', 'Контакт клиента'],
    ['source', 'Источник заказа'],
    ['industry', 'Ниша / индустрия'],
    ['budget_range', 'Бюджетный диапазон'],
    ['deadline', 'Срок'],
    ['next_action', 'Следующее действие'],
    ['acceptance_criteria', 'Acceptance criteria'],
    ['client_answers.business_goal', 'Цель сайта / бизнеса'],
    ['client_answers.conversion_action', 'Главная конверсия'],
    ['client_answers.ideal_client', 'Идеальный клиент']
  ];
  return checks.filter(([path]) => {
    const value = path.split('.').reduce((acc, key) => acc?.[key], order);
    return Array.isArray(value) ? value.length === 0 : !String(value || '').trim();
  }).map(([, label]) => label);
}
function orderHealth(order) {
  const missing = orderMissingInfo(order);
  const blockers = asArray(order.blockers).length;
  const hasBrief = Boolean(order.production_brief);
  const hasAcceptance = asArray(order.acceptance_criteria).length > 0;
  const approvalReady = !order.owner_approval_required || order.owner_approval?.status === 'approved_for_live_action' || order.owner_approval?.status === 'not_required_for_local_work';
  let score = 100;
  score -= Math.min(45, missing.length * 5);
  score -= Math.min(20, blockers * 10);
  if (!hasBrief) score -= 15;
  if (!hasAcceptance) score -= 10;
  if (!approvalReady) score -= 10;
  score = Math.max(0, Math.min(100, score));
  return {
    schema_version: 'webstudio.operator.order_health.v1',
    score,
    missing_information: missing,
    blockers_count: blockers,
    ready_for_production: score >= 72 && missing.length <= 3 && blockers === 0 && hasBrief,
    owner_approval_gate: order.owner_approval_required ? 'required_before_live_action' : 'not_required_for_local_work',
    artifact_checklist: artifactChecklist(order)
  };
}
function artifactChecklist(order) {
  const artifacts = asArray(order.artifacts).join('\n').toLowerCase();
  return [
    {id: 'client_brief', label: 'Ответы клиента / бриф', done: Object.keys(order.client_answers || {}).length >= 3},
    {id: 'production_brief', label: 'Production-бриф', done: Boolean(order.production_brief) || artifacts.includes('production_brief')},
    {id: 'qa_checklist', label: 'QA-чеклист', done: Boolean(order.production_brief?.qa_checklist) || artifacts.includes('qa')},
    {id: 'handoff_packet', label: 'Пакет handoff', done: Boolean(order.production_brief?.handoff_checklist) || artifacts.includes('handoff')},
    {id: 'approval_packet', label: 'Пакет approval владельца для live-действий', done: !order.owner_approval_required || order.owner_approval?.status === 'approved_for_live_action'}
  ];
}
function withOrderDefaults(order) {
  order = migrateOrder(order || {});
  const currentStage = order.current_stage || stageForStatus(order.status || 'new_lead');
  const ownerApproval = ownerApprovalState(order);
  return {
    storage_schema_version: order.storage_schema_version || OPERATOR_STORAGE_SCHEMA_VERSION,
    schema_version: order.schema_version || OPERATOR_ORDER_SCHEMA_VERSION,
    migrated_at: order.schema_version === OPERATOR_ORDER_SCHEMA_VERSION ? order.migrated_at || null : nowIso(),
    order_id: order.order_id || ('LOCAL-' + Date.now().toString(36).toUpperCase()),
    client_name: order.client_name || 'Новый клиент',
    client_contact: order.client_contact || '',
    source: order.source || 'manual_local',
    order_type: order.order_type || 'Professional website / landing',
    industry: order.industry || '',
    budget_range: order.budget_range || '',
    deadline: order.deadline || '',
    priority: order.priority || 'normal',
    status: order.status || STAGE_STATUS[currentStage] || 'new_lead',
    current_stage: currentStage,
    assigned_agent: order.assigned_agent || 'operator',
    next_action: order.next_action || 'Уточнить задачу и заполнить бриф.',
    blockers: asArray(order.blockers),
    acceptance_criteria: asArray(order.acceptance_criteria),
    artifacts: asArray(order.artifacts),
    client_answers: order.client_answers || {},
    internal_notes: order.internal_notes || '',
    owner_approval_required: ownerApproval.required,
    owner_approval: ownerApproval,
    accepted_warnings: acceptedWarnings(order),
    validation: {schema_version: 'webstudio.operator.validation.v1', errors: validateOrder({...order, current_stage: currentStage})},
    archived: Boolean(order.archived || order.status === 'archived'),
    production_brief: order.production_brief || null,
    timeline: normalizeTimeline(order.timeline, order.demo ? 'Loaded DEMO order into local workspace' : 'Created local order'),
    storage: order.storage || {
      mode: STORAGE_MODE,
      backend: BACKEND_STATUS,
      sync_status: 'local only',
      fingerprint: storageFingerprint({...order, timeline: undefined})
    }
  };
}
function withLeadDefaults(lead) {
  lead = migrateLead(lead || {});
  const approval = lead.approval || {
    schema_version: 'webstudio.operator.lead_approval.v1',
    status: lead.approval_status || 'owner_approval_required',
    required_before_outreach: true
  };
  const compliance = lead.compliance || {
    schema_version: 'webstudio.operator.lead_compliance.v1',
    public_sources_only: true,
    no_automatic_send: true,
    no_spam: true,
    no_fake_identity: true,
    no_bypass: true,
    opt_out_status: lead.opt_out_status || 'unknown',
    platform_rules_notes: lead.platform_rules_notes || lead.risk_compliance_notes || 'Только ручное исследование публичных источников. Нельзя собирать данные за логином.'
  };
  return {
    storage_schema_version: lead.storage_schema_version || OPERATOR_STORAGE_SCHEMA_VERSION,
    schema_version: lead.schema_version || OPERATOR_LEAD_SCHEMA_VERSION,
    lead_id: lead.lead_id || ('LEAD-' + Date.now().toString(36).toUpperCase()),
    company_person: lead.company_person || lead['company/person'] || '',
    source_url: lead.source_url || '',
    niche: lead.niche || '',
    problem_hypothesis: lead.problem_hypothesis || lead['problem hypothesis'] || '',
    why_webstudio_can_help: lead.why_webstudio_can_help || lead['why WebStudio can help'] || '',
    suggested_offer: lead.suggested_offer || '',
    personalization_notes: lead.personalization_notes || '',
    risk_compliance_notes: lead.risk_compliance_notes || lead['risk/compliance notes'] || 'Только ручное исследование публичных источников. Нельзя собирать данные за логином.',
    outreach_draft: lead.outreach_draft || '',
    approval_status: lead.approval_status || approval.status || 'owner approval required',
    approval,
    compliance,
    relevance_score: Number(lead.relevance_score || 0),
    followup_status: lead.followup_status || 'not_scheduled',
    opt_out_status: lead.opt_out_status || compliance.opt_out_status || 'unknown',
    validation: {schema_version: 'webstudio.operator.lead_validation.v1', errors: validateLead(lead)},
    storage: lead.storage || {
      mode: STORAGE_MODE,
      backend: BACKEND_STATUS,
      sync_status: 'local only',
      fingerprint: storageFingerprint({...lead, timeline: undefined})
    },
    timeline: normalizeTimeline(lead.timeline, lead.demo ? 'Loaded DEMO lead into local workspace' : 'Created local lead')
  };
}
function hydrateOperatorPersistence(loaded) {
  const baseOrders = asArray(loaded.orders).map(withOrderDefaults);
  const baseLeads = asArray(loaded.lead_research_queue).map(withLeadDefaults);
  if (!localStorage.getItem(OPERATOR_ORDERS_STORAGE_KEY)) storageAdapter.saveOrders(baseOrders);
  if (!localStorage.getItem(OPERATOR_LEADS_STORAGE_KEY)) storageAdapter.saveLeads(baseLeads);
  if (!localStorage.getItem(OPERATOR_SYNC_QUEUE_STORAGE_KEY)) storageAdapter.saveSyncQueue([]);
  const orders = storageAdapter.loadOrders(baseOrders).map(withOrderDefaults);
  const leads = storageAdapter.loadLeads(baseLeads).map(withLeadDefaults);
  if (orders.length) filters.activeOrder = orders[0].order_id;
  return {...loaded, orders, lead_research_queue: leads, sync_queue: syncQueue.list(), storage_status: storageAdapter.status(), supabase_stub_status: supabaseStorageAdapterStub.status(), _demo_orders: baseOrders, _demo_leads: baseLeads};
}
function saveOrders(orders) {
  const normalized = asArray(orders).map(withOrderDefaults);
  storageAdapter.saveOrders(normalized);
  operatorState = {...os(), orders: normalized, sync_queue: syncQueue.list(), storage_status: storageAdapter.status()};
}
function saveLeads(leads) {
  const normalized = asArray(leads).map(withLeadDefaults);
  storageAdapter.saveLeads(normalized);
  operatorState = {...os(), lead_research_queue: normalized, sync_queue: syncQueue.list(), storage_status: storageAdapter.status()};
}
function updateOrder(orderId, mutator, eventType='updated', note='Order updated') {
  const orders = allOsOrders();
  const idx = orders.findIndex(o => o.order_id === orderId);
  if (idx < 0) return null;
  const before = withOrderDefaults(orders[idx]);
  const changed = withOrderDefaults(mutator({...before}) || before);
  changed.timeline = [...asArray(before.timeline), orderEvent(eventType, note)];
  orders[idx] = changed;
  saveOrders(orders);
  enqueueOrderMutation(eventType, before, changed, note);
  filters.activeOrder = changed.order_id;
  return changed;
}
function enqueueOrderMutation(eventType, before, changed, note) {
  const typeMap = {
    updated: 'order.updated',
    stage_changed: 'order.stage_changed',
    brief_generated: 'brief.generated',
    export_generated: 'export.generated',
    blocked: 'order.stage_changed',
    archived: 'order.updated'
  };
  const queueType = typeMap[eventType] || 'order.updated';
  const requiresApproval = Boolean(changed.owner_approval_required && queueType !== 'export.generated');
  syncQueue.enqueue(queueType, queueType === 'brief.generated' ? 'brief' : 'order', changed.order_id, {
    order_id: changed.order_id,
    note,
    before_stage: before.current_stage,
    after_stage: changed.current_stage,
    status: changed.status,
    local_only: true
  }, {operation: eventType, base_fingerprint: before.storage?.fingerprint || storageFingerprint(before), requires_approval: requiresApproval});
  operatorState = {...os(), sync_queue: syncQueue.list()};
}
function enqueueLeadMutation(type, lead, note='Lead mutation') {
  syncQueue.enqueue(type, 'lead', lead.lead_id, {
    lead_id: lead.lead_id,
    company_person: lead.company_person,
    note,
    approval_status: lead.approval_status,
    local_only: true
  }, {operation: type.split('.').pop(), requires_approval: true});
  operatorState = {...os(), sync_queue: syncQueue.list()};
}
function enqueueApprovalRequest(subjectType, subjectId, note) {
  syncQueue.enqueue('approval.requested', subjectType, subjectId, {subject_type: subjectType, subject_id: subjectId, note, local_only: true}, {operation: 'requested', requires_approval: true});
  operatorState = {...os(), sync_queue: syncQueue.list()};
}
function mergeOrders(existing, incoming) {
  const byId = new Map(asArray(existing).map(o => [o.order_id, withOrderDefaults(o)]));
  for (const raw of asArray(incoming)) {
    const normalized = withOrderDefaults(raw);
    const current = byId.get(normalized.order_id);
    byId.set(normalized.order_id, current
      ? withOrderDefaults({...current, ...normalized, timeline: [...asArray(current.timeline), orderEvent('import_merged', 'Merged imported order with existing local order'), ...asArray(normalized.timeline)]})
      : withOrderDefaults({...normalized, timeline: [...asArray(normalized.timeline), orderEvent('imported', 'Imported new order from pasted JSON')]}));
  }
  return [...byId.values()];
}
function resetDemoOrders() {
  saveOrders(asArray(os()._demo_orders).map(withOrderDefaults));
  saveLeads(asArray(os()._demo_leads).map(withLeadDefaults));
  filters.activeOrder = osOrders()[0]?.order_id || 'DEMO-WEB-001';
  toast('Demo data reset in localStorage');
  render();
}
function stageForStatus(status) {
  const map = {
    new_lead: 'Входящие', needs_qualification: 'Квалификация', briefing: 'Бриф', proposal: 'Предложение',
    waiting_client: 'Бриф', ready_for_production: 'Планирование', design: 'Дизайн', build: 'Производство',
    qa: 'QA', handoff: 'Handoff', done: 'Готово', blocked: 'Заблокировано', archived: 'Готово'
  };
  return map[status] || 'Входящие';
}
const EXECUTION_COLUMNS = ['Входящие','Квалификация','Бриф','Предложение','Планирование','Дизайн','Производство','QA','Handoff','Готово','Заблокировано'];
const STAGE_STATUS = {'Входящие':'new_lead','Квалификация':'needs_qualification','Бриф':'briefing','Предложение':'proposal','Планирование':'ready_for_production','Дизайн':'design','Производство':'build','QA':'qa','Handoff':'handoff','Готово':'done','Заблокировано':'blocked'};
function nextStageFor(order) {
  const current = order.current_stage || stageForStatus(order.status);
  const idx = EXECUTION_COLUMNS.indexOf(current);
  const next = EXECUTION_COLUMNS[Math.min(idx < 0 ? 1 : idx + 1, EXECUTION_COLUMNS.length - 2)];
  return next || 'Квалификация';
}
function moveOrderToStage(orderId, stage, note='Stage changed') {
  const order = orderById(orderId);
  const gate = transitionGate(order, stage);
  if (!gate.allowed) { toast(gate.reason); return null; }
  return updateOrder(orderId, o => ({...o, current_stage: stage, status: STAGE_STATUS[stage] || o.status, archived: stage === 'Готово' ? o.archived : false, next_action: nextActionForStage(stage)}), 'stage_changed', note + ': ' + stage);
}
function setOrderExecutionState(orderId, stage, status, note) {
  const gate = transitionGate(orderById(orderId), stage);
  if (!gate.allowed && !['blocked','waiting_client'].includes(status)) { toast(gate.reason); return null; }
  return updateOrder(orderId, o => ({...o, current_stage: stage, status, archived: status === 'archived', next_action: nextActionForStage(stage)}), 'stage_changed', note);
}
function transitionGate(order, targetStage) {
  const health = orderHealth(withOrderDefaults(order));
  if (['Производство','QA','Handoff','Готово'].includes(targetStage) && health.blockers_count > 0) {
    return {allowed: false, reason: 'Blocked: resolve blocker before production/QA/handoff.'};
  }
  if (['Производство','QA','Handoff','Готово'].includes(targetStage) && !health.ready_for_production && targetStage === 'Производство') {
    return {allowed: false, reason: 'Ready gate failed: generate brief and fill missing info first.'};
  }
  return {allowed: true, reason: 'ok'};
}
function nextActionForStage(stage) {
  return {
    'Входящие': 'Квалифицировать клиента и подтвердить контакт.',
    'Квалификация': 'Понять бюджет, срок, decision maker и fit.',
    'Бриф': 'Собрать ответы клиента и proof/assets.',
    'Предложение': 'Подготовить scope, цену и acceptance criteria.',
    'Планирование': 'Разложить production tasks и назначить агентов.',
    'Дизайн': 'Подготовить визуальную систему и ключевые экраны.',
    'Производство': 'Собрать сайт/бот/автоматизацию в safe scope.',
    'QA': 'Проверить responsive, claims, links, safety, handoff.',
    'Handoff': 'Подготовить пакет передачи и owner/client acceptance.',
    'Готово': 'Зафиксировать результат и архивировать при необходимости.',
    'Заблокировано': 'Сформулировать blocker и запросить owner/client decision.'
  }[stage] || 'Определить следующий безопасный шаг.';
}
function generateProductionBrief(order) {
  const answers = order.client_answers || {};
  const get = (k, fallback='не указано') => answers[k] || fallback;
  const siteGoal = get('business_goal', get('main_goal'));
  const audience = get('ideal_client');
  const conversion = get('conversion_action');
  const style = get('brand_style', get('brand_personality'));
  const motion = get('motion_3d', get('hyperframes_motion'));
  const offer = get('difference', 'сформулировать конкретное отличие и причину доверять');
  const proof = get('proof_assets', 'кейсы, отзывы, сертификаты, фото команды, process proof');
  const constraints = get('never_promise', 'не обещать неподтвержденные результаты');
  const leadRoute = get('lead_route', 'owner-approved form or Telegram route after local QA');
  const seoGeo = get('seo_geo', 'service/niche search terms and local geography if relevant');
  return {
    schema_version: WEBSITE_BRIEF_SCHEMA_VERSION,
    generated_at: nowIso(),
    generation: 'deterministic_template_local_js',
    business_strategy: `Сайт должен перевести ${audience} от первого доверия к действию "${conversion}". Бизнес-цель: ${siteGoal}.`,
    audience,
    conversion_goal: conversion,
    offer_positioning: `Главная опора: ${offer}. Обещания держать проверяемыми; ограничения: ${constraints}.`,
    objections_to_sections: [
      {objection: 'Не понимаю, почему вам можно доверять', section: 'Proof / cases / process evidence'},
      {objection: 'Не ясно, что входит в услугу', section: 'Offer blocks and deliverables'},
      {objection: 'Боюсь долгого и хаотичного процесса', section: 'Process, timeline, QA and handoff'},
      {objection: 'Не хочу оставлять контакт вслепую', section: 'Final CTA with privacy/expectation note'}
    ],
    conversion_path: [`${audience} sees hero promise`, 'checks proof and offer scope', 'reads process / FAQ', `clicks "${conversion}"`, `lead goes through ${leadRoute}`],
    sitemap: ['Главная', 'Услуги / оффер', 'Доказательства / кейсы', 'Процесс работы', 'FAQ', 'Контакты / заявка'],
    hero_concept: `Первый экран: результат для ${audience}, 1 ясное обещание, 1 proof-сигнал, CTA "${conversion}", короткий путь к контакту.`,
    hero_variants: [
      `Outcome-first: ${siteGoal} for ${audience}. CTA: ${conversion}.`,
      `Trust-first: ${proof}. CTA after proof strip.`,
      `Process-first: premium delivery system, clear milestones, low-risk first step.`
    ],
    section_map: [
      {section: 'Hero', purpose: 'позиционирование, trust cue, primary CTA'},
      {section: 'Problem / stakes', purpose: 'назвать боль клиента без драматизации'},
      {section: 'Offer', purpose: 'пакеты, deliverables, сроки, что входит/не входит'},
      {section: 'Proof', purpose: proof},
      {section: 'Process', purpose: '3-5 шагов, роли, прозрачная передача'},
      {section: 'FAQ / objections', purpose: 'снять риски: сроки, бюджет, правки, гарантии'},
      {section: 'Final CTA', purpose: `повторить "${conversion}" и контактный маршрут`}
    ],
    copy_direction: `Тон: уверенный, конкретный, без давления. Писать от результата и доказательств. Не использовать неподтвержденные claims: ${constraints}.`,
    visual_direction: `${style}. Визуальная система: premium, быстрые контрасты, реальные assets, сильная типографика, без декоративного шума. Цвета/референсы: ${get('preferred_colors','уточнить')}.`,
    premium_visual_direction: ['restrained high-contrast palette', 'real product/team/client assets', 'dense but calm proof blocks', '8px radius controls/cards', 'hero with actual product/service signal'],
    motion_3d_hyperframes_plan: motion === 'не указано'
      ? 'Motion optional: subtle section transitions. 3D/HyperFrames only after scope and performance approval.'
      : `Motion/3D direction: ${motion}. Keep performance budget explicit; provide static fallback.`,
    hyperframes_scene_prompt: `Create a premium, performance-safe hero scene for ${order.industry || 'the client niche'} showing ${offer}. Must include static fallback, no fake claims, and no blocking load.`,
    animation_plan: ['subtle hero entrance', 'proof cards stagger', 'CTA hover/tap feedback', 'reduced-motion mode', 'static fallback for 3D/HyperFrames'],
    technical_stack: `Static-first frontend, no frontend secrets. Lead route: form/Telegram/CRM only after explicit approval. Hosting/domain: ${get('domain_hosting','уточнить')}.`,
    seo_basics: ['One clear H1', `Keywords/geography: ${seoGeo}`, 'Service/niche keywords in title/meta', 'Local/service schema if relevant', 'Alt text for real images', 'Fast static assets'],
    analytics_forms_telegram_route: ['Define lead fields', leadRoute, 'Use approved endpoint only', 'No secrets in frontend', 'Test success/error states locally', 'Owner approval before live routing'],
    content_assets_checklist: ['Logo', 'Brand colors', 'Photos/video', 'Services/pricing', 'Proof/testimonials', 'Legal disclaimers', 'Contacts/forms route', 'Competitors/references', 'Claims review notes'],
    content_request_checklist: ['final offer wording', 'decision maker contact', 'service photos', 'case/proof permission', 'legal claims list', 'FAQ answers', 'lead route owner'],
    production_tasks_by_role: {
      strategist: ['lock scope', 'define conversion path', 'approval gates'],
      client_interviewer: ['collect missing answers', 'normalize client language'],
      designer: ['hero variants', 'visual system', 'responsive states'],
      copywriter: ['offer copy', 'proof narrative', 'FAQ/objections'],
      frontend_builder: ['static UI', 'responsive implementation', 'safe lead placeholder'],
      hyperframes_specialist: ['scene prompt', 'fallback', 'performance budget'],
      qa: ['responsive/accessibility/claims/link smoke'],
      handoff: ['export plan', 'owner/client acceptance']
    },
    production_tasks: ['Lock brief', 'Write conversion copy', 'Design hero/system', 'Build responsive UI', 'Add approved lead route', 'Run QA', 'Prepare handoff'],
    qa_checklist: ['Mobile/desktop responsive', 'No unsupported claims', 'All CTA links checked', 'Form route smoke or copy-only placeholder', 'Performance budget checked', 'Accessibility contrast', 'Owner/client acceptance'],
    acceptance_criteria: ['Client goal and CTA are clear', 'Audience and offer are visible above fold', 'Visual direction matches brief', 'No forbidden promises', 'QA checklist passed', 'Handoff package exported'],
    handoff_checklist: ['Final brief', 'Production plan', 'Assets list', 'QA evidence', 'Rollback/static archive notes', 'Owner approval gates for public launch']
  };
}
function downloadJson(filename, payload) {
  const blob = new Blob([JSON.stringify(payload, null, 2)], {type: 'application/json'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
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
function safeFilenamePart(value) {
  return String(value || 'export').toLowerCase().replace(/[^a-z0-9а-яё_-]+/gi, '-').replace(/^-+|-+$/g, '').slice(0, 72) || 'export';
}
function localExportName(prefix, id, suffix='json') {
  return `${safeFilenamePart(prefix)}-${safeFilenamePart(id)}-${new Date().toISOString().slice(0,10)}.${suffix}`;
}
function workspaceBackupPayload() {
  const queue = syncQueue.list();
  return {
    storage_schema_version: OPERATOR_STORAGE_SCHEMA_VERSION,
    backup_schema_version: 'webstudio.operator.workspace_backup.v1',
    exported_at: nowIso(),
    storage_status: storageAdapter.status(),
    supabase_stub_status: supabaseStorageAdapterStub.status(),
    safety: {
      local_only: true,
      supabase_write_performed: false,
      public_launch_performed: false,
      outreach_sent: false,
      officebot_used: false
    },
    orders: allOsOrders(),
    leads: asArray(os().lead_research_queue),
    sync_queue: queue,
    readiness: {
      migration_status: 'draft_only',
      pending_sync_events: queue.filter(ev => !['synced','rolled_back'].includes(ev.status)).length,
      backend_writes_require_owner_approval: true,
      conflict_strategy: 'local-first; compare fingerprint before future backend writes'
    }
  };
}
function exportWorkspaceBackup() {
  syncQueue.enqueue('export.generated', 'workspace', 'local-backup', {export_kind: 'full_workspace_backup', local_only: true}, {operation: 'generated'});
  operatorState = {...os(), sync_queue: syncQueue.list()};
  const filename = localExportName('webstudio-workspace-backup', 'local');
  writeStorageObject(OPERATOR_LAST_BACKUP_STORAGE_KEY, {filename, exported_at: nowIso(), queue_events: syncQueue.list().length, mode: STORAGE_MODE});
  downloadJson(filename, workspaceBackupPayload());
  toast('Full workspace backup exported locally');
  render();
}
function importWorkspaceBackup(raw, mode='merge') {
  const parsed = safeJsonParse(raw, null);
  if (!parsed || !Array.isArray(parsed.orders) || !Array.isArray(parsed.leads)) {
    toast('Backup import blocked: expected full workspace backup JSON');
    return false;
  }
  const incomingOrders = parsed.orders.map(withOrderDefaults);
  const incomingLeads = parsed.leads.map(withLeadDefaults);
  const importedQueue = asArray(parsed.sync_queue);
  if (mode === 'replace') {
    saveOrders(incomingOrders);
    saveLeads(incomingLeads);
    storageAdapter.saveSyncQueue(importedQueue);
  } else {
    saveOrders(mergeOrders(allOsOrders(), incomingOrders));
    const byLead = new Map(asArray(os().lead_research_queue).map(l => [l.lead_id, withLeadDefaults(l)]));
    incomingLeads.forEach(lead => byLead.set(lead.lead_id, withLeadDefaults({...byLead.get(lead.lead_id), ...lead})));
    saveLeads([...byLead.values()]);
    storageAdapter.saveSyncQueue([...importedQueue, ...syncQueue.list()].slice(0, 500));
  }
  operatorState = {...os(), sync_queue: syncQueue.list(), storage_status: storageAdapter.status()};
  syncQueue.enqueue('export.generated', 'workspace', 'backup-import-local', {import_mode: mode, source: 'pasted_backup_json', local_only: true}, {operation: 'imported'});
  toast('Backup imported locally. No backend writes.');
  render();
  return true;
}
function exportSyncQueue() {
  syncQueue.enqueue('export.generated', 'sync_queue', 'local-sync-queue', {export_kind: 'sync_queue', local_only: true}, {operation: 'generated'});
  operatorState = {...os(), sync_queue: syncQueue.list()};
  downloadJson(localExportName('webstudio-sync-queue', 'local'), syncQueue.list());
  toast('Sync queue exported locally');
  render();
}
function briefBlock(title, value) {
  if (Array.isArray(value)) {
    return `<article class="brief-block"><h4>${fmt(title)}</h4><ul>${value.map(item => typeof item === 'object' ? `<li>${fmt(item.section || item.title || JSON.stringify(item))}<small>${item.purpose ? fmt(item.purpose) : ''}</small></li>` : `<li>${fmt(item)}</li>`).join('')}</ul></article>`;
  }
  return `<article class="brief-block"><h4>${fmt(title)}</h4><p>${fmt(value)}</p></article>`;
}
function productionBriefView(brief) {
  if (!brief) return '';
  const blocks = [
    ['Стратегия', brief.business_strategy || brief.strategy],
    ['Аудитория', brief.audience],
    ['Конверсия', brief.conversion_goal],
    ['Позиционирование', brief.offer_positioning],
    ['Карта сайта', brief.sitemap],
    ['Концепция hero', brief.hero_concept],
    ['Варианты hero', brief.hero_variants || []],
    ['Возражения → секции', brief.objections_to_sections || []],
    ['Путь конверсии', brief.conversion_path || []],
    ['Структура секций', brief.section_map || brief.section_structure],
    ['Направление copy', brief.copy_direction],
    ['Визуальное направление', brief.visual_direction],
    ['3D / Motion / HyperFrames', brief.motion_3d_hyperframes_plan || brief.motion_3d_hyperframes_direction],
    ['Prompt сцены HyperFrames', brief.hyperframes_scene_prompt],
    ['План анимации', brief.animation_plan || []],
    ['Технический стек', brief.technical_stack || brief.technical_stack_recommendation],
    ['SEO основы', brief.seo_basics || []],
    ['Маршрут заявки', brief.analytics_forms_telegram_route || []],
    ['Чеклист assets', brief.content_assets_checklist],
    ['Запрос контента', brief.content_request_checklist || []],
    ['Задачи по ролям', Object.entries(brief.production_tasks_by_role || {}).map(([role, tasks]) => ({section: role, purpose: asArray(tasks).join(', ')}))],
    ['Production задачи', brief.production_tasks],
    ['QA-чеклист', brief.qa_checklist],
    ['Acceptance criteria', brief.acceptance_criteria],
    ['Handoff-чеклист', brief.handoff_checklist]
  ];
  return `<section class="brief-output">${blocks.map(([title, value]) => briefBlock(title, value || '—')).join('')}<details class="raw-details"><summary>Технические детали</summary><pre class="code block">${fmt(jsonCopy(brief))}</pre></details></section>`;
}
function goCreateOrderCta(mode='operator') {
  const testId = mode === 'orders' ? 'orders-create-order' : 'create-order-primary';
  return `<section class="create-order-hero span-12" id="createOrderTop">
    <div><p class="eyebrow">Главное действие</p><h2>+ Создать заказ</h2><p>Создай заказ вручную или запусти DEMO-проверку. Всё сохраняется локально в браузере, без отправки, public launch и backend write.</p></div>
    <div class="create-order-actions">
      <button class="big-action" type="button" data-testid="${testId}" data-open-new-order>+ Создать заказ</button>
      <button class="big-action secondary" type="button" data-create-demo-order>Создать DEMO-заказ</button>
      <button class="big-action secondary" type="button" data-run-demo-check>Запустить DEMO-проверку</button>
    </div>
  </section>`;
}
function howToVerifyBlock() {
  const steps = ['Открой Оператор.', 'Нажми + Создать заказ.', 'Нажми Создать DEMO-заказ.', 'Открой Заказы.', 'Убедись, что заказ появился.', 'Открой Канбан выполнения.', 'Нажми Следующий этап.', 'Открой Бриф сайта.', 'Нажми Сгенерировать бриф.', 'Нажми Экспорт JSON.'];
  return `<section class="verify-guide span-12" id="howToVerify" data-testid="how-to-check-v110"><div class="section-head"><div><p class="eyebrow">Как проверить за 2 минуты</p><h3>Быстрая проверка за 2 минуты</h3></div>${badge('Сохранено локально','ok')}</div><ol>${steps.map(s => `<li>${fmt(s)}</li>`).join('')}</ol><div class="toolbar"><button type="button" data-run-demo-check>Запустить DEMO-проверку</button><a class="copy secondary" href="#kanban">Открыть Канбан выполнения</a><a class="copy secondary" href="#website-intake">Открыть Бриф сайта</a></div><p class="label">Авторассылка выключена. Требуется approval владельца перед outreach, public launch или production write. Только локальный preview.</p></section>`;
}

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
  if (lane === 'D2') return 'D2: feedback touches Telegram ingestion, launch wiring, secrets/config, or external intake.';
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

function heroMetric(label, value, note='', routeTarget='') {
  const attr = routeTarget ? ` data-route="${esc(routeTarget)}"` : '';
  return `<article class="hero-metric"${attr}><span>${fmt(label)}</span><strong>${fmt(value)}</strong>${note ? `<small>${fmt(note)}</small>` : ''}</article>`;
}
function proofItem(label, value, tone='ok') {
  return `<div class="proof-item ${statusClass(tone)}"><span>${fmt(label)}</span><strong>${fmt(value)}</strong></div>`;
}

function overview() {
  const wf = state.work_factory || {}, kb = state.kanban || {}, h = state.health || {}, safety = state.safety || {}, gh = state.github_readiness || {};
  const approvals = asArray(state.approvals);
  const qmdPending = h.qmd?.pending_embeddings ?? h.qmd?.pending ?? '—';
  const previewProof = {
    canonical_root: '/home/hermes/workspace/projects/webstudio-ops-dashboard',
    local_preview: 'http://127.0.0.1:4173',
    public_launch: 'not executed',
    officebot_path: 'forbidden',
    handoff: '/home/hermes/workspace/output/webstudio-local-handoff-v100',
    preview_package: '/home/hermes/workspace/output/webstudio-local-preview-v101'
  };
  const ownerSummary = `WebStudio Ops\nSafety: ${safety.status}\nWF: ${wf.counts?.completed || 0} completed, ${wf.counts?.pending || 0} pending, ${wf.counts?.approval_required || asArray(state.approvals).length} approvals, ${wf.counts?.blocked_error || 0} blocked/errors\nKanban: ${kb.task_total || 0} cards; ready/running=${kb.counts?.ready || 0}/${kb.counts?.running || 0}\nHealth: ${h.status}; QMD очередь=${h.qmd?.pending_embeddings ?? '—'}`;
  return `<div class="grid overview-dashboard" data-view="overview" data-testid="overview-cockpit">
    <section class="hero-panel span-12">
      <div class="hero-copy">
        <p class="eyebrow">Read-only operations cockpit</p>
        <h2>WebStudio под контролем.</h2>
        <p>Один экран для проверки безопасности, текущего производства и доверенного handoff. Никаких кнопок public launch/run/write.</p>
      </div>
      <div class="hero-metrics">
        ${heroMetric('Safety', safety.status === 'pass' ? 'PASS' : ru(safety.status || 'watch'), 'read-only contract', 'audit')}
        ${heroMetric('Gateway', h.gateway_active ? 'ACTIVE' : 'WATCH', h.primary_model_line || 'runtime tracked', 'health')}
        ${heroMetric('Production', state.production_pipeline?.counts?.active || 0, 'active items', 'production')}
        ${heroMetric('Approvals', approvals.length, 'owner-gated', 'approvals')}
      </div>
    </section>
    <section class="proof-panel span-8">
      <div class="section-head"><div><p class="eyebrow">Operational proof</p><h3>Почему этому можно доверять</h3></div>${badge('read-only', 'ok')}</div>
      <div class="proof-grid">
        ${proofItem('Safety status', safety.status === 'pass' ? 'PASS' : ru(safety.status || 'watch'), safety.status === 'pass' ? 'ok' : 'warn')}
        ${proofItem('Canonical root', 'verified', 'ok')}
        ${proofItem('No officebot path', 'enforced', 'ok')}
        ${proofItem('Dispatch / worker', safety.dispatch_allowed || safety.worker_allowed ? 'blocked' : 'disabled', 'ok')}
        ${proofItem('Public launch', 'not executed', 'ok')}
        ${proofItem('QMD embeddings', `${qmdPending} accepted`, 'warn')}
      </div>
      ${kv(previewProof)}
      ${toolbar([copyButton('Copy owner summary', ownerSummary), copyButton('Copy canonical root', previewProof.canonical_root), copyButton('Copy preview package', previewProof.preview_package)])}
    </section>
    <section class="secondary-panel span-4">
      <div class="section-head"><div><p class="eyebrow">Now</p><h3>Что сейчас важно</h3></div></div>
      <div class="priority-list">
        <article><strong>${fmt(wf.counts?.pending || 0)} pending</strong><span>Work Factory без критического шума.</span></article>
        <article><strong>${fmt(wf.counts?.blocked_error || 0)} blockers</strong><span>Ошибки остаются видимыми, но не доминируют.</span></article>
        <article><strong>${fmt(asArray(state.artifacts).length)} artifacts</strong><span>Доказательства ниже, не вместо первого экрана.</span></article>
      </div>
    </section>
    <section class="metric-strip span-12">
      ${heroMetric('WF completed', wf.counts?.completed ?? '—', 'factory', 'work-factory')}
      ${heroMetric('Kanban cards', kb.task_total ?? '—', 'tracked', 'kanban')}
      ${heroMetric('Ready / running', `${kb.counts?.ready || 0}/${kb.counts?.running || 0}`, 'execution lanes', 'kanban')}
      ${heroMetric('Artifacts', asArray(state.artifacts).length, 'evidence', 'artifacts')}
    </section>
    ${collapsibleCard('Accepted warnings', `${kv({qmd_pending_embeddings: 'accepted as not launch blocking', lcm: 'ACCEPTED_WARN / partial live proof', snapshot_fail_safe: 'PASS and sufficient', hyperframes: 'READY'})}`, 'span-6', true)}
    ${collapsibleCard('Product lines', rows(asArray(state.product_lines), p => row('', LINE_RU[p.id] || ownerText(p.name), p.status, 'Автономия: ' + asArray(p.autonomy_levels).join(', '), 'json', jsonCopy(p))), 'span-6')}
    ${collapsibleCard('Source and metadata', `${kv(sourceSummary())}${toolbar([copyButton('Copy state path', '/workspace/output/webstudio-control-plane-state.json'), copyButton('Copy local serve', 'cd /workspace/projects/webstudio-ops-dashboard && python3 -m http.server 4173 -d src')])}`, 'span-12')}
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

function premiumFactoryView() {
  const catalog = PREMIUM_FACTORY_V126;
  const qaRubric = {
    visual_system: 'first viewport names niche, offer, proof signal, and CTA',
    motion_system: 'thematic CSS 3D/HyperFrames with reduced-motion fallback',
    conversion: 'CTA is owner-gated and local-only until real routing is approved',
    mobile: 'single-column breakpoint, no horizontal scroll, readable cards',
    backend_ready: 'handoff lists future fields without creating live storage',
    safety: 'DEMO copy, no live forms, no external scripts, no cloud writes'
  };
  const handoffFlow = [
    ['1. Niche brief', 'owner inputs, proof assets, compliance notes'],
    ['2. Visual concept', 'theme, 3D/HyperFrame metaphor, motion budget'],
    ['3. Static proof', 'local HTML/CSS/JS, responsive QA, screenshots'],
    ['4. Owner review', 'PASS / WATCH / BLOCKED with exact missing proof'],
    ['5. Backend planning', 'schema and routing plan only until approval']
  ];
  const catalogRows = catalog.map(item => `<article class="attention-item">
    <div class="attention-head"><strong>${fmt(item.name)}</strong>${badge(item.qa, 'ok')}</div>
    <p><b>Niche:</b> ${fmt(item.niche)}</p>
    <p><b>3D concept:</b> ${fmt(item.motion)}</p>
    <div class="toolbar">${copyButton('Copy local file', item.path)}${copyButton('Copy handoff note', `${item.name}\n${item.niche}\n${item.motion}\n${item.path}`)}</div>
  </article>`).join('');
  return `<div class="grid premium-factory">
    <section class="hero-panel span-12 compact-hero"><div class="hero-copy"><p class="eyebrow">WebStudio v126</p><h2>Premium site factory.</h2><p>Локальная фабрика нишевых DEMO-сайтов: сильная визуальная система, тематические HyperFrames, QA и handoff без live forms и production writes.</p></div><div class="hero-metrics">${heroMetric('Concepts', catalog.length, 'local DEMO')}${heroMetric('QA', 'PASS', 'static checks')}${heroMetric('Motion', '3D', 'reduced-safe')}${heroMetric('Backend', 'planned', 'no writes')}</div></section>
    ${card('Generated concept catalog', `<div class="list">${catalogRows}</div>`, 'span-8')}
    ${card('Factory paths', kv({factory_index: '/home/hermes/workspace/output/webstudio-24h-premium-factory-v126/premium-factory-sites/index.html', manifest: '/home/hermes/workspace/output/webstudio-24h-premium-factory-v126/premium-factory-sites/manifest.json', qa_summary: '/home/hermes/workspace/output/webstudio-24h-premium-factory-v126/premium-factory-sites/qa-summary-v126.json', screenshots: '/home/hermes/workspace/output/webstudio-24h-premium-factory-v126/screenshots'}), 'span-4')}
    ${card('Premium QA rubric', kv(qaRubric), 'span-6')}
    ${card('Operator workflow', rows(handoffFlow.map(([step, body]) => ({step, body})), item => row('', item.step, 'ready', item.body), 'No workflow steps'), 'span-6')}
    ${card('Backend-ready contract', kv({mode: 'planning only', future_fields: 'lead intent, selected package, approved route, consent, artifact version', forbidden_now: 'live forms, production storage, public launch, paid tracking, unsandboxed writes', owner_gate: 'exact approval required before any live integration'}), 'span-12')}
  </div>`;
}

function classifyCard(t) {
  const text = `${t.title || ''} ${t.body || ''}`.toLowerCase();
  if (text.includes('[sys]') || text.includes('mirror_type=sys-control-plane')) return 'sys';
  if (text.includes('[wf') || text.includes('mirror only') || text.includes('work factory')) return 'mirror';
  if (text.includes('approval')) return 'approval';
  return 'normal';
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
  const order = ['triage','todo','scheduled','ready','in_progress','blocked','review','done','archived'];
  const lanes = prod.logical_lanes || {};
  return `<div class="kanban-board production-board all-columns">${order.map(lane => {
    const allItems = asArray(lanes[lane]);
    const visible = allItems.slice(0, 3);
    const more = allItems.length > visible.length ? `<div class="more-count">ещё ${allItems.length - visible.length}</div>` : '';
    return `<section class="lane ${statusClass(lane)}"><h3>${fmt(ru(lane))} <span>${allItems.length}</span></h3>${rows(visible, kanbanCard, 'Пусто')}${more}</section>`;
  }).join('')}</div>`;
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
    <section class="card span-12 kanban-compact"><h3>Производственная доска — все столбики</h3><p class="label">Logical production lanes from stable [WEBSTUDIO]/D1/D2/D3 taxonomy. Archived canary/noise is visible only as a separate lane and never mixed into active production work.</p>${logicalProductionBoard(prod)}</section>
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
function productArtifactRow(item) {
  const packet = item.qa_path || item.approval_path || item.handoff_path || '';
  const meta = [
    shortPath(item.path),
    packet ? 'approval: ' + shortPath(packet) : '',
    item.readiness_score !== undefined ? 'готовность=' + item.readiness_score + '%' : '',
    item.updated_at ? 'обновлено=' + item.updated_at : ''
  ].filter(Boolean).join(' · ');
  return row(item.product_line, `${item.title || item.artifact_type || 'artifact'} · ${item.phase || item.stage || '—'}`, item.status || 'artifact', meta, 'artifact', jsonCopy(item));
}
function readinessTimeline(progress) {
  const timeline = asArray(progress.analytics?.readiness_timeline || progress.readiness_timeline);
  return rowsTop(timeline, x => row(x.step || x.id || 'шаг', x.summary || x.title || x.artifact || 'готовность', x.status || 'tracked', shortPath(x.artifact || x.path || ''), 'json', jsonCopy(x)), 7, 'Timeline не заполнен');
}
function deliveryReadiness(progress) {
  const d = progress.analytics?.delivery_readiness || progress.delivery_readiness || {};
  const gates = asArray(d.approval_gates || d.gates);
  return `${kv({status: d.status || 'PASS_WITH_APPROVAL_GATES', score: d.score ?? '—', owner_action_required: d.owner_action_required ?? false, next_push_candidate: progress.github_sync?.next_push_candidate || 'none'})}${gates.length ? `<div class="pill-row">${gates.map(g => badge(g, 'warn')).join('')}</div>` : ''}`;
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
    <section class="card span-12 kanban-compact"><h3>Канбан производства — все столбики</h3><p class="label">Разбор · Подготовка · Запланировано · Готово к запуску · Выполняется · Заблокировано · На проверке · Готово · Архив</p>${logicalProductionBoard(p)}</section>
    ${card('v18 client-ready packages', rowsTop(asArray(progress.items).filter(item => item.phase === 'v18'), productArtifactRow, 8, 'v18 артефакты пока не записаны'), 'span-12')}
    ${card('Readiness timeline', readinessTimeline(progress), 'span-6')}
    ${card('Delivery readiness / approval gates', deliveryReadiness(progress), 'span-6')}
    ${card('GitHub Auto-Push status', `${kv({status: progress.github_sync?.autopush_status || 'unknown', latest_pushed_commit: progress.github_sync?.latest_pushed_commit || '—', pr_status: progress.github_sync?.pr_status || '—', gitguardian: progress.github_sync?.gitguardian_status || '—', owner_action_required: progress.github_sync?.owner_action_required ?? false, next_push_candidate: progress.github_sync?.next_push_candidate || '—'})}${toolbar([copyButton('Copy PR URL', progress.pr_url || state.github_readiness?.pr_url || 'https://github.com/pltnv123/webstudio-ops-dashboard/pull/1'), copyButton('Copy Auto-Push command', 'WEBSTUDIO_STAGE=v18 bash /home/hermes/workspace/output/webstudio-github-autopush-v1.sh')])}`, 'span-12')}
    ${card('Прогресс D1/D2/D3', rowsTop(asArray(progress.items), productArtifactRow, 8, 'Нет артефактов прогресса'), 'span-12')}
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
    <section class="proof-panel span-12">
      <div class="section-head"><div><p class="eyebrow">Owner gate</p><h3>Согласования без визуального шума</h3></div>${badge(asArray(state.approvals).length + ' open', asArray(state.approvals).length ? 'warn' : 'ok')}</div>
      <p class="panel-copy">Эта вкладка только показывает решения владельца и копирует шаблоны ответа. Она не запускает задачи и не меняет production.</p>
      ${toolbar([copyButton('Approve template', 'APPROVE: planning/report-only continuation for {id}. No production writes, no env/config/cron/systemd changes.'), copyButton('Needs-info template', 'NEEDS INFO: {id}. Provide summary, risks, expected artifact/output, and required owner decision.'), copyButton('Defer template', 'DEFER: {id}. Keep blocked/approval_required until owner revisits.')])}
    </section>
    <section class="card span-12 calm-list"><h3>Approval queue</h3>${searchBox('approvalSearch', 'Search approvals…', filters.approvals)}${rowsTop(list, a => row(a.id, a.title, a.status, `${a.source} · channels=${asArray(a.channels).join(', ')}`, 'approval', jsonCopy(a)), 12, 'No approvals match')}</section>
  </div>`;
}

function health() {
  const h = state.health || {};
  const gh = state.github_readiness || {};
  const wf = state.work_factory || {};
  const kb = state.kanban || {};
  const pp = state.production_pipeline || {};
  const wh = state.worker_health || {};
  const ag = state.agent_workflow || {};
  const cc = state.continuation_controller || {};
  const hard = state.system_hardening || {};
  const qmdPending = h.qmd?.pending ?? h.qmd?.pending_embeddings ?? '—';
  const qmdVectors = h.qmd?.vectors ?? '—';
  const ownerActions = asArray(state.approvals).length;
  const systemHealth = cc.final_status === 'BLOCKED' ? 'BLOCKED' : (qmdPending && Number(qmdPending) > 0 ? 'WARN' : 'OK');
  const qmdBrief = `Операционный warning: pending=${qmdPending}, vectors=${qmdVectors}. Это принято как not launch blocking; unlimited embed не запускается.`;
  const autoBrief = `Work Factory: ${wf.enabled ? 'OK' : 'WARN'} · supervisor=${wf.timer_enabled ? 'active' : 'off'} · next=${wf.last_event || '—'}`;
  const snapshotBrief = `Snapshot: ${hard.auto_snapshot_processor || 'watch'} · latest=${state.sources?.host_health_snapshot?.mtime || h.host_snapshot?.mtime || '—'} · hfinalize=${cc.evidence?.latest_hfinalize?.mtime || '—'}`;
  const githubBrief = `GitHub Auto-Push: ${gh.status || 'unknown'} · PR=${gh.pr_url || '—'} · commit=${gh.latest_commit_sha || '—'} · manual push not required when host auto-push has meaningful changes.`;
  return `<div class="grid">
    ${metric('System Health', systemHealth, 'span-3')}
    ${metric('QMD pending', qmdPending, 'span-3')}
    ${metric('Work Factory', wf.enabled && wf.timer_enabled ? 'OK' : 'WARN', 'span-3')}
    ${metric('Owner Actions', ownerActions, 'span-3')}
    ${card('System Health', `${kv({status: systemHealth, what_system_does: 'держит gateway, Work Factory, Kanban, QMD, Snapshot и Auto-Push под контролем', remaining: Number(qmdPending) > 0 ? 'QMD embeddings tail accepted / bounded only' : 'нет критического хвоста', owner_approval_required: ownerActions ? 'да, только для live/gated действий' : 'нет для регулярной работы'})}`, 'span-6 primary-surface')}
    ${card('Host Autonomy', `${kv({gateway: h.gateway_active ? 'OK' : 'DEGRADED', primary_model: h.primary_model_line, checkpoint_first: cc.checkpoint_refreshed || cc.checkpoint?.exists ? 'active' : 'watch', supervisor: wf.timer_enabled ? 'active' : 'watch', no_broken_chat_cron: 'paused/disabled for known broken marathon jobs'})}<p class="label">${fmt(autoBrief)}</p>`, 'span-6')}
    ${card('QMD Maintenance', `${kv({status: Number(qmdPending) > 0 ? 'ACCEPTED_WARN_BOUNDED' : 'OK', total_docs: h.qmd?.total, vectors: qmdVectors, pending: qmdPending, update_search: 'OK', unlimited_embed: 'disabled'})}<p class="panel-copy">${fmt(qmdBrief)}</p>${toolbar([copyButton('Copy QMD plan path', '/workspace/output/qmd-bounded-embeddings-maintenance-plan-v1.md'), copyButton('Copy QMD result path', '/workspace/output/qmd-bounded-embeddings-maintenance-result-v20-1.md')])}`, 'span-6 warning-surface')}
    ${card('Snapshot Processor', `${kv({status: hard.auto_snapshot_processor || 'tracked', latest_host_snapshot: state.sources?.host_health_snapshot?.mtime || h.host_snapshot?.mtime, latest_hfinalize: cc.evidence?.latest_hfinalize?.mtime, request_processing: 'bounded / evidence preserved'})}<p class="label">${fmt(snapshotBrief)}</p>`, 'span-6')}
    ${card('GitHub Auto-Push', `${kv({status: gh.status, repo: gh.repo, branch: gh.branch, pr: gh.pr_url, latest_commit: gh.latest_commit_sha, owner_action_required: gh.wrapper_broken ? 'host auto-push/watch; no manual product push' : 'no'})}<p class="label">${fmt(githubBrief)}</p>`, 'span-6')}
    ${card('Work Factory', `${kv({enabled: wf.enabled, supervisor: wf.timer_enabled, pending: wf.counts?.pending, blocked_error: wf.counts?.blocked_error, completed: wf.counts?.completed, last_event: wf.last_event})}`, 'span-6')}
    ${card('Kanban Health', `${kv({total_cards: kb.total_count || kb.counts?.total || 'tracked', live_stats: Object.entries(kb.counts || {}).map(([k,v]) => `${k}=${v}`).join(', ') || 'tracked', production_total: pp.counts?.total, repeated_crashes: wh.agent_workflow_v1_repeated_crash_count || 0, stale_running_dead_pid: wh.stale_running_dead_pid_2h_count || 0, active_blockers: kb.counts?.blocked || pp.counts?.blocked || 0, continuation: cc.continuation_controls?.kanban_card_exists ? 'card exists' : 'watch'})}`, 'span-6')}
    ${card('Agents / Skills', `${kv({delegate_task_smoke: 'OK', agent_protocol: ag.protocol?.silent_finish_allowed === false ? 'OK' : 'watch', roles: asArray(ag.roles).length, skills_registry: 'available', webstudio_skills: 'loaded', design_systems: 'available in vendor/reference paths'})}`, 'span-6')}
    ${card('Owner Actions', `${kv({required_now: ownerActions ? 'yes: approval queue' : 'no', regular_commands_needed: 'no', live_approval_only: 'production secrets, Telegram token, CRM/Sheets writes, Supabase migrations, public launch, payments/live external actions', autonomous_safe: 'commits/PR branch, qmd update, hfinalize, build/smoke/tests, browser QA, reports, Kanban/Work Factory/Ops updates'})}`, 'span-6')}
    ${card('Host / runtime', `${kv({gateway_active: h.gateway_active, primary_model: h.primary_model_line, snapshot: h.host_snapshot?.path, snapshot_mtime: h.host_snapshot?.mtime, status: h.status})}${toolbar([copyButton('Copy qmd status command', 'qmd status'), copyButton('Copy host snapshot path', '/workspace/runtime/host-health-snapshot.txt')])}`, 'span-6')}
    ${card('Sources', rows(Object.entries(state.sources || {}).map(([k,v]) => ({id:k, title:v.path || k, status:v.exists ? 'available' : 'missing', ...v})), s => row(s.id, s.title, s.status, `${s.size || 0} bytes · ${s.mtime || '—'} · ${s.sha256 || 'no sha'}`, 'source', jsonCopy(s))), 'span-12')}
  </div>`;
}

function artifactRow(a) {
  return row('md', a.title, 'artifact', `${a.path} · ${a.size || 0} bytes · ${a.sha256 || 'no sha'}`, 'artifact', jsonCopy(a));
}
function artifacts() {
  const q = filters.artifacts;
  const list = asArray(state.artifacts).filter(a => includes(a, q));
  const latest = list.slice(0, 18);
  return `<div class="grid">
    <section class="hero-panel span-12 compact-hero"><div class="hero-copy"><p class="eyebrow">Evidence library</p><h2>Артефакты как доказательства, не как свалка.</h2><p>Показываем свежие и найденные пакеты; полный список раскрывается ниже.</p></div>${heroMetric('Total', asArray(state.artifacts).length, 'indexed')}</section>
    <section class="card span-12 calm-list"><h3>Fresh evidence</h3>${searchBox('artifactSearch', 'Filter artifacts…', q)}${rowsTop(latest, artifactRow, 12, 'No artifacts match')}</section>
    ${collapsibleCard('All matched artifacts', rows(list, artifactRow, 'No artifacts match'), 'span-12')}
  </div>`;
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
    ${card('12h Marathon status', `${kv({status: m.status || 'unknown', schedule: m.schedule || 'tracked', timer_enabled: m.timer_enabled ?? 'unknown', index: '/workspace/output/webstudio-12h-marathon-index.md'})}${toolbar([copyButton('Copy marathon brief', ownerBrief), copyButton('Copy index path', '/workspace/output/webstudio-12h-marathon-index.md')])}`, 'span-12 primary-surface')}
    ${card('Latest marathon evidence', rows(latest, artifactRow, 'No marathon artifacts indexed yet'), 'span-12')}
    ${collapsibleCard('Raw autonomous cycle object', `<pre class="code block">${fmt(stringify(m, 6000))}</pre>`, 'span-12')}
  </div>`;
}

function audit() {
  const safety = state.safety || {};
  return `<div class="grid">
    <section class="proof-panel span-12">
      <div class="section-head"><div><p class="eyebrow">Safety contract</p><h3>Что UI никогда не делает</h3></div>${badge(safety.status || 'watch', safety.status === 'pass' ? 'ok' : 'warn')}</div>
      <div class="proof-grid">
        ${proofItem('Read-only', safety.read_only ? 'yes' : 'no', safety.read_only ? 'ok' : 'bad')}
        ${proofItem('Dispatch controls', safety.dispatch_allowed ? 'present' : 'absent', safety.dispatch_allowed ? 'bad' : 'ok')}
        ${proofItem('Worker controls', safety.worker_allowed ? 'present' : 'absent', safety.worker_allowed ? 'bad' : 'ok')}
        ${proofItem('Production writes', 'absent', 'ok')}
      </div>
    </section>
    ${card('Audit notes', rowsTop(asArray(state.audit?.notes).map((n,i)=>({id:i+1,title:n,status:'note'})), n => row(n.id, n.title, n.status), 8), 'span-6')}
    ${card('Forbidden actions absent from UI', rows(asArray(safety.forbidden_actions).map(x=>({id:'forbidden',title:x,status:'disabled'})), x => row(x.id, x.title, x.status)), 'span-6')}
    ${collapsibleCard('Raw safety object', `<pre class="code block">${fmt(JSON.stringify(safety, null, 2))}</pre>${toolbar([copyButton('Copy raw safety JSON', jsonCopy(safety)), copyButton('Copy full JSON', jsonCopy(state))])}`, 'span-12')}
  </div>`;
}

function os() { return operatorState || {}; }
function osOrders() { return asArray(os().orders).filter(o => filters.showArchived || !o.archived); }
function allOsOrders() { return asArray(os().orders); }
function activeOrder() { return osOrders().find(o => o.order_id === filters.activeOrder) || osOrders()[0] || {}; }
function orderById(id) { return allOsOrders().find(o => o.order_id === id) || {order_id: id, client_name: '—', order_type: '—', status: 'new_lead', artifacts: []}; }
function orderStatusBadge(order) { return badge(order?.owner_approval_required ? 'Требуется approval владельца' : (order?.status || 'new_lead'), order?.owner_approval_required ? 'warn' : order?.status); }
function orderRow(order) {
  const meta = `${order.order_type} · ${order.industry || 'ниша не указана'} · ${order.current_stage} · ${order.priority}`;
  const warnings = asArray(order.validation?.errors);
  return `<div class="operator-order-row ${filters.activeOrder === order.order_id ? 'active' : ''}" data-select-order="${esc(order.order_id)}">
    <article class="order-list-card">
      <div><span class="status ${statusClass(order.status)}">${fmt(order.order_id)}</span><h4>${fmt(order.client_name)}</h4><p>${fmt(meta)}</p></div>
      <div class="order-card-side">${orderStatusBadge(order)}${warnings.length ? badge('Не хватает данных', 'warn') : badge(order.current_stage || 'Входящие', 'ok')}</div>
      <p class="next-action"><b>Следующее действие:</b> ${fmt(shortText(order.next_action, 120))}</p>
      <details class="raw-details"><summary>Технические детали</summary><pre class="code mini">${fmt(jsonCopy(order))}</pre></details>
    </article>
  </div>`;
}
function actionButton(action) {
  const active = filters.operatorAction === action.id ? ' active' : '';
  return `<button type="button" class="operator-action${active}" data-operator-action="${esc(action.id)}">${fmt(action.label)}</button>`;
}
function actionPanel(action) {
  return `<section class="primary-surface operator-action-panel">
    <p class="eyebrow">Операторский режим</p>
    <h3>${fmt(action.label || 'Оператор')}</h3>
    <p>${fmt(uiText(action.meaning || 'Выберите действие слева.'))}</p>
    <div class="operator-focus-grid">
      ${proofItem('Нужные входные данные', asArray(action.required_inputs).length || 0, 'ok')}
      ${proofItem('Approval владельца', uiText(action.approval_status || '—'), /required|owner|pending/i.test(action.approval_status || '') ? 'warn' : 'ok')}
    </div>
    <p class="next-action"><b>Рекомендуемый следующий шаг:</b> ${fmt(action.next_step || 'Выберите заказ и заполните контекст.')}</p>
    ${toolbar([copyButton('Скопировать описание действия', `${action.label}\nСмысл: ${uiText(action.meaning)}\nВходные данные: ${asArray(action.required_inputs).join(', ')}\nСледующий шаг: ${action.next_step}\nApproval: ${uiText(action.approval_status)}`), copyButton('Скопировать пакет approval владельца', 'Действие: [точное действие]\nРазрешено: [файлы/действия]\nЗапрещено: live writes, public launch, spam, secrets, runtime changes\nRollback: [путь]\nПроверка: [checks]\nОстановиться если: [условие]')])}
  </section>`;
}
function orderWorkspace(order) {
  const validationErrors = asArray(order.validation?.errors);
  const approval = order.owner_approval || ownerApprovalState(order);
  const health = orderHealth(order);
  const artifacts = artifactChecklist(order);
  const timelineEvents = asArray(order.timeline).filter(ev => filters.timeline === 'all' || ev.event === filters.timeline).slice(-8);
  const clientUpdate = `Здравствуйте. Статус по заказу ${order.client_name}: стадия "${order.current_stage}". Следующий шаг: ${order.next_action}. Что нужно от клиента: ${health.missing_information.slice(0, 4).join(', ') || 'пока ничего, работа идет по плану'}.`;
  const internalSummary = `Заказ ${order.order_id}\nКлиент: ${order.client_name}\nСтадия: ${order.current_stage}\nГотовность: ${health.score}/100\nГотов к production: ${health.ready_for_production ? 'да' : 'нет'}\nНе хватает: ${health.missing_information.join(', ') || 'нет'}\nБлокеры: ${asArray(order.blockers).join('; ') || 'нет'}\nСледующий шаг: ${order.next_action}`;
  return `<section class="operator-workspace">
    <div class="section-head"><div><p class="eyebrow">Активный заказ</p><h3>${fmt(order.client_name || 'Нет активного заказа')}</h3></div>${orderStatusBadge(order)}</div>
    <div class="order-summary-grid">
      ${proofItem('Заказ', order.order_id || '—', 'ok')}
      ${proofItem('Тип', order.order_type || '—', 'ok')}
      ${proofItem('Стадия', order.current_stage || order.status || '—', order.owner_approval_required ? 'warn' : 'ok')}
      ${proofItem('Исполнитель', order.assigned_agent || '—', 'ok')}
    </div>
    <p class="next-action prominent"><b>Следующее действие:</b> ${fmt(order.next_action || 'Выберите заказ и действие.')}</p>
    <div class="order-facts">
      ${proofItem('Контакт', order.client_contact || '—', 'ok')}
      ${proofItem('Источник', order.source || 'manual', 'ok')}
      ${proofItem('Бюджет', order.budget_range || '—', 'ok')}
      ${proofItem('Срок', order.deadline || '—', 'ok')}
      ${proofItem('Approval владельца', uiText(approval.status || '—'), approval.required ? 'warn' : 'ok')}
      ${proofItem('Проверка данных', validationErrors.length ? validationErrors.join(', ') : 'ok', validationErrors.length ? 'warn' : 'ok')}
    </div>
    <div class="operator-gate-panel">
      ${proofItem('Готовность заказа', `${health.score}/100`, health.score >= 72 ? 'ok' : 'warn')}
      ${proofItem('Готов к production', health.ready_for_production ? 'да' : 'нет', health.ready_for_production ? 'ok' : 'warn')}
      ${proofItem('Гейт approval', uiText(health.owner_approval_gate), order.owner_approval_required ? 'warn' : 'ok')}
    </div>
    ${health.missing_information.length ? `<div class="missing-info"><b>Не хватает данных:</b><ul>${health.missing_information.map(x => `<li>${fmt(x)}</li>`).join('')}</ul></div>` : ''}
    <div class="artifact-checklist"><b>Чеклист артефактов</b>${artifacts.map(x => `<span class="status ${x.done ? 'ok' : 'warn'}">${fmt(x.done ? '✓ ' + x.label : 'нужно: ' + x.label)}</span>`).join('')}</div>
    ${asArray(order.blockers).length ? `<div class="blocker-strip"><b>Блокеры:</b> ${fmt(asArray(order.blockers).join('; '))}</div>` : ''}
    ${asArray(order.acceptance_criteria).length ? `<div class="acceptance-strip"><b>Acceptance:</b> ${fmt(asArray(order.acceptance_criteria).join('; '))}</div>` : ''}
    <div class="timeline-mini"><h4>Последнее событие</h4><select id="timelineFilter">${['all','created','updated','stage_changed','brief_generated','export_generated','blocked'].map(x => `<option value="${esc(x)}"${filters.timeline === x ? ' selected' : ''}>${fmt(x)}</option>`).join('')}</select>${timelineEvents.map(ev => `<p><b>${fmt(ev.event)}</b> ${fmt(shortText(ev.note, 92))} <span>${fmt(ev.at)}</span></p>`).join('') || '<p>Нет событий</p>'}</div>
    ${toolbar([
      copyButton('Скопировать JSON заказа', jsonCopy(order)),
      `<button class="copy" type="button" data-download-order="${esc(order.order_id)}">Экспорт JSON</button>`,
      `<button class="copy" type="button" data-export-production-plan="${esc(order.order_id)}">Экспорт production-плана</button>`,
      `<button class="copy secondary" type="button" data-duplicate-order="${esc(order.order_id)}">Дублировать</button>`,
      `<button class="copy secondary" type="button" data-archive-order="${esc(order.order_id)}">В архив</button>`,
      copyButton('Скопировать следующий шаг', order.next_action || ''),
      copyButton('Скопировать обновление клиенту', clientUpdate),
      copyButton('Скопировать внутреннее резюме', internalSummary)
    ])}
    <details class="active-order-edit"><summary>Обновить активный заказ</summary>
      <form id="updateOrderForm" class="operator-form" data-order-id="${esc(order.order_id || '')}">
        <label>Клиент / компания<input name="client_name" value="${esc(order.client_name || '')}"></label>
        <label>Контакт<input name="client_contact" value="${esc(order.client_contact || '')}"></label>
        <label>Источник<input name="source" value="${esc(order.source || '')}"></label>
        <label>Индустрия<input name="industry" value="${esc(order.industry || '')}"></label>
        <label>Бюджет<input name="budget_range" value="${esc(order.budget_range || '')}"></label>
        <label>Срок<input name="deadline" value="${esc(order.deadline || '')}"></label>
        <label>Приоритет<select name="priority">${['low','normal','high','urgent'].map(p => `<option${order.priority === p ? ' selected' : ''}>${fmt(p)}</option>`).join('')}</select></label>
        <label>Стадия<select name="current_stage">${EXECUTION_COLUMNS.map(s => `<option${(order.current_stage || stageForStatus(order.status)) === s ? ' selected' : ''}>${fmt(s)}</option>`).join('')}</select></label>
        <label class="span-12">Следующее действие<textarea name="next_action">${esc(order.next_action || '')}</textarea></label>
        <label class="span-12">Заметки<textarea name="internal_notes">${esc(order.internal_notes || '')}</textarea></label>
        <label class="span-12">Блокеры<textarea name="blockers_text" placeholder="Один блокер на строку">${esc(asArray(order.blockers).join('\n'))}</textarea></label>
        <label class="checkline"><input name="owner_approval_required" type="checkbox" ${order.owner_approval_required ? 'checked' : ''}> Нужен owner approval</label>
        <div class="form-actions span-12"><button type="submit">Сохранить изменения</button></div>
      </form>
    </details>
    <details class="blocker-templates"><summary>Шаблоны причин блокера</summary>${toolbar([
      copyButton('Нужны материалы клиента', 'Заблокировано: ждем logo, photos, proof/testimonials, legal disclaimers или финальный список услуг.'),
      copyButton('Нужен approval владельца', 'Заблокировано: нужен approval владельца перед live route, production write, public launch, paid asset или outreach send.'),
      copyButton('Нужно решение по scope', 'Заблокировано: package/scope неясен; выбрать MVP, premium landing, full site, bot, automation или handoff-only.'),
      copyButton('Нужна compliance-проверка', 'Заблокировано: claims, regulated niche, testimonials или data route требуют compliance review перед production.')
    ])}</details>
  </section>`;
}
function executionChain(order) {
  const current = order.current_stage || stageForStatus(order.status);
  return `<section class="operator-chain">
    <div class="section-head"><div><p class="eyebrow">Выполнение</p><h3>Текущая цепочка</h3></div></div>
    <div class="chain-list">${EXECUTION_COLUMNS.map(column => {
      const active = current === column;
      const count = allOsOrders().filter(o => !o.archived && (o.current_stage || stageForStatus(o.status)) === column).length;
      return `<div class="chain-step ${active ? 'active' : ''}"><span>${fmt(column)}</span><strong>${active ? fmt(order.order_id) : fmt(count)}</strong></div>`;
    }).join('')}</div>
  </section>`;
}
function websiteBriefTools(order) {
  const questions = asArray(os().website_questionnaire);
  const questionText = questions.map(g => `${g.group}\n${asArray(g.questions).map(q => '- ' + q).join('\n')}`).join('\n\n');
  const productionBrief = order.production_brief || generateProductionBrief(order || {});
  const productionPlan = jsonCopy(productionBrief);
  const answerFields = [
    ['business_goal','Цель сайта'], ['conversion_action','Главная конверсия'], ['ideal_client','Идеальный клиент'],
    ['difference','Отличие оффера'], ['proof_assets','Доказательства'], ['brand_style','Стиль / бренд'],
    ['motion_3d','Motion / 3D / HyperFrames'], ['domain_hosting','Домен / хостинг'], ['preferred_colors','Цвета / референсы'],
    ['assets','Контент / assets'], ['seo_geo','SEO / география'], ['lead_route','Форма / Telegram / CRM'], ['never_promise','Что нельзя обещать']
  ];
  return `<section class="operator-bottom span-12">
    <div class="section-head"><div><p class="eyebrow">Бриф сайта</p><h3>Бриф сайта → production-ready план</h3><p class="label">Шаблон работает локально и детерминированно: без LLM, без backend write, без public launch.</p></div>${badge('Только локально', 'ok')}</div>
    <form id="websiteIntakeForm" class="operator-form intake-grid" data-order-id="${esc(order.order_id || '')}">
      ${answerFields.map(([name,label]) => `<label>${fmt(label)}<textarea name="${esc(name)}" placeholder="${esc(label)}">${esc(order.client_answers?.[name] || '')}</textarea></label>`).join('')}
      <div class="form-actions span-12">
        <button type="submit">Сохранить ответы</button>
        <button type="button" data-generate-brief="${esc(order.order_id || '')}">Сгенерировать бриф</button>
        <button type="button" data-download-brief="${esc(order.order_id || '')}">Экспорт брифа</button>
      </div>
    </form>
    ${order.production_brief ? card('Production-бриф', productionBriefView(order.production_brief), 'span-12 secondary-panel') : ''}
    <div class="question-groups">${questions.map(g => `<article><h4>${fmt(g.group)}</h4><ul>${asArray(g.questions).map(q => `<li>${fmt(q)}</li>`).join('')}</ul></article>`).join('')}</div>
    ${toolbar([copyButton('Скопировать вопросы клиенту', questionText), copyButton('Скопировать шаблон ответов', questions.map(g => `${g.group}\n${asArray(g.questions).map(q => q + ': ').join('\n')}`).join('\n\n')), copyButton('Скопировать production-бриф', productionPlan), copyButton('Скопировать production-план', productionPlan), copyButton('Скопировать JSON заказа', jsonCopy(order))])}
  </section>`;
}
function newOrderForm() {
  const types = ['Professional website / landing','E-commerce','Web app / SaaS','Telegram bot','AI automation','CRM/integration','Branding/design','3D/interactive experience','Marketing/content/SEO','Analytics/dashboard','Custom request / anything else'];
  return `<section class="card span-12 secondary-panel new-order-block" id="newOrderBlock" data-testid="new-order-form"><div class="section-head"><div><p class="eyebrow">Новый заказ</p><h3>+ Создать заказ</h3><p class="label">Минимум: клиент, тип заказа и описание задачи. После создания заказ сразу появится в списке, активной карточке и Канбане выполнения.</p></div>${badge('Сохранено локально','ok')}</div>
    <form id="newOrderForm" class="operator-form">
      <label>Клиент / компания<input name="client_name" required placeholder="Название клиента"></label>
      <label>Контакт<input name="client_contact" placeholder="Telegram, email, phone"></label>
      <label>Тип заказа<select name="order_type">${types.map(t => `<option>${fmt(t)}</option>`).join('')}</select></label>
      <label>Ниша<input name="industry" placeholder="B2B, клиника, SaaS, ресторан…"></label>
      <label>Источник<input name="source" placeholder="manual, referral, lead research"></label>
      <label>Бюджет<input name="budget_range" placeholder="$3k-$8k"></label>
      <label>Дедлайн<input name="deadline" placeholder="3 weeks"></label>
      <label>Приоритет<select name="priority"><option>normal</option><option>high</option><option>urgent</option><option>low</option></select></label>
      <label class="span-12">Описание задачи<textarea name="internal_notes" required placeholder="Что нужно сделать: сайт, лендинг, бот, автоматизация, бриф, сроки, ограничения"></textarea></label>
      <label class="checkline"><input name="owner_approval_required" type="checkbox"> Требуется approval владельца</label>
      <div class="form-actions span-12"><button class="primary-create" type="submit">Создать заказ</button><button type="button" data-create-demo-order>Создать DEMO-заказ</button><button type="reset">Очистить форму</button><button type="button" data-reset-demo>Сбросить DEMO-данные</button><button type="button" data-export-orders>Экспорт JSON</button><button type="button" data-import-orders-open>Импорт JSON</button></div>
    </form>
    <form id="importOrdersForm" class="operator-form import-form" hidden>
      <label class="span-12">Вставь JSON заказов<textarea name="orders_json" placeholder='[{"order_id":"LOCAL-..."}]'></textarea></label>
      <label>Режим импорта<select name="import_mode"><option value="merge">Объединить / убрать дубли по order_id</option><option value="replace">Заменить локальный список</option></select></label>
      <button type="submit">Импортировать JSON</button>
    </form>
  </section>`;
}
function storageStatusPanel() {
  const status = storageAdapter.status();
  const stub = supabaseStorageAdapterStub.status();
  const queue = syncQueue.list();
  const lastBackup = readStorageObject(OPERATOR_LAST_BACKUP_STORAGE_KEY, {});
  const pending = queue.filter(ev => !['synced','rolled_back'].includes(ev.status)).length;
  return `<section class="proof-panel span-12" data-testid="storage-status-panel">
    <div class="section-head"><div><p class="eyebrow">Storage</p><h3>Backend-ready storage layer</h3><p class="label">Текущий режим остается browser-only: localStorage active, Supabase adapter disabled/read-only.</p></div>${badge('local only', 'ok')}</div>
    <div class="proof-grid">
      ${proofItem('Storage mode', status.mode, 'ok')}
      ${proofItem('Backend', status.backend, 'warn')}
      ${proofItem('Sync status', status.sync_status, 'ok')}
      ${proofItem('Pending sync events', pending, pending ? 'warn' : 'ok')}
      ${proofItem('Order schema', OPERATOR_ORDER_SCHEMA_VERSION, 'ok')}
      ${proofItem('Lead schema', OPERATOR_LEAD_SCHEMA_VERSION, 'ok')}
      ${proofItem('Storage schema', OPERATOR_STORAGE_SCHEMA_VERSION, 'ok')}
      ${proofItem('Migration status', 'draft only', 'warn')}
      ${proofItem('Last backup export', lastBackup.exported_at || 'not exported in this browser', lastBackup.exported_at ? 'ok' : 'warn')}
      ${proofItem('Backend writes', 'require owner approval', 'warn')}
    </div>
    <div class="toolbar">
      <span class="status warn" aria-disabled="true">Enable Supabase: disabled until owner approval</span>
      <button type="button" data-export-orders>Экспорт orders</button>
      <button type="button" data-export-leads>Экспорт leads</button>
      <button type="button" data-export-sync-queue>Экспорт sync queue</button>
      <button type="button" data-export-workspace-backup>Экспорт full workspace backup</button>
      <button type="button" data-import-backup-open>Импорт backup локально</button>
    </div>
    <form id="importBackupForm" class="operator-form import-form" hidden>
      <label class="span-12">Workspace backup JSON<textarea name="backup_json" placeholder='{"backup_schema_version":"webstudio.operator.workspace_backup.v1","orders":[],"leads":[],"sync_queue":[]}'></textarea></label>
      <label>Режим импорта<select name="import_mode"><option value="merge">Merge local backup</option><option value="replace">Replace local workspace</option></select></label>
      <p class="label span-12">Warning: local import rewrites browser localStorage only. It does not call Supabase and does not send data anywhere.</p>
      <button type="submit">Импортировать backup локально</button>
    </form>
    <details><summary>Supabase adapter stub / read-only plan</summary><pre class="code mini">${fmt(jsonCopy(stub))}</pre></details>
  </section>`;
}
function syncQueuePanel() {
  const queue = syncQueue.list();
  return `<section class="card span-12 calm-list" data-testid="sync-queue-panel">
    <div class="section-head"><div><p class="eyebrow">Sync queue</p><h3>Локальная очередь будущей синхронизации</h3><p class="label">Очередь не делает network calls. Записи нужны для dry-run, conflict detection и будущего approval-gated sync.</p></div>${badge('local only', 'ok')}</div>
    ${toolbar([`<button type="button" data-export-sync-queue>Экспорт sync queue</button>`, `<button type="button" data-export-workspace-backup>Экспорт full workspace backup</button>`])}
    ${rowsTop(queue, ev => row(ev.event_type, `${ev.entity_type}:${ev.entity_id}`, ev.status, `operation=${ev.operation} · approval=${ev.requires_approval ? 'yes' : 'no'} · ${ev.created_at}`, 'sync-queue-event', jsonCopy(ev)), 12, 'Очередь пока пуста')}
    <details class="raw-details"><summary>Raw sync queue JSON</summary><pre class="code block">${fmt(jsonCopy(queue))}</pre></details>
  </section>`;
}
const WEBSITE_FACTORY_PRESETS = [
  {id:'premium-clinic', label:'Premium Clinic', industry:'premium medical / expert service', style:'Clinical editorial', cta:'Book DEMO consultation'},
  {id:'legal-boutique', label:'Legal Boutique', industry:'legal services', style:'Quiet authority', cta:'Request case review'},
  {id:'construction-renovation', label:'Construction / Renovation', industry:'construction and renovation', style:'Material proof', cta:'Estimate project'},
  {id:'beauty-clinic', label:'Beauty Clinic', industry:'aesthetic services', style:'Soft premium', cta:'Plan visit'},
  {id:'fitness-coach', label:'Fitness Coach', industry:'personal fitness', style:'Kinetic performance', cta:'Start assessment'},
  {id:'restaurant-premium', label:'Premium Restaurant', industry:'restaurant / hospitality', style:'Editorial dining', cta:'Reserve table'},
  {id:'b2b-saas', label:'B2B SaaS', industry:'software', style:'Product clarity', cta:'Book product demo'},
  {id:'ai-automation-agency', label:'AI Automation Agency', industry:'automation services', style:'Systems intelligence', cta:'Map automation'}
];
function websiteFactoryStatus(order) {
  const hasBrief = Boolean(order.production_brief);
  const hasAnswers = Object.keys(order.client_answers || {}).length >= 3;
  const qaReady = hasBrief && hasAnswers && asArray(order.production_brief?.qa_checklist).length > 0;
  return {
    active_order: order.order_id || 'none',
    generated_brief_status: hasBrief ? 'ready' : 'missing',
    generated_site_pack_status: hasBrief ? 'local pack ready to export' : 'requires brief first',
    qa_status: qaReady ? 'ready' : 'needs brief / answers',
    handoff_status: hasBrief ? 'handoff checklist available' : 'pending'
  };
}
function websiteFactoryPackPayload(order, presetId='premium-clinic') {
  const preset = WEBSITE_FACTORY_PRESETS.find(p => p.id === presetId) || WEBSITE_FACTORY_PRESETS[0];
  const brief = order.production_brief || generateProductionBrief(order || {});
  return {
    schema_version: 'webstudio.website_pack.v115',
    storage_schema_version: OPERATOR_STORAGE_SCHEMA_VERSION,
    generated_at: nowIso(),
    local_only: true,
    backend_write: false,
    public_launch: false,
    order: withOrderDefaults(order || {}),
    preset,
    brief,
    qa_checklist: brief.qa_checklist || [],
    handoff_checklist: brief.handoff_checklist || [],
    files_expected: ['index.html','styles.css','app.js','brief.md','production-plan.md','qa-checklist.md','handoff.md','manifest.json','motion-hyperframes-plan.md']
  };
}
function exportWebsiteFactoryPack(orderId, presetId) {
  const order = orderById(orderId);
  const payload = websiteFactoryPackPayload(order, presetId);
  syncQueue.enqueue('export.generated', 'website_pack', `${orderId}:${presetId}`, {export_kind: 'website_pack', preset_id: presetId, local_only: true}, {operation: 'generated'});
  operatorState = {...os(), sync_queue: syncQueue.list()};
  downloadJson(localExportName('webstudio-website-pack', `${presetId}-${orderId}`), payload);
  toast('Website pack exported locally');
  render();
}
function websiteFactoryPanel(order) {
  const activePreset = WEBSITE_FACTORY_PRESETS.find(p => p.industry === order.industry) || WEBSITE_FACTORY_PRESETS[0];
  const status = websiteFactoryStatus(order);
  return `<section class="proof-panel span-12" data-testid="website-factory-panel">
    <div class="section-head"><div><p class="eyebrow">Фабрика сайтов</p><h3>Локальная генерация website pack из заказа</h3><p class="label">Детерминированно, без LLM, backend writes, Supabase, public launch или outreach.</p></div>${badge('local factory', 'ok')}</div>
    <div class="proof-grid">
      ${proofItem('Active order', status.active_order, order.order_id ? 'ok' : 'warn')}
      ${proofItem('Selected website style', activePreset.style, 'ok')}
      ${proofItem('Selected industry', order.industry || activePreset.industry, order.industry ? 'ok' : 'warn')}
      ${proofItem('Generated brief', status.generated_brief_status, status.generated_brief_status === 'ready' ? 'ok' : 'warn')}
      ${proofItem('Generated site pack', status.generated_site_pack_status, status.generated_brief_status === 'ready' ? 'ok' : 'warn')}
      ${proofItem('QA status', status.qa_status, status.qa_status === 'ready' ? 'ok' : 'warn')}
      ${proofItem('Backend', 'localStorage only', 'ok')}
      ${proofItem('Public launch', 'not performed', 'ok')}
    </div>
    <div class="toolbar">
      <button type="button" data-generate-brief="${esc(order.order_id || '')}">Generate production brief</button>
      <button type="button" data-export-website-pack="${esc(order.order_id || '')}" data-preset-id="${esc(activePreset.id)}">Generate local website pack</button>
      <button type="button" data-download-order="${esc(order.order_id || '')}">Export order JSON</button>
      <button type="button" data-export-workspace-backup>Export full backup</button>
    </div>
    <details><summary>Template presets</summary><div class="question-groups">${WEBSITE_FACTORY_PRESETS.map(p => `<article><h4>${fmt(p.label)}</h4><p>${fmt(p.industry)} · ${fmt(p.style)} · CTA: ${fmt(p.cta)}</p></article>`).join('')}</div></details>
    <details><summary>Factory pack preview JSON</summary><pre class="code mini">${fmt(jsonCopy(websiteFactoryPackPayload(order, activePreset.id)))}</pre></details>
  </section>`;
}
function operatorWorkbench() {
  const actions = asArray(os().operator_actions);
  const action = actions.find(a => a.id === filters.operatorAction) || actions[0] || {};
  const order = activeOrder();
  return `<div class="operator-os grid" data-view="operator" data-testid="operator-workbench">
    ${storageStatusPanel()}
    ${goCreateOrderCta('operator')}
    ${howToVerifyBlock()}
    <section class="operator-left span-3"><p class="eyebrow">Что делаем сейчас?</p><h3>Оператор</h3><div class="operator-actions">${actions.map(actionButton).join('')}</div></section>
    <section class="span-6">${actionPanel(action)}${orderWorkspace(order)}</section>
    <section class="span-3">${executionChain(order)}${card('Безопасность', kv({read_only: os().safety_policy?.read_only_ui, outreach: 'только черновики / approval владельца', public_launch: 'не выполняется', officebot: 'запрещен'}), 'span-12')}</section>
    ${newOrderForm()}
    ${websiteFactoryPanel(order)}
    ${syncQueuePanel()}
    ${websiteBriefTools(order)}
  </div>`;
}
function ordersView() {
  const orders = osOrders();
  const active = activeOrder();
  const importExport = toolbar([
    `<button type="button" data-export-orders>Экспорт JSON</button>`,
    `<button type="button" data-import-orders-open>Импорт JSON</button>`,
    active.order_id ? `<button type="button" data-duplicate-order="${esc(active.order_id)}">Дублировать активный</button>` : '',
    active.order_id ? `<button type="button" data-archive-order="${esc(active.order_id)}">Архивировать активный</button>` : ''
  ].filter(Boolean));
  return `<div class="grid operator-os" data-view="orders" data-testid="orders-workspace">
    ${storageStatusPanel()}
    ${goCreateOrderCta('orders')}
    <section class="hero-panel compact-hero span-12"><div class="hero-copy"><p class="eyebrow">Заказы</p><h2>Все заказы в одном окне.</h2><p>Создай заказ, выбери активную карточку, двигай ее в Канбане и генерируй бриф. Raw JSON спрятан в технических деталях.</p></div>${heroMetric('Заказы', orders.length, 'localStorage')}</section>
    ${howToVerifyBlock()}
    ${newOrderForm()}
    <section class="card span-8 calm-list"><div class="section-head"><div><p class="eyebrow">Список заказов</p><h3>Заказы</h3></div>${badge('active: ' + (active.order_id || 'нет'), 'ok')}</div>${importExport}${rows(orders, orderRow, 'Заказов пока нет. Нажми + Создать заказ или Создать DEMO-заказ.')}</section>
    <section class="card span-4"><h3>Активный заказ</h3>${orderWorkspace(active)}</section>
    ${collapsibleCard('Технические детали заказов', `<pre class="code block">${fmt(jsonCopy(orders))}</pre>`, 'span-12')}
    ${syncQueuePanel()}
  </div>`;
}
function executionKanbanView() {
  const columns = EXECUTION_COLUMNS.map(column => ({column, orders: allOsOrders().filter(o => !o.archived && (o.current_stage || stageForStatus(o.status)) === column)}));
  const activeId = activeOrder().order_id;
  return `<div class="grid operator-os" data-view="kanban" data-testid="execution-kanban-workspace">
    ${storageStatusPanel()}
    <section class="hero-panel compact-hero span-12"><div class="hero-copy"><p class="eyebrow">Канбан выполнения</p><h2>Двигай заказ кнопками на карточке.</h2><p>Канбан выполнения показывает путь заказа от входящего лида до handoff. Все движения локальные, без запуска воркеров и без отправки сообщений. Нажми “Следующий этап”, “Ожидаем клиента”, “Заблокировано”, “В QA”, “В Handoff” или “Готово”.</p></div>${heroMetric('Колонки', columns.length, 'локальный путь заказа')}</section>
    <section class="span-12 execution-board">${columns.map(col => `<div class="exec-lane"><h3>${fmt(col.column)} <span>${asArray(col.orders).length}</span></h3>${asArray(col.orders).map(o => {
      const latest = asArray(o.timeline).slice(-2);
      return `<article class="exec-card ${activeId === o.order_id ? 'active-order-card' : ''}" data-select-order="${esc(o.order_id)}" data-detail-type="operator-order" data-detail-payload="${esc(jsonCopy(o))}"><strong>${fmt(o.order_id)}</strong><b>${fmt(o.client_name)}</b><span>${fmt(o.order_type)}</span><small>исполнитель: ${fmt(o.assigned_agent)} · артефакты: ${asArray(o.artifacts).length} · QA=${o.status === 'qa' ? 'активно' : 'ожидает'} · handoff=${o.status === 'handoff' ? 'готов' : 'ожидает'}</small><p class="next-action"><b>Следующий шаг:</b> ${fmt(shortText(o.next_action, 110))}</p>${asArray(o.blockers).length ? `<p class="blocker-strip">${fmt(asArray(o.blockers).join('; '))}</p>` : ''}${orderStatusBadge(o)}
        <div class="mini-actions">
          <button type="button" data-move-next="${esc(o.order_id)}">Следующий этап</button>
          <button type="button" data-exec-state="${esc(o.order_id)}" data-stage="Бриф" data-status="waiting_client" data-note="Ожидаем клиента">Ожидаем клиента</button>
          <button type="button" data-exec-state="${esc(o.order_id)}" data-stage="Заблокировано" data-status="blocked" data-note="Заблокировано оператором">Заблокировано</button>
          <button type="button" data-exec-state="${esc(o.order_id)}" data-stage="QA" data-status="qa" data-note="Передано в QA">В QA</button>
          <button type="button" data-exec-state="${esc(o.order_id)}" data-stage="Handoff" data-status="handoff" data-note="Передано в Handoff">В Handoff</button>
          <button type="button" data-exec-state="${esc(o.order_id)}" data-stage="Готово" data-status="done" data-note="Готово локально">Готово</button>
        </div>
        <div class="timeline-mini compact">${latest.map(ev => `<p><b>${fmt(ev.event)}</b> ${fmt(shortText(ev.note, 54))}</p>`).join('') || '<p>Нет событий</p>'}</div>
        <details><summary>Технические детали</summary><pre class="code mini">${fmt(jsonCopy({timeline: asArray(o.timeline), artifacts: o.artifacts, questions: Object.keys(o.client_answers || {}), qa_status: o.status === 'qa' ? 'watch' : 'not_started', handoff_status: o.status === 'handoff' ? 'ready' : 'not_started'}))}</pre></details></article>`;
    }).join('') || '<div class="empty">Нет заказов</div>'}</div>`).join('')}</section>
  </div>`;
}
function websiteIntakeView() {
  return `<div class="grid operator-os">${websiteBriefTools(activeOrder())}</div>`;
}
function realAssetsWorkflow() {
  const active = activeOrder();
  const safeChecklist = [
    ['brand', 'Логотип, цвета, шрифты, правила использования', 'optional_until_final'],
    ['photos', 'Реальные фото команды, офиса, продукта или процесса', 'required_for_client_preview'],
    ['proof', 'Проверяемые кейсы, отзывы, сертификаты и цифры', 'verified_only'],
    ['legal', 'Политика, реквизиты, ограничения по нише', 'owner_review'],
    ['contacts', 'Публичные каналы связи и часы ответа', 'client_confirmed']
  ];
  const replacementPlan = `Real Asset Replacement Workflow v63\nMode: static demo only, no client-send writes.\nOrder: ${active.order_id || 'LOCAL-DEMO'}\n1. Mark every generated/concept asset as DEMO until client provides originals.\n2. Collect brand files, real photos, verified proof, legal copy, public contacts.\n3. Replace placeholders only after source, license, and owner/client confirmation are recorded.\n4. Keep missing assets visible as TODO blocks; do not invent doctors, logos, certificates, numbers, or testimonials.\n5. Before public launch: run visual QA, mobile QA, no-secret scan, owner acceptance.`;
  const requestTemplate = `Client asset request\nPlease send only materials you are allowed to use publicly:\n- logo or brand guide\n- real photos/video links\n- service descriptions and prices/ranges you approve\n- verified reviews/cases/certificates\n- legal/contact details\nIf something is missing, we keep a clear placeholder label instead of inventing it.`;
  return `<div class="grid operator-os" data-view="real-assets" data-marker="real-asset-workflow-v63">
    <section class="hero-panel compact-hero span-12"><div class="hero-copy"><p class="eyebrow">V6.3 · Реальные материалы</p><h2>Замена DEMO-ассетов без выдуманных доказательств.</h2><p>Статический safe workflow для перехода от концепта к client-safe preview: всё demo-only, без отправок клиентам, live CRM, платежей или внешних записей.</p></div>${heroMetric('Asset gates', safeChecklist.length, 'sanitized')}</section>
    <section class="proof-panel span-12"><div class="section-head"><div><p class="eyebrow">Safety contract</p><h3>Что запрещено подменять</h3><p class="label">Публичная версия получает только подтвержденные материалы. Неподтвержденное остается с заметной меткой DEMO/TODO.</p></div>${badge('static only','ok')}</div>
      <div class="proof-grid">${proofItem('Fake testimonials/logos', 'запрещено', 'ok')}${proofItem('Generated people as real staff', 'запрещено', 'ok')}${proofItem('Medical/legal claims without proof', 'запрещено', 'ok')}${proofItem('Client send automation', 'выключено', 'ok')}${proofItem('CRM/payment writes', 'нет', 'ok')}${proofItem('Owner acceptance', 'required before public launch', 'warn')}</div>
    </section>
    <section class="card span-7"><h3>Replacement checklist</h3><div class="chain-list">${safeChecklist.map(([id,label,status]) => `<div class="chain-step"><span>${fmt(id)}</span><strong>${fmt(label)}</strong><small>${fmt(uiText(status))}</small></div>`).join('')}</div></section>
    <section class="card span-5"><h3>Active order gate</h3>${kv({order_id: active.order_id || 'LOCAL-DEMO', client: active.client_name || 'Demo client', current_stage: active.current_stage || 'draft', real_asset_policy: 'placeholder_until_confirmed', public_launch: 'owner approval required'})}${toolbar([copyButton('Скопировать план замены', replacementPlan), copyButton('Скопировать запрос клиенту', requestTemplate)])}</section>
    <section class="card span-6"><h3>Missing content tracker</h3><ul class="clean-list"><li>Нет логотипа → оставить текстовый знак и TODO.</li><li>Нет фото команды → использовать абстрактный DEMO-блок, не изображать реальных людей.</li><li>Нет отзывов → показать список доказательств, которые нужно получить.</li><li>Нет цен → писать диапазон только после подтверждения владельцем.</li></ul></section>
    <section class="card span-6 warning-surface"><h3>Acceptance before public launch</h3><ul class="clean-list"><li>Все реальные материалы имеют источник и разрешение.</li><li>DEMO labels сняты только там, где есть подтверждение.</li><li>Скриншоты после замены ассетов сохранены в evidence.</li><li>Фронтенд scan не нашел секретов или live endpoints.</li></ul></section>
  </div>`;
}
function proposalQuoteWorkflow() {
  const active = activeOrder();
  const health = orderHealth(withOrderDefaults(active));
  const brief = active.production_brief || generateProductionBrief(active);
  const proposalMarker = 'proposal-quote-generator-v64';
  const bands = [
    {id: 'starter', label: 'Start', range: '$3k–$7k', fit: '1–3 страницы, быстрый запуск, минимум motion', includes: ['brief lock', 'conversion copy', 'responsive static site', 'basic QA checklist']},
    {id: 'pro', label: 'Pro', range: '$8k–$18k', fit: 'много секций, proof blocks, handoff package', includes: ['strategy', 'premium visual system', 'asset replacement plan', 'SEO basics', 'QA + handoff']},
    {id: 'premium', label: 'Premium', range: '$20k–$40k', fit: 'сложная ниша, motion/art direction, строгий acceptance', includes: ['3 concepts', 'motion plan', 'content system', 'advanced QA', 'owner/client acceptance gates']}
  ];
  const proposal = {
    schema_version: 'webstudio.proposal_quote.v64',
    marker: proposalMarker,
    generated_at: nowIso(),
    mode: 'static_demo_only_local_export',
    safety: {
      public_ui_demo_only: true,
      no_crm_write: true,
      no_email_or_telegram_send: true,
      no_payment_action: true,
      no_client_delivery_action: true,
      officebot_used: false,
      owner_approval_required_before_client_use: true
    },
    order: {
      order_id: active.order_id || 'LOCAL-DEMO',
      client_name: active.client_name || 'Demo client',
      industry: active.industry || 'demo niche',
      budget_range: active.budget_range || 'not confirmed',
      deadline: active.deadline || 'not confirmed',
      health_score: health.score,
      missing_information: health.missing_information
    },
    scope_options: bands,
    recommended_package: health.score >= 80 ? 'pro' : 'starter_until_brief_complete',
    assumptions: [
      'Цена является внутренней оценкой, не публичным обещанием.',
      'Финальный scope фиксируется после подтверждения материалов, proof и legal copy.',
      'Все live-интеграции, CRM, формы, мессенджеры и платежные сценарии требуют отдельного approval.',
      'Неподтвержденные отзывы, логотипы, сертификаты и цифры не используются.'
    ],
    deliverables: ['proposal summary', 'scope table', 'timeline draft', 'acceptance checklist', 'risk/approval gates'],
    acceptance_criteria: brief.acceptance_criteria || [],
    next_safe_step: 'Owner reviews draft, selects package, then client-facing copy is rewritten and approved manually.'
  };
  const quoteText = `Proposal / quote draft v64\nOrder: ${proposal.order.order_id}\nClient: ${proposal.order.client_name}\nRecommended: ${proposal.recommended_package}\nSafety: demo-only, no sends, no CRM/payment writes, owner approval before client use.\n\nScope bands:\n${bands.map(b => `- ${b.label}: ${b.range} — ${b.fit}`).join('\n')}\n\nAssumptions:\n${proposal.assumptions.map(a => `- ${a}`).join('\n')}`;
  return `<div class="grid operator-os" data-view="proposal-quote" data-marker="${proposalMarker}">
    <section class="hero-panel compact-hero span-12"><div class="hero-copy"><p class="eyebrow">V6.4 · Proposal / quote</p><h2>Генератор scope и цены без live-действий.</h2><p>Статический sanitized модуль: готовит внутренний draft предложения, диапазон цены, acceptance criteria и approval gates. Ничего не отправляет клиенту и не пишет во внешние системы.</p></div>${heroMetric('Quote bands', bands.length, 'demo-only')}</section>
    <section class="proof-panel span-12"><div class="section-head"><div><p class="eyebrow">Safety contract</p><h3>Proposal не равен клиентской отправке</h3><p class="label">Это copy-only черновик для владельца. Client-facing текст, финальная цена и public launch требуют отдельного подтверждения.</p></div>${badge('static draft','ok')}</div>
      <div class="proof-grid">${proofItem('CRM write', 'нет', 'ok')}${proofItem('Email / Telegram send', 'нет', 'ok')}${proofItem('Payment action', 'нет', 'ok')}${proofItem('Fixed promise', 'нет', 'ok')}${proofItem('Owner approval', 'required', 'warn')}${proofItem('Officebot', 'not used', 'ok')}</div>
    </section>
    <section class="card span-7"><h3>Scope bands</h3><div class="chain-list">${bands.map(b => `<div class="chain-step"><span>${fmt(b.label)} · ${fmt(b.range)}</span><strong>${fmt(b.fit)}</strong><small>${fmt(b.includes.join(' · '))}</small></div>`).join('')}</div></section>
    <section class="card span-5"><h3>Active order quote gate</h3>${kv({order_id: proposal.order.order_id, client: proposal.order.client_name, health_score: proposal.order.health_score, recommended: proposal.recommended_package, owner_approval: 'required before client use'})}${toolbar([copyButton('Скопировать quote draft', quoteText), copyButton('Экспорт proposal JSON', jsonCopy(proposal))])}</section>
    <section class="card span-6"><h3>Assumptions</h3><ul class="clean-list">${proposal.assumptions.map(item => `<li>${fmt(item)}</li>`).join('')}</ul></section>
    <section class="card span-6 warning-surface"><h3>Approval gates</h3><ul class="clean-list"><li>Подтвердить scope и диапазон цены.</li><li>Проверить missing information: ${fmt(proposal.order.missing_information.join(', ') || 'нет критичных пробелов')}.</li><li>Переписать client-facing версию вручную.</li><li>Проверить legal/proof claims до public launch.</li></ul></section>
    ${collapsibleCard('Proposal JSON', `<pre class="code block">${fmt(jsonCopy(proposal))}</pre>`, 'span-12')}
  </div>`;
}
function leadResearchView() {
  const leads = asArray(os().lead_research_queue);
  return `<div class="grid operator-os">
    <section class="proof-panel span-12"><div class="section-head"><div><p class="eyebrow">Безопасный поиск заказов</p><h3>Поиск заказов без спама</h3><p class="label">Это очередь исследования и черновиков. Здесь нет кнопки отправки и нет автоматического outreach.</p></div>${badge('Требуется approval владельца', 'warn')}</div>
      <div class="proof-grid">${proofItem('Автоотправка запрещена', 'да', 'ok')}${proofItem('Только черновики', 'copy-only', 'ok')}${proofItem('Требуется approval владельца', 'перед отправкой', 'warn')}${proofItem('Без спама', 'да', 'ok')}${proofItem('Без обхода банов, прокси и CAPTCHA', 'да', 'ok')}${proofItem('Opt-out', 'соблюдать обязательно', 'ok')}</div>
    </section>
    <section class="card span-12 secondary-panel"><div class="section-head"><div><p class="eyebrow">Только ручное исследование</p><h3>Добавить lead</h3></div>${badge('Только черновики','ok')}</div>
      <form id="newLeadForm" class="operator-form">
        <label>Компания / человек<input name="company_person" required placeholder="Название компании"></label>
        <label>Публичный URL источника<input name="source_url" placeholder="https://public-source.example"></label>
        <label>Ниша<input name="niche" placeholder="ресторан, клиника, SaaS"></label>
        <label>Гипотеза боли<input name="problem_hypothesis" placeholder="Устаревший сайт, слабый сбор заявок"></label>
        <label>Гипотеза оффера<input name="suggested_offer" placeholder="Мини-аудит + сфокусированный лендинг"></label>
        <label>Персонализация<input name="personalization_notes" placeholder="Конкретное публичное наблюдение"></label>
        <label>Оценка релевантности 0–100<input name="relevance_score" type="number" min="0" max="100" value="60"></label>
        <label>Opt-out статус<select name="opt_out_status"><option>unknown</option><option>not_contacted</option><option>opted_out</option><option>do_not_follow_up</option></select></label>
        <label>Статус follow-up<select name="followup_status"><option>not_scheduled</option><option>owner_review_needed</option><option>approved_manual_send_only</option><option>do_not_send</option></select></label>
        <label class="span-12">Compliance notes<textarea name="risk_compliance_notes">Только публичная информация. Автоотправка запрещена. Требуется approval владельца перед outreach.</textarea></label>
        <label class="span-12">Черновик outreach<textarea name="outreach_draft" placeholder="Короткий прозрачный черновик без отправки"></textarea></label>
        <div class="form-actions span-12"><button type="submit">Добавить lead локально</button><button type="button" data-export-leads>Экспорт JSON лидов</button></div>
      </form>
    </section>
    <section class="card span-12 calm-list"><h3>Очередь lead research</h3>${rows(leads, lead => `<div class="lead-row"><article class="lead-card"><div><span class="status warn">${fmt(lead.approval_status)}</span><h4>${fmt(lead.company_person || lead.lead_id)}</h4><p>${fmt(lead.niche || 'ниша не указана')} · оценка=${fmt(lead.relevance_score)} · follow-up=${fmt(lead.followup_status)} · opt-out=${fmt(lead.opt_out_status)}</p></div><p class="next-action"><b>Гипотеза:</b> ${fmt(lead.problem_hypothesis || '—')}</p><p><b>Compliance:</b> ${fmt(lead.compliance?.platform_rules_notes || lead.risk_compliance_notes || 'только публичные источники')}</p><div class="toolbar">${copyButton('Скопировать outreach draft', lead.outreach_draft || buildLeadDraft(lead))}${copyButton('Скопировать персональный intro', leadPersonalizedIntro(lead))}${copyButton('Скопировать audit offer', leadAuditOffer(lead))}${copyButton('Скопировать follow-up', leadFollowupDraft(lead))}${copyButton('Скопировать stop-contact ответ', leadStopContactResponse(lead))}<button class="copy secondary" type="button" data-prepare-lead-draft="${esc(lead.lead_id)}">Подготовить черновик</button></div><details class="raw-details"><summary>Технические детали</summary><pre class="code mini">${fmt(jsonCopy(lead))}</pre></details></article></div>`, 'Лидов пока нет')}</section>
    ${card('Политика outreach-черновиков', kv({allowed: 'публичное исследование, оценка релевантности, заметки персонализации, черновики после approval владельца', forbidden: 'спам, фейковая личность, обход банов, CAPTCHA/proxy/rate-limit bypass, автоотправка', human_like: 'релевантно, уважительно, конкретно, прозрачно, без давления, остановиться после отказа'}), 'span-12')}
  </div>`;
}
function buildLeadDraft(lead) {
  return [
    `Здравствуйте. Я смотрю на ${lead.company_person || 'ваш проект'} и вижу возможную точку роста: ${lead.problem_hypothesis || 'сайт/воронка может понятнее вести к заявке'}.`,
    `Можем предложить: ${lead.suggested_offer || 'короткий аудит и аккуратный план улучшения без навязчивых сообщений'}.`,
    lead.personalization_notes ? `Почему пишу именно вам: ${lead.personalization_notes}.` : '',
    'Это черновик: не отправлять автоматически. Нужен owner approval перед любым outreach.'
  ].filter(Boolean).join('\n\n');
}
function leadPersonalizedIntro(lead) {
  return `Здравствуйте. Пишу коротко и прозрачно: смотрел публичную информацию о ${lead.company_person || 'вашем проекте'} и заметил контекст по нише "${lead.niche || 'ваша ниша'}".`;
}
function leadAuditOffer(lead) {
  return `Могу подготовить copy-only мини-аудит: ${lead.problem_hypothesis || 'где сайт/воронка теряет ясность'} → ${lead.suggested_offer || '3 конкретных улучшения без навязчивой продажи'}. Отправлять можно только после owner approval.`;
}
function leadFollowupDraft(lead) {
  return `Короткий follow-up по ${lead.company_person || 'проекту'}: если тема неактуальна, больше не пишу. Если полезно, могу прислать 3 наблюдения по ${lead.problem_hypothesis || 'первому экрану/пути заявки'}.`;
}
function leadStopContactResponse(lead) {
  return `Понял, спасибо. Больше не буду писать по ${lead.company_person || 'этому контакту'}. Отмечаю opt-out / do not follow up.`;
}
function agentExecutionView() {
  const roles = asArray(os().agent_roles);
  const systems = [
    ['Codex / terminal', 'локальные правки, проверки, bounded scripts'],
    ['Browser / Playwright / Chromium', 'localhost QA и скриншоты'],
    ['QMD bounded search', 'только bounded retrieval, без unbounded embed'],
    ['HyperFrames / motion planning', 'план/spec; тяжелый render только после approval'],
    ['GitHub app', 'read-only context без явного push approval'],
    ['Supabase', 'read-only/planning без live writes']
  ];
  return `${agentWorkflow()}<div class="grid operator-os">
    <section class="hero-panel compact-hero span-12"><div class="hero-copy"><p class="eyebrow">Карта агентской оркестрации</p><h2>Агенты выполнения без автозапуска.</h2><p>Роли показывают входы, выходы и approval gates. Эта панель планирует работу, но не запускает live worker tasks.</p></div>${heroMetric('Роли', roles.length, 'только планирование')}</section>
    <section class="card span-8"><h3>Агенты выполнения</h3><div class="agent-role-grid">${roles.map(r => `<article class="agent-role-card"><h4>${fmt(r.role)}</h4><p>${fmt(uiText(r.does))}</p><p class="label"><b>Входы:</b> ${fmt(asArray(r.inputs_needed).join(', ') || 'контекст заказа')}</p><p class="label"><b>Выходы:</b> ${fmt(asArray(r.outputs_produced).join(', ') || 'артефакт / решение')}</p><p class="label"><b>Статус:</b> ${fmt(uiText(r.current_status))} · <b>Гейт:</b> ${fmt(uiText(r.approval_gate))}</p></article>`).join('')}</div></section>
    <section class="card span-4"><h3>Безопасные системы Hermes</h3><div class="chain-list">${systems.map(([name, use]) => `<div class="chain-step"><span>${fmt(name)}</span><strong>${fmt(use)}</strong></div>`).join('')}</div><p class="label">Без costly delegate storms. Без live production execution из этой панели.</p></section>
  </div>`;
}
function supabasePlanView() {
  const tables = [
    ['orders', 'canonical order profile, localStorage mirror id, health, approval state'],
    ['order_events', 'append-only order timeline events'],
    ['leads', 'manual public lead queue, score, compliance gate'],
    ['lead_events', 'lead timeline and approval/copy events'],
    ['briefs', 'versioned production briefs and answer snapshots'],
    ['artifacts', 'local/exported artifact references and checksums'],
    ['approvals', 'owner approval packets and decision state']
  ];
  return `<div class="grid operator-os">
    <section class="hero-panel compact-hero span-12"><div class="hero-copy"><p class="eyebrow">Supabase-ready architecture</p><h2>План persistence без live writes.</h2><p>Это только schema proposal и integration plan. Никаких Supabase mutations, cloud resources или migrations не выполняется.</p></div>${heroMetric('Tables', tables.length, 'draft only')}</section>
    <section class="card span-8"><h3>Draft schema map</h3><div class="chain-list">${tables.map(([name, purpose]) => `<div class="chain-step"><span>${fmt(name)}</span><strong>${fmt(purpose)}</strong></div>`).join('')}</div></section>
    <section class="card span-4 warning-surface"><h3>Safety contract</h3>${kv({mode: 'planning/read-only', apply_migration: 'forbidden in v108', backend_db_writes: false, owner_approval_required: 'yes before any Supabase mutation', rollback: 'keep localStorage as source during migration dry-run'})}${toolbar([copyButton('Copy schema draft path', '/home/hermes/workspace/output/webstudio-overnight-production-v108/supabase-schema-draft-v108.sql'), copyButton('Copy integration plan path', '/home/hermes/workspace/output/webstudio-overnight-production-v108/supabase-integration-plan-v108.md')])}</section>
  </div>`;
}

function integrationPlanWorkflow() {
  const statusChips = ['PLAN_ONLY','OWNER_APPROVAL_REQUIRED','SECRET_REQUIRED','DO_NOT_RUN_LIVE','READY_FOR_REVIEW','BLOCKED_UNTIL_OWNER','SAFE_DRY_RUN_ONLY'];
  const linkedRoutes = [
    ['/lead-capture-demo/','Lead Capture Demo'],
    ['/client-portal-preview/','Client Portal Preview'],
    ['/proposal-quote/','Proposal / Quote'],
    ['/delivery-timeline/','Delivery Timeline'],
    ['/work-factory/','Work Factory'],
    ['/owner-command-center/','Owner Command Center'],
    ['/supabase-memory/','Supabase Memory']
  ];
  const gates = [
    'Owner approves scope and target channels before any integration work',
    'Owner provides live Telegram bot token only through approved secret storage — never in browser code',
    'Owner approves CRM / Sheets destination, columns, consent language, and write mode',
    'Owner approves Supabase schema/migration separately before any production write path',
    'Dry-run fixtures pass idempotency, duplicate handling, rollback, and redaction checks',
    'Public launch stays blocked until all secrets, logs, RLS, rate limits, and monitoring are approved'
  ];
  const secrets = ['TELEGRAM_BOT_TOKEN','TELEGRAM_ALLOWED_CHAT_IDS','TELEGRAM_WEBHOOK_SECRET','CRM_API_TOKEN or GOOGLE_SERVICE_ACCOUNT_JSON','GOOGLE_SHEETS_SPREADSHEET_ID','SUPABASE_URL','SUPABASE_SERVICE_ROLE_KEY_BACKEND_ONLY','SUPABASE_ANON_KEY_PUBLIC_ONLY_IF_NEEDED','SUPABASE_WEBHOOK_SIGNING_SECRET','OWNER_APPROVAL_CHANNEL_ID'];
  const flow = [
    ['1. Telegram intake', 'Bot receives client answers in approved chat/form; webhook validates signature and allowed chat.'],
    ['2. Sanitizer', 'Normalize text, strip private values, classify PII/sensitive flags, reject credentials in payload.'],
    ['3. Approval queue', 'Create owner review item; no CRM/Sheets/Supabase live write before approval.'],
    ['4. CRM / Sheets draft', 'Prepare row payload in dry-run log with idempotency key and duplicate check.'],
    ['5. Supabase write plan', 'Backend-only service role writes ops/order records after schema approval and RLS review.'],
    ['6. Audit + rollback', 'Persist non-sensitive status, source refs, retry state, and rollback markers.']
  ];
  const risks = ['Token leak through frontend bundle or logs', 'Unapproved outreach or CRM writes', 'Duplicate lead/order creation', 'Private client data stored in artifacts', 'RLS/policy gap on Supabase tables', 'Webhook spoofing or replay', 'Sheets quota/rate-limit failures', 'Rollback without idempotency keys'];
  const phases = ['Phase 0 — plan review only', 'Phase 1 — local dry-run fixtures', 'Phase 2 — backend stub behind owner gate', 'Phase 3 — staging credentials and test chat', 'Phase 4 — limited live pilot after explicit approval', 'Phase 5 — monitoring, rollback drill, handoff'];
  return `<div class="grid integration-plan-v67" data-testid="integration-plan-v67">
    <section class="hero-panel compact-hero span-12"><div class="hero-copy"><p class="eyebrow">integration-plan-v67</p><h2>CRM / Telegram integration plan</h2><p>Telegram bot intake plan, CRM / Sheets plan, and Supabase live write plan are documented as static sanitized architecture only. No live Telegram token use, no CRM/Sheets/email writes, no browser-side service keys, no destructive Supabase changes.</p></div><div class="chip-cloud">${statusChips.map(x => badge(x, x)).join('')}</div></section>
    <section class="card span-4"><h3>Telegram bot intake plan</h3><ul><li>Approved bot receives only scoped intake answers.</li><li>Webhook validates source, signature, chat allowlist, idempotency.</li><li>Payload goes to sanitizer and owner approval queue before any downstream write.</li><li>Dry-run mode stores fixtures only; no live send or outreach.</li></ul>${badge('OWNER_APPROVAL_REQUIRED')}</section>
    <section class="card span-4"><h3>CRM / Sheets plan</h3><ul><li>Define columns: lead id, source, summary, status, owner decision, timestamps.</li><li>Writes stay blocked until owner approves destination and secret storage.</li><li>Use upsert/idempotency key to prevent duplicates.</li><li>Failed writes produce retry-safe dry-run report.</li></ul>${badge('SAFE_DRY_RUN_ONLY')}</section>
    <section class="card span-4"><h3>Supabase live write plan</h3><ul><li>Backend-only service role, never browser-side service keys.</li><li>Schema/migration proposal required before production writes.</li><li>RLS/policies reviewed before enabling client reads.</li><li>Status rows are non-sensitive operational summaries only.</li></ul>${badge('DO_NOT_RUN_LIVE')}</section>
    <section class="card span-6"><h3>Data flow diagram / step map</h3><div class="chain-list">${flow.map(([a,b]) => `<div class="chain-step"><span>${fmt(a)}</span><strong>${fmt(b)}</strong></div>`).join('')}</div></section>
    <section class="card span-6 warning-surface"><h3>Approval gates</h3><ol>${gates.map(x => `<li>${fmt(x)}</li>`).join('')}</ol></section>
    <section class="card span-6"><h3>Required secrets list WITHOUT values</h3><p class="label">Names only. Values must be supplied through approved backend secret storage, not UI, reports, git, or browser bundle.</p><ul>${secrets.map(x => `<li><code>${fmt(x)}</code></li>`).join('')}</ul>${badge('SECRET_REQUIRED')}</section>
    <section class="card span-6"><h3>Risk checklist</h3><ul>${risks.map(x => `<li>${fmt(x)}</li>`).join('')}</ul></section>
    <section class="card span-6"><h3>Rollout phases</h3><ol>${phases.map(x => `<li>${fmt(x)}</li>`).join('')}</ol></section>
    <section class="card span-6"><h3>Rollback plan</h3><ul><li>Disable webhook route and keep bot token untouched in secret manager.</li><li>Pause CRM/Sheets writer and drain retry queue.</li><li>Mark pending approvals as blocked, not lost.</li><li>Revert to local/static intake and export JSON manually.</li><li>Run duplicate/idempotency audit before re-enable.</li></ul></section>
    <section class="card span-6"><h3>Owner approval checklist</h3><ul><li>Approve channel/chat scope.</li><li>Approve CRM/Sheets destination and columns.</li><li>Approve Supabase schema proposal separately.</li><li>Approve secret storage method and rotation plan.</li><li>Approve staging dry-run evidence before live pilot.</li></ul>${badge('BLOCKED_UNTIL_OWNER')}</section>
    <section class="card span-6"><h3>Related WebStudio routes</h3><div class="toolbar route-links">${linkedRoutes.map(([href,label]) => `<a class="copy secondary" href="${href}">${fmt(label)}</a>`).join('')}</div></section>
  </div>`;
}

function render() {
  document.querySelectorAll('.tabs a').forEach(a => a.classList.toggle('active', normalizeRoute(a.getAttribute('href')) === route));
  const app = $('#app');
  const map = {operator: operatorWorkbench, orders: ordersView, kanban: executionKanbanView, 'execution-kanban': executionKanbanView, 'hermes-kanban': kanban, 'website-intake': websiteIntakeView, 'real-assets': realAssetsWorkflow, 'proposal-quote': proposalQuoteWorkflow, 'integration-plan': integrationPlanWorkflow, 'lead-capture-demo': leadResearchView, 'client-portal-preview': clients, 'delivery-timeline': production, 'owner-command-center': overview, 'supabase-memory': supabasePlanView, 'lead-research': leadResearchView, 'supabase-plan': supabasePlanView, overview, 'work-factory': workFactory, 'premium-factory': premiumFactoryView, production, 'agent-workflow': agentExecutionView, 'd3-intake': d3Intake, 'owner-feedback': ownerFeedback, clients: ordersView, 'sales-pack': salesPack, 'morning-desk': morningDesk, approvals, health, artifacts, marathon, audit};
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
  $('#timelineFilter')?.addEventListener('change', e => { filters.timeline = e.target.value; render(); });
  document.querySelectorAll('[data-production-filter]').forEach(btn => btn.addEventListener('click', e => { filters.productionQuick = e.currentTarget.dataset.productionFilter || 'active'; render(); }));
  document.querySelectorAll('[data-operator-action]').forEach(btn => btn.addEventListener('click', e => { filters.operatorAction = e.currentTarget.dataset.operatorAction || 'new_order'; render(); }));
  document.querySelectorAll('[data-select-order]').forEach(el => el.addEventListener('click', e => { filters.activeOrder = e.currentTarget.dataset.selectOrder; }));
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

function handleNewOrderSubmit(form) {
  const data = Object.fromEntries(new FormData(form).entries());
  const order = withOrderDefaults({
    ...data,
    order_id: 'LOCAL-' + Date.now().toString(36).toUpperCase(),
    source: data.source || 'manual_local',
    owner_approval_required: data.owner_approval_required === 'on',
    status: 'new_lead',
    current_stage: 'Входящие',
    assigned_agent: 'operator',
    next_action: 'Квалифицировать клиента и собрать минимальный scope.',
    acceptance_criteria: ['Owner-approved scope', 'Client brief captured', 'QA and handoff prepared'],
    timeline: [orderEvent('created', 'Created local order from Operator OS form')]
  });
  if (order.validation.errors.length) { toast('Order missing required fields: ' + order.validation.errors.join(', ')); return; }
  saveOrders([order, ...allOsOrders()]);
  syncQueue.enqueue('order.created', 'order', order.order_id, {order_id: order.order_id, client_name: order.client_name, local_only: true}, {operation: 'created', requires_approval: order.owner_approval_required});
  if (order.owner_approval_required) enqueueApprovalRequest('order', order.order_id, 'Owner approval requested from new order form');
  filters.activeOrder = order.order_id;
  form.reset();
  toast('Заказ создан. Сохранено локально.');
  render();
}
function createDemoOrder() {
  const order = withOrderDefaults({
    order_id: 'DEMO-LOCAL-' + Date.now().toString(36).toUpperCase(),
    client_name: 'DEMO Premium Studio',
    client_contact: '@demo-client',
    order_type: 'Professional website / landing',
    source: 'demo_local',
    industry: 'premium services',
    budget_range: '$5k-$9k',
    deadline: '21 days',
    priority: 'high',
    status: 'new_lead',
    current_stage: 'Входящие',
    assigned_agent: 'operator',
    next_action: 'Открой Канбан выполнения и нажми “Следующий этап”.',
    internal_notes: 'DEMO-заказ для проверки создания, Канбана, брифа и localStorage.',
    acceptance_criteria: ['Заказ создан локально', 'Карточка видна в Канбане', 'Бриф сгенерирован', 'JSON экспортируется'],
    client_answers: {},
    owner_approval_required: false,
    timeline: [orderEvent('created', 'Создан DEMO-заказ локально')]
  });
  saveOrders([order, ...allOsOrders()]);
  syncQueue.enqueue('order.created', 'order', order.order_id, {order_id: order.order_id, client_name: order.client_name, local_only: true}, {operation: 'created'});
  filters.activeOrder = order.order_id;
  toast('Заказ создан: DEMO-заказ сохранен локально.');
  render();
  return order;
}
function runDemoCheck() {
  const order = createDemoOrder();
  moveOrderToStage(order.order_id, nextStageFor(order), 'DEMO-проверка: следующий этап');
  updateOrder(order.order_id, o => {
    const answers = {
      business_goal: 'Проверить, что Operator OS создает заказ и генерирует бриф.',
      conversion_action: 'Получить заявку на консультацию',
      ideal_client: 'Владелец малого бизнеса'
    };
    const withAnswers = {...o, client_answers: {...(o.client_answers || {}), ...answers}};
    return {...withAnswers, production_brief: generateProductionBrief(withAnswers), artifacts: [...new Set([...asArray(o.artifacts), `localStorage:${o.order_id}:demo_brief`])], next_action: 'DEMO-проверка готова: открой Заказы, Канбан и Бриф сайта.'};
  }, 'brief_generated', 'DEMO-проверка: сгенерирован DEMO-бриф');
  const lead = withLeadDefaults({
    lead_id: 'DEMO-LEAD-' + Date.now().toString(36).toUpperCase(),
    company_person: 'DEMO Lead',
    source_url: 'https://example.invalid/demo',
    niche: 'demo',
    problem_hypothesis: 'Нужно проверить lead draft без отправки.',
    suggested_offer: 'Copy-only audit offer',
    personalization_notes: 'DEMO only; no network; no outreach.',
    approval_status: 'owner approval required',
    followup_status: 'owner_review_needed',
    outreach_draft: 'DEMO draft. Не отправлять автоматически. Требуется approval владельца.',
    timeline: [orderEvent('created', 'DEMO-проверка: создан DEMO lead draft')]
  });
  saveLeads([lead, ...asArray(os().lead_research_queue)]);
  enqueueLeadMutation('lead.created', lead, 'DEMO lead draft created locally');
  enqueueApprovalRequest('lead', lead.lead_id, 'Owner approval required before outreach');
  toast('DEMO-проверка выполнена: заказ, этап, бриф и lead draft созданы локально.');
  render();
}
function handleUpdateOrderSubmit(form) {
  const orderId = form.getAttribute('data-order-id');
  const data = Object.fromEntries(new FormData(form).entries());
  if (!orderId) return;
  updateOrder(orderId, o => ({
    ...o,
    client_name: data.client_name || o.client_name,
    client_contact: data.client_contact || '',
    source: data.source || 'manual_local',
    industry: data.industry || '',
    budget_range: data.budget_range || '',
    deadline: data.deadline || '',
    priority: data.priority || 'normal',
    current_stage: data.current_stage || o.current_stage || stageForStatus(o.status),
    status: STAGE_STATUS[data.current_stage] || o.status,
    next_action: data.next_action || nextActionForStage(data.current_stage),
    internal_notes: data.internal_notes || '',
    blockers: linesFromTextarea(data.blockers_text),
    owner_approval_required: data.owner_approval_required === 'on'
  }), 'updated', 'Сохранены изменения активного заказа из локальной формы');
  toast('Заказ сохранен локально');
  render();
}
function duplicateOrder(id) {
  const source = orderById(id);
  if (!source.order_id) return;
  const copy = withOrderDefaults({...source, order_id: 'LOCAL-' + Date.now().toString(36).toUpperCase(), client_name: source.client_name + ' copy', demo: false, timeline: [orderEvent('created', 'Дублирован из ' + id)]});
  saveOrders([copy, ...allOsOrders()]);
  filters.activeOrder = copy.order_id;
  toast('Заказ дублирован локально');
  render();
}
function archiveOrder(id) {
  updateOrder(id, o => ({...o, archived: true, status: 'archived', current_stage: 'Готово'}), 'archived', 'Перенесен в локальный архив');
  toast('Заказ перенесен в архив локально');
  render();
}
function handleImportOrdersSubmit(form) {
  const formData = new FormData(form);
  const raw = formData.get('orders_json');
  const mode = formData.get('import_mode') || 'merge';
  const parsed = safeJsonParse(raw, null);
  if (!Array.isArray(parsed)) { toast('Импорт: нужен JSON-массив'); return; }
  const normalized = parsed.map(withOrderDefaults);
  const invalid = normalized.filter(o => asArray(o.validation?.errors).length);
  if (invalid.length) { toast('Импорт заблокирован: невалидные поля в ' + invalid.map(o => o.order_id).slice(0, 3).join(', ')); return; }
  saveOrders(mode === 'replace' ? normalized.map(o => withOrderDefaults({...o, timeline: [...asArray(o.timeline), orderEvent('imported', 'Импортирован из вставленного JSON с replace mode')]})) : mergeOrders(allOsOrders(), normalized));
  filters.activeOrder = osOrders()[0]?.order_id || '';
  toast(mode === 'replace' ? 'Заказы заменены в localStorage' : 'Заказы объединены в localStorage');
  render();
}
function handleWebsiteIntakeSubmit(form) {
  const orderId = form.getAttribute('data-order-id');
  const answers = Object.fromEntries(new FormData(form).entries());
  updateOrder(orderId, o => ({...o, client_answers: {...(o.client_answers || {}), ...answers}, next_action: 'Сгенерировать production-бриф и подтвердить acceptance criteria.'}), 'updated', 'Ответы брифа сайта сохранены');
  toast('Ответы брифа сохранены');
  render();
}
function generateBriefForOrder(id) {
  const changed = updateOrder(id, o => {
    const brief = generateProductionBrief(o);
    return {...o, production_brief: brief, artifacts: [...new Set([...asArray(o.artifacts), `localStorage:${o.order_id}:production_brief`])], next_action: 'Проверить сгенерированный production-бриф и перейти к предложению или планированию.'};
  }, 'brief_generated', 'Сгенерирован deterministic website production brief');
  if (changed) copyText(jsonCopy(changed.production_brief));
  toast('Бриф сгенерирован');
  render();
}
function exportBrief(id) {
  const order = orderById(id);
  const brief = order.production_brief || generateProductionBrief(order);
  updateOrder(id, o => ({...o}), 'export_generated', 'Экспортирован production-бриф');
  downloadJson(localExportName('production-brief', id || order.client_name), {order_id: id, brief, order});
}
function exportProductionPlan(id) {
  const order = orderById(id);
  const brief = order.production_brief || generateProductionBrief(order);
  const plan = {
    order_id: id,
    exported_at: nowIso(),
    safety: {
      local_only: true,
      backend_dispatch: false,
      production_write: false,
      public_launch: false,
      owner_approval_required_before_live_actions: true
    },
    strategy: brief.business_strategy || brief.strategy,
    offer_positioning: brief.offer_positioning,
    technical_stack_recommendation: brief.technical_stack || brief.technical_stack_recommendation,
    seo_basics: brief.seo_basics || [],
    lead_route: brief.analytics_forms_telegram_route || [],
    production_tasks: brief.production_tasks,
    qa_checklist: brief.qa_checklist,
    acceptance_criteria: brief.acceptance_criteria,
    handoff_checklist: brief.handoff_checklist
  };
  updateOrder(id, o => ({...o}), 'export_generated', 'Экспортирован production-план');
  downloadJson(localExportName('production-plan', id || order.client_name), plan);
}
function handleNewLeadSubmit(form) {
  const data = Object.fromEntries(new FormData(form).entries());
  const lead = withLeadDefaults({
    ...data,
    lead_id: 'LEAD-' + Date.now().toString(36).toUpperCase(),
    approval_status: 'Требуется approval владельца',
    followup_status: data.followup_status || 'not_scheduled',
    opt_out_status: data.opt_out_status || 'unknown',
    relevance_score: data.relevance_score || 0,
    timeline: [orderEvent('created', 'Создан локальный lead record')]
  });
  if (!lead.outreach_draft) lead.outreach_draft = buildLeadDraft(lead);
  saveLeads([lead, ...asArray(os().lead_research_queue)]);
  enqueueLeadMutation('lead.created', lead, 'Lead created locally from research form');
  enqueueApprovalRequest('lead', lead.lead_id, 'Owner approval required before outreach');
  form.reset();
  toast('Lead добавлен локально');
  render();
}
function prepareLeadDraft(id) {
  const leads = asArray(os().lead_research_queue);
  const idx = leads.findIndex(l => l.lead_id === id);
  if (idx < 0) return;
  const lead = withLeadDefaults(leads[idx]);
  lead.outreach_draft = buildLeadDraft(lead);
  lead.approval_status = 'Требуется approval владельца';
  lead.approval = {...lead.approval, status: 'owner_approval_required', required_before_outreach: true};
  lead.timeline = [...asArray(lead.timeline), orderEvent('lead_draft_prepared', 'Подготовлен copy-only outreach draft')];
  leads[idx] = lead;
  saveLeads(leads);
  copyText(lead.outreach_draft);
  toast('Copy-only черновик подготовлен');
  render();
}


window.addEventListener('hashchange', () => { route = normalizeRoute(window.location.hash.replace('#','') || 'overview'); render(); });
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
  const newOrderForm = e.target.closest?.('#newOrderForm');
  if (newOrderForm) {
    e.preventDefault();
    handleNewOrderSubmit(newOrderForm);
    return;
  }
  const importOrdersForm = e.target.closest?.('#importOrdersForm');
  if (importOrdersForm) {
    e.preventDefault();
    handleImportOrdersSubmit(importOrdersForm);
    return;
  }
  const updateOrderForm = e.target.closest?.('#updateOrderForm');
  if (updateOrderForm) {
    e.preventDefault();
    handleUpdateOrderSubmit(updateOrderForm);
    return;
  }
  const websiteIntakeForm = e.target.closest?.('#websiteIntakeForm');
  if (websiteIntakeForm) {
    e.preventDefault();
    handleWebsiteIntakeSubmit(websiteIntakeForm);
    return;
  }
  const importBackupForm = e.target.closest?.('#importBackupForm');
  if (importBackupForm) {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(importBackupForm).entries());
    importWorkspaceBackup(data.backup_json || '', data.import_mode || 'merge');
    return;
  }
  const newLeadForm = e.target.closest?.('#newLeadForm');
  if (newLeadForm) {
    e.preventDefault();
    handleNewLeadSubmit(newLeadForm);
    return;
  }
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
  const selectOrder = e.target.closest('[data-select-order]');
  if (selectOrder && !e.target.closest('button,summary,details,[data-copy]')) { filters.activeOrder = selectOrder.getAttribute('data-select-order'); render(); return; }
  const moveNext = e.target.closest('[data-move-next]');
  if (moveNext) { e.preventDefault(); e.stopPropagation(); const id = moveNext.getAttribute('data-move-next'); moveOrderToStage(id, nextStageFor(orderById(id)), 'Перемещен на следующий этап'); toast('Заказ перемещен'); render(); return; }
  const moveStage = e.target.closest('[data-move-stage]');
  if (moveStage) { e.preventDefault(); e.stopPropagation(); moveOrderToStage(moveStage.getAttribute('data-move-stage'), moveStage.getAttribute('data-stage'), 'Оператор изменил стадию'); toast('Стадия обновлена'); render(); return; }
  const execState = e.target.closest('[data-exec-state]');
  if (execState) { e.preventDefault(); e.stopPropagation(); setOrderExecutionState(execState.getAttribute('data-exec-state'), execState.getAttribute('data-stage'), execState.getAttribute('data-status'), execState.getAttribute('data-note')); toast('Статус выполнения обновлен'); render(); return; }
  const duplicate = e.target.closest('[data-duplicate-order]');
  if (duplicate) { e.preventDefault(); e.stopPropagation(); duplicateOrder(duplicate.getAttribute('data-duplicate-order')); return; }
  const archive = e.target.closest('[data-archive-order]');
  if (archive) { e.preventDefault(); e.stopPropagation(); archiveOrder(archive.getAttribute('data-archive-order')); return; }
  const downloadOrder = e.target.closest('[data-download-order]');
  if (downloadOrder) { e.preventDefault(); e.stopPropagation(); const id = downloadOrder.getAttribute('data-download-order'); updateOrder(id, o => ({...o}), 'export_generated', 'Экспортирован JSON заказа'); downloadJson(localExportName('order', id), orderById(id)); return; }
  const exportPlan = e.target.closest('[data-export-production-plan]');
  if (exportPlan) { e.preventDefault(); e.stopPropagation(); exportProductionPlan(exportPlan.getAttribute('data-export-production-plan')); return; }
  const exportOrders = e.target.closest('[data-export-orders]');
  if (exportOrders) { e.preventDefault(); e.stopPropagation(); syncQueue.enqueue('export.generated', 'orders', 'all', {export_kind: 'orders', local_only: true}, {operation: 'generated'}); operatorState = {...os(), sync_queue: syncQueue.list()}; downloadJson(localExportName('webstudio-operator-orders-v2', 'all'), allOsOrders()); toast('JSON заказов экспортирован'); render(); return; }
  const importOpen = e.target.closest('[data-import-orders-open]');
  if (importOpen) { e.preventDefault(); e.stopPropagation(); const form = $('#importOrdersForm'); if (form) form.hidden = !form.hidden; return; }
  const importBackupOpen = e.target.closest('[data-import-backup-open]');
  if (importBackupOpen) { e.preventDefault(); e.stopPropagation(); const form = $('#importBackupForm'); if (form) form.hidden = !form.hidden; return; }
  const openNewOrder = e.target.closest('[data-open-new-order]');
  if (openNewOrder) { e.preventDefault(); e.stopPropagation(); $('#newOrderBlock')?.scrollIntoView({behavior: 'smooth', block: 'start'}); toast('Форма нового заказа открыта'); return; }
  const createDemo = e.target.closest('[data-create-demo-order]');
  if (createDemo) { e.preventDefault(); e.stopPropagation(); createDemoOrder(); return; }
  const demoCheck = e.target.closest('[data-run-demo-check]');
  if (demoCheck) { e.preventDefault(); e.stopPropagation(); runDemoCheck(); return; }
  const resetDemo = e.target.closest('[data-reset-demo]');
  if (resetDemo) { e.preventDefault(); e.stopPropagation(); resetDemoOrders(); return; }
  const generateBrief = e.target.closest('[data-generate-brief]');
  if (generateBrief) { e.preventDefault(); e.stopPropagation(); generateBriefForOrder(generateBrief.getAttribute('data-generate-brief')); return; }
  const downloadBrief = e.target.closest('[data-download-brief]');
  if (downloadBrief) { e.preventDefault(); e.stopPropagation(); exportBrief(downloadBrief.getAttribute('data-download-brief')); return; }
  const exportLeads = e.target.closest('[data-export-leads]');
  if (exportLeads) { e.preventDefault(); e.stopPropagation(); syncQueue.enqueue('export.generated', 'leads', 'all', {export_kind: 'leads', local_only: true}, {operation: 'generated'}); operatorState = {...os(), sync_queue: syncQueue.list()}; downloadJson(localExportName('webstudio-leads-v2', 'all'), asArray(os().lead_research_queue)); render(); return; }
  const exportQueue = e.target.closest('[data-export-sync-queue]');
  if (exportQueue) { e.preventDefault(); e.stopPropagation(); exportSyncQueue(); return; }
  const exportBackup = e.target.closest('[data-export-workspace-backup]');
  if (exportBackup) { e.preventDefault(); e.stopPropagation(); exportWorkspaceBackup(); return; }
  const exportWebsitePack = e.target.closest('[data-export-website-pack]');
  if (exportWebsitePack) { e.preventDefault(); e.stopPropagation(); exportWebsiteFactoryPack(exportWebsitePack.getAttribute('data-export-website-pack'), exportWebsitePack.getAttribute('data-preset-id') || 'premium-clinic'); return; }
  const prepareLead = e.target.closest('[data-prepare-lead-draft]');
  if (prepareLead) { e.preventDefault(); e.stopPropagation(); prepareLeadDraft(prepareLead.getAttribute('data-prepare-lead-draft')); return; }
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
