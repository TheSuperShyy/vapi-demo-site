# Voice of the People Headquarters (מטה קול העם) — Hebrew voice agent demo

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

## Pages

Overview (totals, calls per day, intent split), Calls (every conversation with
transcript, recording and analysis, paged), Analysis (see below), List (the
calling list in campaign order with per-number status), Voice Agent (talk to her
from the browser) and Settings. Totals and pages are computed by the database, so
the dashboard stays fast at any number of calls. Under 900px wide the sidebar
becomes a bottom tab bar and tables become stacked cards.

## Analysis and the Excel report

`/api/analysis?days=7|30|90` returns, for the range: the funnel (reached, answered,
yes/no/unsure, refused, not reached, opt-outs, early hang-ups), reasons for not
voting, how unanswered calls ended (Vapi's `endedReason` folded into groups), what
the agent did (detected from her own transcript lines; the phrases are
`SCRIPT_MARKERS` in `api/_analysis.js`, update them when the script changes), per
city (joined to the calling list by phone), per day, and the latest quotes. The
page's "Key findings" are plain rules over those numbers, no AI model.

## The AI read of the numbers

The Analysis page opens with a short write-up ("What this means"): a headline, a few
findings, why people will not vote, what went wrong, and what to change. Gemini writes
it through OpenRouter (`OPENROUTER_API_KEY`, model in `OPENROUTER_MODEL`, default
`google/gemini-3.8-flash`). The model never touches the database: `api/_insights.js`
hands it only the counts from `/api/analysis` and the recorded quotes, and the prompt
forbids inventing anything, so every sentence traces back to a number on the page.

Each write-up is stored in the `insights` table, so opening the page costs nothing:
`/api/analysis?insight=1&days=N&lang=en|he` reads the stored one, and a `POST` to the
same route writes a new one. The page rewrites it by itself once more calls have landed
than it was written from, and "Write again" forces a fresh one. A run costs about
$0.002. Without the key the page still works and shows the counted findings only.

`/api/export?days=N&lang=en|he` downloads the same data as an `.xlsx` workbook
(Summary, Daily, Calls, Reasons, Cities, Quotes) written by `api/_xlsx.js`, with
no spreadsheet dependency. Both routes need `DATABASE_URL`.

## Sign-in

Set `DASHBOARD_PASSWORD` (Vercel → Settings → Environment Variables) and the
dashboard shows a sign-in screen before any call data. The password is checked by
`api/auth.js`, remembered in the browser until you sign out (sidebar or Settings),
and every `api/` route refuses requests that do not carry it. Leave it unset and
there is no login at all. `/demo` is always open: it only uses the public key.

## Database

Calls are stored in your own Supabase Postgres, filled by a Vapi webhook and read
by the dashboard. Setup, backfill and verification are in [db/README.md](db/README.md).
Until `DATABASE_URL` is set the API reads from Vapi directly, so the site works
either way.

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
