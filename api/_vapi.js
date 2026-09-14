// Shared helpers for the api/ serverless functions. Not a route (underscore prefix).
//
// The Vapi PRIVATE key lives only here, read from the environment. On Vercel set
// VAPI_PRIVATE_KEY in the project settings; locally put it in .env (gitignored).

import { timingSafeEqual } from 'node:crypto';

const API = 'https://api.vapi.ai';

export function requireEnv() {
  const key = process.env.VAPI_PRIVATE_KEY;
  if (!key) throw Object.assign(new Error('VAPI_PRIVATE_KEY is not set'), { status: 500 });
  return key;
}

// Optional gate: when DASHBOARD_PASSWORD is set, every api/ call must carry it as a
// bearer token. The page asks once and stores it. Unset = open (fine for a demo).
export function requireAuth(req, res) {
  const want = process.env.DASHBOARD_PASSWORD;
  if (!want) return true;
  const got = (req.headers.authorization || '').replace(/^Bearer\s+/i, '');
  if (sameSecret(got, want)) return true;
  res.status(401).json({ error: 'unauthorized' });
  return false;
}

// Constant-time compare so response timing does not leak how many characters match.
function sameSecret(a, b) {
  const x = Buffer.from(String(a)), y = Buffer.from(String(b));
  return x.length === y.length && timingSafeEqual(x, y);
}

export async function vapi(path) {
  const key = requireEnv();
  const r = await fetch(`${API}${path}`, { headers: { Authorization: `Bearer ${key}` } });
  const text = await r.text();
  let data;
  try { data = JSON.parse(text); } catch { data = text; }
  if (!r.ok) throw Object.assign(new Error(typeof data === 'string' ? data : data?.message ?? `Vapi ${r.status}`), { status: r.status });
  return data;
}

export function fail(res, err) {
  const status = err.status && err.status >= 400 && err.status < 600 ? err.status : 500;
  res.status(status).json({ error: err.message });
}

// One consistent shape for the list and the detail views.
export function summarise(c) {
  const sd = c.analysis?.structuredData ?? null;
  return {
    id: c.id,
    type: c.type ?? null,                     // webCall | outboundPhoneCall | inboundPhoneCall
    status: c.status,
    endedReason: c.endedReason ?? null,
    number: c.customer?.number ?? c.assistantOverrides?.variableValues?.leadPhone ?? null,
    createdAt: c.createdAt,
    startedAt: c.startedAt ?? null,
    endedAt: c.endedAt ?? null,
    cost: c.cost ?? 0,
    intent: sd?.intent ?? null,
    reason: sd?.reason_category ?? null,
    optOut: sd?.opt_out_requested ?? null,
  };
}
