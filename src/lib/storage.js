// Data layer: records live in the server's db.json (see /server), so every device sees the same data.
export const backend = { mode: "loading" };
const POLL_MS = 5000;

async function call(path, options) {
  const res = await fetch(path, options);
  if (!res.ok) throw new Error("Request failed: " + res.status);
  return res;
}

export async function connect(onData) {
  let last = null;
  const pull = async () => {
    try {
      const text = await (await call("/api/records")).text();
      backend.mode = "server";
      if (text !== last) { last = text; onData(JSON.parse(text)); }
    } catch {
      if (backend.mode !== "offline") {
        backend.mode = "offline";
        if (last === null) { last = "[]"; onData([]); }
      }
    }
  };
  Object.assign(backend, {
    save: async rec => {
      await call("/api/records/" + encodeURIComponent(rec.id), {
        method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(rec),
      });
      await pull();
    },
    remove: async id => {
      await call("/api/records/" + encodeURIComponent(id), { method: "DELETE" });
      await pull();
    },
  });
  await pull();
  setInterval(pull, POLL_MS);                       // pick up changes made on other devices
  document.addEventListener("visibilitychange", () => { if (!document.hidden) pull(); });
}
