// Local dev server. Serves the static site and mounts the api/ serverless handlers so
// the exact code that runs on Vercel runs here too. Reads .env for VAPI_PRIVATE_KEY.
//   node serve.mjs          -> http://localhost:3000
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

// .env loader (no dependency): KEY=value lines, # comments
try {
  for (const line of fs.readFileSync('.env', 'utf8').split('\n')) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
  }
} catch {}

const PORT = Number(process.env.PORT ?? 3000);
const ROOT = process.cwd();
const TYPES = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8', '.svg': 'image/svg+xml', '.png': 'image/png',
  '.md': 'text/markdown; charset=utf-8',
};

// Vercel-style handler shim: (req, res) with res.status().json() and req.query.
function vercelify(req, res, url, query) {
  req.query = { ...Object.fromEntries(url.searchParams), ...query };
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
      vercelify(req, res, url, r.query);
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
}).listen(PORT, '127.0.0.1', () => console.log(`\n  http://localhost:${PORT}\n  private key: ${process.env.VAPI_PRIVATE_KEY ? 'loaded' : 'MISSING (api routes will 500)'}\n`));
