// One-off backfill from the command line (same code path as POST /api/sync).
//   node db/sync.mjs
import '../serve-env.mjs';
import handler from '../api/sync.js';

const res = {
  code: 200, status(c) { this.code = c; return this; },
  json(o) { console.log(this.code, JSON.stringify(o, null, 2)); return this; },
  setHeader() {},
};
await handler({ method: 'POST', headers: { authorization: `Bearer ${process.env.DASHBOARD_PASSWORD ?? ''}` }, query: {} }, res);
process.exit(res.code === 200 ? 0 : 1);
