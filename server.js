// server.js
const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 3000;
const ROOT = __dirname;
const DB_FILE = path.join(ROOT, 'homedesk-db.json');

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon'
};

function ensureDbFile() {
  if (!fs.existsSync(DB_FILE)) {
    fs.writeFileSync(DB_FILE, JSON.stringify({ projects: [] }, null, 2), 'utf8');
  }
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';

    req.on('data', chunk => {
      body += chunk.toString();

      if (body.length > 10_000_000) {
        reject(new Error('Request body too large'));
        req.destroy();
      }
    });

    req.on('end', () => resolve(body));
    req.on('error', reject);
  });
}

function sendJson(res, status, data) {
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store'
  });
  res.end(JSON.stringify(data));
}

function serveStatic(req, res) {
  let requestedPath = decodeURIComponent(req.url.split('?')[0]);

  if (requestedPath === '/') {
    requestedPath = '/index.html';
  }

  const safePath = path.normalize(requestedPath).replace(/^(\.\.[/\\])+/, '');
  const filePath = path.join(ROOT, safePath);

  if (!filePath.startsWith(ROOT)) {
    res.writeHead(403);
    res.end('Forbidden');
    return;
  }

  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404);
      res.end('Not found');
      return;
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    res.writeHead(200, {
      'Content-Type': contentType,
      'Cache-Control': ext === '.html' ? 'no-store' : 'no-cache'
    });

    res.end(data);
  });
}

ensureDbFile();

const server = http.createServer(async (req, res) => {
  try {
    const url = req.url.split('?')[0];

    if (url === '/homedesk-db' && req.method === 'GET') {
      ensureDbFile();

      const raw = fs.readFileSync(DB_FILE, 'utf8');
      const data = JSON.parse(raw || '{"projects":[]}');

      sendJson(res, 200, {
        projects: Array.isArray(data.projects) ? data.projects : []
      });

      return;
    }

    if (url === '/homedesk-db' && req.method === 'POST') {
      const body = await readBody(req);
      const parsed = JSON.parse(body || '{}');

      const projects = Array.isArray(parsed.projects) ? parsed.projects : [];

      fs.writeFileSync(
        DB_FILE,
        JSON.stringify({ projects }, null, 2),
        'utf8'
      );

      sendJson(res, 200, {
        ok: true,
        count: projects.length
      });

      return;
    }

    serveStatic(req, res);
  } catch (err) {
    console.error(err);
    sendJson(res, 500, {
      ok: false,
      error: err.message
    });
  }
});

server.listen(PORT, () => {
  console.log(`HomeDesk running at http://127.0.0.1:${PORT}`);
  console.log(`Saving nodes to ${DB_FILE}`);
});