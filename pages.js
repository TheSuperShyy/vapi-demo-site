// Dashboard pages: Overview, Calls, Voice Agent, Settings.
import { registerPage, render, t, I18N, lang, escapeHtml, pageHead, toast, sk, store, applyLang, applyTheme, currentTheme, toggleTheme, authRequired, showLogin, signOut } from './app.js';

const $ = (id) => document.getElementById(id);

// Same assistant as api/config.js. A Vapi PUBLIC key is built to ship to browsers.
const PUBLIC_KEY = '59fd1b6b-f27d-47ce-ab5b-ff7ccd56277e';
const ASSISTANT_ID = '1c759c79-2692-43f0-b049-d1ffa363d386';

// ------------------------------------------------------------------ strings

Object.assign(I18N.en, {
  'stat.total': 'Total calls', 'stat.total.sub': 'all time',
  'stat.completed': 'Completed', 'stat.live': 'in progress', 'stat.avg': 'Avg length',
  'stat.cost': 'Total cost', 'stat.yes': 'Said yes', 'stat.yes.sub': 'of answered',
  'card.week': 'Calls', 'card.intent': 'Intent', 'card.recent': 'Recent calls', 'see.all': 'See all',
  'intent.yes': 'Will vote', 'intent.no': 'Will not vote', 'intent.unsure': 'Unsure',
  'intent.refused': 'Refused', 'intent.not_reached': 'Not reached', 'intent.unknown': 'No analysis',
  'src.web': 'Browser', 'src.phone': 'Phone',
  'status.live': 'Live', 'status.ended': 'Ended', 'status.failed': 'Failed', 'status.queued': 'Queued',
  'empty.calls': 'No calls yet. Open the Voice Agent page and press the button.',
  'empty.search': 'Nothing matches your search.',
  'unit.calls': 'calls',
  'day.0': 'Sun', 'day.1': 'Mon', 'day.2': 'Tue', 'day.3': 'Wed', 'day.4': 'Thu', 'day.5': 'Fri', 'day.6': 'Sat',
  'col.status': 'Status', 'col.source': 'Source', 'col.started': 'Started', 'col.length': 'Length', 'col.intent': 'Intent', 'col.cost': 'Cost',
  'detail.pick': 'Select a call to read the conversation', 'detail.title': 'Conversation', 'detail.empty': 'No transcript for this call',
  'detail.live': 'Call in progress…', 'detail.recording': 'Recording', 'detail.analysis': 'Analysis', 'detail.summary': 'Summary',
  'detail.reason': 'Reason', 'detail.verbatim': 'In their words', 'detail.flags': 'Flags', 'detail.ended': 'Ended because',
  'flag.optout': 'Asked to be removed', 'flag.bot': 'Asked if bot', 'flag.quality': 'Call quality issue',
  'who.agent': 'Shir', 'who.user': 'Customer', 'who.you': 'You',
  'reason.no_trust_in_politicians': 'No trust in politicians', 'reason.not_interested_in_politics': 'Not interested in politics',
  'reason.no_suitable_option': 'No suitable option', 'reason.deliberate_protest': 'Deliberate protest', 'reason.abroad_or_away': 'Abroad or away',
  'reason.health_or_mobility': 'Health or mobility', 'reason.logistics_polling_station': 'Polling station logistics', 'reason.work_or_schedule': 'Work or schedule',
  'reason.declined_to_say': 'Declined to say', 'reason.other': 'Other', 'reason.not_applicable': '—',
  'agent.talk': 'Talk to me', 'agent.end': 'End', 'agent.ready': 'Ready. Microphone permission needed.', 'agent.connecting': 'Connecting…',
  'agent.connected': 'Connected', 'agent.connected.sub': 'speak or type', 'agent.ended': 'Call ended. Start again whenever.',
  'agent.mic.blocked': 'The browser blocked the microphone. Allow access and try again.', 'agent.start.failed': 'Could not start the call. Try refreshing.',
  'agent.error': 'The call hit an error. Try again.', 'agent.type': 'Or just type here. English works too, she answers in Hebrew.',
  'agent.send': 'Send', 'agent.voice': 'Voice', 'agent.speed': 'Speed', 'agent.note': 'Runs in the browser through your microphone. Nobody is phoned. Works best in Chrome.',
  'agent.saved': 'Call saved. It will appear in Calls in a moment.',
  'set.appearance': 'Appearance', 'set.theme': 'Light theme', 'set.theme.sub': 'Dark is the default', 'set.lang': 'Language', 'set.lang.sub': 'English or Hebrew, layout flips with it',
  'set.assistant': 'Assistant', 'set.name': 'Name', 'set.transcriber': 'Transcriber', 'set.voice': 'Voice', 'set.model': 'Model', 'set.first': 'First message', 'set.updated': 'Last updated',
  'set.password': 'Dashboard password', 'set.password.sub': 'Signed in on this browser', 'set.signout': 'Sign out',
});
Object.assign(I18N.he, {
  'stat.total': 'סך שיחות', 'stat.total.sub': 'מאז ומתמיד',
  'stat.completed': 'הסתיימו', 'stat.live': 'בשיחה', 'stat.avg': 'אורך ממוצע',
  'stat.cost': 'עלות כוללת', 'stat.yes': 'ענו כן', 'stat.yes.sub': 'מתוך שענו',
  'card.week': 'שיחות', 'card.intent': 'כוונת הצבעה', 'card.recent': 'שיחות אחרונות', 'see.all': 'הצג הכל',
  'intent.yes': 'יצביעו', 'intent.no': 'לא יצביעו', 'intent.unsure': 'לא בטוחים',
  'intent.refused': 'סירבו', 'intent.not_reached': 'לא הושגו', 'intent.unknown': 'ללא ניתוח',
  'src.web': 'דפדפן', 'src.phone': 'טלפון',
  'status.live': 'פעילה', 'status.ended': 'הסתיימה', 'status.failed': 'נכשלה', 'status.queued': 'בתור',
  'empty.calls': 'עדיין אין שיחות. פתחו את עמוד הסוכן הקולי ולחצו על הכפתור.',
  'empty.search': 'אין תוצאות לחיפוש.',
  'unit.calls': 'שיחות',
  'day.0': 'א׳', 'day.1': 'ב׳', 'day.2': 'ג׳', 'day.3': 'ד׳', 'day.4': 'ה׳', 'day.5': 'ו׳', 'day.6': 'ש׳',
  'col.status': 'סטטוס', 'col.source': 'מקור', 'col.started': 'התחילה', 'col.length': 'אורך', 'col.intent': 'כוונה', 'col.cost': 'עלות',
  'detail.pick': 'בחרו שיחה כדי לקרוא את השיחה', 'detail.title': 'השיחה', 'detail.empty': 'אין תמלול לשיחה הזאת',
  'detail.live': 'השיחה בעיצומה…', 'detail.recording': 'הקלטה', 'detail.analysis': 'ניתוח', 'detail.summary': 'סיכום',
  'detail.reason': 'סיבה', 'detail.verbatim': 'במילים שלהם', 'detail.flags': 'דגלים', 'detail.ended': 'הסתיימה כי',
  'flag.optout': 'ביקשו הסרה', 'flag.bot': 'שאלו אם בוט', 'flag.quality': 'בעיית איכות',
  'who.agent': 'שיר', 'who.user': 'לקוח', 'who.you': 'אתה',
  'reason.no_trust_in_politicians': 'אין אמון בפוליטיקאים', 'reason.not_interested_in_politics': 'לא מתעניינים בפוליטיקה',
  'reason.no_suitable_option': 'אין למי להצביע', 'reason.deliberate_protest': 'מחאה מכוונת', 'reason.abroad_or_away': 'בחו״ל או לא בעיר',
  'reason.health_or_mobility': 'בריאות או ניידות', 'reason.logistics_polling_station': 'קלפי רחוקה או לא נגישה', 'reason.work_or_schedule': 'עבודה או לוח זמנים',
  'reason.declined_to_say': 'לא רצו לומר', 'reason.other': 'אחר', 'reason.not_applicable': '—',
  'agent.talk': 'דבר איתי', 'agent.end': 'סיים', 'agent.ready': 'מוכן. צריך אישור למיקרופון.', 'agent.connecting': 'מתחבר…',
  'agent.connected': 'מחובר', 'agent.connected.sub': 'דבר או כתוב', 'agent.ended': 'השיחה הסתיימה. אפשר להתחיל שוב.',
  'agent.mic.blocked': 'הדפדפן חסם את המיקרופון. אשרו גישה ונסו שוב.', 'agent.start.failed': 'לא הצלחנו להתחיל את השיחה. נסו לרענן.',
  'agent.error': 'נפלה שגיאה בשיחה. נסו שוב.', 'agent.type': 'או פשוט תכתבו פה. גם באנגלית, היא עונה בעברית.',
  'agent.send': 'שלח', 'agent.voice': 'קול', 'agent.speed': 'קצב', 'agent.note': 'רץ בדפדפן דרך המיקרופון. לא מתקשרים לאף אחד. עובד הכי טוב בכרום.',
  'agent.saved': 'השיחה נשמרה. היא תופיע בעמוד השיחות בעוד רגע.',
  'set.appearance': 'מראה', 'set.theme': 'ערכת נושא בהירה', 'set.theme.sub': 'כהה היא ברירת המחדל', 'set.lang': 'שפה', 'set.lang.sub': 'אנגלית או עברית, הפריסה מתהפכת בהתאם',
  'set.assistant': 'הסוכנת', 'set.name': 'שם', 'set.transcriber': 'תמלול', 'set.voice': 'קול', 'set.model': 'מודל', 'set.first': 'משפט פתיחה', 'set.updated': 'עודכן לאחרונה',
  'set.password': 'סיסמת דשבורד', 'set.password.sub': 'מחוברים בדפדפן הזה', 'set.signout': 'התנתקות',
});

// ------------------------------------------------------------------ data

export async function api(path, init = {}) {
  const headers = { ...(init.headers ?? {}) };
  const pw = store.get('dash_pw', '');
  if (pw) headers.Authorization = `Bearer ${pw}`;
  const res = await fetch(path, { ...init, headers });
  if (res.status === 401) {
    // Discard only the password this request was sent with, so a stale 401 cannot
    // wipe one the user has just typed on the login screen.
    if (store.get('dash_pw', '') === pw) store.del('dash_pw');
    showLogin();
    throw new Error('unauthorized');
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || res.statusText);
  return data;
}

const cache = { calls: null, config: null, at: 0, detail: new Map() };
async function loadCalls(force = false) {
  if (!force && cache.calls && Date.now() - cache.at < 4000) return cache.calls;
  cache.calls = await api('/api/calls?limit=200');
  cache.at = Date.now();
  return cache.calls;
}
async function loadConfig() {
  if (cache.config) return cache.config;
  cache.config = await api('/api/config');
  const name = cache.config.assistantName || '—';
  $('agentname').textContent = name;
  $('avatar').textContent = name.split(/[\s-]+/).filter(Boolean).slice(0, 2).map((w) => w[0]).join('').toUpperCase();
  return cache.config;
}
async function loadDetail(id, force = false) {
  const hit = cache.detail.get(id);
  if (!force && hit && (hit.endedAt || Date.now() - hit._at < 4000)) return hit;
  const d = await api(`/api/calls/${encodeURIComponent(id)}`);
  d._at = Date.now();
  cache.detail.set(id, d);
  return d;
}
const invalidate = () => { cache.calls = null; cache.detail.clear(); };

// ------------------------------------------------------------------ formatting

const fmtDur = (a, b) => {
  if (!a || !b) return '—';
  const s = Math.max(0, Math.round((new Date(b) - new Date(a)) / 1000));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
};
const fmtTime = (iso) => iso
  ? new Date(iso).toLocaleString(lang === 'he' ? 'he-IL' : 'en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
  : '—';
const money = (n) => '$' + (n || 0).toFixed(2);
const statusOf = (c) => {
  if (!c.endedAt && ['in-progress', 'ringing', 'queued'].includes(c.status)) return 'live';
  if (/error|did-not-answer|busy|failed/.test(c.endedReason || '')) return 'failed';
  return c.endedAt ? 'ended' : 'queued';
};
const dotClass = (c) => ({ live: 'live', failed: 'fail', ended: 'ended', queued: '' })[statusOf(c)];
const srcOf = (c) => (c.type === 'webCall' ? t('src.web') : c.number || t('src.phone'));
const INTENT_ORDER = ['yes', 'no', 'unsure', 'refused', 'not_reached', 'unknown'];
const INTENT_TONE = { yes: 'positive', no: 'negative', unsure: 'accent', refused: '', not_reached: '', unknown: '' };
const INTENT_COLOR = { yes: 'var(--positive)', no: 'var(--negative)', unsure: 'var(--accent)', refused: 'var(--text-2)', not_reached: 'var(--text-3)', unknown: 'var(--border-2)' };
const intentKey = (c) => (INTENT_ORDER.includes(c.intent) ? c.intent : 'unknown');
const intentBadge = (c) => `<span class="badge ${INTENT_TONE[intentKey(c)]}">${t('intent.' + intentKey(c))}</span>`;
const reasonLabel = (k) => (k ? t('reason.' + k) : '—');

// ------------------------------------------------------------------ topbar search

let query = '';
$('search').oninput = () => {
  query = $('search').value.trim().toLowerCase();
  if (!location.hash.startsWith('#/calls')) location.hash = '#/calls';
  else render();
};
const matches = (c) => !query || [c.id, c.number, srcOf(c), t('intent.' + intentKey(c)), c.endedReason].filter(Boolean).some((v) => String(v).toLowerCase().includes(query));

// ------------------------------------------------------------------ overview

let range = Number(store.get('range', '7'));
$('rangetabs').querySelectorAll('button').forEach((b) => {
  b.classList.toggle('on', Number(b.dataset.range) === range);
  b.onclick = () => { range = Number(b.dataset.range); store.set('range', String(range)); $('rangetabs').querySelectorAll('button').forEach((x) => x.classList.toggle('on', x === b)); render(); };
});

const rings = () => `<svg class="stat-rings" aria-hidden="true" viewBox="0 0 320 190" preserveAspectRatio="xMidYMid slice">${
  [0,1,2,3,4,5,6,7].map((i) => `<circle cx="265" cy="30" r="${18 + i * 24}" fill="none" stroke="var(--text-1)" stroke-opacity="${(0.05 - i * 0.004).toFixed(3)}" stroke-width="13"/>`).join('')}</svg>`;

const statTile = ({ label, value, sub, hero }) => `<div class="stat${hero ? ' hero' : ''}">${hero ? rings() : ''}
  <div class="stat-label">${label}</div><div class="stat-value">${value}</div>
  <div class="stat-foot">${sub ? `<span class="stat-sub">${sub}</span>` : ''}</div></div>`;

function dayBuckets(calls, days) {
  const now = new Date(); now.setHours(0, 0, 0, 0);
  const buckets = [];
  for (let i = days - 1; i >= 0; i--) { const d = new Date(now); d.setDate(now.getDate() - i); buckets.push({ date: d, n: 0 }); }
  const start = buckets[0].date.getTime();
  for (const c of calls) {
    const d = new Date(c.createdAt); d.setHours(0, 0, 0, 0);
    const idx = Math.round((d.getTime() - start) / 86400000);
    if (idx >= 0 && idx < days) buckets[idx].n++;
  }
  return buckets;
}

function barChart(buckets) {
  const w = 900, h = 190, pad = 22;
  const max = Math.max(1, ...buckets.map((b) => b.n));
  const n = buckets.length, slot = w / n, bw = Math.min(46, slot * 0.58);
  const bars = buckets.map((b, i) => {
    const bh = b.n ? Math.max(4, (b.n / max) * (h - pad - 6)) : 3;
    const x = i * slot + (slot - bw) / 2, y = h - bh;
    return `<rect x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="${bw.toFixed(1)}" height="${bh.toFixed(1)}" rx="6" fill="${b.n ? 'var(--chart-line)' : 'var(--chart-grid)'}"/>` +
      (b.n ? `<text x="${(x + bw / 2).toFixed(1)}" y="${(y - 7).toFixed(1)}" text-anchor="middle" font-size="11" fill="var(--text-2)" font-family="var(--font-ui)">${b.n}</text>` : '');
  }).join('');
  const grid = [0.33, 0.66].map((f) => `<line x1="0" x2="${w}" y1="${(h * f).toFixed(1)}" y2="${(h * f).toFixed(1)}" stroke="var(--chart-grid)"/>`).join('');
  const k = n > 45 ? 10 : n > 14 ? 5 : 1;
  const labels = buckets.map((b, i) => `<span style="flex:1;text-align:center">${n <= 7 ? t('day.' + b.date.getDay()) : (i % k === 0 ? b.date.getDate() : '')}</span>`).join('');
  return `<svg class="chart" viewBox="0 0 ${w} ${h}" preserveAspectRatio="none">${grid}${bars}</svg><div class="chart-axis">${labels}</div>`;
}

function donut(counts, total) {
  const r = 54, c = 2 * Math.PI * r;
  let offset = 0;
  const arcs = INTENT_ORDER.filter((k) => counts[k]).map((k) => {
    const len = counts[k] / total * c;
    const el = `<circle r="${r}" cx="70" cy="70" fill="none" stroke="${INTENT_COLOR[k]}" stroke-width="16" stroke-dasharray="${len.toFixed(2)} ${(c - len).toFixed(2)}" stroke-dashoffset="${(-offset).toFixed(2)}" transform="rotate(-90 70 70)"/>`;
    offset += len; return el;
  }).join('');
  const legend = INTENT_ORDER.filter((k) => counts[k]).map((k) => `
    <div style="display:flex;align-items:center;gap:10px;font-size:12px">
      <span class="dot" style="background:${INTENT_COLOR[k]}"></span>
      <span style="flex:1;color:var(--text-2)">${t('intent.' + k)}</span>
      <b style="font-weight:600">${counts[k]}</b>
      <span class="faint" style="min-width:34px;text-align:end">${Math.round(counts[k] / total * 100)}%</span></div>`).join('');
  return `<div style="display:flex;gap:20px;align-items:center;flex-wrap:wrap">
    <svg width="140" height="140" viewBox="0 0 140 140" style="flex:none">
      <circle r="${r}" cx="70" cy="70" fill="none" stroke="var(--chart-grid)" stroke-width="16"/>${arcs}
      <text x="70" y="66" text-anchor="middle" font-size="22" font-weight="600" fill="var(--text-1)" font-family="var(--font-ui)">${total}</text>
      <text x="70" y="84" text-anchor="middle" font-size="10" fill="var(--text-3)" font-family="var(--font-ui)">${t('unit.calls')}</text></svg>
    <div style="flex:1;min-width:180px;display:flex;flex-direction:column;gap:8px">${legend}</div></div>`;
}

const recentRows = (calls) => !calls.length ? `<div class="page-empty">${t('empty.calls')}</div>` : `<div class="rows">${calls.map((c) => `
  <div class="row" data-id="${c.id}">
    <span class="dot ${dotClass(c)}"></span>
    <div class="row-main">
      <div class="row-title">${escapeHtml(srcOf(c))} <span class="faint" style="font-weight:400">· ${t('status.' + statusOf(c))}</span></div>
      <div class="row-sub">${fmtTime(c.createdAt)}</div></div>
    ${intentBadge(c)}
    <div class="row-end"><div class="row-val mono">${fmtDur(c.startedAt, c.endedAt)}</div><div class="row-sub">${money(c.cost)}</div></div>
  </div>`).join('')}</div>`;

const twoCol = () => (innerWidth < 1100 ? '1fr' : '1fr 380px');

registerPage('overview', {
  skeleton: () => `
    <div class="stat-row">${sk.stat(true)}${sk.stat()}${sk.stat()}${sk.stat()}${sk.stat()}</div>
    <div class="grid" style="grid-template-columns:${twoCol()}">
      ${sk.card(`${sk.line('w30')}<div class="skeleton skel-block" style="margin-top:16px"></div>`)}
      ${sk.card(`${sk.line('w30')}<div style="display:flex;gap:20px;align-items:center;margin-top:16px"><div class="skeleton skel-circle"></div><div style="flex:1">${sk.line()}${sk.line('w70')}${sk.line('w50')}</div></div>`)}
    </div>
    ${sk.card(`${sk.line('w30')}${sk.rows(4)}`)}`,
  async load() {
    const [calls] = await Promise.all([loadCalls(), loadConfig().catch(() => null)]);
    const ended = calls.filter((c) => c.endedAt);
    const live = calls.filter((c) => statusOf(c) === 'live').length;
    const secs = ended.map((c) => (new Date(c.endedAt) - new Date(c.startedAt)) / 1000).filter((n) => n > 0);
    const avg = secs.length ? secs.reduce((a, b) => a + b, 0) / secs.length : 0;
    const cost = calls.reduce((a, c) => a + (c.cost || 0), 0);
    const counts = {}; for (const c of calls) counts[intentKey(c)] = (counts[intentKey(c)] || 0) + 1;
    const answered = (counts.yes || 0) + (counts.no || 0) + (counts.unsure || 0);
    const yesPct = answered ? Math.round((counts.yes || 0) / answered * 100) : 0;
    const buckets = dayBuckets(calls, range);
    const inRange = buckets.reduce((a, b) => a + b.n, 0);
    const html = pageHead('page.overview', 'page.overview.sub') + `
      <div class="stat-row">
        ${statTile({ hero: true, label: t('stat.total'), value: calls.length, sub: t('stat.total.sub') })}
        ${statTile({ label: t('stat.completed'), value: ended.length, sub: live ? `${live} ${t('stat.live')}` : '' })}
        ${statTile({ label: t('stat.avg'), value: `${Math.floor(avg / 60)}:${String(Math.round(avg % 60)).padStart(2, '0')}` })}
        ${statTile({ label: t('stat.cost'), value: money(cost) })}
        ${statTile({ label: t('stat.yes'), value: `${yesPct}%`, sub: `${counts.yes || 0}/${answered} ${t('stat.yes.sub')}` })}
      </div>
      <div class="grid" style="grid-template-columns:${twoCol()}">
        <div class="card"><div class="card-head"><span class="card-title">${t('card.week')} <span class="count">· ${inRange} ${t('unit.calls')}</span></span><span class="badge">${range}d</span></div>${barChart(buckets)}</div>
        <div class="card"><div class="card-head"><span class="card-title">${t('card.intent')}</span></div>${calls.length ? donut(counts, calls.length) : `<div class="page-empty">${t('empty.calls')}</div>`}</div>
      </div>
      <div class="card"><div class="card-head"><span class="card-title">${t('card.recent')}</span><a class="btn secondary sm" href="#/calls">${t('see.all')}</a></div>${recentRows(calls.slice(0, 8))}</div>`;
    return { html, mount(main) {
      main.querySelectorAll('.row[data-id]').forEach((el) => { el.onclick = () => { location.hash = `#/calls/${el.dataset.id}`; }; });
    } };
  },
});

// ------------------------------------------------------------------ calls

function callsTable(calls, selectedId) {
  if (!calls.length) return `<div class="page-empty">${query ? t('empty.search') : t('empty.calls')}</div>`;
  return `<div style="overflow-x:auto"><table class="table">
    <thead><tr><th>${t('col.status')}</th><th>${t('col.source')}</th><th>${t('col.started')}</th><th>${t('col.length')}</th><th>${t('col.intent')}</th><th class="end">${t('col.cost')}</th></tr></thead>
    <tbody>${calls.map((c) => `<tr class="clickable${c.id === selectedId ? ' on' : ''}" data-id="${c.id}">
      <td><span style="display:inline-flex;align-items:center;gap:8px"><span class="dot ${dotClass(c)}"></span>${t('status.' + statusOf(c))}</span></td>
      <td>${escapeHtml(srcOf(c))}</td><td class="faint">${fmtTime(c.createdAt)}</td>
      <td class="mono">${fmtDur(c.startedAt, c.endedAt)}</td><td>${intentBadge(c)}</td><td class="end mono">${money(c.cost)}</td></tr>`).join('')}</tbody></table></div>`;
}

const bubble = (role, text, partial = false) => `<div class="turn ${role === 'user' ? 'user' : ''}"><div class="bubble${partial ? ' partial' : ''}">
  <div class="who">${role === 'user' ? t('who.user') : t('who.agent')}</div><div class="say" dir="auto">${escapeHtml(text)}</div></div></div>`;

function detailPanel(d) {
  if (!d) return `<div class="card"><div class="page-empty">${t('detail.pick')}</div></div>`;
  const sd = d.analysis?.structuredData;
  const flags = sd ? [
    sd.opt_out_requested && `<span class="badge negative">${t('flag.optout')}</span>`,
    sd.asked_if_bot && `<span class="badge accent">${t('flag.bot')}</span>`,
    sd.call_quality_ok === false && `<span class="badge">${t('flag.quality')}</span>`,
  ].filter(Boolean).join('') : '';
  // Vapi stores the agent's speech as one message per TTS chunk ("היי", "מדברת שיר", …).
  // Merge consecutive same-speaker fragments so it reads like a conversation.
  const turns = [];
  for (const m of d.messages) {
    const last = turns[turns.length - 1];
    if (last && last.role === m.role) last.text += (/^[.,!?]/.test(m.text) ? '' : ' ') + m.text;
    else turns.push({ role: m.role, text: m.text });
  }
  const convo = turns.length
    ? `<div class="convo">${turns.map((m) => bubble(m.role, m.text.trim())).join('')}</div>`
    : `<div class="page-empty">${d.endedAt ? t('detail.empty') : t('detail.live')}</div>`;
  return `<div class="card">
    <div class="detail-head">
      <span class="card-title">${t('detail.title')} <span class="count">· ${escapeHtml(srcOf(d))} · ${fmtTime(d.createdAt)}</span></span>
      <span style="display:inline-flex;gap:8px;align-items:center">${intentBadge(d)}<span class="mono faint">${fmtDur(d.startedAt, d.endedAt)} · ${money(d.cost)}</span></span>
    </div>
    ${d.recordingUrl ? `<audio controls preload="none" src="${escapeHtml(d.recordingUrl)}"></audio>` : ''}
    ${convo}
    ${sd || d.analysis?.summary ? `<div class="card nested" style="margin-top:16px">
      <div class="card-head" style="margin-bottom:12px"><span class="card-title" style="font-size:13px">${t('detail.analysis')}</span>${flags ? `<span class="flags">${flags}</span>` : ''}</div>
      <div class="analysis-grid">
        ${sd ? `<div><div class="k">${t('col.intent')}</div>${intentBadge(d)}</div>
        <div><div class="k">${t('detail.reason')}</div>${escapeHtml(reasonLabel(sd.reason_category))}</div>` : ''}
        ${sd?.reason_verbatim ? `<div style="grid-column:1/-1"><div class="k">${t('detail.verbatim')}</div><div class="verbatim" dir="auto">${escapeHtml(sd.reason_verbatim)}</div></div>` : ''}
        ${d.analysis?.summary ? `<div style="grid-column:1/-1"><div class="k">${t('detail.summary')}</div><div class="summary">${escapeHtml(d.analysis.summary)}</div></div>` : ''}
        ${d.endedReason ? `<div><div class="k">${t('detail.ended')}</div><span class="mono faint">${escapeHtml(d.endedReason)}</span></div>` : ''}
      </div></div>` : ''}
  </div>`;
}

registerPage('calls', {
  skeleton: (params) => `<div class="split">${sk.card(sk.rows(7))}${sk.card(params[0] ? `${sk.line('w50')}${sk.rows(4)}` : `<div class="page-empty">${t('detail.pick')}</div>`)}</div>`,
  async load(params) {
    const id = params[0] || null;
    const [all, detail] = await Promise.all([loadCalls(), id ? loadDetail(id).catch((e) => ({ error: e.message })) : null]);
    const calls = all.filter(matches);
    const html = pageHead('page.calls', 'page.calls.sub', `<span class="badge">${calls.length} ${t('unit.calls')}</span>`) + `
      <div class="split">
        <div class="card" style="padding:12px 8px 8px">${callsTable(calls, id)}</div>
        ${detail?.error ? `<div class="card"><div class="page-empty">${escapeHtml(detail.error)}</div></div>` : detailPanel(detail)}
      </div>`;
    return { html, mount(main) {
      main.querySelectorAll('tr[data-id]').forEach((tr) => { tr.onclick = () => { location.hash = `#/calls/${tr.dataset.id}`; }; });
      if (detail && !detail.endedAt) setTimeout(() => { if (location.hash === `#/calls/${id}`) render(); }, 5000);
    } };
  },
});

// ------------------------------------------------------------------ voice agent

const VOICES = [
  { id: 'azure:he-IL-HilaNeural', label: 'Hila · Azure (native)', provider: 'azure', voiceId: 'he-IL-HilaNeural' },
  { id: 'azure:he-IL-AvriNeural', label: 'Avri · Azure (native, male)', provider: 'azure', voiceId: 'he-IL-AvriNeural' },
  { id: 'openai:shimmer', label: 'Shimmer · OpenAI', provider: 'openai', voiceId: 'shimmer' },
  { id: 'openai:nova', label: 'Nova · OpenAI', provider: 'openai', voiceId: 'nova' },
  { id: 'openai:alloy', label: 'Alloy · OpenAI', provider: 'openai', voiceId: 'alloy' },
];

// The SDK instance and call state outlive the page so navigating away mid-call
// does not drop the call; coming back re-binds the UI to the live state.
const agent = { vapi: null, live: false, partial: null, feedHtml: '', log: [] };
const dlog = (m) => { agent.log.push(m); console.log('[agent]', m); const d = $('diag'); if (d) d.textContent = agent.log.join('\n'); };

async function getVapi() {
  if (agent.vapi) return agent.vapi;
  dlog('importing SDK...');
  const mod = await import('./vendor/vapi.js');
  const Vapi = mod.default?.default ?? mod.default ?? mod.Vapi ?? mod;
  if (typeof Vapi !== 'function') throw new Error('SDK export is ' + typeof Vapi + ', not a constructor');
  dlog('SDK loaded');
  const v = new Vapi(PUBLIC_KEY);
  v.on('call-start', () => { dlog('event: call-start'); agent.live = true; agent.feedHtml = ''; syncAgentUi(); });
  v.on('call-end', () => { dlog('event: call-end'); agent.live = false; agent.partial = null; syncAgentUi(); toast(t('agent.saved')); pullFinishedCall(); });
  v.on('speech-start', () => $('orb')?.classList.add('speaking'));
  v.on('speech-end', () => $('orb')?.classList.remove('speaking'));
  v.on('volume-level', (lvl) => { const r = $('ring'); if (r) r.style.transform = `scale(${1 + Math.min(lvl, 1) * 0.22})`; });
  v.on('message', (m) => {
    if (m.type !== 'transcript' || !m.transcript) return;
    const feed = $('feed');
    if (m.transcriptType === 'partial') {
      if (agent.partial && agent.partial.role === m.role) agent.partial.text = m.transcript;
      else agent.partial = { role: m.role, text: m.transcript };
    } else {
      agent.partial = null;
      agent.feedHtml += bubble(m.role, m.transcript);
    }
    if (feed) { feed.innerHTML = agent.feedHtml + (agent.partial ? bubble(agent.partial.role, agent.partial.text, true) : ''); feed.scrollTop = feed.scrollHeight; }
  });
  v.on('error', (e) => { dlog('event: error -> ' + (e?.message ?? e?.error?.message ?? JSON.stringify(e)?.slice(0, 200))); agent.live = false; syncAgentUi(); const er = $('err'); if (er) er.textContent = t('agent.error'); });
  agent.vapi = v;
  dlog('Vapi instance created');
  return v;
}

function syncAgentUi() {
  const orb = $('orb'), mic = $('mic'), state = $('state'), chat = $('chatinput'), send = $('chatsend'), voice = $('voice'), speed = $('speed');
  if (!orb) return;
  orb.classList.toggle('live', agent.live);
  if (!agent.live) { orb.classList.remove('speaking'); const r = $('ring'); if (r) r.style.transform = ''; }
  mic.disabled = false;
  mic.textContent = agent.live ? t('agent.end') : t('agent.talk');
  state.innerHTML = agent.live ? `<b>${t('agent.connected')}</b> — ${t('agent.connected.sub')}` : (agent.feedHtml ? t('agent.ended') : t('agent.ready'));
  chat.disabled = send.disabled = !agent.live;
  voice.disabled = speed.disabled = agent.live;
  const feed = $('feed'); if (feed) feed.innerHTML = agent.feedHtml;
}

// Recent-calls card on the Voice Agent page.
function refreshAgentRecent() {
  loadCalls().then((calls) => {
    const el = $('agent-recent'); if (!el) return;
    el.innerHTML = recentRows(calls.slice(0, 6));
    el.querySelectorAll('.row[data-id]').forEach((r) => { r.onclick = () => { location.hash = `#/calls/${r.dataset.id}`; }; });
  }).catch(() => {});
}

// After a browser call ends, copy the newest calls from Vapi into our database
// right away, so the call shows up without waiting for the webhook (which can
// take half a minute, and cannot reach a laptop at all). The webhook still
// arrives later and fills in the analysis. A short delay lets Vapi mark the
// call as ended first. With no database, /api/sync answers 409 and we just
// refresh; the list then comes straight from Vapi anyway.
function pullFinishedCall() {
  setTimeout(async () => {
    try { await api('/api/sync?limit=5', { method: 'POST' }); } catch (e) { dlog('sync after call: ' + e.message); }
    invalidate();
    refreshAgentRecent();
  }, 3000);
}

registerPage('agent', {
  skeleton: () => sk.card(`<div style="display:flex;flex-direction:column;align-items:center;gap:16px;padding:20px 0"><div class="skeleton" style="width:132px;height:132px;border-radius:50%"></div>${sk.line('w30')}</div>`),
  async load() {
    const voiceSel = store.get('voice', VOICES[0].id), speedVal = store.get('speed', '1');
    const html = pageHead('page.agent', 'page.agent.sub') + `
      <div class="grid" style="grid-template-columns:${innerWidth < 1100 ? '1fr' : 'minmax(0,1fr) 380px'}">
        <div class="card" style="padding:28px 24px">
          <div class="orb" id="orb"><div class="ring" id="ring"></div><button class="mic" id="mic" type="button">${t('agent.talk')}</button></div>
          <div class="state" id="state">${t('agent.ready')}</div>
          <div class="err" id="err"></div>
          <div class="diag" id="diag"></div>
          <div class="controls">
            <label for="voice">${t('agent.voice')}</label>
            <span class="select sm"><select id="voice">${VOICES.map((v) => `<option value="${v.id}"${v.id === voiceSel ? ' selected' : ''}>${v.label}</option>`).join('')}</select>
              <svg viewBox="0 0 12 12"><path d="M2 4l4 4 4-4" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg></span>
            <label for="speed">${t('agent.speed')}</label>
            <input type="range" id="speed" min="0.75" max="1.25" step="0.05" value="${speedVal}"><span class="mono" id="speedval">${Number(speedVal).toFixed(2)}</span>
          </div>
          <div class="feed notranslate convo" id="feed" translate="no"></div>
          <form class="chatbar" id="chatbar" autocomplete="off">
            <label class="input"><input id="chatinput" dir="auto" placeholder="${t('agent.type')}" disabled></label>
            <button class="btn" id="chatsend" type="submit" disabled>${t('agent.send')}</button>
          </form>
        </div>
        <div class="card"><div class="card-head"><span class="card-title">${t('card.recent')}</span><a class="btn secondary sm" href="#/calls">${t('see.all')}</a></div><div id="agent-recent">${sk.rows(4)}</div></div>
      </div>
      <p class="page-sub" style="text-align:center">${t('agent.note')}</p>`;
    return { html, async mount(main) {
      if (location.search.includes('debug')) { $('diag').style.display = 'block'; $('diag').textContent = agent.log.join('\n'); }
      syncAgentUi();
      refreshAgentRecent();
      $('voice').onchange = () => store.set('voice', $('voice').value);
      $('speed').oninput = () => { $('speedval').textContent = Number($('speed').value).toFixed(2); store.set('speed', $('speed').value); };
      $('mic').onclick = async () => {
        $('err').textContent = '';
        try {
          const v = await getVapi();
          if (agent.live) { v.stop(); return; }
          $('mic').disabled = true; $('state').textContent = t('agent.connecting');
          const pick = VOICES.find((x) => x.id === $('voice').value) ?? VOICES[0];
          const overrides = { voice: { provider: pick.provider, voiceId: pick.voiceId, speed: Number($('speed').value), chunkPlan: { formatPlan: { enabled: false } } } };
          dlog(`starting call voice=${pick.provider}/${pick.voiceId}`);
          const r = await v.start(ASSISTANT_ID, overrides);
          dlog('start() resolved: ' + (r?.id ?? '?'));
        } catch (e) {
          dlog('START FAILED: ' + (e?.message ?? JSON.stringify(e)));
          syncAgentUi();
          $('err').textContent = (e?.message?.includes('Permission') || e?.name === 'NotAllowedError') ? t('agent.mic.blocked') : t('agent.start.failed');
        }
      };
      $('chatbar').onsubmit = (e) => {
        e.preventDefault();
        const text = $('chatinput').value.trim();
        if (!text || !agent.live || !agent.vapi) return;
        agent.partial = null;
        agent.feedHtml += `<div class="turn user"><div class="bubble"><div class="who">${t('who.you')}</div><div class="say" dir="auto">${escapeHtml(text)}</div></div></div>`;
        $('feed').innerHTML = agent.feedHtml; $('feed').scrollTop = $('feed').scrollHeight;
        agent.vapi.send({ type: 'add-message', message: { role: 'user', content: text } });
        $('chatinput').value = '';
      };
    } };
  },
});

// ------------------------------------------------------------------ settings

registerPage('settings', {
  skeleton: () => `<div class="grid" style="grid-template-columns:${innerWidth < 900 ? '1fr' : '1fr 1fr'}">${sk.card(`${sk.line('w30')}${sk.rows(3)}`)}${sk.card(`${sk.line('w30')}${sk.rows(5)}`)}</div>`,
  async load() {
    const cfg = await loadConfig().catch((e) => ({ error: e.message }));
    const row = (k, v, sub) => `<div class="setting"><div><div class="setting-k">${k}</div>${sub ? `<div class="setting-sub">${sub}</div>` : ''}</div><div>${v}</div></div>`;
    const html = pageHead('page.settings', 'page.settings.sub') + `
      <div class="grid" style="grid-template-columns:${innerWidth < 900 ? '1fr' : '1fr 1fr'}">
        <div class="card"><div class="card-head"><span class="card-title">${t('set.appearance')}</span></div>
          ${row(t('set.theme'), `<span class="switch${currentTheme() === 'light' ? ' on' : ''}" id="set-theme" data-theme-switch role="switch" tabindex="0"><span></span></span>`, t('set.theme.sub'))}
          ${row(t('set.lang'), `<div class="tabs"><button id="set-en"${lang === 'en' ? ' class="on"' : ''}>English</button><button id="set-he"${lang === 'he' ? ' class="on"' : ''}>עברית</button></div>`, t('set.lang.sub'))}
          ${authRequired ? row(t('set.password'), `<button class="btn secondary sm" id="set-signout">${t('set.signout')}</button>`, t('set.password.sub')) : ''}
        </div>
        <div class="card"><div class="card-head"><span class="card-title">${t('set.assistant')}</span></div>
          ${cfg.error ? `<div class="page-empty">${escapeHtml(cfg.error)}</div>` : `
          ${row(t('set.name'), `<b style="font-weight:500">${escapeHtml(cfg.assistantName)}</b>`)}
          ${row(t('set.transcriber'), `<span class="mono">${escapeHtml(cfg.transcriber)}</span>`)}
          ${row(t('set.voice'), `<span class="mono">${escapeHtml(cfg.voice)}</span>`)}
          ${row(t('set.model'), `<span class="mono">${escapeHtml(cfg.model)}</span>`)}
          ${row(t('set.first'), `<span dir="auto" style="font-size:12.5px;color:var(--text-2)">${escapeHtml(cfg.firstMessage)}</span>`)}
          ${row(t('set.updated'), `<span class="faint">${fmtTime(cfg.updatedAt)}</span>`)}`}
        </div>
      </div>`;
    return { html, mount() {
      $('set-theme').onclick = toggleTheme;
      $('set-en').onclick = () => applyLang('en');
      $('set-he').onclick = () => applyLang('he');
      const f = $('set-signout'); if (f) f.onclick = signOut;
    } };
  },
});

// Refresh re-fetches instead of using the short cache.
$('refreshbtn').onclick = () => { invalidate(); render(); };

// Topbar profile (agent name + initials) is shell chrome, so fill it on every page, not just Overview.
loadConfig().catch(() => {});
