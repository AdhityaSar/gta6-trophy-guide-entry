(function () {
  "use strict";

  var TROPHIES = window.TROPHIES || [];
  var STORAGE_KEY = "gta6-trophies-earned";
  var SPOILER_KEY = "gta6-spoiler-on";

  var GRADE_ORDER = ["platinum", "gold", "silver", "bronze"];
  var GRADE_LABEL = {
    platinum: "Platinum", gold: "Gold", silver: "Silver", bronze: "Bronze"
  };
  var GRADE_TOTAL = { platinum: 0, gold: 0, silver: 0, bronze: 0 };
  TROPHIES.forEach(function (t) { GRADE_TOTAL[t.grade]++; });

  var STAGES = [
    {
      n: 1,
      title: "Story & early scans",
      hours: "60–80 h",
      note: "Finish the campaign and enjoy it. The one permanently missable trophy — the Chapter 1 balcony meditation — lives here, so grab it before Chapter 1 ends. Scan new vehicles with WAiNK and study animals with the binoculars as you go; every scan counts toward the 100% checklist you'll unlock later."
    },
    {
      n: 2,
      title: "Character questlines & Strangers & Freaks",
      hours: "~10 h",
      note: "Clear the optional questlines that carry trophies: Andy, Kenton, Billy, Randy, Tyrone, Bret, Cal's fishing challenge, and 8 Strangers & Freaks strands. All of these stay available in free-roam, so this stage is safe to do after the credits."
    },
    {
      n: 3,
      title: "Collectibles & activities",
      hours: "~20 h",
      note: "Stunts, shooting-range golds, drone races, race wins, card sets, WAiNK scans and clearing the map fog. Most of these feed the 100% checklist, so progress here compounds."
    },
    {
      n: 4,
      title: "Robberies, combat & money",
      hours: "~15 h",
      note: "Bank vaults, armoured trucks, gang operations, the 4-star escape, jewelry-store stealth, the tank and the plane. The bank-vault haul also bankrolls the money and property trophies."
    },
    {
      n: 5,
      title: "100% checklist & cleanup",
      hours: "~100 h",
      note: "The biggest block of time. Work the 100% Completion Checklist (any 70 of 80 Challenges, 100 optional missions, 200 vehicle scans, 100 animals studied) to unlock A Long Road, then sweep the secret and easter-egg trophies."
    },
    {
      n: 6,
      title: "Platinum",
      hours: "—",
      note: "With all 54 other trophies earned, Vice Got a Price! unlocks the moment the last one lands. No online, co-op or DLC trophies stand in the way."
    }
  ];

  // ---- state ----
  var earned = new Set(loadEarned());
  var view = "list";
  var kindFilter = "";
  var gradeFilter = "";
  var spoilerOn = loadSpoiler();

  // ---- helpers ----
  function $(id) { return document.getElementById(id); }

  function loadEarned() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return [];
      var arr = JSON.parse(raw);
      return Array.isArray(arr) ? arr.filter(function (x) { return typeof x === "string"; }) : [];
    } catch (e) {
      return [];
    }
  }
  function saveEarned() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(Array.from(earned)));
    } catch (e) { /* storage unavailable */ }
  }
  function loadSpoiler() {
    try {
      var v = localStorage.getItem(SPOILER_KEY);
      if (v === null) return true;
      return v !== "0";
    } catch (e) { return true; }
  }

  function parseQuery() {
    var q = {};
    var s = window.location.search.replace(/^\?/, "");
    if (!s) return q;
    s.split("&").forEach(function (pair) {
      var i = pair.indexOf("=");
      if (i < 0) q[decodeURIComponent(pair)] = "";
      else q[decodeURIComponent(pair.slice(0, i))] = decodeURIComponent(pair.slice(i + 1));
    });
    return q;
  }
  function saveSpoiler() {
    try { localStorage.setItem(SPOILER_KEY, spoilerOn ? "1" : "0"); } catch (e) {}
  }

  function isHidden(t) {
    return t.spoiler === true && spoilerOn && !earned.has(t.id);
  }

  function matchesFilters(t) {
    if (kindFilter === "missable") { if (!t.missable) return false; }
    else if (kindFilter === "online") { if (t.kind !== "online") return false; }
    else if (kindFilter) { if (t.kind !== kindFilter) return false; }
    if (gradeFilter && t.grade !== gradeFilter) return false;
    return true;
  }

  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  function gradeChip(grade) {
    return '<span class="grade-chip grade-' + grade + '">' + GRADE_LABEL[grade] + "</span>";
  }

  // ---- rendering: progress ----
  function renderAuditStrip() {
    var withGuide = TROPHIES.filter(function (t) { return t.guide && t.guide.trim().length > 0; }).length;
    var withSource = TROPHIES.filter(function (t) { return t.sources && t.sources.length > 0; }).length;
    var dated = TROPHIES.filter(function (t) {
      return t.sources && t.sources.length > 0 && t.sources.every(function (s) { return s.retrieved; });
    }).length;
    var items = [
      ["Trophies", TROPHIES.length + "/" + TROPHIES.length],
      ["Guides", withGuide + "/" + TROPHIES.length],
      ["Cited", withSource + "/" + TROPHIES.length],
      ["Dated", dated + "/" + TROPHIES.length],
      ["Missable", TROPHIES.filter(function (t) { return t.missable; }).length],
      ["Online", TROPHIES.filter(function (t) { return t.kind === "online"; }).length],
      ["Stages", STAGES.length]
    ];
    $("auditStrip").innerHTML = items.map(function (it) {
      return '<span class="audit-chip"><span class="a-label">' + it[0] +
        "</span> <span class=\"a-value\">" + it[1] + "</span></span>";
    }).join('<span class="a-sep">·</span>');
  }

  function renderProgress() {
    var n = earned.size;
    var pct = TROPHIES.length ? Math.round((n / TROPHIES.length) * 100) : 0;
    $("earned").textContent = String(n);
    $("barfill").style.width = pct + "%";
    $("pct").textContent = pct + "%";

    var html = GRADE_ORDER.map(function (g) {
      var c = 0;
      TROPHIES.forEach(function (t) { if (t.grade === g && earned.has(t.id)) c++; });
      return '<span class="gc"><span class="dot grade-' + g + '" style="background:' +
        gradeColor(g) + '"></span>' + GRADE_LABEL[g] + " <b>" + c + "/" + GRADE_TOTAL[g] + "</b></span>";
    }).join("");
    $("gradeCounters").innerHTML = html;
  }

  function gradeColor(g) {
    return { platinum: "#c7d6e8", gold: "#f2c14e", silver: "#b9c2cc", bronze: "#c98a5b" }[g];
  }

  // ---- rendering: checklist ----
  function renderList() {
    var list = TROPHIES.filter(matchesFilters);
    var ul = $("checklist");
    var out = "";
    list.forEach(function (t) {
      var hidden = isHidden(t);
      var cls = "selected";
      var isEarned = earned.has(t.id);
      if (isEarned) cls += " earned";
      var name, desc;
      if (hidden) {
        name = "Hidden trophy";
        desc = "Tick it off to reveal";
      } else {
        name = t.name;
        desc = t.description;
      }
      var missFlag = t.missable && !hidden ? '<span class="missable-flag">MISSABLE</span>' : "";
      var descHtml = hidden
        ? '<div class="t-hidden">' + esc(desc) + "</div>"
        : '<div class="t-desc">' + esc(desc) + "</div>";
      out +=
        '<li class="' + cls + '" data-id="' + esc(t.id) + '">' +
          gradeChip(t.grade) +
          '<div class="t-main"><div class="t-name">' + esc(name) + missFlag + "</div>" + descHtml + "</div>" +
          '<input type="checkbox" class="t-check"' + (isEarned ? " checked" : "") + ' data-id="' + esc(t.id) + '" title="Toggle earned" aria-label="Toggle ' + esc(name) + '">' +
        "</li>";
    });
    ul.innerHTML = out;
    $("empty").hidden = list.length > 0;
    $("listedCount").textContent = "Showing " + list.length + " of " + TROPHIES.length;
  }

  // ---- rendering: roadmap ----
  function renderRoadmapSummary() {
    var miss = TROPHIES.filter(function (t) { return t.missable; }).length;
    $("roadmapSummary").textContent =
      TROPHIES.length + " trophies · " + STAGES.length + " stages · " + miss + " missable · ~200 h";
  }

  function renderRoadmap() {
    var out = "";
    STAGES.forEach(function (stage) {
      var items = TROPHIES.filter(function (t) { return t.roadmapStage === stage.n; });
      if (items.length === 0) return;
      var li = items.map(function (t) {
        var isEarned = earned.has(t.id);
        var hidden = isHidden(t);
        var name = hidden ? "Hidden trophy" : t.name;
        var star = (t.missable && !hidden) ? '<span class="s-flag">★</span>' : "";
        return '<li class="s-row' + (isEarned ? " earned" : "") + '" data-id="' + esc(t.id) + '">' +
          '<span class="grade-letter grade-' + t.grade + '">' + t.grade.charAt(0).toUpperCase() + "</span>" +
          '<span class="s-name">' + esc(name) + "</span>" +
          '<span class="s-kind">' + esc(kindLabel(t.kind)) + "</span>" +
          star + "</li>";
      }).join("");
      out +=
        '<div class="stage">' +
          '<div class="stage-head"><span class="stage-num">Stage ' + stage.n + "</span>" +
          '<span class="stage-title">' + esc(stage.title) + "</span>" +
          '<span class="stage-hours">' + esc(stage.hours) + "</span></div>" +
          '<p class="stage-note">' + esc(stage.note) + "</p>" +
          '<ul class="stage-list">' + li + "</ul>" +
        "</div>";
    });
    $("roadmap").innerHTML = out;
  }

  // ---- rendering: missables ----
  function renderMissables() {
    var items = TROPHIES.filter(function (t) { return t.missable; })
      .sort(function (a, b) { return a.roadmapStage - b.roadmapStage; });
    var out = items.map(function (t) {
      var hidden = isHidden(t);
      var name = hidden ? "Hidden trophy" : t.name;
      return '<li data-id="' + esc(t.id) + '">' +
        gradeChip(t.grade) +
        '<div class="t-main"><div class="t-name">' + esc(name) + "</div>" +
        (hidden ? "" : '<div class="m-desc">' + esc(t.description) + "</div>") +
        '<div class="m-warn">' + esc(t.missableNote || "") + "</div></div>" +
        '<div class="t-check' + (earned.has(t.id) ? " earned" : "") + '" data-id="' + esc(t.id) + '"></div>' +
        "</li>";
    }).join("");
    $("missables").innerHTML = out || '<li class="empty-note">No missable trophies.</li>';
  }

  // ---- rendering: detail ----
  function renderDetail(id) {
    var t = TROPHIES.find(function (x) { return x.id === id; });
    if (!t) return;
    var hidden = isHidden(t);
    var body = $("detailBody");
    var name = hidden ? "Hidden trophy" : t.name;
    var desc = hidden ? "Tick it off to reveal this trophy." : t.description;
    var guide = hidden
      ? "Tick this trophy off to reveal its guide."
      : t.guide;
    var stage = STAGES[t.roadmapStage - 1];

    var meta = gradeChip(t.grade) +
      '<span class="meta-tag">' + esc(kindLabel(t.kind)) + "</span>" +
      '<span class="meta-tag">Stage ' + t.roadmapStage + " · " + esc(stage.title) + "</span>" +
      (t.missable ? '<span class="meta-tag missable">Missable</span>' : "");

    var missNote = (t.missable && !hidden)
      ? '<div class="missable-note">' + esc(t.missableNote || "") + "</div>" : "";

    var sources = "";
    if (!hidden) {
      sources =
        '<div class="guide-head">Sources</div><ul class="sources">' +
        t.sources.map(function (s) {
          return '<li><span class="s-title">' + esc(s.title) + "</span> — " +
            '<span class="s-url">' + esc(s.url) + "</span>" +
            '<span class="s-ret">retrieved ' + esc(s.retrieved || "") + "</span></li>";
        }).join("") +
        "</ul>";
    }

    body.innerHTML =
      "<h2>" + esc(name) + "</h2>" +
      '<div class="d-desc">' + esc(desc) + "</div>" +
      '<div class="detail-meta">' + meta + "</div>" +
      missNote +
      '<div class="guide-head">Guide</div>' +
      '<div class="guide">' + esc(guide) + "</div>" +
      sources +
      '<button class="detail-tick' + (earned.has(t.id) ? " earned" : "") + '" data-id="' + esc(t.id) + '">' +
      (earned.has(t.id) ? "✓ Earned — click to unmark" : "Mark as earned") + "</button>";

    $("detailPlaceholder").hidden = true;
    body.hidden = false;
  }

  function kindLabel(k) {
    return { story: "Story", collectible: "Collectible", activity: "Activity", online: "Online", misc: "Misc" }[k] || k;
  }

  function clearDetail() {
    $("detailBody").hidden = true;
    $("detailPlaceholder").hidden = false;
  }

  // ---- actions ----
  function toggleEarned(id) {
    if (earned.has(id)) earned.delete(id);
    else earned.add(id);
    saveEarned();
    renderAll();
    if (view === "list") renderDetail(id);
    if (view === "roadmap") renderDetail(id);
    if (view === "missables") renderDetail(id);
  }

  function renderAll() {
    renderProgress();
    renderAuditStrip();
    renderList();
    renderRoadmap();
    renderRoadmapSummary();
    renderMissables();
  }

  function switchView(v) {
    view = v;
    document.querySelectorAll(".tab").forEach(function (b) {
      b.classList.toggle("active", b.dataset.view === v);
    });
    document.querySelectorAll(".view").forEach(function (s) {
      s.classList.toggle("active", s.id === "view-" + v);
    });
    $("filters").hidden = v !== "list";
    clearDetail();
  }

  // ---- export / import ----
  function exportJson() {
    var payload = JSON.stringify({ earned: Array.from(earned).sort() }, null, 2);
    var done = false;
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(payload).then(function () { done = true; }, function () {});
    }
    $("importText").value = payload;
    $("importPanel").hidden = false;
    $("importText").select();
    if (done) {
      $("importPanel").querySelector("p").textContent =
        "Copied to clipboard. If that failed, copy the JSON below.";
    } else {
      $("importPanel").querySelector("p").textContent =
        "Clipboard unavailable — copy the JSON below.";
    }
  }

  function importJson() {
    var text = $("importText").value.trim();
    if (!text) return;
    try {
      var obj = JSON.parse(text);
      var arr = Array.isArray(obj) ? obj : (Array.isArray(obj.earned) ? obj.earned : null);
      if (!arr) throw new Error("bad shape");
      var valid = new Set();
      TROPHIES.forEach(function (t) { valid.add(t.id); });
      earned = new Set(arr.filter(function (x) { return valid.has(x); }));
      saveEarned();
      $("importPanel").hidden = true;
      renderAll();
    } catch (e) {
      $("importPanel").querySelector("p").textContent =
        "Could not parse that JSON. Expected {\"earned\": [\"id\", ...]}.";
    }
  }

  // ---- wiring ----
  function bindEvents() {
    // tabs
    document.querySelectorAll(".tab").forEach(function (b) {
      b.addEventListener("click", function () { switchView(b.dataset.view); });
    });

    // kind filters
    $("kindFilters").addEventListener("click", function (e) {
      var chip = e.target.closest(".chip");
      if (!chip) return;
      kindFilter = chip.dataset.kind;
      document.querySelectorAll("#kindFilters .chip").forEach(function (c) {
        c.classList.toggle("active", c === chip);
      });
      renderList();
    });

    // grade filters
    $("gradeFilters").addEventListener("click", function (e) {
      var chip = e.target.closest(".chip");
      if (!chip) return;
      gradeFilter = chip.dataset.grade;
      document.querySelectorAll("#gradeFilters .chip").forEach(function (c) {
        c.classList.toggle("active", c === chip);
      });
      renderList();
    });

    // row clicks -> detail; checkbox -> toggle
    ["checklist", "roadmap", "missables"].forEach(function (area) {
      var el = $(area === "checklist" ? "checklist" : area);
      if (!el) return;
      el.addEventListener("click", function (e) {
        var check = e.target.closest(".t-check");
        if (check) {
          toggleEarned(check.dataset.id);
          return;
        }
        var row = e.target.closest("[data-id]");
        if (!row) return;
        var id = row.dataset.id;
        document.querySelectorAll(".selected").forEach(function (n) {
          n.classList.remove("selected");
        });
        row.classList.add("selected");
        renderDetail(id);
      });
    });

    // detail tick button
    $("detailBody").addEventListener("click", function (e) {
      var btn = e.target.closest(".detail-tick");
      if (btn) toggleEarned(btn.dataset.id);
    });

    // spoiler toggle
    $("spoilerToggle").addEventListener("change", function () {
      spoilerOn = this.checked;
      saveSpoiler();
      renderAll();
      clearDetail();
    });

    // export / import
    $("exportBtn").addEventListener("click", exportJson);
    $("importBtn").addEventListener("click", function () {
      $("importPanel").hidden = false;
      $("importPanel").querySelector("p").textContent =
        "Paste exported JSON of ticked trophy ids, then press Load.";
    });
    $("importLoad").addEventListener("click", importJson);
    $("importCancel").addEventListener("click", function () {
      $("importPanel").hidden = true;
    });
  }

  // ---- init ----
  var q = parseQuery();
  if (q.spoiler === "0") spoilerOn = false;
  else if (q.spoiler === "1") spoilerOn = true;
  if (q.view === "roadmap" || q.view === "missables") view = q.view;
  var initialTrophy = q.trophy || "";
  $("spoilerToggle").checked = spoilerOn;
  bindEvents();
  renderAll();
  switchView(view);
  if (initialTrophy) renderDetail(initialTrophy);
})();
