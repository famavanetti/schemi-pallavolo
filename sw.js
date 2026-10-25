/* Service worker: l'app funziona anche senza rete.
   I file del sito si scaricano SEMPRE dalla rete (versione aggiornata) e la copia salvata
   si usa solo se sei offline. Cambia VERSIONE quando vuoi svuotare la cache di tutti. */
const VERSIONE = "schemi-v9";
const FILE = ["./", "index.html", "lavagna.js", "pwa.js", "access.js", "manifest.webmanifest",
  "icon-180.png", "icon-192.png", "icon-512.png", "icon-maskable-512.png"];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(VERSIONE).then(c => Promise.all(FILE.map(f => c.add(new Request(f, { cache: "reload" })).catch(() => {})))).then(() => self.skipWaiting()));
});

self.addEventListener("activate", e => {
  e.waitUntil(caches.keys().then(k => Promise.all(k.filter(n => n !== VERSIONE).map(n => caches.delete(n)))).then(() => self.clients.claim()));
});

self.addEventListener("fetch", e => {
  const r = e.request, u = new URL(r.url);
  if (r.method !== "GET") return;
  if (u.hostname === "api.github.com") return; // la sincronizzazione usa sempre la rete
  const font = u.hostname === "fonts.googleapis.com" || u.hostname === "fonts.gstatic.com";
  if (u.origin !== location.origin && !font) return;

  if (font) { // font: copia salvata subito, aggiornata in sottofondo
    e.respondWith(caches.open(VERSIONE).then(async c => {
      const salvata = await c.match(r);
      const rete = fetch(r).then(x => { if (x && (x.ok || x.type === "opaque")) c.put(r, x.clone()); return x; }).catch(() => null);
      return salvata || (await rete) || Response.error();
    }));
    return;
  }

  // file del sito: prima la rete (ignora la cache HTTP di GitHub Pages), poi la copia salvata
  e.respondWith(caches.open(VERSIONE).then(async c => {
    try {
      const x = await fetch(r, { cache: "no-cache" });
      if (x && x.ok) c.put(r, x.clone());
      return x;
    } catch (err) {
      const salvata = await c.match(r, { ignoreSearch: true });
      return salvata || (r.mode === "navigate" ? c.match("index.html") : Response.error());
    }
  }));
});
