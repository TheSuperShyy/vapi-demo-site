// Local dev server. Serves the static site and mounts the api/ serverless handlers so
// the exact code that runs on Vercel runs here too. Reads .env for VAPI_PRIVATE_KEY.
//   node serve.mjs          -> http://localhost:3000
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

import './serve-env.mjs';

// NO_DB=1 forces the Vapi fallback even when .env has DATABASE_URL (handy for
// comparing the two paths side by side on different ports).
if (process.env.NO_DB) delete process.env.DATABASE_URL;

const PORT = Number(process.env.PORT ?? 3000);
const ROOT = process.cwd();
const TYPES = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8', '.svg': 'image/svg+xml', '.png': 'image/png',
  '.md': 'text/markdown; charset=utf-8',
};

// Vercel-style handler shim: (req, res) with res.status().json() and req.query.
async function vercelify(req, res, url, query) {
  req.query = { ...Object.fromEntries(url.searchParams), ...query };
  if (req.method === 'POST' || req.method === 'PUT') {
    let raw = ''; for await (const c of req) raw += c;
    try { req.body = raw ? JSON.parse(raw) : {}; } catch { req.body = raw; }
  }
  res.status = (c) => { res.statusCode = c; return res; };
  res.json = (o) => { res.setHeader('Content-Type', 'application/json; charset=utf-8'); res.end(JSON.stringify(o)); return res; };
  res.send = (s) => { res.end(s); return res; };
}

async function apiRoute(pathname) {
  // /api/calls/abc -> api/calls/[id].js ; /api/calls -> api/calls.js ; /api/config -> api/config.js
  const parts = pathname.replace(/^\/api\/?/, '').split('/').filter(Boolean);
  if (parts.some((p) => p.startsWith('_'))) return null;   // helpers are not routes (Vercel does the same)
  const candidates = [];
  if (parts.length === 1) candidates.push([`api/${parts[0]}.js`, {}], [`api/${parts[0]}/index.js`, {}]);
  if (parts.length === 2) candidates.push([`api/${parts[0]}/[id].js`, { id: parts[1] }]);
  for (const [file, query] of candidates) {
    if (fs.existsSync(path.join(ROOT, file))) {
      // Route files reload on every request. Their imports (api/_vapi.js, api/_db.js)
      // are cached by Node until the server restarts - restart after editing those.
      const mod = await import(pathToFileURL(path.join(ROOT, file)).href + `?t=${Date.now()}`);
      return { handler: mod.default, query };
    }
  }
  return null;
}

http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  try {
    if (url.pathname.startsWith('/api/')) {
      const r = await apiRoute(url.pathname);
      if (!r) { res.writeHead(404, { 'Content-Type': 'application/json' }); return res.end('{"error":"not found"}'); }
      await vercelify(req, res, url, r.query);
      return await r.handler(req, res);
    }
    // static, with Vercel cleanUrls behaviour: /demo -> demo.html
    let rel = decodeURIComponent(url.pathname);
    let file = path.join(ROOT, rel === '/' ? 'index.html' : rel);
    if (!file.startsWith(ROOT)) { res.writeHead(403); return res.end(); }
    if (!fs.existsSync(file) && fs.existsSync(file + '.html')) file += '.html';
    if (!fs.existsSync(file) || fs.statSync(file).isDirectory()) {
      res.writeHead(404, { 'Content-Type': 'text/plain' }); return res.end('not found');
    }
    res.writeHead(200, { 'Content-Type': TYPES[path.extname(file)] ?? 'application/octet-stream', 'Cache-Control': 'no-store' });
    res.end(fs.readFileSync(file));
  } catch (err) {
    console.error(`[error] ${url.pathname}: ${err.message}`);
    if (!res.headersSent) res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: err.message }));
  }
}).listen(PORT, '127.0.0.1', () => console.log([
  '',
  `  http://localhost:${PORT}`,
  `  VAPI_PRIVATE_KEY    : ${process.env.VAPI_PRIVATE_KEY ? 'loaded' : 'MISSING (api routes will 500)'}`,
  `  DATABASE_URL        : ${process.env.DATABASE_URL ? 'loaded - calls read from Postgres' : 'not set - calls read from Vapi directly'}`,
  `  VAPI_WEBHOOK_SECRET : ${process.env.VAPI_WEBHOOK_SECRET ? 'loaded' : 'not set - webhook refuses all posts'}`,
  '',
].join('\n')));
