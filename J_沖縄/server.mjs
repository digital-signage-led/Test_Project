#!/usr/bin/env node
/** 久米島 警報情報（本番）ローカルサーバー */
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = __dirname;
const HOST = "127.0.0.1";
const PORT = 8080;
const UA = "OkinawaVendingWarningDisplay/1.0";

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".ico": "image/x-icon",
};

async function proxyJson(url) {
  const res = await fetch(url, { headers: { "User-Agent": UA } });
  const text = await res.text();
  return { status: res.status, body: text };
}

function send(res, status, body, type = "text/plain; charset=utf-8") {
  res.writeHead(status, {
    "Content-Type": type,
    "Cache-Control": "no-store",
    "Access-Control-Allow-Origin": "*",
  });
  res.end(body);
}

function serveStatic(reqPath, res) {
  let rel = decodeURIComponent(reqPath.split("?")[0]);
  if (rel === "/") rel = "/index.html";
  const filePath = path.normalize(path.join(ROOT, rel));
  if (!filePath.startsWith(ROOT)) {
    send(res, 403, "Forbidden");
    return;
  }
  fs.readFile(filePath, (err, data) => {
    if (err) {
      send(res, 404, "Not Found");
      return;
    }
    const ext = path.extname(filePath).toLowerCase();
    send(res, 200, data, MIME[ext] || "application/octet-stream");
  });
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url || "/", `http://${HOST}:${PORT}`);

  try {
    if (url.pathname === "/api/warning") {
      const code = url.searchParams.get("code") || "471000";
      const target = `https://www.jma.go.jp/bosai/warning/data/r8/${code}.json`;
      const result = await proxyJson(target);
      send(res, result.status, result.body, "application/json; charset=utf-8");
      return;
    }
    if (url.pathname === "/api/area") {
      const target = "https://www.jma.go.jp/bosai/common/const/area.json";
      const result = await proxyJson(target);
      send(res, result.status, result.body, "application/json; charset=utf-8");
      return;
    }
    serveStatic(url.pathname, res);
  } catch (err) {
    send(
      res,
      502,
      JSON.stringify({ error: String(err?.message || err) }),
      "application/json; charset=utf-8",
    );
  }
});

server.listen(PORT, HOST, () => {
  console.log(`久米島 警報情報（本番）: http://${HOST}:${PORT}/`);
  console.log(`デモ確認:              http://${HOST}:${PORT}/?demo=1`);
});
