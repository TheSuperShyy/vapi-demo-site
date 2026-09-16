// GET  /api/analysis?days=7|30|90 -> the Analysis page's numbers, all computed by
//      the database from stored calls (see _analysis.js for the shape).
// GET  /api/analysis?insight=1&days=..&lang=en|he -> the saved AI write-up of those
//      numbers, with a `stale` flag once more calls have landed than it was written from.
// POST /api/analysis?insight=1&days=..&lang=..    -> write a fresh one (one model call).
//
// The write-up lives here rather than in its own file because the Hobby plan allows
// twelve functions per deployment and the page asks for both in the same breath.
// The model only ever sees the counts below and the recorded quotes, so nothing on
// the page is invented. See api/_insights.js.
//
// Needs Postgres; without DATABASE_URL this answers 409 and the page explains.

import { requireAuth, fail } from './_vapi.js';
import { sql } from './_db.js';
import { analysis } from './_analysis.js';
import { askModel, brief, hasKey, isStale, latestInsight, saveInsight, shape, MODEL } from './_insights.js';

export const config = { maxDuration: 60 };   // a flash model answers in seconds; this is the ceiling, not the wait

export const rangeDays = (q) => ([7, 30, 90].includes(Number(q?.days)) ? Number(q.days) : 7);

const language = (q) => (q?.lang === 'he' ? 'he' : 'en');

// Two people opening the page at once, or one navigating away and back mid-write,
// must not each pay for a model call. Within a process, the second request waits
// for the first; across processes, the freshness check below is the backstop.
const writing = new Map();

export default async function handler(req, res) {
  if (!requireAuth(req, res)) return;
  const wantsInsight = req.query?.insight === '1';
  if (req.method !== 'GET' && !(wantsInsight && req.method === 'POST')) return res.status(405).json({ error: wantsInsight ? 'GET or POST' : 'GET only' });
  if (!process.env.DATABASE_URL) return res.status(409).json({ error: 'needs_database', message: 'The analysis needs the database. Set DATABASE_URL - see db/README.md.' });
  res.setHeader('Cache-Control', 'no-store');

  const days = rangeDays(req.query);
  try {
    const s = sql();
    const a = await analysis(s, days);
    if (!wantsInsight) return res.status(200).json(a);

    const lang = language(req.query);
    if (req.method === 'GET') {
      return res.status(200).json({ insight: shape(await latestInsight(s, days, lang), a), model: MODEL(), hasKey: hasKey() });
    }
    if (!hasKey()) return res.status(409).json({ error: 'needs_key', message: 'Set OPENROUTER_API_KEY to write the AI analysis.' });
    if (!a.funnel.total) return res.status(409).json({ error: 'no_calls', message: 'No calls in this range yet.' });
    const force = req.query?.force === '1';
    const key = `${days}/${lang}`;
    if (!force) {
      const current = await latestInsight(s, days, lang);          // someone else may have just written one
      if (current && !isStale(current, a)) return res.status(200).json({ insight: shape(current, a), model: current.model, hasKey: true });
      if (writing.has(key)) return res.status(200).json({ insight: shape(await writing.get(key), a), model: MODEL(), hasKey: true });
    }
    const job = (async () => {
      const latestCallAt = a.daily.filter((d) => d.total).map((d) => d.day).pop() ?? null;
      const { data, model, cost } = await askModel(brief(a, days), lang);
      return saveInsight(s, { days, lang, model, data, callsInRange: a.funnel.total, latestCallAt, cost });
    })();
    writing.set(key, job);
    try {
      const row = await job;
      res.status(200).json({ insight: shape(row, a), model: row.model, hasKey: true });
    } finally { if (writing.get(key) === job) writing.delete(key); }
  } catch (e) { fail(res, e); }
}
