// GET /api/export?days=7|30|90&lang=en|he -> an .xlsx daily report for the range:
// Summary, Daily, Calls (every call, newest first, capped at 10,000), Reasons, Cities,
// Quotes. Same numbers as /api/analysis; headers in the requested language.

import { requireAuth, fail } from './_vapi.js';
import { sql } from './_db.js';
import { TZ } from './_list.js';
import { analysis, callsInRange, endedGroup, LABELS } from './_analysis.js';
import { workbook } from './_xlsx.js';
import { rangeDays } from './analysis.js';

const dateFmt = new Intl.DateTimeFormat('en-CA', { timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit' });
const timeFmt = new Intl.DateTimeFormat('en-GB', { timeZone: TZ, hour: '2-digit', minute: '2-digit', hour12: false });
const pct = (n, d) => (d ? Math.round((n / d) * 1000) / 10 : 0);

export default async function handler(req, res) {
  if (!requireAuth(req, res)) return;
  if (req.method !== 'GET') return res.status(405).json({ error: 'GET only' });
  if (!process.env.DATABASE_URL) return res.status(409).json({ error: 'needs_database', message: 'The export needs the database. Set DATABASE_URL - see db/README.md.' });
  const days = rangeDays(req.query);
  const lang = req.query?.lang === 'he' ? 'he' : 'en';
  const L = LABELS[lang], C = L.cols, rtl = lang === 'he';
  try {
    const s = sql();
    const [a, calls] = await Promise.all([analysis(s, days), callsInRange(s, days)]);
    const f = a.funnel, p = a.approach;

    const summary = [[C.metric, C.value]];
    for (const k of ['total', 'reached', 'answered', 'yes', 'no', 'unsure', 'refused', 'notReached', 'noAnalysis', 'optOut', 'askedIfBot', 'qualityBad', 'hungUpEarly', 'avgSecondsAnswered', 'avgSecondsNotReached', 'cost']) {
      summary.push([L.metrics[k], /avg|cost/.test(k) ? Math.round(f[k] * 100) / 100 : f[k]]);
    }
    for (const k of ['conversations', 'askedReason', 'closingDelivered', 'appealJewishState', 'appealHighCourt', 'thankedYes', 'politeExit', 'askedQuestion', 'avgAgentTurns', 'avgUserTurns']) {
      summary.push([L.metrics[k], /avg/.test(k) ? Math.round(p[k] * 10) / 10 : p[k]]);
    }

    const daily = [[C.day, C.calls, C.reached, C.yes, C.no, C.unsure, C.refused, C.notReached, C.optOut, C.cost],
      ...a.daily.map((d) => [d.day, d.total, d.reached, d.yes, d.no, d.unsure, d.refused, d.notReached, d.optOut, Math.round(d.cost * 100) / 100])];

    const callRows = [[C.date, C.time, C.phone, C.name, C.city, C.source, C.status, C.answer, C.reason, C.quote, C.length, C.cost, C.endedBecause, C.optOut, C.askedIfBot, C.agentTurns, C.userTurns, C.summary],
      ...calls.map((c) => { const at = new Date(c.created_at); return [
        dateFmt.format(at), timeFmt.format(at), c.customer_number ?? '', c.lead_name ?? '', c.city ?? '', L.source[c.type] ?? (c.type ?? ''), c.status ?? '',
        L.intent[c.intent ?? ''] ?? c.intent ?? '', c.intent === 'yes' || !c.reason_category || c.reason_category === 'not_applicable' ? '' : (L.reason[c.reason_category] ?? c.reason_category),
        c.reason_verbatim ?? '', c.duration_seconds ?? null, Number(c.cost_usd ?? 0), c.ended_reason ? (L.ended[endedGroup(c.ended_reason)] ?? c.ended_reason) : '',
        c.opt_out === true, c.asked_if_bot === true, c.bot_turns ?? 0, c.user_turns ?? 0, c.summary ?? '',
      ]; })];

    const reasonTotal = a.reasons.reduce((n, r) => n + r.n, 0);
    const reasons = [[C.reason, C.count, C.share], ...a.reasons.map((r) => [L.reason[r.key] ?? r.key, r.n, pct(r.n, reasonTotal)])];
    const cities = [[C.city, C.calls, C.yes, C.no, C.unsure, C.refused, C.notReached, C.yesRate],
      ...a.cities.map((c) => [c.city, c.total, c.yes, c.no, c.unsure, c.refused, c.notReached, pct(c.yes, c.yes + c.no + c.unsure)])];
    const quotes = [[C.date, C.city, C.answer, C.reason, C.quote],
      ...a.quotes.map((q) => [dateFmt.format(new Date(q.createdAt)), q.city ?? '', L.intent[q.intent ?? ''] ?? q.intent ?? '', L.reason[q.category] ?? q.category ?? '', q.text])];

    const buf = workbook([
      { name: L.sheets.summary, rows: summary, rtl }, { name: L.sheets.daily, rows: daily, rtl }, { name: L.sheets.calls, rows: callRows, rtl },
      { name: L.sheets.reasons, rows: reasons, rtl }, { name: L.sheets.cities, rows: cities, rtl }, { name: L.sheets.quotes, rows: quotes, rtl },
    ]);
    const today = dateFmt.format(new Date());
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="voice-report-${today}-${days}d.xlsx"`);
    res.setHeader('Cache-Control', 'no-store');
    res.setHeader('Content-Length', String(buf.length));
    res.status(200).end(buf);
  } catch (e) { fail(res, e); }
}
