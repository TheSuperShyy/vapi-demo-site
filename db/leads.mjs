// Imports the calling list into the leads table.
//   node db/leads.mjs <path-to.csv>            upsert by phone (safe to re-run)
//   node db/leads.mjs <path-to.csv> --replace  empty the table first
//
// The CSV needs the columns phone, name, city (header row, any order). Row order
// becomes `position`, the campaign calling order. Phones are normalised to E.164
// so they match what Vapi reports on calls. Prints counts only, never a row.

import fs from 'node:fs';
import postgres from 'postgres';
import '../serve-env.mjs';

const file = process.argv[2];
const replace = process.argv.includes('--replace');
if (!file || !fs.existsSync(file)) { console.error('Usage: node db/leads.mjs <file.csv> [--replace]'); process.exit(1); }
const url = process.env.DATABASE_URL;
if (!url) { console.error('DATABASE_URL is not set (put it in .env)'); process.exit(1); }

// ---------------------------------------------------------------- csv
function parseCsv(text) {
  const rows = []; let row = [], cell = '', q = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (q) { if (c === '"') { if (text[i + 1] === '"') { cell += '"'; i++; } else q = false; } else cell += c; }
    else if (c === '"') q = true;
    else if (c === ',') { row.push(cell); cell = ''; }
    else if (c === '\n' || c === '\r') { if (c === '\r' && text[i + 1] === '\n') i++; row.push(cell); rows.push(row); row = []; cell = ''; }
    else cell += c;
  }
  if (cell !== '' || row.length) { row.push(cell); rows.push(row); }
  return rows.filter((r) => r.some((v) => v.trim() !== ''));
}

// Israeli numbers in any common spelling -> +972XXXXXXXXX. Returns null if it is not a number.
export function toE164(raw) {
  let d = String(raw ?? '').replace(/\D/g, '');
  if (!d) return null;
  if (d.startsWith('972')) d = d.slice(3);
  else if (d.startsWith('0')) d = d.slice(1);
  if (d.length < 8 || d.length > 9) return null;
  return '+972' + d;
}

// ---------------------------------------------------------------- run
const text = fs.readFileSync(file, 'utf8').replace(/^﻿/, '');
const rows = parseCsv(text);
const header = rows[0].map((h) => h.trim().toLowerCase());
const col = (n) => header.indexOf(n);
if (col('phone') < 0) { console.error(`no "phone" column; header is: ${header.join(',')}`); process.exit(1); }
const iPhone = col('phone'), iName = col('name') >= 0 ? col('name') : col('title'), iCity = col('city');

const seen = new Map(); let bad = 0, dupes = 0;
rows.slice(1).forEach((r, i) => {
  const phone = toE164(r[iPhone]);
  if (!phone) { bad++; return; }
  if (seen.has(phone)) { dupes++; return; }          // first occurrence keeps the earlier position
  seen.set(phone, { position: i + 1, phone, phone_raw: String(r[iPhone] ?? '').trim(), name: iName >= 0 ? String(r[iName] ?? '').trim() || null : null, city: iCity >= 0 ? String(r[iCity] ?? '').trim() || null : null });
});
const leads = [...seen.values()];
console.log(`read ${rows.length - 1} rows -> ${leads.length} unique numbers (${dupes} duplicates, ${bad} unusable)`);

const sql = postgres(url, { prepare: false, max: 1, ssl: 'require' });
try {
  if (replace) { await sql`truncate leads restart identity`; console.log('table emptied'); }
  const BATCH = 500;
  for (let i = 0; i < leads.length; i += BATCH) {
    const batch = leads.slice(i, i + BATCH);
    await sql`insert into leads ${sql(batch, 'position', 'phone', 'phone_raw', 'name', 'city')}
      on conflict (phone) do update set position = excluded.position, phone_raw = excluded.phone_raw, name = excluded.name, city = excluded.city`;
    process.stdout.write(`\r  written ${Math.min(i + BATCH, leads.length)}/${leads.length}`);
  }
  console.log('');
  // Bring status/attempts in line with any calls that already exist for these numbers.
  await sql`
    update leads l set
      attempts = c.n, last_call_id = c.last_id, last_outcome = c.last_intent, last_called_at = c.last_at,
      status = case when c.opted_out then 'do_not_call' when c.n > 0 then 'called' else 'new' end
    from (
      select customer_number as phone, count(*)::int as n, bool_or(coalesce(opt_out, false)) as opted_out,
             (array_agg(id order by created_at desc))[1] as last_id,
             (array_agg(intent order by created_at desc))[1] as last_intent,
             max(created_at) as last_at
      from calls where customer_number is not null group by 1) c
    where c.phone = l.phone`;
  const [{ n }] = await sql`select count(*)::int as n from leads`;
  const cities = await sql`select city, count(*)::int as n from leads group by 1 order by 2 desc limit 6`;
  const [st] = await sql`select count(*) filter (where status = 'new')::int as new, count(*) filter (where status = 'called')::int as called, count(*) filter (where status = 'do_not_call')::int as dnc from leads`;
  console.log(`leads in table: ${n} | new ${st.new}, called ${st.called}, do-not-call ${st.dnc}`);
  console.log('top cities: ' + cities.map((c) => `${c.city ?? '(none)'}=${c.n}`).join(', '));
} finally { await sql.end(); }
