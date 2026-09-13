-- Voice agent call store. Run once in Supabase: SQL Editor -> paste -> Run.
-- Idempotent: safe to re-run.

create table if not exists calls (
  id               text primary key,                 -- Vapi call id
  assistant_id     text,
  type             text,                             -- webCall | outboundPhoneCall | inboundPhoneCall
  status           text,
  ended_reason     text,
  customer_number  text,                             -- E.164 when it was a phone call
  created_at       timestamptz not null,
  started_at       timestamptz,
  ended_at         timestamptz,
  duration_seconds integer generated always as
                     (case when started_at is not null and ended_at is not null
                           then greatest(0, extract(epoch from (ended_at - started_at))::int)
                           else null end) stored,
  cost_usd         numeric(10,4) not null default 0,
  recording_url    text,
  transcript       text,
  messages         jsonb not null default '[]'::jsonb,   -- [{role, text, seconds_from_start}]
  summary          text,
  intent           text,                             -- yes | no | unsure | refused | not_reached
  reason_category  text,
  reason_verbatim  text,
  opt_out          boolean,
  asked_if_bot     boolean,
  call_quality_ok  boolean,
  voice            text,                             -- provider/voiceId actually used
  raw              jsonb,                            -- full Vapi payload, for anything we did not model
  source           text not null default 'webhook',  -- webhook | backfill
  received_at      timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

create index if not exists calls_created_at_idx on calls (created_at desc);
create index if not exists calls_intent_idx     on calls (intent);
create index if not exists calls_number_idx     on calls (customer_number) where customer_number is not null;

-- Webhook deliveries, so a bad payload is debuggable and retries are visible.
create table if not exists webhook_log (
  id          bigserial primary key,
  received_at timestamptz not null default now(),
  event_type  text,
  call_id     text,
  ok          boolean not null,
  error       text
);
create index if not exists webhook_log_received_idx on webhook_log (received_at desc);

-- keep updated_at honest
create or replace function touch_updated_at() returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end $$;
drop trigger if exists calls_touch on calls;
create trigger calls_touch before update on calls for each row execute function touch_updated_at();

-- Lock the tables down: the API talks to Postgres directly with the service
-- connection string, so nothing needs anon/public access through PostgREST.
alter table calls       enable row level security;
alter table webhook_log enable row level security;
