# CLIX — Hebrew voice agent demo

A one-page site that lets anyone talk to the Hebrew voice agent from their browser.
No phone call, no forms: click, allow the microphone, speak.

Static HTML. No build step, no dependencies to install.

## Local preview

```bash
npx serve .
```

Microphone access needs a secure context. `localhost` counts as secure, so local
preview works; any other host must be HTTPS. Vercel gives you that automatically.

## Deploy

Push to GitHub, then import the repo at [vercel.com/new](https://vercel.com/new).
Vercel detects it as a static site — no framework, no build command, no root
directory to set.

## How it works

The page loads the Vapi Web SDK from jsDelivr and starts a WebRTC session straight
from the browser:

```js
const vapi = new Vapi(PUBLIC_KEY);
vapi.start(ASSISTANT_ID);
```

`PUBLIC_KEY` is a Vapi **public** key. Public keys are built to ship to browsers —
they can only start calls against assistants on the account, and cannot read data,
place phone calls, or spend outside that. The private key is never in this repo.

Live transcripts arrive on the `message` event and render as a conversation, with
partial results shown faded until they finalize.

## Configuration

Both ids are at the top of the `<script>` block in `index.html`:

| Constant | What it is |
|---|---|
| `PUBLIC_KEY` | Vapi public key, from Settings → API Keys |
| `ASSISTANT_ID` | The assistant to talk to |

## Lock this down before sharing widely

The public key is currently set to **All domains allowed** with **transient
assistants allowed**. That means anyone who views source can lift the key and run
calls against your account from their own page, on your credit.

Once the Vercel URL exists, go to Vapi → Settings → API Keys and restrict the public
key to that origin. Consider turning transient assistants off too — this page does
not use them.

## Related

The agent itself (prompt, voice config, outbound calling, local dashboard) lives in
the `Apify-v3/scripts/vapi/` project. This repo is only the public test page, kept
separate so no lead data can ever be committed here.
