// GET /api/config -> which assistant the dashboard is looking at, plus its stack.
import { vapi, requireAuth, fail } from './_vapi.js';

// Same assistant the Voice Agent page talks to. Kept in one place so the two
// cannot drift apart.
export const ASSISTANT_ID = '1c759c79-2692-43f0-b049-d1ffa363d386';

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
      firstMessage: a.firstMessage ?? '',
      updatedAt: a.updatedAt,
      // True once a Vapi phone number is connected (VAPI_PHONE_NUMBER_ID); until
      // then the List's Call button runs the agent in the browser instead.
      dialReady: !!process.env.VAPI_PHONE_NUMBER_ID,
    });
  } catch (e) { fail(res, e); }
}
