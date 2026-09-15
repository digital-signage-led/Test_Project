/**
 * サイネージ用ローカルサーバー
 * - 静的ファイル配信（index-*.html / assets / data）
 * - 起動時＋定期でホームページからニュース取得 → data/news.json
 * - GET /api/news … 最新 JSON
 * - POST /api/news/refresh … 即時再取得
 *
 * 起動: npm run serve
 * 表示: http://127.0.0.1:3002/index-5face.html
 */
import { createServer } from 'node:http';
import { readFileSync, existsSync, statSync } from 'node:fs';
import { join, dirname, extname, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';
import { fetchHomepageNews } from './fetch-homepage-news.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const CONFIG_PATH = join(ROOT, 'config', 'news.config.json');
const NEWS_PATH = join(ROOT, 'data', 'news.json');

function loadConfig() {
  const raw = JSON.parse(readFileSync(CONFIG_PATH, 'utf8'));
  return {
    homepageUrl: String(raw.homepageUrl || 'https://www.satokogyo.co.jp/news/'),
    refreshMinutes: Math.max(1, Number(raw.refreshMinutes) || 10),
    maxItems: Math.max(1, Number(raw.maxItems) || 8),
    port: Number(raw.port) || 3002,
    host: String(raw.host || '127.0.0.1')
  };
}

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
  '.txt': 'text/plain; charset=utf-8'
};

let refreshing = null;
let lastError = null;

async function refreshNews(reason) {
  if (refreshing) return refreshing;
  refreshing = (async () => {
    try {
      const payload = await fetchHomepageNews();
      lastError = null;
      console.log('[news]', reason || 'refresh', 'ok', payload.items.length, 'items', new Date().toLocaleString('ja-JP'));
      return payload;
    } catch (err) {
      lastError = String(err && err.message ? err.message : err);
      console.error('[news]', reason || 'refresh', 'fail', lastError);
      throw err;
    } finally {
      refreshing = null;
    }
  })();
  return refreshing;
}

function sendJson(res, code, obj) {
  const body = JSON.stringify(obj);
  res.writeHead(code, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
    'Access-Control-Allow-Origin': '*'
  });
  res.end(body);
}

function safePath(urlPath) {
  const decoded = decodeURIComponent((urlPath || '/').split('?')[0]);
  let rel = decoded === '/' ? '/index-5face.html' : decoded;
  if (rel.includes('\0') || rel.includes('..')) return null;
  const full = normalize(join(ROOT, rel.replace(/^\//, '')));
  if (!full.startsWith(normalize(ROOT))) return null;
  return full;
}

function serveFile(res, filePath) {
  if (!existsSync(filePath) || !statSync(filePath).isFile()) {
    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Not Found');
    return;
  }
  const ext = extname(filePath).toLowerCase();
  const type = MIME[ext] || 'application/octet-stream';
  const buf = readFileSync(filePath);
  res.writeHead(200, {
    'Content-Type': type,
    'Cache-Control': ext === '.html' || ext === '.json' ? 'no-store' : 'public, max-age=60'
  });
  res.end(buf);
}

const cfg = loadConfig();

const server = createServer(async (req, res) => {
  const method = req.method || 'GET';
  const url = new URL(req.url || '/', 'http://' + cfg.host + ':' + cfg.port);
  const path = url.pathname;

  if (method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    });
    res.end();
    return;
  }

  if (path === '/api/news' && method === 'GET') {
    /* 古い／無い場合は公式サイトから取り直してから返す */
    let needRefresh = !existsSync(NEWS_PATH);
    if (!needRefresh) {
      try {
        const prev = JSON.parse(readFileSync(NEWS_PATH, 'utf8'));
        const ageMs = Date.now() - Date.parse(prev.fetchedAt || 0);
        const maxAge = cfg.refreshMinutes * 60 * 1000;
        if (!Number.isFinite(ageMs) || ageMs < 0 || ageMs > maxAge) needRefresh = true;
      } catch (_) {
        needRefresh = true;
      }
    }
    if (needRefresh) {
      try { await refreshNews(existsSync(NEWS_PATH) ? 'stale' : 'lazy'); } catch (_) { /* keep going */ }
    }
    if (!existsSync(NEWS_PATH)) {
      sendJson(res, 503, { error: lastError || 'news not ready', items: [] });
      return;
    }
    const data = JSON.parse(readFileSync(NEWS_PATH, 'utf8'));
    sendJson(res, 200, data);
    return;
  }

  if (path === '/api/news/refresh' && method === 'POST') {
    try {
      const data = await refreshNews('manual');
      sendJson(res, 200, data);
    } catch (err) {
      sendJson(res, 502, { error: String(err.message || err), items: [] });
    }
    return;
  }

  if (path === '/api/health') {
    sendJson(res, 200, {
      ok: true,
      newsFile: existsSync(NEWS_PATH),
      lastError,
      homepageUrl: cfg.homepageUrl,
      refreshMinutes: cfg.refreshMinutes
    });
    return;
  }

  if (method !== 'GET' && method !== 'HEAD') {
    res.writeHead(405);
    res.end('Method Not Allowed');
    return;
  }

  const filePath = safePath(path);
  if (!filePath) {
    res.writeHead(400);
    res.end('Bad Request');
    return;
  }
  serveFile(res, filePath);
});

server.listen(cfg.port, cfg.host, async () => {
  console.log('[serve] http://' + cfg.host + ':' + cfg.port + '/index-5face.html');
  console.log('[serve] news source:', cfg.homepageUrl);
  console.log('[serve] refresh every', cfg.refreshMinutes, 'min');
  try {
    await refreshNews('boot');
  } catch (_) { /* offline ok if previous news.json exists */ }
  setInterval(() => {
    refreshNews('timer').catch(() => {});
  }, cfg.refreshMinutes * 60 * 1000);
});
