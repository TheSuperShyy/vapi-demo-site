// Dashboard pages. Each registers a render(main, params) with the shell in app.js.
import { registerPage, render, t, I18N, lang, escapeHtml, pageHead, toast } from './app.js';

const $ = (id) => document.getElementById(id);

// ------------------------------------------------------------------ strings for these pages

Object.assign(I18N.en, {
  'stat.total': 'Total calls', 'stat.total.sub': 'all time',
  'stat.completed': 'Completed', 'stat.live': 'In progress', 'stat.avg': 'Avg length',
  'stat.cost': 'Total cost', 'stat.yes': 'Said yes', 'stat.yes.sub': 'of answered',
  'card.week': 'Calls', 'card.intent': 'Intent', 'card.recent': 'Recent calls', 'see.all': 'See all',
  'intent.yes': 'Will vote', 'intent.no': 'Will not vote', 'intent.unsure': 'Unsure',
  'intent.refused': 'Refused', 'intent.not_reached': 'Not reached', 'intent.unknown': 'No analysis',
  'src.web': 'Browser', 'src.phone': 'Phone',
  'status.live': 'Live', 'status.ended': 'Ended', 'status.failed': 'Failed', 'status.queued': 'Queued',
  'empty.calls': 'No calls yet. Open the Voice Agent page and press the button.',
  'unit.calls': 'calls', 'unit.actions': 'calls',
  'err.api': 'Could not load data', 'auth.prompt': 'Dashboard password',
  'day.0': 'Sun', 'day.1': 'Mon', 'day.2': 'Tue', 'day.3': 'Wed', 'day.4': 'Thu', 'day.5': 'Fri', 'day.6': 'Sat',
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
  'unit.calls': 'שיחות', 'unit.actions': 'שיחות',
  'err.api': 'לא הצלחנו לטעון נתונים', 'auth.prompt': 'סיסמת הדשבורד',
  'day.0': 'א׳', 'day.1': 'ב׳', 'day.2': 'ג׳', 'day.3': 'ד׳', 'day.4': 'ה׳', 'day.5': 'ו׳', 'day.6': 'ש׳',
});

// ------------------------------------------------------------------ data

const store = {
  get(k, d) { try { return localStorage.getItem(k) ?? d; } catch { return d; } },
  set(k, v) { try { localStorage.setItem(k, v); } catch {} },
  del(k) { try { localStorage.removeItem(k); } catch {} },
};

// Optional password gate: the API returns 401 until we send the right bearer token.
export async function api(path) {
  const headers = {};
  const pw = store.get('dash_pw', '');
  if (pw) headers.Authorization = `Bearer ${pw}`;
  const res = await fetch(path, { headers });
  if (res.status === 401) {
    const entered = prompt(t('auth.prompt'));
    if (!entered) throw new Error('unauthorized');
    store.set('dash_pw', entered);
    return api(path);
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || res.statusText);
  return data;
}

let cache = { calls: null, config: null, at: 0 };
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

// ------------------------------------------------------------------ formatting

export const fmtDur = (a, b) => {
  if (!a || !b) return '—';
  const s = Math.max(0, Math.round((new Date(b) - new Date(a)) / 1000));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
};
export const fmtTime = (iso) => iso
  ? new Date(iso).toLocaleString(lang === 'he' ? 'he-IL' : 'en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
  : '—';
export const money = (n) => '$' + (n || 0).toFixed(2);
export const statusOf = (c) => {
  if (!c.endedAt && (c.status === 'in-progress' || c.status === 'ringing' || c.status === 'queued')) return 'live';
  if (/error|did-not-answer|busy|failed/.test(c.endedReason || '')) return 'failed';
  return c.endedAt ? 'ended' : 'queued';
};
export const dotClass = (c) => ({ live: 'live', failed: 'fail', ended: 'ended', queued: '' })[statusOf(c)];
export const srcOf = (c) => (c.type === 'webCall' ? t('src.web') : c.number || t('src.phone'));
const INTENT_ORDER = ['yes', 'no', 'unsure', 'refused', 'not_reached', 'unknown'];
const INTENT_TONE = { yes: 'positive', no: 'negative', unsure: 'accent', refused: 'neutral', not_reached: 'neutral', unknown: 'neutral' };
const INTENT_COLOR = { yes: 'var(--positive)', no: 'var(--negative)', unsure: 'var(--accent)', refused: 'var(--text-2)', not_reached: 'var(--text-3)', unknown: 'var(--border-2)' };
export const intentKey = (c) => (INTENT_ORDER.includes(c.intent) ? c.intent : 'unknown');
export const intentBadge = (c) => `<span class="badge ${INTENT_TONE[intentKey(c)]}">${t('intent.' + intentKey(c))}</span>`;

// ------------------------------------------------------------------ overview

let range = Number(store.get('range', '7'));
$('rangetabs').querySelectorAll('button').forEach((b) => {
  b.classList.toggle('on', Number(b.dataset.range) === range);
  b.onclick = () => { range = Number(b.dataset.range); store.set('range', String(range)); $('rangetabs').querySelectorAll('button').forEach((x) => x.classList.toggle('on', x === b)); render(); };
});

function rings() {
  return `<svg class="stat-rings" aria-hidden="true" viewBox="0 0 320 190" preserveAspectRatio="xMidYMid slice">${
    [0,1,2,3,4,5,6,7].map((i) => `<circle cx="265" cy="30" r="${18 + i * 24}" fill="none" stroke="var(--text-1)" stroke-opacity="${(0.05 - i * 0.004).toFixed(3)}" stroke-width="13"/>`).join('')
  }</svg>`;
}

function statTile({ label, value, sub, delta, hero }) {
  return `<div class="stat${hero ? ' hero' : ''}">${hero ? rings() : ''}
    <div class="stat-label">${label}</div>
    <div class="stat-value">${value}</div>
    <div class="stat-foot">${delta ?? ''}${sub ? `<span class="stat-sub">${sub}</span>` : ''}</div>
  </div>`;
}

function dayBuckets(calls, days) {
  const now = new Date(); now.setHours(0, 0, 0, 0);
  const buckets = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now); d.setDate(now.getDate() - i);
    buckets.push({ date: d, n: 0 });
  }
  const start = buckets[0].date.getTime();
  for (const c of calls) {
    const tms = new Date(c.createdAt); tms.setHours(0, 0, 0, 0);
    const idx = Math.round((tms.getTime() - start) / 86400000);
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
  // Only label every k-th day when the window is wide, so labels never collide.
  const k = n > 45 ? 10 : n > 14 ? 5 : 1;
  const labels = buckets.map((b, i) => `<span style="flex:1;text-align:center">${i % k === 0 || n <= 7 ? (n <= 7 ? t('day.' + b.date.getDay()) : b.date.getDate()) : ''}</span>`).join('');
  return `<svg class="chart" viewBox="0 0 ${w} ${h}" preserveAspectRatio="none">${grid}${bars}</svg><div class="chart-axis">${labels}</div>`;
}

function donut(counts, total) {
  const r = 54, c = 2 * Math.PI * r;
  let offset = 0;
  const arcs = INTENT_ORDER.filter((k) => counts[k]).map((k) => {
    const frac = counts[k] / total, len = frac * c;
    const el = `<circle r="${r}" cx="70" cy="70" fill="none" stroke="${INTENT_COLOR[k]}" stroke-width="16" stroke-dasharray="${len.toFixed(2)} ${(c - len).toFixed(2)}" stroke-dashoffset="${(-offset).toFixed(2)}" transform="rotate(-90 70 70)"/>`;
    offset += len;
    return el;
  }).join('');
  const legend = INTENT_ORDER.filter((k) => counts[k]).map((k) => `
    <div style="display:flex;align-items:center;gap:10px;font-size:12px">
      <span class="dot" style="background:${INTENT_COLOR[k]}"></span>
      <span style="flex:1;color:var(--text-2)">${t('intent.' + k)}</span>
      <b style="font-weight:600">${counts[k]}</b>
      <span class="faint" style="min-width:34px;text-align:end">${Math.round(counts[k] / total * 100)}%</span>
    </div>`).join('');
  return `<div style="display:flex;gap:20px;align-items:center;flex-wrap:wrap">
    <svg width="140" height="140" viewBox="0 0 140 140" style="flex:none">
      <circle r="${r}" cx="70" cy="70" fill="none" stroke="var(--chart-grid)" stroke-width="16"/>${arcs}
      <text x="70" y="66" text-anchor="middle" font-size="22" font-weight="600" fill="var(--text-1)" font-family="var(--font-ui)">${total}</text>
      <text x="70" y="84" text-anchor="middle" font-size="10" fill="var(--text-3)" font-family="var(--font-ui)">${t('unit.actions')}</text>
    </svg>
    <div style="flex:1;min-width:180px;display:flex;flex-direction:column;gap:8px">${legend}</div>
  </div>`;
}

function recentRows(calls) {
  if (!calls.length) return `<div class="page-empty">${t('empty.calls')}</div>`;
  return `<div class="rows">${calls.map((c) => `
    <div class="row" data-id="${c.id}">
      <span class="dot ${dotClass(c)}"></span>
      <div class="row-main">
        <div class="row-title">${escapeHtml(srcOf(c))} <span class="faint" style="font-weight:400">· ${t('status.' + statusOf(c))}</span></div>
        <div class="row-sub">${fmtTime(c.createdAt)}</div>
      </div>
      ${intentBadge(c)}
      <div class="row-end"><div class="row-val mono">${fmtDur(c.startedAt, c.endedAt)}</div><div class="row-sub">${money(c.cost)}</div></div>
    </div>`).join('')}</div>`;
}

registerPage('overview', async (main) => {
  main.innerHTML = pageHead('page.overview', 'page.overview.sub');
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

  main.innerHTML = pageHead('page.overview', 'page.overview.sub') + `
    <div class="stat-row">
      ${statTile({ hero: true, label: t('stat.total'), value: calls.length, sub: t('stat.total.sub') })}
      ${statTile({ label: t('stat.completed'), value: ended.length, sub: live ? `${live} ${t('stat.live').toLowerCase()}` : '' })}
      ${statTile({ label: t('stat.avg'), value: `${Math.floor(avg / 60)}:${String(Math.round(avg % 60)).padStart(2, '0')}` })}
      ${statTile({ label: t('stat.cost'), value: money(cost) })}
      ${statTile({ label: t('stat.yes'), value: `${yesPct}%`, sub: `${counts.yes || 0}/${answered} ${t('stat.yes.sub')}` })}
    </div>
    <div class="grid" style="grid-template-columns:1fr 380px">
      <div class="card">
        <div class="card-head"><span class="card-title">${t('card.week')} <span class="faint" style="font-weight:400">· ${inRange} ${t('unit.calls')}</span></span>
          <span class="badge">${range}d</span></div>
        ${barChart(buckets)}
      </div>
      <div class="card">
        <div class="card-head"><span class="card-title">${t('card.intent')}</span></div>
        ${calls.length ? donut(counts, calls.length) : `<div class="page-empty">${t('empty.calls')}</div>`}
      </div>
    </div>
    <div class="card">
      <div class="card-head"><span class="card-title">${t('card.recent')}</span><a class="btn secondary sm" href="#/calls">${t('see.all')}</a></div>
      ${recentRows(calls.slice(0, 8))}
    </div>`;

  main.querySelectorAll('.row[data-id]').forEach((el) => { el.onclick = () => { location.hash = `#/calls/${el.dataset.id}`; }; });
  // The grid collapses below 1100px; inline style above is the desktop layout.
  const grid = main.querySelector('.grid');
  const fit = () => { grid.style.gridTemplateColumns = innerWidth < 1100 ? '1fr' : '1fr 380px'; };
  fit(); addEventListener('resize', fit, { once: true });
});

// Refresh button re-fetches instead of using the short cache.
$('refreshbtn').onclick = async () => { await loadCalls(true); render(); };
