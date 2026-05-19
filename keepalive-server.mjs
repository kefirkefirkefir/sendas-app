// Ultra-lightweight static server with self-ping keepalive
// Serves /out folder and keeps itself alive every 3 seconds
import { createServer } from "node:http";
import { execSync } from "node:child_process";
import { existsSync, readFileSync, statSync } from "node:fs";
import { join, extname } from "node:path";

const PORT = 3000;
const OUT_DIR = join(process.cwd(), "out");

const MIME = {
  ".html": "text/html",
  ".js": "application/javascript",
  ".css": "text/css",
  ".json": "application/json",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".txt": "text/plain",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
};

function serveStatic(req, res) {
  let path = req.url.split("?")[0];
  if (path === "/") path = "/index.html";

  const filePath = join(OUT_DIR, path);
  if (!existsSync(filePath) || !statSync(filePath).isFile()) {
    res.writeHead(404, { "Content-Type": "text/html" });
    res.end("<h1>404</h1>");
    return;
  }

  const ext = extname(filePath).toLowerCase();
  const mime = MIME[ext] || "application/octet-stream";
  const data = readFileSync(filePath);
  res.writeHead(200, {
    "Content-Type": mime,
    "Cache-Control": ext === ".html" ? "no-cache" : "public, max-age=31536000",
  });
  res.end(data);
}

const server = createServer(serveStatic);
server.listen(PORT, () => {
  console.log(`[${new Date().toISOString()}] Static server on :${PORT}`);
});

// Self-ping every 3 seconds to prevent container from killing idle process
setInterval(() => {
  try {
    execSync(`curl -sf -o /dev/null http://localhost:${PORT}/`, { timeout: 2000 });
  } catch {
    console.error(`[${new Date().toISOString()}] Self-ping failed`);
  }
}, 3000);
