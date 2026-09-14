// GET /api/calls?page=1&size=10&q=text&intents=yes,no&types=webCall&locate=<id>
//   -> { items, total, page, size, pages }   newest first
//
// One page at a time from Postgres, with the search done in SQL, so the browser
// never downloads the whole history. `q` matches number, id, ended reason and
// reason category; `intents`/`types` are OR-ed in (the page turns a typed label
// such as "Will vote" into intents=yes). `locate=<id>` answers with the page
// that holds that call under the same filter, for deep links.
//
// With no DATABASE_URL the same shape is computed in memory from Vapi's list
// (capped at Vapi's 1000), so the dashboard works before the database exists.

import { vapi, requireAuth, fail } from './_vapi.js';
import { sql, rowToSummary } from './_db.js';
import { listParams, escapeLike, pageList, summariseAll } from './_list.js';

const COLS = 'id, type, status, ended_reason, customer_number, created_at, started_at, ended_at, cost_usd, intent, reason_category, opt_out';

export default async function handler(req, res) {
  if (!requireAuth(req, res)) return;
  const p = listParams(req.query);
  res.setHeader('Cache-Control', 'no-store');
  try {
    if (!process.env.DATABASE_URL) {
      res.setHeader('X-Source', 'vapi');
      return res.status(200).json(pageList(summariseAll(await vapi('/call?limit=1000')), p));
    }
    const s = sql();
    const like = `%${escapeLike(p.text)}%`;
    const noFilter = !p.text && !p.intents.length && !p.types.length;
    // OR of the three filters; an empty filter set matches everything.
    const where = s`where ${noFilter ? s`true` : s`(
      (${p.text !== ''} and (customer_number ilike ${like} or id ilike ${like} or ended_reason ilike ${like} or reason_category ilike ${like} or intent ilike ${like}))
      or (${p.intents.length > 0} and (case when intent in ('yes', 'no', 'unsure', 'refused', 'not_reached') then intent else 'unknown' end) = any(${p.intents}::text[]))
      or (${p.types.length > 0} and type = any(${p.types}::text[]))
    )`}`;

    const [{ total }] = await s`select count(*)::int as total from calls ${where}`;
    const pages = Math.max(1, Math.ceil(total / p.size));
    let page = Math.min(p.page, pages);
    if (p.locate) {
      // rank of the wanted call within the same filter and ordering -> its page
      const [hit] = await s`select created_at from calls where id = ${p.locate}`;
      if (hit) {
        const [{ before }] = await s`select count(*)::int as before from calls ${where}
          and (created_at > ${hit.created_at} or (created_at = ${hit.created_at} and id > ${p.locate}))`;
        const [{ present }] = await s`select count(*)::int as present from calls ${where} and id = ${p.locate}`;
        if (present) page = Math.floor(before / p.size) + 1;
      }
    }
    const rows = await s`select ${s.unsafe(COLS)} from calls ${where}
      order by created_at desc, id desc limit ${p.size} offset ${(page - 1) * p.size}`;
    res.setHeader('X-Source', 'db');
    res.status(200).json({ items: rows.map(rowToSummary), total, page, size: p.size, pages });
  } catch (e) { fail(res, e); }
}
