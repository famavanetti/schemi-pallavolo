/* Service worker: l'app funziona anche senza rete.
   Cambia VERSIONE quando vuoi forzare l'aggiornamento di tutti i file in cache. */
const VERSIONE = "schemi-v8";
const FILE = ["./", "index.html", "lavagna.js", "pwa.js", "access.js", "manifest.webmanifest",
  "icon-180.png", "icon-192.png", "icon-512.png", "icon-maskable-512.png"];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(VERSIONE).then(c => Promise.all(FILE.map(f => c.add(f).catch(() => {})))).then(() => self.skipWaiting()));
});

self.addEventListener("activate", e => {
  e.waitUntil(caches.keys().then(k => Promise.all(k.filter(n => n !== VERSIONE).map(n => caches.delete(n)))).then(() => self.clients.claim()));
});

self.addEventListener("fetch", e => {
  const r = e.request, u = new URL(r.url);
  if (r.method !== "GET") return;
  if (u.hostname === "api.github.com") return; // la sincronizzazione usa sempre la rete
  const ok = u.origin === location.origin || u.hostname === "fonts.googleapis.com" || u.hostname === "fonts.gstatic.com";
  if (!ok) return;
  // risponde subito dalla copia salvata e intanto la aggiorna per la volta dopo
  e.respondWith(caches.open(VERSIONE).then(async c => {
    const salvata = await c.match(r, { ignoreSearch: true });
    const rete = fetch(r).then(x => { if (x && (x.ok || x.type === "opaque")) c.put(r, x.clone()); return x; }).catch(() => null);
    return salvata || (await rete) || (r.mode === "navigate" ? c.match("index.html") : Response.error());
  }));
});
