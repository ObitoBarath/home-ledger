// Zero-dependency server: stores records in data/db.json and bill images in data/uploads/.
import http from "node:http";
import fs from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import os from "node:os";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const DATA = process.env.DATA_DIR || path.join(here, "data");
const UPLOADS = path.join(DATA, "uploads");
const DB = path.join(DATA, "db.json");
const DIST = path.join(here, "..", "dist");
const PORT = Number(process.env.PORT) || 3001;

await fs.mkdir(UPLOADS, { recursive: true });

// ---- JSON "database" ----
let db = { records: {} };
try { db = JSON.parse(await fs.readFile(DB, "utf8")); } catch { /* first run */ }
if (!db.records) db.records = {};

let queue = Promise.resolve();
const writeDb = async () => {
  const tmp = DB + ".tmp";
  await fs.writeFile(tmp, JSON.stringify(db, null, 2));
  await fs.rename(tmp, DB); // atomic replace, so a crash never leaves a half-written file
};
const persist = () => (queue = queue.catch(() => {}).then(writeDb));

// ---- bill images ----
const EXT = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" };
async function storeBill(id, dataUrl) {
  const m = /^data:(image\/(?:jpeg|png|webp));base64,(.+)$/.exec(dataUrl);
  if (!m) return null;
  const name = `${id}-${Date.now().toString(36)}.${EXT[m[1]]}`;
  await fs.writeFile(path.join(UPLOADS, name), Buffer.from(m[2], "base64"));
  return "/uploads/" + name;
}
const dropFile = url =>
  url && url.startsWith("/uploads/")
    ? fs.unlink(path.join(UPLOADS, path.basename(url))).catch(() => {})
    : null;

// ---- http helpers ----
const MIME = { ".html": "text/html; charset=utf-8", ".js": "text/javascript", ".css": "text/css", ".svg": "image/svg+xml", ".png": "image/png", ".jpg": "image/jpeg", ".webp": "image/webp", ".json": "application/json", ".ico": "image/x-icon", ".woff2": "font/woff2" };
const send = (res, code, body, type = "application/json", cache = "no-store") => {
  res.writeHead(code, { "Content-Type": type, "Cache-Control": cache });
  res.end(typeof body === "string" || Buffer.isBuffer(body) ? body : JSON.stringify(body));
};
const readJson = req => new Promise((ok, fail) => {
  const chunks = []; let size = 0;
  req.on("data", c => { size += c.length; if (size > 10e6) { fail(new Error("Body too large")); req.destroy(); } else chunks.push(c); });
  req.on("end", () => { try { ok(JSON.parse(Buffer.concat(chunks).toString() || "null")); } catch (e) { fail(e); } });
  req.on("error", fail);
});
async function serveFile(res, dir, rel, cache) {
  const file = path.normalize(path.join(dir, rel));
  if (!file.startsWith(dir + path.sep)) return false;
  try {
    if (!(await fs.stat(file)).isFile()) return false;
    send(res, 200, await fs.readFile(file), MIME[path.extname(file)] || "application/octet-stream", cache);
    return true;
  } catch { return false; }
}

const server = http.createServer(async (req, res) => {
  try {
    const p = decodeURIComponent(new URL(req.url, "http://x").pathname);

    if (p === "/api/records" && req.method === "GET") return send(res, 200, Object.values(db.records));

    const m = /^\/api\/records\/([\w-]{1,64})$/.exec(p);
    if (m && req.method === "PUT") {
      const id = m[1];
      const body = await readJson(req);
      if (!body || typeof body !== "object" || Array.isArray(body)) return send(res, 400, { error: "Invalid record" });
      const rec = { ...body, id };
      if (typeof rec.bill === "string" && rec.bill.startsWith("data:")) {
        const url = await storeBill(id, rec.bill);
        if (!url) return send(res, 400, { error: "Unsupported image type" });
        rec.bill = url;
      } else if (typeof rec.bill !== "string" || !rec.bill.startsWith("/uploads/")) {
        rec.bill = "";
      }
      const old = db.records[id];
      if (old && old.bill && old.bill !== rec.bill) await dropFile(old.bill);
      db.records[id] = rec;
      await persist();
      return send(res, 200, rec);
    }
    if (m && req.method === "DELETE") {
      const old = db.records[m[1]];
      if (old) { await dropFile(old.bill); delete db.records[m[1]]; await persist(); }
      return send(res, 200, { ok: true });
    }
    if (p.startsWith("/api/")) return send(res, 404, { error: "Not found" });

    if (p.startsWith("/uploads/")) {
      if (await serveFile(res, UPLOADS, p.slice(9), "public, max-age=31536000, immutable")) return;
      return send(res, 404, { error: "Not found" });
    }
    if (existsSync(DIST)) { // production: serve the built app from the same port
      if (await serveFile(res, DIST, p === "/" ? "index.html" : p.slice(1), "no-cache")) return;
      if (await serveFile(res, DIST, "index.html", "no-cache")) return;
    }
    send(res, 404, "Not found. Run `npm run build` first, or use `npm run dev`.", "text/plain");
  } catch (e) {
    console.error(e);
    send(res, 500, { error: "Server error" });
  }
});

server.listen(PORT, "0.0.0.0", () => {
  console.log(`\nAPI + files on port ${PORT}  (data: ${DATA})`);
  for (const list of Object.values(os.networkInterfaces()))
    for (const i of list || []) if (i.family === "IPv4" && !i.internal) console.log(`  Wi-Fi: http://${i.address}:${PORT}`);
});
