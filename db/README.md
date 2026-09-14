# Database

Your own copy of every call, in Supabase Postgres. Vapi pushes each finished call
in through a webhook; the dashboard reads from here instead of asking Vapi every
time. Until `DATABASE_URL` is set, the API falls back to reading Vapi directly, so
nothing breaks before the database exists.

## One-time setup (about 10 minutes)

**1. Create the project** at [supabase.com](https://supabase.com) → New project. Pick
a region close to Israel (eu-central is fine). Save the database password.

**2. Get the connection string.** Project page → **Connect** → **Transaction pooler**.
Copy the URI. It looks like:

```
postgres://postgres.<ref>:<password>@aws-0-<region>.pooler.supabase.com:6543/postgres
```

Port **6543** matters — that is the transaction pooler, which is what serverless
functions need.

**3. Create the tables.** Either:

- Supabase → SQL Editor → paste `db/schema.sql` → Run, **or**
- locally: put the URI in `.env` as `DATABASE_URL=...` then `npm run db:setup`

Safe to run more than once.

**4. Make a webhook secret.** Any long random string:

```bash
node -e "console.log(require('crypto').randomBytes(24).toString('hex'))"
```

**5. Set the environment variables** in Vercel → Project → Settings → Environment
Variables (and in local `.env`):

| Name | Value |
|---|---|
| `VAPI_PRIVATE_KEY` | from dashboard.vapi.ai → Settings → API Keys |
| `DATABASE_URL` | the pooler URI from step 2 |
| `VAPI_WEBHOOK_SECRET` | the string from step 4 |
| `DASHBOARD_PASSWORD` | the sign-in password for the dashboard (leave unset for no login) |

Redeploy after adding them (Vercel → Deployments → ⋯ → Redeploy).

**6. Point Vapi at the webhook.** Run once, after the site is deployed:

```bash
VAPI_TOKEN=<private key> node db/register-webhook.mjs https://<your-site>.vercel.app
```

This sets the assistant's server URL to
`https://<your-site>.vercel.app/api/webhook?token=<VAPI_WEBHOOK_SECRET>` and
subscribes it to `end-of-call-report`. From then on every finished call lands in
the table within a few seconds of ending.

**7. Backfill the calls that already happened:**

```bash
npm run db:sync
```

or, once deployed, `POST https://<your-site>.vercel.app/api/sync` (send the
dashboard password as a bearer token if you set one).

## What is stored

One row per call in `calls`: who/when/how long/cost, the recording URL, the full
conversation as JSON, the transcript, and the analysis the assistant produces
(intent, reason, verbatim quote, opt-out and asked-if-bot flags). The complete raw
Vapi payload is kept in `raw` so nothing is lost if we want a field later.

`webhook_log` records every delivery, so if a call ever fails to appear you can
see why.

## Verifying it works

- Supabase → Table Editor → `calls` should show rows after step 7.
- Make a browser call from the dashboard, hang up, wait ~10s, refresh Calls. The
  new call should appear with `source = webhook` (check in Table Editor).
- The API answers with an `X-Source: db` header when reading from Postgres and
  `X-Source: vapi` when falling back.

## Files

| | |
|---|---|
| `db/schema.sql` | tables, indexes, trigger |
| `db/setup.mjs` | applies the schema |
| `db/sync.mjs` | backfill from the command line |
| `db/register-webhook.mjs` | points the Vapi assistant at `/api/webhook` |
| `api/_db.js` | connection + Vapi→row mapping |
| `api/webhook.js` | receives end-of-call reports |
| `api/sync.js` | backfill endpoint |
