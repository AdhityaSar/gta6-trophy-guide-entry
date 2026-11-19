/* GTA VI trophy guide & tracker — single page, offline. */
(function () {
  "use strict";

  var T = window.TROPHIES || [];
  var GRADE_LABEL = { platinum: "Platinum", gold: "Gold", silver: "Silver", bronze: "Bronze" };
  var GRADE_ORDER = { platinum: 0, gold: 1, silver: 2, bronze: 3 };
  var KIND_ORDER = { story: 0, collectible: 1, activity: 2, online: 3, misc: 4 };

  var LS_KEY = "gta6.ticked.v1";

  var state = {
    view: "list",
    kind: "all",
    grade: "all",
    spoiler: true,
    selected: null
  };

  var els = {};
  var ticked = loadTicked();

  function loadTicked() {
    try {
      var raw = localStorage.getItem(LS_KEY);
      if (!raw) return {};
      var arr = JSON.parse(raw);
      if (!Array.isArray(arr)) return {};
      var m = {};
      for (var i = 0; i < arr.length; i++) if (typeof arr[i] === "string") m[arr[i]] = true;
      return m;
    } catch (e) {
      return {};
    }
  }

  function saveTicked() {
    var ids = Object.keys(ticked);
    try { localStorage.setItem(LS_KEY, JSON.stringify(ids)); } catch (e) {}
  }

  function byId(id) {
    for (var i = 0; i < T.length; i++) if (T[i].id === id) return T[i];
    return null;
  }

  function readUrlParams() {
    var q = new URLSearchParams(window.location.search);
    var v = q.get("view");
    if (v === "list" || v === "roadmap" || v === "missables") state.view = v;
    var s = q.get("spoiler");
    if (s === "on") state.spoiler = true;
    else if (s === "off") state.spoiler = false;
    var t = q.get("trophy");
    if (t && byId(t)) state.selected = t;
  }

  function countBy(list) {
    var c = { platinum: 0, gold: 0, silver: 0, bronze: 0 };
    for (var i = 0; i < list.length; i++) c[list[i].grade]++;
    return c;
  }

  function earnCount() { return Object.keys(ticked).length; }

  /* ---------- header ---------- */

  function renderHeader() {
    var earned = earnCount();
    els.earnedCount.textContent = String(earned);
    els.earnedBar.style.width = (earned / T.length * 100).toFixed(1) + "%";

    var c = countBy(T);
    var t = countBy(T);
    var order = ["platinum", "gold", "silver", "bronze"];
    var html = "";
    for (var i = 0; i < order.length; i++) {
      var g = order[i];
      var done = 0;
      for (var j = 0; j < T.length; j++) if (T[j].grade === g && ticked[T[j].id]) done++;
      html += '<span class="grade">' + GRADE_LABEL[g] + ' <b>' + done + '/' + c[g] + "</b></span>";
    }
    els.gradeCounters.innerHTML = html;
    els.spoilerToggle.checked = state.spoiler;
  }

  function renderAudit() {
    var total = T.length;
    var guides = 0, cited = 0, dated = 0, missable = 0, online = 0;
    var stages = new Set();
    for (var i = 0; i < T.length; i++) {
      var tr = T[i];
      if (tr.guide && tr.guide.trim().length > 0) guides++;
      if (tr.sources && tr.sources.length > 0) {
        cited++;
        var allDated = true;
        for (var j = 0; j < tr.sources.length; j++) if (!tr.sources[j].retrieved) { allDated = false; break; }
        if (allDated) dated++;
      }
      if (tr.missable) missable++;
      if (tr.kind === "online") online++;
      if (tr.roadmapStage) stages.add(tr.roadmapStage);
    }
    var items = [
      ["Trophies", total + "/55"],
      ["Guides", guides + "/55"],
      ["Cited", cited + "/55"],
      ["Dated", dated + "/55"],
      ["Missable", String(missable)],
      ["Online", String(online)],
      ["Stages", String(stages.size)]
    ];
    var html = "";
    for (var k = 0; k < items.length; k++) {
      html += '<span class="chip">' + items[k][0] + " <b>" + items[k][1] + "</b></span>";
    }
    els.auditStrip.innerHTML = html;
  }

  /* ---------- filtering ---------- */

  function matches(t) {
    if (state.kind === "missable") { if (!t.missable) return false; }
    else if (state.kind === "all") { /* nothing */ }
    else if (t.kind !== state.kind) return false;
    if (state.grade !== "all" && t.grade !== state.grade) return false;
    return true;
  }

  function filtered() {
    var out = [];
    for (var i = 0; i < T.length; i++) if (matches(T[i])) out.push(T[i]);
    return out;
  }

  /* ---------- views ---------- */

  function renderList() {
    var list = filtered();
    els.shownCount.textContent = "Showing " + list.length + " of 55";
    var html = "";
    for (var i = 0; i < list.length; i++) {
      var t = list[i];
      html += rowHtml(t);
    }
    if (list.length === 0) html = '<div class="empty-view">No trophies match these filters.</div>';
    els.listPanel.innerHTML = html;
  }

  function rowHtml(t) {
    var done = !!ticked[t.id];
    var selected = state.selected === t.id ? " selected" : "";
    var doneCls = done ? " done" : "";
    var hidden = state.spoiler && t.spoiler && !done;

    var title, desc;
    if (hidden) {
      title = "Hidden trophy";
      desc = "Hidden trophy — tick it off to reveal";
    } else {
      title = t.name;
      desc = t.description;
    }

    var miss = t.missable ? '<span class="rmiss">★</span>' : "";
    var body;
    if (hidden) {
      body = '<div class="rname">' + esc(title) + '</div><div class="rmask">' + esc(desc) + "</div>";
    } else {
      body = '<div class="rname">' + esc(title) + miss + '</div><div class="rdesc">' + esc(desc) + "</div>";
    }

    return (
      '<div class="row' + selected + doneCls + '" data-id="' + esc(t.id) + '">' +
        '<span class="rg ' + t.grade + '">' + t.grade + "</span>" +
        '<div class="rbody">' + body + "</div>" +
        '<label class="rtick" data-id="' + esc(t.id) + '"><input type="checkbox"' + (done ? " checked" : "") + "></label>" +
      "</div>"
    );
  }

  function renderRoadmap() {
    var list = T;
    els.shownCount.textContent = "";
    var earned = earnCount();
    var missCount = 0;
    for (var i = 0; i < T.length; i++) if (T[i].missable) missCount++;
    var html = '<div class="rmap-summary">' + T.length + " trophies · 6 stages · " + missCount + " missable · ~200 h</div>";

    for (var s = 1; s <= 6; s++) {
      var stageList = [];
      for (var j = 0; j < list.length; j++) if (list[j].roadmapStage === s) stageList.push(list[j]);
      stageList.sort(function (a, b) {
        return (GRADE_ORDER[a.grade] - GRADE_ORDER[b.grade]) || (a.name < b.name ? -1 : 1);
      });
      html += '<div class="stage"><h3>Stage ' + s + ' <span>— ' + stageList.length + " trophies</span></h3><ul>";
      for (var k = 0; k < stageList.length; k++) {
        var t = stageList[k];
        html += '<li><span class="st">' + gradeLetter(t.grade) + "</span> " + esc(t.name) +
          ' <span class="sk">· ' + t.kind + "</span>" +
          (t.missable ? ' <span class="sm">★ missable</span>' : "") +
          "</li>";
      }
      html += "</ul></div>";
    }
    els.listPanel.innerHTML = html;
  }

  function gradeLetter(g) {
    return { platinum: "P", gold: "G", silver: "S", bronze: "B" }[g] || g[0].toUpperCase();
  }

  function renderMissables() {
    els.shownCount.textContent = "";
    var miss = [];
    for (var i = 0; i < T.length; i++) if (T[i].missable) miss.push(T[i]);
    var html = "";
    for (var j = 0; j < miss.length; j++) {
      var t = miss[j];
      html += '<div class="miss-card" data-id="' + esc(t.id) + '">' +
        '<h3>' + esc(t.name) + ' <span class="st" style="color:var(--faint)">' + t.grade + " · " + t.kind + "</span></h3>" +
        '<div class="warn">⚠ Missable — complete this before it locks out.</div>' +
        '<div class="ponr">Point of no return: ' + esc(t.missableNote || "See the guide for details.") + "</div>" +
        "</div>";
    }
    if (miss.length === 0) html = '<div class="empty-view">No missable trophies.</div>';
    els.listPanel.innerHTML = html;
  }

  function renderDetail() {
    var t = state.selected ? byId(state.selected) : null;
    if (!t) {
      els.detailPanel.innerHTML = '<div class="empty">Select a trophy to see its guide.</div>';
      return;
    }
    var miss = t.missable
      ? '<div class="misswarn">Missable: ' + esc(t.missableNote || "This trophy can be missed.") + "</div>"
      : "";

    var src = "";
    for (var i = 0; i < t.sources.length; i++) {
      var s = t.sources[i];
      src += '<a class="src-item" href="' + esc(s.url) + '" target="_blank" rel="noopener">' +
        '<span class="src-title">' + esc(s.title) + "</span>" +
        '<span class="src-meta">' +
          '<span class="src-url">' + esc(s.url) + "</span>" +
          '<span class="src-date">retrieved ' + esc(s.retrieved || "") + "</span>" +
        "</span></a>";
    }

    var meta =
      '<div class="dmeta">' +
      '<span class="tag">' + t.kind + "</span>" +
      '<span class="tag">Stage ' + t.roadmapStage + "</span>" +
      (t.spoiler ? '<span class="tag">spoiler</span>' : "") +
      "</div>";

    els.detailPanel.innerHTML =
      '<div class="detail">' +
        '<div class="dk"><span class="dgrade ' + t.grade + '">' + GRADE_LABEL[t.grade] + "</span>" +
        '<div><div class="dname">' + esc(t.name) + "</div></div></div>" +
        '<div class="ddesc">' + esc(t.description) + "</div>" +
        meta + miss +
        '<div class="guide"><h3>Guide</h3><p>' + esc(t.guide) + "</p></div>" +
        (src ? '<div class="src"><h3>Sources</h3>' + src + "</div>" : "") +
      "</div>";
  }

  function render() {
    renderHeader();
    renderAudit();
    if (state.view === "list") renderList();
    else if (state.view === "roadmap") renderRoadmap();
    else renderMissables();
    renderDetail();

    // highlight the active tab
    var tabs = els.tabs.querySelectorAll(".tab");
    for (var i = 0; i < tabs.length; i++) {
      tabs[i].classList.toggle("active", tabs[i].getAttribute("data-view") === state.view);
    }
    // highlight active filter chips
    var kc = els.kindFilters.querySelectorAll(".chip");
    for (var j = 0; j < kc.length; j++) {
      kc[j].classList.toggle("active", kc[j].getAttribute("data-kind") === state.kind);
    }
    var gc = els.gradeFilters.querySelectorAll(".chip");
    for (var k = 0; k < gc.length; k++) {
      gc[k].classList.toggle("active", gc[k].getAttribute("data-grade") === state.grade);
    }
  }

  /* ---------- events ---------- */

  function esc(s) {
    return String(s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function setView(v) {
    state.view = v;
    render();
  }

  function bindEvents() {
    els.tabs.addEventListener("click", function (e) {
      var b = e.target.closest(".tab");
      if (b) setView(b.getAttribute("data-view"));
    });

    els.kindFilters.addEventListener("click", function (e) {
      var b = e.target.closest(".chip");
      if (b) { state.kind = b.getAttribute("data-kind"); render(); }
    });

    els.gradeFilters.addEventListener("click", function (e) {
      var b = e.target.closest(".chip");
      if (b) { state.grade = b.getAttribute("data-grade"); render(); }
    });

    els.spoilerToggle.addEventListener("change", function () {
      state.spoiler = els.spoilerToggle.checked;
      render();
    });

    // row click -> select; checkbox click -> toggle (stop propagation)
    els.listPanel.addEventListener("click", function (e) {
      var tick = e.target.closest(".rtick");
      if (tick) {
        var id = tick.getAttribute("data-id");
        toggleTick(id);
        e.stopPropagation();
        return;
      }
      var card = e.target.closest(".miss-card");
      if (card) {
        state.selected = card.getAttribute("data-id");
        state.view = "list";
        render();
        return;
      }
      var row = e.target.closest(".row");
      if (row) {
        state.selected = row.getAttribute("data-id");
        render();
      }
    });

    els.listPanel.addEventListener("change", function (e) {
      var cb = e.target;
      if (cb.type === "checkbox" && cb.closest(".rtick")) {
        var id = cb.closest(".rtick").getAttribute("data-id");
        setTick(id, cb.checked);
      }
    });

    els.exportBtn.addEventListener("click", function () {
      els.ioBox.value = JSON.stringify(Object.keys(ticked));
      els.ioBox.select();
    });

    els.importBtn.addEventListener("click", function () {
      try {
        var arr = JSON.parse(els.ioBox.value.trim());
        if (!Array.isArray(arr)) throw new Error("not an array");
        var m = {};
        for (var i = 0; i < arr.length; i++) if (typeof arr[i] === "string" && byId(arr[i])) m[arr[i]] = true;
        ticked = m;
        saveTicked();
        render();
      } catch (e) {
        alert("Import failed: paste a JSON array of trophy ids.");
      }
    });
  }

  function toggleTick(id) {
    if (ticked[id]) delete ticked[id];
    else ticked[id] = true;
    saveTicked();
    render();
  }

  function setTick(id, on) {
    if (on) ticked[id] = true;
    else delete ticked[id];
    saveTicked();
    render();
  }

  /* ---------- boot ---------- */

  function boot() {
    els = {
      earnedCount: document.getElementById("earnedCount"),
      earnedBar: document.getElementById("earnedBar"),
      gradeCounters: document.getElementById("gradeCounters"),
      spoilerToggle: document.getElementById("spoilerToggle"),
      exportBtn: document.getElementById("exportBtn"),
      importBtn: document.getElementById("importBtn"),
      ioBox: document.getElementById("ioBox"),
      auditStrip: document.getElementById("auditStrip"),
      tabs: document.getElementById("tabs"),
      kindFilters: document.getElementById("kindFilters"),
      gradeFilters: document.getElementById("gradeFilters"),
      shownCount: document.getElementById("shownCount"),
      listPanel: document.getElementById("listPanel"),
      detailPanel: document.getElementById("detailPanel")
    };
    readUrlParams();
    bindEvents();
    render();
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
