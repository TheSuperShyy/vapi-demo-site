// Loads .env into process.env for local scripts (no dependency). KEY=value lines, # comments.
// Existing environment wins, so CI/Vercel values are never overridden.
import fs from 'node:fs';
try {
  for (const line of fs.readFileSync(new URL('./.env', import.meta.url), 'utf8').split('\n')) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
  }
} catch {}
