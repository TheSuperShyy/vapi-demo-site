// POST /api/sync  -> pull every call Vapi has for this assistant into Postgres.
//
// Backfill for calls that happened before the webhook existed, and a safety net
// if a webhook delivery is ever missed. Protected by the dashboard password when
// one is set; otherwise open (it only ever copies data you already own).

import { vapi, requireAuth, fail } from './_vapi.js';
import { sql, upsertCall } from './_db.js';
import { ASSISTANT_ID } from './config.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });
  if (!requireAuth(req, res)) return;
  if (!process.env.DATABASE_URL) {
    return res.status(409).json({ error: 'No database configured. Set DATABASE_URL first - see db/README.md.' });
  }
  try {
    const limit = Math.min(Number(req.query?.limit ?? 1000), 1000);
    const calls = (await vapi(`/call?limit=${limit}`)).filter((c) => !ASSISTANT_ID || c.assistantId === ASSISTANT_ID);
    let upserted = 0;
    const errors = [];
    for (const c of calls) {
      try { await upsertCall(c, 'backfill'); upserted++; }
      catch (e) { errors.push({ id: c.id, error: e.message }); }
    }
    const [{ count }] = await sql()`select count(*)::int as count from calls`;
    res.status(200).json({ fetched: calls.length, upserted, errors, totalInDb: count });
  } catch (e) { fail(res, e); }
}
