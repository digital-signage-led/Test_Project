import { CONFIG } from "./config.js";
import {
  buildDemoWarnings,
  buildMarqueeText,
  fetchAreaNames,
  fetchWarningData,
  parseActiveWarnings,
} from "./warnings.js";

const $ = (id) => document.getElementById(id);

const els = {
  machine: $("machine"),
  marquee: $("marquee"),
  marqueeTextA: $("marqueeTextA"),
  marqueeTextB: $("marqueeTextB"),
  clockTime: $("clockTime"),
  cardArea: $("cardArea"),
  alertList: $("alertList"),
  cardUpdated: $("cardUpdated"),
  cardCount: $("cardCount"),
  cardLevelLabel: $("cardLevelLabel"),
  cardLevelPill: $("cardLevelPill"),
  cardLevelNum: $("cardLevelNum"),
  cardLevelUnit: $("cardLevelUnit"),
};

const params = new URLSearchParams(location.search);
const forceDemo = params.has(CONFIG.demoQuery) || params.get("mode") === "demo";
const forceLive = params.has("live") || params.get("mode") === "live";

/** @type {Map<string, string>} */
let areaNames = new Map();
/** @type {string} */
let lastSignature = "";
let marqueeRaf = 0;
let marqueeOffset = 0;
let marqueeLastTs = 0;
let marqueeWidth = 0;
let preferDemo = forceDemo && !forceLive;

/** @type {any[]} */
let cardItems = [];
let cardItemIndex = 0;
let cardAreaIndex = 0;
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
    .map((i) => `${i.code}:${i.status}:${i.areas.join(",")}`)
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
    setText(els.cardLevelLabel, "警戒レベル");
    setText(els.cardLevelPill, "なし");
    setText(els.cardLevelNum, "—");
    setText(els.cardLevelUnit, "発表なし");
    return;
  }
  const keikai = item.keikaiLevel;
  const hasKeikai = Number.isFinite(keikai) && keikai >= 2;
  setText(els.cardLevelLabel, hasKeikai ? "警戒レベル" : "種別");
  setText(els.cardLevelPill, item.category);
  setText(els.cardLevelNum, hasKeikai ? String(keikai) : "—");
  setText(els.cardLevelUnit, item.name);
  // 画面色は重要度、数字は公式の警戒レベルのみ
  const lv = alertLevelFromState(true, item.theme, item.level || 0);
  els.machine.dataset.level = String(lv);
  els.machine.dataset.theme = item.theme || "advisory";
}

function applyMetaCard(item, active) {
  tickClock();
  if (!active || !item) {
    setText(els.cardArea, CONFIG.areaLabel || "久米島");
    return;
  }
  const areas =
    Array.isArray(item.areas) && item.areas.length
      ? item.areas
      : [CONFIG.areaLabel || "久米島"];
  const raw = areas[cardAreaIndex % areas.length];
  setText(els.cardArea, raw.length > 5 ? `${raw.slice(0, 4)}…` : raw);
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
  cardAreaIndex = 0;
  if (cardItems.length === 0) return;
  cardRotateTimer = setInterval(() => {
    if (cardItems.length > 1) {
      cardItemIndex = (cardItemIndex + 1) % cardItems.length;
    }
    const item = cardItems[cardItemIndex];
    const areas = Array.isArray(item?.areas) ? item.areas : [];
    if (areas.length > 1) {
      cardAreaIndex = (cardAreaIndex + 1) % areas.length;
    } else {
      cardAreaIndex = 0;
    }
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

  if (!active) {
    stopMarquee();
    stopCardRotation();
    if (els.alertList) {
      els.alertList.innerHTML = `<span class="chip-empty">発表なし</span>`;
    }
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

  if (els.alertList) {
    els.alertList.innerHTML = state.items
      .map((item) => `<span class="chip is-${item.theme}">${item.name}</span>`)
      .join("");
  }

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

async function refresh({ demo = false, notifyOnChange = true } = {}) {
  try {
    let state;
    if (demo) {
      state = buildDemoWarnings();
    } else {
      const raw = await fetchWarningData(CONFIG.areaCode);
      state = parseActiveWarnings(raw, areaNames);
    }

    const sig = signatureOf(state.items);
    const changed = sig !== lastSignature;
    const becameActive =
      state.items.length > 0 && (lastSignature === "" || lastSignature === "idle");
    const newlyIssued = changed && state.items.some((i) => i.status === "発表");
    lastSignature = sig || "idle";

    render(state, {
      notify: notifyOnChange && (becameActive || newlyIssued || demo),
    });
  } catch (err) {
    console.error(err);
    if (preferDemo || demo) {
      render(buildDemoWarnings(), { notify: true });
      return;
    }
    if (els.alertList) {
      els.alertList.innerHTML = `<span class="chip-empty">取得エラー</span>`;
    }
    setText(els.cardUpdated, String(err.message || err));
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
  await refresh({ demo: preferDemo, notifyOnChange: true });
  setInterval(() => refresh({ demo: preferDemo }), CONFIG.pollIntervalMs);
}

boot();
