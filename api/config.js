// GET /api/config -> which assistant the dashboard is looking at, plus its stack.
import { vapi, requireAuth, fail, renderFirstMessage } from './_vapi.js';

// Same assistant the Voice Agent page talks to. Kept in one place so the two
// cannot drift apart.
export const ASSISTANT_ID = '47e67fec-8dc1-45e5-a1ef-3f91e8a0e7c6';

export default async function handler(req, res) {
  if (!requireAuth(req, res)) return;
  try {
    const a = await vapi(`/assistant/${ASSISTANT_ID}`);
    res.status(200).json({
      assistantId: a.id,
      assistantName: a.name,
      transcriber: `${a.transcriber?.provider ?? '?'}${a.transcriber?.language ? ' · ' + a.transcriber.language : ''}`,
      voice: `${a.voice?.provider ?? '?'} · ${a.voice?.voiceId ?? '?'}`,
      model: `${a.model?.provider ?? '?'} · ${a.model?.model ?? '?'}`,
      firstMessage: renderFirstMessage(a.firstMessage ?? ''),   // as it would be spoken right now
      firstTemplate: a.firstMessage ?? '',                      // the page renders it at call time for the feed
      updatedAt: a.updatedAt,
      // True once a Vapi phone number is connected (VAPI_PHONE_NUMBER_ID); until
      // then the List's Call button runs the agent in the browser instead.
      dialReady: !!process.env.VAPI_PHONE_NUMBER_ID,
    });
  } catch (e) { fail(res, e); }
}
