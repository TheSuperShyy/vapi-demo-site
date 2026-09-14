// GET /api/calls/:id -> one call with conversation, recording and analysis.
//
// From Postgres when the row exists and is settled. A call still in progress,
// or whose analysis may still be on its way, is fetched live from Vapi and, once
// it has ended, stored so the next read is local.

// Vapi runs the analysis before it sends end-of-call-report, so webhook rows are
// final. Backfilled rows without analysis are final once the call is old enough
// that no analysis is coming (it normally lands within a minute or two).
const ANALYSIS_GRACE_MS = 10 * 60 * 1000;
function settled(row) {
  if (!row || !row.ended_at) return false;
  if (row.intent != null || row.summary != null) return true;
  if (row.source === 'webhook' || row.source === 'simulated') return true;   // nothing more is coming for these
  return Date.now() - new Date(row.ended_at).getTime() > ANALYSIS_GRACE_MS;
}

import { vapi, requireAuth, fail, summarise } from '../_vapi.js';
import { sql, rowToDetail, upsertCall } from '../_db.js';

function fromVapi(c) {
  const voice = c.assistantOverrides?.voice ?? c.assistant?.voice ?? null;
  return {
    ...summarise(c),
    recordingUrl: c.recordingUrl ?? c.artifact?.recordingUrl ?? null,
    transcript: c.transcript ?? '',
    // Only the two conversational roles; system/tool messages are noise here.
    messages: (c.messages ?? [])
      .filter((m) => m.role === 'bot' || m.role === 'user')
      .map((m) => ({ role: m.role, text: m.message ?? '', secondsFromStart: m.secondsFromStart ?? 0 })),
    analysis: { summary: c.analysis?.summary || null, structuredData: c.analysis?.structuredData ?? null },
    voice: voice ? `${voice.provider ?? '?'}/${voice.voiceId ?? '?'}` : null,
    source: 'vapi',
  };
}

export default async function handler(req, res) {
  if (!requireAuth(req, res)) return;
  const id = String(req.query?.id ?? '');
  if (!/^[\w-]+$/.test(id)) return res.status(400).json({ error: 'bad id' });
  res.setHeader('Cache-Control', 'no-store');
  try {
    if (process.env.DATABASE_URL) {
      const [row] = await sql()`select * from calls where id = ${id}`;
      if (settled(row)) {
        res.setHeader('X-Source', 'db');
        return res.status(200).json(rowToDetail(row));
      }
    }
    const c = await vapi(`/call/${id}`);
    if (process.env.DATABASE_URL && c.endedAt) {
      try { await upsertCall(c, 'backfill'); } catch (e) { console.error('[detail store]', e.message); }
    }
    res.setHeader('X-Source', 'vapi');
    res.status(200).json(fromVapi(c));
  } catch (e) { fail(res, e); }
}
