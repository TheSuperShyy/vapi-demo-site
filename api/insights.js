// GET  /api/insights?days=7|30|90&lang=en|he -> the saved AI write-up, with a
//      `stale` flag once more calls have landed than it was written from.
// POST /api/insights?days=..&lang=..        -> write a fresh one (one model call).
//
// The model only ever sees the counts from /api/analysis and the recorded quotes,
// so nothing on the page is invented. See api/_insights.js.

import { requireAuth, fail } from './_vapi.js';
import { sql } from './_db.js';
import { analysis } from './_analysis.js';
import { rangeDays } from './analysis.js';
import { askModel, brief, hasKey, isStale, latestInsight, saveInsight, shape, MODEL } from './_insights.js';

export const config = { maxDuration: 60 };   // a flash model answers in seconds; this is the ceiling, not the wait

const language = (q) => (q?.lang === 'he' ? 'he' : 'en');

// Two people opening the page at once, or one navigating away and back mid-write,
// must not each pay for a model call. Within a process, the second request waits
// for the first; across processes, the freshness check below is the backstop.
const writing = new Map();

export default async function handler(req, res) {
  if (!requireAuth(req, res)) return;
  if (!['GET', 'POST'].includes(req.method)) return res.status(405).json({ error: 'GET or POST' });
  if (!process.env.DATABASE_URL) return res.status(409).json({ error: 'needs_database', message: 'The analysis needs the database. Set DATABASE_URL - see db/README.md.' });
  res.setHeader('Cache-Control', 'no-store');

  const days = rangeDays(req.query), lang = language(req.query);
  try {
    const s = sql();
    const a = await analysis(s, days);
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
