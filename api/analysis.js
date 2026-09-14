// GET /api/analysis?days=7|30|90 -> the Analysis page's numbers, all computed by
// the database from stored calls (see _analysis.js for the shape). Needs Postgres;
// without DATABASE_URL this answers 409 and the page explains.

import { requireAuth, fail } from './_vapi.js';
import { sql } from './_db.js';
import { analysis } from './_analysis.js';

export const rangeDays = (q) => ([7, 30, 90].includes(Number(q?.days)) ? Number(q.days) : 7);

export default async function handler(req, res) {
  if (!requireAuth(req, res)) return;
  if (req.method !== 'GET') return res.status(405).json({ error: 'GET only' });
  if (!process.env.DATABASE_URL) return res.status(409).json({ error: 'needs_database', message: 'The analysis needs the database. Set DATABASE_URL - see db/README.md.' });
  res.setHeader('Cache-Control', 'no-store');
  try {
    res.status(200).json(await analysis(sql(), rangeDays(req.query)));
  } catch (e) { fail(res, e); }
}
