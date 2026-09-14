// GET /api/stats?days=7|30|90 -> the numbers on the Overview, computed by the
// database so they stay right at any volume:
//   { total, ended, live, avgSeconds, cost, intents:{yes,no,...}, perDay:[{day,n,yes,no,unsure,not_reached}], inRange, recent:[8] }
// Days are bucketed in Israel time (the campaign's clock), not the viewer's.
// Without DATABASE_URL the same shape is computed from Vapi's list (max 1000).

import { vapi, requireAuth, fail } from './_vapi.js';
import { sql, rowToSummary } from './_db.js';
import { INTENTS, TZ, statsFromList, summariseAll } from './_list.js';

export default async function handler(req, res) {
  if (!requireAuth(req, res)) return;
  const days = [7, 30, 90].includes(Number(req.query?.days)) ? Number(req.query.days) : 7;
  res.setHeader('Cache-Control', 'no-store');
  try {
    if (!process.env.DATABASE_URL) {
      res.setHeader('X-Source', 'vapi');
      return res.status(200).json(statsFromList(summariseAll(await vapi('/call?limit=1000')), days));
    }
    const s = sql();
    // One round trip: four sub-selects packed into a single row.
    const [r] = await s`
      select
        (select json_build_object(
            'total', count(*),
            'ended', count(*) filter (where ended_at is not null),
            'live', count(*) filter (where ended_at is null and status in ('in-progress', 'ringing', 'queued')),
            'avgSeconds', coalesce(avg(duration_seconds) filter (where duration_seconds > 0), 0),
            'cost', coalesce(sum(cost_usd), 0))
          from calls) as totals,
        (select coalesce(json_object_agg(k, n), '{}'::json)
          from (select (case when intent in ('yes', 'no', 'unsure', 'refused', 'not_reached') then intent else 'unknown' end) as k, count(*)::int as n from calls group by 1) i) as intents,
        (select json_agg(json_build_object('day', to_char(d.day, 'YYYY-MM-DD'), 'n', coalesce(c.n, 0),
              'yes', coalesce(c.yes, 0), 'no', coalesce(c.no, 0), 'unsure', coalesce(c.unsure, 0), 'not_reached', coalesce(c.not_reached, 0)) order by d.day)
          from generate_series(
            (now() at time zone ${TZ})::date - (${days}::int - 1),
            (now() at time zone ${TZ})::date, interval '1 day') as d(day)
          left join (
            select (created_at at time zone ${TZ})::date as day, count(*)::int as n,
                   count(*) filter (where intent = 'yes')::int as yes, count(*) filter (where intent = 'no')::int as "no",
                   count(*) filter (where intent = 'unsure')::int as unsure, count(*) filter (where intent = 'not_reached')::int as not_reached
            from calls where created_at >= now() - (${days}::int + 1) * interval '1 day' group by 1) c
          on c.day = d.day::date) as per_day,
        (select coalesce(json_agg(row_to_json(r)), '[]'::json)
          from (select id, type, status, ended_reason, customer_number, created_at, started_at, ended_at, cost_usd, intent, reason_category, opt_out
                from calls order by created_at desc, id desc limit 8) r) as recent`;
    const intents = Object.fromEntries(INTENTS.map((k) => [k, 0]));
    for (const [k, n] of Object.entries(r.intents ?? {})) intents[INTENTS.includes(k) ? k : 'unknown'] += Number(n);
    const perDay = r.per_day ?? [];
    res.setHeader('X-Source', 'db');
    res.status(200).json({
      total: Number(r.totals.total), ended: Number(r.totals.ended), live: Number(r.totals.live),
      avgSeconds: Number(r.totals.avgSeconds), cost: Number(r.totals.cost),
      intents, perDay, inRange: perDay.reduce((a, b) => a + Number(b.n), 0),
      recent: (r.recent ?? []).map(rowToSummary),
    });
  } catch (e) { fail(res, e); }
}
