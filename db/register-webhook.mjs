// Points the Vapi assistant at this site's webhook. Run once after deploying.
//   VAPI_TOKEN=<private key> node db/register-webhook.mjs https://your-site.vercel.app
//
// Uses ?token= in the URL because Vapi's newer auth wants a credential object
// created in its dashboard; the token form needs nothing outside this repo.
// Pass --dry to print the patch without sending it.

import '../serve-env.mjs';

const TOKEN = process.env.VAPI_TOKEN ?? process.env.VAPI_PRIVATE_KEY;
const SECRET = process.env.VAPI_WEBHOOK_SECRET;
const ASSISTANT_ID = '1c759c79-2692-43f0-b049-d1ffa363d386';
const base = (process.argv[2] ?? '').replace(/\/+$/, '');
const dry = process.argv.includes('--dry');

if (!TOKEN) { console.error('Set VAPI_TOKEN (or VAPI_PRIVATE_KEY in .env).'); process.exit(1); }
if (!SECRET) { console.error('Set VAPI_WEBHOOK_SECRET in .env - the webhook refuses posts without it.'); process.exit(1); }
if (!/^https:\/\//.test(base)) { console.error('Usage: node db/register-webhook.mjs https://your-site.vercel.app'); process.exit(1); }

const url = `${base}/api/webhook?token=${encodeURIComponent(SECRET)}`;
const patch = { server: { url, timeoutSeconds: 20 }, serverMessages: ['end-of-call-report'] };
console.log('PATCH /assistant/' + ASSISTANT_ID);
console.log(JSON.stringify({ ...patch, server: { ...patch.server, url: url.replace(SECRET, '<secret>') } }, null, 2));
if (dry) process.exit(0);

const r = await fetch(`https://api.vapi.ai/assistant/${ASSISTANT_ID}`, {
  method: 'PATCH',
  headers: { Authorization: `Bearer ${TOKEN}`, 'Content-Type': 'application/json' },
  body: JSON.stringify(patch),
});
const body = await r.json().catch(() => ({}));
if (!r.ok) { console.error(`Vapi ${r.status}:`, JSON.stringify(body, null, 2)); process.exit(1); }
console.log(`\nregistered. assistant "${body.name}" now reports to ${base}/api/webhook`);
console.log(`serverMessages: ${JSON.stringify(body.serverMessages)}`);
