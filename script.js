/* =====================================================================
   Cours IA & OpenCode — logique de l'application
   - accueil : grille de tuiles (une tuile = une thématique)
   - sommaire latéral groupé par module
   - navigation entre les chapitres + pager
   - boutons "copier" sur chaque bloc de code
   - thème clair / sombre, progression sauvegardée
   ===================================================================== */
(function () {
  "use strict";

  var STORE_THEME = "ia-opencode-theme";
  var STORE_SEEN = "ia-opencode-seen";

  var sections = Array.prototype.slice.call(document.querySelectorAll(".page"));
  var navEl = document.getElementById("nav");
  var navSearch = document.getElementById("navSearch");
  var crumb = document.getElementById("crumb");
  var pager = document.getElementById("pager");
  var progressFill = document.getElementById("progressFill");
  var progressText = document.getElementById("progressText");
  var sidebar = document.getElementById("sidebar");
  var overlay = document.getElementById("overlay");
  var toTop = document.getElementById("toTop");
  var homeView = document.getElementById("accueil");
  var reader = document.getElementById("pages");
  var tilesEl = document.getElementById("tiles");
  var filtersEl = document.getElementById("filters");

  var seen = loadSeen();
  var currentIndex = 0;
  var active = "all";

  /* Icônes (SVG inline, tracé) — une par thématique */
  var ICONS = {
    "decouvrir-ia": '<path d="M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9z"/><path d="M19 15l.7 1.8 1.8.7-1.8.7L19 20l-.7-1.8-1.8-.7 1.8-.7z"/><path d="M5.5 2.5l.6 1.5 1.5.6-1.5.6-.6 1.5-.6-1.5L3.4 4.6l1.5-.6z"/>',
    "vocabulaire": '<path d="M4 5a2 2 0 0 1 2-2h13v18H6a2 2 0 0 1-2-2z"/><path d="M8 7h8M8 11h8M8 15h5"/>',
    "installer": '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="M7 10l5 5 5-5"/><path d="M12 15V3"/>',
    "premier-lancement": '<circle cx="12" cy="12" r="9"/><path d="M10 8.5l6 3.5-6 3.5z"/>',
    "provider": '<rect x="3" y="4" width="18" height="7" rx="2"/><rect x="3" y="13" width="18" height="7" rx="2"/><path d="M7 7.5h.01M7 16.5h.01"/>',
    "modeles-gratuits": '<rect x="3" y="8" width="18" height="4" rx="1"/><path d="M12 8v13"/><path d="M19 12v7a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-7"/><path d="M7.5 8a2.5 2.5 0 0 1 0-5A5 5 0 0 1 12 8a5 5 0 0 1 4.5-5 2.5 2.5 0 0 1 0 5"/>',
    "choisir-modele": '<path d="M4 6h16M4 12h16M4 18h16"/><circle cx="9" cy="6" r="2"/><circle cx="15" cy="12" r="2"/><circle cx="7" cy="18" r="2"/>',
    "config-providers": '<path d="M12 3l8 4v6c0 4.5-3.4 7.5-8 8-4.6-.5-8-3.5-8-8V7z"/><path d="M9.5 12l2 2 3.5-4"/>',
    "modeles-locaux": '<rect x="6" y="6" width="12" height="12" rx="2"/><rect x="10" y="10" width="4" height="4"/><path d="M9 2v3M15 2v3M9 19v3M15 19v3M2 9h3M2 15h3M19 9h3M19 15h3"/>',
    "reduire-couts": '<path d="M3 7l6 6 4-4 7 7"/><path d="M21 10v6h-6"/>',
    "agent": '<rect x="4" y="8" width="16" height="11" rx="2"/><path d="M12 8V4M9 3h6"/><circle cx="9" cy="13" r="1.2"/><circle cx="15" cy="13" r="1.2"/>',
    "creer-agent": '<circle cx="12" cy="12" r="9"/><path d="M12 8v8M8 12h8"/>',
    "trouver-agents": '<circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/>',
    "skills": '<path d="M12 2l2.6 5.6L20.5 9l-4 4.3.8 6-5.3-2.8L6.7 19l.8-6-4-4.3 5.9-1.4z"/>',
    "plugins": '<path d="M12 3v6"/><path d="M8 9h8v4a4 4 0 0 1-8 0z"/><path d="M12 17v4"/><path d="M5 21h14"/>',
    "commandes": '<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M7 9l3 3-3 3"/><path d="M13 15h4"/>',
    "mcp": '<circle cx="12" cy="5" r="2.5"/><circle cx="5" cy="19" r="2.5"/><circle cx="19" cy="19" r="2.5"/><path d="M10.7 7.1L6.3 16.6M13.3 7.1l4.4 9.5M7.5 19h9"/>',
    "prompter": '<path d="M20 15a2 2 0 0 1-2 2H8l-4 4V5a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2z"/><path d="M8 8h8M8 11h5"/>',
    "mini-projet": '<path d="M5 16c-1.4 1.2-1.8 4.6-1.8 4.6s3.4-.4 4.6-1.8a2.2 2.2 0 0 0-2.8-2.8z"/><path d="M11 15l-2.5-2.5a18 18 0 0 1 2-3.6A10 10 0 0 1 20 3c0 2.4-.6 6.6-4.9 9.5A18 18 0 0 1 11 15z"/><path d="M8.5 12.5H5s.4-2.5 1.5-3.4c1.3-.9 4 0 4 0M11.5 15.5V19s2.5-.4 3.4-1.5c.9-1.3 0-4 0-4"/>',
    "synthese": '<path d="M8 21h8M12 17v4"/><path d="M6 4h12v5a6 6 0 0 1-12 0z"/><path d="M6 5H4a2 2 0 0 0 0 4h2M18 5h2a2 2 0 0 1 0 4h-2"/>'
  };

  var HUES = [168, 206, 262, 322, 42, 140];

  /* Étiquettes courtes de module (tuiles & filtres) */
  var TAGS = ["D\u00E9couvrir", "Installer", "Providers", "Agents", "\u00C9tendre", "M\u00E9thode"];

  /* Épigraphes « surréalistes » — pures touches décoratives, une par thématique */
  var EPIGRAPHS = {
    "decouvrir-ia": "Les premi\u00E8res pendules molles caress\u00E9es par l'aube.",
    "vocabulaire": "Un alphabet dor\u00E9 qui apprend \u00E0 respirer.",
    "installer": "Poser la premi\u00E8re pierre d'une cit\u00E9 de lumi\u00E8re.",
    "premier-lancement": "Le premier souffle \u00E9veille la machine endormie.",
    "provider": "Choisir la source d'o\u00F9 jaillit l'\u00E9tincelle.",
    "modeles-gratuits": "Les coffres ouverts du soleil, sans p\u00E9age.",
    "choisir-modele": "Trier les \u00E9toiles selon leur juste \u00E9clat.",
    "config-providers": "Accorder l'instrument avant le concert.",
    "modeles-locaux": "Une flamme qui br\u00FBle sur ta propre table.",
    "reduire-couts": "Dompter la rivi\u00E8re d'or qui fuit entre les doigts.",
    "agent": "Un automate dor\u00E9 qui r\u00EAve d'agir.",
    "creer-agent": "Fa\u00E7onner une silhouette de lumi\u00E8re sur mesure.",
    "trouver-agents": "Fouiller le grand march\u00E9 des ombres utiles.",
    "skills": "Offrir \u00E0 la machine de nouveaux gestes appris.",
    "plugins": "Brancher des membres suppl\u00E9mentaires au colosse.",
    "commandes": "Murmurer des ordres brefs \u00E0 l'oreille du sphinx.",
    "mcp": "Tisser des ponts entre les \u00EEles de donn\u00E9es.",
    "prompter": "L'incantation qui ordonne le chaos en dialogue.",
    "mini-projet": "\u00C9lever, pierre \u00E0 pierre, ta propre cath\u00E9drale de code.",
    "synthese": "Le miroir universel interroge le soleil levant."
  };

  /* ------------------------------ Aide ----------------------------- */
  function esc(s) {
    return String(s).replace(/[&<>"]/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c];
    });
  }
  function decode(s) {
    var ta = document.createElement("textarea");
    ta.innerHTML = String(s == null ? "" : s);
    return ta.value;
  }
  function icon(id) {
    return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" ' +
      'stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
      (ICONS[id] || ICONS["decouvrir-ia"]) + "</svg>";
  }
  function moduleOf(sec) { return decode(sec.dataset.module || "Cours"); }
  function shortModule(mod) { return mod.replace(/^Module\s*\d+\s*[·•]\s*/, "").trim(); }
  function hueOf(mod) {
    var m = mod.match(/Module\s*(\d)/);
    return HUES[(m ? parseInt(m[1], 10) : 1) - 1] || HUES[0];
  }
  function moduleNum(mod) {
    var m = mod.match(/Module\s*(\d)/);
    return m ? parseInt(m[1], 10) : 1;
  }
  function tagOf(mod) { return TAGS[moduleNum(mod) - 1] || shortModule(mod); }
  function readingTime(sec) {
    var words = (sec.textContent || "").replace(/\s+/g, " ").trim().split(" ").length;
    return Math.max(2, Math.round(words / 220));
  }

  /* ----------------------- Progression (localStorage) -------------- */
  function loadSeen() {
    try { return JSON.parse(localStorage.getItem(STORE_SEEN)) || {}; }
    catch (e) { return {}; }
  }
  function saveSeen() {
    try { localStorage.setItem(STORE_SEEN, JSON.stringify(seen)); } catch (e) {}
  }

  /* ----------------------------- Sommaire -------------------------- */
  function buildNav() {
    var groups = [];
    var byName = {};
    sections.forEach(function (sec) {
      var mod = moduleOf(sec);
      if (!byName[mod]) { byName[mod] = { name: mod, pages: [] }; groups.push(byName[mod]); }
      byName[mod].pages.push(sec);
    });

    groups.forEach(function (group) {
      var wrap = document.createElement("div");
      wrap.className = "nav-group";

      var title = document.createElement("div");
      title.className = "nav-group-title";
      title.style.setProperty("--h", hueOf(group.name));
      title.textContent = group.name;
      wrap.appendChild(title);

      group.pages.forEach(function (sec) {
        var link = document.createElement("a");
        link.className = "nav-link";
        link.href = "#" + sec.id;
        link.dataset.target = sec.id;
        link.dataset.search = (sec.dataset.title + " " + sec.dataset.num).toLowerCase();

        var num = document.createElement("span");
        num.className = "nav-num";
        num.textContent = sec.dataset.num;

        var label = document.createElement("span");
        label.className = "nav-label";
        label.textContent = sec.dataset.title;

        var check = document.createElement("span");
        check.className = "nav-check";
        check.textContent = "\u2713";

        link.appendChild(num);
        link.appendChild(label);
        link.appendChild(check);

        link.addEventListener("click", function (e) {
          e.preventDefault();
          go(sec.id);
          closeDrawer();
        });
        wrap.appendChild(link);
      });
      navEl.appendChild(wrap);
    });
  }

  /* ------------------------ Tuiles (accueil) ----------------------- */
  function leadOf(sec) {
    var p = sec.querySelector(".lead");
    var txt = p ? p.textContent : "";
    txt = txt.replace(/\s+/g, " ").trim();
    if (txt.length > 148) txt = txt.slice(0, 146).replace(/\s+\S*$/, "") + "…";
    return txt;
  }

  function buildTiles() {
    sections.forEach(function (sec, i) {
      var mod = moduleOf(sec);
      var tile = document.createElement("a");
      tile.href = "#" + sec.id;
      tile.className = "tile";
      tile.dataset.target = sec.id;
      tile.dataset.module = mod;
      tile.style.setProperty("--h", hueOf(mod));
      tile.style.setProperty("--i", i);

      /* Ligne haute : icône • THÈME NN • module */
      var top = document.createElement("div");
      top.className = "tile-top";

      var ic = document.createElement("span");
      ic.className = "tile-icon";
      ic.innerHTML = icon(sec.id);

      var num = document.createElement("span");
      num.className = "tile-num";
      num.textContent = "TH\u00C8ME " + sec.dataset.num;

      var tag = document.createElement("span");
      tag.className = "tile-tag";
      tag.textContent = tagOf(mod);

      top.appendChild(ic);
      top.appendChild(num);
      top.appendChild(tag);

      var title = document.createElement("h2");
      title.className = "tile-title";
      title.textContent = sec.dataset.title;

      var epi = document.createElement("p");
      epi.className = "tile-epigraph";
      epi.textContent = "\u201C" + (EPIGRAPHS[sec.id] || "Une th\u00E9matique du parcours.") + "\u201D";

      var desc = document.createElement("p");
      desc.className = "tile-desc";
      desc.textContent = leadOf(sec);

      var foot = document.createElement("div");
      foot.className = "tile-foot";

      var time = document.createElement("span");
      time.className = "tile-time";
      time.textContent = "\u23F1 \u2248 " + readingTime(sec) + " min";

      var go_ = document.createElement("span");
      go_.className = "tile-go";
      go_.textContent = "Explorer";

      foot.appendChild(time);
      foot.appendChild(go_);

      tile.appendChild(top);
      tile.appendChild(title);
      tile.appendChild(epi);
      tile.appendChild(desc);
      tile.appendChild(foot);

      tile.addEventListener("click", function (e) { e.preventDefault(); go(sec.id); });
      tilesEl.appendChild(tile);
    });
  }

  /* Épigraphe de tête, injectée dans chaque chapitre */
  function enhanceEpigraphs() {
    sections.forEach(function (sec) {
      var h1 = sec.querySelector("h1");
      if (!h1 || sec.querySelector(".epigraph")) return;
      var line = EPIGRAPHS[sec.id];
      if (!line) return;
      var p = document.createElement("p");
      p.className = "epigraph";
      p.textContent = line;
      h1.parentNode.insertBefore(p, h1.nextSibling);
    });
  }

  function buildFilters() {
    var mods = [];
    sections.forEach(function (sec) {
      var mod = moduleOf(sec);
      if (mods.indexOf(mod) === -1) mods.push(mod);
    });

    var all = document.createElement("button");
    all.type = "button";
    all.className = "chip on";
    all.dataset.filter = "all";
    all.setAttribute("aria-pressed", "true");
    all.textContent = "Tout (" + sections.length + ")";
    filtersEl.appendChild(all);

    mods.forEach(function (mod) {
      var c = document.createElement("button");
      c.type = "button";
      c.className = "chip";
      c.dataset.filter = mod;
      c.setAttribute("aria-pressed", "false");
      c.textContent = "M" + moduleNum(mod) + " \u00B7 " + tagOf(mod);
      filtersEl.appendChild(c);
    });

    filtersEl.addEventListener("click", function (e) {
      var chip = e.target.closest(".chip");
      if (!chip) return;
      active = chip.dataset.filter;
      Array.prototype.forEach.call(filtersEl.querySelectorAll(".chip"), function (c) {
        c.classList.toggle("on", c === chip);
        c.setAttribute("aria-pressed", c === chip ? "true" : "false");
      });
      applyFilter();
    });
  }

  function applyFilter() {
    var shown = 0;
    Array.prototype.forEach.call(tilesEl.querySelectorAll(".tile"), function (t) {
      var show = active === "all" || t.dataset.module === active;
      t.style.display = show ? "" : "none";
      if (show) shown++;
    });
    var count = document.getElementById("tilesCount");
    if (count) count.textContent = shown + (shown > 1 ? " th\u00E9matiques" : " th\u00E9matique");
    replayTiles();
  }

  function replayTiles() {
    Array.prototype.forEach.call(tilesEl.querySelectorAll(".tile"), function (t) {
      if (t.style.display === "none") return;
      t.style.animation = "none";
      void t.offsetWidth;
      t.style.animation = "";
    });
  }

  /* ----------------------------- Navigation ------------------------ */
  function go(id, skipHash) {
    var idx = sections.findIndex(function (s) { return s.id === id; });
    if (idx === -1) idx = 0;
    currentIndex = idx;

    showReader();

    sections.forEach(function (s, i) { s.classList.toggle("active", i === idx); });

    var sec = sections[idx];
    seen[sec.id] = true;
    saveSeen();

    Array.prototype.forEach.call(navEl.querySelectorAll(".nav-link"), function (l) {
      var on = l.dataset.target === sec.id;
      l.classList.toggle("active", on);
      l.classList.toggle("visited", !!seen[l.dataset.target]);
      if (on) l.scrollIntoView({ block: "nearest" });
    });

    crumb.textContent = moduleOf(sec) + "  \u203A  " + sec.dataset.num + " \u00B7 " + sec.dataset.title;

    buildPager(idx);
    updateProgress();
    document.title = sec.dataset.num + " \u00B7 " + sec.dataset.title + " | Cours IA & OpenCode";

    if (!skipHash) history.replaceState(null, "", "#" + sec.id);
    window.scrollTo({ top: 0, behavior: "auto" });
  }

  function showReader() {
    homeView.classList.add("is-hidden");
    reader.classList.remove("is-hidden");
    pager.classList.remove("is-hidden");
    closeDrawer();
  }

  function home(skipHash) {
    homeView.classList.remove("is-hidden");
    reader.classList.add("is-hidden");
    pager.classList.add("is-hidden");
    Array.prototype.forEach.call(navEl.querySelectorAll(".nav-link"), function (l) {
      l.classList.remove("active");
      l.classList.toggle("visited", !!seen[l.dataset.target]);
    });
    crumb.textContent = "Toutes les th\u00E9matiques";
    document.title = "Cours IA & OpenCode \u2014 de z\u00E9ro \u00E0 ton assistant de code";
    if (!skipHash) history.replaceState(null, "", "#accueil");
    replayTiles();
    window.scrollTo({ top: 0, behavior: "auto" });
  }

  function buildPager(idx) {
    pager.innerHTML = "";
    var prev = sections[idx - 1];
    var next = sections[idx + 1];

    function make(sec, dir, cls) {
      var a = document.createElement("a");
      a.href = "#" + sec.id;
      a.className = cls;
      a.innerHTML = '<span class="dir">' + dir + "</span>" +
                    '<span class="ttl">' + esc(sec.dataset.num) + " \u00B7 " + esc(sec.dataset.title) + "</span>";
      a.addEventListener("click", function (e) { e.preventDefault(); go(sec.id); });
      return a;
    }

    if (prev) pager.appendChild(make(prev, "\u2190 Pr\u00E9c\u00E9dent", "prev"));
    else {
      var back = document.createElement("a");
      back.className = "prev";
      back.href = "#accueil";
      back.innerHTML = '<span class="dir">\u2190 Accueil</span><span class="ttl">Toutes les th\u00E9matiques</span>';
      back.addEventListener("click", function (e) { e.preventDefault(); home(); });
      pager.appendChild(back);
    }

    if (next) pager.appendChild(make(next, "Suivant \u2192", "next"));
    else {
      var el = document.createElement("a");
      el.className = "next";
      el.href = "#accueil";
      el.innerHTML = '<span class="dir">Fin du cours</span><span class="ttl">Bravo ! Revoir les th\u00E9matiques</span>';
      el.addEventListener("click", function (e) { e.preventDefault(); home(); });
      pager.appendChild(el);
    }
  }

  function updateProgress() {
    var total = sections.length;
    var done = sections.filter(function (s) { return seen[s.id]; }).length;
    var pct = total ? Math.round((done / total) * 100) : 0;
    progressFill.style.width = pct + "%";
    progressText.textContent = done + "/" + total;
    progressText.title = pct + "% du parcours vu";
    Array.prototype.forEach.call(tilesEl.querySelectorAll(".tile"), function (t) {
      var isDone = !!seen[t.dataset.target];
      t.classList.toggle("done", isDone);
      var goSpan = t.querySelector(".tile-go");
      if (goSpan) goSpan.textContent = isDone ? "\u2713 Compl\u00E9t\u00E9" : "Explorer";
    });
  }

  /* --------------------------- Copier le code ---------------------- */
  function enhanceCode() {
    Array.prototype.forEach.call(document.querySelectorAll("pre"), function (pre) {
      if (pre.closest(".codeblock")) return;

      var block = document.createElement("div");
      block.className = "codeblock";
      pre.parentNode.insertBefore(block, pre);

      var head = document.createElement("div");
      head.className = "code-head";

      var dots = document.createElement("span");
      dots.className = "code-dots";
      dots.innerHTML = "<i></i><i></i><i></i>";

      var file = document.createElement("span");
      file.className = "code-file";
      file.textContent = pre.dataset.file || pre.dataset.lang || "code";

      var btn = document.createElement("button");
      btn.className = "copy-btn";
      btn.type = "button";
      btn.textContent = "Copier";
      btn.addEventListener("click", function () {
        var text = pre.innerText;
        var done = function () {
          btn.textContent = "Copi\u00E9 \u2713";
          btn.classList.add("done");
          setTimeout(function () { btn.textContent = "Copier"; btn.classList.remove("done"); }, 1600);
        };
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(text).then(done, fallback);
        } else { fallback(); }

        function fallback() {
          var ta = document.createElement("textarea");
          ta.value = text; ta.style.position = "fixed"; ta.style.opacity = "0";
          document.body.appendChild(ta); ta.select();
          try { document.execCommand("copy"); done(); } catch (e) {}
          document.body.removeChild(ta);
        }
      });

      head.appendChild(dots);
      head.appendChild(file);
      head.appendChild(btn);
      block.appendChild(head);
      block.appendChild(pre);
    });
  }

  /* ------------------------------ Thème ---------------------------- */
  var SUN = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M19.1 4.9L17 7M7 17l-2.1 2.1"/></svg>';
  var MOON = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/></svg>';

  function applyTheme(t) {
    document.documentElement.setAttribute("data-theme", t);
    var btn = document.getElementById("themeBtn");
    if (btn) btn.innerHTML = t === "dark" ? SUN : MOON;
  }
  function initTheme() {
    var saved = null;
    try { saved = localStorage.getItem(STORE_THEME); } catch (e) {}
    /* Thème « Académie lumineuse » (clair) par défaut, variante nocturne au choix */
    if (!saved) saved = "light";
    applyTheme(saved);
    var btn = document.getElementById("themeBtn");
    btn.addEventListener("click", function () {
      var now = document.documentElement.getAttribute("data-theme") === "dark" ? "light" : "dark";
      applyTheme(now);
      try { localStorage.setItem(STORE_THEME, now); } catch (e) {}
    });
  }

  /* --------------------------- Tiroir mobile ----------------------- */
  function openDrawer() { sidebar.classList.add("open"); overlay.classList.add("show"); }
  function closeDrawer() { sidebar.classList.remove("open"); overlay.classList.remove("show"); }

  /* ------------------------------ Init ----------------------------- */
  function init() {
    buildNav();
    buildTiles();
    buildFilters();
    enhanceCode();
    enhanceEpigraphs();
    initTheme();
    applyFilter();
    updateProgress();

    var menuBtn = document.getElementById("menuBtn");
    menuBtn.addEventListener("click", openDrawer);
    overlay.addEventListener("click", closeDrawer);

    navSearch.addEventListener("input", function () {
      var q = navSearch.value.trim().toLowerCase();
      Array.prototype.forEach.call(navEl.querySelectorAll(".nav-group"), function (g) {
        var visible = 0;
        Array.prototype.forEach.call(g.querySelectorAll(".nav-link"), function (l) {
          var match = !q || l.dataset.search.indexOf(q) !== -1;
          l.style.display = match ? "" : "none";
          if (match) visible++;
        });
        g.style.display = visible ? "" : "none";
      });
    });

    toTop.addEventListener("click", function () { window.scrollTo({ top: 0, behavior: "smooth" }); });
    window.addEventListener("scroll", function () {
      toTop.classList.toggle("show", window.scrollY > 600);
    });

    var backHome = document.getElementById("backHome");
    if (backHome) backHome.addEventListener("click", function (e) { e.preventDefault(); home(); });

    window.addEventListener("hashchange", function () {
      var id = location.hash.replace("#", "");
      if (id === "accueil") { home(true); return; }
      var idx = sections.findIndex(function (s) { return s.id === id; });
      if (idx !== -1 && idx !== currentIndex) go(id, true);
    });

    document.addEventListener("keydown", function (e) {
      if (e.target.matches("input, textarea")) return;
      if (e.key === "Escape") { closeDrawer(); return; }
      if (reader.classList.contains("is-hidden")) return;
      if (e.key === "[" && currentIndex > 0) go(sections[currentIndex - 1].id);
      if (e.key === "]" && currentIndex < sections.length - 1) go(sections[currentIndex + 1].id);
    });

    var startId = location.hash.replace("#", "");
    if (startId === "accueil") { home(true); return; }
    var idx = sections.findIndex(function (s) { return s.id === startId; });
    if (idx !== -1) go(startId, true);
    else home(true);
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
