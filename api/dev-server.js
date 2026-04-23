import { createServer } from 'node:http';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const env = Object.fromEntries(
  readFileSync(join(__dirname, '../.env.local'), 'utf8')
    .split('\n')
    .filter(l => l.includes('='))
  .map(l => { const [k,...v] = l.split('='); return [k.trim(), v.join('=').trim()]; })
);

const handlers = {
  courses: (await import('./courses.js')).default,
  rmp: (await import('./rmp.js')).default,
  reddit: (await import('./reddit.js')).default,
  scheduler: (await import('./scheduler.js')).default,
  requirements: (await import('./requirements.js')).default,
  'parse-pdf': (await import('./parse-pdf.js')).default,
  berkeleytime: (await import('./berkeleytime.js')).default,
};

async function handler(req, res) {
  const url = new URL(req.url, 'http://localhost');
  const path = url.pathname.replace(/^\/api\//, '');
  const fn = handlers[path] ?? ((req, res) => res.writeHead(404).end('Not found'));

  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  const body = JSON.parse(Buffer.concat(chunks).toString() || '{}');

  const mockReq = { method: req.method, body, query: Object.fromEntries(url.searchParams) };
  const chunks2 = [];
  const mockRes = {
    status: 200,
    writeHead: (s) => { mockRes.status = s; return mockRes; },
    write: (d) => chunks2.push(d),
    end: (d) => { if (d) chunks2.push(d); },
    json: (d) => { chunks2.push(JSON.stringify(d)); },
    statusCode: () => mockRes.status,
    get headers() { return Object.fromEntries(mockRes._headers ?? []); },
    setHeader: (k, v) => ((mockRes._headers ??= [])[mockRes._headers.length] = [k, v]),
    getHeader: (k) => mockRes._headers?.find(([x]) => x === k)?.[1],
  };

  try {
    await fn(mockReq, mockRes);
    const data = Buffer.concat(chunks2).toString();
    res.writeHead(mockRes.statusCode(), { 'Content-Type': 'application/json' });
    res.end(data);
  } catch (err) {
    console.error(err);
    res.writeHead(500).end(JSON.stringify({ error: err.message }));
  }
}

createServer(async (req, res) => {
  if (req.url.startsWith('/api/')) {
    handler(req, res);
  } else {
    res.writeHead(404).end();
  }
}).listen(3001, () => console.log('API server running on http://localhost:3001'));