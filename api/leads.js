// GET /api/leads?page=1&size=10&q=text&city=<name>&status=new|called|do_not_call
//   -> { items, total, page, size, pages, cities:[{city,n}], statuses:{new,called,do_not_call} }
//
// The calling list, in campaign order, one page at a time. `q` matches name,
// phone (any spelling: digits are compared) and city. The list lives only in
// Postgres; with no DATABASE_URL this answers 409 and the page explains.

import { requireAuth, fail } from './_vapi.js';
import { sql } from './_db.js';
import { escapeLike } from './_list.js';

const STATUSES = ['new', 'called', 'do_not_call'];

// Typed digits -> a LIKE pattern over the stored +972 number. 050…, 00972 50…,
// +972 050… all anchor at the start; a bare fragment matches anywhere.
export function phonePattern(digits) {
  let d = digits;
  if (d.length < 3) return null;
  if (d.startsWith('00')) d = d.slice(2);
  if (d.startsWith('972')) { d = d.slice(3); if (d.startsWith('0')) d = d.slice(1); return '+972' + escapeLike(d) + '%'; }
  if (d.startsWith('0')) return '+972' + escapeLike(d.slice(1)) + '%';
  return '%' + escapeLike(d) + '%';
}

export default async function handler(req, res) {
  if (!requireAuth(req, res)) return;
  res.setHeader('Cache-Control', 'no-store');
  if (!process.env.DATABASE_URL) return res.status(409).json({ error: 'The calling list needs the database. Set DATABASE_URL - see db/README.md.' });
  const q = req.query ?? {};
  const page = Math.max(1, Math.floor(Number(q.page)) || 1);
  const size = Math.min(100, Math.max(1, Math.floor(Number(q.size)) || 10));
  const text = String(q.q ?? '').trim().slice(0, 100);
  const city = String(q.city ?? '').trim().slice(0, 80);
  const status = STATUSES.includes(q.status) ? q.status : '';
  try {
    const s = sql();
    const like = `%${escapeLike(text.toLowerCase())}%`;
    // Typed digits match the stored E.164 number: a local prefix such as 050 or 03
    // becomes +97250 / +9723 anchored at the start; anything else matches anywhere.
    const phonePat = phonePattern(text.replace(/\D/g, ''));
    const where = s`where true
      ${text ? s`and (lower(name) like ${like} or lower(city) like ${like} or lower(phone_raw) like ${like} ${phonePat ? s`or phone like ${phonePat}` : s``})` : s``}
      ${city ? s`and city = ${city}` : s``}
      ${status ? s`and status = ${status}` : s``}`;
    const [{ total }] = await s`select count(*)::int as total from leads ${where}`;
    const pages = Math.max(1, Math.ceil(total / size));
    const p = Math.min(page, pages);
    const rows = await s`
      select id, position, phone, phone_raw, name, city, status, attempts, last_call_id, last_outcome, last_called_at
      from leads ${where} order by position asc limit ${size} offset ${(p - 1) * size}`;
    // Facets are over the whole list (not the current filter) so the chips stay stable.
    const cities = await s`select coalesce(city, '') as city, count(*)::int as n from leads group by 1 order by 2 desc limit 12`;
    const [st] = await s`select count(*) filter (where status = 'new')::int as new, count(*) filter (where status = 'called')::int as called, count(*) filter (where status = 'do_not_call')::int as do_not_call, count(*)::int as all from leads`;
    res.setHeader('X-Source', 'db');
    res.status(200).json({
      items: rows.map((r) => ({ id: r.id, position: r.position, phone: r.phone, phoneRaw: r.phone_raw, name: r.name, city: r.city, status: r.status, attempts: r.attempts, lastCallId: r.last_call_id, lastOutcome: r.last_outcome, lastCalledAt: r.last_called_at })),
      total, page: p, size, pages, cities, statuses: { new: st.new, called: st.called, do_not_call: st.do_not_call, all: st.all },
    });
  } catch (e) { fail(res, e); }
}
