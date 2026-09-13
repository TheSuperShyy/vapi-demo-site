// GET /api/calls?limit=100 -> trimmed call list, newest first, with the analysis
// fields the overview needs (intent / reason) so it can chart them without a
// second round-trip per call.
import { vapi, requireAuth, fail, summarise } from './_vapi.js';

export default async function handler(req, res) {
  if (!requireAuth(req, res)) return;
  try {
    const limit = Math.min(Number(req.query?.limit ?? 100), 1000);
    const calls = await vapi(`/call?limit=${limit}`);
    res.setHeader('Cache-Control', 'no-store');
    res.status(200).json(calls.map(summarise));
  } catch (e) { fail(res, e); }
}
