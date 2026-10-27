/* Controllo accessi: legge access.json (gestito da admin.html) e blocca chi è disattivato.
   Chi ha il token salvato (l'amministratore sul PC) non viene mai bloccato.

   Livelli: admin (token) > subadmin > editor (Gestore) > viewer (Solo vista)

   Variabili esposte al resto del sito:
   - volleyLevel         "admin" | "subadmin" | "editor" | "viewer"
   - volleyRole          "admin" | "editor" | "viewer"  (il Sotto-admin conta come "editor",
                         così il codice esistente continua a funzionare)
   - volleyIsSub         true se è un Sotto-admin
   - volleyCanSeeDrafts  può vedere gli schemi con status "draft" (bozze)
   - volleyCanPublish    può trasformare una bozza in "published"
   - volleyCanEditSchemi  false = il Gestore vede gli schemi ma non li modifica
   - volleyCanClassifica  false = il Gestore non vede la Classifica (da controllare anche in classifica.html)
   - volleyPlayers        "edit" | "conv" (solo convocati) | "view" (solo vista)
   - volleyBoard          può usare la lavagna (lavagna.js)
   - volleyFeatures      oggetto "features" di access.json
*/
(function () {
  var m = location.hostname.match(/^([^.]+)\.github\.io$/), repo = location.pathname.split("/")[1];
  window.volleyRole = "admin";
  window.volleyLevel = "admin";
  window.volleyIsSub = false;
  window.volleyCanSeeDrafts = true;
  window.volleyCanPublish = true;
  window.volleyCanEditSchemi = true;
  window.volleyCanClassifica = true;
  window.volleyPlayers = "edit";
  window.volleyFeatures = {};
  if (!m || !repo) return;
  var ls = function (k, v) {
    try { if (v === undefined) return localStorage.getItem(k); if (v === null) localStorage.removeItem(k); else localStorage.setItem(k, v); } catch (e) {}
    return null;
  };
  if (ls("volley-token")) return;
  window.volleyRole = "viewer";
  window.volleyLevel = "viewer";
  window.volleyCanSeeDrafts = false;
  window.volleyCanPublish = false;

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
  function levelOf(c) {
    if (!c) return "editor"; // nessuna configurazione: comportamento di prima
    if (!code) return "viewer";
    var u = (c.users || []).filter(function (x) { return x.id === code; })[0];
    if (!u) return "viewer";
    if (u.role === "subadmin") return "subadmin";
    return u.role === "editor" ? "editor" : "viewer";
  }
  function finish(cfg, fresh) {
    if (done) return;
    done = true;
    if (fresh) ls("volley-acc", cfg ? JSON.stringify(cfg) : null);
    var uu = cfg && code ? (cfg.users || []).filter(function (x) { return x.id === code; })[0] : null;

    var lvl = levelOf(cfg), f = (cfg && cfg.features) || {};
    window.volleyLevel = lvl;
    window.volleyIsSub = lvl === "subadmin";
    window.volleyRole = lvl === "viewer" ? "viewer" : "editor";
    window.volleyFeatures = f;
    // Bozze e pubblicazione: sempre al Sotto-admin; al Gestore solo se attivato dall'admin
    window.volleyCanSeeDrafts = lvl === "subadmin" || (lvl === "editor" && f.gestoreDrafts === true);
    window.volleyCanPublish = lvl === "subadmin" || (lvl === "editor" && f.gestorePublish === true);

    // Permessi del Gestore (admin e Sotto-admin hanno sempre tutto; i default sono permissivi)
    var isEd = lvl === "editor";
    window.volleyCanEditSchemi = isEd ? f.gestoreSchemi !== false : true;
    window.volleyCanClassifica = isEd ? f.gestoreClassifica !== false : true;
    // Giocatori: "edit" (modifica e aggiunge) | "conv" (solo convocati) | "view" (solo vista)
    window.volleyPlayers = isEd && (f.gestorePlayers === "view" || f.gestorePlayers === "conv") ? f.gestorePlayers : "edit";
    window.volleyBoard = isEd ? f.gestoreBoard !== false : (window.volleyRole !== "viewer" || !!(uu && uu.board === true));
    window.volleyConv = !!(uu && uu.conv === true);
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
