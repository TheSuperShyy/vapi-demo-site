// Shared paging / search / stats logic, in two flavours:
//   - SQL fragments for the Postgres path (api/calls.js, api/stats.js)
//   - the same semantics over an in-memory list for the Vapi fallback
// Both must answer identically; api/calls.js and api/stats.js pick the flavour.

import { summarise } from './_vapi.js';

export const INTENTS = ['yes', 'no', 'unsure', 'refused', 'not_reached', 'unknown'];
export const TZ = 'Asia/Jerusalem';          // the campaign's day boundary, not the viewer's

// ---------------------------------------------------------------- request parsing

export function listParams(q = {}) {
  const page = Math.max(1, Math.floor(Number(q.page)) || 1);
  const size = Math.min(100, Math.max(1, Math.floor(Number(q.size)) || 10));
  const text = String(q.q ?? '').trim().toLowerCase().slice(0, 100);
  const csv = (v) => String(v ?? '').split(',').map((s) => s.trim()).filter(Boolean);
  const intents = csv(q.intents).filter((k) => INTENTS.includes(k));
  const types = csv(q.types).filter((k) => /^[a-zA-Z]+$/.test(k)).slice(0, 5);
  const locate = /^[\w-]{1,80}$/.test(String(q.locate ?? '')) ? String(q.locate) : null;
  return { page, size, text, intents, types, locate };
}

export function escapeLike(s) {
  return s.replace(/[\\%_]/g, (c) => '\\' + c);
}

// ---------------------------------------------------------------- in-memory flavour (Vapi fallback)

const intentOf = (c) => (INTENTS.includes(c.intent) ? c.intent : 'unknown');

// Same OR semantics as the SQL in api/calls.js: a text hit, or a matching intent/type.
function matches(c, p) {
  if (!p.text && !p.intents.length && !p.types.length) return true;
  const textHit = p.text !== '' && [c.number, c.id, c.endedReason, c.reason, c.intent].filter(Boolean).some((v) => String(v).toLowerCase().includes(p.text));
  return textHit || (p.intents.length > 0 && p.intents.includes(intentOf(c))) || (p.types.length > 0 && p.types.includes(c.type));
}

const newestFirst = (a, b) => (b.createdAt ?? '').localeCompare(a.createdAt ?? '') || (b.id ?? '').localeCompare(a.id ?? '');

export function pageList(summaries, p) {
  const hits = summaries.filter((c) => matches(c, p)).sort(newestFirst);
  const total = hits.length, pages = Math.max(1, Math.ceil(total / p.size));
  let page = Math.min(p.page, pages);
  if (p.locate) { const i = hits.findIndex((c) => c.id === p.locate); if (i >= 0) page = Math.floor(i / p.size) + 1; }
  return { items: hits.slice((page - 1) * p.size, page * p.size), total, page, size: p.size, pages };
}

export const dayKey = (iso) => new Intl.DateTimeFormat('en-CA', { timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date(iso));
// The last N calendar days in Israel, walked on the calendar (not by 24h steps, which drift across DST).
export function lastDays(days) {
  const [y, m, d] = dayKey(new Date()).split('-').map(Number);
  return Array.from({ length: days }, (_, i) => new Date(Date.UTC(y, m - 1, d - (days - 1 - i))).toISOString().slice(0, 10));
}

export function statsFromList(summaries, days) {
  const ended = summaries.filter((c) => c.endedAt);
  const live = summaries.filter((c) => !c.endedAt && ['in-progress', 'ringing', 'queued'].includes(c.status)).length;
  const secs = ended.map((c) => (new Date(c.endedAt) - new Date(c.startedAt)) / 1000).filter((n) => n > 0);
  const intents = Object.fromEntries(INTENTS.map((k) => [k, 0]));
  for (const c of summaries) intents[intentOf(c)]++;
  const keys = lastDays(days);
  const counts = Object.fromEntries(keys.map((k) => [k, 0]));
  for (const c of summaries) { const k = dayKey(c.createdAt); if (k in counts) counts[k]++; }
  const perDay = keys.map((day) => ({ day, n: counts[day] }));
  return {
    total: summaries.length, ended: ended.length, live,
    avgSeconds: secs.length ? secs.reduce((a, b) => a + b, 0) / secs.length : 0,
    cost: summaries.reduce((a, c) => a + (c.cost || 0), 0),
    intents, perDay, inRange: perDay.reduce((a, b) => a + b.n, 0),
    recent: [...summaries].sort(newestFirst).slice(0, 8),
  };
}

export const summariseAll = (calls) => calls.map(summarise);
