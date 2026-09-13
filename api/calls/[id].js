// GET /api/calls/:id -> one call with conversation, recording and analysis.
//
// From Postgres when the row exists and is complete. A call still in progress,
// or whose analysis has not landed yet, is fetched live from Vapi and, once it
// has ended, stored so the next read is local.

import { vapi, requireAuth, fail, summarise } from '../_vapi.js';
import { sql, rowToDetail, upsertCall } from '../_db.js';

function fromVapi(c) {
  return {
    ...summarise(c),
    recordingUrl: c.recordingUrl ?? c.artifact?.recordingUrl ?? null,
    transcript: c.transcript ?? '',
    // Only the two conversational roles; system/tool messages are noise here.
    messages: (c.messages ?? [])
      .filter((m) => m.role === 'bot' || m.role === 'user')
      .map((m) => ({ role: m.role, text: m.message ?? '', secondsFromStart: m.secondsFromStart ?? 0 })),
    analysis: { summary: c.analysis?.summary ?? null, structuredData: c.analysis?.structuredData ?? null },
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
      if (row && row.ended_at && (row.intent != null || row.summary != null)) {
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
