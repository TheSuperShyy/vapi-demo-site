// GET /api/leads/:id -> one number from the calling list plus its calls.
//   { lead: {...same shape as the list items...}, calls: [ up to 10 summaries, newest first ] }

import { requireAuth, fail } from '../_vapi.js';
import { sql, rowToSummary } from '../_db.js';

export default async function handler(req, res) {
  if (!requireAuth(req, res)) return;
  res.setHeader('Cache-Control', 'no-store');
  if (!process.env.DATABASE_URL) return res.status(409).json({ error: 'The calling list needs the database.' });
  const id = Number(req.query?.id);
  if (!Number.isInteger(id) || id <= 0) return res.status(400).json({ error: 'bad id' });
  try {
    const s = sql();
    const [r] = await s`select id, position, phone, phone_raw, name, city, status, attempts, last_call_id, last_outcome, last_called_at from leads where id = ${id}`;
    if (!r) return res.status(404).json({ error: 'not found' });
    const calls = await s`select id, type, status, ended_reason, customer_number, created_at, started_at, ended_at, cost_usd, intent, reason_category, opt_out
      from calls where customer_number = ${r.phone} order by created_at desc limit 10`;
    res.status(200).json({
      lead: { id: r.id, position: r.position, phone: r.phone, phoneRaw: r.phone_raw, name: r.name, city: r.city, status: r.status, attempts: r.attempts, lastCallId: r.last_call_id, lastOutcome: r.last_outcome, lastCalledAt: r.last_called_at },
      calls: calls.map(rowToSummary),
    });
  } catch (e) { fail(res, e); }
}
