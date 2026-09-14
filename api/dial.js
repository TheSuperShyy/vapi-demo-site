// POST /api/dial { leadId } -> place a real outbound phone call to a number on the
// calling list. This is the production path; it needs a Vapi phone number
// (VAPI_PHONE_NUMBER_ID). Without one it answers 409 and the page falls back to
// running the agent in the browser. Numbers marked do_not_call are refused.

import { requireAuth, fail } from './_vapi.js';
import { sql, upsertCall } from './_db.js';
import { ASSISTANT_ID } from './config.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });
  if (!requireAuth(req, res)) return;
  res.setHeader('Cache-Control', 'no-store');
  if (!process.env.DATABASE_URL) return res.status(409).json({ error: 'no_database', message: 'The calling list needs the database.' });
  let body = req.body;
  if (typeof body === 'string') { try { body = JSON.parse(body); } catch { body = {}; } }
  const leadId = Number(body?.leadId);
  if (!Number.isInteger(leadId) || leadId <= 0) return res.status(400).json({ error: 'bad leadId' });
  try {
    const s = sql();
    const [lead] = await s`select id, phone, name, status from leads where id = ${leadId}`;
    if (!lead) return res.status(404).json({ error: 'not found' });
    if (lead.status === 'do_not_call') return res.status(409).json({ error: 'do_not_call', message: 'This number asked not to be called.' });
    const phoneNumberId = process.env.VAPI_PHONE_NUMBER_ID;
    if (!phoneNumberId) return res.status(409).json({ error: 'no_phone_number', message: 'No phone number is connected in Vapi yet. Set VAPI_PHONE_NUMBER_ID to dial for real; until then the call runs in the browser.' });
    const key = process.env.VAPI_PRIVATE_KEY;
    const r = await fetch('https://api.vapi.ai/call', {
      method: 'POST',
      headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ assistantId: ASSISTANT_ID, phoneNumberId, customer: { number: lead.phone, name: lead.name ?? undefined }, metadata: { leadId: lead.id } }),
    });
    const call = await r.json().catch(() => ({}));
    if (!r.ok) throw Object.assign(new Error(call?.message ?? `Vapi ${r.status}`), { status: r.status });
    try { await upsertCall(call, 'dial'); } catch (e) { console.error('[dial store]', e.message); }
    res.status(200).json({ id: call.id, status: call.status ?? 'queued' });
  } catch (e) { fail(res, e); }
}
