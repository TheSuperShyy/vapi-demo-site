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

The page is written for the person running the campaign, not for an analyst. It is
four cards of whole numbers and plain sentences, in reading order:

1. **What happened.** One sentence, then three numbers with arrows between them:
   people called, people who answered, people who said they will vote. While fewer
   than 30 have answered, a note under them says plainly that this is far too few
   to conclude anything from.
2. **Why the other N calls did not work.** A count and an everyday phrase for each
   ("picked up, then hung up", "nobody said a word", "the call broke"). They add up
   to the number in the card's title.
3. **What the N people said.** Will vote / will not vote / not sure, one sentence
   naming the reason behind a "no", and their own words.
4. **What to do next.** Up to five instructions, worst first, each with the count
   that justifies it. These are plain rules over the numbers (`todos()` in
   `pages.js`), so the list is the same with or without the AI.

There are no percentages and no charts on the page: "4 of 25" needs no decoding,
"16%" does. Everything an analyst would still want — how Noa handled the calls,
by city, day by day — is counted the same way and folded under **All the numbers**
at the bottom, along with the Excel export.

`/api/analysis?days=7|30|90` returns everything those cards need: the funnel
(reached, answered, yes/no/unsure, refused, not reached, opt-outs, early hang-ups),
reasons for not voting, how unanswered calls ended, what Noa did, by city, by day,
and the latest quotes.

## The AI read of the numbers

Gemini writes two things and no more, through OpenRouter (`OPENROUTER_API_KEY`, model
in `OPENROUTER_MODEL`, default `google/gemini-3.8-flash`): the short paragraph under
the three numbers at the top, and any suggestions the counted to-do list missed. Both
are labelled, so nobody has to wonder which parts were counted and which were written.

The prompt is what keeps it readable: write for someone who is not technical, never use
a percentage, never list the counts back (the reader can see them), never repeat the
warning about too few answers or any action the page already worked out, and never
write as if a handful of answers were a verdict. An empty suggestion list is an
accepted answer, and the block disappears when it is empty. The model never touches
the database: `api/_insights.js` hands it only the counts from `/api/analysis` and the
recorded quotes.

Each write-up is stored in the `insights` table, so opening the page costs nothing:
`/api/analysis?insight=1&days=N&lang=en|he` reads the stored one, and a `POST` to the
same route writes a new one. The page rewrites it by itself once more calls have landed
than it was written from, and "Write again" forces a fresh one. A run costs about
$0.002. Without the key the page still works and shows the counted cards only.

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
