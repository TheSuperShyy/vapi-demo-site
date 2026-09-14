// Postgres access for the api/ functions. One connection string, read from
// DATABASE_URL (Supabase -> Connect -> Transaction pooler, port 6543).
//
// postgres.js with prepare:false, because Supabase's transaction pooler does not
// support prepared statements. A tiny pool (2) so one slow or stuck query cannot
// hold up every other request in a long-lived process such as the dev server;
// each serverless invocation is its own process anyway. Keepalives and a bounded
// connection lifetime guard against silently dropped sockets.

import postgres from 'postgres';

let _sql = null;
export function sql() {
  if (_sql) return _sql;
  const url = process.env.DATABASE_URL;
  if (!url) throw Object.assign(new Error('DATABASE_URL is not set'), { status: 500 });
  _sql = postgres(url, { prepare: false, max: 2, idle_timeout: 20, connect_timeout: 10, max_lifetime: 15 * 60, keep_alive: 30, ssl: 'require' });
  return _sql;
}

// ---------------------------------------------------------------- mapping

// Vapi call object (from the REST API or the end-of-call-report webhook) -> row.
export function callToRow(c, source = 'webhook') {
  const art = c.artifact ?? {};
  const sd = c.analysis?.structuredData ?? {};
  const rawMessages = c.messages ?? art.messages ?? [];
  const messages = rawMessages
    .filter((m) => m.role === 'bot' || m.role === 'user' || m.role === 'assistant')
    .map((m) => ({
      role: m.role === 'assistant' ? 'bot' : m.role,
      text: m.message ?? m.content ?? '',
      seconds_from_start: m.secondsFromStart ?? null,
    }));
  const voice = c.assistantOverrides?.voice ?? c.assistant?.voice ?? null;
  return {
    id: c.id,
    assistant_id: c.assistantId ?? c.assistant?.id ?? null,
    type: c.type ?? null,
    status: c.status ?? null,
    ended_reason: c.endedReason ?? null,
    // Phone calls carry the number on `customer`; a browser call placed for a
    // lead from the List carries it in the overrides we sent (variableValues.leadPhone).
    customer_number: c.customer?.number || c.assistantOverrides?.variableValues?.leadPhone || null,
    created_at: c.createdAt,
    started_at: c.startedAt ?? null,
    ended_at: c.endedAt ?? null,
    cost_usd: Number(c.cost ?? 0) || 0,
    recording_url: c.recordingUrl ?? art.recordingUrl ?? null,
    transcript: c.transcript ?? art.transcript ?? null,
    messages,                                 // array; upsertCall wraps it with sql.json()
    summary: c.analysis?.summary || c.summary || null,   // '' -> null, same as the Vapi path
    intent: sd.intent ?? null,
    reason_category: sd.reason_category ?? null,
    reason_verbatim: sd.reason_verbatim || null,
    opt_out: typeof sd.opt_out_requested === 'boolean' ? sd.opt_out_requested : null,
    asked_if_bot: typeof sd.asked_if_bot === 'boolean' ? sd.asked_if_bot : null,
    call_quality_ok: typeof sd.call_quality_ok === 'boolean' ? sd.call_quality_ok : null,
    voice: voice ? `${voice.provider ?? '?'}/${voice.voiceId ?? '?'}` : null,
    raw: c,                                   // object; upsertCall wraps it with sql.json()
    source,
  };
}

// Insert or refresh a call. A later report for the same id (e.g. analysis
// arriving after the first webhook) overwrites the earlier, partial row.
//
// JSON columns go through sql.json(): postgres.js asks the server for parameter
// types and JSON-serialises anything bound to a jsonb column, so passing a
// pre-stringified value would store a quoted string instead of the array/object.
export async function upsertCall(c, source) {
  const r = callToRow(c, source);
  const s = sql();
  const row = { ...r, messages: s.json(r.messages), raw: s.json(r.raw) };
  await s`
    insert into calls ${s(row)}
    on conflict (id) do update set
      status = excluded.status, ended_reason = excluded.ended_reason,
      started_at = excluded.started_at, ended_at = excluded.ended_at,
      cost_usd = excluded.cost_usd, recording_url = excluded.recording_url,
      transcript = excluded.transcript, messages = excluded.messages,
      summary = excluded.summary, intent = excluded.intent,
      reason_category = excluded.reason_category, reason_verbatim = excluded.reason_verbatim,
      opt_out = excluded.opt_out, asked_if_bot = excluded.asked_if_bot,
      call_quality_ok = excluded.call_quality_ok, voice = excluded.voice,
      raw = excluded.raw, source = excluded.source`;
  if (r.customer_number) { try { await refreshLead(s, r.customer_number); } catch (e) { console.error('[lead refresh]', e.message); } }   // the call is stored; the lead can catch up on the next sync
  return r.id;
}

// Keeps the calling list in step with the calls: attempts, latest outcome, and
// status (do_not_call as soon as any call recorded an opt-out). Derived from the
// calls table each time, so re-delivered webhooks never double count.
export async function refreshLead(s, phone) {
  await s`
    update leads l set
      attempts = c.n, last_call_id = c.last_id, last_outcome = c.last_intent, last_called_at = c.last_at,
      status = case when c.opted_out then 'do_not_call' when c.n > 0 then 'called' else 'new' end
    from (
      select count(*)::int as n, bool_or(coalesce(opt_out, false)) as opted_out,
             (array_agg(id order by created_at desc))[1] as last_id,
             (array_agg(intent order by created_at desc))[1] as last_intent,
             max(created_at) as last_at
      from calls where customer_number = ${phone}) c
    where l.phone = ${phone}`;
}

// Row -> the shape the dashboard already consumes (same as api/_vapi.js summarise()).
export function rowToSummary(r) {
  return {
    id: r.id, type: r.type, status: r.status, endedReason: r.ended_reason,
    number: r.customer_number, createdAt: r.created_at, startedAt: r.started_at, endedAt: r.ended_at,
    cost: Number(r.cost_usd) || 0, intent: r.intent, reason: r.reason_category, optOut: r.opt_out,
  };
}
export function rowToDetail(r) {
  const messages = typeof r.messages === 'string' ? JSON.parse(r.messages) : (r.messages ?? []);
  return {
    ...rowToSummary(r),
    recordingUrl: r.recording_url, transcript: r.transcript ?? '',
    messages: messages.map((m) => ({ role: m.role, text: m.text, secondsFromStart: m.seconds_from_start ?? 0 })),
    analysis: {
      summary: r.summary || null,
      structuredData: r.intent == null && r.reason_category == null ? null : {
        intent: r.intent, reason_category: r.reason_category, reason_verbatim: r.reason_verbatim ?? '',
        opt_out_requested: r.opt_out, asked_if_bot: r.asked_if_bot, call_quality_ok: r.call_quality_ok,
      },
    },
    voice: r.voice, source: r.source,
  };
}
