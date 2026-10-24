/* Controllo accessi: legge access.json (gestito da admin.html) e blocca chi è disattivato.
   Chi ha il token salvato (l'amministratore sul PC) non viene mai bloccato. */
(function () {
  var m = location.hostname.match(/^([^.]+)\.github\.io$/), repo = location.pathname.split("/")[1];
  window.volleyRole = "admin";
  if (!m || !repo) return;
  var ls = function (k, v) {
    try { if (v === undefined) return localStorage.getItem(k); if (v === null) localStorage.removeItem(k); else localStorage.setItem(k, v); } catch (e) {}
    return null;
  };
  if (ls("volley-token")) return;
  window.volleyRole = "viewer";

  var q = new URLSearchParams(location.search).get("u");
  if (q) ls("volley-u", q);
  var code = ls("volley-u"), root = document.documentElement, done = false;
  root.style.visibility = "hidden";

  function today() {
    var d = new Date();
    return d.getFullYear() + "-" + ("0" + (d.getMonth() + 1)).slice(-2) + "-" + ("0" + d.getDate()).slice(-2);
  }
  function decide(c) {
    if (!c) return "";
    var msg = c.message || "Accesso non attivo. Contatta l’amministratore.";
    if (c.siteActive === false) return msg;
    if (code) {
      var u = (c.users || []).filter(function (x) { return x.id === code; })[0];
      if (!u || u.active === false) return msg;
      return u.exp && today() > u.exp ? "Accesso scaduto. Contatta l’amministratore." : "";
    }
    return c.guestActive === false ? "Serve il link personale che ti ha inviato l’amministratore." : "";
  }
  function block(t) {
    var go = function () {
      var dk = matchMedia("(prefers-color-scheme:dark)").matches, d = document.createElement("div");
      d.style.cssText = "position:fixed;inset:0;z-index:99999;display:flex;align-items:center;justify-content:center;padding:24px;text-align:center;font:600 18px/1.4 system-ui,sans-serif;background:" + (dk ? "#10151b;color:#e8edf2" : "#eef1f4;color:#15202b");
      d.textContent = t;
      document.body.appendChild(d);
      document.body.style.overflow = "hidden";
      root.style.visibility = "visible";
    };
    document.body ? go() : document.addEventListener("DOMContentLoaded", go);
  }
  function roleOf(c) {
    if (!c) return "editor"; // nessuna configurazione: comportamento di prima
    if (!code) return "viewer";
    var u = (c.users || []).filter(function (x) { return x.id === code; })[0];
    return u && u.role === "editor" ? "editor" : "viewer";
  }
  function finish(cfg, fresh) {
    if (done) return;
    done = true;
    if (fresh) ls("volley-acc", cfg ? JSON.stringify(cfg) : null);
    var uu = cfg && code ? (cfg.users || []).filter(function (x) { return x.id === code; })[0] : null;
    window.volleyRole = roleOf(cfg);
    window.volleyAllowed = uu && Array.isArray(uu.schemes) && window.volleyRole === "viewer" ? uu.schemes : null;
    try { document.dispatchEvent(new Event("volleyrole")); } catch (e) {}
    var t = decide(cfg);
    t ? block(t) : (root.style.visibility = "visible");
  }
  var cached = null;
  try { cached = JSON.parse(ls("volley-acc") || "null"); } catch (e) {}
  setTimeout(function () { finish(cached, false); }, 4000);

  fetch("https://api.github.com/repos/" + m[1] + "/" + repo + "/contents/access.json?t=" + Date.now(), {
    cache: "no-store", headers: { Accept: "application/vnd.github.raw+json" }
  }).then(function (r) {
    if (r.status === 404) return null;
    if (!r.ok) throw 0;
    return r.json();
  }).then(function (c) { finish(c, true); }, function () { finish(cached, false); });
})();
