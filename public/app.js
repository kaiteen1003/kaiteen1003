// ===== Utilities =====
function shuffle(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
function nowSec() {
  return Math.floor(Date.now() / 1000);
}

// ===== Tabs =====
const tabMemory = document.getElementById("tab-memory");
const tabSlide = document.getElementById("tab-slide");
const panelMemory = document.getElementById("panel-memory");
const panelSlide = document.getElementById("panel-slide");

tabMemory.addEventListener("click", () => {
  tabMemory.classList.add("active");
  tabSlide.classList.remove("active");
  panelMemory.classList.remove("hidden");
  panelSlide.classList.add("hidden");
});

tabSlide.addEventListener("click", () => {
  tabSlide.classList.add("active");
  tabMemory.classList.remove("active");
  panelSlide.classList.remove("hidden");
  panelMemory.classList.add("hidden");
});

// ===== Memory (神経衰弱) =====
const memoryBoard = document.getElementById("memory-board");
const memoryMovesEl = document.getElementById("memory-moves");
const memoryTimeEl = document.getElementById("memory-time");
const memoryRestartBtn = document.getElementById("memory-restart");
const memoryDifficulty = document.getElementById("memory-difficulty");
const memoryTheme = document.getElementById("memory-theme");

let memoryState = {
  size: 4,
  theme: "emoji",
  cards: [],
  firstPick: null,
  lock: false,
  moves: 0,
  matched: 0,
  startAt: null,
  timer: null,
};

const THEMES = {
  emoji: [
    "🍣",
    "🍙",
    "🍜",
    "🍛",
    "🍡",
    "🍘",
    "🍵",
    "🧋",
    "🍫",
    "🍰",
    "🍎",
    "🍇",
    "🍊",
    "🍓",
    "🥑",
    "🥕",
    "🍤",
    "🥨",
    "🍕",
    "🍔",
    "🧠",
    "🛰️",
    "🛰️‍🧪",
    "🌏",
    "🌋",
    "🗺️",
    "📡",
    "🧪",
    "🧰",
    "🧩",
  ],
  geo: [
    "🛰️",
    "📡",
    "🗺️",
    "🧭",
    "🌋",
    "🏝️",
    "🌏",
    "☁️",
    "🌧️",
    "🌿",
    "🌾",
    "🏙️",
    "🏠",
    "🛰️‍🧪",
    "🔭",
    "📷",
    "🧠",
    "🧪",
    "📈",
    "🧩",
    "🧱",
    "🧱",
    "⛰️",
    "🏞️",
    "🟦",
    "🟩",
    "🟨",
    "🟥",
    "🟪",
    "⬛️",
  ],
};

function memoryResetTimer() {
  if (memoryState.timer) clearInterval(memoryState.timer);
  memoryState.startAt = null;
  memoryTimeEl.textContent = "0";
}

function memoryStartTimerIfNeeded() {
  if (memoryState.startAt !== null) return;
  memoryState.startAt = nowSec();
  memoryState.timer = setInterval(() => {
    const t = nowSec() - memoryState.startAt;
    memoryTimeEl.textContent = String(t);
  }, 250);
}

function memorySetGrid(size) {
  memoryBoard.style.gridTemplateColumns = `repeat(${size}, 1fr)`;
}

function buildMemoryDeck(size, themeKey) {
  const total = size * size;
  const pairs = total / 2;
  const pool = THEMES[themeKey] ?? THEMES.emoji;

  // 必要数だけ絵柄を取り出す（足りない場合は繰り返す）
  const symbols = [];
  for (let i = 0; i < pairs; i++) {
    symbols.push(pool[i % pool.length]);
  }
  const deck = shuffle([...symbols, ...symbols]).map((sym, idx) => ({
    id: idx,
    sym,
    state: "hidden", // hidden | shown | matched
  }));
  return deck;
}

function renderMemory() {
  memoryBoard.innerHTML = "";
  memorySetGrid(memoryState.size);
  for (const card of memoryState.cards) {
    const btn = document.createElement("button");
    btn.className = "memory-card";
    btn.type = "button";
    btn.dataset.id = String(card.id);
    btn.dataset.state = card.state;
    btn.setAttribute("aria-label", "card");

    const face = document.createElement("div");
    face.className = "face";
    face.textContent = card.sym;

    btn.appendChild(face);
    btn.addEventListener("click", () => onMemoryPick(card.id));
    memoryBoard.appendChild(btn);
  }
  memoryMovesEl.textContent = String(memoryState.moves);
}

function setMemoryCardState(id, newState) {
  const c = memoryState.cards.find((x) => x.id === id);
  if (!c) return;
  c.state = newState;
  const el = memoryBoard.querySelector(`.memory-card[data-id="${id}"]`);
  if (el) el.dataset.state = newState;
}

function onMemoryPick(id) {
  if (memoryState.lock) return;

  const card = memoryState.cards.find((c) => c.id === id);
  if (!card) return;
  if (card.state === "matched" || card.state === "shown") return;

  memoryStartTimerIfNeeded();

  setMemoryCardState(id, "shown");

  if (memoryState.firstPick === null) {
    memoryState.firstPick = id;
    return;
  }

  // second pick
  memoryState.moves += 1;
  memoryMovesEl.textContent = String(memoryState.moves);

  const a = memoryState.cards.find((c) => c.id === memoryState.firstPick);
  const b = card;

  memoryState.firstPick = null;
  memoryState.lock = true;

  const isMatch = a && b && a.sym === b.sym;

  setTimeout(() => {
    if (isMatch) {
      setMemoryCardState(a.id, "matched");
      setMemoryCardState(b.id, "matched");
      memoryState.matched += 2;

      if (memoryState.matched === memoryState.size * memoryState.size) {
        // win
        clearInterval(memoryState.timer);
        memoryState.timer = null;
      }
    } else {
      setMemoryCardState(a.id, "hidden");
      setMemoryCardState(b.id, "hidden");
    }

    memoryState.lock = false;
  }, 520);
}

function initMemory() {
  memoryState.size = Number(memoryDifficulty.value);
  memoryState.theme = memoryTheme.value;
  memoryState.cards = buildMemoryDeck(memoryState.size, memoryState.theme);
  memoryState.firstPick = null;
  memoryState.lock = false;
  memoryState.moves = 0;
  memoryState.matched = 0;
  memoryResetTimer();
  renderMemory();
}

memoryRestartBtn.addEventListener("click", initMemory);
memoryDifficulty.addEventListener("change", initMemory);
memoryTheme.addEventListener("change", initMemory);

// ===== Slide Puzzle =====
const slideBoard = document.getElementById("slide-board");
const slideMovesEl = document.getElementById("slide-moves");
const slideTimeEl = document.getElementById("slide-time");
const slideShuffleBtn = document.getElementById("slide-shuffle");
const slideSizeSel = document.getElementById("slide-size");

let slideState = {
  n: 4,
  tiles: [], // 0 is blank
  moves: 0,
  startAt: null,
  timer: null,
};

function slideResetTimer() {
  if (slideState.timer) clearInterval(slideState.timer);
  slideState.startAt = null;
  slideTimeEl.textContent = "0";
}
function slideStartTimerIfNeeded() {
  if (slideState.startAt !== null) return;
  slideState.startAt = nowSec();
  slideState.timer = setInterval(() => {
    slideTimeEl.textContent = String(nowSec() - slideState.startAt);
  }, 250);
}

function slideSetGrid(n) {
  slideBoard.style.gridTemplateColumns = `repeat(${n}, 1fr)`;
}

function slideIsSolved(tiles) {
  // [1..n^2-1, 0]
  for (let i = 0; i < tiles.length - 1; i++) {
    if (tiles[i] !== i + 1) return false;
  }
  return tiles[tiles.length - 1] === 0;
}

function slideRender() {
  slideBoard.innerHTML = "";
  slideSetGrid(slideState.n);

  slideState.tiles.forEach((v, idx) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "tile" + (v === 0 ? " blank" : "");
    btn.dataset.idx = String(idx);
    btn.textContent = v === 0 ? "□" : String(v);

    btn.addEventListener("click", () => slideTryMove(idx));
    slideBoard.appendChild(btn);
  });

  slideMovesEl.textContent = String(slideState.moves);

  if (slideIsSolved(slideState.tiles)) {
    // win effect
    const tiles = slideBoard.querySelectorAll(".tile:not(.blank)");
    tiles.forEach((t) => t.classList.add("win"));
    if (slideState.timer) {
      clearInterval(slideState.timer);
      slideState.timer = null;
    }
  }
}

function neighbors(n, idx) {
  const r = Math.floor(idx / n);
  const c = idx % n;
  const list = [];
  if (r > 0) list.push(idx - n);
  if (r < n - 1) list.push(idx + n);
  if (c > 0) list.push(idx - 1);
  if (c < n - 1) list.push(idx + 1);
  return list;
}

function slideTryMove(idx) {
  const blankIdx = slideState.tiles.indexOf(0);
  if (blankIdx === -1) return;

  const can = neighbors(slideState.n, idx).includes(blankIdx);
  if (!can) return;

  slideStartTimerIfNeeded();

  // swap
  [slideState.tiles[idx], slideState.tiles[blankIdx]] = [
    slideState.tiles[blankIdx],
    slideState.tiles[idx],
  ];
  slideState.moves += 1;
  slideRender();
}

function slideShuffle() {
  slideState.n = Number(slideSizeSel.value);
  const total = slideState.n * slideState.n;
  slideState.tiles = [];
  for (let i = 1; i < total; i++) slideState.tiles.push(i);
  slideState.tiles.push(0);

  // “解ける”状態のまま崩すため、空白の近傍移動をランダムに何回も行う
  const steps = total * total * 12;
  for (let k = 0; k < steps; k++) {
    const blankIdx = slideState.tiles.indexOf(0);
    const ns = neighbors(slideState.n, blankIdx);
    const pick = ns[Math.floor(Math.random() * ns.length)];
    [slideState.tiles[pick], slideState.tiles[blankIdx]] = [
      slideState.tiles[blankIdx],
      slideState.tiles[pick],
    ];
  }

  slideState.moves = 0;
  slideResetTimer();
  slideRender();
}

slideShuffleBtn.addEventListener("click", slideShuffle);
slideSizeSel.addEventListener("change", slideShuffle);

// init
initMemory();
slideShuffle();
