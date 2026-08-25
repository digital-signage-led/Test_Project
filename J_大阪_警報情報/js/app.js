import { CONFIG } from "./config.js";
import {
  buildDemoWarnings,
  buildMarqueeText,
  fetchAreaNames,
  fetchWarningData,
  mergeLiveAndDemo,
  parseActiveWarnings,
} from "./warnings.js";
import { evacForLevel } from "./warning-codes.js";

const $ = (id) => document.getElementById(id);

const els = {
  machine: $("machine"),
  marquee: $("marquee"),
  marqueeTextA: $("marqueeTextA"),
  marqueeTextB: $("marqueeTextB"),
  chipMarquee: $("chipMarquee"),
  alertList: $("alertList"),
  alertListB: $("alertListB"),
  clockTime: $("clockTime"),
  cardArea: $("cardArea"),
  cardUpdated: $("cardUpdated"),
  cardCount: $("cardCount"),
  cardLevelPill: $("cardLevelPill"),
  cardLevelNum: $("cardLevelNum"),
  cardLevelUnit: $("cardLevelUnit"),
};

const params = new URLSearchParams(location.search);
const forceDemo = params.has(CONFIG.demoQuery) || params.get("mode") === "demo";
const forceLive = params.has("live") || params.get("mode") === "live";
/** 既定: リアル＋デモ。?demo=1 はデモのみ、?live=1 はリアルのみ */
const mixMode = !forceDemo && !forceLive && CONFIG.mixLiveAndDemoByDefault;

/** @type {Map<string, string>} */
let areaNames = new Map();
/** @type {string} */
let lastSignature = "";
let marqueeRaf = 0;
let marqueeOffset = 0;
let marqueeLastTs = 0;
let marqueeWidth = 0;
let chipRaf = 0;
let chipOffset = 0;
let chipLastTs = 0;
let chipWidth = 0;

/** @type {any[]} */
let cardItems = [];
let cardItemIndex = 0;
let cardRotateTimer = 0;
let cardsAnimating = false;
let sideSwapped = false;

function marqueeSpeed() {
  const custom = Number(els.machine?.dataset.speed);
  return Number.isFinite(custom) && custom > 0 ? custom : CONFIG.marqueeSpeedPxPerSec;
}

function setText(el, text) {
  if (el) el.textContent = text;
}

function signatureOf(items) {
  return items
    .map((i) => `${i.code}:${i.status}:${i.source || ""}`)
    .sort()
    .join("|");
}

function formatTime(iso) {
  if (!iso) return "--:--";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "--:--";
  return d.toLocaleString("ja-JP", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function tickClock() {
  if (!els.clockTime) return;
  const now = new Date();
  els.clockTime.textContent = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
}

function waitMs(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function sideCards() {
  return [
    document.getElementById("sideCardLevel"),
    document.getElementById("sideCardMeta"),
  ].filter(Boolean);
}

function leftStage() {
  return document.querySelector(".face--left .card-stage");
}

function rightStage() {
  return document.querySelector(".face--right .card-stage");
}

function swapSideCardPositions() {
  const left = leftStage();
  const right = rightStage();
  const level = document.getElementById("sideCardLevel");
  const meta = document.getElementById("sideCardMeta");
  if (!left || !right || !level || !meta) return;

  sideSwapped = !sideSwapped;
  if (sideSwapped) {
    left.appendChild(meta);
    right.appendChild(level);
  } else {
    left.appendChild(level);
    right.appendChild(meta);
  }
}

async function animateSideCards(updateFn) {
  const cards = sideCards();
  if (!cards.length) {
    updateFn();
    return;
  }
  if (cardsAnimating) {
    updateFn();
    return;
  }
  cardsAnimating = true;
  for (const c of cards) {
    c.classList.remove("is-enter");
    c.classList.add("is-exit");
  }
  await waitMs(380);
  updateFn();
  for (const c of cards) {
    c.classList.remove("is-exit");
    void c.offsetWidth;
    c.classList.add("is-enter");
  }
  await waitMs(420);
  for (const c of cards) c.classList.remove("is-enter");
  cardsAnimating = false;
}

function alertLevelFromState(active, theme, level) {
  if (!active) return 1;
  if (theme === "special" || level >= 5) return 5;
  if (theme === "danger" || level >= 4) return 4;
  if (theme === "warning" || level >= 3) return 3;
  if (theme === "advisory" || level >= 2) return 2;
  return 1;
}

function applyLevelCard(item, active) {
  if (!active || !item) {
    setText(els.cardLevelPill, "なし");
    setText(els.cardLevelNum, "—");
    setText(els.cardLevelUnit, "発表なし");
    return;
  }
  const evac = evacForLevel(item.level || 1);
  setText(els.cardLevelPill, item.category);
  setText(els.cardLevelNum, item.level ? String(item.level) : "!");
  setText(els.cardLevelUnit, item.short || item.name);
  const lv = alertLevelFromState(true, item.theme, item.level || 0);
  els.machine.dataset.level = String(lv);
  els.machine.dataset.theme = item.theme || "advisory";
  els.machine.dataset.evac = evac.label;
}

function applyMetaCard(_item, _active) {
  tickClock();
  setText(els.cardArea, CONFIG.displayArea);
}

function applySidePair(item, active, { doSwap = false } = {}) {
  if (doSwap) swapSideCardPositions();
  applyLevelCard(item, active);
  applyMetaCard(item, active);
}

function stopCardRotation() {
  if (cardRotateTimer) clearInterval(cardRotateTimer);
  cardRotateTimer = 0;
}

function resetSidePositions() {
  const left = leftStage();
  const right = rightStage();
  const level = document.getElementById("sideCardLevel");
  const meta = document.getElementById("sideCardMeta");
  if (!left || !right || !level || !meta) return;
  left.appendChild(level);
  right.appendChild(meta);
  sideSwapped = false;
}

function startCardRotation(items) {
  stopCardRotation();
  cardItems = items || [];
  cardItemIndex = 0;
  if (cardItems.length === 0) return;
  cardRotateTimer = setInterval(() => {
    if (cardItems.length > 1) {
      cardItemIndex = (cardItemIndex + 1) % cardItems.length;
    }
    const item = cardItems[cardItemIndex];
    animateSideCards(() => {
      applySidePair(item, true, { doSwap: true });
    });
  }, 4500);
}

function stopMarquee() {
  if (marqueeRaf) cancelAnimationFrame(marqueeRaf);
  marqueeRaf = 0;
  marqueeOffset = 0;
  marqueeLastTs = 0;
  if (els.marquee) els.marquee.style.transform = "translateX(0)";
}

function startMarquee() {
  stopMarquee();
  if (!els.marquee || !els.marqueeTextA) return;
  marqueeWidth = els.marqueeTextA.getBoundingClientRect().width;
  if (marqueeWidth < 8) return;

  const speed = marqueeSpeed();
  const tick = (ts) => {
    if (!marqueeLastTs) marqueeLastTs = ts;
    const dt = (ts - marqueeLastTs) / 1000;
    marqueeLastTs = ts;
    marqueeOffset -= speed * dt;
    if (marqueeOffset <= -marqueeWidth) marqueeOffset += marqueeWidth;
    els.marquee.style.transform = `translateX(${marqueeOffset}px)`;
    marqueeRaf = requestAnimationFrame(tick);
  };
  marqueeRaf = requestAnimationFrame(tick);
}

function stopChipTicker() {
  if (chipRaf) cancelAnimationFrame(chipRaf);
  chipRaf = 0;
  chipOffset = 0;
  chipLastTs = 0;
  if (els.chipMarquee) els.chipMarquee.style.transform = "translateX(0)";
}

/** 発表中チップのみを夜のニュースティッカーとして流す */
function renderChipTicker(items) {
  const announced = (items || []).filter((item) => item && item.name);
  if (!els.alertList) return;

  if (!announced.length) {
    stopChipTicker();
    els.alertList.innerHTML = `<span class="chip-empty">発表なし</span>`;
    if (els.alertListB) els.alertListB.innerHTML = "";
    return;
  }

  const html = announced
    .map((item) => `<span class="chip is-${item.theme || "advisory"}">${item.name}</span>`)
    .join("");
  els.alertList.innerHTML = html;
  if (els.alertListB) els.alertListB.innerHTML = html;

  requestAnimationFrame(() => {
    requestAnimationFrame(() => startChipTicker());
  });
}

function startChipTicker() {
  stopChipTicker();
  if (!els.chipMarquee || !els.alertList) return;
  chipWidth = els.alertList.getBoundingClientRect().width;
  if (chipWidth < 8) return;

  const speed = Math.max(36, marqueeSpeed() * 0.55);
  const tick = (ts) => {
    if (!chipLastTs) chipLastTs = ts;
    const dt = (ts - chipLastTs) / 1000;
    chipLastTs = ts;
    chipOffset -= speed * dt;
    if (chipOffset <= -chipWidth) chipOffset += chipWidth;
    els.chipMarquee.style.transform = `translateX(${chipOffset}px)`;
    chipRaf = requestAnimationFrame(tick);
  };
  chipRaf = requestAnimationFrame(tick);
}

function flashNotify() {
  if (!els.machine) return;
  els.machine.classList.remove("is-notifying");
  void els.machine.offsetWidth;
  els.machine.classList.add("is-notifying");
}

function render(state, opts = {}) {
  const active = state.items.length > 0;
  const top = state.items[0];
  const theme = top?.theme || "advisory";
  const maxLevel = top?.level || 0;

  els.machine.dataset.active = active ? "true" : "false";
  els.machine.dataset.theme = theme;
  els.machine.dataset.level = String(alertLevelFromState(active, theme, maxLevel));

  setText(els.cardUpdated, `更新 ${formatTime(state.reportDatetime)}`);
  setText(els.cardCount, `${state.items.length}件`);
  setText(els.cardArea, CONFIG.displayArea);

  if (!active) {
    stopMarquee();
    stopChipTicker();
    stopCardRotation();
    renderChipTicker([]);
    const idle =
      "現在、発表中の警報・注意報はありません　　気象情報をご確認ください　　";
    if (els.marqueeTextA) els.marqueeTextA.innerHTML = idle;
    if (els.marqueeTextB) els.marqueeTextB.innerHTML = idle;
    requestAnimationFrame(() => {
      requestAnimationFrame(() => startMarquee());
    });
    animateSideCards(() => {
      resetSidePositions();
      applySidePair(null, false, { doSwap: false });
    });
    if (opts.notify) flashNotify();
    return;
  }

  const text = buildMarqueeText(state);
  if (els.marqueeTextA) els.marqueeTextA.innerHTML = text;
  if (els.marqueeTextB) els.marqueeTextB.innerHTML = text;

  renderChipTicker(state.items);

  animateSideCards(() => {
    resetSidePositions();
    applySidePair(top, true, { doSwap: false });
  });
  startCardRotation(state.items);

  requestAnimationFrame(() => {
    requestAnimationFrame(() => startMarquee());
  });

  if (opts.notify) flashNotify();
}

async function loadLiveState() {
  const raw = await fetchWarningData(CONFIG.areaCode);
  return parseActiveWarnings(raw, areaNames);
}

async function refresh({ notifyOnChange = true } = {}) {
  try {
    let state;
    if (forceDemo && !forceLive) {
      state = buildDemoWarnings();
      state.items = state.items.map((item) => ({
        ...item,
        areas: [CONFIG.displayArea],
      }));
    } else if (forceLive) {
      state = await loadLiveState();
      state.items = state.items.map((item) => ({
        ...item,
        areas: [CONFIG.displayArea],
      }));
    } else {
      const demo = buildDemoWarnings();
      let live = { items: [], headline: "", reportDatetime: "", publishingOffice: "" };
      try {
        live = await loadLiveState();
      } catch (err) {
        console.warn("ライブ取得失敗、デモのみで継続", err);
      }
      state = mergeLiveAndDemo(live, demo);
    }

    const sig = signatureOf(state.items);
    const changed = sig !== lastSignature;
    const becameActive =
      state.items.length > 0 && (lastSignature === "" || lastSignature === "idle");
    const newlyIssued = changed && state.items.some((i) => i.status === "発表");
    lastSignature = sig || "idle";

    render(state, {
      notify: notifyOnChange && (becameActive || newlyIssued || mixMode || forceDemo),
    });
  } catch (err) {
    console.error(err);
    const fallback = buildDemoWarnings();
    fallback.items = fallback.items.map((item) => ({
      ...item,
      areas: [CONFIG.displayArea],
    }));
    render(fallback, { notify: true });
  }
}

async function boot() {
  try {
    areaNames = await fetchAreaNames();
  } catch {
    areaNames = new Map();
  }
  tickClock();
  setInterval(tickClock, 1000);
  await refresh({ notifyOnChange: true });
  setInterval(() => refresh({ notifyOnChange: false }), CONFIG.pollIntervalMs);
}

boot();
