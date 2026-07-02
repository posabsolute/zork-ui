// Minimal zero-dependency static file server for the built Vite app (dist/).
// Used as the Railway start command: serves dist/ on $PORT, with an SPA-style
// fallback to index.html for unknown paths.
import http from "node:http";
import { readFile } from "node:fs/promises";
import { join, extname, normalize, sep } from "node:path";

const DIST = join(process.cwd(), "dist");
const PORT = process.env.PORT || 8080;
const TYPES = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".z3": "application/octet-stream",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".ttf": "font/ttf",
  ".map": "application/json; charset=utf-8",
  ".wasm": "application/wasm",
};

const server = http.createServer(async (req, res) => {
  try {
    let pathname = decodeURIComponent(new URL(req.url, "http://localhost").pathname);
    if (pathname.endsWith("/")) pathname += "index.html";
    let file = normalize(join(DIST, pathname));
    // prevent path traversal outside dist/
    if (file !== DIST && !file.startsWith(DIST + sep)) {
      res.writeHead(403);
      return res.end("Forbidden");
    }
    let body;
    try {
      body = await readFile(file);
    } catch {
      file = join(DIST, "index.html"); // SPA fallback
      body = await readFile(file);
    }
    res.writeHead(200, {
      "content-type": TYPES[extname(file)] || "application/octet-stream",
      "cache-control": file.endsWith("index.html") ? "no-cache" : "public, max-age=3600",
    });
    res.end(body);
  } catch (err) {
    res.writeHead(500);
    res.end("Internal Server Error");
    console.error(err);
  }
});

// "::" binds dual-stack (IPv6 + IPv4) — Railway's proxy fabric reaches the
// container over IPv6, so an IPv4-only bind can 502 at the edge.
server.listen(PORT, "::", () => console.log(`zork-ui serving dist/ on :${PORT}`));
