(() => {
  const THEMES = {
    emoji: ["🍣","🍙","🍜","🍛","🍡","🍘","🍵","🧋","🍫","🍰","🍎","🍇","🍊","🍓","🥑","🥕","🍤","🥨"],
    geo:   ["🛰️","📡","🗺️","🧭","🌋","🏝️","🌏","☁️","🌧️","🌿","🌾","🏙️","🏠","🔭","📷","🧪","📈","⛰️"],
  };
  const $ = (id) => document.getElementById(id);
  const shuffled = (arr) => { const a = arr.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  const neighbors = (n, i) => { const r = Math.floor(i / n), c = i % n, l = []; if (r > 0) l.push(i - n); if (r < n - 1) l.push(i + n); if (c > 0) l.push(i - 1); if (c < n - 1) l.push(i + 1); return l; };
  const readBest = (k) => { try { return JSON.parse(localStorage.getItem(k) || "null"); } catch (e) { return null; } };
  const writeBest = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} };
  const bestLabel = (best, size) => (best && best.size === size ? ` ／ BEST ${best.moves}手` : "");

  /* ---------- tabs ---------- */
  let tab = "memory";
  document.querySelectorAll(".tab").forEach((b) => {
    b.addEventListener("click", () => {
      tab = b.dataset.tab;
      document.querySelectorAll(".tab").forEach((x) => x.classList.toggle("is-on", x === b));
      $("panel-memory").hidden = tab !== "memory";
      $("panel-slide").hidden = tab !== "slide";
    });
  });
  const segment = (rootId, onPick) => {
    const root = $(rootId);
    root.addEventListener("click", (e) => {
      const b = e.target.closest("button");
      if (!b) return;
      root.querySelectorAll("button").forEach((x) => x.classList.toggle("is-on", x === b));
      onPick(b.dataset.v);
    });
  };

  /* ---------- memory ---------- */
  const mem = { size: 4, theme: "emoji", cards: [], first: null, lock: false, moves: 0, matched: 0, time: 0, timer: null, won: false,
                best: readBest("mg.best.memory") };
  const memBoard = $("mem-board");

  function memRender() {
    memBoard.style.gridTemplateColumns = `repeat(${mem.size}, 1fr)`;
    memBoard.classList.toggle("is-6", mem.size === 6);
    memBoard.innerHTML = "";
    mem.cards.forEach((c) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "card" + (c.state !== "hidden" ? " is-up" : "") + (c.state === "matched" ? " is-matched" : "");
      btn.innerHTML = `<div class="card-inner"><div class="card-back">?</div><div class="card-face">${c.sym}</div></div>`;
      btn.addEventListener("click", () => memPick(c.id));
      memBoard.appendChild(btn);
    });
  }
  function memSync() {
    $("mem-moves").textContent = mem.moves;
    $("mem-time").textContent = mem.time;
  }
  function memStartTimer() {
    if (mem.timer) return;
    const t0 = Date.now();
    mem.timer = setInterval(() => { mem.time = Math.floor((Date.now() - t0) / 1000); memSync(); }, 250);
  }
  function memInit() {
    clearInterval(mem.timer); mem.timer = null;
    const pairs = (mem.size * mem.size) / 2;
    const pool = THEMES[mem.theme] || THEMES.emoji;
    const syms = [];
    for (let i = 0; i < pairs; i++) syms.push(pool[i % pool.length]);
    mem.cards = shuffled(syms.concat(syms)).map((sym, id) => ({ id, sym, state: "hidden" }));
    Object.assign(mem, { first: null, lock: false, moves: 0, matched: 0, time: 0, won: false });
    $("mem-overlay").hidden = true;
    memRender(); memSync();
  }
  function memPick(id) {
    if (mem.lock || mem.won) return;
    const card = mem.cards.find((c) => c.id === id);
    if (!card || card.state !== "hidden") return;
    memStartTimer();
    card.state = "shown";
    if (mem.first === null) { mem.first = id; memRender(); return; }
    const a = mem.cards.find((c) => c.id === mem.first);
    const match = a && a.sym === card.sym;
    mem.first = null; mem.lock = true; mem.moves++;
    memRender(); memSync();
    setTimeout(() => {
      a.state = card.state = match ? "matched" : "hidden";
      if (match) mem.matched += 2;
      mem.lock = false;
      if (mem.matched === mem.size * mem.size) {
        mem.won = true;
        clearInterval(mem.timer); mem.timer = null;
        const rec = { moves: mem.moves, time: mem.time, size: mem.size };
        const cur = mem.best;
        if (!cur || rec.moves < cur.moves || (rec.moves === cur.moves && rec.time < cur.time)) { mem.best = rec; writeBest("mg.best.memory", rec); }
        $("mem-result").textContent = `${mem.moves} 手 / ${mem.time} 秒${bestLabel(mem.best, mem.size)}`;
        $("mem-overlay").hidden = false;
      }
      memRender();
    }, 520);
  }
  segment("mem-size", (v) => { mem.size = Number(v); memInit(); });
  segment("mem-theme", (v) => { mem.theme = v; memInit(); });
  $("mem-restart").addEventListener("click", memInit);
  $("mem-again").addEventListener("click", memInit);

  /* ---------- slide puzzle ---------- */
  const sp = { n: 4, tiles: [], moves: 0, time: 0, timer: null, best: readBest("mg.best.slide") };
  const spBoard = $("slide-board");
  const spSolved = (t) => { if (!t.length) return false; for (let i = 0; i < t.length - 1; i++) if (t[i] !== i + 1) return false; return t[t.length - 1] === 0; };

  function spRender() {
    const won = spSolved(sp.tiles);
    spBoard.style.gridTemplateColumns = `repeat(${sp.n}, 1fr)`;
    spBoard.classList.toggle("is-won", won);
    spBoard.innerHTML = "";
    sp.tiles.forEach((v, idx) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "tile" + (v === 0 ? " is-blank" : "");
      btn.textContent = v === 0 ? "" : String(v);
      btn.addEventListener("click", () => spMove(idx));
      spBoard.appendChild(btn);
    });
  }
  function spSync() { $("slide-moves").textContent = sp.moves; $("slide-time").textContent = sp.time; }
  function spStartTimer() {
    if (sp.timer) return;
    const t0 = Date.now();
    sp.timer = setInterval(() => { sp.time = Math.floor((Date.now() - t0) / 1000); spSync(); }, 250);
  }
  function spShuffle() {
    clearInterval(sp.timer); sp.timer = null;
    const total = sp.n * sp.n, t = [];
    for (let i = 1; i < total; i++) t.push(i);
    t.push(0);
    for (let k = 0; k < total * total * 12; k++) {
      const b = t.indexOf(0), ns = neighbors(sp.n, b), p = ns[Math.floor(Math.random() * ns.length)];
      [t[p], t[b]] = [t[b], t[p]];
    }
    sp.tiles = t; sp.moves = 0; sp.time = 0;
    $("slide-overlay").hidden = true;
    spRender(); spSync();
  }
  function spMove(idx) {
    if (spSolved(sp.tiles)) return;
    const b = sp.tiles.indexOf(0);
    if (!neighbors(sp.n, idx).includes(b)) return;
    spStartTimer();
    [sp.tiles[idx], sp.tiles[b]] = [sp.tiles[b], sp.tiles[idx]];
    sp.moves++;
    spRender(); spSync();
    if (spSolved(sp.tiles)) {
      clearInterval(sp.timer); sp.timer = null;
      const rec = { moves: sp.moves, time: sp.time, size: sp.n }, cur = sp.best;
      if (!cur || rec.moves < cur.moves || (rec.moves === cur.moves && rec.time < cur.time)) { sp.best = rec; writeBest("mg.best.slide", rec); }
      $("slide-result").textContent = `${sp.moves} 手 / ${sp.time} 秒${bestLabel(sp.best, sp.n)}`;
      $("slide-overlay").hidden = false;
    }
  }
  segment("slide-size", (v) => { sp.n = Number(v); spShuffle(); });
  $("slide-shuffle").addEventListener("click", spShuffle);
  $("slide-again").addEventListener("click", spShuffle);

  window.addEventListener("keydown", (e) => {
    if (tab !== "slide") return;
    const dirs = { ArrowUp: "up", ArrowDown: "down", ArrowLeft: "left", ArrowRight: "right" };
    const dir = dirs[e.key];
    if (!dir) return;
    e.preventDefault();
    const b = sp.tiles.indexOf(0), r = Math.floor(b / sp.n), c = b % sp.n;
    let idx = -1;
    if (dir === "up" && r < sp.n - 1) idx = b + sp.n;
    if (dir === "down" && r > 0) idx = b - sp.n;
    if (dir === "left" && c < sp.n - 1) idx = b + 1;
    if (dir === "right" && c > 0) idx = b - 1;
    if (idx >= 0) spMove(idx);
  });

  memInit();
  spShuffle();
})();
