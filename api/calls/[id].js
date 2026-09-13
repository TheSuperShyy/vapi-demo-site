// GET /api/calls/:id -> everything the detail panel shows: conversation turns,
// recording, cost, and the structured analysis the assistant fills in after each call.
import { vapi, requireAuth, fail, summarise } from '../_vapi.js';

export default async function handler(req, res) {
  if (!requireAuth(req, res)) return;
  const id = String(req.query?.id ?? '');
  if (!/^[\w-]+$/.test(id)) return res.status(400).json({ error: 'bad id' });
  try {
    const c = await vapi(`/call/${id}`);
    res.setHeader('Cache-Control', 'no-store');
    res.status(200).json({
      ...summarise(c),
      recordingUrl: c.recordingUrl ?? c.artifact?.recordingUrl ?? null,
      transcript: c.transcript ?? '',
      // Only the two conversational roles; system/tool messages are noise here.
      messages: (c.messages ?? [])
        .filter((m) => m.role === 'bot' || m.role === 'user')
        .map((m) => ({ role: m.role, text: m.message ?? '', secondsFromStart: m.secondsFromStart ?? 0 })),
      analysis: {
        summary: c.analysis?.summary ?? null,
        structuredData: c.analysis?.structuredData ?? null,
      },
    });
  } catch (e) { fail(res, e); }
}
