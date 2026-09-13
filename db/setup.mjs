// Applies db/schema.sql to DATABASE_URL. Idempotent.
//   node db/setup.mjs
import fs from 'node:fs';
import postgres from 'postgres';
import '../serve-env.mjs';

const url = process.env.DATABASE_URL;
if (!url) { console.error('DATABASE_URL is not set (put it in .env)'); process.exit(1); }
const sql = postgres(url, { prepare: false, max: 1, ssl: 'require' });
try {
  await sql.unsafe(fs.readFileSync(new URL('./schema.sql', import.meta.url), 'utf8'));
  const [{ count }] = await sql`select count(*)::int as count from calls`;
  const host = new URL(url).host;
  console.log(`schema applied on ${host}; calls in table: ${count}`);
} finally { await sql.end(); }
