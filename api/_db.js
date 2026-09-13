// Postgres access for the api/ functions. One connection string, read from
// DATABASE_URL (Supabase -> Connect -> Transaction pooler, port 6543).
//
// postgres.js with prepare:false, because Supabase's transaction pooler does not
// support prepared statements. max:1 because each serverless invocation is its
// own process; the pooler multiplexes on its side.

import postgres from 'postgres';

let _sql = null;
export function sql() {
  if (_sql) return _sql;
  const url = process.env.DATABASE_URL;
  if (!url) throw Object.assign(new Error('DATABASE_URL is not set'), { status: 500 });
  _sql = postgres(url, { prepare: false, max: 1, idle_timeout: 20, connect_timeout: 10, ssl: 'require' });
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
    customer_number: c.customer?.number || null,
    created_at: c.createdAt,
    started_at: c.startedAt ?? null,
    ended_at: c.endedAt ?? null,
    cost_usd: Number(c.cost ?? 0) || 0,
    recording_url: c.recordingUrl ?? art.recordingUrl ?? null,
    transcript: c.transcript ?? art.transcript ?? null,
    messages: JSON.stringify(messages),
    summary: c.analysis?.summary ?? c.summary ?? null,
    intent: sd.intent ?? null,
    reason_category: sd.reason_category ?? null,
    reason_verbatim: sd.reason_verbatim || null,
    opt_out: typeof sd.opt_out_requested === 'boolean' ? sd.opt_out_requested : null,
    asked_if_bot: typeof sd.asked_if_bot === 'boolean' ? sd.asked_if_bot : null,
    call_quality_ok: typeof sd.call_quality_ok === 'boolean' ? sd.call_quality_ok : null,
    voice: voice ? `${voice.provider ?? '?'}/${voice.voiceId ?? '?'}` : null,
    raw: JSON.stringify(c),
    source,
  };
}

// Insert or refresh a call. A later report for the same id (e.g. analysis
// arriving after the first webhook) overwrites the earlier, partial row.
export async function upsertCall(c, source) {
  const r = callToRow(c, source);
  const s = sql();
  await s`
    insert into calls ${s(r)}
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
  return r.id;
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
      summary: r.summary,
      structuredData: r.intent == null && r.reason_category == null ? null : {
        intent: r.intent, reason_category: r.reason_category, reason_verbatim: r.reason_verbatim ?? '',
        opt_out_requested: r.opt_out, asked_if_bot: r.asked_if_bot, call_quality_ok: r.call_quality_ok,
      },
    },
    voice: r.voice, source: r.source,
  };
}
