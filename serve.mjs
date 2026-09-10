// Tiny static server for local preview. localhost counts as a secure origin,
// so the microphone works without HTTPS.
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

const PORT = Number(process.env.PORT ?? 3000);
const TYPES = { '.html':'text/html; charset=utf-8', '.json':'application/json', '.css':'text/css', '.js':'text/javascript', '.svg':'image/svg+xml' };

http.createServer((req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  let file = path.join(process.cwd(), url.pathname === '/' ? 'index.html' : url.pathname);
  if (!file.startsWith(process.cwd()) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) {
    file = path.join(process.cwd(), 'index.html');
  }
  res.writeHead(200, { 'Content-Type': TYPES[path.extname(file)] ?? 'application/octet-stream', 'Cache-Control': 'no-store' });
  res.end(fs.readFileSync(file));
}).listen(PORT, '127.0.0.1', () => console.log(`\n  http://localhost:${PORT}\n`));
