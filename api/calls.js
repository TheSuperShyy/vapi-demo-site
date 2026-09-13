// GET /api/calls?limit=200  -> call list from Postgres, newest first.
//
// Reads from our own copy (filled by /api/webhook and /api/sync), so the list is
// not capped by Vapi's page size and does not spend a Vapi request per view.
// If DATABASE_URL is unset the route falls back to Vapi directly, so the
// dashboard keeps working before the database exists.

import { vapi, requireAuth, fail, summarise } from './_vapi.js';
import { sql, rowToSummary } from './_db.js';

export default async function handler(req, res) {
  if (!requireAuth(req, res)) return;
  const limit = Math.min(Number(req.query?.limit ?? 200), 2000);
  res.setHeader('Cache-Control', 'no-store');
  try {
    if (!process.env.DATABASE_URL) {
      const calls = await vapi(`/call?limit=${Math.min(limit, 1000)}`);
      res.setHeader('X-Source', 'vapi');
      return res.status(200).json(calls.map(summarise));
    }
    const rows = await sql()`
      select id, type, status, ended_reason, customer_number, created_at, started_at, ended_at, cost_usd, intent, reason_category, opt_out
      from calls order by created_at desc limit ${limit}`;
    res.setHeader('X-Source', 'db');
    res.status(200).json(rows.map(rowToSummary));
  } catch (e) { fail(res, e); }
}
