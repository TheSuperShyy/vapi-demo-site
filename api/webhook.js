// POST /api/webhook  <- Vapi server URL. Stores each finished call in Postgres.
//
// Auth: Vapi sends the credential you configure as a header. Set VAPI_WEBHOOK_SECRET
// and either (a) create a Vapi credential with header name X-Vapi-Secret carrying that
// value, or (b) put it in the URL as ?token=... when there is no credential UI handy.
// Either is accepted; with no secret configured the endpoint refuses everything.

import { sql, upsertCall } from './_db.js';
import { sameSecret } from './_vapi.js';

export const config = { api: { bodyParser: { sizeLimit: '4mb' } } };

async function readJson(req) {
  if (req.body && typeof req.body === 'object') return req.body;          // Vercel parsed it
  if (typeof req.body === 'string') return req.body ? JSON.parse(req.body) : {};  // a shim left it raw
  let raw = '';
  for await (const chunk of req) raw += chunk;
  return raw ? JSON.parse(raw) : {};
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });

  // Vapi always sends the X-Vapi-Secret header, empty when no credential is set, so the
  // header must not shadow the URL token: either one matching is enough.
  const secret = process.env.VAPI_WEBHOOK_SECRET;
  const ok = !!secret && [req.headers['x-vapi-secret'], req.query?.token].some((v) => typeof v === 'string' && sameSecret(v, secret));
  if (!ok) return res.status(401).json({ error: 'unauthorized' });

  let body, msg;
  try {
    body = await readJson(req);
    msg = body.message ?? body;
  } catch (e) {
    return res.status(400).json({ error: 'bad json' });
  }

  const type = msg?.type ?? 'unknown';
  const call = msg?.call ?? null;
  const callId = call?.id ?? null;

  // Every text chunk the agent is about to speak (serverMessages includes voice-input).
  // Kept as-is; upsertCall uses them as the agent's side of the transcript.
  if (type === 'voice-input') {
    const text = typeof msg.input === 'string' ? msg.input.trim() : '';
    if (callId && text) {
      const at = new Date(Number(msg.timestamp) || Date.now());
      try { await sql()`insert into spoken_lines ${sql()({ call_id: callId, at, text })} on conflict do nothing`; }
      catch (e) { console.error('[voice-input]', e.message); }
    }
    return res.status(200).json({ ok: true });
  }

  // Only end-of-call-report carries the finished data. Ack everything else so
  // Vapi does not retry, and log it so we can see what arrives.
  if (type !== 'end-of-call-report' || !callId) {
    try { await sql()`insert into webhook_log ${sql()({ event_type: type, call_id: callId, ok: true, error: 'ignored' })}`; } catch {}
    return res.status(200).json({ ok: true, ignored: type });
  }

  // The report puts artifacts/analysis beside `call`, not inside it. Merge so the
  // same mapper handles both the webhook and the REST object.
  const merged = {
    ...call,
    endedReason: msg.endedReason ?? call.endedReason,
    startedAt: msg.startedAt ?? call.startedAt,
    endedAt: msg.endedAt ?? call.endedAt,
    cost: msg.cost ?? call.cost,
    costs: msg.costs ?? call.costs,
    transcript: msg.transcript ?? msg.artifact?.transcript ?? call.transcript,
    recordingUrl: msg.recordingUrl ?? msg.artifact?.recordingUrl ?? call.recordingUrl,
    messages: msg.messages ?? msg.artifact?.messages ?? call.messages,
    analysis: msg.analysis ?? call.analysis,
    artifact: msg.artifact ?? call.artifact,
    summary: msg.summary ?? call.summary,
    status: call.status ?? 'ended',
  };

  try {
    await upsertCall(merged, 'webhook');
    await sql()`insert into webhook_log ${sql()({ event_type: type, call_id: callId, ok: true, error: null })}`;
    return res.status(200).json({ ok: true, id: callId });
  } catch (e) {
    try { await sql()`insert into webhook_log ${sql()({ event_type: type, call_id: callId, ok: false, error: String(e.message).slice(0, 500) })}`; } catch {}
    console.error('[webhook]', e);
    return res.status(500).json({ error: e.message });
  }
}
